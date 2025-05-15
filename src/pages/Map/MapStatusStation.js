import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { colorStationStatus } from "../../constants";
import { locationChangeAction } from "../../redux/reducer/locationStationSlice";
import CardStatus from "../Generality/components//StatusPercent/CardStatus";
import CardMapStatus from "./components/CardMapStatus";
import {
    filterMarkChangeAction,
    filterMarkSelector,
} from "../../redux/reducer/filterMarkMapSlice";
import { handleDataMainStatus } from "../Generality/components/StatusPercent/utils/handleDataMain";
import AccordionListStation from "./components/AccordionListStation";

function MapStatusStation({ dataCoordinates, dataArray, dataSensor }) {
    const {
        totalListStatus,
        totalOff,
        totalActive,
        totalNormal,
        totalError,
        totalCalif,
        totalStation,
        totalOver,
    } = handleDataMainStatus(dataArray, dataSensor);

    const dispatch = useDispatch();
    const handleClickCardStatus = (name) => {
        for (let item of dataCoordinates) {
            if (item.name === name) {
            console.log({item})

                dispatch(
                    locationChangeAction({
                        longitude: item.longitude,
                        latitude: item.latitude,
                        id : item.id
                    })
                );
            }
        }
    };

    const handleChangeFilterMark = (type) => {
        dispatch(filterMarkChangeAction(+type));
    };

    const filterMark = useSelector(filterMarkSelector);

    useEffect(() => {
        if (filterMark != null) {
        }
    }, [filterMark]);

    const heightSideBarMap = `calc(100vh - 65px)`;
    const handleSplitStationByType = (totalListStatus) => {
        const splitStationByType = new Map();
        totalListStatus.map((v) => {
            const { deviceType, status, station } = v;
            if (!splitStationByType.has(deviceType)) {
                splitStationByType.set(deviceType, {
                    deviceType,
                    stationList: [],
                });
            }

            splitStationByType.get(deviceType).stationList.push({
                station,
                status,
            });
        });

        return Array.from(splitStationByType.values());
    };

    const splitStationByType = useCallback(
        handleSplitStationByType(totalListStatus),
        [totalListStatus]
    );

    return (
        <Box
            sx={{
                height: heightSideBarMap,
                borderLeft: "1px solid #ccc",
                padding: "5px",
                overflowY: "auto",
            }}
        >
            <Paper
                sx={{ mb: 1, cursor: "pointer" }}
                elevation={1}
                component={"div"}
                onClick={() => handleChangeFilterMark(100)}
            >
                <Typography p={1} style={{ fontWeight: "600" }}>
                    XEM TẤT CẢ TRẠNG THÁI TRẠM
                </Typography>
            </Paper>

            <Grid container spacing={1}>
                <Grid item xs={12} md={12} xl={6} lg={6} sm={12}>
                    <CardMapStatus
                        color={colorStationStatus.active}
                        name={"Hoạt dộng tốt"}
                        count={totalNormal}
                        onClick={() => handleChangeFilterMark(0)}
                    />
                </Grid>
                <Grid item xs={12} md={12} xl={6} lg={6} sm={12}>
                    <CardMapStatus
                        color={colorStationStatus.off}
                        name={"Mất kết nối"}
                        count={totalOff}
                        onClick={() => handleChangeFilterMark(4)}
                    />
                </Grid>
                <Grid item xs={12} md={12} xl={6} lg={6} sm={12}>
                    <CardMapStatus
                        color={colorStationStatus.calif}
                        name="Hiệu chuẩn"
                        count={totalCalif}
                        onClick={() => handleChangeFilterMark(1)}
                    />
                </Grid>
                <Grid item xs={12} md={12} xl={6} lg={6} sm={12}>
                    <CardMapStatus
                        color={colorStationStatus.error}
                        name="Lỗi thiêt bị"
                        count={totalError}
                        onClick={() => handleChangeFilterMark(2)}
                    />
                </Grid>
                <Grid item xs={12} md={12} xl={6} lg={6} sm={12}>
                    <CardMapStatus
                        color={colorStationStatus.over}
                        name="Vượt ngưỡng"
                        count={totalOver}
                        onClick={() => handleChangeFilterMark(5)}
                    />
                </Grid>
            </Grid>

            <Paper sx={{ mt: 1.5 }} elevation={1}>
                <Typography p={1} style={{ fontWeight: "600" }}>
                    TẤT CẢ TRẠM ({totalStation})
                </Typography>
            </Paper>

            <Box>
                <Stack spacing={0.3} sx={{ mt: 1 }}>
                    {splitStationByType.map((v, index) => (
                        <AccordionListStation
                            deviceType={v.deviceType}
                            listStation={v.stationList}
                            expand={`pn${index}`}
                            handleClickCardStatus={handleClickCardStatus}
                        />
                    ))}
                </Stack>
            </Box>
        </Box>
    );
}

export default MapStatusStation;
// [
//    { type : "IOT"
//     device : ["1", "2"]}

// ]
