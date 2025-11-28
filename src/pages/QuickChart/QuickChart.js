import moment from "moment";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useDispatch } from "react-redux";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import CardValueSensor from "../../components/CardValueSensor/CardValueSensor";
import CoilValueDevice from "../../components/CoilValueDevice";
import TextField from "@mui/material/TextField";

import Autocomplete from "@mui/material/Autocomplete";
import MapD from "../../components/MapD";
import MainChart from "../../components/MyChart/MainChart";
import ColumnChartSensor from "../../components/MyChart/ColumnChartSensor";
import Loading from "../../components/Loading";
import MyDateRange from "../../components/DateRange";
import Toast from "../../utils/toasts";
import { getDatabase, onValue, ref } from "firebase/database";
import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    collection,
} from "firebase/firestore";
import MySelect from "../../components/MySelect";
import SubHeader from "../../components/SubHeader";
import AlarmNote from "../../components/AlarmNote";
import NormalNote from "../../components/NormalNote";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import "./QuickChart.scss";
import axios from "axios";
import { Backdrop, CircularProgress, Skeleton } from "@mui/material";
import compareDate from "../../utils/compare_date";
import { getUniqueListBy } from "../../utils/function";

import { getSensorName } from "../../redux/reducer/dataSensorSlice";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import AsyncLocalStorage from "../../utils/async_localstorage";

import { useNavigate } from "react-router-dom";
import MyButton from "../../components/MyButton";
import { dbStore, messaging, onMessageListener } from "../../config/firebase";
import Cookies from "js-cookie";
import LoadingOverlay from "react-loading-overlay-ts";
// import ConfirmationDialog from '../../ConfirmationDialog';
import styled, { css } from "styled-components";

import { Button, Paper, Typography } from "@mui/material";
import { makeStyles } from "@material-ui/styles";
const useStyles = makeStyles((theme) => ({
    container: {
        display: "flex",
        flexDirection: "column",
        // alignItems: "center",
        justifyContent: "center",
    },
    chatContainer: {
        // maxWidth: "90%",
        marginTop: "10px",
        padding: 2,
        marginBottom: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "500px",
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

import { getAuth, onAuthStateChanged } from "firebase/auth";

import CameraChild from "../Camera/CameraChild";
import ConfirmationDialogSensor from "../../components/ConfirmationDialogSensor";
import { handleGetSettingThreshold } from "../../utils/handleGetSettingThreshold";
import { TIME_DEVICE_OFF } from "../../constants";
let email = localStorage.getItem("loginEmail");
 // Function to subscribe/unsubscribe token to/from a topic
 const subscribeTokenToTopic = async (token,topic, isSub,) => {
    if (!token) {
      console.error("No token available for subscription.");
      return;
    }

    try {
      const response = await fetch("https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/subscribe-to-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          topic: topic,
          isSub: isSub,
        }),
      });

      if (response.ok) {
        console.log(`Successfully ${isSub ? "subscribed" : "unsubscribed"} to topic ${topic}`);
       
      } else {
        console.error("Failed to subscribe/unsubscribe.");
      }
    } catch (err) {
      console.error("Error while subscribing/unsubscribing:", err);
    }
  };
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

const DarkBackground = styled.div`
    display: none; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 999; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0, 0, 0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */

    ${(props) =>
        props.disappear &&
        css`
            display: block; /* show */
        `}
`;

function QuickChartV1() {
    const classes = useStyles();
    let [isRerenderCard, setIsRerenderCard] = useState(false);
    let [inputText, setInputText] = useState("");
    let [lastimeActive, setLastimeActive] = useState("");
    let [textList, setTextList] = useState([]);
    let [isDeviceOffline, setIsDeviceOffline] = useState(false);
    let [licenseData, setLicenseData] = useState({});

    let [licenseDay, setLicenseDay] = useState(-1);
    let [licenseMessage, setLicenseMessage] = useState("");
    let [licenseLockLV1, setLicenseLockLV1] = useState(false);
    let [licenseLockLV2, setLicenseLockLV2] = useState(false);

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const handleKeyPress = async (event) => {
        if (event.key === "Enter") {
            let userTemp = user;

            addTextToList();
        }
    };

    const addTextToList = () => {
        if (inputText.trim() !== "") {
            let userTemp = user;
            fetch(
                "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/create-note",
                {
                    method: "POST",
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Credentials": "true",
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: inputText,
                        deviceId: valueSelect.id,
                        userName: userTemp.displayName + `(${userTemp.email})`,
                    }),
                }
            );
            inputText =
                userTemp.displayName + `(${userTemp.email}): ` + inputText;
            const newMessage = {
                name: userTemp.displayName + `(${userTemp.email})`,
                content: inputText,
                timestamp: moment(new Date())
                    .add(0, "h")
                    .format("YYYY/MM/DD HH:mm"),
            };
            setTextList([newMessage, ...textList]);
            setInputText("");
        }
    };
    async function fetchDataNote() {
        //  textList = [];
        // setTextList([]);
        while (textList.length != 0) {
            textList.shift();
        }
        let deviceIdTemp = valueSelect.id;
        var requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(
            valueSelect.id.includes("NNV")
                ? `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-note?deviceId=${deviceIdTemp}`
                : `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-note-tpn?locationId=${deviceIdTemp}`,
            requestOptions
        )
            .then((response) => response.text())
            .then((result) => {
                result = JSON.parse(result);

                for (let i = 0; i < result.length; i++) {
                    const newMessage = {
                        name: result[i].UserName,
                        content: result[i].Content,
                        Image: result[i].Image,
                        timestamp: moment(
                            valueSelect.id.includes("NNV")
                                ? result[i].CreateTime.value
                                : result[i].CreateTime.value.replace("Z", "")
                        )
                            .add(0, "h")
                            .format("YYYY/MM/DD HH:mm"),
                    };
                    textList.push(newMessage);
                }
                setTextList([...textList]);
            })
            .catch((error) => console.log("error", error));
    }


    async function fetchLicense() {
        setLicenseDay(-1);
        setLicenseMessage("");
    
        setLicenseLockLV1(false);
    
        setLicenseLockLV2(false);
    
        setLicenseData({});
    

        const token = Cookies.get("auth_token");
        let deviceIdTemp = valueSelect.id;
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
        
                    deviceId: deviceIdTemp
            
                }),
            }
        );
        let content = await rawResponse.clone().json();

        // console.log(content);
        if (JSON.stringify(content) !== "{}") {
     
            //calculate days
            if(typeof content.StartDate !== "undefined"){
                let dateMomentObject = moment(content.StartDate, "DD-MM-YYYY"); // 1st argument - string, 2nd argument - format
                let dateObject = dateMomentObject.toDate(); // convert moment.js object to Date object
                // To calculate the time difference of two dates 
                let Difference_In_Time = (new Date()).getTime() - dateObject.getTime(); 
                
                // To calculate the no. of days between two dates 
                let Difference_In_Days = (Difference_In_Time / (1000 * 3600 * 24)).toFixed(0); 
                // 
                let licenseDays = Number(content.NumberOfDays) - Difference_In_Days
                licenseDays = licenseDays < 0 ? 0 : licenseDays;
                //Toast("success", `Số ngày còn lại ${licenseDays}`);
                setLicenseDay(licenseDays);
            }
            if(typeof content.AlarmMessage !== "undefined" && content.AlarmMessage !== ""){
                setLicenseMessage(content.AlarmMessage);
            }
            if(typeof content.Lock !== "undefined" ){
               
                setLicenseLockLV1(content.Lock);
             
            }
            if(typeof content.LockLV2 !== "undefined"){
                setLicenseLockLV2(content.LockLV2);
                if(licenseDay === 0)  setLicenseLockLV2(true);
            }
            setLicenseData(content);
        }
        else {
        
        }
     
    }

    const [user, setUser] = useState(null);
    useEffect(() => {
        const auth = getAuth();
        // Xử lý sự kiện khi người dùng đăng nhập hoặc đăng xuất
        onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // Nếu người dùng đã đăng nhập, kiểm tra token có hết hạn không
                user.getIdTokenResult()
                    .then((idTokenResult) => {
                        if (idTokenResult.expirationTime <= Date.now()) {
                            // Token đã hết hạn, tạo lại token mới
                            return user.getIdToken(true);
                        } else {
                            // Token còn hạn, không cần tạo lại
                            return idTokenResult.token;
                        }
                    })
                    .then((token) => {
                        Cookies.set("auth_token", token, {
                            expires: 2147483647,
                        });
                    })
                    .catch((error) => {
                        console.error("Lỗi khi tạo lại token:", error);
                    });
            } else {
                // Người dùng đã đăng xuất, xóa token từ localStorage hoặc nơi khác
                localStorage.removeItem("token");
            }
        });
    }, []);
    const handleOpen = () => {
        setIsOpenDialog(true);
    };

    const handleClose = () => {
        setIsOpenDialog(false);
    };
    const handleOpenSensor = () => {
        setIsOpenDialogSensor(true);
    };

    const handleCloseSensor = () => {
        setIsOpenDialogSensor(false);
    };
    const handleConfirmSensor = async (newSensorObject, oldSensorValue) => {
         
        try {
            const idTokenResult = await user.getIdTokenResult();
            if (idTokenResult.expirationTime <= Date.now()) {
                // Token đã hết hạn, tạo lại token mới

                const token = await user.getIdToken(true);
                Cookies.set("auth_token", token, {
                    expires: 2147483647,
                });
            } else {
                // Token còn hạn, không cần tạo lại
                const token = idTokenResult.token;
                Cookies.set("auth_token", token, {
                    expires: 2147483647,
                });
            }
        } catch (error) {
            console.error("Lỗi khi tạo lại token:", error);
        }

        let commnanData = {
            
        };
        commnanData["RS485-Commands"] = [];
        let deviceID = valueSelect.id;
        if (
            newSensorObject.AlarmSetting.HighAlarmSetting !==
            oldSensorValue.AlarmSetting.HighAlarmSetting
        ) {
            let highAlarm = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.includes("HighAlarmSetting") &&
                    item.Name.includes(newSensorObject.sensor)
                );
            })[0];

            if (typeof highAlarm.Location !== "undefined") {
                deviceID = highAlarm.Location;
            }
            commnanData["RS485-Commands"].push({
                Address: highAlarm.Address,
                SlaveId: highAlarm.SlaveId,
                FunctionCode: 16,
                DataLength: 2,
                CSDeviceId:
                    typeof highAlarm.CSLocation !== "undefined"
                        ? highAlarm.CSLocation
                        : "",
                Type: highAlarm.Type,
                Value: newSensorObject.AlarmSetting.HighAlarmSetting,
                Name: highAlarm.Name,
                Index: highAlarm.Index,
            });
        }
        if (
            newSensorObject.AlarmSetting.LowAlarmSetting !==
            oldSensorValue.AlarmSetting.LowAlarmSetting
        ) {
            let lowAlarm = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.includes("LowAlarmSetting") &&
                    item.Name.includes(newSensorObject.sensor)
                );
            })[0];
            if (typeof lowAlarm.Location !== "undefined") {
                deviceID = lowAlarm.Location;
            }
            commnanData["RS485-Commands"].push({
                Address: lowAlarm.Address,
                SlaveId: lowAlarm.SlaveId,
                FunctionCode: 16,
                DataLength: 2,
                CSDeviceId:
                    typeof lowAlarm.CSLocation !== "undefined"
                        ? lowAlarm.CSLocation
                        : "",
                Type: lowAlarm.Type,
                Value: newSensorObject.AlarmSetting.LowAlarmSetting,
                Name: lowAlarm.Name,
                Index: lowAlarm.Index,
            });
        }
        if (
            newSensorObject.AlarmSetting.DelayTime !==
            oldSensorValue.AlarmSetting.DelayTime
        ) {
            let delayTime = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.includes("DelayTime") &&
                    item.Name.includes(newSensorObject.sensor)
                );
            })[0];
            if (typeof delayTime.Location !== "undefined") {
                deviceID = delayTime.Location;
            }
            commnanData["RS485-Commands"].push({
                Address: delayTime.Address,
                SlaveId: delayTime.SlaveId,
                FunctionCode: 6,
                DataLength: 1,
                CSDeviceId:
                    typeof delayTime.CSLocation !== "undefined"
                        ? delayTime.CSLocation
                        : "",
                Type: delayTime.Type,
                Value: newSensorObject.AlarmSetting.DelayTime,
                Name: delayTime.Name,
                Index: delayTime.Index,
            });
        }

        const token = Cookies.get("auth_token");
        const rawResponse = await fetch(
            "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/handleCoilDevice",
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
                    message: JSON.stringify(commnanData),
                    deviceId: deviceID,
                    IsDemoUI:
                        typeof fullRS485Data.IsDemoUI !== "undefined" &&
                        fullRS485Data.IsDemoUI === true,
                }),
            }
        );
        let content = await rawResponse.clone().json();

        // console.log(content);
        if (!JSON.stringify(content).includes("RS485")) {
            Toast(
                "error",
                "Thay đổi giá trị hoặc điều khiển thất bại. Vui lòng thử lại"
            );
        } else {
            Toast("success", "Tín hiệu gửi đi thành công.");
        }
    };

    const handleConfirm = async (coilObject) => {
        if (!isNoButton) return;

        try {
            const idTokenResult = await user.getIdTokenResult();
            if (idTokenResult.expirationTime <= Date.now()) {
                // Token đã hết hạn, tạo lại token mới

                const token = await user.getIdToken(true);
                Cookies.set("auth_token", token, {
                    expires: 2147483647,
                });
            } else {
                // Token còn hạn, không cần tạo lại
                const token = idTokenResult.token;
                Cookies.set("auth_token", token, {
                    expires: 2147483647,
                });
            }
        } catch (error) {
            console.error("Lỗi khi tạo lại token:", error);
        }

        let commnanData = {};
        commnanData["RS485-Commands"] = [];
        let previousControl = coilObject;

        let sendingValue = 0;
        //analyze coil
        if (
            typeof coilObject.SlaveId2 === "undefined" &&
            typeof coilObject.Address2 === "undefined"
        ) {
            sendingValue = coilObject.Value === 1 ? 0 : 1;
        } else {
            //find
            let coilControl = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Address === coilObject.Address2 &&
                    item.SlaveId === coilObject.SlaveId2
                );
            })[0];
            sendingValue = coilControl.Value === 1 ? 0 : 1;
        }
        let deviceID = valueSelect.id;
        if (typeof coilObject.Location !== "undefined") {
            deviceID = coilObject.Location;
        }
        if (typeof coilObject.GetBit === "undefined") {
            commnanData["RS485-Commands"].push({
                Address:
                    typeof coilObject.SlaveId2 !== "undefined" &&
                    typeof coilObject.Address2
                        ? coilObject.Address2
                        : coilObject.Address,
                SlaveId:
                    typeof coilObject.SlaveId2 !== "undefined" &&
                    typeof coilObject.Address2
                        ? coilObject.SlaveId2
                        : coilObject.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coilObject.CSLocation !== "undefined"
                        ? coilObject.CSLocation
                        : "",
                Type: coilObject.Type,
                CoilValue: sendingValue == 1,
                Value: sendingValue,
                Name: coilObject.Name,
                Index: coilObject.Index,
            });
            if (typeof coilObject.SlaveId2 !== "undefined") {
                commnanData["RS485-Commands"].push({
                    Address: coilObject.Address,
                    SlaveId: coilObject.SlaveId,
                    FunctionCode: 5,
                    DataLength: 1,
                    CSDeviceId:
                        typeof coilObject.CSLocation !== "undefined"
                            ? coilObject.CSLocation
                            : "",
                    Type: coilObject.Type,

                    Name: coilObject.Name,
                    Index: coilObject.Index,
                });
            }
        } else {
            commnanData["RS485-Commands"].push({
                Address:
                    typeof coilObject.SlaveId2 !== "undefined" &&
                    typeof coilObject.Address2
                        ? coilObject.Address2
                        : coilObject.Address,
                SlaveId:
                    typeof coilObject.SlaveId2 !== "undefined" &&
                    typeof coilObject.Address2
                        ? coilObject.SlaveId2
                        : coilObject.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                Type: coilObject.Type,
                CSDeviceId:
                    typeof coilObject.CSLocation !== "undefined"
                        ? coilObject.CSLocation
                        : "",
                CoilValue: sendingValue == 1,
                Value: sendingValue,
                Name: coilObject.Name,
                Index: coilObject.Index,
                GetBit: coilObject.GetBit,
            });
        }

        //
        if (
            coilObject.GroupName.toLowerCase().includes("mode") &&
            coilObject.Name.toLowerCase().includes("man")
        ) {
            let coil = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.toLowerCase().includes("off") &&
                    item.GroupName.toLowerCase().includes("mode")
                );
            })[0];
            commnanData["RS485-Commands"].push({
                Address: coil.Address,
                SlaveId: coil.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coil.CSLocation !== "undefined"
                        ? coil.CSLocation
                        : "",
                Type: coil.Type,
                Name: coil.Name,
                Index: coil.Index,
            });
            coil = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.toLowerCase().includes("auto") &&
                    item.GroupName.toLowerCase().includes("mode")
                );
            })[0];
            commnanData["RS485-Commands"].push({
                Address: coil.Address,
                SlaveId: coil.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coil.CSLocation !== "undefined"
                        ? coil.CSLocation
                        : "",
                Type: coil.Type,
                Name: coil.Name,
                Index: coil.Index,
            });
        } else if (
            coilObject.GroupName.toLowerCase().includes("mode") &&
            coilObject.Name.toLowerCase().includes("auto")
        ) {
            let coil = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.toLowerCase().includes("off") &&
                    item.GroupName.toLowerCase().includes("mode")
                );
            })[0];
            commnanData["RS485-Commands"].push({
                Address: coil.Address,
                SlaveId: coil.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coil.CSLocation !== "undefined"
                        ? coil.CSLocation
                        : "",
                Type: coil.Type,
                Name: coil.Name,
                Index: coil.Index,
            });
            coil = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.toLowerCase().includes("man") &&
                    item.GroupName.toLowerCase().includes("mode")
                );
            })[0];
            commnanData["RS485-Commands"].push({
                Address: coil.Address,
                SlaveId: coil.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coil.CSLocation !== "undefined"
                        ? coil.CSLocation
                        : "",
                Type: coil.Type,
                Name: coil.Name,
                Index: coil.Index,
            });
        } else if (
            coilObject.GroupName.toLowerCase().includes("mode") &&
            coilObject.Name.toLowerCase().includes("off")
        ) {
            let coil = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.toLowerCase().includes("auto") &&
                    item.GroupName.toLowerCase().includes("mode")
                );
            })[0];
            commnanData["RS485-Commands"].push({
                Address: coil.Address,
                SlaveId: coil.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coil.CSLocation !== "undefined"
                        ? coil.CSLocation
                        : "",
                Type: coil.Type,
                Name: coil.Name,
                Index: coil.Index,
            });
            coil = fullRS485Data.RS485Data.filter(function (item) {
                return (
                    item.Name.toLowerCase().includes("man") &&
                    item.GroupName.toLowerCase().includes("mode")
                );
            })[0];
            commnanData["RS485-Commands"].push({
                Address: coil.Address,
                SlaveId: coil.SlaveId,
                FunctionCode: 5,
                DataLength: 1,
                CSDeviceId:
                    typeof coil.CSLocation !== "undefined"
                        ? coil.CSLocation
                        : "",
                Type: coil.Type,
                Name: coil.Name,
                Index: coil.Index,
            });
        }
        //

        const token = Cookies.get("auth_token");
        const rawResponse = await fetch(
            "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/handleCoilDevice",
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
                    message: JSON.stringify(commnanData),
                    deviceId: deviceID,
                    IsDemoUI:
                        typeof fullRS485Data.IsDemoUI !== "undefined" &&
                        fullRS485Data.IsDemoUI === true,
                }),
            }
        );

        let content = await rawResponse.clone().json();

        // console.log(content);
        if (!JSON.stringify(content).includes("RS485")) {
            Toast(
                "error",
                "Thay đổi giá trị hoặc điều khiển thất bại. Vui lòng thử lại"
            );
        } else {
            Toast("success", "Tín hiệu gửi đi thành công.");
        }

        if (
            coilObject.Name.toLowerCase().includes("off") &&
            coilObject.GroupName.toLowerCase().includes("mode")
        ) {
            let result = dataCoil[0].find(
                (item) =>
                    item.item.Name.toLowerCase().includes("auto") &&
                    item.item.GroupName.toLowerCase().includes("mode")
            );
            result.item.Value = 0;
            result = dataCoil[0].find(
                (item) =>
                    item.item.Name.toLowerCase().includes("man") &&
                    item.item.GroupName.toLowerCase().includes("mode")
            );
            result.item.Value = 0;
            setDataCoil(dataCoil[0]);
            //
            result = fullRS485Data.RS485Data.find(
                (item) =>
                    item.Name.toLowerCase().includes("auto") &&
                    item.GroupName.toLowerCase().includes("mode")
            );
            result.Value = 0;
            result = fullRS485Data.RS485Data.find(
                (item) =>
                    item.Name.toLowerCase().includes("man") &&
                    item.GroupName.toLowerCase().includes("mode")
            );
            result.Value = 0;
            setFullRS485Data(fullRS485Data);
        }
        if (
            coilObject.Name.toLowerCase().includes("man") &&
            coilObject.GroupName.toLowerCase().includes("mode")
        ) {
            let result = dataCoil[0].find(
                (item) =>
                    item.item.Name.toLowerCase().includes("auto") &&
                    item.item.GroupName.toLowerCase().includes("mode")
            );
            result.item.Value = 0;
            result = dataCoil[0].find(
                (item) =>
                    item.item.Name.toLowerCase().includes("off") &&
                    item.item.GroupName.toLowerCase().includes("mode")
            );
            result.item.Value = 0;
            setDataCoil(dataCoil[0]);
            //
            result = fullRS485Data.RS485Data.find(
                (item) =>
                    item.Name.toLowerCase().includes("auto") &&
                    item.GroupName.toLowerCase().includes("mode")
            );
            result.Value = 0;
            result = fullRS485Data.RS485Data.find(
                (item) =>
                    item.Name.toLowerCase().includes("off") &&
                    item.GroupName.toLowerCase().includes("mode")
            );
            result.Value = 0;
            setFullRS485Data(fullRS485Data);
        }
        if (
            coilObject.Name.toLowerCase().includes("auto") &&
            coilObject.GroupName.toLowerCase().includes("mode")
        ) {
            let result = dataCoil[0].find(
                (item) =>
                    item.item.Name.toLowerCase().includes("auto") &&
                    item.item.GroupName.toLowerCase().includes("mode")
            );
            result.item.Value = 0;
            result = dataCoil[0].find(
                (item) =>
                    item.item.Name.toLowerCase().includes("off") &&
                    item.item.GroupName.toLowerCase().includes("mode")
            );
            result.item.Value = 0;
            setDataCoil(dataCoil[0]);
            //
            result = fullRS485Data.RS485Data.find(
                (item) =>
                    item.Name.toLowerCase().includes("off") &&
                    item.GroupName.toLowerCase().includes("mode")
            );
            result.Value = 0;
            result = fullRS485Data.RS485Data.find(
                (item) =>
                    item.Name.toLowerCase().includes("man") &&
                    item.GroupName.toLowerCase().includes("mode")
            );
            result.Value = 0;
            fullRS485Data = fullRS485Data;
            setFullRS485Data(fullRS485Data);
        }

        content = await rawResponse.clone().json();

        // console.log(content);
        if (!JSON.stringify(content).includes("RS485")) {
            Toast(
                "error",
                "Thay đổi giá trị hoặc điều khiển thất bại. Vui lòng thử lại"
            );
        } else {
            Toast("success", "Tín hiệu gửi đi thành công.");
        }
        // Do something when user confirms
    };
    let [fullRS485Data, setFullRS485Data] = useState({});
    let [fullRS485DataPrevios, setFullRS485DataPrevios] = useState({});
    const [selectedCoil, setSelectedCoil] = useState({});
    const [selectedSensor, setSelectedSensor] = useState({});
    const [isNoButton, setIsNoButton] = useState(true);
    const [isOpenDialog, setIsOpenDialog] = useState(false);
    const [isOpenDialogSensor, setIsOpenDialogSensor] = useState(false);
    //
    const [titleDialog, setTitleDialog] = useState("");
    const [contentDialog, setContentDialog] = useState("");
    const [isShowColChart, setIsShowColChart] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [dataChange, setDataChange] = useState(false);
    const [valueSelect, setValueSelect] = useState("");
    const [menuValue, setMenuSelect] = useState("");
    const [cameraList, setCameraList] = useState([]);
    const [listSensor, setListSensor] = useState([]);
    const [endDate, setEndDate] = useState(
        moment(new Date()).format("HH:mm MM/DD/YYYY")
    );
    const [startDate, setStartDate] = useState(
        moment(new Date()).subtract(2, "h").format("HH:mm MM/DD/YYYY")
    );

    const [endDateTemp, setEndDateTemp] = useState(
        moment(new Date()).format("HH:mm MM/DD/YYYY")
    );
    const [startDateTemp, setStartDateTemp] = useState(
        moment(new Date()).subtract(2, "h").format("HH:01 MM/DD/YYYY")
    );

    const [inputValue, setInputValue] = useState("");

    const navigate = useNavigate();
    // realtime chart

    // handle data chart
    const db = getDatabase();
    const dataRealTime = useRef([]);
    const btnExportExcel = useRef(false);
    const deviceUser = localStorage.getItem("device_user");
    let listDevice;
    if (deviceUser !== "undefined") {
        listDevice = JSON.parse(deviceUser);
    } else {
        navigate("/nothing");
    }

    let devices = [];
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
    const noSubTract7Hour = (startDateChoose, endDateChoose) => {
        const dateS = new Date(startDateChoose);
        const dateE = new Date(endDateChoose);

        const subtract7HoursStart = dateS.getTime();
        const subtract7HoursEnd = dateE.getTime();

        const startDate = moment(subtract7HoursStart).format(
            "YYYY-MM-DD HH:mm:ss"
        );
        const endDate = moment(subtract7HoursEnd).format("YYYY-MM-DD HH:mm:ss");
        return { startDate, endDate };
    };
    useEffect(() => {
        const interval = setInterval(() => {
            window.location.reload();
            // reload the component here
        }, 3600000); // reload every hour

        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (
            typeof window.Notification !== "undefined" &&
            typeof window.Notification.permission !== "undefined" &&
            window.Notification.permission !== "granted"
        ) {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("Notification permission granted.");

                    getToken(messaging)
                        .then((currentToken) => {
                            if (currentToken) {
                                let deviceID = payload.data.status;
                                onMessage(messaging, (payload) => {
                                    Toast(
                                        payload.notification.title
                                            .toLowerCase()
                                            .includes("Err") ||
                                            payload.notification.body
                                                .toLowerCase()
                                                .includes("Err")
                                            ? "error"
                                            : "info",
                                        payload.notification.title +
                                            ": " +
                                            payload.notification.body
                                    );
                                    if (
                                        typeof listDevice[deviceID] !==
                                        "undefined"
                                    ) {
                                        AsyncLocalStorage.setItem(
                                            "home_station",
                                            JSON.stringify({
                                                id: deviceID,
                                                label: listDevice[deviceID][
                                                    "FullName"
                                                ],
                                            })
                                        ).then(() => {
                                            setValueSelect({
                                                id: deviceID,
                                                label: listDevice[deviceID][
                                                    "FullName"
                                                ],
                                            });
                                       
                                        });
                                    }
                                    console.log(
                                        "Receive foreground: ",
                                        payload
                                    );
                                });
                                console.log("FCM token:", currentToken);
                                if (typeof email !== "undefined")
                                    subscribeTokenToTopic(
                                        currentToken,
                                        email.replace("@", ""),
                                        true
                                    );
                                if (listDevice) {
                                    const id = Object.keys(listDevice);
                                    // Request permission to receive notifications
                                    id.map((v) => {
                                        subscribeTokenToTopic(
                                            currentToken,
                                            v,
                                            true
                                        );
                                    });
                                }
                            } else {
                                console.log("No registration token available.");
                            }
                        })
                        .catch((error) => {
                            console.log(
                                "An error occurred while retrieving token.",
                                error
                            );
                        });
                } else {
                    console.log("Unable to get permission to notify.");
                }
            });
        } else {
            getToken(messaging)
                .then((currentToken) => {
                    if (currentToken) {
                        onMessage(messaging, (payload) => {
                            let deviceID = payload.data.status;
                            if (typeof listDevice[deviceID] !== "undefined") {
                                AsyncLocalStorage.setItem(
                                    "home_station",
                                    JSON.stringify({
                                        id: deviceID,
                                        label: listDevice[deviceID]["FullName"],
                                    })
                                ).then(() => {
                                    setValueSelect({
                                        id: deviceID,
                                        label: listDevice[deviceID]["FullName"],
                                    });
                                  
                                });
                            }

                            Toast(
                                payload.notification.title
                                    .toLowerCase()
                                    .includes("Err") ||
                                    payload.notification.body
                                        .toLowerCase()
                                        .includes("Err")
                                    ? "error"
                                    : "info",
                                payload.notification.title +
                                    ": " +
                                    payload.notification.body
                            );
                            console.log("Receive foreground: ", payload);
                        });
                        if (typeof email !== "undefined")
                            subscribeTokenToTopic(
                                currentToken,
                                email.replace("@", ""),
                                true
                            );
                        console.log("FCM token:", currentToken);
                        if (listDevice) {
                            const id = Object.keys(listDevice);
                            // Request permission to receive notifications
                            id.map((v) => {
                                subscribeTokenToTopic(currentToken, v, true);
                            });
                        }
                    } else {
                        console.log("No registration token available.");
                    }
                })
                .catch((error) => {
                    console.log(
                        "An error occurred while retrieving token.",
                        error
                    );
                });
        }

        let camera = [];
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
    useEffect(() => {
        const token = Cookies.get("auth_token");
        fetch(
            "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/getListDevices",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
            }
        )
            .then((response) => response.json())
            .then((myJson) => {
                setLoaded(true);
                const res = myJson.ListDevicesOfUser;
                const filteredObj = {};
                Object.keys(res)
                    .filter(
                        (key) =>
                            !key.includes("HUMATIC-HCE") &&
                            !key.includes("IRO-")
                    )
                    .forEach((key) => {
                        filteredObj[key] = res[key];
                    });
                AsyncLocalStorage.setItem(
                    "device_user",
                    JSON.stringify(filteredObj)
                )
                    .then(() => {
                        Toast("success", "Đăng nhập thành công");
                        // navigate('/home');
                    })
                    .catch(() => {
                        Toast(
                            "error",
                            "Đã xảy ra lỗi trong quá trình đăng nhập"
                        );
                    });
            })
            .catch((err) => {
                console.log({ err_loin: err });
            });
    }, []);
    useEffect(() => {
        AsyncLocalStorage.getItem("home_station").then((station) => {
            const searchParams = new URLSearchParams(window.location.search);
            const deviceId = searchParams.get("deviceId");
            // console.log(deviceId);
            if (station && deviceId === null) {
                let stationUser = JSON.parse(station);
                setValueSelect(stationUser);
             
               
            } else {
                let deviceIdTemp = devices[0].id;
                if (
                    deviceId !== null &&
                    typeof listDevice[deviceId] !== "undefined"
                )
                    deviceIdTemp = deviceId;
                setValueSelect({
                    id: deviceIdTemp,
                    label: listDevice[deviceIdTemp]["FullName"],
                });
             
            }
        });
    }, []);
    // get data from firebase
    useEffect(() => {
        if (valueSelect) {
            fetchDataNote();
            // lay du lieu license
            fetchLicense();
        }
        if (valueSelect) {
            console.log({valueSelect})
            return onValue(
                ref(db, `Devices/DAIVIET-RS485/${valueSelect.id}`),
                async (snapshot) => {
                    // console.log(snapshot.val());
                    
                    let newData =  snapshot.val();
                    // console.log({home : newData.RS485Data, location : newData.Location})
                    newData["Id"] = valueSelect.id;
                    let isOffline = false;
                    if (typeof newData.IsSendingAlarm !== "undefined") {
                        setIsDeviceOffline(newData.IsSendingAlarm);
                        isOffline = newData.IsSendingAlarm;
                    } else {
                        setIsDeviceOffline(false);
                    }

                    setFullRS485Data({ ...newData });
                    setFullRS485DataPrevios({ ...newData });
                    let { RS485Data, Location, LastTime, Ip } = newData;

                    if (typeof Ip !== "undefined")
                        AsyncLocalStorage.setItem("ip_camera", Ip).then(
                            () => {}
                        );
                    setLastimeActive(LastTime);
                    Location = valueSelect.id;
                    // console.log(snapshot.val());
                    let lastTime = moment(LastTime.slice(0, -1)).format(
                        "YYYY/MM/DD HH:mm"
                    );
                    let timeC = moment(LastTime.slice(0, -1)).format(
                        "YYYY/MM/DD HH:mm"
                    );
                    let timeP = moment(Date())
                        .subtract(TIME_DEVICE_OFF, "minutes")
                        .format("YYYY/MM/DD HH:mm");
                    
                   

                    let dateC = moment(LastTime.slice(0, -1)).format(
                        "MM/DD/YYYY"
                    );
                    let dateP = moment(Date()).format("MM/DD/YYYY");

                    let compare = compareDate(dateC, dateP);
                    let isTimeOut30Minute = moment(timeC).isBefore(timeP);

                    let cloneRS485DataForCoil = [...RS485Data];
                    cloneRS485DataForCoil = cloneRS485DataForCoil.filter(
                        (item) => item.MemoryType === 0
                    );
                    RS485Data = RS485Data.filter(
                        (item) => item.MemoryType === 1
                    );

                    //clone
                    let cloneRS485Data = [...RS485Data];

                    cloneRS485Data = cloneRS485Data.filter(
                        (item) =>
                            item.MemoryType === 1 &&
                            (item.IsColumn ||
                                (typeof item.Unit !== "undefined" &&
                                    item.Unit.toLowerCase().includes("kwh")))
                    );
                    cloneRS485Data = cloneRS485Data.filter(
                        (item) =>
                            typeof item.Unit !== "undefined" &&
                            item.Unit.toLowerCase() !== "h"
                    );
                    if (cloneRS485Data.length > 0) setIsShowColChart(true);
                    else setIsShowColChart(false);

                    RS485Data = RS485Data.filter(
                        (item) =>
                            typeof item.Unit === "undefined" ||
                            (typeof item.Unit !== "undefined" &&
                                item.Unit.toLowerCase() !== "h")
                    );

                    let s = [];
                    RS485Data.map((v) => {
                        s.push(v.Name);
                    });
                    // console.log({ s });
                    setListSensor(s);
                    // get
                    let groupNameArray = {};
                    for (var i = 0; i < RS485Data.length; i++) {
                        let sensorItem = RS485Data[i];
                        groupNameArray[sensorItem.GroupName] =
                            sensorItem.GroupName;
                    }
                    // console.log(groupNameArray);
                    //
                    for (let groupName in groupNameArray) {
                        // console.log(groupName);
                        const querySnapshot = await getDocs(
                            collection(
                                dbStore,
                                `SensorSettings/${Location}/${groupName}`
                            )
                        );
                        groupNameArray[groupName] = querySnapshot;
                    }
                    // Get all documents in a collection
                    //const querySnapshot = await getDocs( collection(dbStore,  `SensorSettings/${Location}/${"THÔNG SỐ ÁP SUẤT"}`));
                    for (var i = 0; i < RS485Data.length; i++) {
                        let sensorItem = RS485Data[i];
                        sensorItem.AlarmSetting = {};
                        for (let groupName in groupNameArray) {
                            groupNameArray[groupName].forEach((doc) => {
                                if (doc.id === sensorItem.Name) {
                                    const dataSetting = doc.data();
                                    sensorItem.AlarmSetting = dataSetting;

                                    {
                                        let isNotZero = false;

                                        if (
                                            typeof dataSetting[
                                                "HighAlarmSetting"
                                            ] !== "undefined" &&
                                            typeof dataSetting[
                                                "LowAlarmSetting"
                                            ] !== "undefined"
                                        ) {
                                            if (
                                                dataSetting[
                                                    "HighAlarmSetting"
                                                ] === 0 &&
                                                dataSetting[
                                                    "LowAlarmSetting"
                                                ] === 0
                                            ) {
                                                isNotZero = true;
                                            }
                                        }

                                        let coilLow = newData.RS485Data.filter(
                                            function (item) {
                                                return (
                                                    item.Name.toLowerCase().includes(
                                                        sensorItem.Name.toLowerCase()
                                                    ) &&
                                                    item.Name.toLowerCase().includes(
                                                        "low"
                                                    ) &&
                                                    item.Type == "bool"
                                                );
                                            }
                                        );

                                        if (coilLow.length != 0) {
                                            sensorItem.AlarmSetting.IsSendLowAlarm =
                                                isNotZero
                                                    ? false
                                                    : coilLow[0].CoilValue;
                                        }
                                        let coilHigh = newData.RS485Data.filter(
                                            function (item) {
                                                return (
                                                    item.Name.toLowerCase().includes(
                                                        sensorItem.Name.toLowerCase()
                                                    ) &&
                                                    item.Name.toLowerCase().includes(
                                                        "high"
                                                    ) &&
                                                    item.Type == "bool"
                                                );
                                            }
                                        );
                                        if (coilHigh.length != 0) {
                                            sensorItem.AlarmSetting.IsSendHighAlarm =
                                                isNotZero
                                                    ? false
                                                    : coilHigh[0].CoilValue;
                                        }
                                    }
                                }
                                // console.log(doc.id, " => ", doc.data());
                            });
                        }
                    }
                    // 
                    let debugStatus = isOffline
                        ? `OFF*${"NOOK"}`
                        : moment(timeP).isBefore(timeC) || compare === 1
                        ? `OFF*${"NOOK"}`
                        : `ON*${"0"}`;
                     console.log(debugStatus);
                    console.log(moment(timeP).isBefore(timeC));
                    console.log(timeP);
                    console.log(timeC);
                    dataRealTime.current = [
                        {
                            id_station: valueSelect.id,
                            data_sensor: RS485Data,
                            coil_data: cloneRS485DataForCoil,
                            location: Location,
                            last_time: lastTime,
                            full_name: listDevice[valueSelect.id]["FullName"],
                            status_station: isOffline
                                ? `OFF*${"NOOK"}`
                                : (moment(timeC).isBefore(timeP) &&
                                      typeof newData.IsSendingAlarm ===
                                          "undefined") ||
                                  compare === 1
                                ? `OFF*${"NOOK"}`
                                : `ON*${"0"}`,
                        },
                    ];
                    let tempValue =  isOffline
                    ? `OFF*${"NOOK"}`
                    : (moment(timeC).isBefore(timeP) &&
                          typeof newData.IsSendingAlarm ===
                              "undefined") ||
                      compare === 1
                    ? `OFF*${"NOOK"}`
                    : `ON*${"0"}`;
                    setIsDeviceOffline(tempValue.includes("OFF"));
                    setLoaded(true);
                    setDataChange({
                        last_time: LastTime,
                    });
                }
            );
        }

    }, [valueSelect]);

    const handleChangeStartDate = (e) => {
        const startTime = moment(e.$d).format("HH:01 MM-DD-YYYY");
        setStartDateTemp(startTime);
    };

    const handleChangeEndDate = (e) => {
        const endTime = moment(e.$d).format("HH:mm MM-DD-YYYY");
        setEndDateTemp(endTime);
    };

    const handleApplyDate = (e) => {
        setStartDate(startDateTemp);
        setEndDate(endDateTemp);
    };
    const handleExportExcel = async (e) => {
        setStartDate(startDateTemp);
        setEndDate(endDateTemp);
        var startC = moment(startDateTemp);
        var endC = moment(endDateTemp);

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

        // console.log({ startDate, endDate });

        const { startDate: start, endDate: end } = subTract7Hour(
            startDate,
            endDate
        );
        try {
            setLoaded(false);
            if (
                !valueSelect.id.includes("_") &&
                !valueSelect.id.includes("A-OMWATER-1")
            ) {
                for (let i = 0; i < listSensor.length; i++) {
                    let lstSensor = [];
                    lstSensor.push(listSensor[i]);

                    const res = await axios.get(
                        valueSelect.id.includes("IUH")
                            ? "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web"
                            : "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Access-Control-Allow-Origin": "*",
                                "Access-Control-Allow-Credentials": "true",
                            },
                            params: {
                                deviceId: valueSelect.id,
                                listSensors: lstSensor.toString(),
                                startDate: start,
                                endDate: end,
                                scale: "hour",
                                email: "",
                                isDatalogger: true,
                                IsDemo: false,
                            },
                        }
                    );
                    setLoaded(true);
                    if (res && res.data) {
                        // loadingExport.current = false;
                        const link = document.createElement("a");
                        link.href = res.data.link;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        // btnExportExcel.current.disabled = false;
                        // btnExportExcel.current.innerHTML = 'Export Excel';
                        Toast("success", "Xuất dữ liệu thành công", 2000);
                    } else {
                        Toast(
                            "error",
                            "Thất bại. Xin vui lòng thử lại sau",
                            2000
                        );
                        // btnExportExcel.current.disabled = false;
                        // btnExportExcel.current.innerHTML = 'Export Excel';
                    }
                }
            } else {
                const res = await axios.get(
                    valueSelect.id.includes("IUH")
                        ? "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web"
                        : "https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-for-web",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Credentials": "true",
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
                setLoaded(true);
                if (res && res.data) {
                    // loadingExport.current = false;
                    const link = document.createElement("a");
                    link.href = res.data.link;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    // btnExportExcel.current.disabled = false;
                    // btnExportExcel.current.innerHTML = 'Export Excel';
                    Toast("success", "Xuất dữ liệu thành công", 2000);
                } else {
                    Toast("error", "Thất bại. Xin vui lòng thử lại sau", 2000);
                    // btnExportExcel.current.disabled = false;
                    // btnExportExcel.current.innerHTML = 'Export Excel';
                }
            }
            // btnExportExcel.current.disabled = true;
            //  btnExportExcel.current.innerHTML = 'Waiting...';
        } catch (err) {
            setLoaded(true);
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
            // btnExportExcel.current.disabled = false;
            // btnExportExcel.current.innerHTML = 'Export Excel';
        }
    };
    const handleExportExcelISO2 = async (e) => {
        setStartDate(startDateTemp);
        setEndDate(endDateTemp);
        var startC = moment(startDateTemp);
        var endC = moment(endDateTemp);

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

        const { startDate: start, endDate: end } = noSubTract7Hour(
            startDate,
            endDate
        );
        try {
            window.open(
                `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-test-2?startDate=${start}&endDate=${end}`
            );

            // btnExportExcel.current.disabled = true;
            //  btnExportExcel.current.innerHTML = 'Waiting...';
        } catch (err) {
            setLoaded(true);
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
            // btnExportExcel.current.disabled = false;
            // btnExportExcel.current.innerHTML = 'Export Excel';
        }
    };
    const handleExportExcelISO = async (e) => {
        setStartDate(startDateTemp);
        setEndDate(endDateTemp);
        var startC = moment(startDateTemp);
        var endC = moment(endDateTemp);

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

        const { startDate: start, endDate: end } = noSubTract7Hour(
            startDate,
            endDate
        );
        try {
            window.open(
                `https://httpexportexcel-lfh3wbxmyq-uc.a.run.app/api/excel-test?startDate=${start}&endDate=${end}`
            );

            // btnExportExcel.current.disabled = true;
            //  btnExportExcel.current.innerHTML = 'Waiting...';
        } catch (err) {
            setLoaded(true);
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
            // btnExportExcel.current.disabled = false;
            // btnExportExcel.current.innerHTML = 'Export Excel';
        }
    };
    // handle data get from firebase
    let arr = useRef();
    let dataSensor = [];

    let [dataCoil, setDataCoil] = useState([]);
    if (dataChange) {
        arr.current = getUniqueListBy(dataRealTime.current, "location");
        dataSensor = arr.current.map((v, index) => {
            let s = v.status_station.split("*")[1];
            let c = v.data_sensor.map((v2) => {

                const isOVer = handleGetSettingThreshold(
                    v.id_station,
                    v2.Name,
                    v2.Value
                );
                let b;
                if (s === "NOOK") {
                    b = `${v2.Value}*${
                        typeof v2.StateNum === "undefined" ? 0 : v2.StateNum
                    }*STATION_OFF`;
                } else {

                    if (isOVer && v2.StateNum == 0) {
                        b = `${v2.Value}*${5}`;
                    } else {
                        b = `${v2.Value}*${
                            typeof v2.StateNum === "undefined" ? 0 : v2.StateNum
                        }`;
                    }

                   
                }

                let a = v2.Name;
                let obj = {
                    sensor: a,
                    value: b,
                    unit: v2.Unit,
                    HighAlarmSetting: v2.HighAlarmSetting,
                    LowAlarmSetting: v2.LowAlarmSetting,
                    DelayTime: v2.DelayTime,
                    AlarmSetting: v2.AlarmSetting,
                };
                return obj;
            });

            return c;
        });

        dataCoil = arr.current.map((v, index) => {
            let s = v.status_station.split("*")[1];
            let c = v.coil_data.map((v2) => {
                // console.log(s);
                let b;
                if (s === "NOOK") {
                    b = `${v2.Value}*${
                        typeof v2.StateNum === "undefined" ? 0 : v2.StateNum
                    }*STATION_OFF`;
                } else {
                    b = `${v2.Value}*${
                        typeof v2.StateNum === "undefined" ? 0 : v2.StateNum
                    }`;
                }
                let a = v2.Name;
                let obj = {
                    sensor: a,
                    value: b,
                    unit: v2.Unit,
                    IsHighAlarm: v2.IsHighAlarm,
                    item: v2,
                };
                return obj;
            });

            return c;
        });
    }
    function onClickSensorDevice(myObject) {
        let deviceObject = JSON.parse(deviceUser);

        if (
            deviceObject[valueSelect.id].IsMaster === false &&
            deviceObject[valueSelect.id].IsAdmin === false
        ) {
            Toast("error", "Bạn không có quyền điều khiển");
            return;
        }
        setSelectedSensor(myObject);
        setIsNoButton(false);
        setTitleDialog(myObject.sensor);

        setIsOpenDialogSensor(true);

        // Xử lý khi người dùng click vào thẻ div với đối tượng được truyền vào.
    }
    function onClickCoilDevice(myObject) {
        let deviceObject = JSON.parse(deviceUser);

        if (
            deviceObject[valueSelect.id].IsMaster === false &&
            deviceObject[valueSelect.id].IsAdmin === false
        ) {
            Toast("error", "Bạn không có quyền điều khiển");
            return;
        }
        setSelectedCoil(myObject.item);
        setIsNoButton(myObject.item.IsModify);
        setTitleDialog(myObject.item.Name);
        let isLock = true;
        if (typeof myObject.item.AddressActive !== "undefined") {
            let coil = fullRS485Data.RS485Data.filter(function (item) {
                return item.Address == myObject.item.AddressActive;
            })[0];

            isLock = coil.CoilValue;
        }
        if (!isLock) {
            setIsNoButton(false);
            setContentDialog(
                `[${myObject.item.Name}] is locked. Please change to MAN mode to control this.`
            );
        } else if (myObject.item.IsModify)
            setContentDialog(
                myObject.item.Value === 1
                    ? `Do you turn OFF [${myObject.item.Name}]`
                    : `Do you turn ON [${myObject.item.Name}]`
            );
        else
            setContentDialog(
                `[${myObject.item.Name}] is locked. You could not control this.`
            );
        setIsOpenDialog(true);

        // Xử lý khi người dùng click vào thẻ div với đối tượng được truyền vào.
    }

    // add value for field input
    const dataCoordinates = [];
    if (listDevice && valueSelect) {
        if (!listDevice[valueSelect.id]) {
            AsyncLocalStorage.removeItem("home_station");
            location.reload();
        }
        if (
            listDevice[valueSelect.id] &&
            listDevice[valueSelect.id]["latitude"] &&
            listDevice[valueSelect.id]["longitude"]
        )
            dataCoordinates.push({
                name: listDevice[valueSelect.id]["FullName"],
                latitude: listDevice[valueSelect.id]["latitude"],
                longitude: listDevice[valueSelect.id]["longitude"],
            });
    }

    // handle onchange select station
    const handleOnChangeSelectStation = (e, v) => {
        if (v !== null) {
            AsyncLocalStorage.setItem("home_station", JSON.stringify(v)).then(
                () => {
               
                    
                    setValueSelect(v);
                
              
                   
                }
            );
        }
    };
    useEffect(() => {
        setIsRerenderCard(true);
        setTimeout(function () {
            setIsRerenderCard(false);
        }, 500);
    }, [valueSelect]);
    //style for card
    const styleForCard = (value) => {
        let stateSensor = value.split("*")[1];
        let statusStation = value.split("*")[2];
        if (statusStation === "STATION_OFF") {
            return "off";
        } else if (stateSensor === "1") {
            return "calib";
        } else if (stateSensor === "2") {
            return "error";
        } else if (stateSensor === "0") {
            return "normal";
        
        } else if (stateSensor === "5") {
            return "over";
        } 
        
        else {
            return "off";
        }
    };


    return (
        <>
            <ConfirmationDialogSensor
                isNoButton={true}
                open={isOpenDialogSensor}
                onClose={handleCloseSensor}
                title={titleDialog}
                message={contentDialog}
                item={selectedSensor}
                onConfirm={handleConfirmSensor}
            />
            <ConfirmationDialog
                isNoButton={isNoButton}
                open={isOpenDialog}
                onClose={handleClose}
                title={titleDialog}
                message={contentDialog}
                item={selectedCoil}
                onConfirm={handleConfirm}
            />

            <div className="home_page">
                {loaded ? (
                    <>
                        <SubHeader
                            text={
                                valueSelect
                                    ? `GIÁM SÁT DỮ LIỆU ${valueSelect.label}`
                                    : "BẠN HÃY CHỌN TRẠM ĐỂ GIÁM SÁT"
                            }
                        />

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
                            <Grid
                                container
                                spacing={2}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {/* <Grid item xs={3}>
                                    <MySelect
                                        label="Chọn trạm giám sát"
                                        menuValue={menuValue}
                                        value={valueSelect}
                                        onChange={handleOnChangeSelectStation}
                                    />
                                </Grid> */}
                                <Grid
                                    item
                                    xl={12}
                                    lg={12}
                                    md={12}
                                    sm={12}
                                    xs={12}
                                >
                                    <Autocomplete
                                        id="controllable-states-demo"
                                        size="small"
                                        color="success"
                                        onChange={handleOnChangeSelectStation}
                                        options={menuValue}
                                        value={valueSelect.label}
                                        inputValue={inputValue}
                                        onInputChange={(
                                            event,
                                            newInputValue
                                        ) => {
                                            setInputValue(newInputValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Chọn trạm giám sát"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </div>
                        {licenseDay !== -1  && licenseDay > 10 ? (
                            <NormalNote
                                className="alarm-note"
                                text={`Bạn còn ${licenseDay} ngày sử dụng.` }
                            />
                        ) : (
                            <div></div>
                        )}
                        {licenseDay !== -1  && licenseDay < 10 && licenseDay !=0 ? (
                            <AlarmNote
                                className="alarm-note"
                                text={`Thiết bị sắp hết hạn sử dụng. Bạn còn ${licenseDay} ngày sử dụng. Vui lòng liên hệ nhà cung cấp.` }
                            />
                        ) : (
                            <div></div>
                        )}
                        {licenseDay === 0? (
                            <AlarmNote
                                className="alarm-note"
                                text={`Thiết bị đã hết hạn sử dụng. Vui lòng liên hệ nhà cung cấp.` }
                            />
                        ) : (
                            <div></div>
                        )}
                        {isDeviceOffline ? (
                            <AlarmNote
                                className="alarm-note"
                                text={`Trạm bị mất kết nối do mất điện hoặc internet từ ${moment(lastimeActive.slice(0, -1)).format( "HH:mm DD/MM/YYYY")}. Vui lòng kiểm tra.` }
                            />
                        ) : (
                            <div></div>
                        )}
                        {licenseMessage !== "" ? (
                            <AlarmNote
                                className="alarm-note"
                                text={`${licenseMessage}` }
                            />
                        ) : (
                            <div></div>
                        )}
                       {licenseLockLV2 === true ? <div></div>: <Box sx={{ flexGrow: 1 }}>
                          
                            <div style={{ margin: "10px 0" }}>
                                <Grid container spacing={1.5}>
                                    <Grid
                                        item
                                        xl={2}
                                        lg={2}
                                        md={12}
                                        sm={12}
                                        xs={12}
                                    >
                                        {valueSelect ? (
                                            valueSelect.id.includes("NNV") ||
                                            valueSelect.id.includes("TPN") ? (
                                                <div
                                                    className={
                                                        classes.container
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            classes.inputContainer
                                                        }
                                                    >
                                                        {valueSelect.id.includes(
                                                            "NNV"
                                                        ) ? (
                                                            <Grid
                                                                xs={12}
                                                                sm={12}
                                                                shouldHide={
                                                                    true
                                                                }
                                                            >
                                                                <Stack
                                                                    spacing={1}
                                                                    direction={
                                                                        "row"
                                                                    }
                                                                >
                                                                    <TextField
                                                                        className={
                                                                            classes.input
                                                                        }
                                                                        label="Type a message"
                                                                        value={
                                                                            inputText
                                                                        }
                                                                        onChange={
                                                                            handleInputChange
                                                                        }
                                                                        onKeyPress={
                                                                            handleKeyPress
                                                                        }
                                                                        size="small"
                                                                        multiline
                                                                        // rows={2}
                                                                        Grid
                                                                        variant="outlined"
                                                                    />
                                                                    <Button
                                                                        variant="contained"
                                                                        color="primary"
                                                                        onClick={
                                                                            addTextToList
                                                                        }
                                                                    >
                                                                        Send
                                                                    </Button>
                                                                </Stack>
                                                            </Grid>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "18px",
                                                                    marginBottom:
                                                                        "10px",
                                                                    fontWeight:
                                                                        "600",
                                                                }}
                                                            >
                                                                Danh sách ghi
                                                                chú
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Paper
                                                        className={
                                                            classes.chatContainer
                                                        }
                                                    >
                                                        {textList.map(
                                                            (
                                                                message,
                                                                index
                                                            ) => (
                                                                <div
                                                                    className={
                                                                        classes.message
                                                                    }
                                                                    key={index}
                                                                >
                                                                    <Stack
                                                                        sx={{
                                                                            p: 1,
                                                                        }}
                                                                        spacing={
                                                                            0.5
                                                                        }
                                                                    >
                                                                        <Typography
                                                                            variant="subtitle1"
                                                                            color="primary"
                                                                        >
                                                                            {
                                                                                message.name
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                message.timestamp
                                                                            }
                                                                        </Typography>
                                                                        <Typography variant="body1">
                                                                            {
                                                                                message.content
                                                                            }
                                                                        </Typography>
                                                                    </Stack>

                                                                    {typeof message.Image !==
                                                                    "undefined"
                                                                        ? message.Image.map(
                                                                              (
                                                                                  urlImg,
                                                                                  index
                                                                              ) => (
                                                                                  <img
                                                                                      src={
                                                                                          urlImg
                                                                                      }
                                                                                      width={
                                                                                          200
                                                                                      }
                                                                                      height={
                                                                                          100
                                                                                      }
                                                                                      alt=""
                                                                                  />
                                                                              )
                                                                          )
                                                                        : ""}
                                                                </div>
                                                            )
                                                        )}
                                                    </Paper>
                                                </div>
                                            ) : (
                                                <div className="home_map">
                                                    <MapD
                                                        height="548px"
                                                        data={dataCoordinates}
                                                        showTabState={false}
                                                        showBtnAll={false}
                                                        longitudeDefault={
                                                            listDevice[
                                                                valueSelect.id
                                                            ]["longitude"]
                                                        }
                                                        latitudeDefault={
                                                            listDevice[
                                                                valueSelect.id
                                                            ]["latitude"]
                                                        }
                                                        showMarkerInfo={true}
                                                        showButtonHideLabel={false}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            <Skeleton
                                                animation="wave"
                                                variant="rounded"
                                                height={500}
                                            ></Skeleton>
                                        )}
                                    </Grid>
                                    {valueSelect.id.includes("NNV") ||
                                    valueSelect.id.includes("TPN") ? (
                                        <Grid
                                            item
                                            xl={2}
                                            lg={2}
                                            md={12}
                                            sm={12}
                                            xs={12}
                                        >
                                            {valueSelect ? (
                                                <div className="home_map">
                                                    <MapD
                                                        zoomDefault={12}
                                                        height="548px"
                                                        data={dataCoordinates}
                                                        showTabState={false}
                                                        showBtnAll={false}
                                                        longitudeDefault={
                                                            listDevice[
                                                                valueSelect.id
                                                            ]["longitude"]
                                                        }
                                                        latitudeDefault={
                                                            listDevice[
                                                                valueSelect.id
                                                            ]["latitude"]
                                                        }
                                                        showButtonHideLabel={false}
                                                        showMarkerInfo={true}
                                                    />
                                                </div>
                                            ) : (
                                                <Skeleton
                                                    animation="wave"
                                                    variant="rounded"
                                                    height={500}
                                                ></Skeleton>
                                            )}
                                        </Grid>
                                    ) : (
                                        ""
                                    )}
                                    <Grid
                                        item
                                        xl={
                                            cameraList.length > 0
                                                ? valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                    ? 6
                                                    : 8
                                                : valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                ? 8
                                                : 10
                                        }
                                        lg={
                                            cameraList.length > 0
                                                ? valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                    ? 6
                                                    : 8
                                                : valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                ? 8
                                                : 10
                                        }
                                        md={
                                            cameraList.length > 0
                                                ? valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                    ? 6
                                                    : 8
                                                : valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                ? 6
                                                : valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                ? 8
                                                : 10
                                        }
                                        sm={
                                            cameraList.length > 0
                                                ? valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                    ? 6
                                                    : 8
                                                : 10
                                        }
                                        xs={
                                            cameraList.length > 0
                                                ? valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                    ? 6
                                                    : 8
                                                : valueSelect.id.includes(
                                                      "NNV"
                                                  ) ||
                                                  valueSelect.id.includes("TPN")
                                                ? 8
                                                : 10
                                        }
                                    >
                                    { licenseLockLV1 === true ? <div></div>:   <Grid container spacing={0.5}>
                                            {valueSelect ? (
                                                <>
                                                    <Grid
                                                        item
                                                        xl={
                                                            isShowColChart
                                                                ? 6
                                                                : 12
                                                        }
                                                        lg={
                                                            isShowColChart
                                                                ? 6
                                                                : 12
                                                        }
                                                        md={
                                                            isShowColChart
                                                                ? 6
                                                                : 12
                                                        }
                                                        sm={
                                                            isShowColChart
                                                                ? 6
                                                                : 12
                                                        }
                                                        xs={
                                                            isShowColChart
                                                                ? 6
                                                                : 12
                                                        }
                                                        style={{}}
                                                    >
                                                        <div className="home_chart">
                                                            <MainChart
                                                                endDate={
                                                                    endDate
                                                                }
                                                                startDate={
                                                                    startDate
                                                                }
                                                                deviceUser={
                                                                    valueSelect.id
                                                                }
                                                            />
                                                        </div>
                                                    </Grid>
                                                    {isShowColChart ? (
                                                        <Grid
                                                            item
                                                            xl={6}
                                                            lg={6}
                                                            md={6}
                                                            sm={6}
                                                            xs={6}
                                                            style={{}}
                                                        >
                                                            <div className="home_chart">
                                                                <ColumnChartSensor
                                                                    endDate={
                                                                        endDate
                                                                    }
                                                                    startDate={
                                                                        startDate
                                                                    }
                                                                    deviceUser={
                                                                        valueSelect.id
                                                                    }
                                                                />
                                                            </div>
                                                        </Grid>
                                                    ) : (
                                                        ""
                                                    )}
                                                    <Grid
                                                        item
                                                        xl={12}
                                                        lg={12}
                                                        md={12}
                                                        sm={12}
                                                        xs={12}
                                                    >
                                                        <Grid
                                                            container
                                                            spacing={1}
                                                        >
                                                            <Grid item xs={3}>
                                                                <MyDateRange
                                                                    label={
                                                                        "Bắt đầu"
                                                                    }
                                                                    onChange={
                                                                        handleChangeStartDate
                                                                    }
                                                                    value={
                                                                        startDateTemp
                                                                    }
                                                                />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <MyDateRange
                                                                    label={
                                                                        "Kết thúc"
                                                                    }
                                                                    onChange={
                                                                        handleChangeEndDate
                                                                    }
                                                                    value={
                                                                        endDateTemp
                                                                    }
                                                                />
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <MyButton
                                                                    icon={null}
                                                                    name={
                                                                        "Áp dụng"
                                                                    }
                                                                    onClick={
                                                                        handleApplyDate
                                                                    }
                                                                />
                                                            </Grid>
                                                            {valueSelect.id.includes(
                                                                "A-OMWATER-1"
                                                            ) ? (
                                                                <Grid
                                                                    item
                                                                    xs={3}
                                                                >
                                                                    <MyButton
                                                                        icon={
                                                                            null
                                                                        }
                                                                        name={
                                                                            "Xuất Excel"
                                                                        }
                                                                        onClick={
                                                                            handleExportExcel
                                                                        }
                                                                    />
                                                                    <MyButton
                                                                        icon={
                                                                            null
                                                                        }
                                                                        name={
                                                                            "Xuất ISO"
                                                                        }
                                                                        onClick={
                                                                            handleExportExcelISO
                                                                        }
                                                                    />
                                                                                            <MyButton
                                                                        icon={
                                                                            null
                                                                        }
                                                                        name={
                                                                            "Xuất OPRP ISO"
                                                                        }
                                                                        onClick={
                                                                            handleExportExcelISO2
                                                                        }
                                                                    />
                                                                </Grid>
                                                            ) : (
                                                                <Grid
                                                                    item
                                                                    xs={3}
                                                                >
                                                                    <MyButton
                                                                        icon={
                                                                            null
                                                                        }
                                                                        name={
                                                                            "Xuất Excel"
                                                                        }
                                                                        onClick={
                                                                            handleExportExcel
                                                                        }
                                                                    />
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                    </Grid>
                                                </>
                                            ) : (
                                                <Grid
                                                    item
                                                    xl={12}
                                                    lg={12}
                                                    md={12}
                                                    sm={12}
                                                    xs={12}
                                                >
                                                    <Skeleton
                                                        animation="wave"
                                                        variant="rounded"
                                                        height={500}
                                                    ></Skeleton>
                                                </Grid>
                                            )}
                                        </Grid>}
                                    </Grid>
                                    {cameraList.length > 0 &&  licenseLockLV1 === false  ? (
                                        <Grid
                                            item
                                            xl={2}
                                            lg={2}
                                            md={2}
                                            sm={2}
                                            xs={2}

                                            style={{height : '555px', overflowY : 'auto'}}
                                        >
                                            <CameraChild
                                                cameraList={cameraList}
                                            ></CameraChild>
                                        </Grid>
                                    ) : (
                                        ""
                                    )}
                                </Grid>
                            </div>
                        </Box>}
                    </>
                ) : (
                    
                            <>
                                {!loaded && <Backdrop
                                            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                                            open={true}
                                            > <CircularProgress color="inherit" /></Backdrop> }
                                <SubHeader
                                    text={
                                        valueSelect
                                            ? `GIÁM SÁT DỮ LIỆU ${valueSelect.label}`
                                            : "BẠN HÃY CHỌN TRẠM ĐỂ GIÁM SÁT"
                                    }
                                />

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
                                    <Grid
                                        container
                                        spacing={2}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {/* <Grid item xs={3}>
                                    <MySelect
                                        label="Chọn trạm giám sát"
                                        menuValue={menuValue}
                                        value={valueSelect}
                                        onChange={handleOnChangeSelectStation}
                                    />
                                </Grid> */}
                                        <Grid
                                            item
                                            xl={12}
                                            lg={12}
                                            md={12}
                                            sm={12}
                                            xs={12}
                                        >
                                            <Autocomplete
                                                id="controllable-states-demo"
                                                size="small"
                                                color="success"
                                                onChange={
                                                    handleOnChangeSelectStation
                                                }
                                                options={menuValue}
                                                value={valueSelect.label}
                                                inputValue={inputValue}
                                                onInputChange={(
                                                    event,
                                                    newInputValue
                                                ) => {
                                                    setInputValue(
                                                        newInputValue
                                                    );
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Chọn trạm giám sát"
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    </Grid>
                                </div>
                                {/* <SubHeader
                            text="Trạm bị mất kết nối do mất điện hoặc internet. Vui lòng kiểm tra."
                            /> */}
                                <Box sx={{ flexGrow: 1 }}>
                                    <div style={{ margin: "10px 0" }}>
                                        <Grid container spacing={1}>
                                            {/* <Grid item xs={4}>
                            <Item>xs=4</Item>
                        </Grid> */}
                                            <Grid item xs={12}>
                                                {/* <Item>xs=8</Item> */}
                                                <Grid container spacing={1}>
                                                    {dataSensor &&
                                                    dataSensor.length > 0 ? (
                                                        dataSensor[0].map(
                                                            (v, index) => {
                                                                return (
                                                                    <Grid
                                                                        key={
                                                                            index
                                                                        }
                                                                        item
                                                                        xl={3}
                                                                        lg={4}
                                                                        md={6}
                                                                        sm={12}
                                                                        xs={12}
                                                                    >
                                                                        <CardValueSensor
                                                                            alarmSetting={
                                                                                v.AlarmSetting
                                                                            }
                                                                            label={
                                                                                v.sensor
                                                                            }
                                                                            value={
                                                                                v.value.split(
                                                                                    "*"
                                                                                )[0]
                                                                            }
                                                                            unit={` ${" "} ${
                                                                                typeof v.unit ===
                                                                                "undefined"
                                                                                    ? ""
                                                                                    : v.unit
                                                                            }`}
                                                                            state={styleForCard(
                                                                                v.value
                                                                            )}
                                                                            fillColor={
                                                                                "#C3F8FF"
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                );
                                                            }
                                                        )
                                                    ) : (
                                                        <>
                                                            <Grid
                                                                item
                                                                xl={3}
                                                                lg={4}
                                                                md={6}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Skeleton
                                                                    animation="wave"
                                                                    variant="rounded"
                                                                    height={170}
                                                                ></Skeleton>
                                                            </Grid>
                                                            <Grid
                                                                item
                                                                xl={3}
                                                                lg={4}
                                                                md={6}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Skeleton
                                                                    animation="wave"
                                                                    variant="rounded"
                                                                    height={170}
                                                                ></Skeleton>
                                                            </Grid>
                                                            <Grid
                                                                item
                                                                xl={3}
                                                                lg={4}
                                                                md={6}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Skeleton
                                                                    animation="wave"
                                                                    variant="rounded"
                                                                    height={170}
                                                                ></Skeleton>
                                                            </Grid>
                                                            <Grid
                                                                item
                                                                xl={3}
                                                                lg={4}
                                                                md={6}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Skeleton
                                                                    animation="wave"
                                                                    variant="rounded"
                                                                    height={170}
                                                                ></Skeleton>
                                                            </Grid>
                                                            <Grid
                                                                item
                                                                xl={3}
                                                                lg={4}
                                                                md={6}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Skeleton
                                                                    animation="wave"
                                                                    variant="rounded"
                                                                    height={170}
                                                                ></Skeleton>
                                                            </Grid>
                                                            <Grid
                                                                item
                                                                xl={3}
                                                                lg={4}
                                                                md={6}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Skeleton
                                                                    animation="wave"
                                                                    variant="rounded"
                                                                    height={170}
                                                                ></Skeleton>
                                                            </Grid>
                                                        </>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </div>
                                    <div style={{ margin: "10px 0" }}>
                                        <Grid container spacing={1}>
                                            <Grid
                                                item
                                                xl={5}
                                                lg={5}
                                                md={12}
                                                sm={12}
                                                xs={12}
                                            >
                                                {valueSelect ? (
                                                    <div className="home_map">
                                                        <MapD
                                                            height="560px"
                                                            data={
                                                                dataCoordinates
                                                            }
                                                            showTabState={false}
                                                            showBtnAll={false}
                                                            longitudeDefault={
                                                                listDevice[
                                                                    valueSelect
                                                                        .id
                                                                ]["longitude"]
                                                            }
                                                            latitudeDefault={
                                                                listDevice[
                                                                    valueSelect
                                                                        .id
                                                                ]["latitude"]
                                                            }
                                                            showMarkerInfo={
                                                                true
                                                            }
                                                            showButtonHideLabel={false}
                                                        />
                                                    </div>
                                                ) : (
                                                    <Skeleton
                                                        animation="wave"
                                                        variant="rounded"
                                                        height={500}
                                                    ></Skeleton>
                                                )}
                                            </Grid>

                                            <Grid
                                                item
                                                xl={7}
                                                lg={7}
                                                md={12}
                                                sm={12}
                                                xs={12}
                                            >
                                                <Grid container spacing={0.5}>
                                                    {valueSelect ? (
                                                        <>
                                                            <Grid
                                                                item
                                                                xl={12}
                                                                lg={12}
                                                                md={12}
                                                                sm={12}
                                                                xs={12}
                                                                style={{}}
                                                            >
                                                                <div className="home_chart">
                                                                    <MainChart
                                                                        endDate={
                                                                            endDate
                                                                        }
                                                                        startDate={
                                                                            startDate
                                                                        }
                                                                        deviceUser={
                                                                            valueSelect.id
                                                                        }
                                                                    />
                                                                </div>
                                                            </Grid>
                                                            <Grid
                                                                item
                                                                xl={12}
                                                                lg={12}
                                                                md={12}
                                                                sm={12}
                                                                xs={12}
                                                            >
                                                                <Grid
                                                                    container
                                                                    spacing={2}
                                                                >
                                                                    <Grid
                                                                        item
                                                                        xs={3}
                                                                    >
                                                                        <MyDateRange
                                                                            label={
                                                                                "Bắt đầu"
                                                                            }
                                                                            onChange={
                                                                                handleChangeStartDate
                                                                            }
                                                                            value={
                                                                                startDateTemp
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={3}
                                                                    >
                                                                        <MyDateRange
                                                                            label={
                                                                                "Kết thúc"
                                                                            }
                                                                            onChange={
                                                                                handleChangeEndDate
                                                                            }
                                                                            value={
                                                                                endDateTemp
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={3}
                                                                    >
                                                                        <MyButton
                                                                            icon={
                                                                                null
                                                                            }
                                                                            name={
                                                                                "Áp dụng"
                                                                            }
                                                                            onClick={
                                                                                handleApplyDate
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={3}
                                                                    >
                                                                        <MyButton
                                                                            icon={
                                                                                null
                                                                            }
                                                                            name={
                                                                                "Xuất Excel"
                                                                            }
                                                                            onClick={
                                                                                handleExportExcel
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        </>
                                                    ) : (
                                                        <Grid
                                                            item
                                                            xl={12}
                                                            lg={12}
                                                            md={12}
                                                            sm={12}
                                                            xs={12}
                                                        >
                                                            <Skeleton
                                                                animation="wave"
                                                                variant="rounded"
                                                                height={500}
                                                            ></Skeleton>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </div>
                                </Box>
                            </>
                       
                )}
            </div>
        </>
    );
}

export default QuickChartV1; 
