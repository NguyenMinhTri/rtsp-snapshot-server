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
function IFrameExcelCheckList({ valueSelectId }) {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <>
            <Box    style={{
                        position: "relative",
                        
                    }}>
      
                <iframe
                    className="pid2"
                    src="https://docs.google.com/spreadsheets/d/1dKFjIrD4pPdA8BgLOaDNBWlXOFIEIel0_7n1zokufbs/edit?usp=sharing&amp;rm=minimal&amp;single=false&amp"
                ></iframe>
          <Tooltip
                    title="Full Screen"
                    style={{
                        position: "absolute",
                        border: "1px solid black",
                        right: 0,
                        top: 0,
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
                <Dialog fullWidth={true} maxWidth={"xl"} open={open} onClose={handleClose}>
                    <iframe
                        style={{ height: "100vh" }}
                        src="https://docs.google.com/spreadsheets/d/1dKFjIrD4pPdA8BgLOaDNBWlXOFIEIel0_7n1zokufbs/edit?usp=sharing&amp;single=false&amp"
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

export default IFrameExcelCheckList;
