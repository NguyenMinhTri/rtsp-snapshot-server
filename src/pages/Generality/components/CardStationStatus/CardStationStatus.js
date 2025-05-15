import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import { Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";

import AddCircleIcon from "@mui/icons-material/AddCircle";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { colorStationStatus } from "../../../../constants";
import { useState } from "react";
import { handleDataStatusByType } from "../StatusPercent/utils/handleDataMainByType";

const dataStatus = [
    { name: "Hoạt động tốt", y: 10, color: colorStationStatus.active },
    // { name: "Vượt quy chuẩn", y: 2, color: colorStationStatus.over },
    { name: "Lỗi thiết bị", y: 1, color: colorStationStatus.error },
    { name: "Hiệu chuẩn", y: 2, color: colorStationStatus.calif },
    { name: "Mết kết nối", y: 1, color: colorStationStatus.off },
];

function CardStationStatus({ title = "Nước thải (NT)", data, dataSensor }) {
    const {
        totalListStatusType,
        totalOff,
        totalActive,
        totalNormal,
        totalError,
        totalCalif,
        totalStation,
        totalOver,
    } = handleDataStatusByType(data, dataSensor, title);
    const chartComponentRef = useRef(null);
    const [templateOptions, setTemplateOptions] = useState(null);

    useEffect(() => {
        let chartObj = chartComponentRef.current?.chart;
        chartObj?.showLoading();
        
            const templateOptions = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: "pie",
                    height: 200,
                },
                title: null,
                tooltip: {
                    pointFormat:
                        "{series.name}: <b>{point.percentage:.1f}%</b>",
                },

                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: "pointer",
                        dataLabels: {
                            enabled: false,
                        },
                        showInLegend: false,
                    },
                },
                series: [
                    {
                        name: "Status",
                        colorByPoint: true,
                        data: [
                            {
                                name: "Hoạt động tốt",
                                y: totalNormal,
                                color: colorStationStatus.active,
                            },
                            {
                                name: "Vượt quy chuẩn",
                                y: totalOver,
                                color: colorStationStatus.over,
                            },
                            {
                                name: "Lỗi thiết bị",
                                y: totalError,
                                color: colorStationStatus.error,
                            },
                            {
                                name: "Hiệu chuẩn",
                                y: totalCalif,
                                color: colorStationStatus.calif,
                            },
                            {
                                name: "Mết kết nối",
                                y: totalOff,
                                color: colorStationStatus.off,
                            },
                        ],
                    },
                ],
            };
            setTemplateOptions(templateOptions);
            setTimeout(() => {
                chartObj?.hideLoading();
            }, 500);
        
    }, [totalNormal, totalError, totalCalif, totalOff, totalOver]);

    return (
        <Paper elevation={3} sx={{ padding: "16px" }}>
            <Stack>
                <Typography sx={{ fontSize: "17px", fontWeight: 600 }}>
                    {title}
                </Typography>
            </Stack>

            <Stack>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={templateOptions}
                    ref={chartComponentRef}
                />
            </Stack>

            <Stack>
                <Stack spacing={1.5}>
                    <Stack
                        direction={"row"}
                        spacing={1.5}
                        alignItems={"center"}
                    >
                        <FiberManualRecordIcon
                            fontSize="10px"
                            style={{ color: "#11cc67" }}
                        />
                        <Typography
                            style={{ color: "#088f81", fontWeight: 500 }}
                        >
                            Đang kết nối: {totalActive}
                        </Typography>
                    </Stack>
                    <Stack spacing={1.5} pl={3}>
                        <Stack
                            direction={"row"}
                            spacing={1.5}
                            alignItems={"center"}
                        >
                            <FiberManualRecordIcon
                                fontSize="10px"
                                style={{ color: colorStationStatus.active }}
                            />
                            <Typography
                                style={{ color: "#088f81", fontWeight: 500 }}
                            >
                                Hoạt động tốt: {totalNormal}
                            </Typography>
                        </Stack>
                        <Stack
                            direction={"row"}
                            spacing={1.5}
                            alignItems={"center"}
                        >
                            <FiberManualRecordIcon
                                fontSize="10px"
                                style={{ color: colorStationStatus.over }}
                            />
                            <Typography
                                style={{ color: "#088f81", fontWeight: 500 }}
                            >
                                Vượt qui chuẩn: {totalOver}
                            </Typography>
                        </Stack>
                        <Stack
                            direction={"row"}
                            spacing={1.5}
                            alignItems={"center"}
                        >
                            <FiberManualRecordIcon
                                fontSize="10px"
                                style={{ color: colorStationStatus.error }}
                            />
                            <Typography
                                style={{ color: "#088f81", fontWeight: 500 }}
                            >
                                Lỗi thiết bị: {totalError}
                            </Typography>
                        </Stack>
                        <Stack
                            direction={"row"}
                            spacing={1.5}
                            alignItems={"center"}
                        >
                            <FiberManualRecordIcon
                                fontSize="10px"
                                style={{ color: colorStationStatus.calif }}
                            />
                            <Typography
                                style={{ color: "#088f81", fontWeight: 500 }}
                            >
                                Hiệu chuẩn: {totalCalif}
                            </Typography>
                        </Stack>
                    </Stack>
                    <Stack
                        direction={"row"}
                        spacing={1.5}
                        alignItems={"center"}
                    >
                        <OfflineBoltIcon
                            fontSize="10px"
                            style={{ color: colorStationStatus.off }}
                        />
                        <Typography
                            style={{ color: "#088f81", fontWeight: 500 }}
                        >
                            Mất kết nối: {totalOff}
                        </Typography>
                    </Stack>
                    <Stack
                        direction={"row"}
                        spacing={1.5}
                        alignItems={"center"}
                    >
                        <AddCircleIcon
                            fontSize="10px"
                            style={{ color: "blue" }}
                        />
                        <Typography
                            style={{ color: "#088f81", fontWeight: 500 }}
                        >
                            Tổng trạm: {totalStation}
                        </Typography>
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    );
}

export default CardStationStatus;
