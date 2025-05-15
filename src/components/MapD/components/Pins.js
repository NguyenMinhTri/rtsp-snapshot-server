import * as React from "react";
import { Marker, Popup } from "@goongmaps/goong-map-react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useState, useEffect } from "react";
import { colorStationStatus } from "../../../constants";
import StationInfo from "./StationInfo";
import { Box, Paper, Typography } from "@mui/material";
import { labelMarkSelector } from "../../../redux/reducer/labelMarkMapSlice";
import { useSelector } from "react-redux";
const SIZE = 20;

// Important for perf: the markers never change, avoid rerender when the map viewport changes
function Pins({ category = 100, data, onClick }) {
    const [currentDomain, setCurrentDomain] = useState("");

    useEffect(() => {
        setCurrentDomain(window.location.href);
    }, []);
    const handleConfirm = (v) => {
        v.isHide = false;
        onClick(v);
    };

    const filter = {
        0: "active",
        1: "calif",
        2: "error",
        4: "off",
        5: "over",
        100: "all",
    };

    const hideLabel = useSelector(labelMarkSelector);

    return data.map((city, index) => {
        const { state } = city;
        let styleMark =
            state === "error"
                ? colorStationStatus.error
                : state === "active"
                ? colorStationStatus.active
                : state === "calif"
                ? colorStationStatus.calif
                : state === "off"
                ? colorStationStatus.off
                : state === "over"
                ? colorStationStatus.over
                : colorStationStatus.off;
        let styleMarkTPN =
            state === "error"
                ? "/image/tpn-err.png"
                : state === "active"
                ? "/image/tpn-good.png"
                : state === "calif"
                ? colorStationStatus.calif
                : state === "off"
                ? "/image/tpn-off.png"
                : "/image/tpn-err.png";

        let check =
            filter[category] == "all"
                ? city.longitude && city.latitude
                : city.longitude && city.latitude && state == filter[category];
        if (check) {
            return (
                <Marker
                    key={`marker-${index}`}
                    longitude={city?.longitude}
                    latitude={city?.latitude}
                >
                    {hideLabel && (
                        <Paper
                            sx={{
                                p: 0.5,
                                width: 130,
                                cursor: "pointer",
                                marginLeft: "10px",
                                position: "absolute",
                                top: "-15px",
                            }}
                        >
                            <Typography
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                }}
                            >
                                {city.name}
                            </Typography>
                        </Paper>
                    )}

                    {!currentDomain.includes("test") ? (
                        <>
                            <LocationOnIcon
                                onClick={() => handleConfirm(city)}
                                style={{
                                    cursor: "pointer",
                                    fill: styleMark,
                                    stroke: "none",
                                    transform: `translate(${
                                        -SIZE / 2
                                    }px,${-SIZE}px)`,
                                }}
                            />
                        </>
                    ) 
                    : (
                        <img
                            onClick={() => handleConfirm(city)}
                            src={
                                currentDomain.includes("namngonviet")
                                    ? "/image/nnv.png"
                                    : currentDomain.includes("iotdaiviet")
                                    ? "/image/logo_cpn.png"
                                    : styleMarkTPN
                            }
                            alt=""
                            width={
                                currentDomain.includes("iotdaiviet") ? 200 : 50
                            }
                        />
                    )}
                </Marker>
            );
        }
    });
}

export default React.memo(Pins);
