import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
    Grid,
    Button,
    LinearProgress,
    Autocomplete,
    TextField,
} from "@mui/material";
import { CSVLink, CSVDownload } from "react-csv";

import SubHeader from "../../components/SubHeader";
import MySelect from "../../components/MySelect";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";

import "./Notifications.scss";
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
} from "firebase/auth";
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
function Notification() {
    const [startDate, setStartDate] = useState(
        moment(new Date()).format("00:00 MM/DD/YYYY")
    );
    const [endDate, setEndDate] = useState(
        moment(new Date()).format("HH:mm MM/DD/YYYY")
    );

    const [menuValue, setMenuSelect] = useState([]);
    const [dataSensorRange, setDataSensorRange] = useState([]);
    const [countGet, setCountGet] = useState(0);
    const [stationId, setStationId] = useState("");
    const [endGetSensor, setEndGetSensor] = useState(false);
    const [listSensor, setListSensor] = useState([]);
    const [lstSensorName, setlstSensorName] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);

    const [valueSelect, setValueSelect] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const disableBtnSearch = useRef(false);
    const btnExportExcel = useRef(null);
    let previousData = {};
    // let sensorName = localStorage.getItem('sensor').split(',');

    const db = ref(getDatabase());

    const handleChangeStartDate = (e) => {
        setDataSensorRange([]);

        const startTime = moment(e.$d).format("HH:mm MM-DD-YYYY");
        setStartDate(startTime);
    };

    const handleChangeEndDate = (e) => {
        setDataSensorRange([]);

        const endTime = moment(e.$d).format("HH:mm MM-DD-YYYY");
        setEndDate(endTime);
    };

    const handleOnChangeSelect = (e) => {
        // console.log(e.target.value);
        setStationId(e.target.value);
    };

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);

    useEffect(() => {
        let devices = [];

        if (listDevice) {
            const id = Object.keys(listDevice);
            id.map((v) => {
                devices.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                });
            });
        }
        setMenuSelect(devices);
    }, []);

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

                console.log({ dataSensorRange });
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
                    } catch (e) {}
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
                if (lstSensorName[indexSensor] !== "Alarms")
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

    const handleClickSearch = () => {
        if (!valueSelect) {
            Toast("error", "Vui lòng chọn trạm để tra cứu", 2000);
            return;
        }
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
        setLoadingSearch(true);
        disableBtnSearch.current = true;

        let s = [];
        let tb = [];

        s.unshift("Alarms");
        tb.unshift({
            id: "Alarms",
            label: "Alarms",
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

        console.log("Data Search...");
        console.log({ s });
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

        fcGetListOfNotifications(dataAlarm).then((result) => {
            const dataAlarmGet = JSON.parse(result.data);
            console.log({
                dataAlarmGet,
            });
            let alarmData = [];
            if (dataAlarmGet.Detail.length === 0) {
                setLoadingExport(false);
                disableBtnSearch.current = false;
                setDataSensorRange([]);
                Toast(
                    "error",
                    "Không có dữ liệu trong khoảng thời gian này",
                    2000
                );

                return;
            }
            for (let i = 0; i < dataAlarmGet.Detail.length; i++) {
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

            // let data= dataSensorRange;
            let logData = alarmData;

            let resultMap = new Map();

            logData.forEach(function (element) {
                let value = element.data_hora.value.slice(0, 16);
                let avgValue = element.avg_value;

                if (resultMap.has(value)) {
                    let currentAvgValue = resultMap.get(value);
                    resultMap.set(value, currentAvgValue + " + " + avgValue);
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
                name: "Alarms",
                data: resultArray,
            };

            setDataSensorRange((prv) => [...prv, dataLogRangeValue]);

            // dataSensorRange.push(dataLogRangeValue);

            let counter = 1;
            s.forEach((sItem) => {
                if (sItem === "Alarms") {
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
    };

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

    const handleOnChangeSelectStation = (e, v) => {
        if (v !== null) {
            setValueSelect(v);
            setStationId(v.id);

            setDataSensorRange([]);
        }
    };

    // console.log({ startDate, endDate });

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

        Toast("info", "Vui lòng chờ trong ít phút", 5000);

        const token = Cookies.get("auth_token");

        console.log({ startDate, endDate });

        const { startDate: start, endDate: end } = subTract7Hour(
            startDate,
            endDate
        );
        try {
            btnExportExcel.current.disabled = true;
            btnExportExcel.current.innerHTML = "Waiting...";
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
                        listSensors: lstSensorName.toString(),
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
                btnExportExcel.current.disabled = false;
                btnExportExcel.current.innerHTML = "Export Excel";
                Toast("success", "Xuát dữ liệu thành công", 2000);
            } else {
                Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
                btnExportExcel.current.disabled = false;
                btnExportExcel.current.innerHTML = "Export Excel";
            }
        } catch (err) {
            console.log({ err });
            const { response } = err;
            if (
                response.status === 500 &&
                response.data.error === "Token is invalid"
            ) {
                const user = await handleAuthStateChanged();
                console.log("User authenticated:", user.uid);
                const tokenData = await user.getIdToken();

                Cookies.set("auth_token", tokenData, { expires: 2147483647 });
                handleExportExcel();
            }
            btnExportExcel.current.disabled = false;
            btnExportExcel.current.innerHTML = "Export Excel";
        }
    };

    return (
        <div className="search_page">
            <SubHeader text={"TRA CỨU DỮ LIỆU CẢNH BÁO"} />
            {/* <SubHeader text={'GIÁM SÁT TRỰC TUYẾN TRẠM NƯỚC THẢI'} /> */}
            <div style={{
                    border: "1.5px solid #ccc",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "white",
                    fontWeight: "600",
                    borderRadius: "3px",
                }}>
                <Grid container spacing={1}>
                    <Grid item xl={3} lg={3} md={12} sm={12} xs={12}>
                        <Autocomplete
                            id="controllable-states-demo"
                            size="small"
                            color="success"
                            onChange={handleOnChangeSelectStation}
                            options={menuValue}
                            value={valueSelect.label || null}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Chọn trạm tra cứu"
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xl={2} lg={2} md={6} sm={6} xs={12}>
                        <MyDateRange
                            label={"Bắt đầu"}
                            onChange={handleChangeStartDate}
                            value={startDate}
                        />
                    </Grid>

                    <Grid item xl={2} lg={2} md={6} sm={6} xs={12}>
                        <MyDateRange
                            label={"Kết thúc"}
                            onChange={handleChangeEndDate}
                            value={endDate}
                        />
                    </Grid>
                    <Grid item xl={1.5} lg={1.5} md={12} sm={12} xs={12}>
                        <Button
                            variant="contained"
                            style={{ backgroundColor: "#088f81" }}
                            fullWidth
                            disabled={disableBtnSearch.current}
                            onClick={handleClickSearch}
                            startIcon={<SearchOutlinedIcon />}
                        >
                            tra cứu
                        </Button>
                    </Grid>

                    <Grid item xl={2} lg={2} md={6} sm={6} xs={12}>
                        {/* <Button
                            variant="contained"
                            ref={btnExportExcel}
                            className="btn_export-excel"
                            style={{ backgroundColor: 'rgb(17, 141, 79)' }}
                            fullWidth
                            onClick={handleClickExport}
                            // disabled={endDataForChart.length ? false : true}
                            startIcon={null}>
                            Export Excel
                        </Button> */}
                        {/* <button
                            ref={btnExportExcel}
                            className="btn_export-excel"
                            onClick={handleClickExport}>
                            Export
                        </button> */}
                    </Grid>
                </Grid>
            </div>
            <div className="table">
                {endDataForChart.length ? (
                    <>
                        <MyTable
                            columns={listSensor}
                            rows={endDataForChart}
                            styleStateValue={styleStateValue}
                        />
                    </>
                ) : (
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
                        {disableBtnSearch.current ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <CircularProgress color="success" />
                                <div style={{ marginTop: "10px" }}>
                                    {" "}
                                    Vui lòng chờ <br />
                                    Thời gian càng dài tìm kiếm càng lâu.....{" "}
                                    <br />
                                    {/* Bạn có thể export ra excel để coi nhanh hơn */}
                                </div>
                            </div>
                        ) : (
                            <span>Chưa có dữ liệu để hiện thị</span>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Notification;
