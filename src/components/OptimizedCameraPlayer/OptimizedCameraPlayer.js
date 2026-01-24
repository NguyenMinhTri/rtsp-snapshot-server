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
    } = options;

    const params = new URLSearchParams({
        tagid: rtspUrl,
        sec: duration,
        low: lowQuality ? "1" : "0",
        fps: fps,
        w: width,
        vkbps: videoBitrate,
        audio: noAudio ? "0" : "1",
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

// Status badge component
const StatusBadge = memo(({ status }) => {
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

// Main OptimizedCameraPlayer component
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
    const [videoKey, setVideoKey] = useState(0); // Force re-render video element

    const videoRef = useRef(null);
    const nextVideoRef = useRef(null); // For double-buffering
    const retryTimeoutRef = useRef(null);

    // Build video URL with optimized settings
    const videoUrl = buildVideoUrl(rtspUrl, {
        duration: 30,
        lowQuality: true,
        fps: 10,
        width: 426, // 426x240
        videoBitrate: 200,
    });

    // Update status and notify parent
    const updateStatus = useCallback((newStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [onStatusChange]);

    // Handle video load start
    const handleLoadStart = useCallback(() => {
        if (status !== VideoStatus.RECONNECTING) {
            updateStatus(VideoStatus.LOADING);
        }
    }, [status, updateStatus]);

    // Handle video can play
    const handleCanPlay = useCallback(() => {
        updateStatus(VideoStatus.PLAYING);
        setRetryCount(0);
    }, [updateStatus]);

    // Handle video playing
    const handlePlaying = useCallback(() => {
        updateStatus(VideoStatus.PLAYING);
    }, [updateStatus]);

    // Handle video error
    const handleError = useCallback((e) => {
        console.error("Video error:", e);

        if (retryCount < maxRetries) {
            updateStatus(VideoStatus.RECONNECTING);
            setRetryCount((prev) => prev + 1);

            // Clear previous timeout
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            // Retry after delay
            retryTimeoutRef.current = setTimeout(() => {
                setVideoKey((prev) => prev + 1); // Force re-render
            }, retryDelay);
        } else {
            updateStatus(VideoStatus.ERROR);
        }
    }, [retryCount, maxRetries, retryDelay, updateStatus]);

    // Handle video ended - seamlessly reload
    const handleEnded = useCallback(() => {
        // Immediately start next segment
        setVideoKey((prev) => prev + 1);
        updateStatus(VideoStatus.RECONNECTING);
    }, [updateStatus]);

    // Handle timeupdate - preload next video when near end
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const timeLeft = video.duration - video.currentTime;

        // Start preloading 5 seconds before end
        if (timeLeft <= 5 && timeLeft > 0 && !nextVideoRef.current) {
            // Create hidden video element to preload next segment
            const preloadVideo = document.createElement("video");
            preloadVideo.src = buildVideoUrl(rtspUrl, {
                duration: 30,
                lowQuality: true,
            }) + `&t=${Date.now()}`; // Cache bust
            preloadVideo.preload = "auto";
            preloadVideo.muted = true;
            preloadVideo.style.display = "none";
            document.body.appendChild(preloadVideo);
            nextVideoRef.current = preloadVideo;

            // Clean up after 30 seconds
            setTimeout(() => {
                if (nextVideoRef.current) {
                    document.body.removeChild(nextVideoRef.current);
                    nextVideoRef.current = null;
                }
            }, 30000);
        }
    }, [rtspUrl]);

    // Manual retry
    const handleRetry = useCallback(() => {
        setRetryCount(0);
        setVideoKey((prev) => prev + 1);
        updateStatus(VideoStatus.LOADING);
    }, [updateStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (nextVideoRef.current) {
                document.body.removeChild(nextVideoRef.current);
                nextVideoRef.current = null;
            }
        };
    }, []);

    // Show error UI if max retries exceeded
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
            {/* Status badge */}
            <StatusBadge status={status} />

            {/* Skeleton loader - show while loading */}
            {(status === VideoStatus.LOADING || status === VideoStatus.RECONNECTING) && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                    }}
                >
                    <CameraSkeleton height={height} cameraName={cameraName} />
                </Box>
            )}

            {/* Video element */}
            <video
                key={videoKey}
                ref={videoRef}
                src={videoUrl + `&t=${videoKey}`} // Cache bust for each segment
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: status === VideoStatus.PLAYING ? 1 : 0,
                    transition: "opacity 0.3s ease",
                }}
                autoPlay={autoPlay}
                muted={muted}
                controls={controls}
                playsInline
                onLoadStart={handleLoadStart}
                onCanPlay={handleCanPlay}
                onPlaying={handlePlaying}
                onError={handleError}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
            />
        </Box>
    );
});

OptimizedCameraPlayer.displayName = "OptimizedCameraPlayer";

export default OptimizedCameraPlayer;
export { VideoStatus, buildVideoUrl };
