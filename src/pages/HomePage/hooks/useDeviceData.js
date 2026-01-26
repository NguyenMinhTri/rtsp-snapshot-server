import { useState, useEffect, useCallback, useRef } from "react";
import { getDatabase, onValue, ref } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { dbStore } from "../../../config/firebase";
import moment from "moment";
import { TIME_DEVICE_OFF } from "../../../constants";

import compareDate from "../../../utils/compare_date";

export const useDeviceData = (valueSelect, listDevice) => {
  const [fullRS485Data, setFullRS485Data] = useState(undefined);
  const [deviceType, setDeviceType] = useState(0);
  const [IsDemoUI, setIsDemoUI] = useState(false);
  const [isDeviceOffline, setIsDeviceOffline] = useState(false);
  const [lastimeActive, setLastimeActive] = useState("");
  const [listSensor, setListSensor] = useState([]);
  const [listSensorForChart, setListSensorForChart] = useState([]);
  const [isShowColChart, setIsShowColChart] = useState(false);
  const dataRealTimeRef = useRef([]);

  const unsubscribeRef = useRef(null);

  // Process sensor settings from Firestore
  const processSensorSettings = useCallback(async (RS485Data, Location, newData) => {
    const groupNameArray = {};

    // Group sensors by GroupName
    RS485Data.forEach(sensor => {
      groupNameArray[sensor.GroupName] = sensor.GroupName;
    });

    // Fetch settings for each group
    for (const groupName in groupNameArray) {
      try {
        const querySnapshot = await getDocs(
          collection(dbStore, `SensorSettings/${Location}/${groupName}`)
        );
        groupNameArray[groupName] = querySnapshot;
      } catch (error) {
        console.error(`Error fetching settings for ${groupName}:`, error);
      }
    }

    // Apply settings to sensors
    RS485Data.forEach(sensorItem => {
      sensorItem.AlarmSetting = {};

      for (const groupName in groupNameArray) {
        groupNameArray[groupName].forEach(doc => {
          if (doc.id === sensorItem.Name) {
            const dataSetting = doc.data();
            sensorItem.AlarmSetting = dataSetting;

            // Check alarm coils
            const isNotZero = dataSetting.HighAlarmSetting === 0 && dataSetting.LowAlarmSetting === 0;

            const coilLow = newData.RS485Data?.filter(item =>
              item.Name?.toLowerCase().includes(sensorItem.Name.toLowerCase()) &&
              item.Name?.toLowerCase().includes("low") &&
              item.Type === "bool"
            );

            if (coilLow && coilLow.length > 0) {
              sensorItem.AlarmSetting.IsSendLowAlarm = isNotZero ? false : coilLow[0].CoilValue;
            }

            const coilHigh = newData.RS485Data?.filter(item =>
              item.Name?.toLowerCase().includes(sensorItem.Name.toLowerCase()) &&
              item.Name?.toLowerCase().includes("high") &&
              item.Type === "bool"
            );

            if (coilHigh && coilHigh.length > 0) {
              sensorItem.AlarmSetting.IsSendHighAlarm = isNotZero ? false : coilHigh[0].CoilValue;
            }
          }
        });
      }
    });

    return RS485Data;
  }, []);

  // Main data subscription
  useEffect(() => {
    if (!valueSelect?.id) return;

    const db = getDatabase();

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const deviceRef = ref(db, `Devices/DAIVIET-RS485/${valueSelect.id}`);

    unsubscribeRef.current = onValue(deviceRef, async (snapshot) => {
      const newData = snapshot.val();
      if (!newData) return;

      try {
        // Process device data
        newData.Id = valueSelect.id;

        let { RS485Data = [], Location, LastTime, Ip, DeviceType, IsDemoUI: isDemoUI } = newData;

        // Set device metadata
        setDeviceType(DeviceType || 0);
        setIsDemoUI(isDemoUI || false);
        setLastimeActive(LastTime || "");

        if (Ip) {
          localStorage.setItem("ip_camera", Ip);
        }

        // Check device offline status
        const timeC = moment(LastTime?.slice(0, -1)).format("YYYY/MM/DD HH:mm");
        const timeP = moment(Date()).subtract(TIME_DEVICE_OFF, "minutes").format("YYYY/MM/DD HH:mm");
        const dateC = moment(LastTime?.slice(0, -1)).format("MM/DD/YYYY");
        const dateP = moment(Date()).format("MM/DD/YYYY");
        const compare = compareDate(dateC, dateP);

        const isOffline = newData.IsSendingAlarm || (moment(timeC).isBefore(timeP) && !newData.IsSendingAlarm) || compare === 1;

        setIsDeviceOffline(isOffline);

        // Separate sensors and coils
        const sensors = RS485Data.filter(item => item.MemoryType === 1);
        const coils = RS485Data.filter(item => item.MemoryType === 0);

        // Process column chart sensors
        const columnSensors = sensors.filter(
          item => item.IsColumn || item.Unit?.toLowerCase().includes("kwh")
        );
        setIsShowColChart(columnSensors.length > 0);

        // Filter out time-based sensors
        const filteredSensors = sensors.filter(
          item => !item.Unit || item.Unit.toLowerCase() !== "h"
        );

        // Get sensor names
        const sensorNames = filteredSensors.map(v => v.Name);
        setListSensor(sensorNames);

        // Get sensor names for ChartTab (exclude sensors shown in ColumnChart)
        const sensorNamesForChart = filteredSensors
          .filter(item => !item.IsColumn && !(item.Unit?.toLowerCase().includes("kwh")))
          .map(v => v.Name);
        setListSensorForChart(sensorNamesForChart);

        // Process sensor settings
        const processedSensors = await processSensorSettings(filteredSensors, Location || valueSelect.id, newData);

        // Determine status
        const statusStation = isOffline ? "OFF*NOOK" : "ON*0";

        // Update realtime data ref
        dataRealTimeRef.current = [{
          id_station: valueSelect.id,
          data_sensor: processedSensors,
          coil_data: coils,
          location: Location || valueSelect.id,
          last_time: moment(LastTime?.slice(0, -1)).format("YYYY/MM/DD HH:mm"),
          full_name: listDevice?.[valueSelect.id]?.["FullName"] || "",
          status_station: statusStation,
        }];

        // Update full data
        setFullRS485Data({ ...newData });

      } catch (error) {
        console.error("Error processing device data:", error);
      }
    });

    // Cleanup on unmount or valueSelect change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [valueSelect?.id, listDevice, processSensorSettings]);

  return {
    fullRS485Data,
    deviceType,
    IsDemoUI,
    isDeviceOffline,
    lastimeActive,
    listSensor,
    listSensorForChart,
    isShowColChart,
    dataRealTime: dataRealTimeRef.current,
  };
};
