import {
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import React, { useRef } from "react";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useEffect } from "react";
import { useState } from "react";
import { colorStationStatus } from "../../../../constants";
import StackBetween from "../../../../components/StackBeetwen";
import CardMain from "./CardMain";
import moment from "moment";
import { httpsCallable } from "firebase/functions";
import { functions, functionsUS } from "../../../../config/firebase";
import Cookies from "js-cookie";
import { handelTimePresent } from "../../../../utils/handleTimePresent";
import { saveDataCaching, readDataCachingByAccount } from "../../actions";
import { handleDataGeneralMonthPresent } from "../../utils/handleDataGeneralMonthPresent";

// Load Highcharts modules

// require("highcharts/modules/exporting")(Highcharts);
function ColumnStatus() {
    const chartComponentRef = useRef(null);
    const [templateOptions, setTemplateOptions] = useState(null);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);

    const accountUser = localStorage.getItem("loginEmail");

    const [devices, setDevices] = useState([]);
    const [keyValue, setKeyValue] = useState([]);

    const [totalStatus, setTotalStatus] = useState([]);
    const [totalStatusPrevious, setTotalStatusPrevious] = useState([]);

    const [totalStatusCache, setTotalStatusCache] = useState([]);
    const [totalStatusCacheOneDay, setTotalStatusCacheOneDay] = useState([]);
    const [totalStatusCacheInit, setTotalStatusCacheInit] = useState([]);
    const [totalStatusPreviousCacheInit, setTotalStatusPreviousCacheInit] =
        useState([]);

    const [dataCachingNew, setDataCachingNew] = useState(null);

    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingPrevious, setLoadingPrevious] = useState(false);

    const [totalPresent, setTotalPresent] = useState(null);
    const [totalPresentPrev, setTotalPresentPrev] = useState(null);

    const lengthDeviceAccount = Object.keys(listDevice).length;

    const totalCountStation = JSON.parse(
        localStorage.getItem("totalCountStation")
    );
    const totalCountStationPrev = JSON.parse(
        localStorage.getItem("totalCountStationPrev")
    );
    const listTotalCountStation = JSON.parse(
        localStorage.getItem("listTotalCountStation")
    );

    const countStatusStation = async (
        idStation,
        startDay = "YYYY-MM-DD",
        endDay = "YYYY-MM-DD"
    ) => {
        const fcGetDataOfSensor = httpsCallable(
            functions,
            "GetCountStatusStation"
        );
        const fcGetDataOfSensorOff = httpsCallable(
            functions,
            "GetCountStatusOffStation"
        );

        const data = {
            deviceId: idStation,
            startDate: moment(startDay).format("YYYY-MM-DD"),
            endDate: moment(endDay).format("YYYY-MM-DD"),
        };

        try {
            const result = await fcGetDataOfSensor(data);
            const resultOff = await fcGetDataOfSensorOff(data);

            const dataResult = JSON.parse(result.data.data);
            const dataOff = JSON.parse(resultOff.data.data)[0];

            // console.log({dataResult,dataOff})

            return {
                data: [
                    ...dataResult,
                    { Status: -1, Count: dataOff?.Count || 0 },
                ],
                station_id: result.data.station_id,
            };
        } catch (error) {
            const code = error.code;
            const message = error.message;
            const details = error.details;
        }
    };

    const handleCachingUpdateData = (devices) => {
        const { dayPresent, monthPresent, yearsPresent } = handelTimePresent();

        const handleSplitData = (time) => {
            const dayCache = +time.split("_")[1];
            const monthCache = +time.split("_")[2];
            const yearCache = +time.split("_")[3];

            return {
                dayCache,
                monthCache,
                yearCache,
            };
        };

        readDataCachingByAccount(accountUser).then((v) => {
            if (v.length > 0) {
            

                for (let item of v) {
                    if (item.month.split("_")[0] == "New") {
                        setDataCachingNew(item);
                    } 
                }

                if (dataCachingNew) {
                    const { dayCache, monthCache, yearCache } = handleSplitData(
                        dataCachingNew.month
                    );

                    if (monthPresent == monthCache ) {
                        // call data for day present after save = save + present

                        const startDay = `${yearsPresent}-${monthPresent}-${
                            dayPresent - 1
                        }`;
                        const endDay = `${yearsPresent}-${monthPresent}-${dayPresent}`;

                        for (let device of devices) {
                            countStatusStation(
                                device.id,
                                startDay,
                                endDay
                            ).then((v) => {
                                setTotalStatusCacheOneDay((prev) => [
                                    ...prev,
                                    v,
                                ]);
                            });
                        }
                    } else {
                        // sang nghĩa ra đã sang thang mới =>  change previous data = last data new
                        const startDay = `${yearsPresent}-${monthPresent}-01`;
                        const endDay = `${yearsPresent}-${monthPresent}-${
                            dayPresent + 1
                        }`;

                        for (let device of devices) {
                            countStatusStation(
                                device.id,
                                startDay,
                                endDay
                            ).then((v) => {
                                setTotalStatusCache((prev) => [...prev, v]);
                            });
                        }

                        saveDataCaching(
                            accountUser,
                            `Previous_${monthCache}_${yearCache}`,
                            dataCachingNew.totalCountStation
                        );
                    }
                }
            } else {
                // call data init
                const startDay = `${yearsPresent}-${monthPresent}-01`;
                const endDay = `${yearsPresent}-${monthPresent}-${
                    dayPresent - 1
                }`;
                for (let device of devices) {
                    countStatusStation(device.id, startDay, endDay).then(
                        (v) => {
                            setTotalStatusCacheInit((prev) => [...prev, v]);
                        }
                    );
                }
            }
        });
    };

    const checkDataCacheLocal = () => {
        const timeCache = JSON.parse(localStorage.getItem("timePresent"));

        const { dayPresent, monthPresent, yearsPresent } = handelTimePresent();

        if (
            !timeCache ||
            timeCache?.dayPresent != dayPresent ||
            timeCache?.monthPresent != monthPresent ||
            timeCache?.yearsPresent != yearsPresent
        ) {
            return false;
        }

        if (
            totalCountStation &&
            totalCountStationPrev &&
            listTotalCountStation
        ) {
            return true;
        }
    };

    useEffect(() => {
        if (listDevice) {
            const id = Object.keys(listDevice);
            let d = [];
            let keyValue = {};
            id.map((v) => {
                d.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                });

                let obj = {
                    [v]: listDevice[v]["FullName"],
                };
                keyValue[v] = listDevice[v]["FullName"];
            });
            setDevices(d);
            setKeyValue(keyValue);
        }
    }, []);

    useEffect(() => {
        let chartObj = chartComponentRef.current?.chart;
        chartObj?.showLoading();

        setTimeout(() => {
            chartObj?.hideLoading();
        }, 500);
    }, []);

    useEffect(() => {
        if (devices && devices.length > 0 && !checkDataCacheLocal()) {
            setLoadingChart(true);
            setLoadingPrevious(true);
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();
            const startDay = `${yearsPresent}-${monthPresent}-01`;
            const endDay = `${yearsPresent}-${monthPresent}-${dayPresent + 1}`;

            localStorage.setItem(
                "timePresent",
                JSON.stringify({
                    dayPresent,
                    monthPresent,
                    yearsPresent,
                })
            );

            for (let device of devices) {
                countStatusStation(device.id, startDay, endDay).then((v) => {
                    setTotalStatus((prev) => [...prev, v]);
                });
            }
        }
    }, [devices]);

    // useEffect(() => {
    //     if (
    //         totalStatus.length == lengthDeviceAccount &&
    //         keyValue &&
    //         !checkDataCacheLocal()
    //     ) {
    //         let listStation = [];

    //         for (let item of totalStatus) {
    //             listStation.push(keyValue[item.station_id]);
    //             let hasStatus0 = false;
    //             let hasStatus1 = false;
    //             let hasStatus2 = false;

    //             for (let v of item.data) {
    //                 if (v.Status == 0) {
    //                     hasStatus0 = true;
    //                 } else if (v.Status == 1) {
    //                     hasStatus1 = true;
    //                 } else if (v.Status == 2) {
    //                     hasStatus2 = true;
    //                 }
    //             }

    //             if (!hasStatus0) {
    //                 item.data.push({
    //                     Status: 0,
    //                     Count: 0,
    //                 });
    //             }
    //             if (!hasStatus1) {
    //                 item.data.push({
    //                     Status: 1,
    //                     Count: 0,
    //                 });
    //             }
    //             if (!hasStatus2) {
    //                 item.data.push({
    //                     Status: 2,
    //                     Count: 0,
    //                 });
    //             }
    //         }

    //         let listCountActive = [];
    //         let listCountCalif = [];
    //         let listCountError = [];
    //         let listCountOff = [];

    //         for (let item of totalStatus) {
    //             for (let v of item.data) {
    //                 if (v.Status == 0) {
    //                     listCountActive.push(v.Count);
    //                 } else if (v.Status == 1) {
    //                     listCountCalif.push(v.Count);
    //                 } else if (v.Status == 2) {
    //                     listCountError.push(v.Count);
    //                 } else if (v.Status == -1) {
    //                     listCountOff.push(v.Count);
    //                 }
    //             }
    //         }

    //         if (
    //             listCountActive.length == lengthDeviceAccount &&
    //             listCountCalif.length == lengthDeviceAccount &&
    //             listCountError.length == lengthDeviceAccount &&
    //             listCountOff.length == lengthDeviceAccount
    //         ) {
    //             let optionDataChart = [
    //                 {
    //                     name: "Hoạt động tốt",
    //                     data: listCountActive,
    //                     color: colorStationStatus.active,
    //                 },
    //                 {
    //                     name: "Hiệu chuẩn",
    //                     data: listCountCalif,
    //                     color: colorStationStatus.calif,
    //                 },
    //                 {
    //                     name: "Lỗi thiêt bị",
    //                     data: listCountError,
    //                     color: colorStationStatus.error,
    //                 },
    //                 {
    //                     name: "Mất kết nối",
    //                     data: listCountOff,
    //                     color: colorStationStatus.off,
    //                 },
    //             ];

    //             const templateOptions = {
    //                 chart: {
    //                     type: "column",
    //                     marginTop: 40,
    //                 },
    //                 exporting: {
    //                     enabled: false,
    //                 },

    //                 title: {
    //                     // text: "Dữ liệu trong tháng này",
    //                     text: '<span style="font-size: 14px">Dữ liệu trong tháng này</span>',
    //                     align: "center",
    //                 },
    //                 xAxis: {
    //                     categories: listStation,
    //                     labels: {
    //                         autoRotationLimit: 70,
    //                         autoRotation: true,
    //                     },
    //                 },
    //                 yAxis: {
    //                     min: 0,
    //                     title: {
    //                         text: "Số liệu",
    //                     },
    //                     stackLabels: {
    //                         enabled: false,
    //                     },
    //                 },

    //                 tooltip: {
    //                     headerFormat: "<b>{point.x}</b><br/>",
    //                     pointFormat:
    //                         "{series.name}: {point.y}<br/>Total: {point.stackTotal}",
    //                 },
    //                 plotOptions: {
    //                     column: {
    //                         stacking: "normal",
    //                         dataLabels: {
    //                             enabled: true,
    //                         },
    //                     },
    //                 },
    //                 series: optionDataChart,
    //             };

    //             setTemplateOptions(templateOptions);

    //             let totalActive = listCountActive.reduce(
    //                 (acc, v) => acc + v,
    //                 0
    //             );
    //             let totalCalif = listCountCalif.reduce((acc, v) => acc + v, 0);
    //             let totalError = listCountError.reduce((acc, v) => acc + v, 0);
    //             let totalOff = listCountOff.reduce((acc, v) => acc + v, 0);

    //             setTotalPresent({
    //                 active: totalActive,
    //                 calif: totalCalif,
    //                 error: totalError,
    //                 off: totalOff,
    //             });

    //             localStorage.setItem(
    //                 "totalCountStation",
    //                 JSON.stringify({
    //                     active: totalActive,
    //                     calif: totalCalif,
    //                     error: totalError,
    //                     off: totalOff,
    //                 })
    //             );
    //             localStorage.setItem(
    //                 "listTotalCountStation",
    //                 JSON.stringify({
    //                     listCountActive,
    //                     listCountCalif,
    //                     listCountError,
    //                     listCountOff,
    //                     listStation,
    //                 })
    //             );

    //             setLoadingChart(false);

    //             // month previous
    //             const { dayPresent, monthPresent, yearsPresent } =
    //                 handelTimePresent();
    //             const startDay = `${yearsPresent}-${monthPresent - 1}-01`;
    //             const endDay = `${yearsPresent}-${monthPresent - 1}-30`;

    //             for (let device of devices) {
    //                 countStatusStation(device.id, startDay, endDay).then(
    //                     (v) => {
    //                         setTotalStatusPrevious((prev) => [...prev, v]);
    //                     }
    //                 );
    //             }
    //         }
    //     }
    // }, [totalStatus.length]);

    // ! handle update cache one day
    useEffect(() => {
        if (totalStatusCacheOneDay.length == lengthDeviceAccount && keyValue) {
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();

            const { totalCountStation, listTotalCountStation } =
                handleDataGeneralMonthPresent(
                    totalStatusCache,
                    keyValue,
                    lengthDeviceAccount
                );

            const listTotalCountStationCaching =
                dataCachingNew.listTotalCountStation;
            const totalCountStationCaching = dataCachingNew.totalCountStation;

            while (
                listTotalCountStationCaching.length < totalCountStation.length
            ) {
                listTotalCountStationCaching.push(0);
            }

            while (
                totalCountStation.length < listTotalCountStationCaching.length
            ) {
                totalCountStation.push(0);
            }

            let newListTotalCountStation = [];
            for (let i = 0; i < listTotalCountStationCaching.length; i++) {
                const sum =
                    listTotalCountStationCaching[i] + listTotalCountStation[i];
                newListTotalCountStation.push(sum);
            }

            let newTotalCountStationStation = [];
            for (let i = 0; i < totalCountStationCaching.length; i++) {
                const sum = totalCountStationCaching[i] + totalCountStation[i];
                newTotalCountStationStation.push(sum);
            }

            saveDataCaching(
                accountUser,
                `New_${dayPresent}_${monthPresent}_${yearsPresent}`,
                {
                    totalCountStation: newTotalCountStationStation,
                    listTotalCountStation: newListTotalCountStation,
                }
            );
        }
    }, [totalStatusCacheOneDay.length]);
    // ! end handle update cache one day

    // ! handle update cache
    useEffect(() => {
        if (totalStatusCache.length == lengthDeviceAccount && keyValue) {
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();
            const { totalCountStation, listTotalCountStation } =
                handleDataGeneralMonthPresent(
                    totalStatusCache,
                    keyValue,
                    lengthDeviceAccount
                );
            saveDataCaching(
                accountUser,
                `New_${dayPresent}_${monthPresent}_${yearsPresent}`,
                {
                    totalCountStation,
                    listTotalCountStation,
                }
            );
        }
    }, [totalStatusCache.length]);
    // ! end handle update cache

    // ! Init cache data
    useEffect(() => {
        if (totalStatusCacheInit.length == lengthDeviceAccount && keyValue) {
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();

            const { totalCountStation, listTotalCountStation } =
                handleDataGeneralMonthPresent(
                    totalStatusCacheInit,
                    keyValue,
                    lengthDeviceAccount
                );

            saveDataCaching(
                accountUser,
                `New_${dayPresent}_${monthPresent}_${yearsPresent}`,
                {
                    totalCountStation,
                    listTotalCountStation,
                }
            );

            const startDay = `${yearsPresent}-${monthPresent - 1}-01`; // 1-9 , 1-10  =>  31-9 | 30-9
            const endDay = moment(`${yearsPresent}-${monthPresent}-01`)
                .subtract(1, "days")
                .format("YYYY-MM-DD");

            for (let device of devices) {
                countStatusStation(device.id, startDay, endDay).then((v) => {
                    setTotalStatusPreviousCacheInit((prev) => [...prev, v]);
                });
            }
        }
    }, [totalStatusCacheInit.length]);
    // ! End  Init cache data

    // ! Init cache data previous
    useEffect(() => {
        if (
            totalStatusPreviousCacheInit.length == lengthDeviceAccount &&
            keyValue
        ) {
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();

            let listCountActive = [];
            let listCountCalif = [];
            let listCountError = [];
            let listCountOff = [];

            for (let item of totalStatusPrevious) {
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

            let totalCalif = listCountCalif.reduce((acc, v) => acc + v, 0);
            let totalError = listCountError.reduce((acc, v) => acc + v, 0);
            let totalActive = listCountActive.reduce((acc, v) => acc + v, 0);
            let totalOff = listCountOff.reduce((acc, v) => acc + v, 0);

            const totalCountStationPrev = {
                active: totalActive,
                calif: totalCalif,
                error: totalError,
                off: totalOff,
            };

            saveDataCaching(
                accountUser,
                `Previous_${monthPresent - 1}_${yearsPresent}`,
                totalCountStationPrev
            );
        }
    }, [totalStatusPreviousCacheInit.length]);
    // ! end Init cache data previous

    // useEffect(() => {
    //     if (
    //         totalStatusPrevious.length == lengthDeviceAccount &&
    //         keyValue &&
    //         !checkDataCacheLocal()
    //     ) {
    //         let listCountActive = [];
    //         let listCountCalif = [];
    //         let listCountError = [];
    //         let listCountOff = [];

    //         for (let item of totalStatusPrevious) {
    //             for (let v of item.data) {
    //                 if (v.Status == 0) {
    //                     listCountActive.push(v.Count);
    //                 } else if (v.Status == 1) {
    //                     listCountCalif.push(v.Count);
    //                 } else if (v.Status == 2) {
    //                     listCountError.push(v.Count);
    //                 } else if (v.Status == -1) {
    //                     listCountOff.push(v.Count);
    //                 }
    //             }
    //         }

    //         let totalCalif = listCountCalif.reduce((acc, v) => acc + v, 0);
    //         let totalError = listCountError.reduce((acc, v) => acc + v, 0);
    //         let totalActive = listCountActive.reduce((acc, v) => acc + v, 0);
    //         let totalOff = listCountOff.reduce((acc, v) => acc + v, 0);

    //         setTotalPresentPrev({
    //             active: totalActive,
    //             calif: totalCalif,
    //             error: totalError,
    //             off: totalOff,
    //         });

    //         localStorage.setItem(
    //             "totalCountStationPrev",
    //             JSON.stringify({
    //                 active: totalActive,
    //                 calif: totalCalif,
    //                 error: totalError,
    //                 off: totalOff,
    //             })
    //         );

    //         setLoadingPrevious(false);
    //     }
    // }, [totalStatusPrevious.length]);

    // useEffect(() => {
    //     if (checkDataCacheLocal()) {
    //         let optionDataChart = [
    //             {
    //                 name: "Hoạt động tốt",
    //                 data: listTotalCountStation.listCountActive,
    //                 color: colorStationStatus.active,
    //             },
    //             {
    //                 name: "Hiệu chuẩn",
    //                 data: listTotalCountStation.listCountCalif,
    //                 color: colorStationStatus.calif,
    //             },
    //             {
    //                 name: "Lỗi thiêt bị",
    //                 data: listTotalCountStation.listCountError,
    //                 color: colorStationStatus.error,
    //             },
    //             {
    //                 name: "Mất kết nối",
    //                 data: listTotalCountStation.listCountOff,
    //                 color: colorStationStatus.off,
    //             },
    //         ];

    //         const templateOptions = {
    //             chart: {
    //                 type: "column",
    //                 marginTop: 40,
    //             },
    //             title: {
    //                 // text: "Dữ liệu trong tháng này",
    //                 text: '<span style="font-size: 14px">Dữ liệu trong tháng này</span>',
    //                 align: "center",
    //             },
    //             xAxis: {
    //                 categories: listTotalCountStation.listStation,
    //                 labels: {
    //                     autoRotationLimit: 70,
    //                     autoRotation: false,
    //                 },
    //             },
    //             yAxis: {
    //                 min: 0,
    //                 title: {
    //                     text: "Số liệu",
    //                 },
    //                 stackLabels: {
    //                     enabled: false,
    //                 },
    //             },

    //             tooltip: {
    //                 headerFormat: "<b>{point.x}</b><br/>",
    //                 pointFormat:
    //                     "{series.name}: {point.y}<br/>Total: {point.stackTotal}",
    //             },
    //             plotOptions: {
    //                 column: {
    //                     stacking: "normal",
    //                     dataLabels: {
    //                         enabled: true,
    //                     },
    //                 },
    //             },
    //             series: optionDataChart,
    //         };

    //         setTemplateOptions(templateOptions);
    //         setTotalPresent({
    //             active: totalCountStation.active,
    //             calif: totalCountStation.calif,
    //             error: totalCountStation.error,
    //             off: totalCountStation.off,
    //         });
    //         setTotalPresentPrev({
    //             active: totalCountStationPrev.active,
    //             calif: totalCountStationPrev.calif,
    //             error: totalCountStationPrev.error,
    //             off: totalCountStationPrev.off,
    //         });
    //     }
    // }, []);

    return (
        <>
            <Paper>
                {loadingChart ? (
                    <Stack justifyContent={"center"} alignItems={"center"}>
                        <CircularProgress color="success" sx={{ my: 2 }} />
                    </Stack>
                ) : (
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={templateOptions}
                        ref={chartComponentRef}
                    />
                )}

                <>
                    {!loadingPrevious && totalPresent && totalPresentPrev && (
                        <Grid container sx={{ padding: "20px" }} spacing={2}>
                            <Grid item xs={12} md={6} xl={6} lg={6} sm={12}>
                                <CardMain
                                    title={"Tháng trước"}
                                    data={totalPresentPrev}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} xl={6} lg={6} sm={12}>
                                <CardMain
                                    title={"Tháng này"}
                                    data={totalPresent}
                                />
                            </Grid>
                        </Grid>
                    )}
                </>
            </Paper>
        </>
    );
}

export default ColumnStatus;
