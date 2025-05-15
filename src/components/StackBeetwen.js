import { Stack } from "@mui/material";
import React from "react";

function StackBetween({ children, spacing }) {
    return (
        <Stack
            direction="row"
            justifyContent={"space-between"}
            alignItems={"center"}
            spacing={spacing}
        >
            {children}
        </Stack>
    );
}

export default StackBetween;
