import { child, get, getDatabase, onValue, ref } from 'firebase/database';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import MapD from '../../components/MapD';
import compareDate from '../../utils/compare_date';
import { getUniqueListBy } from '../../utils/function';
import Toast from '../../utils/toasts';
import ControlPanelMap from '../../components/ControlPanelMap';

import Loading from '../../components/Loading';
import { Grid } from '@mui/material';
import MapStatusStation from './MapStatusStation';
import { TIME_DEVICE_OFF } from '../../constants';


function MyMapV1() {
    const dataRealTime = useRef([]);
    const [dataChange, setDataChange] = useState(false);

    const deviceUser = localStorage.getItem('device_user');
    const listDevice = JSON.parse(deviceUser);

    const db = ref(getDatabase());

    let devices = [];

    if (listDevice) {
        const id = Object.keys(listDevice);
        id.forEach((v) => {
            devices.push({
                id: v,
                full_name: listDevice[v]['FullName'],
            });
        });
    }


    // get data
    useEffect(() => {
        devices.map((v) => {
            get(child(db, `Devices/DAIVIET-RS485/${v.id}`)).then((snapshot) => {
                let { RS485Data, Location, LastTime } = snapshot.val();
                let tmpRS485Data = RS485Data.filter(item => (item.MemoryType === 1 && !item.IsColumn ) || (item.MemoryType === 0 && item.CoilValue === true && item.IsHighAlarm === true));
                let isError =  (RS485Data.filter(item =>(item.MemoryType === 0 && item.CoilValue === true && item.IsHighAlarm === true))).length > 0 ;
                Location = v.id;
                let lastTime = moment(LastTime.slice(0, -1)).format('HH:mm DD/MM/YYYY');
                let timeC = moment(LastTime.slice(0, -1)).format('HH:mm');
                let timeP = moment(Date()).subtract(TIME_DEVICE_OFF, 'minutes').format('HH:mm');

                let dateC = moment(LastTime.slice(0, -1)).format('MM/DD/YYYY');
                let dateP = moment(Date()).format('MM/DD/YYYY');

                let compare = compareDate(dateC, dateP);
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
                    full_name: v.full_name,
                    status_station:timeDifference < 60 ?  (isError ? `OFF*${'2'}` : `ON*${'0'}`) : `OFF*${'NOOK'}`,
                });
                setDataChange({
                    last_time: LastTime,
                });
            });
        });
    }, []);

    //==============================================================================

    // handle data get
    let arr = useRef();
    let stateDevice = useRef();
    let rows;
    // get(child(db, `Devices/DAIVIET-RS485/${stationId}`));
    let dataSensor = [];

    if (dataChange) {

        arr.current = getUniqueListBy(dataRealTime.current, 'location');
        let data = [];
        arr.current.map((v, index) => {
            let s = v.status_station.split('*')[1];
            let c = v.data_sensor.forEach((v2) => {
                if( v.id_station=== "CM_TTQT_NUOLTT") {
                    
                }
             
                // console.log(s);
                let stateStation = typeof v2.StateNum === 'undefined' ? 0 : v2.StateNum;

                let b = '';
                let a = v2.Name;

                if (s === 'NOOK') {
                    b = 'STATION_OFF';
                    // b = {
                    //     status: 'OFF',
                    //     sensor: a,
                    // };
                 //   b = `ERROR`;
                } else {
                    if (stateStation == 0) {
                        // b = {
                        //     status: 'NORMAL',
                        //     sensor: a,
                        // };
                        b = `NORMAL`;
                    } else if (stateStation == 1) {
                        // b = {
                        //     status: 'CALIB',
                        //     sensor: a,
                        // };
                        b = `CALIB`;
                    } else if (stateStation == 2) {
                        // b = {
                        //     status: 'ERROR',
                        //     sensor: a,
                        // };
                        b = `ERROR`;
                    }
                }
                // console.log({ b, a });
                let obj = { state: b, full_name: v.full_name, id: v.id_station,name:v2.Name, unit:v2.Unit,value:v2.Value,stateNum:v2.StateNum,lastTime: v.last_time};
                // console.log({ obj });
                // return obj;
                dataSensor.push(obj);
                // return obj;
            });
            // console.log({ c });
            // console.log({ data });
            // return c;
        });
    }

    //==============================================================================

    let output = [];
    if (dataSensor.length) {
        const handleObjectSameKeyInArr = (arr) => {
            console.log({ arr });
            
            arr.forEach(function (item) {
                var existing = output.filter(function (v, i) {
                    return v.full_name == item.full_name;
                });
                
                let sensorInfo = {
                    name:item.name,
                    value:item.value,
                    unit:item.unit,
                    stateNum:item.stateNum,
                    lastTime:item.lastTime,
                    id:item.id,
                }
                if (existing.length) {
                    var existingIndex = output.indexOf(existing[0]);
                    output[existingIndex].state = output[existingIndex].state.concat(item.state);
                    output[existingIndex].sensor = output[existingIndex].sensor.concat(sensorInfo); 
                    output[existingIndex].lastTime=  item.lastTime; 
                    output[existingIndex].id=  item.id; 
                    
                } else {
                    let arr = [];
                    // let b = arr.push(item.state);
                    if (typeof item.state == 'string') {
                        item.state = [item.state];
                        item.sensor = [sensorInfo];
                        item.lastTime= item.lastTime;
                    }
                    
                    output.push(item);
                }
                
            });
        };

        handleObjectSameKeyInArr(dataSensor);
    }
    // console.log({ output });
    // console.log({ dataSensor });
    let dataCoordinates = [];
    if (output.length) {
       
        output.map((v) => {
            let error = v.state.includes('ERROR');
            let calib = v.state.includes('CALIB');
            let normal = v.state.includes('NORMAL');
            let off = v.state.includes('STATION_OFF');
            let state = error ? 'ERROR' : calib ? 'CALIB' : normal ? 'NORMAL' : 'OFF';
            dataCoordinates.push({
                isHide:true,
                state: state,
                name: v.full_name,
                id:v.id,
                lastTime: v.lastTime,
                sensor:v.sensor,
                latitude: listDevice[v.id]['latitude'],
                longitude: listDevice[v.id]['longitude'],
            });
            
        });
    }
    // console.log({ dataCoordinates });

    const styleForCard = (value) => {
        let stateSensor = value.split('*')[1];
        let statusStation = value.split('*')[2];

        if (statusStation === 'STATION_OFF') {
            return 'off';
        } else if (stateSensor === '1') {
            return 'calib';
        } else if (stateSensor === '2') {
            return 'error';
        } else if (stateSensor === '0') {
            return 'normal';
        } else {
            return 'off';
        }
    };

    useEffect(() => {
        Toast('success', 'Nhấp vào vị trí trạm để xem thêm thông tin');
    }, []);

    return (
        <>
            {dataCoordinates.length ? (
                <Grid container>
                    <Grid item  xs={9.5}>

                        <MapD data={dataCoordinates} />
                    </Grid>
                    <Grid item xs={2.5} >

                        <MapStatusStation dataCoordinates={dataCoordinates}  />
                    </Grid>
                    
                </Grid>
            ) : (
                
                <Loading />
            )}
        </>
    );
}
export default MyMapV1;
