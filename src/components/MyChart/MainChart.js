import { Box, Skeleton, Tab, Tabs } from "@mui/material";
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
import TabPanel from "../../pages/Search/components/TabPanel";

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
const data = JSON.parse(
    '[{"value":[{"name":"Flowin(m3/h)","val":0},{"name":"Flow(m3/h)","val":0},{"name":"TSS(mg/l)","val":4.96},{"name":"COD(mg/l)","val":0},{"name":"pH()","val":8.79},{"name":"Temp(oC)","val":24.15}],"time":"2023-02-23T10:55:00"},{"value":[{"name":"Flowin(m3/h)","val":0},{"name":"Flow(m3/h)","val":0},{"name":"TSS(mg/l)","val":4.95},{"name":"COD(mg/l)","val":0},{"name":"pH()","val":8.78},{"name":"Temp(oC)","val":24.15}],"time":"2023-02-23T11:00:00"}]'
);

let listDataOut = [];

function MainChart({ endDate, startDate, deviceUser }) {
    const [dataSensorRange, setDataSensorRange] = useState([]);
    const [countGet, setCountGet] = useState(0);
    const [listSensor, setListSensor] = useState([]);

    const db = ref(getDatabase());

    let count = useRef(0);
    const [hiddenKeys, setHiddenKeys] = useState([]);

    const toggleLine = (dataKey) => {
        if (hiddenKeys.includes(dataKey)) {
            setHiddenKeys(hiddenKeys.filter((key) => key !== dataKey));
        } else {
            setHiddenKeys([...hiddenKeys, dataKey]);
        }
    };

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
            isRealValue: isRealValue, // false : AVG | true : real value
            scale: "hour",
            IsRealTime: IsRealTime, // true :time real of value | false :
        };
        fcGetDataOfSensor(data)
            .then((result) => {
                const dataSensorGet = JSON.parse(result.data);
                
                setCountGet((countGet) => countGet + 1);
                dataSensorGet.Detail.forEach((v, index) => {
                    let obj = {
                        value: {
                            name:
                                nameSensor +
                                `${
                                    typeof unit !== "undefined"
                                        ? `(${unit})`
                                        : "()"
                                }`,
                            val: v.avg_value,
                        },
                        time: v.data_hora.value,
                        name: nameSensor,
                    };
                    listDataOut.push(obj);
                    setDataSensorRange((prv) => [...prv, obj]);
                });
            })
            .catch((error) => {
                const code = error.code;
                const message = error.message;
                const details = error.details;
            });
    };
    // let sensorName = localStorage.getItem('sensor').split(',');
    // console.log({countGet})

    useEffect(() => {
        const fetchSensorData = async () => {
            setCountGet(0);
            setDataSensorRange([]);

            try {
                const snapshot = await get(child(db, `Devices/DAIVIET-RS485/${deviceUser}`));
                if (snapshot.exists()) {
                    let { RS485Data } = snapshot.val();

                    RS485Data = RS485Data.filter(
                        item =>
                            item.MemoryType === 1 &&
                            !item.IsColumn &&
                            (!item.Unit || !item.Unit.toLowerCase().includes("kwh"))
                    );

                    const tempNameUnit = RS485Data.map(v =>
                        `${v.Name}${v.Unit ? `(${v.Unit})` : "( )"}`
                    );

                    setListSensor(tempNameUnit);

                    const fetchPromises = RS485Data.map(v =>
                        getDataOfSensorRealtime(
                            deviceUser,
                            v.Name,
                            startDate,
                            endDate,
                            v.Unit || " "
                        )
                    );

                    await Promise.all(fetchPromises);
                } else {
                    console.log("No data available");
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchSensorData();
    }, [ deviceUser, startDate, endDate]);

    // return <p>123</p>

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
    // console.log({ countGet });
    let previousDataSensor = {};
    const mergeItemObjectArrToObject = (arr) => {
        return arr.map((v, i) => {
            let c = v.value.map((v2) => {
                let b = v2.val;
                let a = v2.name;

                let obj = { [a]: b };
                previousDataSensor[a] = b;
                return obj;
            });

            c.push({ time: moment(v.time).format("DD/MM HH:mm") });
            if (i === arr.length - 1) {
                for (let key in previousDataSensor) {
                    if (typeof c[key] === "undefined") {
                        let tempPreviousSensor = {};
                        tempPreviousSensor[key] = previousDataSensor[key];
                        c.push(tempPreviousSensor);
                    }
                }
            }
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
        output = output.sort((a, b) => new Date(a.time) - new Date(b.time));
        endDataForChart = mergeItemObjectArrToObject(output);
    }

    //
    const [tabTable, setTabTable] = useState("avg");

    const handleChangeTabTable = (event, newValue) => {
        setTabTable(newValue);
    };

    return (
        <>
     
            {endDataForChart.length > 0 ? (
                <> 
                

                <ResponsiveContainer width="100%" height="100%">
                   
                    <LineChart
                        width={1000}
                        height={1000}
                        style={{ minHeight: "500px" }}
                        data={endDataForChart}
                        margin={{
                            top: 20,
                            right: 20,
                            left: -15,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="5 5" stroke="#ccc" />
                        <XAxis
                            dataKey="time"
                            // allowDataOverflow={true}
                            style={{ fontSize: "13px" }}
                        />

                        <YAxis />
                        <Legend onClick={(e) => toggleLine(e.dataKey)} />
                        <Tooltip />
                        {listSensor.map((v, index) => (
                            <Line
                                connectNulls={true}
                                key={index}
                                type="monotone"
                                strokeWidth={1.5}
                                dataKey={v}
                                hide={hiddenKeys.includes(v)}
                                stroke={COLOR[index]}
                                dot={{ r: 1 }}
                                activeDot={{ r: 5 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>

                </>
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
                        Trường hợp không hiện thị vì không có dữ liệu <br />
                        bạn có thể chọn khoảng thời gian khác
                    </p>
                </div>
            )}
        </>
    );
}

export default memo(MainChart);
