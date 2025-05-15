import { Box, Tab, Tabs } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChartV2 from "./MyChart/ChartV2";
import { SENSOR_OF_DEVICE_KEY } from "../constants";
import { chooseSensorAction } from "../redux/reducer/chooseSensorChart";
import { listSensorChartSelector } from "../redux/reducer/listSensorChart";

function ChartTab({startDate, endDate, deviceId, inputLstSensor}) {
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
        //check nếu khác nhau mới render lại

         setListSensor([]);
       
    }, [deviceId ])
    useEffect(() => {
        //check nếu khác nhau mới render lại
        if(typeof inputLstSensor !== "undefined" && typeof inputLstSensor.length !== "undefined" && !compareElements(inputLstSensor,listSensor))
         setListSensor(inputLstSensor);
        else if(typeof inputLstSensor === "undefined" || typeof inputLstSensor.length === "undefined" ){
            setListSensor([]);
        }
       
    }, [startDate,endDate,deviceId, inputLstSensor])
    function compareElements(mang1, mang2) {
        if(mang1.length !== mang2.length) return false;
        for (let i = 0; i < mang1.length; i++) {
          if (mang2.includes(mang1[i])) {
            return true; // Nếu có phần tử giống nhau, trả về true
          }
        }
        return false; // Nếu không có phần tử nào giống nhau, trả về false
      }

    return (
        <Box >
            {listSensor && listSensor.length > 0  ? <><Box
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    backgroundColor: "white",
                }}
            >
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label="Tất cả"
                        value="1"
                        style={
                            value == 1
                                ? { backgroundColor: "#eee", padding: "5px" }
                                : {fontWeight: "bold"}
                        }
                    />
                    {listSensorChart && listSensorChart.length>0 ? [...listSensorChart].sort(compareElements).map((v) => (
                        <Tab
                            label={v}
                            value={v}
                            style={
                                value == v
                                    ? {
                                          backgroundColor: "#eee",
                                          padding: "5px",
                                            fontWeight: "bold"
                                      }
                                    : {fontWeight: "bold"}
                            }
                        />
                    )) : null}

                </Tabs>
            </Box>

            <ChartV2
                listSensor={listSensor}
                deviceId={deviceId}
                startDate={startDate}
                endDate={endDate}
            /></> : <></>}
            
        </Box>
    );
}

export default ChartTab;
