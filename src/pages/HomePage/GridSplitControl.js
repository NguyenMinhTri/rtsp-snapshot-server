// ============================================
// GRID SPLIT CONTROL - Layout Ratio Adjustment
// ============================================

import React, { useState, useEffect } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Typography,
  Box,
} from "@mui/material";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import CheckIcon from "@mui/icons-material/Check";
import { GRID_SPLIT_RATIOS } from "./layoutHelpers";
import "./GridSplitControl.scss";

const GridSplitControl = ({ deviceId, onSplitChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentSplit, setCurrentSplit] = useState(null);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem(`grid-split-${deviceId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentSplit(parsed);
        onSplitChange?.(parsed);
      } catch (e) {
        console.error("Error loading grid split:", e);
      }
    }
  }, [deviceId]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectRatio = (ratio) => {
    const splitConfig = {
      sensor: ratio.sensor,
      coil: ratio.coil,
      id: ratio.id,
    };

    setCurrentSplit(splitConfig);
    localStorage.setItem(`grid-split-${deviceId}`, JSON.stringify(splitConfig));
    onSplitChange?.(splitConfig);
    handleClose();
  };

  const handleReset = () => {
    setCurrentSplit(null);
    localStorage.removeItem(`grid-split-${deviceId}`);
    onSplitChange?.(null);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <div className="grid-split-control">
      <Tooltip title="Điều chỉnh tỷ lệ chia màn hình">
        <IconButton
          onClick={handleClick}
          className={`split-button ${currentSplit ? "active" : ""}`}
          size="small"
        >
          <ViewWeekIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          className: "split-menu",
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Tỷ lệ Sensor/Frame
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chọn tỷ lệ chia màn hình
          </Typography>
        </Box>

        <Divider />

        {GRID_SPLIT_RATIOS.map((ratio) => (
          <MenuItem
            key={ratio.id}
            onClick={() => handleSelectRatio(ratio)}
            className={currentSplit?.id === ratio.id ? "selected" : ""}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span className="ratio-label">{ratio.label}</span>
                <Box className="ratio-preview">
                  <div
                    className="preview-sensor"
                    style={{ width: `${(ratio.sensor / 12) * 100}%` }}
                  />
                  <div
                    className="preview-coil"
                    style={{ width: `${(ratio.coil / 12) * 100}%` }}
                  />
                </Box>
              </Box>
              {currentSplit?.id === ratio.id && (
                <CheckIcon fontSize="small" color="primary" />
              )}
            </Box>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={handleReset} className="reset-option">
          <Typography variant="body2" color="text.secondary">
            🔄 Đặt lại mặc định
          </Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default GridSplitControl;