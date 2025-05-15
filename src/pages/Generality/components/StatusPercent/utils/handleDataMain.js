export const handleDataMainStatus = (data, dataSensor) => {
    const totalStation = data?.length || 0;

    let listStationOff = [];
    let listStationActive = [];
    let listStationCalif = [];
    let listStationError = [];
    let listStationNormal = [];
    let listStationOver = [];


    let listTotalStation = [];

    let listStatus = [];

    if (data?.length && data.length > 0) {
        for (let item of data) {
            listTotalStation.push(item.full_name);
            const status = item.status_station?.split("*")[0];
            const statusSensor = item.status_station?.split("*")[1];
            const deviceType = item.deviceType
            
            if (status == "ON" && statusSensor != '5') {
    
                listStationActive.push({
                    station: item.full_name,
                    status: "active",
                    deviceType
                });
            } else if (status == "OFF") {
         
                listStationOff.push({ station: item.full_name, status: "off",deviceType });
            }
        }
    }

    if (dataSensor?.length && dataSensor.length > 0) {
        for (let sensor of dataSensor) {
            for (let name in sensor) {
                
                const checkStatusSensor = sensor[name].split("*")[1];
                const checkStatusStation = sensor[name].split("*")[2];
                const deviceType =  sensor.deviceType
                
                const statusText = {
                    1: "calif",
                    2: "error",
                    0: "active",
                    5 : "over"
                };

                if (checkStatusStation !== "STATION_OFF") {
                    if (checkStatusSensor == "1") {
                        listStatus.push({
                            station: sensor["station"],
                            status: statusText[checkStatusSensor],
                            sensor: name,
                            deviceType
                        });
                    } else if (checkStatusSensor == "2") {
                        listStatus.push({
                            station: sensor["station"],
                            status: statusText[checkStatusSensor],
                            sensor: name,
                            deviceType
                        });
                    }else if(checkStatusSensor == "5") {
                        listStatus.push({
                            station: sensor["station"],
                            status: statusText[checkStatusSensor],
                            sensor: name,
                            deviceType
                        });
                    }
                }
            }
        }
    }

    const totalOff = listStationOff?.length || 0;
    const totalActive = listStationActive?.length || 0;

    const handleData = (data) => {
        const stationData = new Map();
        data.forEach((item) => {
            const { station, status, sensor, deviceType } = item;

            if (!stationData.has(station)) {
                stationData.set(station, {
                    name: station,
                    deviceType,
                    error: [],
                    calif: [],
                    over : []
                });
            }

            if (status === "error") {
                stationData.get(station).error.push(sensor);
            } else if (status === "calif") {
                stationData.get(station).calif.push(sensor);
            }else if (status === "over") {
                stationData.get(station).over.push(sensor);
            } 
        });

        return Array.from(stationData.values());
    };

    const checkStatusErrCalifOver = handleData(listStatus);
    for (let item of checkStatusErrCalifOver) {
        let checkValid = item.error.length > 0 || item.calif.length > 0
        const deviceType = item.deviceType

        // nếu trạm có error hoặc calif thì sẽ không check vượt ngưỡng 
        // error >= calif ? error  : calif
        // nếu không có cả calif và error => nếu có  over (vượt ngưỡng) thì cho over 

        if(checkValid) {
            if (item.error.length >= item.calif.length ) {
                listStationError.push({ station: item.name, deviceType, status: "error" });
            } else if (item.error.length < item.calif.length ) {
                listStationCalif.push({ station: item.name, deviceType, status: "calif" });
            }
        }else {
            if(item.over) {
                listStationOver.push({ station: item.name, deviceType, status: "over" })
            }
        }

        
    }


    let totalError = listStationError?.length || 0;
    let totalCalif = listStationCalif?.length || 0;
    let totalOver = listStationOver?.length || 0;


    let totalNormal = +totalActive - Math.abs(totalError + totalCalif + totalOver ) || 0;

    const mergeArray = [...listStationError, ...listStationCalif, ...listStationOver];

    listStationNormal = listStationActive.filter(
        ({ station: id1 }) =>
            !mergeArray.some(({ station: id2 }) => id2 === id1)
    );

    let totalListStatus = [
        ...listStationOff,
        ...listStationCalif,
        ...listStationError,
        ...listStationNormal,
        ...listStationOver,
    ];  




    return {
        totalListStatus,
        totalOff,
        totalActive,
        totalNormal,
        totalError,
        totalCalif,
        totalStation,
        totalOver
    };
};
