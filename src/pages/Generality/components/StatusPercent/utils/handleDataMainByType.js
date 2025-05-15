
export const handleDataStatusByType = (data, dataSensor, type = "IoT") => {
    let listStationTypeOff = [];
    let listStationTypeActive = [];

    let listStationTypeCalif = [];
    let listStationTypeError = [];
    let listStationTypeNormal = [];
    let listStationTypeOver = [];

    let listStatus = [];

    let listStationByType = [];

    if (data?.length && data.length > 0) {
        for (let item of data) {
            const status = item.status_station?.split("*")[0];
            const statusSensor = item.status_station?.split("*")[1];
            const typeDevice = item.deviceType;
            if (typeDevice == type) {
                listStationByType.push(item.full_name);
                if (status == "ON" && statusSensor != "5") {
                    listStationTypeActive.push({
                        station: item.full_name,
                        status: "active",
                    });
                } else if (status == "OFF") {
                    listStationTypeOff.push({
                        station: item.full_name,
                        status: "off",
                    });
                }
            }
        }
    }

    if (dataSensor?.length && dataSensor.length > 0) {
        for (let sensor of dataSensor) {
            if (sensor.deviceType == type) {
                for (let name in sensor) {
                    const checkStatusSensor = sensor[name].split("*")[1];
                    const checkStatusStation = sensor[name].split("*")[2];

                    const statusText = {
                        1: "calif",
                        2: "error",
                        0: "active",
                        5: "over",
                    };

                    if (checkStatusStation !== "STATION_OFF") {
                        if (checkStatusSensor == "1") {
                            listStatus.push({
                                station: sensor["station"],
                                status: statusText[checkStatusSensor],
                                sensor: name,
                            });
                        } else if (checkStatusSensor == "2") {
                            listStatus.push({
                                station: sensor["station"],
                                status: statusText[checkStatusSensor],
                                sensor: name,
                            });
                        } else if (checkStatusSensor == "5") {
                            listStatus.push({
                                station: sensor["station"],
                                status: statusText[checkStatusSensor],
                                sensor: name,
                            });
                        }
                    }
                }
            }
        }
    }

    const totalOff = listStationTypeOff?.length || 0;
    const totalActive = listStationTypeActive?.length || 0;

    const handleData = (data) => {
        const stationData = new Map();
        data.forEach((item) => {
            const { station, status, sensor } = item;

            if (!stationData.has(station)) {
                stationData.set(station, {
                    name: station,
                    error: [],
                    calif: [],
                    over: [],
                });
            }

            if (status === "error") {
                stationData.get(station).error.push(sensor);
            } else if (status === "calif") {
                stationData.get(station).calif.push(sensor);
            } else if (status === "over") {
                stationData.get(station).over.push(sensor);
            }
        });

        return Array.from(stationData.values());
    };

    const checkStatusErrCalifOver = handleData(listStatus);

    for (let item of checkStatusErrCalifOver) {
        
        let checkValid = item.error.length > 0 || item.calif.length > 0;


        if (checkValid) {
            if (item.error.length >= item.calif.length) {
                listStationTypeError.push({
                    station: item.name,
                    status: "error",
                });
            } else if (item.error.length < item.calif.length) {
                listStationTypeCalif.push({
                    station: item.name,
                    status: "calif",
                });
            }
        } else {
            if (item.over) {
                listStationTypeOver.push({
                    station: item.name,
                    status: "over",
                });
            }
        }
    }

    let totalError = listStationTypeError?.length || 0;
    let totalCalif = listStationTypeCalif?.length || 0;
    let totalOver = listStationTypeOver?.length || 0;

    let totalNormal =
        +totalActive - Math.abs(totalError + totalCalif + totalOver) || 0;

    const mergeArray = [
        ...listStationTypeError,
        ...listStationTypeCalif,
        ...listStationTypeOver,
    ];

    listStationTypeNormal = listStationTypeActive.filter(
        ({ station: id1 }) =>
            !mergeArray.some(({ station: id2 }) => id2 === id1)
    );

    const totalStation = listStationByType.length || 0;

    let totalListStatusType = [
        ...listStationTypeOff,
        ...listStationTypeCalif,
        ...listStationTypeError,
        ...listStationTypeNormal,
        ...listStationTypeOver,
    ];
    return {
        totalListStatusType,
        totalOff,
        totalActive,
        totalNormal,
        totalError,
        totalCalif,
        totalStation,
        totalOver,
    };
};
