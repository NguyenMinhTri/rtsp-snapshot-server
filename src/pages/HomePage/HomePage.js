import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import moment from "moment";
import axios from "axios";
import Cookies from "js-cookie";

// MUI Components
import { Box, Grid, TextField, Autocomplete, Backdrop, CircularProgress, Stack, Skeleton, Typography } from "@mui/material";
import { makeStyles } from "@material-ui/styles";

// Custom Hooks
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { useDeviceData } from "./hooks/useDeviceData";
import { useNotes } from "./hooks/useNotes";
import { useLicense } from "./hooks/useLicense";
import { useDeviceControl } from "./hooks/useDeviceControl";
import { useResponsiveGrid, layoutConditions, getExportButtonConfig, getChartComponent, deviceTypeHelpers } from "./layoutHelpers";

// Components
import SubHeader from "../../components/SubHeader";
import AlarmNote from "../../components/AlarmNote";
import NormalNote from "../../components/NormalNote";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import ConfirmationDialogSensor from "../../components/ConfirmationDialogSensor";
import CNVDialog from "../../components/CNVDialog";
import CNVDialogSetting from "../../components/CNVDialogSetting";
import GridSplitControl from "./GridSplitControl";
import CardValueSensor from "../../components/CardValueSensor/CardValueSensor";
import CoilValueDevice from "../../components/CoilValueDevice/CoilValueDevice";
import SensorGridOptimized from "../SensorGridOptimized/SensorGridOptimized";
import CNVDisplayComponent from "../../components/CNVDisplayComponent/CNVDisplayComponent";
import MapD from "../../components/MapD";
import ChartTab from "../../components/ChartTab";
import MainChart from "../../components/MyChart/MainChart";
import ColumnChartSensor from "../../components/MyChart/ColumnChartSensor";
import MyDateRange from "../../components/DateRange";
import MyButton from "../../components/MyButton";
import ImageNote from "../../components/ImageNote";
import IFrameSVGWrapper from "../Home/components/IFrameSVGWrapper";
import IFrameExcelCheckList from "../Home/components/IFrameExcelCheckList";
import CameraDialog from "../Home/components/CameraDialog";
import { SensorGridSection, CoilGridSection, MapSection, NotesSection, ChartSection, CameraSection } from "./layoutComponents";

// Utils
import AsyncLocalStorage from "../../utils/async_localstorage";
import Toast from "../../utils/toasts";
import { getUniqueListBy } from "../../utils/function";
import { handleGetSettingThreshold } from "../../utils/handleGetSettingThreshold";
import compareDate from "../../utils/compare_date";
import { chooseSensorAction } from "../../redux/reducer/chooseSensorChart";

// Styles
import "./HomePage.scss";

// Define styles
const useStyles = makeStyles((theme) => ({
    container: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },
    chatContainer: {
        marginTop: "10px",
        padding: 2,
        marginBottom: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "400px",
        overflowY: "auto",
    },
    message: {
        wordWrap: "break-word",
        backgroundColor: "#f5f5f5",
        padding: 0,
        borderRadius: "4px",
    },
    inputContainer: {
        display: "flex",
        gap: 1,
    },
    input: {
        flexGrow: 1,
    },
}));

// Memoized sub-components
const StationSelector = memo(({ menuValue, valueSelect, inputValue, setInputValue, handleOnChangeSelectStation }) => (
    <div style={{ border: "1.5px solid #ccc", marginBottom: "10px", padding: "10px", backgroundColor: "white", fontWeight: "600", borderRadius: "3px" }}>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Autocomplete
                    size="small"
                    onChange={handleOnChangeSelectStation}
                    options={menuValue}
                    value={valueSelect || null}
                    inputValue={inputValue}
                    onInputChange={(_, newValue) => setInputValue(newValue)}
                    getOptionLabel={(option) => option.label || ""}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <TextField {...params} label="Chọn trạm giám sát" />}
                />
            </Grid>
        </Grid>
    </div>
));

const LicenseWarnings = memo(({ licenseDay, licenseMessage, isDeviceOffline, IsDemoUI, lastimeActive }) => (
    <>
        {licenseDay > 10 && licenseDay !== -1 && <NormalNote text={`Bạn còn ${licenseDay} ngày sử dụng.`} />}
        {licenseDay < 10 && licenseDay > 0 && <AlarmNote text={`Thiết bị sắp hết hạn sử dụng. Bạn còn ${licenseDay} ngày sử dụng.`} />}
        {licenseDay === 0 && <AlarmNote text="Thiết bị đã hết hạn sử dụng. Vui lòng liên hệ nhà cung cấp." />}
        {isDeviceOffline && !IsDemoUI && <AlarmNote text={`Trạm bị mất kết nối từ ${moment(lastimeActive.slice(0, -1)).format("HH:mm DD/MM/YYYY")}. Vui lòng kiểm tra.`} />}
        {licenseMessage && <AlarmNote text={licenseMessage} />}
    </>
));
/* Hiệu ứng ring loader */
const ringStyle = {
    width: 70,
    height: 70,
    border: "4px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "ringSpin 1s linear infinite",
};

/* Animation CSS */
const globalStyle = `
@keyframes ringSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes typing {
  0% { width: 0ch; }
  100% { width: 15ch; }
}

@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;
export const LoadingState = (props) => (
    <>
        {/* inject animation keyframes */}
        <style>{globalStyle}</style>

        {/* Overlay chờ dữ liệu */}
        <Backdrop
            sx={{
                color: "#fff",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                backdropFilter: "blur(6px)",
                background: "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.75))",
                animation: "fadeInUp 0.5s ease",
            }}
            open={!props.loaded}
        >
            <Stack direction="column" spacing={3} alignItems="center">
                {/* RING LOADER */}
                <Box sx={ringStyle} />

                {/* Text typing */}
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        letterSpacing: "1px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        width: "15ch",
                        animation: "typing 2s steps(15) 0s infinite alternate",
                        textAlign: "center",
                        textShadow: "0 0 6px rgba(255,255,255,0.6)",
                    }}
                >
                    Đang tải dữ liệu...
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        opacity: 0.8,
                        animation: "fadeInUp 1s ease",
                    }}
                >
                    Vui lòng chờ trong giây lát
                </Typography>
            </Stack>
        </Backdrop>

        {/* Skeleton – phần nền khi chưa load */}
        <Box sx={{ p: 2, opacity: props.loaded ? 1 : 0.3, transition: "0.3s" }}>
            <Skeleton
                variant="rounded"
                height={55}
                sx={{ mb: 2, borderRadius: 2 }}
            />
            <Skeleton
                variant="rounded"
                height={40}
                sx={{ mb: 2, borderRadius: 2 }}
            />

            <Skeleton
                variant="rounded"
                height={180}
                sx={{ mb: 2, borderRadius: 3 }}
            />

            <Stack direction="row" spacing={2}>
                <Skeleton variant="rounded" height={160} width="50%" sx={{ borderRadius: 3 }} />
                <Skeleton variant="rounded" height={160} width="50%" sx={{ borderRadius: 3 }} />
            </Stack>
        </Box>
    </>
);
function HomePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const classes = useStyles();

    // Auth
    const { user, authLoading } = useFirebaseAuth();

    // Load device list FIRST - before using in hooks
    const listDevice = useMemo(() => {
        const deviceUser = localStorage.getItem("device_user");
        return deviceUser && deviceUser !== "undefined" ? JSON.parse(deviceUser) : null;
    }, []);

    // Local State
    const [loaded, setLoaded] = useState(false);
    const [valueSelect, setValueSelect] = useState(null);
    const [menuValue, setMenuSelect] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [cameraList, setCameraList] = useState([]);
    const [gridSplitRatio, setGridSplitRatio] = useState(null);
    const [isEnglishLanguage, setIsEnglishLanguage] = useState(true);

    // Date range
    const [startDate, setStartDate] = useState(moment(new Date()).subtract(2, "hour").format("MM/DD/YYYY HH:mm:ss"));
    const [endDate, setEndDate] = useState(moment(new Date()).format("MM/DD/YYYY HH:mm:ss"));
    const [startDateTemp, setStartDateTemp] = useState(startDate);
    const [endDateTemp, setEndDateTemp] = useState(endDate);

    // Dialogs
    const [isOpenDialog, setIsOpenDialog] = useState(false);
    const [isOpenDialogSensor, setIsOpenDialogSensor] = useState(false);
    const [isOpenDialogCNV, setIsOpenDialogCNV] = useState(false);
    const [isOpenDialogCNVSetting, setIsOpenDialogCNVSetting] = useState(false);
    const [selectedCoil, setSelectedCoil] = useState({});
    const [selectedSensor, setSelectedSensor] = useState({});
    const [selectedCNVDialog, setSelectedCNVDialog] = useState({
        ReportFormData: {
            customerName: "...",
            facilityNo: "...",
            tankNo: "...",
            product: "...",
            productDate: "...",
            deliverDate: "...",
            historyDate: moment(new Date()).format("HH:mm MM/DD/YYYY"),
            IsC6H6: true, IsCO2: true, IsH2O: true, IsH2S: true, IsO2: true, IsN2: true, IsTHC: true,
        }
    });
    const [titleDialog, setTitleDialog] = useState("");
    const [contentDialog, setContentDialog] = useState("");
    const [isNoButton, setIsNoButton] = useState(true);

    // Custom Hooks - NOW listDevice is defined
    const { fullRS485Data, deviceType, IsDemoUI, isDeviceOffline, lastimeActive, listSensor, isShowColChart, dataRealTime } = useDeviceData(valueSelect, listDevice);
    const { textList, inputText, setInputText, fetchDataNote, addNote } = useNotes(valueSelect, user);
    const { licenseDay, licenseMessage, licenseLockLV1, licenseLockLV2, fetchLicense } = useLicense();
    const { sendCommand } = useDeviceControl(fullRS485Data, user);

    // Set loaded state when data is ready
    useEffect(() => {
        if (fullRS485Data) {
            setLoaded(true);
        }
    }, [fullRS485Data]);

    // Initialize menu
    useEffect(() => {
        if (!listDevice) {
            navigate("/nothing");
            return;
        }

        const devices = Object.keys(listDevice).map(id => ({
            id,
            label: listDevice[id]["FullName"],
        }));
        setMenuSelect(devices);
    }, [listDevice, navigate]);

    // Load saved station
    useEffect(() => {
        const loadStation = async () => {
            const station = await AsyncLocalStorage.getItem("home_station");
            const searchParams = new URLSearchParams(window.location.search);
            const deviceId = searchParams.get("deviceId");

            if (station && !deviceId) {
                const stationUser = JSON.parse(station);
                setValueSelect(stationUser);
                setCameraList(listDevice[stationUser.id]?.cameraList || []);
            } else if (menuValue.length > 0) {
                const targetId = deviceId && listDevice[deviceId] ? deviceId : menuValue[0].id;
                setValueSelect({ id: targetId, label: listDevice[targetId]["FullName"] });
                setCameraList(listDevice[targetId]?.cameraList || []);
            }
        };

        if (menuValue.length > 0) {
            loadStation();
        }
    }, [menuValue, listDevice]);

    // Fetch notes and license when device changes
    useEffect(() => {
        if (valueSelect?.id) {
            fetchDataNote();
            fetchLicense(valueSelect.id);

            const isEnglish = localStorage.getItem("EnglishLanguage");
            setIsEnglishLanguage(isEnglish !== "false");
        }
    }, [valueSelect?.id, fetchDataNote, fetchLicense]);

    // Load grid split preference
    useEffect(() => {
        if (valueSelect?.id) {
            const saved = localStorage.getItem(`grid-split-${valueSelect.id}`);
            if (saved) {
                try {
                    setGridSplitRatio(JSON.parse(saved));
                } catch (e) {
                    console.error("Error loading grid split:", e);
                }
            }
        }
    }, [valueSelect?.id]);

    // Process sensor data
    const dataSensor = useMemo(() => {
        if (!dataRealTime || dataRealTime.length === 0 || !fullRS485Data) return [];

        const uniqueData = getUniqueListBy(dataRealTime, "location");

        return uniqueData.map(v => {
            const statusStation = v.status_station?.split("*")[1] || "0";

            return v.data_sensor?.map(v2 => {
                const isOver = handleGetSettingThreshold(v.id_station, v2.Name, v2.Value);
                let statusValue;

                if (statusStation === "NOOK") {
                    statusValue = `${v2.Value}*${v2.StateNum || 0}*STATION_OFF`;
                } else if (isOver && v2.StateNum === 0) {
                    statusValue = `${v2.Value}*5`;
                } else {
                    statusValue = `${v2.Value}*${v2.StateNum || 0}`;
                }

                return {
                    sensor: v2.Name,
                    value: statusValue,
                    unit: v2.Unit,
                    IsModify: v2.IsModify,
                    Type: v2.Type,
                    Scale: v2.Scale,
                    GroupName: v2.GroupName,
                    AlarmSetting: v2.AlarmSetting,
                };
            }) || [];
        });
    }, [dataRealTime, fullRS485Data]);

    // Process coil data
    const dataCoil = useMemo(() => {
        if (!dataRealTime || dataRealTime.length === 0 || !fullRS485Data) return [];

        const uniqueData = getUniqueListBy(dataRealTime, "location");

        return uniqueData.map(v => {
            const statusStation = v.status_station?.split("*")[1] || "0";

            return v.coil_data?.map(v2 => {
                const statusValue = statusStation === "NOOK"
                    ? `${v2.Value}*${v2.StateNum || 0}*STATION_OFF`
                    : `${v2.Value}*${v2.StateNum || 0}`;

                return {
                    sensor: v2.Name,
                    value: statusValue,
                    unit: v2.Unit,
                    IsHighAlarm: v2.IsHighAlarm,
                    item: v2,
                };
            }) || [];
        });
    }, [dataRealTime, fullRS485Data]);

    // Handlers
    const handleOnChangeSelectStation = useCallback((e, v) => {
        if (v !== null) {
            AsyncLocalStorage.setItem("home_station", JSON.stringify(v)).then(() => {
                dispatch(chooseSensorAction("1"));
                setValueSelect(v);
                setCameraList(listDevice[v.id]?.cameraList || []);
            });
        }
    }, [dispatch, listDevice]);

    const handleGridSplitChange = useCallback((newSplit) => {
        setGridSplitRatio(newSplit);
    }, []);

    const styleForCard = useCallback((value, AL) => {
        const stateSensor = value.split("*")[1];
        const statusStation = value.split("*")[2];

        if (statusStation === "STATION_OFF") return "off";
        if (stateSensor === "1") return "calib";
        if (stateSensor === "2") return "error";
        if (stateSensor === "5") return "over";

        if (stateSensor === "0" && AL) {
            const valueSensor = parseFloat(value.split("*")[0]);

            if (AL.IsAlarmHigh && valueSensor > AL.HighAlarmSetting && (AL.IsSendHighAlarm || AL.DelayTime === 0 || AL.DelayTime === undefined)) {
                return "error";
            }

            if (AL.IsAlarmLow && valueSensor < AL.LowAlarmSetting && (AL.IsSendLowAlarm || AL.DelayTime === 0 || AL.DelayTime === undefined)) {
                return "error";
            }

            if (AL.IsAlarmHigh1 && valueSensor > AL.HighAlarmSetting1) return "error";
            if (AL.IsAlarmLow1 && valueSensor < AL.LowAlarmSetting1) return "error";
        }

        return "normal";
    }, []);

    const onClickSensorDevice = useCallback((myObject) => {
        const deviceObject = JSON.parse(localStorage.getItem("device_user"));

        if (!deviceObject[valueSelect.id].IsMaster && !deviceObject[valueSelect.id].IsAdmin) {
            Toast("error", "Bạn không có quyền cài đặt");
            return;
        }

        setSelectedSensor(myObject);
        setIsNoButton(false);
        setTitleDialog(myObject.sensor);
        setIsOpenDialogSensor(true);
    }, [valueSelect]);

    const onClickCoilDevice = useCallback((myObject) => {
        const deviceObject = JSON.parse(localStorage.getItem("device_user"));

        if (!deviceObject[valueSelect.id].IsMaster && !deviceObject[valueSelect.id].IsAdmin) {
            Toast("error", "Bạn không có quyền điều khiển");
            return;
        }

        setSelectedCoil(myObject.item);
        setIsNoButton(myObject.item.IsModify);
        setTitleDialog(myObject.item.Name);

        let isLock = true;
        if (myObject.item.AddressActive !== undefined) {
            const coil = fullRS485Data.RS485Data.find(item => item.Address === myObject.item.AddressActive);
            isLock = coil?.CoilValue;
        }

        if (!isLock) {
            setIsNoButton(false);
            setContentDialog(`[${myObject.item.Name}] is locked. Please change to MAN mode to control this.`);
        } else if (myObject.item.IsModify) {
            setContentDialog(
                myObject.item.Value === 1
                    ? `Do you turn OFF [${myObject.item.Name}]`
                    : `Do you turn ON [${myObject.item.Name}]`
            );
        } else {
            setContentDialog(`[${myObject.item.Name}] is locked. You could not control this.`);
        }

        setIsOpenDialog(true);
    }, [valueSelect, fullRS485Data]);

    // Confirm handlers
    const handleConfirm = useCallback(async (coilObject) => {
        if (!isNoButton) return;

        const sendingValue = coilObject.Value === 1 ? 0 : 1;
        const deviceID = coilObject.Location || valueSelect.id;

        const commandData = {
            "RS485-Commands": [{
                Address: coilObject.Address2 || coilObject.Address,
                SlaveId: coilObject.SlaveId2 || coilObject.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId: coilObject.CSLocation || "",
                Type: coilObject.Type,
                CoilValue: sendingValue === 1,
                Value: sendingValue,
                Name: coilObject.Name,
                Index: coilObject.Index,
            }]
        };

        await sendCommand(deviceID, commandData, fullRS485Data.IsDemoUI);
    }, [isNoButton, valueSelect, fullRS485Data, sendCommand]);
    const handleConfirmSensor = useCallback(async (newSensorObject, oldSensorValue) => {


        let commandData = { "RS485-Commands": [] };
        let sensorSetting = {};
        let deviceID = valueSelect.id;

        const addCommand = (item, value, funcCode = 16, dataLen = 1) => {
            if (!item) return;
            if (item.Location) deviceID = item.Location;

            commandData["RS485-Commands"].push({
                Address: item.Address,
                SlaveId: item.SlaveId,
                FunctionCode: funcCode,
                DataLength: dataLen,
                CSDeviceId: item.CSLocation || "",
                Type: item.Type,
                Value: value,
                Name: item.Name,
                Index: item.Index,
            });
        };

        // ---- High Alarm ----
        if (newSensorObject.AlarmSetting.HighAlarmSetting !== oldSensorValue.AlarmSetting.HighAlarmSetting) {
            const highAlarm = fullRS485Data?.RS485Data?.find(
                x => x?.Name?.includes("HighAlarmSetting") && x?.Name?.includes(newSensorObject?.sensor)
            );

            const val = newSensorObject.Type === "int"
                ? Math.round(parseInt(newSensorObject.AlarmSetting.HighAlarmSetting) / newSensorObject.Scale)
                : newSensorObject.AlarmSetting.HighAlarmSetting;

            addCommand(highAlarm, val, 16, newSensorObject.Type === "int" ? 1 : 2);
            sensorSetting.HighAlarmSetting = newSensorObject.AlarmSetting.HighAlarmSetting;
        }

        // ---- Low Alarm ----
        if (newSensorObject.AlarmSetting.LowAlarmSetting !== oldSensorValue.AlarmSetting.LowAlarmSetting) {
            const lowAlarm = fullRS485Data?.RS485Data?.find(
                x => x?.Name?.includes("LowAlarmSetting") && x?.Name?.includes(newSensorObject?.sensor)
            );

            const val = newSensorObject.Type === "int"
                ? Math.round(parseInt(newSensorObject.AlarmSetting.LowAlarmSetting) / newSensorObject.Scale)
                : newSensorObject.AlarmSetting.LowAlarmSetting;

            addCommand(lowAlarm, val, 16, newSensorObject.Type === "int" ? 1 : 2);
            sensorSetting.LowAlarmSetting = newSensorObject.AlarmSetting.LowAlarmSetting;
        }

        // ---- Delay Time ----
        if (newSensorObject.AlarmSetting.DelayTime !== oldSensorValue.AlarmSetting.DelayTime) {
            const delayTime = fullRS485Data?.RS485Data?.find(
                x => x?.Name?.includes("DelayTime") && x?.Name?.includes(newSensorObject?.sensor)
            );

            addCommand(delayTime, newSensorObject.AlarmSetting.DelayTime, 6, 1);
            sensorSetting.DelayTime = newSensorObject.AlarmSetting.DelayTime;
        }

        // ---- Các giá trị còn lại ----
        const copyFields = [
            "LowAlarmSetting1",
            "HighAlarmSetting1",
            "IsAlarmLow",
            "IsAlarmLow1",
            "IsAlarmHigh",
            "IsAlarmHigh1",
        ];

        copyFields.forEach(key => {
            if (newSensorObject.AlarmSetting[key] !== undefined)
                sensorSetting[key] = newSensorObject.AlarmSetting[key];
        });

        sensorSetting.Name = newSensorObject.sensor;
        sensorSetting.GroupName = newSensorObject.GroupName;


        await sendCommand(deviceID, commandData, false, sensorSetting);

    }, [valueSelect, fullRS485Data, sendCommand]);



    // Date utilities
    const subTract7Hour = useCallback((startDateChoose, endDateChoose) => {
        const dateS = new Date(startDateChoose);
        const dateE = new Date(endDateChoose);
        const subtract7HoursStart = dateS.getTime() - 7 * 60 * 60 * 1000;
        const subtract7HoursEnd = dateE.getTime() - 7 * 60 * 60 * 1000;
        return {
            startDate: moment(subtract7HoursStart).format("YYYY-MM-DD HH:mm:ss"),
            endDate: moment(subtract7HoursEnd).format("YYYY-MM-DD HH:mm:ss")
        };
    }, []);

    const noSubTract7Hour = useCallback((startDateChoose, endDateChoose) => {
        const dateS = new Date(startDateChoose);
        const dateE = new Date(endDateChoose);
        return {
            startDate: moment(dateS.getTime()).format("YYYY-MM-DD HH:mm:ss"),
            endDate: moment(dateE.getTime()).format("YYYY-MM-DD HH:mm:ss")
        };
    }, []);

    const subAdd7Minute = useCallback((startDateChoose, endDateChoose) => {
        const dateS = new Date(startDateChoose);
        const dateE = new Date(endDateChoose);
        const subtract7HoursStart = dateS.getTime() - 5 * 60 * 1000;
        const subtract7HoursEnd = dateE.getTime() + 5 * 60 * 1000;
        return {
            startDate: moment(subtract7HoursStart).format("YYYY-MM-DD HH:mm:ss"),
            endDate: moment(subtract7HoursEnd).format("YYYY-MM-DD HH:mm:ss")
        };
    }, []);

    // Export handlers
    const handleExportExcel = useCallback(async () => {
        const deviceObject = JSON.parse(localStorage.getItem("device_user"));
        if (!deviceObject[valueSelect.id]?.IsMaster && !deviceObject[valueSelect.id]?.IsAdmin) {
            Toast("error", "Bạn không có quyền xuất file");
            return;
        }

        const startC = moment(startDateTemp);
        const endC = moment(endDateTemp);
        const totalDate = endC.diff(startC, "days");

        if (totalDate > 100) {
            Toast("error", "Thất bại. Chỉ có thể truy xuất dữ liệu ít hơn 100 ngày");
            return;
        }

        Toast("info", "Vui lòng chờ trong ít phút", 5000);

        const token = Cookies.get("auth_token");
        const { startDate: start, endDate: end } = subTract7Hour(startDate, endDate);

        try {
            setLoaded(false);

            if (!valueSelect.id.includes("_") &&
                valueSelect.id !== "A-OMWATER-1" &&
                valueSelect.id !== "A-BIENTAN-1" &&
                valueSelect.id !== "A-TEDCO-1" &&
                valueSelect.id !== "A-TEMP-NP-1" &&
                valueSelect.id !== "HCM") {

                // Export multiple sensors separately
                for (let i = 0; i < listSensor.length; i++) {
                    const res = await axios.get(
                        "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Access-Control-Allow-Origin": "*",
                            },
                            params: {
                                deviceId: valueSelect.id,
                                listSensors: [listSensor[i]].toString(),
                                startDate: start,
                                endDate: end,
                                scale: "hour",
                                email: "",
                                isDatalogger: true,
                                IsDemo: false,
                            },
                        }
                    );

                    if (res?.data) {
                        const link = document.createElement("a");
                        link.href = res.data.link;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
                Toast("success", "Xuất dữ liệu thành công", 2000);
            } else {
                // Export all sensors together
                const res = await axios.get(
                    "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Access-Control-Allow-Origin": "*",
                        },
                        params: {
                            deviceId: valueSelect.id,
                            listSensors: listSensor.toString(),
                            startDate: start,
                            endDate: end,
                            scale: "hour",
                            email: "",
                            isDatalogger: true,
                            IsDemo: false,
                        },
                    }
                );

                if (res?.data) {
                    const link = document.createElement("a");
                    link.href = res.data.link;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    Toast("success", "Xuất dữ liệu thành công", 2000);
                } else {
                    Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
                }
            }

            setLoaded(true);
        } catch (err) {
            setLoaded(true);
            console.error("Export error:", err);
            Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
        }
    }, [valueSelect, startDate, endDate, startDateTemp, endDateTemp, listSensor, subTract7Hour]);

    const handleExportExcelISO = useCallback(async () => {
        const startC = moment(startDateTemp);
        const endC = moment(endDateTemp);
        const totalDate = endC.diff(startC, "days");

        if (totalDate > 100) {
            Toast("error", "Thất bại. Chỉ có thể truy xuất dữ liệu ít hơn 100 ngày");
            return;
        }

        Toast("info", "Vui lòng chờ trong ít phút", 5000);
        const { startDate: start, endDate: end } = noSubTract7Hour(startDate, endDate);

        try {
            window.open(
                `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-test?startDate=${start}&endDate=${end}`
            );
        } catch (err) {
            console.error("Export ISO error:", err);
            Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
        }
    }, [startDate, endDate, startDateTemp, endDateTemp, noSubTract7Hour]);

    const handleExportExcelISO2 = useCallback(async () => {
        const startC = moment(startDateTemp);
        const endC = moment(endDateTemp);
        const totalDate = endC.diff(startC, "days");

        if (totalDate > 100) {
            Toast("error", "Thất bại. Chỉ có thể truy xuất dữ liệu ít hơn 100 ngày");
            return;
        }

        Toast("info", "Vui lòng chờ trong ít phút", 5000);
        const { startDate: start, endDate: end } = noSubTract7Hour(startDate, endDate);

        try {
            window.open(
                `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-test-2?startDate=${start}&endDate=${end}`
            );
        } catch (err) {
            console.error("Export ISO2 error:", err);
            Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
        }
    }, [startDate, endDate, startDateTemp, endDateTemp, noSubTract7Hour]);

    const handleExportHistoryCNV = useCallback(async () => {
        const startC = moment(startDateTemp);
        const endC = moment(endDateTemp);
        const totalDate = endC.diff(startC, "days");

        if (totalDate > 100) {
            Toast("error", "Thất bại. Chỉ có thể truy xuất dữ liệu ít hơn 100 ngày");
            return;
        }

        Toast("info", "Vui lòng chờ trong ít phút", 5000);
        const { startDate: start, endDate: end } = subTract7Hour(startDate, endDate);

        try {
            setLoaded(false);
            const response = await axios({
                url: `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web-cnv?startDate=${start}&endDate=${end}`,
                method: "GET",
                responseType: "blob",
            });

            const href = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = href;
            link.setAttribute("download", `Historic_Analysis_${startDate}_${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
            setLoaded(true);
        } catch (err) {
            setLoaded(true);
            console.error("Export CNV error:", err);
            Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
        }
    }, [startDate, endDate, startDateTemp, endDateTemp, subTract7Hour]);

    const handleCertificate = useCallback(() => {
        setSelectedCNVDialog(prev => ({
            ...prev,
            ReportFormData: {
                ...prev.ReportFormData,
                historyDate: moment(new Date()).format("HH:mm MM/DD/YYYY")
            }
        }));
        setIsOpenDialogCNV(true);
    }, []);

    const handleExportHistoryNamPhuong = useCallback(async () => {
        const startC = moment(startDateTemp);
        const endC = moment(endDateTemp);
        const totalDate = endC.diff(startC, "days");

        if (totalDate > 100) {
            Toast("error", "Thất bại. Chỉ có thể truy xuất dữ liệu ít hơn 100 ngày");
            return;
        }

        Toast("info", "Vui lòng chờ trong ít phút", 5000);
        const { startDate: start, endDate: end } = subTract7Hour(startDate, endDate);

        try {
            setLoaded(false);
            const response = await axios({
                url: `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/history-khi-nam-phuong?startDate=${start}&endDate=${end}`,
                method: "GET",
                responseType: "blob",
            });

            const href = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = href;
            link.setAttribute("download", `Historic_Analysis_${startDate}_${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
            setLoaded(true);
        } catch (err) {
            setLoaded(true);
            console.error("Export Nam Phuong error:", err);
            Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
        }
    }, [startDate, endDate, startDateTemp, endDateTemp, subTract7Hour]);

    const handleConfirmCNVToExcel = useCallback(async (newSensorObject) => {
        Toast("info", "Vui lòng chờ trong ít phút", 5000);

        const startC = moment(new Date());
        const endC = moment(newSensorObject.ReportFormData.historyDate);
        const totalMinute = endC.diff(startC, "minutes");

        try {
            setLoaded(false);
            let url;

            if (totalMinute < 3 && totalMinute > -3) {
                // Recent data
                url = `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-certificate-cnv?customerName=${newSensorObject.ReportFormData.customerName}&facilityNo=${newSensorObject.ReportFormData.facilityNo}&tankNo=${newSensorObject.ReportFormData.tankNo}&product=${newSensorObject.ReportFormData.product}&productDate=${newSensorObject.ReportFormData.productDate}&deliverDate=${newSensorObject.ReportFormData.deliverDate}&IsC6H6=${newSensorObject.ReportFormData.IsC6H6}&IsCO2=${newSensorObject.ReportFormData.IsCO2}&IsH2O=${newSensorObject.ReportFormData.IsH2O}&IsH2S=${newSensorObject.ReportFormData.IsH2S}&IsO2=${newSensorObject.ReportFormData.IsO2}&IsN2=${newSensorObject.ReportFormData.IsN2}&IsTHC=${newSensorObject.ReportFormData.IsTHC}`;
            } else {
                // Historical data
                const { startDate: start1, endDate: end1 } = subTract7Hour(
                    newSensorObject.ReportFormData.historyDate,
                    newSensorObject.ReportFormData.historyDate
                );
                const { startDate: start, endDate: end } = subAdd7Minute(start1, end1);

                url = `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-certificate-history-cnv?customerName=${newSensorObject.ReportFormData.customerName}&facilityNo=${newSensorObject.ReportFormData.facilityNo}&tankNo=${newSensorObject.ReportFormData.tankNo}&product=${newSensorObject.ReportFormData.product}&productDate=${newSensorObject.ReportFormData.productDate}&deliverDate=${newSensorObject.ReportFormData.deliverDate}&IsC6H6=${newSensorObject.ReportFormData.IsC6H6}&IsCO2=${newSensorObject.ReportFormData.IsCO2}&IsH2O=${newSensorObject.ReportFormData.IsH2O}&IsH2S=${newSensorObject.ReportFormData.IsH2S}&IsO2=${newSensorObject.ReportFormData.IsO2}&IsN2=${newSensorObject.ReportFormData.IsN2}&IsTHC=${newSensorObject.ReportFormData.IsTHC}&HistoryDateStart=${start}&HistoryDateEnd=${end}`;
            }

            const response = await axios({
                url,
                method: "GET",
                responseType: "blob",
            });

            const href = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = href;
            link.setAttribute("download", `Certificate_${newSensorObject.ReportFormData.historyDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
            setLoaded(true);
        } catch (err) {
            setLoaded(true);
            console.error("Export certificate error:", err);
            Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
        }
    }, [subTract7Hour, subAdd7Minute]);

    const handleConfirmCNVSetting = useCallback(async (rs485DataSetting) => {
        try {
            await refreshToken();

            const commandData = { "RS485-Commands": [] };
            const deviceID = valueSelect.id;

            for (let index = 0; index < rs485DataSetting.length; index++) {
                const setting = rs485DataSetting[index];

                if (setting.MemoryType === 6 || setting.MemoryType === 10) {
                    let valueTemp = Number(setting.Value);
                    if (setting.Scale !== undefined) {
                        valueTemp = Number(setting.Value) / Number(setting.Scale.toFixed(1));
                    }

                    commandData["RS485-Commands"].push({
                        Address: setting.Address,
                        SlaveId: setting.SlaveId,
                        FunctionCode: setting.Type === "int" ? 6 : 16,
                        DataLength: setting.Type === "int" ? 1 : 2,
                        CSDeviceId: "",
                        Scale: setting.Scale || 1,
                        Type: setting.Type,
                        Value: Number(valueTemp),
                        Name: setting.Name,
                        Index: setting.Index,
                    });
                }
            }

            const success = await sendCommand(deviceID, commandData, fullRS485Data?.IsDemoUI || false);

            if (!success) {
                Toast("error", "[Err] Vui lòng thử lại");
            } else {
                Toast("success", "Tín hiệu gửi đi thành công.");
            }
        } catch (error) {
            console.error("CNV setting error:", error);
            Toast("error", "Đã xảy ra lỗi khi cài đặt");
        }
    }, [valueSelect, fullRS485Data, sendCommand]);

    // Helper function to refresh token
    const refreshToken = useCallback(async () => {
        if (!user) return;

        try {
            const idTokenResult = await user.getIdTokenResult();
            const token = idTokenResult.expirationTime <= Date.now()
                ? await user.getIdToken(true)
                : idTokenResult.token;

            Cookies.set("auth_token", token, { expires: 2147483647 });
        } catch (error) {
            console.error("Token refresh error:", error);
        }
    }, [user]);

    const handleChangeStartDate = useCallback((e) => {
        const startTime = moment(e.$d).format("HH:mm MM-DD-YYYY");
        setStartDateTemp(startTime);
    }, []);

    const handleChangeEndDate = useCallback((e) => {
        const endTime = moment(e.$d).format("HH:mm MM-DD-YYYY");
        setEndDateTemp(endTime);
    }, []);

    const handleApplyDate = useCallback(() => {
        setStartDate(startDateTemp);
        setEndDate(endDateTemp);
    }, [startDateTemp, endDateTemp]);

    const handleKeyPress = useCallback((event) => {
        if (event.key === "Enter") {
            addNote();
        }
    }, [addNote]);

    const handleInputChange = useCallback((event) => {
        setInputText(event.target.value);
    }, [setInputText]);

    // Data coordinates for map
    const dataCoordinates = useMemo(() => {
        if (!listDevice || !valueSelect?.id) return [];

        const device = listDevice[valueSelect.id];
        if (device?.latitude && device?.longitude) {
            return [{
                name: device.FullName,
                latitude: device.latitude,
                longitude: device.longitude,
            }];
        }
        return [];
    }, [listDevice, valueSelect]);

    // Layout configuration
    const gridLayout = useResponsiveGrid({
        hasSensors: layoutConditions.shouldShowSensors(dataSensor),
        hasCoils: layoutConditions.shouldShowCoils(dataCoil),
        hasCameras: layoutConditions.shouldShowCameras(cameraList, licenseLockLV1),
        deviceType,
        deviceId: valueSelect?.id || "",
        sensorCount: dataSensor?.[0]?.length || 0,
        gridSplitRatio,
    });

    const chartType = getChartComponent(valueSelect?.id || "");
    const isCNVDevice = layoutConditions.isCNVDevice(valueSelect);
    const shouldShowNotes = deviceTypeHelpers.needsNotes(valueSelect?.id, deviceType);
    const shouldShowDoubleMap = deviceTypeHelpers.needsDoubleMap(valueSelect?.id, deviceType);

    // Export buttons configuration with handlers
    const exportButtons = useMemo(() => {
        const handlers = {
            handleExportExcel,
            handleExportExcelISO,
            handleExportExcelISO2,
            handleExportHistoryCNV,
            handleCertificate,
            handleExportHistoryNamPhuong,
        };

        return getExportButtonConfig(valueSelect?.id || "").map((btn) => ({
            label: btn.label,
            onClick: handlers[btn.handler] || handleExportExcel, // Fallback to default
        }));
    }, [
        valueSelect?.id,
        handleExportExcel,
        handleExportExcelISO,
        handleExportExcelISO2,
        handleExportHistoryCNV,
        handleCertificate,
        handleExportHistoryNamPhuong,
    ]);

    if (authLoading || !listDevice) {
        return (
            <Backdrop open={true}>
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }

    if (!loaded && !fullRS485Data) {
        return (
            <Backdrop open={true}>
                <CircularProgress color="inherit" />
            </Backdrop>
        );
    }
    return (
        <>
            {/* --- Dialogs --- */}
            <ConfirmationDialogSensor
                open={isOpenDialogSensor}
                onClose={() => setIsOpenDialogSensor(false)}
                title={titleDialog}
                item={selectedSensor}
                onConfirm={handleConfirmSensor}
            />

            <CNVDialog
                open={isOpenDialogCNV}
                onClose={() => setIsOpenDialogCNV(false)}
                item={selectedCNVDialog}
                onConfirm={handleConfirmCNVToExcel}
            />

            <CNVDialogSetting
                isEnglish={isEnglishLanguage}
                deviceId={valueSelect?.id}
                open={isOpenDialogCNVSetting}
                handleClose={() => setIsOpenDialogCNVSetting(false)}
                onConfirm={() => { handleConfirmCNVSetting }}
            />

            <ConfirmationDialog
                isNoButton={isNoButton}
                open={isOpenDialog}
                onClose={() => setIsOpenDialog(false)}
                title={titleDialog}
                message={contentDialog}
                item={selectedCoil}
                onConfirm={handleConfirm}
            />


            {/* ---------- MAIN PAGE WRAPPER ---------- */}
            <div className="home_page" style={{ position: "relative" }}>

                {/* ----------- LOADING OVERLAY ----------- */}
                {!loaded && (
                    <Stack
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                        sx={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(255,255,255,0.75)",
                            zIndex: 9999,
                            backdropFilter: "blur(2px)",
                        }}
                    >
                        <LoadingState

                        />
                    </Stack>
                )}


                {/* ----------- CONTENT WHEN LOADED ----------- */}
                {(
                    <>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                mb: 1,
                                gap: 2, // cho đẹp, tránh dính
                            }}
                        >
                            {/* StationSelector chiếm 33% */}
                            <Box sx={{ flex: "0 0 50%" }}>
                                <StationSelector
                                    menuValue={menuValue}
                                    valueSelect={valueSelect}
                                    inputValue={inputValue}
                                    setInputValue={setInputValue}
                                    handleOnChangeSelectStation={handleOnChangeSelectStation}
                                />
                            </Box>

                            {/* SubHeader chiếm phần còn lại  (và tự co giãn) */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <SubHeader
                                    text={
                                        valueSelect
                                            ? `Thời gian dữ liệu cập nhật gần nhất ${moment(
                                                lastimeActive.slice(0, -1)
                                            ).format("HH:mm DD/MM/YYYY")}`
                                            : "BẠN HÃY CHỌN TRẠM ĐỂ GIÁM SÁT"
                                    }
                                />
                            </Box>

                            {/* GridSplitControl nằm bên phải */}
                            {layoutConditions.shouldShowSensors(dataSensor) &&
                                layoutConditions.shouldShowCoils(dataCoil) && (
                                    <Box sx={{ flexShrink: 0 }}>
                                        <GridSplitControl
                                            deviceId={valueSelect?.id}
                                            onSplitChange={handleGridSplitChange}
                                        />
                                    </Box>
                                )}
                        </Box>




                        <LicenseWarnings
                            licenseDay={licenseDay}
                            licenseMessage={licenseMessage}
                            isDeviceOffline={isDeviceOffline}
                            IsDemoUI={IsDemoUI}
                            lastimeActive={lastimeActive}
                        />

                        {!licenseLockLV2 && (
                            <Box sx={{ flexGrow: 1 }} style={{ margin: "-35px 0" }}>


                                {/* ------------ SENSOR + COIL GRID ------------ */}
                                <div >
                                    <Grid container spacing={2}>
                                        <SensorGridSection
                                            gridConfig={gridLayout.sensor}
                                            isCNVDevice={layoutConditions.isCNVDevice(valueSelect)}
                                            fullRS485Data={fullRS485Data}
                                            onSettingClick={() => setIsOpenDialogCNVSetting(true)}
                                            onAlarmClick={() =>
                                                window.open(`${window.location.origin}/notification`, "_blank")
                                            }
                                            dataSensor={dataSensor}
                                            dataChange={{ last_time: lastimeActive }}
                                            valueSelect={valueSelect}
                                            isRerenderCard={false}
                                            onClickSensorDevice={onClickSensorDevice}
                                            styleForCard={styleForCard}
                                            CNVDisplayComponent={CNVDisplayComponent}
                                            SensorGridOptimized={SensorGridOptimized}
                                            CardValueSensor={CardValueSensor}
                                        />

                                        <CoilGridSection
                                            gridConfig={gridLayout.coil}
                                            dataCoil={dataCoil}
                                            fullRS485Data={fullRS485Data}
                                            valueSelect={valueSelect}
                                            onClickCoilDevice={onClickCoilDevice}
                                            dataChange={{ last_time: lastimeActive }}
                                            styleForCard={styleForCard}
                                            CoilValueDevice={CoilValueDevice}
                                            IFrameSVGWrapper={IFrameSVGWrapper}
                                        />
                                    </Grid>
                                </div>

                                {/* ------------ MAP / NOTES / CHARTS / CAMERA ------------ */}
                                <div style={{ margin: "10px 0" }}>
                                    <Grid container spacing={1.5}>

                                        {/* Notes or Map 1 */}
                                        {shouldShowNotes ? (
                                            <NotesSection
                                                gridConfig={gridLayout.map}
                                                deviceId={valueSelect?.id}
                                                deviceType={deviceType}
                                                textList={textList}
                                                inputText={inputText}
                                                handleInputChange={handleInputChange}
                                                handleKeyPress={handleKeyPress}
                                                addTextToList={addNote}
                                                classes={classes}
                                                IFrameExcelCheckList={IFrameExcelCheckList}
                                                ImageNote={ImageNote}
                                            />
                                        ) : (
                                            <MapSection
                                                gridConfig={gridLayout.map}
                                                valueSelect={valueSelect}
                                                dataCoordinates={dataCoordinates}
                                                listDevice={listDevice}
                                                MapComponent={MapD}
                                            />
                                        )}

                                        {/* Map 2 */}
                                        {shouldShowDoubleMap && (
                                            <MapSection
                                                gridConfig={gridLayout.map}
                                                valueSelect={valueSelect}
                                                dataCoordinates={dataCoordinates}
                                                listDevice={listDevice}
                                                MapComponent={MapD}
                                                zoomDefault={12}
                                            />
                                        )}

                                        {/* Charts */}
                                        {layoutConditions.shouldShowCharts(licenseLockLV1, dataSensor) && (
                                            <ChartSection
                                                gridConfig={gridLayout.chart}
                                                valueSelect={valueSelect}
                                                isShowColChart={isShowColChart}
                                                chartType={chartType}
                                                endDate={endDate}
                                                startDate={startDate}
                                                listSensor={listSensor}
                                                startDateTemp={startDateTemp}
                                                endDateTemp={endDateTemp}
                                                handleChangeStartDate={handleChangeStartDate}
                                                handleChangeEndDate={handleChangeEndDate}
                                                handleApplyDate={handleApplyDate}
                                                exportButtons={exportButtons}
                                                ChartTab={ChartTab}
                                                MainChart={MainChart}
                                                ColumnChartSensor={ColumnChartSensor}
                                                MyDateRange={MyDateRange}
                                                MyButton={MyButton}
                                            />
                                        )}

                                        {/* Camera */}
                                        <CameraSection
                                            gridConfig={gridLayout.camera}
                                            cameraList={cameraList}
                                            CameraDialog={CameraDialog}
                                        />
                                    </Grid>
                                </div>
                            </Box>
                        )}
                    </>
                )}
            </div>
        </>
    );

}

export default HomePage;