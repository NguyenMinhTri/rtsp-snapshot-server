export const handleDataGeneralMonthPresent = (
    totalStatusCache,
    keyValue,
    lengthDeviceAccount
) => {
    let listStation = [];

    for (let item of totalStatusCache) {
        if (!item.station_id) {
            continue;
        }

        listStation.push(keyValue[item.station_id]);

        let hasStatus0 = false;
        let hasStatus1 = false;
        let hasStatus2 = false;

        for (let v of item.data) {
            if (v.Status == 0) {
                hasStatus0 = true;
            } else if (v.Status == 1) {
                hasStatus1 = true;
            } else if (v.Status == 2) {
                hasStatus2 = true;
            }
        }

        if (!hasStatus0) {
            item.data.push({
                Status: 0,
                Count: 0,
            });
        }
        if (!hasStatus1) {
            item.data.push({
                Status: 1,
                Count: 0,
            });
        }
        if (!hasStatus2) {
            item.data.push({
                Status: 2,
                Count: 0,
            });
        }
    }

    let listCountActive = [];
    let listCountCalif = [];
    let listCountError = [];
    let listCountOff = [];

    for (let item of totalStatusCache) {
        for (let v of item.data) {
            if (v.Status == 0) {
                listCountActive.push(v.Count);
            } else if (v.Status == 1) {
                listCountCalif.push(v.Count);
            } else if (v.Status == 2) {
                listCountError.push(v.Count);
            } else if (v.Status == -1) {
                listCountOff.push(v.Count);
            }
        }
    }


    if (
        listCountActive.length == lengthDeviceAccount &&
        listCountCalif.length == lengthDeviceAccount &&
        listCountError.length == lengthDeviceAccount &&
        listCountOff.length == lengthDeviceAccount
    ) {
        let totalActive = listCountActive.reduce((acc, v) => acc + v, 0);
        let totalCalif = listCountCalif.reduce((acc, v) => acc + v, 0);
        let totalError = listCountError.reduce((acc, v) => acc + v, 0);
        let totalOff = listCountOff.reduce((acc, v) => acc + v, 0);

        const totalCountStation = {
            active: totalActive,
            calif: totalCalif,
            error: totalError,
            off: totalOff,
        };

        const listTotalCountStation = {
            listCountActive,
            listCountCalif,
            listCountError,
            listCountOff,
            listStation,
        };
        
        return {
            totalCountStation,
            listTotalCountStation,
        };
    }
};
