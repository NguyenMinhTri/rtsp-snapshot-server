import { useState, useEffect, useRef } from "react";
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
function Camera() {
    const [dataChange, setDataChange] = useState(false);
    const [valueSelect, setValueSelect] = useState("");
    const [menuValue, setMenuSelect] = useState([]);
    const [detailMonitor, setDetailMonitor] = useState(null);
    const [cameraList, setCameraList] = useState([]);
    const [ipCamera, setValueIP] = useState("");
    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);
    const [isLoading, setIsLoading] = useState(true);
    const refVideo = useRef();

    let devices = [];
    useEffect(() => {
        setIsLoading(true);
        setTimeout(function () {
            setIsLoading(false);
        }, 2000);
    }, [cameraList]);
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

        return () => {
          

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

    const handleOnChangeSelectStation = (e, v) => {
        if (v !== null) {
            setValueSelect(v);
            setCameraList(listDevice[v.id]["cameraList"]);
        }
    };
    function handleVideoError(event) {
        console.error("Error loading video:", event.target.src);
        event.target.src = event.target.src;
    }
    // function handleVideoLoad(event) {
    //     setInterval(() => {
    //         event.target.play();
    //     }, 1000);
    // }
    useEffect(() => {
        asyncLocalStorage.getItem("ip_camera").then((ipcamera) => {
            asyncLocalStorage.getItem("home_station").then((station) => {
                const searchParams = new URLSearchParams(window.location.search);
                const deviceId = searchParams.get("deviceId");
                if (station && deviceId === null) {
                    let stationUser = JSON.parse(station);
                    setValueSelect(stationUser);
                    setCameraList(listDevice[stationUser.id]["cameraList"]);
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
                    setCameraList(listDevice[deviceIdTemp]["cameraList"]);
                }
                setValueIP(ipcamera);
                if (ipcamera)
                    for (let camera in cameraList) {
                        camera = camera.replace("[ip]", ipcamera);
                    }
            });
        });
    }, []);

    console.log({  cameraList });

    return  (
        <div className="camera_page">
            <SubHeader
                text={
                    valueSelect.label
                        ? `GIÁM SÁT CAMERA ${valueSelect.label}`
                        : "CHỌN TRẠM ĐỂ GIÁM SÁT CAMERA"
                }
            />
            {/* <SubHeader text={'GIÁM SÁT TRỰC TUYẾN TRẠM NƯỚC THẢI'} /> */}
            <div className="camera_page-select">
                <Grid container spacing={2}>
                    <Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
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
                                    label="Chọn trạm giám sát"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </div>
            <div>
            {
                isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems:"center" }}>
            <CircularProgress />
        </div>
    ) : 
                <Grid container spacing={2}>
                    {cameraList.length ? (
                        cameraList.map((v, index) => {
                            return (
                                <Grid
                                    key={index}
                                    item
                                    xl={6}
                                    lg={6}
                                    md={6}
                                    sm={12}
                                    xs={12}
                                >
                                  
                                    <CardMedia
                                        onError={handleVideoError}
                                      //  onLoad={handleVideoLoad}
                                          component="video"
                                        height="700"
                               
                                        style={{border : '1px solid #ccc'}}
                                   
                                        autoPlay
                                    controls
                                    playsInline
                                    loop
                                        // src={v.replace("[ip]",ipCamera)}
                                        alt={valueSelect.label}
                                          src={"https://rtsp-mp4.vercel.app/api/video?tagid="+v.replace("[ip]",ipCamera)}
                                 
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
            }
            </div>
        </div>
    );
}

export default Camera;
// <video width="750" height="500" controls muted autoPlay={true} preLoad="auto" loop>
//     <source src="https://config.iotdaiviet.com/video?tagid=rtsp://admin:hd543211@123.25.218.245:1555/11" />
// </video>
