import CameraChild from "../../Camera/CameraChild";
import React, { useState } from "react";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import {
    Box,
    Button,
    CardMedia,
    Dialog,
    DialogActions,
    DialogContent,
    Grid,
    IconButton,
    Tooltip,
} from "@mui/material";

function CameraDialog({ cameraList }) {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <>
            <Tooltip
                title="Full Screen"
                style={{
                    position: "absolute",
                    border: "1px solid black",
                    right: 10,
                    cursor: "pointer",
                    borderRadius: "5px",
                    padding: "1px",
                    zIndex : 9 ,
                }}
            >
                <IconButton aria-label="Full Screen" onClick={handleClickOpen}>
                    <OpenInFullIcon />
                </IconButton>
            </Tooltip>

            <CameraChild cameraList={cameraList}></CameraChild>
            <Dialog
                fullWidth={true}
                maxWidth={"xl"}
                open={open}
                onClose={handleClose}
            >
               <CameraChild cameraList={cameraList} resDialog={true}></CameraChild>

                <DialogActions>
                    <Button variant="contained" onClick={handleClose}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default CameraDialog;
