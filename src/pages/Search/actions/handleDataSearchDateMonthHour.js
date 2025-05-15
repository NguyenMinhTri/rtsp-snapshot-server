import moment from "moment";
const handleData = (data) => {
    const mergeByDate = new Map();
    data.forEach((v) => {
        if (!mergeByDate.has(v.time)) {
            mergeByDate.set(v.time, {
                time: v.time,
                value: [],
            });
        }
        const ti = v.time;
        delete v.time;
        mergeByDate.get(ti).value.push(v);
    });

    const listData = Array.from(mergeByDate.values());
    const endData = [];
    listData.forEach((v, index) => {
        v.value.push({ time: v.time, stt: index+1 });

        const mergedData = v.value.reduce(
            (acc, curr) => Object.assign(acc, curr),
            {}
        );
        endData.push(mergedData);
    });
    return endData;
};
export const handleDataSearchDateMonthHour = (data, listSensor) => {
    console.log({data})
    debugger;
    const resMin = [];
    const resMax = [];
    const resAVG = [];
    let columnDefine = [];
    let listSensorHaveData =  new Set()
   
    

    data.reverse().map((v) => {
        listSensorHaveData.add(v.sensor)
        let time = v.date.value;
        if(typeof time ==="undefined"){
            time = v.date;
        }
        time = moment(
            time
         ).format(
             "DD/MM/YYYY HH:mm:ss"
         );
        
        delete v.date;
        resMin.push({
            time,
            [v.sensor]: v.min_value,
        });
        resMax.push({
            time,
            [v.sensor]: v.max_value,
        });
        resAVG.push({
            time,
            [v.sensor]: v.avg_value,
        });
    });

    const dataMin = handleData(resMin);
    const dataMax = handleData(resMax);
    const dataAVG = handleData(resAVG);
    listSensorHaveData = [...listSensorHaveData]
    console.log({listSensorHaveData})

    listSensorHaveData.map((v) => {
        columnDefine.push({
            id: v,
            label: v,
            align: "center",
        });
    });
    
    columnDefine.unshift({
        id: "time",
        label: "Thời gian",
        align: "center",
        format: (value) => value.toLocaleString("en-US", { timeZone: "UTC" }),
    });

    columnDefine.unshift({
        id: "stt",
        label: "#",
        // minWidth: 60,
        align: "center",
    });


    return { dataMin, dataMax, dataAVG, columnDefine };
};
