import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import "../../components/Layout/Header";
import "./Monitor.scss";

import { getDatabase, onValue, ref, get, child } from "firebase/database";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Autocomplete, Button, Grid, TextField } from "@mui/material";

import Loading from "../../components/Loading";
import MySelect from "../../components/MySelect";
import MyTable from "../../components/MyTable";
import SubHeader from "../../components/SubHeader";
import compareDate from "../../utils/compare_date";
import { getUniqueListBy } from "../../utils/function";
import { dbStore, messaging, onMessageListener } from "../../config/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../config/firebase";
import { dataSensorRealTime } from "../../redux/reducer/dataSensorSlice";
import getDataOfSensorRealtime from "../../utils/getRangeData";
import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    collection,
} from "firebase/firestore";
import { TIME_DEVICE_OFF, colorStationStatus } from "../../constants";
import { handleGetSettingThreshold } from "../../utils/handleGetSettingThreshold";
import { handleDataMainForTable } from "../../utils/handleDataMainForTable";
import { styleStateValue } from "../../utils/styleStateValue";
let columns = [
    { id: "stt", label: "#", align: "center", minWidth: 50 },
    { id: "status", label: "Status", align: "center" },
    {
        id: "station",
        label: "Tên trạm",
        minWidth: 150,
        align: "left",
    },

    {
        id: "time",
        label: "Thời gian",
        minWidth: 150,
        align: "center",
        format: (value) => value.toLocaleString("en-US", { timeZone: "UTC" }),
    },
];

function Monitor() {
    const [dataChange, setDataChange] = useState(false);
    const dispatch = useDispatch();
    const [valueSelect, setValueSelect] = useState("");
    const [menuValue, setMenuSelect] = useState([]);
    const [detailMonitor, setDetailMonitor] = useState(null);
    const [monitorAll, setMonitorAll] = useState(true);
    const [deviceTypeValue, setDeviceTypeChoose] = useState("");

    const columnTypeRender = useRef();
    const columnTypeRef = useRef();

    const [listDeviceType, setListDeviceType] = useState([]);

    const dataRenderFinal = useRef();

    let allSettingData = {};
    // handle data realtime
    const db = getDatabase();
    const dataRealTime = useRef([]);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);

    const columOriginal = useRef();

    columOriginal.current = columns;

    let devices = [];
    useEffect(() => {
        if (listDevice) {
            const id = Object.keys(listDevice);
            let listTypeDevice = new Set();
            id.map((v) => {
                devices.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                    type: listDevice[v]["DeviceType"],
                });
                listTypeDevice.add(listDevice[v]["DeviceType"]);
            });
            setListDeviceType([...listTypeDevice]);
        }
        setMenuSelect(devices);
    }, []);

    // get data
    useEffect(() => {
        if (devices && devices.length > 0) {
            devices.map((v) => {
                return onValue(
                    ref(db, `Devices/DAIVIET-RS485/${v.id}`),
                    async (snapshot) => {
                        // console.log(snapshot.val());
                        let { RS485Data, Location, LastTime } = snapshot.val();
                        // console.log({monitor : RS485Data, Location})
                        RS485Data = RS485Data.filter(
                            (item) => item.MemoryType === 1 && !item.IsColumn
                        );
                        Location = v.id;

                        let lastTime = moment(LastTime.slice(0, -1)).format(
                            "HH:mm DD/MM/YYYY"
                        );
                        let timeC = moment(LastTime.slice(0, -1)).format(
                            "HH:mm"
                        );
                        let timeP = moment(Date())
                            .subtract(TIME_DEVICE_OFF, "minutes")
                            .format("HH:mm");

                        let dateC = moment(LastTime.slice(0, -1)).format(
                            "MM/DD/YYYY"
                        );
                        let dateP = moment(Date()).format("MM/DD/YYYY");

                        let compare = compareDate(dateC, dateP);

                        if (typeof allSettingData[v.id] === "undefined") {
                            allSettingData[v.id] = {};
                            for (var i = 0; i < RS485Data.length; i++) {
                                let sensorItem = RS485Data[i];
                                allSettingData[v.id][sensorItem.GroupName] =
                                    sensorItem.GroupName;
                            }
                            // console.log(allSettingData[v.id]);
                            //
                            for (let groupName in allSettingData[v.id]) {
                                // console.log(groupName);
                                const querySnapshot = await getDocs(
                                    collection(
                                        dbStore,
                                        `SensorSettings/${Location}/${groupName}`
                                    )
                                );
                                allSettingData[v.id][groupName] = querySnapshot;
                            }
                        }
                        for (let i = 0; i < RS485Data.length; i++) {
                            let sensorItem = RS485Data[i];
                            sensorItem.AlarmSetting = {};
                            for (let groupName in allSettingData[v.id]) {
                                allSettingData[v.id][groupName].forEach(
                                    (doc) => {
                                        if (doc.id === sensorItem.Name) {
                                            const dataSetting = doc.data();
                                            sensorItem.AlarmSetting =
                                                dataSetting;
                                        }
                                        // console.log(doc.id, " => ", doc.data());
                                    }
                                );
                            }
                        }

                        RS485Data.forEach((element) => {
                            const unitRender = element?.Unit
                                ? `(${element?.Unit})`
                                : "";

                            const objWithIdFlowOut = columns.find(
                                (column) => column.id === element.Name
                            );
                            if (typeof objWithIdFlowOut === "undefined") {
                                const unitRender = element?.Unit
                                    ? `(${element?.Unit})`
                                    : "";

                                columns.push({
                                    id: element.Name,
                                    label: element.Name + unitRender,
                                    minWidth: 100,
                                    align: "center",
                                });
                            }
                        });

                        // console.log({check : snapshot.val()})

                        dataRealTime.current.push({
                            id_station: v.id,
                            data_sensor: RS485Data,
                            location: Location,
                            last_time: lastTime,
                            full_name: v.label,
                            deviceType: v.type,
                            // status_station: (timeC < timeP || compare === 1)
                            //         ? `OFF*${"NOOK"}`
                            //         : `ON*${"0"}`,
                            status_station:
                                typeof snapshot.val().IsSendingAlarm !==
                                    "undefined" &&
                                snapshot.val().IsSendingAlarm === true
                                    ? `OFF*${"NOOK"}`
                                    : timeC < timeP || compare === 1
                                    ? `OFF*${"NOOK"}`
                                    : `ON*${"0"}`,
                        });
                        setDataChange({
                            last_time: LastTime,
                        });
                    }
                );
            });
        }
    }, []);

    // handle get setting threshold

    // handle data get
    let arr = useRef();
    let rows;
    if (dataChange) {
        arr.current = getUniqueListBy(dataRealTime.current, "location");
        rows = handleDataMainForTable(arr.current);

        // monitor all filter here 
        // filter data `rows` 
        //
        //
        //
        //
        //
        //
        //

       
    }

    const handleOnChangeSelectStation = (e, v) => {
        // console.log(v);
        if (v !== null) {
            setValueSelect(v);
            setMonitorAll(false);
            setDeviceTypeChoose("");
        }
    };
    //! one status

    if (valueSelect && !monitorAll) {
        let result = rows.filter((v2) => v2.id_station == valueSelect.id);
        // console.log({})
        // console.log({ result });
        const temp = [];
        result.map((v) => {
            for (let item in v) {
                temp.push({
                    id: item.trim(),
                    label: `${item.trim()}(${
                        v[item].split("*")[v[item].split("*").length - 1]
                    })`,
                    minWidth: 100,
                    align: "center",
                });
            }
        });
        const newResult = result.map((v, index) => {
            return {
                ...v,
                stt: String(index + 1),
            };
        });
        columnTypeRef.current = temp;
        dataRenderFinal.current = newResult;
    }

    //! device type

    if (deviceTypeValue && !monitorAll) {
        let result = rows.filter((v2) => v2.deviceType == deviceTypeValue);
    
        const newResult = result.map((v, index) => {
            return {
                ...v,
                stt: String(index + 1),
            };
        });

        // monitor by device type filter here
        // filter data `newResult`
        //
        //
        //
        //
        //
        //
        //


        dataRenderFinal.current = newResult;
        const temp = [];
        result.map((v) => {
            for (let item in v) {
                temp.push({
                    id: item.trim(),
                    label: `${item.trim()}(${
                        v[item].split("*")[v[item].split("*").length - 1]
                    })`,
                    minWidth: 100,
                    align: "center",
                });
            }
        });

        columnTypeRef.current = temp;
    }

    const handleOnchangeDeviceType = (e, v) => {
        if (v !== null) {
            setDeviceTypeChoose(v);
            setMonitorAll(false);
            setValueSelect("");
        }
    };

    if (columnTypeRef.current) {
        const cooo = getUniqueListBy(columnTypeRef.current, "id");
        const newC = [
            { id: "stt", label: "#", align: "center", minWidth: 50 },
            { id: "status", label: "Status", align: "center" },
            {
                id: "station",
                label: "Tên trạm",
                minWidth: 150,
                align: "left",
            },
            {
                id: "time",
                label: "Thời gian",
                minWidth: 150,
                align: "center",
                format: (value) =>
                    value.toLocaleString("en-US", { timeZone: "UTC" }),
            },
        ];
        const fieldDelete = [
            "stt",
            "view",
            "status",
            "deviceType",
            "Total",
            "id_station",
            "time",
            "station",
        ];
        cooo.map((v) => {
            if (!fieldDelete.includes(v.id)) {
                newC.push(v);
            }
        });

        columnTypeRender.current = [
            ...newC,
            {
                id: "quickview",
                label: "Liên kết",
                minWidth: 100,
                align: "center",
            },
        ];
        // columns = newC;
    }

    const handleMonitorAll = () => {
        setMonitorAll(true);

        console.log("all");
        setDeviceTypeChoose("");
        setDetailMonitor(null);
        dataRenderFinal.current = null;
        columnTypeRender.current = "";
        setValueSelect("");
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const deviceType = searchParams.get("deviceType");
        if (deviceType && rows) {
            handleOnchangeDeviceType("", deviceType);
        }
    }, [rows]);

    return (
        <>
            {arr.current && arr.current.length > 0 ? (
                <>
                    <div className="monitor_page">
                        <SubHeader text={"GIÁM SÁT NHIỀU TRẠM"} />
                        {/* <SubHeader text={'GIÁM SÁT TRỰC TUYẾN TRẠM NƯỚC THẢI'} /> */}
                        <div className="monitor_page-select">
                            <Grid container spacing={2}>
                                {/* <Grid item xs={2}>
                                    <MySelect label="Chọn Tỉnh" />
                                </Grid>
                                <Grid item xs={2}>
                                    <MySelect label="Chọn Vùng" />
                                </Grid>
                                <Grid item xs={3}>
                                    <MySelect label="Chọn Trạm" />
                                </Grid>
                                <Grid item xs={3}>
                                    <MySelect label="Chọn Mức Cảnh Báo" />
                                </Grid> */}
                                <Grid item xl={4} lg={4} md={4} sm={12} xs={12}>
                                    <Autocomplete
                                        id="controllable-states-demo"
                                        size="small"
                                        color="success"
                                        onChange={handleOnChangeSelectStation}
                                        options={menuValue}
                                        value={valueSelect.label}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Giám sát theo trạm"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xl={4} lg={4} md={4} sm={12} xs={12}>
                                    <Autocomplete
                                        disablePortal
                                        id="controllable-states-demo-20"
                                        size="small"
                                        color="success"
                                        onChange={handleOnchangeDeviceType}
                                        value={deviceTypeValue}
                                        getOptionLabel={(option) => option}
                                        options={listDeviceType}
                                        fullWidth={true}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth={true}
                                                label="Giám sát theo loại trạm"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xl={4} lg={4} md={4} sm={12} xs={12}>
                                    <Button
                                        variant="contained"
                                        style={{ backgroundColor: "#088f81" }}
                                        fullWidth
                                        onClick={handleMonitorAll}
                                    >
                                        GIÁM SÁT TẤT CẢ ({rows.length})
                                    </Button>
                                </Grid>
                            </Grid>
                        </div>
                        <div className="table">
                            <>
                                <MyTable
                                    columns={
                                        !monitorAll
                                            ? columnTypeRender.current
                                            : [
                                                  ...columns,
                                                  {
                                                      id: "quickview",
                                                      label: "Liên kết",
                                                      minWidth: 100,
                                                      align: "center",
                                                  },
                                              ]
                                    }
                                    rows={
                                        !monitorAll
                                            ? dataRenderFinal.current
                                            : rows
                                    }
                                    styleStateValue={styleStateValue}
                                    rowPageOptions={[20, 50, 100]}
                                />
                            </>
                        </div>
                    </div>
                </>
            ) : (
                // <LinearProgress color="success" />
                <Loading />
            )}
        </>
    );
}

export default Monitor;
