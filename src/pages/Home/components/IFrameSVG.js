import React, { useState } from "react";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Tooltip,
    Fade,
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
            <Box
                sx={{
                    position: "relative",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#fff",
                    border: "1px solid rgba(79, 195, 247, 0.3)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                }}
            >
                {/* Fullscreen button - floating */}
                <Tooltip title="Xem toàn màn hình" arrow placement="left">
                    <IconButton
                        onClick={handleClickOpen}
                        size="small"
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            zIndex: 10,
                            backgroundColor: "rgba(79, 195, 247, 0.9)",
                            color: "#fff",
                            padding: "6px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                backgroundColor: "#29B6F6",
                                transform: "scale(1.1)",
                            },
                        }}
                    >
                        <OpenInFullIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>

                {/* IFrame content */}
                <iframe
                    className="pid"
                    src={url}
                    style={{
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#fff",
                        display: "block",
                    }}
                />
            </Box>

            {/* Fullscreen Dialog */}
            <Dialog
                fullWidth
                maxWidth="xl"
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 300 }}
                PaperProps={{
                    sx: {
                        borderRadius: "12px",
                        overflow: "hidden",
                    }
                }}
            >
                {/* Dialog Content */}
                <DialogContent sx={{ padding: 0, backgroundColor: "#f5f5f5" }}>
                    <iframe
                        style={{
                            height: "calc(100vh - 80px)",
                            width: "100%",
                            border: "none",
                        }}
                        src={url}
                    />
                </DialogContent>

                <DialogActions
                    sx={{
                        padding: "8px 16px",
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                    }}
                >
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleClose}
                        startIcon={<CloseFullscreenIcon fontSize="small" />}
                        sx={{
                            background: "linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%)",
                            borderRadius: "6px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "13px",
                            boxShadow: "0 2px 8px rgba(79, 195, 247, 0.3)",
                        }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default IFrameSVG;
