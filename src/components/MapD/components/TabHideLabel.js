import { Box, Checkbox, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { labelMarkChangeAction, labelMarkSelector } from "../../../redux/reducer/labelMarkMapSlice";

function TabHideLabel() {
    const hideLabel = useSelector(labelMarkSelector);
    const dispatch = useDispatch()

    const handleChange = (event) => {
        dispatch(labelMarkChangeAction(event.target.checked))
        
    };

    return (
        <Paper
            style={{
                position: "absolute",
                right: "50px",
                top: "8px",
                display: "flex",
                paddingRight: "20px",
            }}
        >
            <Stack direction={"row"} alignItems={"center"}>
                <Checkbox
                    checked={hideLabel}
                    size="small"
                    onChange={handleChange}
                />
                <Typography>Hiện thị nhãn</Typography>
            </Stack>
        </Paper>
    );
}

export default TabHideLabel;
