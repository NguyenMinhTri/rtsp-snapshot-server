import { colorStationStatus } from "../constants";

export const styleStateValue = (value) => {
    let stateSensor = value.split("*")[1];
    let statusStation = value.split("*")[2];

    return {
        padding: "5px ",
        borderRadius: "5px",
        color: "white",
        fontSize: "14px",
        backgroundColor:
            statusStation === "STATION_OFF"
                ? colorStationStatus.off
                : stateSensor === "1"
                ? colorStationStatus.calif
                : stateSensor === "2"
                ? colorStationStatus.error
                : stateSensor === "0"
                ? colorStationStatus.active
                : stateSensor === "5"
                ? colorStationStatus.over
                : colorStationStatus.off,
    };
};

export const colorByStatus = (stateSensor) => {

    const color =  statusStation === "STATION_OFF"
        ? colorStationStatus.off
        : stateSensor === "1"
        ? colorStationStatus.calif
        : stateSensor === "2"
        ? colorStationStatus.error
        : stateSensor === "0"
        ? colorStationStatus.active
        : stateSensor === "5"
        ? colorStationStatus.over
        : colorStationStatus.off
    return color
}