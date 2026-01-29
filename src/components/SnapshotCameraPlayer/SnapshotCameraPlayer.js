import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Box, Typography, Chip, IconButton, CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import "./SnapshotCameraPlayer.scss";

// Snapshot status enum
const SnapshotStatus = {
    LOADING: "loading",
    READY: "ready",
    ERROR: "error",
};

// Server URL - Render.com deployment
const SNAPSHOT_SERVER_URL = process.env.REACT_APP_SNAPSHOT_SERVER_URL || "https://rtsp-snapshot-server.onrender.com";

// Default refresh interval (10 seconds)
const DEFAULT_INTERVAL_MS = 10000;

// Time before showing "use NAVIS app" message (5 minutes)
const ERROR_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * CountdownBadge - Shows seconds until next refresh
 */
const CountdownBadge = memo(({ seconds, isRefreshing }) => (
    <Chip
        size="small"
        icon={isRefreshing ? (
            <CircularProgress size={12} sx={{ color: '#4ecca3' }} />
        ) : (
            <RefreshIcon sx={{ fontSize: 14 }} />
        )}
        label={isRefreshing ? "..." : `${seconds}s`}
        sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "#fff",
            border: "1px solid rgba(78, 204, 163, 0.5)",
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 26,
            minWidth: 50,
            "& .MuiChip-icon": {
                color: "#4ecca3",
            },
            transition: "all 0.3s ease",
            "&:hover": {
                backgroundColor: "rgba(78, 204, 163, 0.3)",
            }
        }}
    />
));

/**
 * LiveBadge - Shows snapshot mode indicator
 */
const LiveBadge = memo(({ status }) => {
    const getConfig = () => {
        switch (status) {
            case SnapshotStatus.READY:
                return { label: "SNAPSHOT", color: "#4ecca3", icon: <PhotoCameraIcon sx={{ fontSize: 12 }} /> };
            case SnapshotStatus.LOADING:
                return { label: "Đang tải...", color: "#ffc107", icon: null };
            case SnapshotStatus.ERROR:
                return { label: "Lỗi", color: "#f44336", icon: null };
            default:
                return { label: "", color: "#666", icon: null };
        }
    };

    const config = getConfig();

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
            }}
        />
    );
});

/**
 * SnapshotSkeleton - Loading state with Navis branding
 */
const SnapshotSkeleton = memo(({ height, cameraName }) => (
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

        {/* Navis Logo */}
        <Box
            component="img"
            src="/image/navis.png"
            alt="Loading"
            sx={{
                width: 60,
                height: 60,
                objectFit: "contain",
                borderRadius: "12px",
                mb: 2,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                    "0%, 100%": { opacity: 1, transform: "scale(1)" },
                    "50%": { opacity: 0.6, transform: "scale(0.95)" },
                },
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
            Đang tải hình ảnh camera...
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

/**
 * SnapshotError - Error state with maintenance message
 * showNavisMessage: only show after 5 minutes of continuous errors
 */
const SnapshotError = memo(({ height, onRetry, showNavisMessage = false }) => (
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
            padding: 2,
        }}
    >
        <VideocamOffIcon
            sx={{
                fontSize: 48,
                color: "rgba(255,150,100,0.8)",
                mb: 2,
            }}
        />

        <Typography
            variant="body1"
            sx={{
                color: "rgba(255,255,255,0.9)",
                mb: 1,
                fontWeight: 600,
                textAlign: "center"
            }}
        >
            {showNavisMessage ? "🔧 Không thể tải hình ảnh camera" : "Đang thử kết nối lại..."}
        </Typography>

        {/* Only show NAVIS app message after 5 minutes */}
        {showNavisMessage && (
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
                    Xem camera trên <strong style={{ color: "#4ecca3" }}>ứng dụng NAVIS</strong>
                </Typography>
            </Box>
        )}

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

/**
 * SnapshotCameraPlayer - Main component
 * Displays camera snapshot with countdown timer
 */
const SnapshotCameraPlayer = memo(({
    rtspUrl,
    height = 300,
    cameraName = "",
    refreshInterval = DEFAULT_INTERVAL_MS,
    maxRetries = 3,
    onStatusChange,
}) => {
    const [status, setStatus] = useState(SnapshotStatus.LOADING);
    const [imageSrc, setImageSrc] = useState("");
    const [countdown, setCountdown] = useState(refreshInterval / 1000);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [showNavisMessage, setShowNavisMessage] = useState(false);

    const intervalRef = useRef(null);
    const countdownRef = useRef(null);
    const errorStartTimeRef = useRef(null);

    // Build snapshot URL
    const getSnapshotUrl = useCallback(() => {
        const encodedUrl = encodeURIComponent(rtspUrl);
        return `${SNAPSHOT_SERVER_URL}/snapshot?url=${encodedUrl}&t=${Date.now()}`;
    }, [rtspUrl]);

    // Update status
    const updateStatus = useCallback((newStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
    }, [onStatusChange]);

    // Fetch new snapshot
    const fetchSnapshot = useCallback(async () => {
        setIsRefreshing(true);

        try {
            const url = getSnapshotUrl();
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // Revoke old URL to prevent memory leak
            if (imageSrc && imageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(imageSrc);
            }

            setImageSrc(objectUrl);
            updateStatus(SnapshotStatus.READY);
            setRetryCount(0);
            // Reset error tracking on success
            errorStartTimeRef.current = null;
            setShowNavisMessage(false);

            // Get next refresh from headers if available
            const nextRefresh = response.headers.get('X-Next-Refresh');
            if (nextRefresh) {
                setCountdown(Math.ceil(parseInt(nextRefresh) / 1000));
            } else {
                setCountdown(refreshInterval / 1000);
            }
        } catch (error) {
            console.error('Snapshot fetch error:', error);

            // Track when errors started
            if (!errorStartTimeRef.current) {
                errorStartTimeRef.current = Date.now();
            }

            // Check if 5 minutes have passed
            const errorDuration = Date.now() - errorStartTimeRef.current;
            if (errorDuration >= ERROR_THRESHOLD_MS) {
                setShowNavisMessage(true);
            }

            if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1);
                // Retry after 2 seconds
                setTimeout(fetchSnapshot, 2000);
            } else {
                updateStatus(SnapshotStatus.ERROR);
                // Continue retrying in background every 30 seconds
                setTimeout(() => {
                    setRetryCount(0);
                    fetchSnapshot();
                }, 30000);
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [getSnapshotUrl, imageSrc, refreshInterval, retryCount, maxRetries, updateStatus]);

    // Initial fetch
    useEffect(() => {
        fetchSnapshot();

        // Cleanup on unmount
        return () => {
            if (imageSrc && imageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(imageSrc);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rtspUrl]);

    // Countdown timer
    useEffect(() => {
        if (status === SnapshotStatus.ERROR) return;

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchSnapshot();
                    return refreshInterval / 1000;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [status, refreshInterval, fetchSnapshot]);

    // Pause when tab not visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (countdownRef.current) {
                    clearInterval(countdownRef.current);
                }
            } else {
                // Resume and fetch fresh snapshot
                fetchSnapshot();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchSnapshot]);

    // Manual retry
    const handleRetry = useCallback(() => {
        setRetryCount(0);
        errorStartTimeRef.current = null;
        setShowNavisMessage(false);
        updateStatus(SnapshotStatus.LOADING);
        fetchSnapshot();
    }, [updateStatus, fetchSnapshot]);

    // Error state
    if (status === SnapshotStatus.ERROR) {
        return (
            <SnapshotError
                height={height}
                onRetry={handleRetry}
                showNavisMessage={showNavisMessage}
            />
        );
    }

    // Loading state (first load)
    if (status === SnapshotStatus.LOADING && !imageSrc) {
        return (
            <SnapshotSkeleton
                height={height}
                cameraName={cameraName}
            />
        );
    }

    // Ready state with image
    return (
        <Box
            className="snapshot-camera-player"
            sx={{
                position: "relative",
                width: "100%",
                height: height,
                backgroundColor: "#1a1a2e",
                borderRadius: "8px",
                overflow: "hidden",
            }}
        >
            <LiveBadge status={status} />
            <CountdownBadge seconds={countdown} isRefreshing={isRefreshing} />

            <Box
                component="img"
                src={imageSrc}
                alt={cameraName || "Camera snapshot"}
                sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transition: "opacity 0.3s ease",
                    opacity: isRefreshing ? 0.7 : 1,
                }}
                onError={() => {
                    if (retryCount < maxRetries) {
                        setRetryCount(prev => prev + 1);
                        setTimeout(fetchSnapshot, 2000);
                    } else {
                        updateStatus(SnapshotStatus.ERROR);
                    }
                }}
            />

            {/* Refresh overlay during update */}
            {isRefreshing && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 5,
                    }}
                >
                    <CircularProgress size={24} sx={{ color: "#4ecca3" }} />
                </Box>
            )}
        </Box>
    );
});

SnapshotCameraPlayer.displayName = "SnapshotCameraPlayer";

export default SnapshotCameraPlayer;
export { SnapshotStatus };
