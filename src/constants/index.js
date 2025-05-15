export const versionApp = 2;
export const colorStationStatus = {
    error: "red",
    calif: "orange",
    active: "#11cc67",
    // over: "#2192FF",
    over: "#141E61",
    off: "gray",
};

export const accountPermissionSetting = [
    "tuanthanh.tantruongthanh@gmail.com",
    "datalogger@testing.vn",
    "phongna2013@gmail.com",
    "phong.tttservice@gmail.com",
];
export const TIME_DEVICE_OFF = 60;

export const defaultTypeSearchData =  { type: "by_hour", label: "Trung Bình / Max / Min theo giờ" }
export const typeSearchData = [
    { type: "by_hour", label: "Trung Bình / Max / Min theo giờ" },
    { type: "by_date", label: "Trung Bình / Max / Min theo ngày" },
    { type: "by_month", label: "Trung Bình / Max / Min theo tháng" },
    { type: "normal", label: "Tra cứu dữ liệu thu được" },

];

const hours24h = () => {
    let res = []
    for(let i = 1 ; i< 25 ; i++) {
        res.push(i.toString())
    }
    return res
}

const days31 = () => {
    let res = []
    for(let i = 1 ; i < 32 ; i++) {
        res.push(i.toString())
    }
    return res
}


const months12 = () => {
    let res = []
    for(let i = 1 ; i < 13 ; i++) {
        res.push(i.toString())
    }
    return res
}



export const searchByHours = hours24h()
export const searchByDays = days31()
export const searchByMonths = months12()


export const selectionByType = {
    "by_hour" : searchByHours,
    "by_month" : searchByMonths,
    "by_date" : searchByDays
}

export const SENSOR_OF_DEVICE_KEY = `SensorOfDevice`;