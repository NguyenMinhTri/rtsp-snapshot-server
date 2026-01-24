/**
 * GoogleMapSimple - Simple Google Maps component for HomePage
 * Shows a marker at the station location with full height support
 */
import React, { memo, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Box, Typography, CircularProgress } from "@mui/material";

// Google Maps API Key - should be in .env file
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyBx-8T00qL3KgfD6RqRTxFOCcSZG8Myhjo";

// Map container style - full height
const containerStyle = {
    width: "100%",
    height: "100%",
};

// Default map options
const defaultOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: "cooperative",
};

const GoogleMapSimple = memo(({
    latitude,
    longitude,
    stationName = "",
    height = "100%",
    zoom = 15,
}) => {
    const [infoOpen, setInfoOpen] = useState(true);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    const center = {
        lat: latitude || 10.8231,
        lng: longitude || 106.6297,
    };

    const onMarkerClick = useCallback(() => {
        setInfoOpen(true);
    }, []);

    const onInfoClose = useCallback(() => {
        setInfoOpen(false);
    }, []);

    // Loading state
    if (!isLoaded) {
        return (
            <Box
                sx={{
                    height: height,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                }}
            >
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1, color: "text.secondary" }}>
                    Đang tải bản đồ...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (loadError) {
        return (
            <Box
                sx={{
                    height: height,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffebee",
                }}
            >
                <Typography variant="body2" color="error">
                    Không thể tải Google Maps
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: height, width: "100%" }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={zoom}
                options={defaultOptions}
            >
                {/* Station Marker */}
                <Marker
                    position={center}
                    onClick={onMarkerClick}
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    }}
                />

                {/* Info Window */}
                {infoOpen && stationName && (
                    <InfoWindow
                        position={center}
                        onCloseClick={onInfoClose}
                    >
                        <Box sx={{ p: 0.5, minWidth: 120 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                📍 {stationName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                            </Typography>
                        </Box>
                    </InfoWindow>
                )}
            </GoogleMap>
        </Box>
    );
});

GoogleMapSimple.displayName = "GoogleMapSimple";

export default GoogleMapSimple;
