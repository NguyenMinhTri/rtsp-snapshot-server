// ============================================
// LAYOUT HELPERS - Grid Management System
// ============================================

import { useMemo } from "react";

/**
 * Calculate responsive grid sizes based on layout configuration
 * ALL SECTIONS ON ONE ROW - Dynamic sizing when sections are hidden
 */
export const useResponsiveGrid = (config) => {
  return useMemo(() => {
    const {
      hasSensors = false,
      hasCoils = false,
      hasCameras = false,
      hasMap = false,       // New: explicitly track if map should show
      hasNotes = false,     // New: explicitly track if notes should show
      deviceType = 0,
      deviceId = "",
      sensorCount = 0,
      gridSplitRatio = null,
    } = config;

    // Helper function to check device type
    const isNNVorTPN = () => {
      return deviceId.includes("NNV") || deviceId.includes("TPN") || deviceType !== 0;
    };

    // Sensor Grid Configuration
    const getSensorGridSize = () => {
      if (!hasSensors || sensorCount === 0) return { xs: 0 };

      if (gridSplitRatio && hasCoils) {
        return { xs: gridSplitRatio.sensor, sx: { my: 1 } };
      }

      if (hasCoils) {
        const sizeMap = {
          1: 2.1,
          2: 6,
          3: 8,
          default: 8,
        };
        return { xs: sizeMap[sensorCount] || sizeMap.default, sx: { my: 1 } };
      }

      return { xs: 12, sx: { my: 1 } };
    };

    // Coil Grid Configuration
    const getCoilGridSize = () => {
      if (!hasCoils) return { xs: 0 };

      if (gridSplitRatio && hasSensors) {
        return { xs: gridSplitRatio.coil, sx: { my: 1 } };
      }

      if (hasSensors && sensorCount > 0) {
        const sizeMap = {
          1: 9.9,
          2: 6,
          3: 4,
          default: 4,
        };
        return { xs: sizeMap[sensorCount] || sizeMap.default, sx: { my: 1 } };
      }

      return { xs: 12, sx: { my: 1 } };
    };

    // ============================================
    // BOTTOM ROW: Map/Notes + Chart + Camera
    // ALL ON ONE ROW - Dynamic sizing
    // ============================================

    // Count visible sections to calculate dynamic sizes
    const visibleSections = [];
    if (hasMap || hasNotes) visibleSections.push('map');
    visibleSections.push('chart'); // Chart always visible
    if (hasCameras) visibleSections.push('camera');

    const sectionCount = visibleSections.length;

    // Check if double map (notes + map both showing)
    const hasDoubleMap = hasNotes && hasMap;

    // Calculate sizes based on what's visible
    // Total = 12 cols on desktop
    const getBottomRowSizes = () => {
      // Only chart visible
      if (sectionCount === 1) {
        return { map: 0, notes: 0, chart: 12, camera: 0 };
      }

      // Notes + Map (double) + Chart (no camera)
      if (hasDoubleMap && !hasCameras) {
        return { map: 2, notes: 2, chart: 8, camera: 0 };
      }

      // Notes + Map (double) + Chart + Camera
      if (hasDoubleMap && hasCameras) {
        return { map: 2, notes: 2, chart: 5, camera: 3 };
      }

      // Chart + Camera (no map/notes)
      if (sectionCount === 2 && !hasMap && !hasNotes && hasCameras) {
        return { map: 0, notes: 0, chart: 7, camera: 5 };
      }

      // Chart + Map/Notes (no camera) - single map or notes only
      if (sectionCount === 2 && (hasMap || hasNotes) && !hasCameras) {
        return { map: 3, notes: 0, chart: 9, camera: 0 };
      }

      // All three sections visible (map/notes + chart + camera)
      if (sectionCount === 3) {
        return { map: 3, notes: 0, chart: 5, camera: 4 };
      }

      // Default
      return { map: 3, notes: 0, chart: 6, camera: 3 };
    };

    const bottomSizes = getBottomRowSizes();

    // Notes Grid Configuration - for when notes shows
    const getNotesGridSize = () => {
      if (!hasNotes) return { xs: 0 };

      // Use notes size if available, otherwise use map size
      const size = bottomSizes.notes || bottomSizes.map;

      return {
        xl: size,
        lg: size,
        md: size,
        sm: size,
        xs: 12,
      };
    };

    // Map Grid Configuration - for when map shows (can show alongside notes)
    const getMapGridSize = () => {
      if (!hasMap) return { xs: 0 };

      return {
        xl: bottomSizes.map,
        lg: bottomSizes.map,
        md: bottomSizes.map,
        sm: bottomSizes.map,
        xs: 12,
      };
    };

    // Chart Grid Configuration - Same size at all breakpoints
    const getChartGridSize = () => {
      return {
        xl: bottomSizes.chart,
        lg: bottomSizes.chart,
        md: bottomSizes.chart,
        sm: bottomSizes.chart,
        xs: 12,
      };
    };

    // Camera Grid Configuration - Same size at all breakpoints
    const getCameraGridSize = () => {
      if (!hasCameras) return null;

      return {
        xl: bottomSizes.camera,
        lg: bottomSizes.camera,
        md: bottomSizes.camera,
        sm: bottomSizes.camera,
        xs: 12,
      };
    };

    return {
      sensor: getSensorGridSize(),
      coil: getCoilGridSize(),
      notes: getNotesGridSize(),  // Separate notes config
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