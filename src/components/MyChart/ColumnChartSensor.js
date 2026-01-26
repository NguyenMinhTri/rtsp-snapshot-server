import { Skeleton, Box, Typography } from "@mui/material";
import { child, get, getDatabase, ref } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import moment from "moment";
import { useEffect, useMemo } from "react";
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

function ColumnChartSensor({ endDate, startDate, deviceUser, isLiveMode, dataRealTime }) {
    const [dataSensorRange, setDataSensorRange] = useState([]);
    const [countGet, setCountGet] = useState(0);
    const [listSensor, setListSensor] = useState([]);
    const [dataSensorObject, setDataSensorObject] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [cumulativeFlowLive, setCumulativeFlowLive] = useState({});
    const db = ref(getDatabase());

    let count = useRef(0);

    // Track if initial data has been loaded to prevent API refetch in live mode
    const initialLoadDoneRef = useRef(false);
    const lastFetchParamsRef = useRef({ deviceUser: null, startDate: null, endDate: null });

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
                                `${typeof unit !== "undefined"
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
        // Skip refetch if in live mode and initial data already loaded
        const shouldFetch =
            deviceUser !== lastFetchParamsRef.current.deviceUser ||
            (!isLiveMode && (
                startDate !== lastFetchParamsRef.current.startDate ||
                endDate !== lastFetchParamsRef.current.endDate
            )) ||
            !initialLoadDoneRef.current;

        if (!shouldFetch) {
            return;
        }

        setIsLoading(true);
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
                            `${typeof v.Unit !== "undefined"
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

                    // Mark initial load as done and save fetch params
                    initialLoadDoneRef.current = true;
                    lastFetchParamsRef.current = { deviceUser, startDate, endDate };
                } else {
                    console.log("No data available");
                }
            })
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
            });
    }, [startDate, endDate, deviceUser, isLiveMode]);

    // Update loading state when data processing is complete
    useEffect(() => {
        if (countGet === listSensor.length && listSensor.length > 0) {
            setIsLoading(false);
        }
    }, [countGet, listSensor.length]);

    // Live flow accumulation update for column chart sensors
    const lastFlowUpdateRef = useRef(null);
    useEffect(() => {
        if (!isLiveMode || !dataRealTime || dataRealTime.length === 0) {
            return;
        }

        const now = Date.now();
        if (lastFlowUpdateRef.current && (now - lastFlowUpdateRef.current) < 5000) {
            return;
        }
        lastFlowUpdateRef.current = now;

        const sensorData = dataRealTime[0]?.data_sensor || [];
        if (sensorData.length === 0) return;

        setCumulativeFlowLive(prevFlow => {
            const updatedFlow = { ...prevFlow };
            const intervalHours = 5 / 3600; // 5 seconds in hours

            sensorData.forEach(sensor => {
                // Check if this sensor is in our column chart list
                const sensorNameWithUnit = listSensor.find(s =>
                    s.toLowerCase().includes(sensor.Name?.toLowerCase() || '')
                );

                if (sensorNameWithUnit && sensor.Name) {
                    const flowValue = parseFloat(sensor.Value);
                    if (!isNaN(flowValue)) {
                        // Add flow * time interval to cumulative
                        const currentCumulative = updatedFlow[sensorNameWithUnit] || 0;
                        updatedFlow[sensorNameWithUnit] = currentCumulative + (flowValue * intervalHours);
                    }
                }
            });

            return updatedFlow;
        });
    }, [dataRealTime, isLiveMode, listSensor]);

    // Memoize chart data processing to prevent data loss on re-render
    const endDataForChart = useMemo(() => {
        // Only process when all sensors have loaded
        if (countGet !== listSensor.length || listSensor.length === 0) {
            return [];
        }

        let output = [];
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
                    output.push(item);
                }
            });
        };

        handleObjectSameKeyInArr(dataSensorRange);

        if (output.length === 0) {
            return [];
        }

        const mergeItemObjectArrToObject = (arr) => {
            return arr.map((v) => {
                let c = v.value.map((v2) => {
                    let b = v2.val;
                    let a = v2.name;
                    let obj = { [a]: Number((v2.max - v2.min).toFixed(2)) };
                    return obj;
                });

                c.push({ time: moment(v.time).format("DD-MM HH:mm") });

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

        return mergeItemObjectArrToObject(output);
    }, [dataSensorRange, listSensor.length, countGet]);

    // console.log({ endDataForChart });

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 1,
            pt: 0.5,
            position: 'relative',
        }}>
            {/* Loading overlay when refetching data */}
            {isLoading && endDataForChart.length > 0 && (
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    zIndex: 10,
                    borderRadius: 2,
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                border: '3px solid #e0e0e0',
                                borderTop: '3px solid #1976d2',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                mx: 'auto',
                                mb: 1,
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' },
                                },
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Đang cập nhật...
                        </Typography>
                    </Box>
                </Box>
            )}

            {endDataForChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="95%">
                    <BarChart
                        data={endDataForChart}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11 }}
                            tickLine={{ stroke: '#ccc' }}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickLine={{ stroke: '#ccc' }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                border: 'none',
                            }}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: 8,
                                fontSize: 12,
                            }}
                        />
                        {listSensor.map((v, index) => (
                            <Bar
                                key={v}
                                fill={COLOR[index % COLOR.length]}
                                dataKey={v}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <Box sx={{
                    position: "relative",
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Skeleton
                        animation="wave"
                        variant="rounded"
                        height="90%"
                        width="100%"
                        sx={{ borderRadius: 2 }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            textAlign: "center",
                            px: 3,
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        border: '4px solid #e0e0e0',
                                        borderTop: '4px solid #1976d2',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        mx: 'auto',
                                        mb: 2,
                                        '@keyframes spin': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' },
                                        },
                                    }}
                                />
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Đang tải dữ liệu...
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                >
                                    Vui lòng chờ trong giây lát
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Không có dữ liệu
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                >
                                    Vui lòng chọn khoảng thời gian khác
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default memo(ColumnChartSensor);
