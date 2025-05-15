import { Paper, Stack, Typography } from "@mui/material";
import React from "react";
import StackBetween from "../../../../components/StackBeetwen";
import { colorStationStatus } from "../../../../constants";
import ProcessItem from "./ProcessItem";

function StatusProcess({
    totalStation,
    totalOff,
    totalActive,
    totalNormal,
    totalError,
    totalCalif,
    totalOver
}) {
    return (
        <Paper sx={{ padding: 2, height: `calc(440px + ${6 * 8}px)` }}>
            <Stack spacing={2}>
                <StackBetween>
                    <Typography variant="h6" style={{ fontWeight: 600 }}>
                        Tổng số trạm
                    </Typography>
                    <Typography variant="h6" style={{ fontWeight: 600 }}>
                        {totalStation}
                    </Typography>
                </StackBetween>

                <ProcessItem
                    name={"Tổng trạm mất kết nối"}
                    color={colorStationStatus.off}
                    totalStatus={totalOff}
                    totalStation={totalStation}
                />
                <ProcessItem
                    name={"Tổng trạm đang kết nối"}
                    color={colorStationStatus.active}
                    totalStatus={totalActive}
                    totalStation={totalStation}
                />

                <Stack spacing={2} pl={3}>
                    <ProcessItem
                        name={"Tổng trạm đang hoạt động tốt"}
                        color={colorStationStatus.active}
                        totalStatus={totalNormal}
                        totalStation={totalStation}
                    />
                    <ProcessItem
                        name={"Tổng trạm có thiết bị lỗi"}
                        color={colorStationStatus.error}
                        totalStatus={totalError}
                        totalStation={totalStation}
                    />
                    <ProcessItem
                        name={"Tổng trạm có thiêt bị hiệu chuẩn"}
                        color={colorStationStatus.calif}
                        totalStatus={totalCalif}
                        totalStation={totalStation}
                    />
                    <ProcessItem
                        name={"Tổng trạm có thiêt bị vượt ngưỡng"}
                        color={colorStationStatus.over}
                        totalStatus={totalOver}
                        totalStation={totalStation}
                    />
                </Stack>
            </Stack>
        </Paper>
    );
}

export default StatusProcess;
