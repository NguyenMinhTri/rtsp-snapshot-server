import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Box, Skeleton, Typography, IconButton, Chip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import SignalWifiStatusbar4BarIcon from "@mui/icons-material/SignalWifiStatusbar4Bar";
import "./OptimizedCameraPlayer.scss";

// Video status enum
const VideoStatus = {
    LOADING: "loading",
    PLAYING: "playing",
    ERROR: "error",
    RECONNECTING: "reconnecting",
};

// Server base URL
const RTSP_SERVER_URL = "https://rtsp-mp4.vercel.app/api/video";

// Build optimized video URL with ultra-low settings for fastest load
const buildVideoUrl = (rtspUrl, options = {}) => {
    const {
        duration = 25, // Longer segment = less reconnects
        lowQuality = true,
        fps = 8,
        width = 320, // Ultra-low: 320x180
        videoBitrate = 150,
        noAudio = true,
        autoFps = true, // Enable server-side auto FPS reduction when overloaded
    } = options;

    const params = new URLSearchParams({
        tagid: rtspUrl,
        sec: duration,
        low: lowQuality ? "1" : "0",
        fps: fps,
        w: width,
        vkbps: videoBitrate,
        audio: noAudio ? "0" : "1",
        autofps: autoFps ? "1" : "0", // Server will auto reduce FPS when near capacity
    });

    return `${RTSP_SERVER_URL}?${params.toString()}`;
};

// Skeleton loading component
const CameraSkeleton = memo(({ height, cameraName }) => (
    <Box
        sx={{
            position: "relative",
            width: "100%",
            height: height,
            backgroundColor: "#1a1a2e",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        {/* Animated background */}
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
                animation: "shimmer 2s infinite",
            }}
        />

        {/* Camera icon */}
        <VideocamIcon
            sx={{
                fontSize: 48,
                color: "rgba(255,255,255,0.3)",
                mb: 2,
                animation: "pulse 1.5s ease-in-out infinite",
            }}
        />

        {/* Loading text */}
        <Typography
            variant="body2"
            sx={{
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
                mb: 1,
            }}
        >
            Đang kết nối camera...
        </Typography>

        {/* Camera name */}
        {cameraName && (
            <Typography
                variant="caption"
                sx={{
                    color: "rgba(255,255,255,0.5)",
                }}
            >
                {cameraName}
            </Typography>
        )}

        {/* Loading dots animation */}
        <Box sx={{ display: "flex", gap: 0.5, mt: 2 }}>
            {[0, 1, 2].map((i) => (
                <Box
                    key={i}
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4ecca3",
                        animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                    }}
                />
            ))}
        </Box>
    </Box>
));

// Error display component
const CameraError = memo(({ height, onRetry, retryCount, maxRetries }) => (
    <Box
        sx={{
            position: "relative",
            width: "100%",
            height: height,
            backgroundColor: "#1a1a2e",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <VideocamOffIcon
            sx={{
                fontSize: 48,
                color: "rgba(255,100,100,0.7)",
                mb: 2,
            }}
        />

        <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}
        >
            Không thể kết nối camera
        </Typography>

        <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.5)", mb: 2 }}
        >
            {retryCount < maxRetries
                ? `Đang thử lại... (${retryCount}/${maxRetries})`
                : "Vui lòng thử lại sau"}
        </Typography>

        <IconButton
            onClick={onRetry}
            sx={{
                backgroundColor: "rgba(78, 204, 163, 0.2)",
                "&:hover": { backgroundColor: "rgba(78, 204, 163, 0.4)" },
            }}
        >
            <RefreshIcon sx={{ color: "#4ecca3" }} />
        </IconButton>
    </Box>
));

// Status badge component - only shows RECONNECTING after timeout
const StatusBadge = memo(({ status, showReconnecting = false }) => {
    // Hide badge during normal reconnection (only show after 60s)
    if (status === VideoStatus.RECONNECTING && !showReconnecting) {
        return null;
    }

    const getStatusConfig = () => {
        switch (status) {
            case VideoStatus.PLAYING:
                return { label: "LIVE", color: "#4ecca3", icon: <SignalWifiStatusbar4BarIcon sx={{ fontSize: 12 }} /> };
            case VideoStatus.LOADING:
                return { label: "Đang tải...", color: "#ffc107", icon: null };
            case VideoStatus.RECONNECTING:
                return { label: "Đang kết nối lại...", color: "#ff9800", icon: null };
            case VideoStatus.ERROR:
                return { label: "Lỗi", color: "#f44336", icon: null };
            default:
                return { label: "", color: "#666", icon: null };
        }
    };

    const config = getStatusConfig();

    return (
        <Chip
            size="small"
            label={config.label}
            icon={config.icon}
            sx={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 10,
                backgroundColor: `${config.color}22`,
                color: config.color,
                border: `1px solid ${config.color}`,
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 24,
                "& .MuiChip-icon": {
                    color: config.color,
                },
                animation: status === VideoStatus.PLAYING ? "liveGlow 2s ease-in-out infinite" : "none",
            }}
        />
    );
});

// Main OptimizedCameraPlayer component with canvas-based frame preservation
const OptimizedCameraPlayer = memo(({
    rtspUrl,
    height = 300,
    cameraName = "",
    autoPlay = true,
    muted = true,
    controls = true,
    maxRetries = 3,
    retryDelay = 3000,
    onStatusChange,
}) => {
    const [status, setStatus] = useState(VideoStatus.LOADING);
    const [retryCount, setRetryCount] = useState(0);
    const [videoKey, setVideoKey] = useState(0);
    const [showCanvas, setShowCanvas] = useState(false);
    const [showReconnectingIndicator, setShowReconnectingIndicator] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const reconnectIndicatorTimeoutRef = useRef(null);
    const isFirstLoad = useRef(true);
    const hasPlayedOnce = useRef(false);

    // Build video URL - 45s segments (max allowed by server)
    const currentVideoUrl = buildVideoUrl(rtspUrl, {
        duration: 45, // Max 45s to reduce reconnect frequency
        lowQuality: true,
        fps: 10,
        width: 426,
        videoBitrate: 200,
        autoFps: true,
    }) + `&t=${videoKey}`;

    // Update status
    const updateStatus = useCallback((newStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [onStatusChange]);

    // Capture frame to canvas
    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return false;

        try {
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 426;
            canvas.height = video.videoHeight || 240;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return true;
        } catch (e) {
            return false;
        }
    }, []);

    // Clear reconnect indicator timer
    const clearReconnectTimer = useCallback(() => {
        if (reconnectIndicatorTimeoutRef.current) {
            clearTimeout(reconnectIndicatorTimeoutRef.current);
            reconnectIndicatorTimeoutRef.current = null;
        }
        setShowReconnectingIndicator(false);
    }, []);

    // Handle load start
    const handleLoadStart = useCallback(() => {
        if (isFirstLoad.current) {
            updateStatus(VideoStatus.LOADING);
        }
    }, [updateStatus]);

    // Handle can play
    const handleCanPlay = useCallback(() => {
        isFirstLoad.current = false;
        hasPlayedOnce.current = true;
        setShowCanvas(false);
        clearReconnectTimer();
        updateStatus(VideoStatus.PLAYING);
        setRetryCount(0);
    }, [updateStatus, clearReconnectTimer]);

    // Handle playing
    const handlePlaying = useCallback(() => {
        setShowCanvas(false);
        clearReconnectTimer();
        updateStatus(VideoStatus.PLAYING);
    }, [updateStatus, clearReconnectTimer]);

    // Handle error
    const handleError = useCallback((e) => {
        console.error("Video error:", e);

        if (hasPlayedOnce.current) {
            captureFrame();
            setShowCanvas(true);
        }

        if (retryCount < maxRetries) {
            updateStatus(VideoStatus.RECONNECTING);
            setRetryCount((prev) => prev + 1);

            // Start 60-second timer for showing indicator
            if (!reconnectIndicatorTimeoutRef.current) {
                reconnectIndicatorTimeoutRef.current = setTimeout(() => {
                    setShowReconnectingIndicator(true);
                }, 60000);
            }

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            retryTimeoutRef.current = setTimeout(() => {
                setVideoKey((prev) => prev + 1);
            }, retryDelay);
        } else {
            updateStatus(VideoStatus.ERROR);
        }
    }, [retryCount, maxRetries, retryDelay, updateStatus, captureFrame]);

    // Handle ended - silent transition
    const handleEnded = useCallback(() => {
        captureFrame();
        setShowCanvas(true);
        updateStatus(VideoStatus.RECONNECTING);
        setVideoKey((prev) => prev + 1);
    }, [updateStatus, captureFrame]);

    // Update video src
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (hasPlayedOnce.current && video.readyState >= 2) {
            captureFrame();
            setShowCanvas(true);
        }

        video.src = currentVideoUrl;
        video.load();
        if (autoPlay) {
            video.play().catch(() => { });
        }
    }, [currentVideoUrl, autoPlay, captureFrame]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (reconnectIndicatorTimeoutRef.current) clearTimeout(reconnectIndicatorTimeoutRef.current);
        };
    }, []);

    // Manual retry
    const handleRetry = useCallback(() => {
        setRetryCount(0);
        isFirstLoad.current = true;
        setShowCanvas(false);
        clearReconnectTimer();
        setVideoKey((prev) => prev + 1);
        updateStatus(VideoStatus.LOADING);
    }, [updateStatus, clearReconnectTimer]);

    if (status === VideoStatus.ERROR) {
        return (
            <CameraError
                height={height}
                onRetry={handleRetry}
                retryCount={retryCount}
                maxRetries={maxRetries}
            />
        );
    }

    return (
        <Box
            className="optimized-camera-player"
            sx={{
                position: "relative",
                width: "100%",
                height: height,
                backgroundColor: "#000",
                borderRadius: "8px",
                overflow: "hidden",
            }}
        >
            <StatusBadge status={status} showReconnecting={showReconnectingIndicator} />

            {status === VideoStatus.LOADING && isFirstLoad.current && (
                <Box sx={{ position: "absolute", inset: 0, zIndex: 5 }}>
                    <CameraSkeleton height={height} cameraName={cameraName} />
                </Box>
            )}

            {/* Reconnecting indicator removed - video just shows last frame silently */}

            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: showCanvas ? 2 : 0,
                    opacity: showCanvas ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                }}
            />

            <video
                ref={videoRef}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: !showCanvas && status === VideoStatus.PLAYING ? 1 : showCanvas ? 0 : 0.3,
                    transition: "opacity 0.3s ease",
                }}
                muted={muted}
                controls={controls}
                playsInline
                onLoadStart={handleLoadStart}
                onCanPlay={handleCanPlay}
                onPlaying={handlePlaying}
                onError={handleError}
                onEnded={handleEnded}
            />
        </Box>
    );
});

OptimizedCameraPlayer.displayName = "OptimizedCameraPlayer";

export default OptimizedCameraPlayer;
export { VideoStatus, buildVideoUrl };
