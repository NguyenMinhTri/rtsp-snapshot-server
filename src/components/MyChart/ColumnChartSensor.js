import { Skeleton } from "@mui/material";
import { child, get, getDatabase, ref } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import moment from "moment";
import { useEffect } from "react";
import { useState, memo, useRef } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import { functions } from "../../config/firebase";

const COLOR = [
    "#DC3535",
    "#256D85",
    "#474E68",
    "#990000",
    "#557153",
    "#2192FF",
    "#000000",
    "#EF9A53",
    "#38E54D",
    "#3A8891",
];

function ColumnChartSensor({ endDate, startDate, deviceUser }) {
    const [dataSensorRange, setDataSensorRange] = useState([]);
    const [countGet, setCountGet] = useState(0);
    const [listSensor, setListSensor] = useState([]);
    const [dataSensorObject, setDataSensorObject] = useState({});
    const db = ref(getDatabase());

    let count = useRef(0);

    const getDataOfSensorRealtime = (
        idStation,
        nameSensor,
        startDateChoose = "13:30 11/15/2022",
        endDateChoose = "24:00 11/15/2022",
        unit,
        isRealValue = true,
        IsRealTime = true
    ) => {
        // const startDateChoose = '13:00 11/11/2022'; // time MM/DD/YYYY
        // const endDateChoose = '13:00 12/11/2022';
        // console.log({ idStation, nameSensor, startDateChoose, endDateChoose });

        const dateS = new Date(startDateChoose);
        const dateE = new Date(endDateChoose);

        const subtract7HoursStart = dateS.getTime() - 7 * 60 * 60 * 1000;
        const subtract7HoursEnd = dateE.getTime() - 7 * 60 * 60 * 1000;

        const startDate = moment(subtract7HoursStart).format(
            "YYYY-MM-DD HH:mm:ss"
        );
        const endDate = moment(subtract7HoursEnd).format("YYYY-MM-DD HH:mm:ss");

        const fcGetDataOfSensor = httpsCallable(functions, "GetDataOfSensor");
        const data = {
            deviceId: idStation,
            sensorId: nameSensor,
            startDate: startDate,
            endDate: endDate,
            isRealValue: false, // false : AVG | true : real value
            scale: "hour",
            IsRealTime: false, // true :time real of value | false :
        };
        fcGetDataOfSensor(data)
            .then((result) => {
                const dataSensorGet = JSON.parse(result.data);

                setCountGet((countGet) => countGet + 1);
                dataSensorGet.Detail.forEach((v) => {
                    let obj = {
                        value: {
                            name:
                                nameSensor +
                                `${
                                    typeof unit !== "undefined"
                                        ? `(${unit})`
                                        : ""
                                }`,
                            val: v.avg_value,
                            min: v.min_value,
                            max: v.max_value,
                        },
                        time: v.data_hora.value,
                    };
                    setDataSensorRange((prv) => [...prv, obj]);
                });
            })
            .catch((error) => {
                const code = error.code;
                const message = error.message;
                const details = error.details;

                // console.log({ code, message, details });
            });
    };
    // let sensorName = localStorage.getItem('sensor').split(',');

    useEffect(() => {
        setCountGet(0);
        setDataSensorRange([]);
        // const deviceUser = localStorage.getItem('home_station');
        get(child(db, `Devices/DAIVIET-RS485/${deviceUser}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    let { RS485Data } = snapshot.val();
                    // column chart
                    RS485Data = RS485Data.filter(
                        (item) =>
                            item.MemoryType === 1 &&
                            (item.IsColumn ||
                                (typeof item.Unit !== "undefined" &&
                                    item.Unit.toLowerCase().includes("kwh")))
                    );
                    RS485Data = RS485Data.filter(
                        (item) =>
                            typeof item.Unit !== "undefined" &&
                            item.Unit.toLowerCase() !== "h"
                    );
                    let s = [];
                    let unitLst = [];
                    let tempNameUnit = [];
                    RS485Data.map((v) => {
                        s.push(v.Name);
                        unitLst.push(v.Unit);
                        tempNameUnit.push(
                            v.Name +
                                `${
                                    typeof v.Unit !== "undefined"
                                        ? `(${v.Unit})`
                                        : ""
                                }`
                        );
                    });
                    // console.log({ s });
                    setListSensor(tempNameUnit);
                    let counter = 0;
                    s.forEach((s) => {
                        getDataOfSensorRealtime(
                            deviceUser,
                            s,
                            startDate,
                            endDate,
                            unitLst[counter]
                        );
                        counter++;
                    });
                } else {
                    console.log("No data available");
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, [startDate, endDate, deviceUser]);

    // console.log({ count: countGet, leng: listSensor.length });

    let output = [];
    if (countGet === listSensor.length) {
        const handleObjectSameKeyInArr = (arr) => {
            arr.forEach(function (item) {
                var existing = output.filter(function (v, i) {
                    return v.time == item.time;
                });

                if (existing.length) {
                    var existingIndex = output.indexOf(existing[0]);
                    output[existingIndex].value = output[
                        existingIndex
                    ].value.concat(item.value);
                } else {
                    let arr = [];
                    arr.push(item.value);
                    if (typeof item.value == "object") {
                        item.value = arr;
                    }
                    // console.log(item);
                    output.push(item);
                }
            });
        };

        handleObjectSameKeyInArr(dataSensorRange);
    }

    console.log(JSON.stringify(dataSensorRange));
    let previousDataSensor = {};
    const mergeItemObjectArrToObject = (arr) => {
        return arr.map((v) => {
            let c = v.value.map((v2) => {
                let b = v2.val;
                let a = v2.name;
                let obj = { [a]: Number((v2.max - v2.min).toFixed(2)) };

                // previousDataSensor[a]=b;
                return obj;
            });

            console.log(c);
            c.push({ time: moment(v.time).format("DD-MM HH:mm") });
            // for (let key in previousDataSensor) {
            //     if(typeof c[key] === "undefined"){
            //         let tempPreviousSensor ={};
            //         tempPreviousSensor[key]=previousDataSensor[key];
            //         c.push(tempPreviousSensor);
            //         console.log("Key " +key+":"+ c[key] );
            //     }
            //   }

            let r = [];
            let o = {};

            c.map((v) => {
                let a = Object.keys(v)[0];
                let b = String(Object.values(v)[0]);

                r.push({ a, b });
            });
            r.map((v) => {
                o[v.a] = v.b;
            });

            return o;
        });
    };
    let endDataForChart = [];
    if (output.length > 0) {
        endDataForChart = mergeItemObjectArrToObject(output);
    }

    // console.log({ endDataForChart });

    return (
        <>
            {endDataForChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart width={600} height={300} data={endDataForChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend legendType="none" />
                        {listSensor.map((v, index) => (
                            <Bar fill={COLOR[index]} dataKey={v} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ position: "relative" }}>
                    <Skeleton
                        animation="wave"
                        variant="rounded"
                        height={500}
                        width={"100%"}
                    />
                    <p
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "0",
                            right: "0",
                            textAlign: "center",
                            padding: "0 50px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "18px",
                                marginBottom: "10px",
                                fontWeight: "600",
                            }}
                        >
                            Vui lòng chờ...
                        </span>{" "}
                        <br />
                        Trường hợp không hiện thị vì không có dữ liệu bạn có thể
                        chọn khoảng thời gian khác
                    </p>
                </div>
            )}
        </>
    );
}

export default memo(ColumnChartSensor);
