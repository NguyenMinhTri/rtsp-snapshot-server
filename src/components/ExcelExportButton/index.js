import { memo, useState } from 'react';
import { Button, Box } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const pulseKeyframes = `
@keyframes excelPulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(0.95);
    }
}
`;

function ExcelExportButton({ onClick, disabled, fullWidth = true, className = "btn_export-excel" }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleClick = async (e) => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            await onClick(e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <style>{pulseKeyframes}</style>
            <Button
                variant="contained"
                className={className}
                style={{
                    backgroundColor: isExporting ? "#f5f5f5" : "rgb(17, 141, 79)",
                    color: isExporting ? "#666" : "white",
                    minHeight: 40,
                    position: "relative",
                    overflow: "hidden",
                }}
                fullWidth={fullWidth}
                onClick={handleClick}
                disabled={disabled || isExporting}
                startIcon={
                    isExporting ? null : <FileDownloadIcon />
                }
            >
                {isExporting ? (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Box
                            component="img"
                            src="/image/navis.png"
                            alt="Loading"
                            sx={{
                                width: 24,
                                height: 24,
                                objectFit: "contain",
                                borderRadius: "4px",
                                animation: "excelPulse 1s ease-in-out infinite",
                            }}
                        />
                        <span>Đang xuất...</span>
                    </Box>
                ) : (
                    "Export Excel"
                )}
            </Button>
        </>
    );
}

export default memo(ExcelExportButton);
