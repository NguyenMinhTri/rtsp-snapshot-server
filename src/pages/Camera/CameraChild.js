import { useState, useEffect, useCallback, memo } from "react";
import { Grid, Box, Typography, IconButton } from "@mui/material";
import React from "react";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import "./Camera.scss";
import asyncLocalStorage from "../../utils/async_localstorage";
import OptimizedCameraPlayer, { VideoStatus } from "../../components/OptimizedCameraPlayer";

/**
 * CameraChild - Optimized camera grid component
 * Uses OptimizedCameraPlayer for faster load time with skeleton loading
 * Shows consolidated error message when all cameras fail
 */
const CameraChild = memo(({ cameraList, resDialog }) => {
    const [ipCamera, setValueIP] = useState("");
    const [isReady, setIsReady] = useState(false);
    // Track error status for each camera
    const [cameraStatuses, setCameraStatuses] = useState({});
    const [retryKey, setRetryKey] = useState(0);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = deviceUser ? JSON.parse(deviceUser) : null;

    // Initialize IP camera and mark ready
    useEffect(() => {
        asyncLocalStorage.getItem("ip_camera").then((ipcamera) => {
            setValueIP(ipcamera || "");
            setIsReady(true);
        });
    }, []);

    // Reset camera statuses when camera list changes
    useEffect(() => {
        if (cameraList && cameraList.length > 0) {
            setCameraStatuses({});
        }
    }, [cameraList, retryKey]);

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

    // Handle camera status change
    const handleCameraStatusChange = useCallback((index, status) => {
        setCameraStatuses(prev => ({
            ...prev,
            [index]: status
        }));
    }, []);

    // Check if all cameras have error
    const allCamerasError = cameraList && cameraList.length > 0 &&
        Object.keys(cameraStatuses).length === cameraList.length &&
        Object.values(cameraStatuses).every(status => status === VideoStatus.ERROR);

    // Handle retry all cameras
    const handleRetryAll = useCallback(() => {
        setCameraStatuses({});
        setRetryKey(prev => prev + 1);
    }, []);

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
    // Optimized for 420px section height (header ~44px, padding ~8px)
    // Available height: ~368px for cameras
    const getVideoHeight = useCallback((cameraCount) => {
        if (resDialog) {
            // Dialog mode: more space available
            return cameraCount === 4 ? 320 : 450;
        }
        // Homepage heights - optimized for 420px section
        if (cameraCount === 1) return 360;
        if (cameraCount === 2) return 180;
        if (cameraCount === 3) return 115;
        return 175; // 4 cameras in 2x2 grid
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

    // Show consolidated error message when all cameras fail
    if (allCamerasError) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                    backgroundColor: "#1a1a2e",
                    borderRadius: 2,
                    p: 4,
                }}
            >
                <VideocamOffIcon
                    sx={{
                        fontSize: 56,
                        color: "rgba(255,150,100,0.8)",
                        mb: 2
                    }}
                />

                <Typography
                    variant="h6"
                    sx={{
                        color: "rgba(255,255,255,0.95)",
                        fontWeight: 600,
                        textAlign: "center",
                        mb: 1
                    }}
                >
                    🔧 Hệ thống camera web đang bảo trì
                </Typography>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.5,
                    bgcolor: 'rgba(78, 204, 163, 0.15)',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid rgba(78, 204, 163, 0.3)'
                }}>
                    <PhoneAndroidIcon sx={{ color: "#4ecca3", fontSize: 20 }} />
                    <Typography
                        variant="body2"
                        sx={{
                            color: "rgba(255,255,255,0.9)",
                            textAlign: "center"
                        }}
                    >
                        Vui lòng xem camera trên <strong style={{ color: "#4ecca3" }}>ứng dụng NAVIS</strong>
                    </Typography>
                </Box>

                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        mb: 2,
                        maxWidth: 300
                    }}
                >
                    Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn. Xin lỗi vì sự bất tiện!
                </Typography>

                <IconButton
                    onClick={handleRetryAll}
                    sx={{
                        backgroundColor: "rgba(78, 204, 163, 0.2)",
                        "&:hover": { backgroundColor: "rgba(78, 204, 163, 0.4)" },
                        px: 2,
                        borderRadius: 2,
                    }}
                >
                    <RefreshIcon sx={{ color: "#4ecca3", mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: "#4ecca3", fontWeight: 500 }}>
                        Thử lại
                    </Typography>
                </IconButton>
            </Box>
        );
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
                        key={`camera-${index}-${retryKey}`}
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
                            onStatusChange={(status) => handleCameraStatusChange(index, status)}
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
