import React from "react";
import { styled } from "@mui/material/styles";

import Box from "@mui/material/Box";
import LinearProgress, {
    linearProgressClasses,
} from "@mui/material/LinearProgress";

export default function ProgressPercent({
    percent = 60,
    color = "orange",
    height = 8,
}) {
    return (
        <Box sx={{ width: "100%" }}>
            <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                    backgroundColor: "#eee",
                    height: height,
                    borderRadius: 5,
                    "& .MuiLinearProgress-bar": {
                        backgroundColor: color,
                        borderRadius: 5,
                    },
                }}
            />
        </Box>
    );
}
