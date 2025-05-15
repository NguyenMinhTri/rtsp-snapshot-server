import { Grid, Tooltip } from "@mui/material";
import React from "react";
import CardStationStatus from "./CardStationStatus";
import { handleDataStatusByType } from "../StatusPercent/utils/handleDataMainByType";

function CardStatus({ totalDeviceType, data, dataSensor }) {
    const handleClickCartChart = (v) => {
        window.open(`${window.location.origin}/monitor?deviceType=${v}`, '_blank');
    }
    return (
        <Grid container spacing={2}>
            {totalDeviceType &&
                totalDeviceType.length > 0 &&
                totalDeviceType.map((v, index) => (
                    <Tooltip title={`Nhấp để giám sát ${v}`} placement="top" >
                        <Grid
                        component={"div"}
                        onClick={() => handleClickCartChart(v)}
                        style={{cursor : "pointer"}}
                        key={index}
                        item
                        xs={12}
                        md={4}
                        xl={2.4}
                        lg={2.4}
                        sm={6}
                    
                    >
                        <CardStationStatus
                            title={v}
                            data={data}
                            dataSensor={dataSensor}
                        />
                    </Grid>
                    </Tooltip>
                    
                ))}
        </Grid>
    );
}

export default CardStatus;
