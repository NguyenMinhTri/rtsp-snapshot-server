import CameraChild from "../../Camera/CameraChild";
import React from "react";
import { Box } from "@mui/material";

/**
 * CameraDialog - Simple wrapper for CameraChild
 * Fullscreen functionality is now handled by CameraSection in layoutComponents.js
 */
function CameraDialog({ cameraList, resDialog = false }) {
    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <CameraChild cameraList={cameraList} resDialog={resDialog} />
        </Box>
    );
}

export default CameraDialog;
