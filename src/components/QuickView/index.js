import React from 'react';
import VideocamIcon from '@mui/icons-material/Videocam';
import PinDropIcon from '@mui/icons-material/PinDrop';
import BarChartIcon from '@mui/icons-material/BarChart';
export default function QuickView({ deviceId }) {
    const openVideoLink = () => {
        // Mở link video khi click vào icon
        window.open(`${window.location.origin}/camera?deviceId=${deviceId}`, '_blank');
    };

    const openMapLink = () => {
        // Mở link bản đồ khi click vào icon
        window.open(`${window.location.origin}/map?deviceId=${deviceId}`, '_blank');
    };

    const openChartLink = () => {
        // Mở link biểu đồ khi click vào icon
        window.open(`${window.location.origin}/home?deviceId=${deviceId}`, '_blank');
    };

    return (
        <div>
            <a href="#" onClick={openVideoLink}>
                <VideocamIcon style={{ color: "#1c84c6" }}  sx={{ fontSize: 20 }}/>
            </a>
            <a href="#" onClick={openMapLink}>
                <PinDropIcon  style={{ color: "#ed5565" }} sx={{ fontSize: 20 }}/>
            </a>
            <a href="#" onClick={openChartLink}>
                <BarChartIcon  style={{ color: "#23c6c8" }} sx={{ fontSize: 20 }}/>
            </a>
        </div>
    );
}