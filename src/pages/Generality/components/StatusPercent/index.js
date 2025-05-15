import { Grid } from "@mui/material";
import React from "react";
import StatusName from "./StatusName";
import StatusProcess from "./StatusProcess";
import { handleDataMainStatus } from "./utils/handleDataMain";

function StatusPercent({ data, dataSensor }) {
    const {
        totalListStatus,
        totalOff,
        totalActive,
        totalNormal,
        totalError,
        totalCalif,
        totalStation,
        totalOver
    } = handleDataMainStatus(data, dataSensor);

    return (
        <Grid container spacing={2}>
            <Grid item  xs={12}  md={6} xl={6} lg={6} sm={12}>
                <StatusProcess
                    totalStation={totalStation}
                    totalOff={totalOff}
                    totalActive={totalActive}
                    totalNormal={totalNormal}
                    totalError={totalError}
                    totalCalif={totalCalif}
                    totalOver={totalOver}
                />
            </Grid>
            <Grid item  xs={12}  md={6} xl={6} lg={6} sm={12}>
                <StatusName totalListStatus={totalListStatus} />
            </Grid>
        </Grid>
    );
}

export default StatusPercent;
