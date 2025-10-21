import React from "react";
import SensorsIcon from "@mui/icons-material/Sensors";
import SensorsOffIcon from "@mui/icons-material/SensorsOff";
import "./CardValueSensor.scss";
import MyChart from "../MyChart/SubChart";
import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
export default function CardValueSensor({
    label,
    value,
    unit,
    state,
    fillColor = "#0E5E6F",
    alarmSetting,
    deviceId,
    lastTime,
}) {
    let chartRef = useRef(null);
    let [chartInstance, setChartInstance] = useState(null);
    useEffect(() => {

        
        if (chartInstance !== null) {
            while (chartInstance.data.labels.length) {
                chartInstance.data.labels.shift();
                chartInstance.data.datasets[0].label = label;
                chartInstance.data.datasets[0].data.shift();
          
            }
            setTimeout(function () {
               
                while (chartInstance.data.labels.length) {
                    chartInstance.data.labels.shift();
                    chartInstance.data.datasets[0].label = label;
                    chartInstance.data.datasets[0].data.shift();
                
                }
            }, 2000);
        }
    }, [deviceId, label]);
    useEffect(() => {
        debugger;
        if(typeof deviceId === "undefined"||( !deviceId.includes("_") && !deviceId.includes("HCM"))){
                    debugger;
            let chartConfig = {
                type: "line",
                data: {
                  
                    datasets: [
                        {
                            label: label,
                            data: [],
                            borderColor: "white",
                            tension: 0.1,
                            fill: false,
                        },
                    ],
                },
    
                options: {
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            color: "white", // set the color of the y-axis to red
                            ticks: {
                                color: "white", // set the color of the tick marks to blue
                            },
                            beginAtZero: true,
                        },
                    },
                },
            };
    
            let newChartInstance = new Chart(chartRef.current, chartConfig);
            setChartInstance(newChartInstance);
        
            return () => {
                newChartInstance.destroy();
            };
        }

    
    }, []);
    useEffect(() => {
        if (!chartInstance) return;

        let time = new Date().toLocaleTimeString();
        value = label==="CO2"? parseFloat( value.toString()).toFixed(1):value;
        let data = value;
        
        chartInstance.data.labels.push(time);
        chartInstance.data.datasets[0].data.push(data);
        chartInstance.update();
        // Remove oldest data point if we have more than 10
        if (chartInstance.data.labels.length > 10) {
            chartInstance.data.labels.shift();
            chartInstance.data.datasets[0].data.shift();
            chartInstance.update();
        }
    }, [value, chartInstance, lastTime]);

    if (
        state !== "off" &&
        (alarmSetting.IsSendHighAlarm || alarmSetting.IsSendLowAlarm) &&
        (value > alarmSetting.HighAlarmSetting ||
            value < alarmSetting.LowAlarmSetting)
    ) {
        state = "error";
    }
    return typeof alarmSetting === "undefined" ? (
        <div></div>
    ) : (
        <div className={`sensor_item sensor_state-${state}`}>
            <div className="sensor_item-wrap">
                <div>
                    <div
                        className={`sensor_item-name sensor_state_alarm-on'} `}
                    >
                        {label}
                    </div>
                    <div
                        className={`sensor_item-value sensor_state_alarm-on'} `}
                    >
                        <p style={{ fontSize: "30px", fontWeight: "bold" }}>
                            {value}
                            {unit}
                        </p>
                        <p style={{ fontSize: "18px" }}>
                            {alarmSetting.IsSendHighAlarm &&
                            value > alarmSetting.HighAlarmSetting ? (
                                "High Alarm"
                            ) : alarmSetting.IsSendLowAlarm &&
                              value < alarmSetting.LowAlarmSetting ? (
                                "Low Alarm"
                            ) : (
                                <span style={{ visibility: "hidden" }}>0</span>
                            )}

                            {/* {alarmSetting.IsSendHighAlarm ? (
                                value > alarmSetting.HighAlarmSetting &&
                                "High alarm"
                            ) : (
                                <p style={{ visibility: "hidden" }}>0</p>
                            )}

                            {alarmSetting.IsSendLowAlarm ? (
                                value < alarmSetting.LowAlarmSetting &&
                                "Low alarm"
                            ) : (
                                <p style={{ visibility: "hidden" }}>0</p>
                            )} */}
                        </p>
                    </div>

                    {typeof alarmSetting.HighAlarmSetting !== "undefined" ? (
                        <div className="sensor_item-name">
                            {"HL: " + alarmSetting.HighAlarmSetting}
                        </div>
                    ) : (
                 typeof deviceId !=="undefined" &&     (deviceId.includes("_") || deviceId.includes("HCM"))?<div></div>:   <div className={`sensor_state_alarm-hide`}>...</div>
                    )}
                    {typeof alarmSetting.LowAlarmSetting !== "undefined" ? (
                        <div className="sensor_item-name">
                            {"LL: " + alarmSetting.LowAlarmSetting}
                        </div>
                    ) : typeof alarmSetting.DelayTime !== "undefined" ? (
                        ""
                    ) : (
                        typeof deviceId !=="undefined" &&        (deviceId.includes("_") || deviceId.includes("HCM"))?<div></div>:  <div className={`sensor_state_alarm-hide`}>...</div>
                    )}
                    {typeof alarmSetting.DelayTime !== "undefined" ? (
                        <div className="sensor_item-name">
                            {`Delay (${alarmSetting.IsMinute ? "m" : "s"}): ` +
                                alarmSetting.DelayTime}
                        </div>
                    ) : (
                        typeof deviceId !=="undefined" &&           (deviceId.includes("_") || deviceId.includes("HCM"))?<div></div>:   <div className={`sensor_state_alarm-hide`}>...</div>
                    )}
                    {typeof alarmSetting.LowAlarmSetting === "undefined" &&
                    alarmSetting.DelayTime !== "undefined" ? (
                        typeof deviceId !=="undefined" &&     (deviceId.includes("_") || deviceId.includes("HCM"))?<div></div>:  <div className={`sensor_state_alarm-hide`}>...</div>
                    ) : (
                        ""
                    )}
                </div>
            </div>
           { typeof deviceId !=="undefined" &&  (deviceId.includes("_") || deviceId.includes("HCM"))?<div></div>: <div>
                <div>
                    <canvas ref={chartRef} />
                </div>
            </div>
           }
        </div>
    );
}
