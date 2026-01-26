import { Box, Tab, Tabs } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChartV2 from "./MyChart/ChartV2";
import { SENSOR_OF_DEVICE_KEY } from "../constants";
import { chooseSensorAction } from "../redux/reducer/chooseSensorChart";
import { listSensorChartSelector, listSensorChartAction } from "../redux/reducer/listSensorChart";

function ChartTab({ startDate, endDate, deviceId, inputLstSensor, isLiveMode, dataRealTime }) {
    const [value, setValue] = React.useState("1");
    const dispatch = useDispatch()
    let listSensorChart = useSelector(listSensorChartSelector)
    const handleChange = (event, newValue) => {
        setValue(newValue);
        dispatch(chooseSensorAction(newValue))
    };
    const [listSensor, setListSensor] = useState([])
    let listSensorOfDevice = JSON.parse(localStorage.getItem(SENSOR_OF_DEVICE_KEY))

    useEffect(() => {
        // Clean up when device changes - reset all chart state
        setListSensor([]);
        setValue("1"); // Reset to "Tất cả" tab
        dispatch(chooseSensorAction("1")); // Reset Redux sensor choice
        dispatch(listSensorChartAction([])); // Clear Redux sensor list for tabs
    }, [deviceId, dispatch])
    useEffect(() => {
        //check nếu khác nhau mới render lại
        if (typeof inputLstSensor !== "undefined" && typeof inputLstSensor.length !== "undefined" && !compareElements(inputLstSensor, listSensor))
            setListSensor(inputLstSensor);
        else if (typeof inputLstSensor === "undefined" || typeof inputLstSensor.length === "undefined") {
            setListSensor([]);
        }

    }, [startDate, endDate, deviceId, inputLstSensor])
    function compareElements(mang1, mang2) {
        if (mang1.length !== mang2.length) return false;
        for (let i = 0; i < mang1.length; i++) {
            if (mang2.includes(mang1[i])) {
                return true; // Nếu có phần tử giống nhau, trả về true
            }
        }
        return false; // Nếu không có phần tử nào giống nhau, trả về false
    }

    // Modern tab styling
    const tabSx = {
        minHeight: 36,
        height: 36,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.8rem',
        borderRadius: '8px',
        mx: 0.3,
        px: 1.5,
        minWidth: 'auto',
        color: '#666',
        transition: 'all 0.2s ease',
        '&:hover': {
            bgcolor: 'rgba(25, 118, 210, 0.08)',
            color: '#1976d2',
        },
        '&.Mui-selected': {
            bgcolor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.35)',
        },
    };

    return (
        <Box>
            {listSensor && listSensor.length > 0 ? <>
                <Box
                    sx={{
                        bgcolor: '#f5f7fa',
                        borderBottom: '1px solid #e0e0e0',
                        px: 1,
                        py: 0.5,
                    }}
                >
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="sensor chart tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{ style: { display: 'none' } }}
                        sx={{
                            minHeight: 44,
                            '& .MuiTabs-flexContainer': {
                                gap: 0.5,
                            },
                            '& .MuiTabs-scrollButtons': {
                                width: 28,
                                '&.Mui-disabled': { opacity: 0.3 },
                            },
                        }}
                    >
                        <Tab
                            label="Tất cả"
                            value="1"
                            sx={tabSx}
                        />
                        {listSensorChart && listSensorChart.length > 0 ?
                            // Sort chart tabs to match sensor card order (inputLstSensor)
                            [...listSensorChart].sort((a, b) => {
                                const indexA = listSensor.indexOf(a);
                                const indexB = listSensor.indexOf(b);
                                // If not found in listSensor, put at end
                                if (indexA === -1 && indexB === -1) return 0;
                                if (indexA === -1) return 1;
                                if (indexB === -1) return -1;
                                return indexA - indexB;
                            }).map((v) => (
                                <Tab
                                    key={v}
                                    label={v}
                                    value={v}
                                    sx={tabSx}
                                />
                            )) : null}

                    </Tabs>
                </Box>

                <ChartV2
                    listSensor={listSensor}
                    deviceId={deviceId}
                    startDate={startDate}
                    endDate={endDate}
                    isLiveMode={isLiveMode}
                    dataRealTime={dataRealTime}
                /></> : <></>}

        </Box>
    );
}

export default ChartTab;
