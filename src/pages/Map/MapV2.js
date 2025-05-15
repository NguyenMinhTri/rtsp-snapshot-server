import { child, get, getDatabase, onValue, ref } from "firebase/database";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import MapD from "../../components/MapD";
import compareDate from "../../utils/compare_date";
import { getUniqueListBy } from "../../utils/function";
import Toast from "../../utils/toasts";
import ControlPanelMap from "../../components/ControlPanelMap";

import Loading from "../../components/Loading";
import { Grid } from "@mui/material";
import MapStatusStation from "./MapStatusStation";
import { collection, getDocs } from "firebase/firestore";
import { dbStore } from "../../config/firebase";
import { handleGetSettingThreshold } from "../../utils/handleGetSettingThreshold";
import { handleDataMainStatus } from "../Generality/components/StatusPercent/utils/handleDataMain";
import { handleDataMainForTable } from "../../utils/handleDataMainForTable";
import { TIME_DEVICE_OFF } from "../../constants";


function MyMapV2() {
    const [dataChange, setDataChange] = useState(false);
    const [menuValue, setMenuSelect] = useState([]);
    let allSettingData = {};
    // handle data realtime
    const db = getDatabase();
    const dataRealTime = useRef([]);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);
    const searchParams = new URLSearchParams(window.location.search);
    const deviceId = searchParams.get("deviceId");
  
    let devices = [];
    useEffect(() => {
        if (listDevice) {
            const id = Object.keys(listDevice);
            id.map((v) => {
                devices.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                    type : listDevice[v]["DeviceType"]
                });
            });
        }
        setMenuSelect(devices);
    }, []);

    // get data

    useEffect(() => {
        devices.map((v) => {
            return onValue(
                ref(db, `Devices/DAIVIET-RS485/${v.id}`),
                async (snapshot) => {
                    try
                    {
                    let { RS485Data, Location, LastTime } = snapshot.val();
            
                    
                    let tmpRS485Data = RS485Data.filter(item => (item.MemoryType === 1 && !item.IsColumn ) || (item.MemoryType === 0 && item.CoilValue === true && item.IsHighAlarm === true));
                    let isError =  (RS485Data.filter(item =>(item.MemoryType === 0 && item.CoilValue === true && item.IsHighAlarm === true))).length > 0 ;
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
                    console.log("IsSendingAlarm: "+ snapshot.val().IsSendingAlarm );
                                        // Thời điểm cần so sánh
                    const targetTime = new Date(LastTime.split("Z")[0]);

                    // Thời điểm hiện tại
                    const currentTime = new Date();

                    // Tính khoảng thời gian cách nhau bao nhiêu phút
                    const timeDifference = (currentTime - targetTime) / (1000 * 60);
                    dataRealTime.current.push({
                        id_station: v.id,
                        data_sensor: tmpRS485Data,
                        location: Location,
                        last_time: lastTime,
                        full_name: v.label,
                        deviceType: v.type,
                        status_station:timeDifference < 60 ?  (isError ? `ON*${'2'}` : `ON*${'0'}`) : `OFF*${'NOOK'}`,
                    });
                    setDataChange({
                        last_time: LastTime,
                    });
                }
            catch(e){
                console.log("Lỗi mapv2", v.id);
            }
        }
            )  ;    
        });
    }, []);
   
    //==============================================================================

    // handle data get
    let arr = useRef();
    let rows;
    let dataSensor = [];
    let dataCoordinates = [];


    if (dataChange) {
        arr.current = getUniqueListBy(dataRealTime.current, "location");
        rows = handleDataMainForTable(arr.current);
        
        const { totalListStatus } = handleDataMainStatus(arr.current, rows);
        let state = ""
        let sensor = null
        for(let v of arr.current) { 

        
            for(let item of totalListStatus) {
                if(item.station == v.full_name ) {
                    state = item.status
                }
            }
            for(let item of rows) {
                if(item.id_station == v.id_station) {
                    sensor = item
                }
            }

        dataCoordinates.push({
            state:state,
            name: v.full_name,
            id: v.id_station,
            lastTime: v.last_time,
            sensor: sensor,
            latitude: listDevice[v.id_station]["latitude"],
            longitude: listDevice[v.id_station]["longitude"],
        });

        }
        
    }



    return (
        <>
            {dataCoordinates.length ? (
                <Grid container>
                    <Grid item xs={12} md={9} xl={9.5} lg={9.5} sm={8}>
                        <MapD data={dataCoordinates} deviceId={deviceId}/>
                    </Grid>
                    <Grid item xs={12} md={3} xl={2.5} lg={2.5} sm={4}>
                        <MapStatusStation
                            dataCoordinates={dataCoordinates}
                            dataArray={arr.current}
                            dataSensor={rows}
                        />
                    </Grid>
                </Grid>
            ) : (
                <Loading />
            )}
        </>
    );
}
export default MyMapV2;
