import React from "react";
import MapGL, { Marker } from "@goongmaps/goong-map-react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { colorStationStatus } from "../../../constants";
function PopupInfo({ popupInfo }) {
    const deviceType = popupInfo.sensor.deviceType;
    popupInfo.deviceType = deviceType;
    delete popupInfo.sensor.deviceType;
    delete popupInfo.sensor.id_station;
    delete popupInfo.sensor.station;
    delete popupInfo.sensor.view;
    delete popupInfo.sensor.time;
    delete popupInfo.sensor.status;
    delete popupInfo.sensor.stt;
    const sensorData = Object.keys(popupInfo.sensor);

    const styleStateValue = (value) => {
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

    const openInNewTab = (url) => {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (newWindow) newWindow.opener = null;
    };

    const sensorValue = (valueSensor) => valueSensor.split("*")[0];
    const sensorUnit = (valueSensor) =>
        valueSensor.split("*")[valueSensor.split("*").length - 1];
    const sensorColor = (valueSensor) => {
        let statusStation = valueSensor.split("*")[2];
        let stateSensor = valueSensor.split("*")[1];

        const color = statusStation === "STATION_OFF" ? colorStationStatus.off
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

    return (
        <Box style={{width: 400}} >
            <Stack sx={{ mb: 1 }}>
                <Typography
                    style={{ textTransform: "capitalize", fontWeight: 600, marginRight:'20px' }}
                >
                    {popupInfo.name} ({popupInfo.lastTime})
                </Typography>
                
            </Stack>
            <TableContainer className="my_table" sx={{height : 250}}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">#</TableCell>
                            <TableCell align="center">Thông số</TableCell>
                            <TableCell align="center">Giá trị</TableCell>
                            <TableCell align="center">Đơn vị</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        { sensorData.map((item, index) => (
                                  <TableRow
                                      key={index}
                                    
                                      // sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                  >
                                      <TableCell  align="center" component="th" scope="row">
                                          {index + 1}
                                      </TableCell>
                                      <TableCell align="center">
                                          {item}
                                      </TableCell>
                                      <TableCell align="center"   sx={{backgroundColor: sensorColor(popupInfo.sensor[item]) , color : "white", fontWeight: 600}}>
                                          {sensorValue(popupInfo.sensor[item])}
                                      </TableCell>
                                      <TableCell align="center">
                                          {sensorUnit(popupInfo.sensor[item])}
                                      </TableCell>
                                  </TableRow>
                              ))
                            }
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography
                    component={"div"}
                    style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        textAlign: "right",
                        color: "red",
                        fontStyle: "italic",
                        marginTop : '5px',
                        cursor: 'pointer'
                    }}
                    onClick={() =>
                        openInNewTab(
                            `${window.location.origin}/home?deviceId=${popupInfo.id}`
                        )
                    }
                >
                    Xem thêm >
                </Typography>
        </Box>
    );
}

export default PopupInfo;
