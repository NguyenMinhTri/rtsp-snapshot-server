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
import {
    saveDataCaching,
    readDataCachingByAccount,
    deleteFieldDataCaching,
} from "../../actions";
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

    const [keyValue, setKeyValue] = useState(null);

    const [totalStatus, setTotalStatus] = useState([]);
    const [totalStatusPrevious, setTotalStatusPrevious] = useState([]);

    const [totalStatusCache, setTotalStatusCache] = useState([]);
    const [totalStatusCacheOneDay, setTotalStatusCacheOneDay] = useState([]);
    const [totalStatusCacheInit, setTotalStatusCacheInit] = useState([]);
    const [totalStatusPreviousCacheInit, setTotalStatusPreviousCacheInit] =
        useState([]);

    // const [dataCachingNew, setDataCachingNew] = useState(null);
    const dataCachingNew = useRef();

    const [renderData, setRenderData] = useState(false);

    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingPrevious, setLoadingPrevious] = useState(false);

    const [totalPresent, setTotalPresent] = useState(null);
    const [totalPresentPrev, setTotalPresentPrev] = useState(null);

    const lengthDeviceAccount = Object.keys(listDevice).length;

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

        // console.log({startDay, endDay})
        try {
            const result = await fcGetDataOfSensor(data);
            const resultOff = await fcGetDataOfSensorOff(data);

            const dataResult = JSON.parse(result.data.data);
            const dataOff = JSON.parse(resultOff.data.data)[0];

            let dataResultNew;
            dataResultNew = dataResult.map((item) => {
                if (item.Status == null) {
                    item.Status = 0;
                }
                return item;
            });

            return {
                data: [
                    ...dataResultNew,
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

    const saveDataLocalStore = (
        totalCountStationPrev,
        totalCountStation,
        listTotalCountStation
    ) => {
        localStorage.setItem(
            "totalCountStationPrev",
            JSON.stringify(totalCountStationPrev)
        );
        localStorage.setItem(
            "totalCountStation",
            JSON.stringify(totalCountStation)
        );
        localStorage.setItem(
            "listTotalCountStation",
            JSON.stringify(listTotalCountStation)
        );
    };

    const saveNewDataInfoLocal = (totalCountStation, listTotalCountStation) => {
        localStorage.setItem(
            "totalCountStation",
            JSON.stringify(totalCountStation)
        );
        localStorage.setItem(
            "listTotalCountStation",
            JSON.stringify(listTotalCountStation)
        );
    };

    const saveNewDataInfoLocalPrev = (totalCountStationPrev) => {
        localStorage.setItem(
            "totalCountStationPrev",
            JSON.stringify(totalCountStationPrev)
        );
    };

    const getDataLocalStore = () => {
        let totalCountStationPrevGet = null;
        let totalCountStationGet = null;
        let listTotalCountStationGet = null;

        if (localStorage.getItem("totalCountStationPrev")) {
            totalCountStationPrevGet = JSON.parse(
                localStorage.getItem("totalCountStationPrev")
            );
        }

        if (localStorage.getItem("totalCountStation")) {
            totalCountStationGet = JSON.parse(
                localStorage.getItem("totalCountStation")
            );
        }
        if (localStorage.getItem("listTotalCountStation")) {
            listTotalCountStationGet = JSON.parse(
                localStorage.getItem("listTotalCountStation")
            );
        }

        return {
            totalCountStationPrevGet,
            totalCountStationGet,
            listTotalCountStationGet,
        };
    };

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

    const handleCachingUpdateData = (devices) => {
        const { dayPresent, monthPresent, yearsPresent } = handelTimePresent();

        localStorage.setItem(
            "timePresent",
            JSON.stringify({
                dayPresent,
                monthPresent,
                yearsPresent,
            })
        );

        readDataCachingByAccount(accountUser).then((v) => {
            if (v.length > 1) {
                let dataNewCache = null;
                let dataOldCache = null;

                for (let item of v) {
                    if (item.month.split("_")[0] == "New") {
                        dataNewCache = item;
                        dataCachingNew.current = item;
                    } else {
                        dataOldCache = item;
                    }
                }
                if (dataNewCache) {
                    const { dayCache, monthCache, yearCache } = handleSplitData(
                        dataNewCache.month
                    );
                    const {
                        dayCache: dayCacheOld,
                        monthCache: monthCacheOld,
                        yearCache: yearCacheOld,
                    } = handleSplitData(dataOldCache.month);

                    if (monthPresent == monthCache) {
                       


                        if (dayCache != dayPresent) {
                            // call data for day present after save = save + present
                            const startDay = `${yearsPresent}-${monthPresent}-${
                                dayPresent - 1
                            }`;
                            const endDay = `${yearsPresent}-${monthPresent}-${dayPresent}`;

                            deleteFieldDataCaching(
                                accountUser,
                                `New_${dayCache}_${monthCache}_${yearCache}`
                            );

                            saveNewDataInfoLocalPrev(dataOldCache);

                            if (
                                !dataCachingNew.current.listTotalCountStation ||
                                !dataCachingNew.current.totalCountStation
                            ) {
                                const startDay = `${yearsPresent}-${monthPresent}-01`;
                                const endDay = `${yearsPresent}-${monthPresent}-${dayPresent}`;
                                for (let device of devices) {
                                    countStatusStation(
                                        device.id,
                                        startDay,
                                        endDay
                                    ).then((v) => {
                                        setTotalStatusCacheInit((prev) => [
                                            ...prev,
                                            v,
                                        ]);
                                    });
                                }

                                return;
                            }

                            // call data init
                            // const startDay2 = `${yearsPresent}-${monthPresent}-01`;
                            // const endDay2 = `${yearsPresent}-${monthPresent}-${dayPresent}`;
                            // for (let device of devices) {
                            //     countStatusStation(
                            //         device.id,
                            //         startDay2,
                            //         endDay2
                            //     ).then((v) => {
                            //         setTotalStatusCacheInit((prev) => [
                            //             ...prev,
                            //             v,
                            //         ]);
                            //     });
                            // }

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
                        }
                    } else {
                        // sang nghĩa ra đã sang thang mới =>  change previous data = last data new
                        const startDay = `${yearsPresent}-${monthPresent}-01`;
                        const endDay = `${yearsPresent}-${monthPresent}-${dayPresent}`;

                        deleteFieldDataCaching(
                            accountUser,
                            `New_${dayCache}_${monthCache}_${yearCache}`
                        );
                        deleteFieldDataCaching(
                            accountUser,
                            `Old_${dayCacheOld}_${monthCacheOld}_${yearCacheOld}`
                        );

                        for (let device of devices) {
                            countStatusStation(
                                device.id,
                                startDay,
                                endDay
                            ).then((v) => {
                                setTotalStatusCache((prev) => [...prev, v]);
                            });
                        }

                        saveNewDataInfoLocalPrev(
                            dataNewCache.totalCountStation
                        );
                        saveDataCaching(
                            accountUser,
                            `Previous_${monthCache}_${yearCache}`,
                            dataNewCache.totalCountStation
                        );
                    }
                } else {
                    const startDay = `${yearsPresent}-${monthPresent}-01`;
                    const endDay = `${yearsPresent}-${monthPresent}-${dayPresent}`;
                    for (let device of devices) {
                        countStatusStation(device.id, startDay, endDay).then(
                            (v) => {
                                setTotalStatusCacheInit((prev) => [...prev, v]);
                            }
                        );
                    }
                }
            } else {
                // call data init
                const startDay = `${yearsPresent}-${monthPresent}-01`;
                const endDay = `${yearsPresent}-${monthPresent}-${dayPresent}`;
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

    useEffect(() => {
        if (listDevice) {
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();

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
            if (keyValue) {
                setKeyValue(keyValue);
            }
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
        if (devices && devices.length > 0) {
            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();

            // !  !LC =>  FS  =>  check day, check month => set LC => render
            // !                  call   handleCachingUpdateData

            const timeLocalPresent = JSON.parse(
                localStorage.getItem("timePresent")
            );

            const {
                totalCountStationPrevGet,
                totalCountStationGet,
                listTotalCountStationGet,
            } = getDataLocalStore();
            

            if (timeLocalPresent &&
                totalCountStationPrevGet &&
                totalCountStationGet &&
                listTotalCountStationGet
            ) {
                if (
                    totalCountStationPrevGet &&
                    totalCountStationGet &&
                    listTotalCountStationGet &&
                    timeLocalPresent.dayPresent == dayPresent &&
                    timeLocalPresent.monthPresent == monthPresent &&
                    timeLocalPresent.yearsPresent == yearsPresent
                ) {
                    setRenderData(!renderData);
                } else {
                    readDataCachingByAccount(accountUser).then((v) => {
                        if (v && v.length > 1) {
                            let dataNewCache = null;
                            let dataOldCache = null;

                            for (let item of v) {
                                if (item.month.split("_")[0] == "New") {
                                    dataNewCache = item;
                                } else {
                                    dataOldCache = item;
                                }
                            }
                            if (dataNewCache && dataOldCache) {
                                const { dayCache, monthCache, yearCache } =
                                    handleSplitData(dataNewCache.month);
                                if (
                                    dayPresent == dayCache &&
                                    monthPresent == monthCache &&
                                    yearsPresent == yearCache
                                ) {
                                    saveDataLocalStore(
                                        dataOldCache,
                                        dataNewCache.totalCountStation,
                                        dataNewCache.listTotalCountStation
                                    );

                                    setRenderData(!renderData);
                                } else {
                                    handleCachingUpdateData(devices);
                                }
                            } else {
                                handleCachingUpdateData(devices);
                            }
                        } else {
                            handleCachingUpdateData(devices);
                        }
                    });
                }
            } else {
                readDataCachingByAccount(accountUser).then((v) => {
                    if (v && v.length > 1) {
                        let dataNewCache = null;
                        let dataOldCache = null;

                        for (let item of v) {
                            if (item.month.split("_")[0] == "New") {
                                dataNewCache = item;
                            } else {
                                dataOldCache = item;
                            }
                        }
                        if (dataNewCache && dataOldCache) {
                            const { dayCache, monthCache, yearCache } =
                                handleSplitData(dataNewCache.month);
                            if (
                                dayPresent == dayCache &&
                                monthPresent == monthCache &&
                                yearsPresent == yearCache
                            ) {
                                saveDataLocalStore(
                                    dataOldCache,
                                    dataNewCache.totalCountStation,
                                    dataNewCache.listTotalCountStation
                                );

                                setRenderData(!renderData);
                            } else {
                                handleCachingUpdateData(devices);
                            }
                        } else {
                            handleCachingUpdateData(devices);
                        }
                    } else {
                        handleCachingUpdateData(devices);
                    }
                });
            }
        }
    }, [devices]);

    const handleSumTwoArray = (arr1, arr2) => {
        const maxLength = Math.max(arr1.length, arr2.length);
        const result = [];

        for (let i = 0; i < maxLength; i++) {
            const num1 = arr1[i] || 0;
            const num2 = arr2[i] || 0;
            const sum = num1 + num2;
            result.push(sum);
        }

        return result;
    };

    // ! handle update cache one day
    useEffect(() => {
        if (totalStatusCacheOneDay.length == lengthDeviceAccount && keyValue) {

            const { dayPresent, monthPresent, yearsPresent } =
                handelTimePresent();
            
            const { totalCountStation, listTotalCountStation } =
                handleDataGeneralMonthPresent(
                    totalStatusCacheOneDay,
                    keyValue,
                    lengthDeviceAccount
                );
           

            // ! add zero if 2 array not equal

            const {
                listCountActive: listCountActiveC,
                listCountCalif: listCountCalifC,
                listCountError: listCountErrorC,
                listCountOff: listCountOffC,
            } = dataCachingNew.current.listTotalCountStation;
            const {
                active: activeC,
                error: errorC,
                calif: califC,
                off: offC,
            } = dataCachingNew.current.totalCountStation;

         

            const {
                listCountActive,
                listCountCalif,
                listCountError,
                listCountOff,
            } = listTotalCountStation;
            const { active, error, calif, off } = totalCountStation;

            const newListCountActive = handleSumTwoArray(
                listCountActiveC,
                listCountActive
            );
            const newListCountCalif = handleSumTwoArray(
                listCountCalifC,
                listCountCalif
            );
            const newListCountError = handleSumTwoArray(
                listCountErrorC,
                listCountError
            );
            const newListCountOff = handleSumTwoArray(
                listCountOffC,
                listCountOff
            );

            const newTotalActive = active + activeC;
            const newTotalCalif = calif + califC;
            const newTotalError = error + errorC;
            const newTotalOff = off + offC;

           

            saveNewDataInfoLocal(
                {
                    active: newTotalActive,
                    calif: newTotalCalif,
                    error: newTotalError,
                    off: newTotalOff,
                },
                {
                    listCountActive: newListCountActive,
                    listCountCalif: newListCountCalif,
                    listCountError: newListCountError,
                    listCountOff: newListCountOff,
                }
            );

            saveDataCaching(
                accountUser,
                `New_${dayPresent}_${monthPresent}_${yearsPresent}`,
                {
                    totalCountStation: {
                        active: newTotalActive,
                        calif: newTotalCalif,
                        error: newTotalError,
                        off: newTotalOff,
                    },
                    listTotalCountStation: {
                        listCountActive: newListCountActive,
                        listCountCalif: newListCountCalif,
                        listCountError: newListCountError,
                        listCountOff: newListCountOff,
                    },
                }
            );

            setRenderData(!renderData);
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

            saveNewDataInfoLocal(totalCountStation, listTotalCountStation);

            saveDataCaching(
                accountUser,
                `New_${dayPresent}_${monthPresent}_${yearsPresent}`,
                {
                    totalCountStation,
                    listTotalCountStation,
                }
            );
            setRenderData(!renderData);
        }
    }, [totalStatusCache.length]);

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
            saveNewDataInfoLocal(totalCountStation, listTotalCountStation);
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
            setRenderData(!renderData);
            setRenderData(!renderData);
        }
    }, [totalStatusCacheInit.length]);

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

            for (let item of totalStatusPreviousCacheInit) {
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

            saveNewDataInfoLocalPrev(totalCountStationPrev);

            saveDataCaching(
                accountUser,
                `Previous_${monthPresent - 1}_${yearsPresent}`,
                totalCountStationPrev
            );

            setRenderData(!renderData);
        }
    }, [totalStatusPreviousCacheInit.length]);
    // ! end Init cache data previous

    useEffect(() => {
        const {
            totalCountStationPrevGet,
            totalCountStationGet,
            listTotalCountStationGet,
        } = getDataLocalStore();

       

        if (
            listTotalCountStationGet &&
            totalCountStationGet &&
            totalCountStationPrevGet
        ) {
            const options = [
                {
                    name: "Hoạt động tốt",
                    data: listTotalCountStationGet.listCountActive,
                    color: colorStationStatus.active,
                },
                {
                    name: "Hiệu chuẩn",
                    data: listTotalCountStationGet.listCountCalif,
                    color: colorStationStatus.calif,
                },
                {
                    name: "Lỗi thiêt bị",
                    data: listTotalCountStationGet.listCountError,
                    color: colorStationStatus.error,
                },
                {
                    name: "Mất kết nối",
                    data: listTotalCountStationGet.listCountOff,
                    color: colorStationStatus.off,
                },
            ];


            const templateOptions = {
                chart: {
                    type: "column",
                    marginTop: 40,
                },
                exporting: {
                    enabled: false,
                },

                title: {
                    // text: "Dữ liệu trong tháng này",
                    text: '<span style="font-size: 14px">Dữ liệu trong tháng này</span>',
                    align: "center",
                },
                xAxis: {
                    categories: listTotalCountStationGet.listStation,
                    labels: {
                        autoRotationLimit: 70,
                        autoRotation: false,
                    },
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: "Số liệu",
                    },
                    stackLabels: {
                        enabled: false,
                    },
                },

                tooltip: {
                    headerFormat: "<b>{point.x}</b><br/>",
                    pointFormat:
                        "{series.name}: {point.y}<br/>Total: {point.stackTotal}",
                },
                plotOptions: {
                    column: {
                        stacking: "normal",
                        dataLabels: {
                            enabled: true,
                        },
                    },
                },
                series: options,
            };

            setTemplateOptions(templateOptions);
            setTotalPresent(totalCountStationGet);
            setTotalPresentPrev(totalCountStationPrevGet);
        }
    }, [renderData]);

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
