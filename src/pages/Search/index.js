import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
    Grid,
    Button,
    LinearProgress,
    Autocomplete,
    TextField,
    Tabs,
    Tab,
    Box,
} from "@mui/material";
import { CSVLink, CSVDownload } from "react-csv";

import SubHeader from "../../components/SubHeader";
import MySelect from "../../components/MySelect";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";

import "./Search.scss";
import MyDateRange from "../../components/DateRange";
import moment from "moment";
import { httpsCallable } from "firebase/functions";
import { functions, functionsUS } from "../../config/firebase";
import MyTable from "../../components/MyTable";
import {
    dataChartDetail,
    listSensorOfStation,
} from "../../redux/reducer/dataSensorSlice";
import { getDatabase, onValue, ref, child, get } from "firebase/database";
import StackedLineChartIcon from "@mui/icons-material/StackedLineChart";
import FileDownloadSharpIcon from "@mui/icons-material/FileDownloadSharp";

import Toast from "../../utils/toasts";
import Cookies from "js-cookie";
import {
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    OAuthProvider,
    RecaptchaVerifier,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import useListDevice from "../../hooks/useListDevice";
import {
    SENSOR_OF_DEVICE_KEY,
    defaultTypeSearchData,
    searchByDays,
    searchByHours,
    selectionByType,
    typeSearchData,
} from "../../constants";
import { DatePicker } from "@mui/x-date-pickers";
import DayPicker from "../../components/DayPicker";
import { handleDataSearchDateMonthHour } from "./actions/handleDataSearchDateMonthHour";
import MyTableNotStyle from "../../components/MyTable/TableNotStyle";
import BackDropLoading from "../../components/BackDropLoading";
import TabPanel from "./components/TabPanel";
import TabTable from "./components/TabTable";
import { SENS, saveSensorOfDevice } from "./actions";

import { getToken } from "firebase/messaging";
import { messaging } from "../../config/firebase";
async function handleAuthStateChanged() {
    return new Promise((resolve, reject) => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                reject(new Error("User not authenticated"));
            }
        });
    });
}
function Search() {
    const [startDate, setStartDate] = useState(
        moment(new Date()).format("00:00 MM/DD/YYYY")
    );
    const [endDate, setEndDate] = useState(
        moment(new Date()).format("23:59 MM/DD/YYYY")
    );
    const [isDatalogger, setIsDatalogger] = useState(false);
    const [dataSensorRange, setDataSensorRange] = useState([]);
    const [countGet, setCountGet] = useState(0);
    const [stationId, setStationId] = useState("");
    const [endGetSensor, setEndGetSensor] = useState(false);
    const [listSensor, setListSensor] = useState([]);
    const [lstSensorName, setlstSensorName] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);

    const [valueSelect, setValueSelect] = useState("");
    let [licenseDay, setLicenseDay] = useState(-1);
    let [licenseMessage, setLicenseMessage] = useState("");
    let [licenseLockLV1, setLicenseLockLV1] = useState(false);
    let [licenseLockLV2, setLicenseLockLV2] = useState(false);
    const [deviceTypeChange, setDeviceTypeChange] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const disableBtnSearch = useRef(false);
    const btnExportExcel = useRef(null);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    let previousData = {};
    // let sensorName = localStorage.getItem('sensor').split(',');

    const db = ref(getDatabase());

    const handleChangeStartDate = (e) => {
        setDataSensorRange([]);

        const startTime = moment(e.$d).format("00:00 MM-DD-YYYY");
        setStartDate(startTime);
    };

    const handleChangeEndDate = (e) => {
        setDataSensorRange([]);

        const endTime = moment(e.$d).format("23:59 MM-DD-YYYY");
        setEndDate(endTime);
    };

    const handleOnChangeSelect = (e) => {
        // console.log(e.target.value);
        setStationId(e.target.value);
    };

    // hook
    const { deviceType, devices } = useListDevice(deviceTypeChange);

    // subtract hour
    const subTract7Hour = (startDateChoose, endDateChoose) => {

        const dateS = new Date(startDateChoose);
        const dateE = new Date(endDateChoose);

        const subtract7HoursStart = dateS.getTime() - 7 * 60 * 60 * 1000;
        const subtract7HoursEnd = dateE.getTime() - 7 * 60 * 60 * 1000;

        const startDate = moment(subtract7HoursStart).format(
            "YYYY-MM-DD HH:mm:ss"
        );
        const endDate = moment(subtract7HoursEnd).format("YYYY-MM-DD HH:mm:ss");
        return { startDate, endDate };
    };

    const getDataOfSensorRealtime = (
        idStation,
        nameSensor,
        startDateChoose = "13:30 11/15/2022",
        endDateChoose = "24:00 11/15/2022",
        endSensor,
        isRealValue = true,
        IsRealTime = true
    ) => {
        const { startDate, endDate } = subTract7Hour(
            startDateChoose,
            endDateChoose
        );

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
                // setCountGet((countGet) => countGet + 1);
                let dataSensorRange = {
                    name: nameSensor,
                    data: dataSensorGet.Detail,
                };
                // count.current = count.current + 1;
                setDataSensorRange((prv) => [...prv, dataSensorRange]);

                // dataSensorGet.Detail.forEach((v) => {
                //     let obj = {
                //         value: { name: nameSensor, val: v.avg_value },
                //         time: v.data_hora.value,
                //     };

                //     setDataSensorRange((prv) => [...prv, obj]);
                // });
            })
            .catch((error) => {
                const code = error.code;
                const message = error.message;
                const details = error.details;

                console.log({ code, message, details });
                Toast("error", "Vui lòng chọn trạm để tra cứu", 2000);
                setCountGet(0);
            });
    };

    let output = [];
    let output2 = [];

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
                let type = typeof item.value;
                if (type == "object") {
                    item.value = arr;
                }
                // console.log(item);
                output.push(item);
            }
        });
    };

    if (dataSensorRange.length === lstSensorName.length) {
        const dataEnd = [];
        const dataChart = [];
        dataSensorRange.forEach((v) => {
            let end = [];
            if (
                typeof v.data !== "undefined" &&
                v.data.length > 0 &&
                typeof v.data[0].avg_value !== "undefined"
            )
                v.data.map((item) => {
                    try {
                        if (item.status === null) item.status = 0;
                        let obj = {
                            value: {
                                name: v.name,
                                val: `${item.avg_value}*${item.status}`,
                            },
                            time: item.data_hora.value.slice(0, 16),
                        };

                        // return obj;
                        dataEnd.push(obj);
                        // dataChart.push(objChart);
                    } catch (e) { }
                    //
                });
        });

        if (dataEnd && dataEnd.length) {
            handleObjectSameKeyInArr(dataEnd);
            //handleObjectSameKeyInArr2(dataChart);
        }
    }

    // };
    // console.log({ count: countGet, leng: lstSensorName });
    let previousDataSensor = {};
    const mergeItemObjectArrToObject = (arr) => {
        return arr.map((v, index) => {
            let c = v.value.map((v2) => {
                let b = v2.val;
                let a = v2.name;
                let obj = { [a]: b };
                previousDataSensor[a] = b;
                return obj;
            });
            c.push({ time: moment(v.time).format("HH:mm DD/MM/YYYY ") });
            if (index === arr.length - 1) {
                for (let key in previousDataSensor) {
                    if (typeof c[key] === "undefined") {
                        let tempPreviousSensor = {};
                        tempPreviousSensor[key] = previousDataSensor[key];
                        c.push();
                    }
                }
            }
            c.push({ stt: index + 1 });
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
        output.sort(function (a, b) {
            var dateA = new Date(a.time);
            var dateB = new Date(b.time);
            return dateA - dateB;
        });
        let tempEndDataForChart = mergeItemObjectArrToObject(output);
        for (
            let indexData = 0;
            indexData < tempEndDataForChart.length;
            indexData++
        ) {
            for (
                let indexSensor = 0;
                indexSensor < lstSensorName.length;
                indexSensor++
            ) {
                if (lstSensorName[indexSensor] !== "Logs")
                    if (
                        typeof tempEndDataForChart[indexData][
                        lstSensorName[indexSensor]
                        ] !== "undefined"
                    ) {
                        previousData[lstSensorName[indexSensor]] =
                            tempEndDataForChart[indexData][
                            lstSensorName[indexSensor]
                            ];
                    } else {
                        if (
                            typeof previousData[lstSensorName[indexSensor]] !==
                            "undefined"
                        ) {
                            tempEndDataForChart[indexData][
                                lstSensorName[indexSensor]
                            ] = previousData[lstSensorName[indexSensor]];
                        }
                    }
            }
        }
        endDataForChart = tempEndDataForChart;
    }
    let dataChart = [];
    if (output2.length > 0) {
        dataChart = mergeItemObjectArrToObject(output2);
    }

    if (endDataForChart.length > 0) {
        disableBtnSearch.current = false;
    }

    const handleClickChart = () => {
        if (!valueSelect) {
            Toast("error", "Vui lòng chọn trạm để tra cứu", 2000);
            return;
        }
        navigate(`/search/chart/${valueSelect.label}`);
        dispatch(dataChartDetail(dataChart));
        dispatch(listSensorOfStation(lstSensorName));
    };

    const styleStateValue = (value) => {
        let stateSensor = value.split("*")[1];
        let statusStation = value.split("*")[1];

        // console.log(statusStation);
        return {
            padding: "5px ",
            borderRadius: "5px",
            color: "white",
            fontSize: "14px",
            backgroundColor:
                statusStation === "STATION_OFF"
                    ? "gray"
                    : stateSensor === "1"
                        ? "orange"
                        : stateSensor === "2"
                            ? "red"
                            : stateSensor === "0"
                                ? "#11cc67"
                                : "gray",
        };
    };
    async function fetchLicense(deviceIdTemp) {
        setLicenseMessage("");

        setLicenseLockLV1(false);

        setLicenseLockLV2(false);

        const token = Cookies.get("auth_token");

        const rawResponse = await fetch(
            "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-license",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    deviceId: deviceIdTemp,
                }),
            }
        );
        let content = await rawResponse.clone().json();

        // console.log(content);
        if (JSON.stringify(content) !== "{}") {
            //calculate days
            if (typeof content.StartDate !== "undefined") {
                let dateMomentObject = moment(content.StartDate, "DD-MM-YYYY"); // 1st argument - string, 2nd argument - format
                let dateObject = dateMomentObject.toDate(); // convert moment.js object to Date object
                // To calculate the time difference of two dates
                let Difference_In_Time =
                    new Date().getTime() - dateObject.getTime();

                // To calculate the no. of days between two dates
                let Difference_In_Days = (
                    Difference_In_Time /
                    (1000 * 3600 * 24)
                ).toFixed(0);
                //
                let licenseDays =
                    Number(content.NumberOfDays) - Difference_In_Days;
                licenseDays = licenseDays < 0 ? 0 : licenseDays;
                //Toast("success", `Số ngày còn lại ${licenseDays}`);
                setLicenseDay(licenseDays);
            }
            if (
                typeof content.AlarmMessage !== "undefined" &&
                content.AlarmMessage !== ""
            ) {
                setLicenseMessage(content.AlarmMessage);
            }
            if (typeof content.Lock !== "undefined") {
                setLicenseLockLV1(content.Lock);
                if (content.Lock) {
                    Toast(
                        "error",
                        "Trạm đã bị khóa. Vui lòng quay về trang chủ để xem chi tiết",
                        10000
                    );
                }
            }
            if (typeof content.LockLV2 !== "undefined") {
                setLicenseLockLV2(content.LockLV2);
                if (content.LockLV2) {
                    Toast(
                        "error",
                        "Trạm đã bị khóa. Vui lòng quay về trang chủ để xem chi tiết",
                        10000
                    );
                }
            }
        } else {
        }
    }
    const handleOnChangeSelectStation = (e, v) => {
        if (v !== null) {
            fetchLicense(v.id);
            setValueSelect(v);
            setStationId(v.id);

            setDataSensorRange([]);
        }
    };

    const handleOnchangeSelectDeviceType = (e, v) => {
        setValueSelect("");
        setDeviceTypeChange(v);
    };

    // export
    // const loadingExport = useRef(false);
    const handleClickExport = async (e) => {
        if (!valueSelect) {
            Toast("error", "Vui lòng chọn trạm để export", 2000);
            return;
        }
        if (!startDate || !endDate) {
            Toast("error", "Vui lòng chọn thời gian tra cứu");
            return;
        }
        var startC = moment(startDate);
        var endC = moment(endDate);

        const totalDate = endC.diff(startC, "days");
        if (totalDate > 100) {
            Toast(
                "error",
                "Thất bại. Chỉ có thể truy xuất dữ liệu ít hơn 100 ngày"
            );
            return;
        }

        get(child(db, `Devices/DAIVIET-RS485/${stationId}`))
            .then(async (snapshot) => {
                if (snapshot.exists()) {
                    let { RS485Data } = snapshot.val();
                    if (
                        typeof snapshot.val().IsDatalogger !== "undefined" &&
                        snapshot.val().IsDatalogger
                    ) {
                        setIsDatalogger(true);
                    }
                    RS485Data = RS485Data.filter(
                        (item) =>
                            item.MemoryType === 1 &&
                            !item.IsColumn &&
                            typeof item.Unit !== "undefined" &&
                            !item.Unit.toLowerCase().includes("kwh")
                    );

                    let s = [];
                    let tb = [];
                    RS485Data.map((v) => {
                        s.push(v.Name);
                    });

                    setlstSensorName(s);
                    Toast("info", "Vui lòng chờ trong ít phút", 5000);

                    const token = Cookies.get("auth_token");

                    console.log({ startDate, endDate });

                    const { startDate: start, endDate: end } = subTract7Hour(
                        startDate,
                        endDate
                    );
                    try {
                        setIsExportingExcel(true);
                        const res = await axios.get(
                            "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web",
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Access-Control-Allow-Origin": "*",
                                    "Access-Control-Allow-Credentials": "true",
                                },
                                params: {
                                    deviceId: stationId,
                                    listSensors: s.toString(),
                                    startDate: start,
                                    endDate: end,
                                    scale: "hour",
                                    email: "",
                                    isDatalogger: true,
                                    IsDemo: false,
                                },
                            }
                        );

                        if (res && res.data) {
                            // loadingExport.current = false;
                            const link = document.createElement("a");
                            link.href = res.data.link;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setIsExportingExcel(false);
                            Toast("success", "Xuất dữ liệu thành công", 2000);
                        } else {
                            Toast(
                                "error",
                                "Thất bại. Xin vui lòng thử lại sau",
                                2000
                            );
                            setIsExportingExcel(false);
                        }
                    } catch (err) {
                        console.log({ err });
                        const { response } = err;
                        if (
                            response.status === 500 &&
                            response.data.error === "Token is invalid"
                        ) {
                            const user = await handleAuthStateChanged();
                            const tokenData = await user.getIdToken();

                            Cookies.set("auth_token", tokenData, {
                                expires: 2147483647,
                            });
                            handleExportExcel();
                        }
                        setIsExportingExcel(false);
                    }
                } else {
                    console.log("No data available");
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // change type search
    const [changeTypeSearch, setTypeSearch] = useState(defaultTypeSearchData);
    const [timeSearch, setTimeSearch] = useState("");
    const [dateSearch, setDateSearch] = useState({
        start: moment(new Date()).format("00:00 MM/DD/YYYY"),
        end: moment(new Date()).format("23:59 MM/DD/YYYY"),
    });

    const [dataSearchDate, setDataSearchDate] = useState(null);
    const [dataSearchMonth, setDataSearchMonth] = useState(null);
    const [dataSearchHour, setDataSearchHour] = useState(null);

    const handleOnChangeTypeSearch = (e, v) => {
        console.log({ v });
        if (v) {
            setTimeSearch("");
            setTypeSearch(v);
        }
    };

    const handleChooseTimeSearch = (e, v) => {
        setTimeSearch(v);
        console.log({ v });
    };

    const handleOnchangeDateStart = (e) => {
        const date = moment(e.$d).format("YYYY-MM-DD 00:00");
        setDateSearch((prv) => ({ ...prv, start: date }));
    };

    const handleOnchangeDateEnd = (e) => {
        const date = moment(e.$d).format("YYYY-MM-DD 23:59");
        setDateSearch((prv) => ({ ...prv, end: date }));
    };

    const labelTime = {
        by_hour: "Chọn TB/Max/Min theo số giờ",
    };

    // call api
    const handleSearchByMonth = async (
        startDate,
        endDate,
        idStation,
        listSensorId
    ) => {
        setLoadingSearch(true);

        const fcGetDataAVGMinMaxByMonth = httpsCallable(
            functions,
            "GetDataAVGMinMaxByMonth"
        );
        // const { startDate: start, endDate: end } = subTract7Hour(
        //     startDate,
        //     endDate
        // );
        const data = {
            deviceId: idStation,
            startDate: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
            endDate: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
            listSensorId: listSensorId,
        };
        try {
            const result = await fcGetDataAVGMinMaxByMonth(data);
            setLoadingSearch(false);

            return JSON.parse(result.data);
        } catch (error) {
            setLoadingSearch(false);
        }
    };

    const handleSearchByHour = async (
        startDate,
        endDate,
        idStation,
        listSensorId,
        hours
    ) => {
        if (!hours) {
            return Toast("error", "Vui lòng chọn số giờ");
        }
        setLoadingSearch(true);

        const { startDate: start, endDate: end } = subTract7Hour(
            startDate,
            endDate
        );

        const fcGetDataAVGMinMaxByHours = httpsCallable(
            functions,
            "GetDataAVGMinMaxByHours"
        );

        const data = {
            deviceId: idStation,
            startDate: start,
            endDate: end,
            listSensorId: listSensorId,
            hours: hours,
        };
        console.clear()
        console.log({ data })
        try {
            const result = await fcGetDataAVGMinMaxByHours(data);
            setLoadingSearch(false);

            return JSON.parse(result.data);
        } catch (error) {
            setLoadingSearch(false);
        }
    };

    const handleSearchByDate = async (
        startDate,
        endDate,
        idStation,
        listSensorId
    ) => {
        setLoadingSearch(true);
        const GetDataAVGMinMaxByDate = httpsCallable(
            functions,
            "GetDataAVGMinMaxByDate"
        );
        // const { startDate: start, endDate: end } = subTract7Hour(
        //     startDate,
        //     endDate
        // );
        const data = {
            deviceId: idStation,
            startDate: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
            endDate: moment(endDate).format("YYYY-MM-DD HH:mm:ss"),
            listSensorId: listSensorId,
        };
        try {
            const result = await GetDataAVGMinMaxByDate(data);
            console.log({ result });
            setLoadingSearch(false);
            console.log(JSON.parse(result.data));
            return JSON.parse(result.data);
        } catch (error) {
            setLoadingSearch(false);
        }
    };

    const handleSearchNormal = () => {
        var start = moment(startDate);
        var end = moment(endDate);
        const totalDate = end.diff(start, "days");
        if (totalDate > 100) {
            Toast(
                "error",
                "Tìm kiếm thất bại. Chỉ có thể tìm kiếm dữ liệu ít hơn 100 ngày"
            );
            return;
        }
        setCountGet(0);

        setDataSensorRange([]);
        disableBtnSearch.current = true;

        get(child(db, `Devices/DAIVIET-RS485/${stationId}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    let { RS485Data } = snapshot.val();
                    if (
                        typeof snapshot.val().IsDatalogger !== "undefined" &&
                        snapshot.val().IsDatalogger
                    ) {
                        setIsDatalogger(true);
                    }
                    RS485Data = RS485Data.filter(
                        (item) =>
                            item.MemoryType === 1 &&
                            !item.IsColumn &&
                            typeof item.Unit !== "undefined" &&
                            !item.Unit.toLowerCase().includes("kwh")
                    );

                    let s = [];
                    let tb = [];
                    RS485Data.map((v) => {
                        s.push(v.Name);
                        tb.push({
                            id: v.Name,
                            label: `${v.Name}(${v.Unit})`,
                            align: "center",
                        });
                    });
                    s.unshift("Logs");
                    tb.unshift({
                        id: "Logs",
                        label: "Logs",
                        // minWidth: 60,
                        align: "center",
                    });
                    tb.unshift({
                        id: "time",
                        label: "Thời gian",
                        // minWidth: 60,
                        align: "center",
                        format: (value) =>
                            value.toLocaleString("en-US", { timeZone: "UTC" }),
                    });

                    tb.unshift({
                        id: "stt",
                        label: "#",
                        // minWidth: 60,
                        align: "center",
                    });

                    setListSensor(tb);
                    setlstSensorName(s);

                    let endSensor = s[s.length - 1];

                    const format = "YYYY-MM-DD HH:mm:ss";

                    // Chuyển đổi đối tượng Moment thành chuỗi theo định dạng mong muốn
                    const resultStringStartDate = start.format(format);

                    // Chuyển đổi đối tượng Moment thành chuỗi theo định dạng mong muốn
                    const resultStringEndDate = end.format(format);
                    const dataState = {
                        DeviceId: "",
                        LocationId: stationId,
                        fromDate: resultStringStartDate,
                        toDate: resultStringEndDate,
                        IsDefault: false,
                    };
                    const dataAlarm = {
                        locationId: stationId,
                        fromDate: resultStringStartDate,
                        toDate: resultStringEndDate,
                    };
                    const fcGetListOfNotifications = httpsCallable(
                        functionsUS,
                        "GetListOfNotifications"
                    );
                    const fcGetStateHistory = httpsCallable(
                        functionsUS,
                        "GetStateHistory"
                    );
                    if (!isDatalogger) {
                        fcGetListOfNotifications(dataAlarm).then((result) => {
                            //  
                            const dataAlarmGet = JSON.parse(result.data);
                            let alarmData = [];
                            for (
                                let i = 0;
                                i < dataAlarmGet.Detail.length;
                                i++
                            ) {
                                let itemAlarmData = {
                                    data_hora: dataAlarmGet.Detail[i].TIME,
                                    avg_value: dataAlarmGet.Detail[i].CONTENT,
                                    status: 2,
                                };
                                itemAlarmData.data_hora.value =
                                    itemAlarmData.data_hora.value.split(".")[0];
                                alarmData.push(itemAlarmData);
                                //  
                            }

                            fcGetStateHistory(dataState).then((result) => {
                                const dataSensorGet = JSON.parse(result.data);

                                // let data= dataSensorRange;
                                let logData = alarmData;
                                for (let i = 0; i < dataSensorGet.length; i++) {
                                    let itemLogData = {
                                        data_hora: dataSensorGet[i].CreateTime,
                                        avg_value: dataSensorGet[i].Log,
                                        status: 0,
                                    };
                                    itemLogData.data_hora.value =
                                        itemLogData.data_hora.value.split(
                                            "."
                                        )[0];
                                    if (
                                        !dataSensorGet[
                                            i
                                        ].Log.toLowerCase().includes("-c") &&
                                        !dataSensorGet[
                                            i
                                        ].Log.toLowerCase().includes(
                                            "high alarm"
                                        ) &&
                                        !dataSensorGet[
                                            i
                                        ].Log.toLowerCase().includes(
                                            "low alarm"
                                        )
                                    )
                                        logData.push(itemLogData);
                                }

                                let resultMap = new Map();

                                logData.forEach(function (element) {
                                    let value = element.data_hora.value.slice(
                                        0,
                                        16
                                    );
                                    let avgValue = element.avg_value;

                                    if (resultMap.has(value)) {
                                        let currentAvgValue =
                                            resultMap.get(value);
                                        resultMap.set(
                                            value,
                                            currentAvgValue + " + " + avgValue
                                        );
                                    } else {
                                        resultMap.set(value, avgValue);
                                    }
                                });

                                let resultArray = [];

                                resultMap.forEach(function (avgValue, value) {
                                    resultArray.push({
                                        data_hora: { value: value },
                                        avg_value: avgValue,
                                        status:
                                            avgValue
                                                .toLowerCase()
                                                .includes("alarm") ||
                                                avgValue
                                                    .toLowerCase()
                                                    .includes("cảnh báo")
                                                ? 2
                                                : 0,
                                    });
                                });
                                let dataLogRangeValue = {
                                    name: "Logs",
                                    data: resultArray,
                                };

                                setDataSensorRange((prv) => [
                                    ...prv,
                                    dataLogRangeValue,
                                ]);

                                // dataSensorRange.push(dataLogRangeValue);

                                let counter = 1;
                                s.forEach((sItem) => {
                                    if (sItem === "Logs") {
                                    } else
                                        getDataOfSensorRealtime(
                                            stationId,
                                            sItem,
                                            startDate,
                                            endDate,
                                            endSensor
                                        );
                                    counter++;
                                });
                            });
                        });
                    } else {
                        let alarmData = [];

                        // let data= dataSensorRange;
                        let logData = alarmData;

                        let resultMap = new Map();

                        logData.forEach(function (element) {
                            let value = element.data_hora.value.slice(0, 16);
                            let avgValue = element.avg_value;

                            if (resultMap.has(value)) {
                                let currentAvgValue = resultMap.get(value);
                                resultMap.set(
                                    value,
                                    currentAvgValue + " + " + avgValue
                                );
                            } else {
                                resultMap.set(value, avgValue);
                            }
                        });

                        let resultArray = [];

                        resultMap.forEach(function (avgValue, value) {
                            resultArray.push({
                                data_hora: { value: value },
                                avg_value: avgValue,
                                status:
                                    avgValue.toLowerCase().includes("alarm") ||
                                        avgValue.toLowerCase().includes("cảnh báo")
                                        ? 2
                                        : 0,
                            });
                        });
                        let dataLogRangeValue = {
                            name: "Logs",
                            data: resultArray,
                        };

                        setDataSensorRange((prv) => [
                            ...prv,
                            dataLogRangeValue,
                        ]);

                        // dataSensorRange.push(dataLogRangeValue);

                        let counter = 1;
                        s.forEach((sItem) => {
                            if (sItem === "Logs") {
                            } else
                                getDataOfSensorRealtime(
                                    stationId,
                                    sItem,
                                    startDate,
                                    endDate,
                                    endSensor
                                );
                            counter++;
                        });
                    }
                } else {
                    console.log("No data available");
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const resetStateDataSearch = () => {
        setDataSearchDate(null);
        setDataSearchHour(null);
        setDataSearchMonth(null);
    };
    const bulkTopicAction = async (token, topics, isSub) => {
        return await fetch("https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/bulk-topic-action", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                topics,
                isSub,
            }),
        }).then((res) => res.json());
    };

    const unsubscribeAllTopics = async (token) => {
        const key = `fcm_topics_${token.substring(0, 20)}`;
        const topicJson = localStorage.getItem(key);

        if (!topicJson) return;

        const topics = JSON.parse(topicJson);
        const result = await bulkTopicAction(token, topics, false);
        console.log("Unsubscribe result:", result);

        // Xóa cache sau khi unsubscribe
        localStorage.removeItem(key);
    };
    const auth = getAuth();
    const handleLogOut = async () => {
        await signOut(auth);

        const token = await getToken(messaging);
        if (token) {
            await unsubscribeAllTopics(token);
        }
        sessionStorage.clear();
        localStorage.clear();
        Cookies.remove("auth_token");
        Toast("success", "Bạn đã đăng xuất. Vui lòng đăng nhập lại");
        navigate("/");

    };
    const listSensorOfDevice = JSON.parse(
        localStorage.getItem(SENSOR_OF_DEVICE_KEY)
    );


    useEffect(() => {
        if (!listSensorOfDevice) {
            Toast("error", "Có lỗi xảy ra. Do thiếu dữ liệu mới. Bạn sẽ tự động logout sau 3s ra và đăng nhập lại");
            setTimeout(() => {
                handleLogOut()
            }, 3000);

        }
    }, [listSensorOfDevice])
    const handleClickSearch = async () => {
        if (!valueSelect) {
            Toast("error", "Vui lòng chọn trạm để tra cứu");
            return;
        }
        if (!listSensorOfDevice) {
            Toast("error", "Có lỗi xảy ra. Bạn sẽ tự động logout sau 2s ra và đăng nhập lại");
            setTimeout(() => {
                handleLogOut()
            }, 2000);

        }
        let listSensor = ["TSS", "DO", "pH", "NH4", "Temp", "COD"];

        listSensorOfDevice.forEach((v) => {
            if (v.device == valueSelect.id) {
                listSensor = v.sensors;
            }
        });


        if (!listSensor || listSensor.length < 0) {
            return Toast("error", "Có lỗi xảy ra. Vui lòng đăng nhập lại");
        }
        resetStateDataSearch();
        if (changeTypeSearch.type == "normal") {
            handleSearchNormal();
        } else if (changeTypeSearch.type == "by_month") {
            const res = await handleSearchByMonth(
                dateSearch.start,
                dateSearch.end,
                valueSelect.id,
                listSensor
            );
            console.log({ res });
            const { dataMin, dataMax, dataAVG, columnDefine } =
                handleDataSearchDateMonthHour(res, listSensor);

            setListSensor(columnDefine);
            setDataSearchMonth({ dataMin, dataMax, dataAVG });
        } else if (changeTypeSearch.type == "by_date") {
            const res = await handleSearchByDate(
                dateSearch.start,
                dateSearch.end,
                valueSelect.id,
                listSensor
            );
            console.log({ res });
            const { dataMin, dataMax, dataAVG, columnDefine } =
                handleDataSearchDateMonthHour(res, listSensor);

            setListSensor(columnDefine);
            setDataSearchDate({ dataMin, dataMax, dataAVG });
        } else if (changeTypeSearch.type == "by_hour") {
            const res = await handleSearchByHour(
                dateSearch.start,
                dateSearch.end,
                valueSelect.id,
                listSensor,
                timeSearch
            );
            console.log({ hour: res });

            const { dataMin, dataMax, dataAVG, columnDefine } =
                handleDataSearchDateMonthHour(res, listSensor);

            setListSensor(columnDefine);
            setDataSearchHour({ dataMin, dataMax, dataAVG });
        }
    };

    const [tabTable, setTabTable] = useState("avg");

    const handleChangeTabTable = (event, newValue) => {

        setTabTable(newValue);
    };

    return (
        <div className="search_page">
            <SubHeader text={"TRA CỨU VÀ BÁO CÁO DỮ LIỆU"} />
            {loadingSearch && <BackDropLoading />}
            {disableBtnSearch.current && <BackDropLoading />}

            {/* <SubHeader text={'GIÁM SÁT TRỰC TUYẾN TRẠM NƯỚC THẢI'} /> */}
            <div
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
                    <Grid item xl={4} lg={4} md={12} sm={12} xs={12}>
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
                    <Grid item xl={4} lg={4} md={12} sm={12} xs={12}>
                        <Autocomplete
                            id="controllable-states-demo"
                            size="small"
                            color="success"
                            onChange={handleOnChangeSelectStation}
                            options={devices}
                            value={valueSelect.label || null}
                            renderInput={(params) => (
                                <TextField {...params} label="Chọn trạm" />
                            )}
                        />
                    </Grid>

                    {!licenseLockLV1 && !licenseLockLV2 && (
                        <Grid item xl={4} lg={4} md={12} sm={12} xs={12}>
                            <Button
                                variant="contained"
                                style={{ backgroundColor: "#088f81" }}
                                fullWidth
                                // disabled={disableBtnSearch.current}
                                onClick={handleClickSearch}
                                startIcon={<SearchOutlinedIcon />}
                            >
                                tra cứu
                            </Button>
                        </Grid>
                    )}
                    {/* handle type search  */}
                    <Grid item xl={4} lg={4} md={12} sm={12} xs={12}>
                        <Autocomplete
                            id="controllable-states-demo"
                            size="small"
                            color="success"
                            onChange={handleOnChangeTypeSearch}
                            options={typeSearchData}
                            value={changeTypeSearch?.label || null}
                            renderInput={(params) => (
                                <TextField {...params} label="Loại tra cứu" />
                            )}
                        />
                    </Grid>
                    {changeTypeSearch.type === "by_hour" && (
                        <Grid item xl={4} lg={4} md={12} sm={12} xs={12}>
                            <Autocomplete
                                id="controllable-states-demo"
                                size="small"
                                color="success"
                                onChange={handleChooseTimeSearch}
                                options={selectionByType[changeTypeSearch.type]}
                                value={timeSearch || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={labelTime[changeTypeSearch.type]}
                                    />
                                )}
                            />
                        </Grid>
                    )}

                    {changeTypeSearch.type === "normal" && (
                        <>
                            <Grid item xl={4} lg={4} md={6} sm={6} xs={12}>
                                <MyDateRange
                                    label={"Bắt đầu"}
                                    onChange={handleChangeStartDate}
                                    value={startDate}
                                />
                            </Grid>

                            <Grid item xl={4} lg={4} md={6} sm={6} xs={12}>
                                <MyDateRange
                                    label={"Kết thúc"}
                                    onChange={handleChangeEndDate}
                                    value={endDate}
                                />
                            </Grid>
                        </>
                    )}

                    {changeTypeSearch.type !== "normal" ? (
                        <>
                            <Grid item xl={2} lg={2} md={12} sm={12} xs={12}>
                                <DayPicker
                                    label={"Bắt đầu"}
                                    onChange={handleOnchangeDateStart}
                                    value={dateSearch.start}
                                />
                            </Grid>
                            <Grid item xl={2} lg={2} md={12} sm={12} xs={12}>
                                <DayPicker
                                    label={"Kết thúc"}
                                    onChange={handleOnchangeDateEnd}
                                    value={dateSearch.end}
                                />
                            </Grid>
                        </>
                    ) : (
                        <></>
                    )}

                    {/* <Grid item xl={1.5} lg={1.5} md={12} sm={12} xs={12}>
                        <Button
                            variant="contained"
                            style={{ backgroundColor: "#088f81" }}
                            fullWidth
                            disabled={disableBtnSearch.current}
                            onClick={handleClickSearch}
                            startIcon={<SearchOutlinedIcon />}
                        >
                            XUẤT EXCEL
                        </Button>
                    </Grid> */}
                    {dataSearchDate || dataSearchHour || dataSearchMonth ? (
                        <></>
                    ) : (
                        isDatalogger && (
                            <Grid item xl={2} lg={2} md={6} sm={6} xs={12}>
                                <Button
                                    variant="contained"
                                    ref={btnExportExcel}
                                    className="btn_export-excel"
                                    style={{
                                        backgroundColor: isExportingExcel ? "#f5f5f5" : "rgb(17, 141, 79)",
                                        color: isExportingExcel ? "#666" : "white",
                                        minHeight: 40,
                                    }}
                                    fullWidth
                                    onClick={handleClickExport}
                                    disabled={loadingSearch || isExportingExcel}
                                    startIcon={null}
                                >
                                    {isExportingExcel ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Box
                                                component="img"
                                                src="/image/navis.png"
                                                alt="Loading"
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    objectFit: "contain",
                                                    borderRadius: "4px",
                                                    animation: "pulse 1s ease-in-out infinite",
                                                    "@keyframes pulse": {
                                                        "0%, 100%": { opacity: 1, transform: "scale(1)" },
                                                        "50%": { opacity: 0.6, transform: "scale(0.9)" },
                                                    },
                                                }}
                                            />
                                            <span>Đang xuất...</span>
                                        </Box>
                                    ) : (
                                        "Export Excel"
                                    )}
                                </Button>
                            </Grid>
                        )
                    )}
                </Grid>
            </div>
            <div className="table">
                {dataSearchDate && (
                    <>
                        <TabTable
                            tabTable={tabTable}
                            handleChangeTabTable={handleChangeTabTable}
                            listSensor={listSensor}
                            dataAVG={dataSearchDate.dataAVG}
                            dataMin={dataSearchDate.dataMin}
                            dataMax={dataSearchDate.dataMax}
                        />
                    </>
                )}
                {dataSearchMonth && (
                    <TabTable
                        tabTable={tabTable}
                        handleChangeTabTable={handleChangeTabTable}
                        listSensor={listSensor}
                        dataAVG={dataSearchMonth.dataAVG}
                        dataMin={dataSearchMonth.dataMin}
                        dataMax={dataSearchMonth.dataMax}
                    />
                )}
                {dataSearchHour && (
                    <TabTable
                        tabTable={tabTable}
                        handleChangeTabTable={handleChangeTabTable}
                        listSensor={listSensor}
                        dataAVG={dataSearchHour.dataAVG}
                        dataMin={dataSearchHour.dataMin}
                        dataMax={dataSearchHour.dataMax}
                    />
                )}
                {endDataForChart.length > 0 &&
                    !dataSearchDate &&
                    !dataSearchHour &&
                    !dataSearchMonth && (
                        <>
                            <MyTable
                                columns={listSensor}
                                rows={endDataForChart}
                                styleStateValue={styleStateValue}
                            />
                        </>
                    )}

                {endDataForChart.length <= 0 &&
                    !dataSearchDate &&
                    !dataSearchHour &&
                    !dataSearchMonth ? (
                    <p
                        style={{
                            textAlign: "center",
                            fontSize: "18px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "40vh",
                        }}
                    >
                        <span>Chưa có dữ liệu để hiện thị</span>
                    </p>
                ) : null}
            </div>
        </div>
    );
}

export default Search;
