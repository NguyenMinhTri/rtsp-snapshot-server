import { styled } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

const globalStyle = `
@keyframes logoFloat {
    0%, 100% {
        transform: translateY(0) scale(1);
    }
    50% {
        transform: translateY(-8px) scale(1.02);
    }
}
`;

// loader style
const LoaderWrapper = styled("div")(({ theme }) => ({
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
}));

const Loader = () => (
    <>
        <style>{globalStyle}</style>
        <LoaderWrapper>
            <Stack direction="column" spacing={2} alignItems="center">
                <Box
                    component="img"
                    src="/image/navis.png"
                    alt="Loading"
                    sx={{
                        width: 60,
                        height: 60,
                        objectFit: "contain",
                        borderRadius: "12px",
                        animation: "logoFloat 1.5s ease-in-out infinite",
                        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
                    }}
                />
                <Typography
                    variant="body2"
                    sx={{
                        color: "#666",
                        fontWeight: 500,
                    }}
                >
                    Đang tải...
                </Typography>
            </Stack>
        </LoaderWrapper>
    </>
);

export default Loader;
