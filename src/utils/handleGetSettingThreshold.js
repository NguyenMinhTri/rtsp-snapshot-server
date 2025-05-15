export const handleGetSettingThreshold = (station_id, sensor, value) => {
    const keySetting = `SettingThreshold_${station_id}`;
    const res = JSON.parse(localStorage.getItem(keySetting));
    if (res) {
        let isOver = false;
        for (let item of res) {
            if (item.sensor == sensor) {
                if (+value > +item.max || +value < +item.min) {
                    isOver = true;
                }
            }
        }
        return isOver;
    } else {
        return false;
    }
};


