import { useState, useEffect, useCallback, memo } from "react";
import { Grid, Box, Typography } from "@mui/material";
import React from "react";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import "./Camera.scss";
import asyncLocalStorage from "../../utils/async_localstorage";
import OptimizedCameraPlayer from "../../components/OptimizedCameraPlayer";

/**
 * CameraChild - Optimized camera grid component
 * Uses OptimizedCameraPlayer for faster load time with skeleton loading
 */
const CameraChild = memo(({ cameraList, resDialog }) => {
    const [ipCamera, setValueIP] = useState("");
    const [isReady, setIsReady] = useState(false);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = deviceUser ? JSON.parse(deviceUser) : null;

    // Initialize IP camera and mark ready
    useEffect(() => {
        asyncLocalStorage.getItem("ip_camera").then((ipcamera) => {
            setValueIP(ipcamera || "");
            setIsReady(true);
        });
    }, []);

    // Handle navis-cloud-camera monitor activation/deactivation
    useEffect(() => {
        if (!cameraList || !Array.isArray(cameraList)) return;

        // Activate monitors
        cameraList.forEach((camera) => {
            if (camera.includes("navis-cloud-camera") && !resDialog) {
                const id = camera.split("monitor=")[1]?.split("&")[0];
                if (id) {
                    fetch(
                        `https://navis-cloud-camera.iotdaiviet.com/zm/api/monitors/${id}.json`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: "Monitor[Function]=Monitor",
                        }
                    ).catch(console.error);
                }
            }
        });

        // Cleanup: deactivate monitors on unmount
        return () => {
            cameraList.forEach((camera) => {
                if (camera.includes("navis-cloud-camera") && !resDialog) {
                    const id = camera.split("monitor=")[1]?.split("&")[0];
                    if (id) {
                        fetch(
                            `https://navis-cloud-camera.iotdaiviet.com/zm/api/monitors/${id}.json`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: "Monitor[Function]=None",
                            }
                        ).catch(console.error);
                    }
                }
            });
        };
    }, [cameraList, resDialog]);

    // Get resolved RTSP URL
    const getRtspUrl = useCallback((cameraUrl) => {
        return cameraUrl.replace("[ip]", ipCamera);
    }, [ipCamera]);

    // Calculate grid size based on camera count and dialog mode
    // 1-3 cameras: 1 per row (full width)
    // 4 cameras: 2 per row (2x2 grid)
    const getGridSize = useCallback((cameraCount) => {
        if (resDialog) {
            // Dialog mode: 2x2 for 4 cameras, otherwise full width
            return cameraCount === 4 ? 6 : 12;
        }
        // Homepage: only use 2x2 grid when exactly 4 cameras
        return cameraCount === 4 ? 6 : 12;
    }, [resDialog]);

    // Calculate video height based on camera count
    const getVideoHeight = useCallback((cameraCount) => {
        if (resDialog) {
            return cameraCount === 4 ? 300 : 400;
        }
        // Homepage heights - larger for fewer cameras
        if (cameraCount === 1) return 320;
        if (cameraCount === 2) return 250;
        if (cameraCount === 3) return 200;
        return 200; // 4 cameras in 2x2 grid
    }, [resDialog]);

    // Empty camera list state
    if (!cameraList || cameraList.length === 0) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 200,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 2,
                    p: 4,
                }}
            >
                <VideocamOffIcon sx={{ fontSize: 48, color: "#999", mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                    Không có camera để giám sát
                </Typography>
            </Box>
        );
    }

    // Wait for IP camera resolution
    if (!isReady) {
        return null; // OptimizedCameraPlayer will show skeleton
    }

    const gridSize = getGridSize(cameraList.length);
    const videoHeight = getVideoHeight(cameraList.length);

    return (
        <Box className="camera_card">
            <Grid
                container
                spacing={1}
                sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#1a1a2e",
                }}
            >
                {cameraList.map((cameraUrl, index) => (
                    <Grid
                        key={`camera-${index}`}
                        item
                        xl={gridSize}
                        lg={gridSize}
                        md={gridSize}
                        sm={12}
                        xs={12}
                    >
                        <OptimizedCameraPlayer
                            rtspUrl={getRtspUrl(cameraUrl)}
                            height={videoHeight}
                            cameraName={`Camera ${index + 1}`}
                            autoPlay
                            muted
                            controls
                            maxRetries={3}
                            retryDelay={3000}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
});

CameraChild.displayName = "CameraChild";

export default CameraChild;
// <video width="750" height="500" controls muted autoPlay={true} preLoad="auto" loop>
//     <source src="https://config.iotdaiviet.com/video?tagid=rtsp://admin:hd543211@123.25.218.245:1555/11" />
// </video>
