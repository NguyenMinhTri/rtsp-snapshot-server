import { Backdrop, Box, Typography, Stack } from "@mui/material";
import React from "react";

const globalStyle = `
@keyframes logoFloat {
    0%, 100% {
        transform: translateY(0) scale(1);
    }
    50% {
        transform: translateY(-10px) scale(1.05);
    }
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;

function BackDropLoading({ text = "Vui lòng chờ..." }) {
    return (
        <>
            <style>{globalStyle}</style>
            <Backdrop
                sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backdropFilter: "blur(6px)",
                    background: "linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))",
                }}
                open={true}
            >
                <Stack
                    direction="column"
                    spacing={2}
                    alignItems="center"
                    sx={{
                        position: "absolute",
                        top: "40%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        animation: "fadeIn 0.3s ease",
                    }}
                >
                    <Box
                        component="img"
                        src="/image/navis.png"
                        alt="Loading"
                        sx={{
                            width: 80,
                            height: 80,
                            objectFit: "contain",
                            borderRadius: "16px",
                            animation: "logoFloat 2s ease-in-out infinite",
                            filter: "drop-shadow(0 0 20px rgba(255,255,255,0.4))",
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            textShadow: "0 0 10px rgba(255,255,255,0.5)",
                        }}
                    >
                        {text}
                    </Typography>
                </Stack>
            </Backdrop>
        </>
    );
}

export default BackDropLoading;
