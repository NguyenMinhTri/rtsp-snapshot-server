import { Paper, Stack, Typography } from "@mui/material";
import React from "react";
import StackBetween from "../../../../components/StackBeetwen";
import { calculatePercent } from "./utils/calculatePercent";
import { colorStationStatus } from "../../../../constants";
import ProgressPercent from "../../../../components/ProgressPercent";

const ProcessItem = ({ name, totalStatus, color, totalStation }) => {
    return (
        <Stack>
            <StackBetween>
                <Typography>{name}</Typography>
                <Typography>
                    {totalStatus} ({calculatePercent(totalStatus, totalStation)}{" "}
                    %)
                </Typography>
            </StackBetween>
            <ProgressPercent
                color={color}
                percent={calculatePercent(totalStatus, totalStation)}
            />
        </Stack>
    );
};

export default ProcessItem;
