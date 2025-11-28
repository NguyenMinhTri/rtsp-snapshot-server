// Optimized Sensor Grid Component with Auto-Scale & Sound Alert
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Grid, Skeleton, IconButton, Tooltip, ButtonGroup, Button } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import CardValueSensor from "../../components/CardValueSensor";
import CircularProgress from "@mui/material/CircularProgress";
import "./SensorGrid.scss";

// Sound alert hook
const useAlarmSound = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem("alarm-sound-enabled") === "true";
  });
  
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    debugger;
    audioRef.current = new Audio("https://storage.googleapis.com/weatherstationiotdaiviet.appspot.com/Sounds/alarm.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("alarm-sound-enabled", isSoundEnabled);
  }, [isSoundEnabled]);

  const playAlarm = () => {
    if (isSoundEnabled && audioRef.current && !isPlayingRef.current) {
      audioRef.current.play().catch(err => console.log("Audio play error:", err));
      isPlayingRef.current = true;
    }
  };

  const stopAlarm = () => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
    if (isSoundEnabled) {
      stopAlarm();
    }
  };

  return { isSoundEnabled, playAlarm, stopAlarm, toggleSound };
};

// Calculate max label length for uniform scaling
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
  const { isSoundEnabled, playAlarm, stopAlarm, toggleSound } = useAlarmSound();
  const { scaleFactor } = useUniformScaling(dataSensor);
  
  // Cards per row state (stored in localStorage)
  const [cardsPerRow, setCardsPerRow] = useState(() => {
    return parseInt(localStorage.getItem("cards-per-row") || "4");
  });
  
  // Check for any errors in sensors
  const hasError = useMemo(() => {
    if (!dataSensor || !dataSensor[0]) return false;
    
    return dataSensor[0].some(sensor => {
      debugger;
      const state = styleForCard(sensor.value, sensor.AlarmSetting);
       debugger;
      return state === "error";
    });
  }, [dataSensor, styleForCard]);

  useEffect(() => {
    if (hasError) {
      playAlarm();
    } else {
      stopAlarm();
    }
  }, [hasError, playAlarm, stopAlarm]);

  useEffect(() => {
    localStorage.setItem("cards-per-row", cardsPerRow.toString());
  }, [cardsPerRow]);

  // Calculate responsive grid sizes based on cards per row
  const getGridSize = (perRow) => {
    // With 350px min-width cards, adjust grid accordingly
    const xlSize = 12 / 6;
    return {
      xl: xlSize,
      lg: xlSize,
      md: perRow <= 2 ? xlSize : perRow === 3 ? 4 : 6,
      sm: 12,
      xs: 12,
    };
  };
  const gridSizes = getGridSize(cardsPerRow);

  return (
    <div className="sensor-grid-container">
      {/* Control Panel */}
      <div className="control-panel">
        {/* Cards per row selector */}


        {/* Sound control */}
        <Tooltip title={isSoundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}>
          <IconButton
            onClick={toggleSound}
            className={`sound-toggle ${isSoundEnabled ? "enabled" : "disabled"}`}
            color={isSoundEnabled ? "primary" : "default"}
          >
            {isSoundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>
        
        {hasError && isSoundEnabled && (
          <span className="alarm-indicator">🔔 Cảnh báo</span>
        )}
      </div>

      <Grid
        className="grid-margin sensor-grid"
        container
                
        spacing={1.5}
        style={{
          "--scale-factor": scaleFactor,
          "--cards-per-row": cardsPerRow,
        }}
      >
        {dataSensor && dataSensor.length > 0 ? (
          dataSensor[0].map((v, index) => {
            return (
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
                      unit={` ${typeof v.unit === "undefined" ? "" : v.unit}`}
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
            );
          })
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
  );
}