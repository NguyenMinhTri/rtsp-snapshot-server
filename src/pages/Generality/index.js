import React, { useEffect, useState, useRef } from "react";
import CardStationStatus from "./components/CardStationStatus";
import { Box, Grid } from "@mui/material";
import SubHeader from "../../components/SubHeader";
import StatusPercent from "./components/StatusPercent";
import ColumnStatus from "./components/ColumnStatus";
import { stationStatus } from "./components/CardStationStatus/stationStatus";

import { getDatabase, onValue, ref } from "firebase/database";
import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    collection,
} from "firebase/firestore";

import { dbStore } from "../../config/firebase";
import compareDate from "../../utils/compare_date";
import { getUniqueListBy } from "../../utils/function";

import moment from "moment";
import { handleDataStatusByType } from "./components/StatusPercent/utils/handleDataMainByType";
import CardStatus from "./components/CardStationStatus";
import {handleDataMainForTable}  from '../../utils/handleDataMainForTable'
import { TIME_DEVICE_OFF } from "../../constants";
function Generality() {
    const [dataChange, setDataChange] = useState(false);
    const [menuValue, setMenuSelect] = useState([]);
    const [totalDeviceType, setTotalDeviceType] = useState();
    let allSettingData = {};
    // handle data realtime
    const db = getDatabase();
    const dataRealTime = useRef([]);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);

    let devices = [];
    useEffect(() => {
        if (listDevice) {
            const id = Object.keys(listDevice);
            let totalType = new Set();
            id.map((v) => {
                devices.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                    type: listDevice[v]["DeviceType"],
                });
                totalType.add(listDevice[v]["DeviceType"]);
            });
            setTotalDeviceType([...totalType]);
        }
        setMenuSelect(devices);
    }, []);

    useEffect(() => {
        devices.map((v) => {
            return onValue(
                ref(db, `Devices/DAIVIET-RS485/${v.id}`),
                async (snapshot) => {
                    let { RS485Data, Location, LastTime } = snapshot.val();

                    RS485Data = RS485Data.filter(
                        (item) => item.MemoryType === 1 && !item.IsColumn
                    );
                    Location = v.id;
                    let lastTime = moment(LastTime.slice(0, -1)).format(
                        "HH:mm DD/MM/YYYY"
                    );
                    let timeC = moment(LastTime.slice(0, -1)).format("HH:mm");
                    let timeP = moment(Date())
                        .subtract(TIME_DEVICE_OFF, "minutes")
                        .format("HH:mm");
                    let dateC = moment(LastTime.slice(0, -1)).format(
                        "MM/DD/YYYY"
                    );
                    let dateP = moment(Date()).format("MM/DD/YYYY");
                    let compare = compareDate(dateC, dateP);
                    if (typeof allSettingData[v.id] === "undefined") {
                        allSettingData[v.id] = {};
                        for (var i = 0; i < RS485Data.length; i++) {
                            let sensorItem = RS485Data[i];
                            allSettingData[v.id][sensorItem.GroupName] =
                                sensorItem.GroupName;
                        }
                        // console.log(allSettingData[v.id]);
                        //
                        for (let groupName in allSettingData[v.id]) {
                            // console.log(groupName);
                            const querySnapshot = await getDocs(
                                collection(
                                    dbStore,
                                    `SensorSettings/${Location}/${groupName}`
                                )
                            );
                            allSettingData[v.id][groupName] = querySnapshot;
                        }
                    }
                    for (let i = 0; i < RS485Data.length; i++) {
                        let sensorItem = RS485Data[i];
                        sensorItem.AlarmSetting = {};
                        for (let groupName in allSettingData[v.id]) {
                            allSettingData[v.id][groupName].forEach((doc) => {
                                if (doc.id === sensorItem.Name) {
                                    const dataSetting = doc.data();
                                    sensorItem.AlarmSetting = dataSetting;
                                }
                                // console.log(doc.id, " => ", doc.data());
                            });
                        }
                    }

                    dataRealTime.current.push({
                        id_station: v.id,
                        data_sensor: RS485Data,
                        deviceType: v.type,
                        location: Location,
                        last_time: lastTime,
                        full_name: v.label,
                        status_station:
                            typeof snapshot.val().IsSendingAlarm !==
                                "undefined" &&
                            snapshot.val().IsSendingAlarm === true
                            
                                ? `OFF*${"NOOK"}`
                                : ((timeC < timeP || compare === 1)) ? `OFF*${"NOOK"}`: `ON*${"0"}`,
                    });
                    setDataChange({
                        last_time: LastTime,
                    });
                }
            );
        });
    }, []);

    let arr = useRef();
    let rows;
    if (dataChange) {
        arr.current = getUniqueListBy(dataRealTime.current, "location");
        rows = handleDataMainForTable(arr.current);
    }

    return (
        <Box sx={{ padding: "10px" }}>
            <Box sx={{ paddingBottom: "15px" }}>
                <SubHeader text={"THỐNG KÊ TỔNG HỢP"} />
                <CardStatus
                    totalDeviceType={totalDeviceType}
                    data={arr.current}
                    dataSensor={rows}
                />
            </Box>

            <Box>
                <SubHeader text={"TRẠNG THÁI CÁC TRẠM"} />
                <StatusPercent data={arr.current} dataSensor={rows} />
            </Box>
            
            <Box sx={{ paddingTop: "15px" }}>
                <SubHeader text={"PHẨN BỔ CÁC TRẠM"} />
                <ColumnStatus />
            </Box>
        </Box>
    );
}

export default Generality;
