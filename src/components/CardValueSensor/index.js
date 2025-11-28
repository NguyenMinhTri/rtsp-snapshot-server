// Updated CardValueSensor component
// Enhanced with responsive design and better unit display

import React, { useState, useEffect, useRef } from "react";
import SensorsIcon from "@mui/icons-material/Sensors";
import SensorsOffIcon from "@mui/icons-material/SensorsOff";
import "./CardValueSensor.scss";
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
  scaleFactor = 1,
  cardsPerRow = 4, // NEW: cards per row for responsive sizing
}) {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  // RESET chart when device changes
  useEffect(() => {
    if (chartInstance !== null) {
      chartInstance.data.labels = [];
      chartInstance.data.datasets[0].data = [];
      chartInstance.update();
    }
  }, [deviceId, label]);

  // INIT chart
  useEffect(() => {
    if (
      typeof deviceId === "undefined" ||
      (!deviceId.includes("_") && !deviceId.includes("HCM"))
    ) {
      const chartConfig = {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label,
              data: [],
              borderColor: "white",
              tension: 0.1,
              fill: false,
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: {
              ticks: { color: "white" },
              beginAtZero: true,
            },
          },
        },
      };

      const newChart = new Chart(chartRef.current, chartConfig);
      setChartInstance(newChart);

      return () => newChart.destroy();
    }
  }, []);

  // ADD data to chart
  useEffect(() => {
    if (!chartInstance) return;

    const time = new Date().toLocaleTimeString();
    const dataValue = label === "CO2" ? parseFloat(value).toFixed(1) : value;

    chartInstance.data.labels.push(time);
    chartInstance.data.datasets[0].data.push(dataValue);
    chartInstance.update();

    if (chartInstance.data.labels.length > 10) {
      chartInstance.data.labels.shift();
      chartInstance.data.datasets[0].data.shift();
      chartInstance.update();
    }
  }, [value, chartInstance, lastTime]);

  // --- ALARM CHECK (LEVEL1 + LEVEL2) --- //
  const AL = alarmSetting || {};

  let isErrorLV2 = false;
  let isErrorLV1 = false;
  
  // LV2 HIGH
  if ((AL.IsAlarmHigh || typeof AL.IsAlarmHigh === "undefined" ) && value > AL.HighAlarmSetting && (AL.IsSendHighAlarm || AL.DelayTime == 0 || typeof AL.DelayTime == "undefined")) 
    isErrorLV2 = true;

  // LV2 LOW
  else if (AL.IsAlarmLow && value < AL.LowAlarmSetting && (AL.IsSendHighAlarm || AL.DelayTime == 0 || typeof AL.DelayTime == "undefined")) 
    isErrorLV2 = true;

  // LV1 HIGH
  if (AL.IsAlarmHigh1 && value > AL.HighAlarmSetting1) isErrorLV1 = true;

  // LV1 LOW
  else if (AL.IsAlarmLow1 && value < AL.LowAlarmSetting1) isErrorLV1 = true;

  let finalState = state !== "off" && isErrorLV2 ? "error" : state;
  if (isErrorLV2 !== true && isErrorLV1 === true &&  state !== "off" ) {
    finalState = 'calib';
  }
  
  // Calculate value scale based on digit count
  const valueLength = value.toString().replace('.', '').length;
  const valueScale = valueLength > 6 ? 0.7 : valueLength > 5 ? 0.8 : valueLength > 4 ? 0.9 : 1;
  
  if (typeof alarmSetting === "undefined") return <div></div>;
  function formatValue(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return val;

    const str = val.toString();
    const parts = str.split(".");

    // Nếu có phần thập phân và >= 2 số sau dấu chấm ⇒ toFixed(2)
    if (parts.length > 1 && parts[1].length >= 2) {
      return num.toFixed(2);
    }

    // Ngược lại giữ nguyên
    return val;
  }
  return (
    <div 
      className={`sensor_item sensor_state-${finalState}`}
      style={{
        "--label-scale": scaleFactor,
        "--cards-per-row": cardsPerRow,
        "--value-scale": valueScale,
      }}
    >
      <div className="sensor_item-wrap">
        <div>
          <div className="sensor_item-name">{label}</div>

          <div className="sensor_item-value">
            <p>
              <span className="value-number">{  (deviceId.includes("_") || deviceId.includes("HCM"))
                  ? formatValue(value)
                  : value
              }</span>
              <span className="value-unit">{unit}</span>
            </p>
          </div>

          {/* SHOW LEVEL2 */}
          {AL.HighAlarmSetting !== "" && AL.HighAlarmSetting !== undefined && (
            <div className="sensor_item-name">HL2: {AL.HighAlarmSetting}</div>
          )}
          {AL.LowAlarmSetting !== "" && AL.LowAlarmSetting !== undefined && (
            <div className="sensor_item-name">LL2: {AL.LowAlarmSetting}</div>
          )}

          {/* SHOW LEVEL1 */}
          {AL.HighAlarmSetting1 !== "" && AL.HighAlarmSetting1 !== undefined && (
            <div className="sensor_item-name">HL1: {AL.HighAlarmSetting1}</div>
          )}
          {AL.LowAlarmSetting1 !== "" && AL.LowAlarmSetting1 !== undefined && (
            <div className="sensor_item-name">LL1: {AL.LowAlarmSetting1}</div>
          )}

          {/* Delay */}
          {AL.DelayTime !== "" && AL.DelayTime !== undefined && AL.DelayTime > 0 && (
            <div className="sensor_item-name">
              Delay ({AL.IsMinute ? "m" : "s"}): {AL.DelayTime}
            </div>
          )}
        </div>
      </div>

      {/* CHART DISPLAY CONDITION */}
      {typeof deviceId !== "undefined" &&
      (deviceId.includes("_") || deviceId.includes("HCM")) ? (
        <div></div>
      ) : (
        <div className="sensor_item-chart">
          <canvas ref={chartRef} />
        </div>
      )}
    </div>
  );
}