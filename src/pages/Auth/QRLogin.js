import React, { useEffect, useState } from "react";
import "./Auth.scss";

import { useNavigate } from "react-router-dom";

import { getAuth } from "firebase/auth";
import io from "socket.io-client";
import Toast from "../../utils/toasts";
import "./Auth.scss";

import Cookies from "js-cookie";
import "react-toastify/dist/ReactToastify.css";

import {
    signInWithCustomToken
} from "firebase/auth";
import QRCode from "react-qr-code";
import uuid from "react-uuid";
import BackDropLoading from "../../components/BackDropLoading";
import asyncLocalStorage from "../../utils/async_localstorage";

export default function QRLogin({
    backToLogin,
    handleGetListSensorFromDevice,
    loading,
    setLoading,
}) {
    const [uuidv4Str, setUuidv4Str] = useState(uuid());
    useEffect(() => {
        let uuidv4Str = uuid();
        setUuidv4Str(uuidv4Str);

        socket.on(uuidv4Str, (msg) => {
            if (msg === "empty") {
            } else if (msg.includes("loading#")) {
                setLoading(true);
            } else if (msg.includes("token#")) {
                setLoading(true);
                signInWithCustomToken(getAuth(), msg.replace("token#", ""))
                    .then((result) => {
                        const user = result.user;
                        const name = user.displayName;
                        const imgUser = user.photoURL;
                        localStorage.setItem("loginUserName", name);
                        localStorage.setItem("imgUser", imgUser);
                        localStorage.setItem("loginEmail", user.email);
                        // sessionStorage.setItem('auth_token', user.refreshToken);

                        getDeviceUser(user, user.accessToken);
                    })
                    .catch(function (error) {
                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        if (errorCode === "auth/invalid-custom-token") {
                            alert(
                                "The token you provided is not valid." + token
                            );
                        } else {
                            console.error(error);
                        }
                        setLoading(false);
                    });
            } else {
            }
        });
    }, []);
    // console.log({ uuidv4Str });
    const navigate = useNavigate();

    const socket = io("https://login-qr.iotdaiviet.com");

    // get deviced user
    const getDeviceUser = (author, accessToken) => {
        author.getIdToken().then((data) => {
            const token = `Bearer ${data}`;
            // let a = getDeviceUser(token);
            Toast("info", "Vui lòng chờ. Đang chuyển hướng!");
            fetch(
                "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/getListDevices",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: token,
                        "Content-Type": "application/x-www-form-urlencoded",
                    }),
                }
            )
                .then((response) => response.json())
                .then(async (myJson) => {
                    setLoading(true);
                    const res = myJson.ListDevicesOfUser;
                    const filteredObj = {};
                    const listSensorKeys = Object.keys(res);
                    listSensorKeys
                        .filter(
                            (key) =>
                                !key.includes("HUMATIC-HCE") &&
                                !key.includes("IRO-")
                        )
                        .forEach((key) => {
                            filteredObj[key] = res[key];
                        });
                    await handleGetListSensorFromDevice(listSensorKeys);
                    asyncLocalStorage
                        .setItem("device_user", JSON.stringify(filteredObj))
                        .then(() => {
                            Cookies.set("auth_token", accessToken, {
                                expires: 2147483647,
                            });
                            Toast("success", "Đăng nhập thành công");
                            if ( author.email !== null &&
                                (author.email.includes("datalogger") ||
                                author.email.includes("tttservice"))
                            ) {
                                navigate("/generality");
                            } else navigate("/home");
                            setLoading(false);
                        })
                        .catch(() => {
                            Toast(
                                "error",
                                "Đã xảy ra lỗi trong quá trình đăng nhập"
                            );
                            setLoading(false);
                        });
                })
                .catch((err) => {
                    console.log({ err_loin: err });
                    setLoading(false);
                });
        });
    };

    // handle login equal email
    const auth = getAuth();

    // back to login page
    const handleBackLoginPage = () => {
        backToLogin("Login");
    };

    return (
        <>
            {loading && <BackDropLoading />}
            <div className="form_login">
                <h3 style={{ marginBottom: "0px" }}>ĐĂNG NHẬP QR CODE</h3>
                <div className="">
                    <div
                        style={{
                            // height: "auto",
                            margin: "0 auto",
                            maxWidth: 100,
                            width: "100%",
                        }}
                    >
                        <QRCode
                            size={256}
                            style={{
                                height: "auto",
                                maxWidth: "100%",
                                width: "100%",
                            }}
                            value={"scada#" + uuidv4Str}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                </div>
                <h6 style={{ marginBottom: "0px" }}>Để đăng nhập bằng QR Code, vui lòng mở ứng dụng Navis và quét mã QR này.</h6>
            </div>
        </>
    );
}
