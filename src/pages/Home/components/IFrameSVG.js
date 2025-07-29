import React, { useState } from "react";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Tooltip,
} from "@mui/material";
import "../Home.scss";
function IFrameSVG({ url }) {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <>
            <Box>
                <Tooltip
                    title="Full Screen"
                    style={{
                        position: "absolute",
                        border: "1px solid black",
                        right: 10,
                        top: 10,
                        cursor: "pointer",
                        borderRadius: "5px",
                        padding: "1px",
                    }}
                >
                    <IconButton
                        aria-label="Full Screen"
                        onClick={handleClickOpen}
                    >
                        <OpenInFullIcon />
                    </IconButton>
                </Tooltip>
                <iframe
                    className="pid"
                    src={url}
                ></iframe>

                <Dialog fullWidth={true} maxWidth={"xl"} open={open} onClose={handleClose}>
                    <iframe
                        style={{ height: "100vh" }}
                        src={url}
                    ></iframe>

                    <DialogActions>
                        <Button variant="contained" onClick={handleClose}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
}

export default IFrameSVG;
