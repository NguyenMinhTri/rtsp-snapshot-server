// CNVDisplayComponent.js - Component for displaying CNV tank information
import React, { useState, useEffect } from "react";
import { Grid, TextField, Button } from "@mui/material";
import DateTimeTextField from "../../components/DateTimeTextField";
import "./CNVDisplay.scss";

const CNVDisplayComponent = ({ fullRS485Data, onSettingClick, onAlarmClick }) => {
  const [isEnglishLanguage, setIsEnglishLanguage] = useState(() => {
    const saved = localStorage.getItem("EnglishLanguage");
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("EnglishLanguage", isEnglishLanguage);
  }, [isEnglishLanguage]);

  // Helper functions
  const getLiquidName = (id) => {
    const liquidNames = {
      0: "LIN",
      1: "LOX",
      2: "LAR",
      3: "LN2O",
      4: "LCO2",
      5: "LNG",
    };
    return liquidNames[id] || "Undefined";
  };

  const getUnitName = (id) => {
    const unitNames = {
      0: "bar",
      1: "kg/cm2",
      2: "Mpa",
      3: "PSI",
    };
    return unitNames[id] || "Undefined";
  };

  const getDataValue = (index) => {
    // Use ?? instead of || to preserve falsy values like 0, false, ""
    const value = fullRS485Data?.RS485Data?.[index]?.Value;
    return value !== undefined && value !== null ? value : "";
  };

  if (!fullRS485Data?.RS485Data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="cnv-display-container">
      <Grid container justify="center">
        {/* Logo Section */}
        <Grid item xs={3}>
          <div className="cnv-logo-section">
            <img
              src="/image/cnv-logo.png"
              alt="CNV Logo"
              className="cnv-logo"
            />
          </div>
        </Grid>

        {/* Title Section */}
        <Grid item xs={6}>
          <div className="cnv-title-section">
            <div className="cnv-title">
              {isEnglishLanguage
                ? "LIQUID LEVEL & PRESSURE"
                : "MỨC LỎNG VÀ ÁP SUẤT BỒN"}
            </div>
          </div>
        </Grid>

        {/* Language & DateTime Section */}
        <Grid item xs={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <div className="cnv-language-buttons">
                <Button
                  variant="contained"
                  color="primary"
                  className={`language-btn ${!isEnglishLanguage ? "active" : ""}`}
                  onClick={() => setIsEnglishLanguage(false)}
                >
                  VN
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  className={`language-btn ${isEnglishLanguage ? "active" : ""}`}
                  onClick={() => setIsEnglishLanguage(true)}
                >
                  EN
                </Button>
              </div>
            </Grid>
            <Grid item xs={12}>
              <DateTimeTextField />
            </Grid>
          </Grid>
        </Grid>

        {/* Data Display Section */}
        <CNVDataRow
          label={isEnglishLanguage ? "Tank Serial No.:" : "Sê-ri bồn:"}
          value={getDataValue(0)}
          unit=""
          alignLeft={true}
        />

        <CNVDataRow
          label={isEnglishLanguage ? "Fluid:" : "Môi chất:"}
          value={getLiquidName(getDataValue(10))}
          unit=""
          alignLeft={false}
        />

        <CNVDataRow
          label={isEnglishLanguage ? "Liquid level:" : "Mức lỏng:"}
          value={getDataValue(1)}
          unit="(%)"
          alignLeft={true}
        />

        <CNVDataRow
          label={isEnglishLanguage ? "Weight:" : "Khối lượng:"}
          value={getDataValue(2)}
          unit="(kg)"
          alignLeft={false}
        />

        <CNVDataRow
          label={isEnglishLanguage ? "Pressure:" : "Áp suất:"}
          value={getDataValue(5)}
          unit={`(${getUnitName(getDataValue(6))})`}
          alignLeft={true}
        />

        <CNVDataRow
          label={isEnglishLanguage ? "Volume:" : "Thể tích:"}
          value={getDataValue(4)}
          unit="(m3)"
          alignLeft={false}
        />

        {/* Action Buttons Section */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <div className="cnv-action-buttons">
              <Button
                variant="contained"
                color="primary"
                className="action-btn"
                onClick={onSettingClick}
              >
                {isEnglishLanguage ? "Set up" : "Cài đặt"}
              </Button>
              <Button
                variant="contained"
                color="primary"
                className="action-btn"
                onClick={onAlarmClick}
              >
                {isEnglishLanguage ? "Alarm" : "Cảnh báo"}
              </Button>
            </div>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

// Sub-component for data rows
const CNVDataRow = ({ label, value, unit, alignLeft }) => {
  return (
    <Grid
      container
      item
      xs={6}
      alignItems="center"
      style={{
        height: "15vh",
        fontSize: "1.2vw",
      }}
    >
      {alignLeft && <Grid item xs={1} />}
      
      <Grid item xs={alignLeft ? 3 : 2}>
        <div className="cnv-label">{label}</div>
      </Grid>
      
      <Grid item xs={4}>
        <TextField
          value={value}
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
          className="cnv-value-field"
          size="small"
          fullWidth
        />
      </Grid>
      
      <Grid item xs={2}>
        <div className="cnv-unit">{unit}</div>
      </Grid>
      
      {!alignLeft && <Grid item xs={2} />}
    </Grid>
  );
};

export default CNVDisplayComponent;