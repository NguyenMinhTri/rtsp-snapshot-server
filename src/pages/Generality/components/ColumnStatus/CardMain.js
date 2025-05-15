import { Paper, Stack, Typography } from "@mui/material";
import React from "react";
import CardData from "./CardData";
import { colorStationStatus } from "../../../../constants";
import { numberComma } from "../../../../utils/numberComma";

function CardMain({ title = "Tháng này", data }) {
    const totalData = data?.active + data?.calif + data?.error + data?.off || 0;

    const calculatePercent = (number, totalStation = totalData) => {
        if((number / totalStation) * 100) {

            return ((number / totalStation) * 100).toFixed(4);
        }else {
            return 0
        }
    };


    return (
        <Paper sx={{ p: 2.5 }} elevation={3}>
            <Stack pb={3}>
                <Typography style={{ fontWeight: 600, fontSize: "18px" }}>
                    {title}
                </Typography>
                <Typography variant="h4" py={1} style={{ fontWeight: 800 }}>
                    {numberComma(totalData)}
                </Typography>
                <Typography style={{ fontSize: "14px" }}>
                    Là tổng dữ liệu thu thập được trong tháng
                </Typography>
            </Stack>
            <Stack spacing={0.7}>
                <CardData
                    title={"Hoạt động tốt"}
                    data={data?.active || 0}
                    percent={calculatePercent(data?.active || 0)}
                />
                <CardData
                    title={"Lỗi thiết bị"}
                    data={data?.error || 0}
                    percent={calculatePercent(data?.error || 0)}
                />
                <CardData
                    title={"Hiệu chuẩn"}
                    data={data?.calif || 0 }
                    percent={calculatePercent(data?.calif || 0)}
                />
                <CardData
                    title={"Mất kết nói"}
                    data={data?.off || 0}
                    percent={calculatePercent(data?.off || 0)}
                />
            </Stack>
        </Paper>
    );
}

export default CardMain;
