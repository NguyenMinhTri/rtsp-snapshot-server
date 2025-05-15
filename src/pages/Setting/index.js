import {
    Autocomplete,
    Box,
    Button,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from "@mui/material";
import React, { useEffect, useRef } from "react";
import SubHeader from "../../components/SubHeader";

import { collection, onSnapshot } from "firebase/firestore";

import { child, get, getDatabase, ref } from "firebase/database";

import moment from "moment/moment";
import { useState } from "react";
import BackDropLoading from "../../components/BackDropLoading";
import { dbStore } from "../../config/firebase";

import Toast from "../../utils/toasts";
import {
    COLLECTION_SETTING_THRESHOLD,
    deleteFieldSensor,
    readDataByStation,
    saveDataSetting,
} from "./actions";
import { colorStationStatus } from "../../constants";
import useListDevice from "../../hooks/useListDevice";
import asyncLocalStorage from "../../utils/async_localstorage";

let columns = [
    { id: "stt", label: "STT", align: "center", minWidth: 50 },
    {
        id: "sensor",
        label: "Cảm biến",
        minWidth: 100,
        align: "center",
    },

    {
        id: "min",
        label: "Min",
        minWidth: 100,
        align: "center",
    },
    {
        id: "max",
        label: "Max",
        minWidth: 100,
        align: "center",
    },
    {
        id: "time",
        label: "Thời gian",
        minWidth: 100,
        align: "center",
        format: (value) => value.toLocaleString("en-US", { timeZone: "UTC" }),
    },
    {
        id: "action",
        label: "Hành động",
        minWidth: 100,
        align: "center",
    },
];

function SettingPage() {
    const db = ref(getDatabase());
    const deviceUser = localStorage.getItem("device_user");
    let listDevicePure;

    if (deviceUser !== "undefined") {
        listDevicePure = JSON.parse(deviceUser);
    } else {
        navigate("/nothing");
    }
    const [deviceTypeChange, setDeviceTypeChange] = useState("");


    const { deviceType, devices : listDevice } = useListDevice(deviceTypeChange);

    useEffect(() => {
        asyncLocalStorage.getItem(
            "home_station").then((v) => {
                
        });
    },[])


    useEffect(() => {
        if (listDevicePure) {
            const id = Object.keys(listDevicePure);
            let d = [];
            let keyValue = {};

            id.map((v) => {
                d.push({
                    id: v,
                    label: listDevicePure[v]["FullName"],
                    deviceType : listDevicePure[v]["DeviceType"]
                });

                let obj = {
                    [v]: listDevicePure[v]["FullName"],
                };
                keyValue[v] = listDevicePure[v]["FullName"];

                const key = `SettingThreshold_${v}`;
                const existGetSettingThreshold = localStorage.getItem(key);

                if (!existGetSettingThreshold) {
                    readDataByStation(v).then((s) => {
                        if (s && s.length) {
                            localStorage.setItem(
                                `SettingThreshold_${v}`,
                                JSON.stringify(s)
                            );
                        }
                    });
                }
            });

            // localStorage.setItem("listDeviceWithIdAndLabel", JSON.stringify(d));
            localStorage.setItem(
                "listDeviceWithKeyAndLabel",
                JSON.stringify(keyValue)
            );
            // listDevice = JSON.parse(
            //     localStorage.getItem("listDeviceWithIdAndLabel")
            // );
            setValue(Array.isArray(listDevice) ? listDevice[1] : {});
            setInputValue(Array.isArray(listDevice) ? listDevice[1] : {});
            // setListDevice(listDevice);
        } else {
            Toast("");
        }
    }, []);

    // let [listDevice, setListDevice] = useState([]);

    const [value, setValue] = useState([]);
    const [inputValue, setInputValue] = useState({});

    const [settingValueMin, setSettingValueMin] = useState([]);
    const [settingValueMax, setSettingValueMax] = useState([]);
    const [settingValueTime, setSettingValueTime] = useState([]);

    const [listSensorByStation, setListSensorByStation] = useState();
    const [loading, setLoading] = useState(false);
    const [loadingInit, setLoadingInit] = useState(false);

    const [reRender, setReRender] = useState(false);

    const handleOnChangeSelectStation = (e, newInputValue) => {
        if (newInputValue) {
            setValue(newInputValue);
        }
    };

    const handleOnchangeSelectDeviceType = (e, v) => {
        setValue("")
        setDeviceTypeChange(v);
    };
    console.log({listDevice})


    useEffect(() => {
        if (value) {
            get(child(db, `Devices/DAIVIET-RS485/${value.id}`)).then(
                (snapshot) => {
                    if (snapshot.exists()) {
                        let { RS485Data } = snapshot.val();
                        let listSensor = [];
                        for (let item of RS485Data) {
                            listSensor.push({
                                stt: 1,
                                sensor: item.Name,
                                max: null,
                                min: null,
                                time: moment(new Date()).format(
                                    "DD/MM/YYYY HH:mm:ss"
                                ),
                            });
                        }
                        setListSensorByStation(listSensor);
                    }
                }
            );
        }
    }, [value]);

    const handleUpdateCacheSetting = () => {
        readDataByStation(value.id).then((s) => {
            if (s && s.length) {
                localStorage.setItem(
                    `SettingThreshold_${value.id}`,
                    JSON.stringify(s)
                );
            }
        });
    };

    const handleConfirmSetting = (sensor) => {
        let valueMin = "";
        let valueMax = "";
        for (let item of settingValueMin) {
            if (item.sensor == sensor) {
                valueMin = item.min;
            }
        }
        for (let item of settingValueMax) {
            if (item.sensor == sensor) {
                valueMax = item.max;
            }
        }

        if (!valueMin) {
            return Toast("warning", "Vui lòng nhập ngưỡng MIN");
        }
        if (!valueMax) {
            return Toast("warning", "Vui lòng nhập ngưỡng MAX");
        }
        setLoading(true);
        saveDataSetting(value.id, sensor, {
            min: valueMin,
            max: valueMax,
            time: moment(new Date()).format("DD/MM/YYYY HH:mm:ss"),
        })
            .then((v) => {
                handleUpdateCacheSetting();

                Toast(
                    "success",
                    `Cài đặt ngưỡng cho cảm biến ${sensor} thành công`
                );
                setLoading(false);
            })
            .catch((e) => {
                setLoading(false);
                return Toast("error", "Có lỗi xảy ra");
            });
    };

    const handleResetSetting = (sensor) => {
        deleteFieldSensor(value.id, sensor).then(() => {
            Toast("success", `Reset cài đặt cho cảm biến ${sensor} thành công`);
            handleUpdateCacheSetting();
        });
    };

    const handleOnchangeInputMin = (e, sensor) => {
        const exist = settingValueMin.some((v) => v.sensor == sensor);
        setReRender(!reRender);
        if (exist) {
            let temp;
            temp = settingValueMin.map((v) =>
                v.sensor == sensor ? { sensor: sensor, min: e.target.value } : v
            );
            setSettingValueMin(temp);
            return;
        } else {
            settingValueMin.push({
                min: e.target.value,
                sensor,
            });

            setSettingValueMin(settingValueMin);
        }
    };

    const handleOnchangeInputMax = (e, sensor) => {
        setReRender(!reRender);
        const exist = settingValueMax.some((v) => v.sensor == sensor);
        if (exist) {
            let temp;
            temp = settingValueMax.map((v) =>
                v.sensor == sensor ? { sensor: sensor, max: e.target.value } : v
            );
            setSettingValueMax(temp);
        } else {
            settingValueMax.push({
                max: e.target.value,
                sensor,
            });
            setSettingValueMax(settingValueMax);
        }
    };

    const handleValueInputMin = (sensor) => {
        let value = 0;
        if (settingValueMin.length > 0) {
            settingValueMin.forEach((v) => {
                if (v.sensor == sensor) {
                    value = v.min;
                }
            });
        }

        return value;
    };

    const valueMin = useRef();

    const handleValueInputMax = (sensor) => {
        let value = 0;
        if (settingValueMax.length > 0) {
            settingValueMax.forEach((v) => {
                if (v.sensor == sensor) {
                    value = v.max;
                }
            });
        }
        valueMin.current = value;
        return value;
    };
    const handleValueTime = (sensor) => {
        let value = null;
        if (settingValueTime.length > 0) {
            settingValueTime.forEach((v) => {
                if (v.sensor == sensor) {
                    value = v.time;
                }
            });
        }
        return value;
    };

    useEffect(() => {
        if (value && typeof value.id !== "undefined") {
            setLoadingInit(true);
            const unsubscribe = onSnapshot(
                collection(dbStore, COLLECTION_SETTING_THRESHOLD, value.id),
                (doc) => {
                    let listMin = [];
                    let listMax = [];
                    let listTime = [];
                    doc.forEach((doc) => {
                        const valueStore = doc.data();
                        listMin.push({
                            sensor: doc.id,
                            min: valueStore.min,
                        });
                        listMax.push({
                            sensor: doc.id,
                            max: valueStore.max,
                        });
                        listTime.push({
                            sensor: doc.id,
                            time: valueStore.time,
                        });
                    });

                    setLoadingInit(false);

                    setSettingValueMin(listMin);
                    setSettingValueMax(listMax);

                    setSettingValueTime(listTime);
                }
            );
            return () => {
                unsubscribe();
            };
        }
    }, [value]);

    return Array.isArray(listDevice) ? (
        <Box sx={{ padding: "10px" }}>
            {loadingInit && <BackDropLoading />}
            <SubHeader text={"CÀI ĐẶT NGƯỠNG CHO TỪNG CẢM BIẾN CỦA TRẠM"} />
            <Box
                style={{
                    border: "1.5px solid #ccc",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "white",
                    fontWeight: "600",
                    borderRadius: "3px",
                }}
            >
                <Grid container spacing={1}>

                <Grid item xl={3} lg={3} md={12} sm={12} xs={12}>
                        <Autocomplete
                            id="controllable-states-2"
                            size="small"
                            color="success"
                            onChange={handleOnchangeSelectDeviceType}
                            options={deviceType}
                            value={deviceTypeChange || null}
                            renderInput={(params) => (
                                <TextField {...params} label="Chọn loại trạm" />
                            )}
                        />
                    </Grid>

                    <Grid item xl={3} lg={3} md={12} sm={12} xs={12}>
                        <Autocomplete
                            disablePortal
                            id="controllable-states-demo-21"
                            size="small"
                            color="success"
                            onChange={handleOnChangeSelectStation}
                            // getOptionLabel={(option) => option?.label}
                            options={listDevice}
                            value={value}
                            fullWidth={true}
                            inputValue={inputValue}
                            onInputChange={(event, newInputValue) => {
                                setInputValue(newInputValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth={true}
                                    label="Chọn trạm để cài đặt ngưỡng"
                                />
                            )}
                        />

                    </Grid>

                    
                </Grid>
            </Box>

            <Paper>
                <TableContainer className="my_table">
                    <Table>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        sx={{ fontSize: "16px" }}
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {value && listSensorByStation &&
                                listSensorByStation.length > 0 ?
                                listSensorByStation.map((row, index) => (
                                    <TableRow hover tabIndex={-1} key={index}>
                                        <TableCell
                                            sx={{ fontSize: "16px" }}
                                            align={"center"}
                                        >
                                            {index + 1}
                                        </TableCell>
                                        <TableCell
                                            sx={{ fontSize: "16px" }}
                                            align={"center"}
                                        >
                                            {row.sensor}
                                        </TableCell>

                                        <TableCell
                                            sx={{ fontSize: "16px" }}
                                            align={"center"}
                                        >
                                            <TextField
                                                id={`${value.id}-min-${row.sensor}`}
                                                variant="outlined"
                                                size="small"
                                                color={"success"}
                                                fullWidth={true}
                                                value={handleValueInputMin(
                                                    row.sensor
                                                )}
                                                onChange={(e) =>
                                                    handleOnchangeInputMin(
                                                        e,
                                                        row.sensor
                                                    )
                                                }
                                                style={{
                                                    width: "150px",
                                                    backgroundColor:
                                                        handleValueInputMin(
                                                            row.sensor
                                                        )
                                                            ? colorStationStatus.active
                                                            : colorStationStatus.off,
                                                }}
                                                inputProps={{
                                                    style: {
                                                        textAlign: "center",
                                                        fontWeight: 800,
                                                        fontSize: "18px",
                                                        color: "white",
                                                    },
                                                }}
                                                type="number"
                                            />
                                        </TableCell>

                                        <TableCell
                                            sx={{ fontSize: "16px" }}
                                            align={"center"}
                                        >
                                            <TextField
                                                id={`${value.id}-max-${row.sensor}`}
                                                variant="outlined"
                                                size="small"
                                                fullWidth={true}
                                                color="success"
                                                value={handleValueInputMax(
                                                    row.sensor
                                                )}
                                                onChange={(e) =>
                                                    handleOnchangeInputMax(
                                                        e,
                                                        row.sensor
                                                    )
                                                }
                                                style={{
                                                    width: "150px",
                                                    backgroundColor:
                                                        handleValueInputMax(
                                                            row.sensor
                                                        )
                                                            ? colorStationStatus.active
                                                            : colorStationStatus.off,
                                                }}
                                                inputProps={{
                                                    style: {
                                                        textAlign: "center",
                                                        fontWeight: 800,
                                                        fontSize: "18px",
                                                        color: "white",
                                                    },
                                                }}
                                                type="number"
                                            />
                                        </TableCell>
                                        <TableCell
                                            sx={{ fontSize: "16px" }}
                                            align={"center"}
                                        >
                                            {handleValueTime(row.sensor)
                                                ? handleValueTime(row.sensor)
                                                : row.time}
                                        </TableCell>
                                        <TableCell
                                            sx={{ fontSize: "16px" }}
                                            align={"center"}
                                        >
                                            <Stack
                                                direction={"row"}
                                                spacing={1}
                                                justifyContent={"center"}
                                            >
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    style={{
                                                        backgroundColor:
                                                            "#088f81",
                                                    }}
                                                    disabled={loading}
                                                    onClick={() =>
                                                        handleConfirmSetting(
                                                            row.sensor
                                                        )
                                                    }
                                                >
                                                    CONFIRM
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    disabled={loading}
                                                    onClick={() =>
                                                        handleResetSetting(
                                                            row.sensor
                                                        )
                                                    }
                                                >
                                                    RESET
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )) : <p
                                    style={{
                                        textAlign: "center",
                                        fontSize: "18px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        margin : '20px 0'
                                    }}
                                >
                                   
                                        <span>Chọn trạm để cài đặt</span>
                                </p>}
                        </TableBody>
                    </Table>
                </TableContainer>
                
            </Paper>
            
        </Box>
    ) : (
        <div></div>
    );
}

export default SettingPage;
