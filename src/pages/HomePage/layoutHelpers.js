// ============================================
// LAYOUT HELPERS - Grid Management System
// ============================================

import { useMemo } from "react";

/**
 * Calculate responsive grid sizes based on layout configuration
 */
export const useResponsiveGrid = (config) => {
  return useMemo(() => {
    const {
      hasSensors = false,
      hasCoils = false,
      hasCameras = false,
      deviceType = 0,
      deviceId = "",
      sensorCount = 0,
      gridSplitRatio = null, // User preference from localStorage
    } = config;

    // Helper function to check device type
    const isNNVorTPN = () => {
      return deviceId.includes("NNV") || deviceId.includes("TPN") || deviceType !== 0;
    };

    // Sensor Grid Configuration
    const getSensorGridSize = () => {
      if (!hasSensors || sensorCount === 0) return { xs: 0 };

      // User has custom split preference
      if (gridSplitRatio && hasCoils) {
        return {
          xs: gridSplitRatio.sensor,
          sx: { my: 1 },
        };
      }

      // When there are coils (frames/controls)
      if (hasCoils) {
        const sizeMap = {
          1: 2.1,   // 1 sensor: 4 cols (33%)
          2: 6,   // 2 sensors: 6 cols (50%)
          3: 8,   // 3 sensors: 8 cols (67%)
          default: 8, // 4+ sensors: 8 cols (67%)
        };
        
        return {
          xs: sizeMap[sensorCount] || sizeMap.default,
          sx: { my: 1 },
        };
      }

      // No coils: full width
      return {
        xs: 12,
        sx: { my: 1 },
      };
    };

    // Coil Grid Configuration
    const getCoilGridSize = () => {
      if (!hasCoils) return { xs: 0 };

      // User has custom split preference
      if (gridSplitRatio && hasSensors) {
        return {
          xs: gridSplitRatio.coil,
          sx: { my: 1 },
        };
      }

      // When there are sensors
      if (hasSensors && sensorCount > 0) {
        const sizeMap = {
          1: 9.9,   // 1 sensor: coils take 8 cols (67%)
          2: 6,   // 2 sensors: coils take 6 cols (50%)
          3: 4,   // 3 sensors: coils take 4 cols (33%)
          default: 4, // 4+ sensors: coils take 4 cols (33%)
        };
        
        return {
          xs: sizeMap[sensorCount] || sizeMap.default,
          sx: { my: 1 },
        };
      }

      // No sensors: full width
      return {
        xs: 12,
        sx: { my: 1 },
      };
    };

    // Map/Notes Grid Configuration
    const getMapGridSize = () => {
      if(      hasSensors == false){
            return {
        xl: 6,
        lg: 6,
        md: 12,
        sm: 12,
        xs: 12,
      };
      }
        else
      return {
        xl: 2,
        lg: 2,
        md: 12,
        sm: 12,
        xs: 12,
      };
    };

    // Chart Grid Configuration
    const getChartGridSize = () => {
      const baseXL = isNNVorTPN() ? (hasCameras ? 6 : 8) : (hasCameras ? 8 : 10);
      
      return {
        xl: baseXL,
        lg: baseXL,
        md: hasCameras ? (isNNVorTPN() ? 6 : 8) : (isNNVorTPN() ? 8 : 10),
        sm: hasCameras ? (isNNVorTPN() ? 6 : 8) : 10,
        xs: hasCameras ? (isNNVorTPN() ? 6 : 8) : (isNNVorTPN() ? 8 : 10),
      };
    };

    // Camera Grid Configuration
    const getCameraGridSize = () => {
      if (!hasCameras) return null;

      return {
        xl: 2,
        lg: 2,
        md: 2,
        sm: 2,
        xs: 2,
        style: { height: "555px", overflowY: "auto" },
      };
    };

    return {
      sensor: getSensorGridSize(),
      coil: getCoilGridSize(),
      map: getMapGridSize(),
      chart: getChartGridSize(),
      camera: getCameraGridSize(),
    };
  }, [config]);
};

/**
 * Grid split ratio presets
 */
export const GRID_SPLIT_RATIOS = [
  { id: "100-100", label: "100-100", sensor: 12, coil: 12 },
  { id: "25-75", label: "25/75", sensor: 2, coil: 10 },
  { id: "33-67", label: "33/67", sensor: 4, coil: 8 },
  { id: "40-60", label: "40/60", sensor: 5, coil: 7 },
  { id: "50-50", label: "50/50", sensor: 6, coil: 6 },
  { id: "60-40", label: "60/40", sensor: 7, coil: 5 },
  { id: "67-33", label: "67/33", sensor: 8, coil: 4 },
  { id: "75-25", label: "75/25", sensor: 9, coil: 3 },
];

/**
 * Grid Layout Presets
 */
export const GRID_LAYOUTS = {
  // Standard sensor monitoring layout
  SENSOR_ONLY: {
    sensor: { xs: 12 },
    coil: { xs: 0 },
    map: { xl: 2, lg: 2, md: 12, sm: 12, xs: 12 },
    chart: { xl: 10, lg: 10, md: 12, sm: 12, xs: 12 },
  },

  // Sensor + Coil layout
  SENSOR_WITH_COIL: {
    sensor: { xs: 8 },
    coil: { xs: 4 },
    map: { xl: 2, lg: 2, md: 12, sm: 12, xs: 12 },
    chart: { xl: 8, lg: 8, md: 12, sm: 12, xs: 12 },
    camera: { xl: 2, lg: 2, md: 2, sm: 2, xs: 2 },
  },

  // CNV Display layout
  CNV_DISPLAY: {
    display: { xs: 12 },
    map: { xl: 2, lg: 2, md: 12, sm: 12, xs: 12 },
    chart: { xl: 10, lg: 10, md: 12, sm: 12, xs: 12 },
  },

  // Full width (loading/error state)
  FULL_WIDTH: {
    content: { xs: 12 },
  },
};


/**
 * Layout condition helpers
 */
export const layoutConditions = {
  shouldShowSensors: (dataSensor) => {
    return dataSensor?.[0]?.length > 0;
  },

  shouldShowCoils: (dataCoil) => {
    if (!dataCoil?.[0]?.length) return false;
    // Check if all coils are hidden high alarms with value 0
    const visibleCoils = dataCoil[0].filter(
      (obj) => !(obj.IsHighAlarm === true && obj.Value === 0)
    );
    return visibleCoils.length > 0;
  },

  shouldShowMap: (valueSelect, deviceType) => {
    return valueSelect?.id?.includes("NNV") || 
           valueSelect?.id?.includes("TPN") || 
           deviceType !== 0;
  },

  shouldShowCameras: (cameraList, licenseLockLV1) => {
    return cameraList?.length > 0 && !licenseLockLV1;
  },

  shouldShowCharts: (licenseLockLV1, dataSensor) => {
    return !licenseLockLV1 && dataSensor?.[0]?.length > 0;
  },

  isCNVDevice: (valueSelect) => {
    return valueSelect?.id?.includes("A-CNV-3");
  },
};

/**
 * Export button configuration helper
 */
export const getExportButtonConfig = (deviceId) => {
  // Safe check for undefined/null deviceId
  if (!deviceId) {
    return [{ label: "Xuất Excel", handler: "handleExportExcel" }];
  }

  const configs = {
    "A-OMWATER-1": [
      { label: "Xuất Excel", handler: "handleExportExcel" },
      { label: "Xuất ISO", handler: "handleExportExcelISO" },
      { label: "Xuất OPRP ISO", handler: "handleExportExcelISO2" },
    ],
    "CONG-NGHIEP-VIET-2": [
      { label: "Export Historic Analysis", handler: "handleExportHistoryCNV" },
      { label: "Export CERTIFICATE OF ANALYSIS", handler: "handleCertificate" },
    ],
    "A-KHINAMPHUONG-1": [
      { label: "Xuất Excel", handler: "handleExportHistoryNamPhuong" },
    ],
    default: [
      { label: "Xuất Excel", handler: "handleExportExcel" },
    ],
  };

  // Find matching config
  for (const [key, config] of Object.entries(configs)) {
    if (key !== 'default' && (deviceId === key || deviceId.includes(key))) {
      return config;
    }
  }

  return configs.default;
};

/**
 * Chart type detection
 */
export const getChartComponent = (deviceId) => {
  // Safe check for undefined/null deviceId
  if (!deviceId) {
    return "MainChart";
  }

  const specialDevices = [
    "_",
    "CONG-NGHIEP-VIET-2",
    "A-TEDCO-1",
    "A-BIENTAN-1",
    "A-TEMP-NP-1",
    "HCM",
  ];

  const isSpecialDevice = specialDevices.some((device) =>
    deviceId.includes(device)
  );

  return isSpecialDevice ? "ChartTab" : "MainChart";
};

/**
 * Device type detection helpers
 */
export const deviceTypeHelpers = {
  isNNV: (deviceId) => deviceId?.includes("NNV") || false,
  isTPN: (deviceId) => deviceId?.includes("TPN") || false,
  isBienTan: (deviceId) => deviceId?.includes("A-BIENTAN-1") || false,
  isCNV: (deviceId) => deviceId?.includes("A-CNV-3") || false,
  isOmWater: (deviceId) => deviceId === "A-OMWATER-1",
  
  needsNotes: (deviceId, deviceType = 0) => {
    if (!deviceId) return false;
    return deviceId.includes("NNV") || 
           deviceId.includes("TPN") || 
           deviceType !== 0;
  },
  
  needsDoubleMap: (deviceId, deviceType = 0) => {
    if (!deviceId) return false;
    return (deviceId.includes("NNV") || 
            deviceId.includes("TPN") || 
            deviceType !== 0) && 
           !deviceId.includes("A-BIENTAN-1");
  },
};