import { Box, Skeleton, Tab, Tabs } from "@mui/material";
import { child, get, getDatabase, ref } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import moment from "moment";
import { useEffect, useState, memo, useRef, useCallback, useMemo } from "react";
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

// Animation keyframes for smooth transitions
const animationStyle = `
@keyframes chartPulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}
@keyframes newPointFlash {
  0% { r: 8; opacity: 1; }
  100% { r: 4; opacity: 0.8; }
}
`;

function MainChart({ endDate, startDate, deviceUser, dataRealTime, isLiveMode }) {
    const [dataSensorRange, setDataSensorRange] = useState([]);
    const [countGet, setCountGet] = useState(0);
    const [listSensor, setListSensor] = useState([]);
    const [hiddenKeys, setHiddenKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for real-time data capture
    const [realtimePoints, setRealtimePoints] = useState([]);
    const [cumulativeFlow, setCumulativeFlow] = useState({});
    const lastCaptureTimeRef = useRef(null);
    const realtimePointsRef = useRef([]);

    // Track if initial data has been loaded to prevent API refetch in live mode
    const initialLoadDoneRef = useRef(false);
    const lastFetchParamsRef = useRef({ deviceUser: null, startDate: null, endDate: null });

    const db = ref(getDatabase());
    let count = useRef(0);

    const toggleLine = (dataKey) => {
        if (hiddenKeys.includes(dataKey)) {
            setHiddenKeys(hiddenKeys.filter((key) => key !== dataKey));
        } else {
            setHiddenKeys([...hiddenKeys, dataKey]);
        }
    };

    // Capture current sensor values for real-time chart
    const captureCurrentValues = useCallback((dataRealTime) => {
        if (!dataRealTime || dataRealTime.length === 0) return null;

        const now = new Date();
        const point = {
            time: moment(now).format("DD/MM HH:mm"),
            timestamp: now.getTime(),
        };

        // Extract sensor values from dataRealTime
        const sensorData = dataRealTime[0]?.data_sensor || [];
        sensorData.forEach((sensor) => {
            const key = sensor.Name + (sensor.Unit ? `(${sensor.Unit})` : "()");
            const value = parseFloat(sensor.Value);
            if (!isNaN(value)) {
                point[key] = value;
            }
        });

        return point;
    }, []);

    // Calculate cumulative flow using trapezoidal rule
    const calculateCumulativeFlow = useCallback((points, sensors) => {
        const flowMap = {};

        sensors.forEach((sensorName) => {
            const lowerName = sensorName.toLowerCase();
            if (lowerName.includes("flow")) {
                // Get all data points for this sensor
                const sensorPoints = points
                    .filter(p => p[sensorName] !== undefined)
                    .map(p => ({
                        time: p.timestamp,
                        value: p[sensorName]
                    }))
                    .sort((a, b) => a.time - b.time);

                if (sensorPoints.length >= 2) {
                    let cumulative = 0;
                    for (let i = 1; i < sensorPoints.length; i++) {
                        // Time difference in hours
                        const dtHours = (sensorPoints[i].time - sensorPoints[i - 1].time) / (1000 * 3600);
                        // Trapezoidal rule: average of two points * time
                        cumulative += ((sensorPoints[i].value + sensorPoints[i - 1].value) / 2) * dtHours;
                    }

                    // Determine flow type based on sensor name
                    let flowType = "flow";
                    if (lowerName.includes("flowin") || lowerName.includes("flow_in") || lowerName.includes("flow in")) {
                        flowType = "flowin";
                    } else if (lowerName.includes("flowout") || lowerName.includes("flow_out") || lowerName.includes("flow out")) {
                        flowType = "flowout";
                    }

                    flowMap[sensorName] = {
                        value: cumulative,
                        type: flowType,
                        displayName: sensorName
                    };
                }
            }
        });

        return flowMap;
    }, []);

    // Effect to capture real-time data when it changes
    useEffect(() => {
        if (!dataRealTime || dataRealTime.length === 0) return;

        const now = Date.now();
        // Only capture every 5 seconds to avoid too many points
        if (lastCaptureTimeRef.current && (now - lastCaptureTimeRef.current) < 5000) {
            return;
        }

        const newPoint = captureCurrentValues(dataRealTime);
        if (newPoint) {
            lastCaptureTimeRef.current = now;

            // Keep last 120 points (10 minutes at 5-second intervals)
            realtimePointsRef.current = [...realtimePointsRef.current.slice(-119), newPoint];
            setRealtimePoints([...realtimePointsRef.current]);

            // Calculate cumulative flow
            if (listSensor.length > 0) {
                const flowData = calculateCumulativeFlow(realtimePointsRef.current, listSensor);
                setCumulativeFlow(flowData);
            }
        }
    }, [dataRealTime, captureCurrentValues, calculateCumulativeFlow, listSensor]);

    const getDataOfSensorRealtime = (
        idStation,
        nameSensor,
        startDateChoose = "13:30 11/15/2022",
        endDateChoose = "24:00 11/15/2022",
        unit,
        isRealValue = true,
        IsRealTime = true
    ) => {
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
            isRealValue: isRealValue,
            scale: "hour",
            IsRealTime: IsRealTime,
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
                                `${typeof unit !== "undefined"
                                    ? `(${unit})`
                                    : "()"
                                }`,
                            val: v.avg_value,
                        },
                        time: v.data_hora.value,
                        name: nameSensor,
                    };
                    setDataSensorRange((prv) => [...prv, obj]);
                });
            })
            .catch((error) => {
                const code = error.code;
                const message = error.message;
                const details = error.details;
            });
    };

    useEffect(() => {
        // Skip refetch if in live mode and initial data already loaded
        // Only refetch when:
        // 1. Device changes, OR
        // 2. User manually changes date range (not in live mode)
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

        const fetchSensorData = async () => {
            setIsLoading(true); // Start loading
            setCountGet(0);
            setDataSensorRange([]);
            // Reset realtime points when device changes
            realtimePointsRef.current = [];
            setRealtimePoints([]);
            setCumulativeFlow({});

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

                    // Mark initial load as done and save fetch params
                    initialLoadDoneRef.current = true;
                    lastFetchParamsRef.current = { deviceUser, startDate, endDate };
                    setIsLoading(false); // Loading complete
                } else {
                    console.log("No data available");
                    setIsLoading(false); // No data - stop loading
                }
            } catch (error) {
                console.error(error);
                setIsLoading(false); // Error - stop loading
            }
        };

        fetchSensorData();
    }, [deviceUser, startDate, endDate, isLiveMode]);

    // Memoize chart data processing to prevent data loss on re-render
    const endDataForChart = useMemo(() => {
        // Only process when all sensors have loaded
        if (countGet !== listSensor.length || listSensor.length === 0) {
            return [];
        }

        // Process data
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

        // Sort and merge
        output = output.sort((a, b) => new Date(a.time) - new Date(b.time));

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
                c.push({ timestamp: new Date(v.time).getTime() });
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
                    let b = Object.values(v)[0];
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

    // Merge historical data with real-time points
    const mergedChartData = [...endDataForChart, ...realtimePoints];

    return (
        <>
            {/* Inject animation styles */}
            <style>{animationStyle}</style>

            {/* Flow Cumulative Display */}
            {Object.keys(cumulativeFlow).length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        p: 1.5,
                        mb: 1,
                        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    {Object.entries(cumulativeFlow).map(([sensor, data]) => (
                        <Box
                            key={sensor}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 1.5,
                                bgcolor: 'white',
                                borderRadius: 1.5,
                                minWidth: 120,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    mb: 0.5
                                }}
                            >
                                {data.type === 'flowin' ? '📥 Flow In' :
                                    data.type === 'flowout' ? '📤 Flow Out' : '💧 Flow'}
                            </Box>
                            <Box
                                component="span"
                                sx={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: data.type === 'flowin' ? '#2196F3' :
                                        data.type === 'flowout' ? '#FF5722' : '#4CAF50',
                                    animation: 'chartPulse 2s ease-in-out infinite'
                                }}
                            >
                                {data.value.toFixed(2)} m³
                            </Box>
                            <Box
                                component="span"
                                sx={{
                                    fontSize: '0.65rem',
                                    color: 'text.disabled',
                                    mt: 0.25
                                }}
                            >
                                {sensor.split('(')[0]}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {!isLoading && mergedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={500}>
                    <LineChart
                        width={1000}
                        height={1000}
                        style={{ minHeight: "400px" }}
                        data={mergedChartData}
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
                            style={{ fontSize: "13px" }}
                        />

                        <YAxis />
                        <Legend onClick={(e) => toggleLine(e.dataKey)} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: 'none'
                            }}
                        />
                        {listSensor.map((v, index) => (
                            <Line
                                connectNulls={true}
                                key={index}
                                type="monotone"
                                strokeWidth={2}
                                dataKey={v}
                                hide={hiddenKeys.includes(v)}
                                stroke={COLOR[index % COLOR.length]}
                                dot={{ r: 2, strokeWidth: 1 }}
                                activeDot={{
                                    r: 6,
                                    strokeWidth: 2,
                                    fill: COLOR[index % COLOR.length],
                                    stroke: '#fff'
                                }}
                                isAnimationActive={true}
                                animationDuration={800}
                                animationEasing="ease-in-out"
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ position: "relative" }}>
                    <Skeleton
                        animation="wave"
                        variant="rounded"
                        height={400}
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
