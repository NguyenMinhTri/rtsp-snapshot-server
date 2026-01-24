// Optimized Sensor Grid Component with Grouping by GroupName
import React, { useState, useEffect, useMemo } from "react";
import { Grid, Skeleton } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import CardValueSensor from "../../components/CardValueSensor/CardValueSensor";
import "./SensorGrid.scss";

// Calculate uniform scaling
const useUniformScaling = (dataSensor) => {
  return useMemo(() => {
    if (!dataSensor || !dataSensor[0]) return { maxLabelLength: 0, scaleFactor: 1 };

    const maxLength = dataSensor[0].reduce((max, item) => {
      const labelLength = item.sensor?.length || 0;
      return Math.max(max, labelLength);
    }, 0);

    let scaleFactor = 1;
    if (maxLength > 20) scaleFactor = 0.75;
    else if (maxLength > 15) scaleFactor = 0.85;
    else if (maxLength > 10) scaleFactor = 0.95;

    return { maxLabelLength: maxLength, scaleFactor };
  }, [dataSensor]);
};

export default function SensorGridOptimized({
  dataSensor,
  dataChange,
  valueSelect,
  isRerenderCard,
  onClickSensorDevice,
  styleForCard,
}) {
  const { scaleFactor } = useUniformScaling(dataSensor);

  // Cards per row state
  const [cardsPerRow, setCardsPerRow] = useState(() => {
    return parseInt(localStorage.getItem("cards-per-row") || "4");
  });

  useEffect(() => {
    localStorage.setItem("cards-per-row", cardsPerRow.toString());
  }, [cardsPerRow]);

  // Grid responsive size
  const getGridSize = (perRow) => ({
    xl: 12 / perRow,
    lg: 12 / perRow,
    md: perRow <= 2 ? 12 / perRow : perRow === 3 ? 4 : 6,
    sm: 12,
    xs: 12,
  });

  const gridSizes = getGridSize(cardsPerRow);

  // ---------------------------
  // 🟦 GROUPING LOGIC (NEW)
  // ---------------------------
  const rawSensors = dataSensor?.[0] || [];

  const grouped = rawSensors.reduce((acc, sensor) => {
    const group = sensor.GroupName || sensor.item?.GroupName || "Khác";
    if (!acc[group]) acc[group] = [];
    acc[group].push(sensor);
    return acc;
  }, {});

  return (
    <div className="sensor-grid-container">
      {Object.entries(grouped).map(([groupName, sensors], groupIndex) => (
        <div key={groupIndex} >

          {/* TIÊU ĐỀ NHÓM - giống Coil */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginTop: groupIndex > 0 ? 20 : 0, // Add margin-top for groups after the first one
              marginBottom: 10,
              color: "#4FC3F7",
              paddingLeft: 4,
              paddingTop: groupIndex > 0 ? 12 : 0, // Add padding for visual separation
              borderTop: groupIndex > 0 ? '1px solid rgba(79, 195, 247, 0.2)' : 'none', // Subtle separator line
            }}
          >
            {groupName.toUpperCase()}
          </div>

          <Grid
            className="grid-margin sensor-grid"

            spacing={1.5}
            style={{
              "--scale-factor": scaleFactor,
              "--cards-per-row": cardsPerRow,
            }}
          >
            {sensors.length > 0 ? (
              sensors.map((v, index) => (
                <Grid
                  key={index}
                  item
                  xl={gridSizes.xl}
                  lg={gridSizes.lg}
                  md={gridSizes.md}
                  sm={gridSizes.sm}
                  xs={gridSizes.xs}
                >
                  <div
                    className="sensor-card-wrapper"
                    style={{
                      height: "100%",
                      cursor: v.IsModify === true ? "pointer" : "default",
                    }}
                    onClick={() => {
                      v.IsModify === true ? onClickSensorDevice(v) : null;
                    }}
                  >
                    {!isRerenderCard ? (
                      <CardValueSensor
                        alarmSetting={v.AlarmSetting}
                        label={v.sensor}
                        lastTime={dataChange.last_time}
                        deviceId={valueSelect.id + v.sensor}
                        value={v.value.split("*")[0]}
                        unit={` ${v.unit || ""}`}
                        state={styleForCard(v.value, v.AlarmSetting)}
                        fillColor={"red"}
                        scaleFactor={scaleFactor}
                        cardsPerRow={cardsPerRow}
                      />
                    ) : (
                      <div className="loading-wrapper">
                        <CircularProgress color="success" />
                      </div>
                    )}
                  </div>
                </Grid>
              ))
            ) : (
              <>
                {[...Array(6)].map((_, index) => (
                  <Grid
                    key={index}
                    item
                    xl={gridSizes.xl}
                    lg={gridSizes.lg}
                    md={gridSizes.md}
                    sm={gridSizes.sm}
                    xs={gridSizes.xs}
                  >
                    <Skeleton
                      animation="wave"
                      variant="rounded"
                      height={200}
                      sx={{ borderRadius: "16px" }}
                    />
                  </Grid>
                ))}
              </>
            )}
          </Grid>
        </div>
      ))}
    </div>
  );
}
