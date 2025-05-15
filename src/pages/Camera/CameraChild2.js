import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
    Autocomplete,
    Button,
    CardMedia,
    Grid,
    TextField,
} from "@mui/material";
import React from "react";
import Nothing from "../../components/Nothing";
import SubHeader from "../../components/SubHeader";
import "./Camera.scss";
import asyncLocalStorage from "../../utils/async_localstorage";
import Loading from "../../components/Loading";
import CircularProgress from "@mui/material/CircularProgress";
function CameraChild({ cameraList }) {
    const [dataChange, setDataChange] = useState(false);
    const [valueSelect, setValueSelect] = useState("");
    const [menuValue, setMenuSelect] = useState([]);
    const [detailMonitor, setDetailMonitor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [ipCamera, setValueIP] = useState("");
    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        for (let camera in cameraList) {
            if (cameraList[camera].includes("navis-cloud-camera")) {
                let id = cameraList[camera].split("monitor=")[1].split("&")[0];
                fetch(
                    `https://navis-cloud-camera.iotdaiviet.com/zm/api/monitors/${id}.json`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: "Monitor[Function]=Monitor",
                    }
                );
                setTimeout(function () {
                    setIsLoading(false);
                }, 5000);
            } else {
                setIsLoading(false);
            }
        }
        const intervalId = setInterval(() => {
            // console.log(`Current blinking text: ${cameraList.length}`);
            setVisible((visible) => !visible);
        }, 1000);
        return () => {
            clearInterval(intervalId);

            for (let camera in cameraList) {
                if (cameraList[camera].includes("navis-cloud-camera")) {
                    let id = cameraList[camera]
                        .split("monitor=")[1]
                        .split("&")[0];

                    fetch(
                        `https://navis-cloud-camera.iotdaiviet.com/zm/api/monitors/${id}.json`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded",
                            },
                            body: "Monitor[Function]=None",
                        }
                    );
                } else {
                }
            }
        };
    }, [cameraList]);
    let devices = [];
    useEffect(() => {
        setIsLoading(true);
        setTimeout(function () {
            setIsLoading(false);
        }, 2000);
    }, [cameraList]);
    useEffect(() => {
        if (listDevice) {
            const id = Object.keys(listDevice);
            id.forEach((v) => {
                devices.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                });
            });
        }
        setMenuSelect(devices);
    }, []);

    function handleVideoError(event) {
        console.error("Error loading video:", event.target.src);
        event.target.src = event.target.src;
    }
    function handleVideoLoad(event) {
        setInterval(() => {
            event.target.play();
        }, 1000);
    }
    useEffect(() => {
        asyncLocalStorage.getItem("ip_camera").then((ipcamera) => {
            setValueIP(ipcamera);
            asyncLocalStorage.getItem("home_station").then((station) => {
                if (station) {
                    let stationUser = JSON.parse(station);
                    setValueSelect(stationUser);
                    cameraList = listDevice[stationUser.id]["cameraList"];
                } else {
                    setValueSelect(devices[0]);
                    cameraList = listDevice[devices[0].id]["cameraList"];
                }

                if (ipcamera)
                    for (let camera in cameraList) {
                        camera = camera.replace("[ip]", ipcamera);
                    }
            });
        });
    }, []);

    // console.log({ valueSelect });

    return isLoading ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
        </div>
    ) : (
        <div className="camera_card">
            {/* <SubHeader text={'GIÁM SÁT TRỰC TUYẾN TRẠM NƯỚC THẢI'} /> */}

            <Grid
                container
                style={{
                    border: "1px solid #ccc",
                    height: "100%",
                    borderRadius: "8px",
                }}
            >
                {cameraList.length ? (
                    cameraList.map((v, index) => {
                        return v.includes("navis-cloud-camera") ? (
                            <Grid
                                key={index}
                                item
                                xl={12}
                                lg={12}
                                md={12}
                                sm={12}
                                xs={12}
                            >
                                <CardMedia
                                    component="img"
                                    height={
                                        cameraList.length > 1 ? "250" : "500"
                                    }
                                    sx={{
                                        padding: "0em 0em 0 0em",
                                        objectFit: "contain",
                                    }}
                                    image={v.replace("[ip]", ipCamera)}
                                    alt="Paella dish"
                                />
                            </Grid>
                        ) : (
                            <Grid
                                key={index}
                                item
                                xl={12}
                                lg={12}
                                md={12}
                                sm={12}
                                xs={12}
                            >
                                <CardMedia
                                    onError={handleVideoError}
                                    // onLoad={handleVideoLoad}
                                    component="video"
                                    height={
                                        cameraList.length > 1 ? "250" : "500"
                                    }
                                    autoPlay
                                    controls
                                    playsInline
                                    loop
                                    muted
                                    src={v.replace("[ip]", ipCamera)}
                                    alt="Paella dish"
                                />
                            </Grid>
                        );
                    })
                ) : (
                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "100px",
                            width: "100%",
                        }}
                    >
                        <p>Không có camera để giám sát</p>
                    </div>
                )}
            </Grid>
        </div>
    );
}

export default CameraChild;
// <video width="750" height="500" controls muted autoPlay={true} preLoad="auto" loop>
//     <source src="https://config.iotdaiviet.com/video?tagid=rtsp://admin:hd543211@123.25.218.245:1555/11" />
// </video>
