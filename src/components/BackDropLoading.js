import { Backdrop, CircularProgress, Typography } from "@mui/material";
import React from "react";

function BackDropLoading({text = "Vui lòng chờ"}) {
    return (
        <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            style={{display: 'flex',flexDirection: 'column'}}
            open={true}
        >
            <Typography component={"div"} sx={{mb : 2}}>{text}</Typography>
            <CircularProgress color="inherit" />
        </Backdrop>
    );
}

export default BackDropLoading;
