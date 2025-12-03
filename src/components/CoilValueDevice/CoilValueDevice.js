// Enhanced CoilValueDevice with consistent styling, transitions, and tooltip
import React, { useRef, useState, useEffect } from 'react';
import Check from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import Tooltip from '@mui/material/Tooltip';
import './CoilValueDevice.scss';

export default function CoilValueDevice({ 
  label, 
  value, 
  unit, 
  state, 
  fillColor = '#0E5E6F', 
  isHighAlarm, 
  item,
  IsRevHighAlarm = false, 
}) {
  const labelRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);

  // Check if text is overflowing
  useEffect(() => {
    const element = labelRef.current;
    if (element) {
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [label]);

  // Detect value change for transition effect
  useEffect(() => {
    if (previousValue !== value) {
      setPreviousValue(value);
    }
  }, [value, previousValue]);

  // Determine icon to display
  const getIcon = () => {
    const isPump = label.toLowerCase().includes("pump") || 
                   label.toLowerCase().includes("bơm") || 
                   label.toLowerCase().includes("p0");

    if (isHighAlarm !== true) {
      if (isPump) {
        return (
          <img 
            src="/image/pump.svg" 
            alt="Pump" 
            className="coil-icon pump-icon"
          />
        );
      }
      return (
        <Check 
          className="coil-icon check-icon"
        />
      );
    }

    // High alarm case
    if (value == "0") {
      return (
        <Check 
          className="coil-icon check-icon"
        />
      );
    }

    return (
      <WarningIcon 
        className="coil-icon warning-icon"
        style={{ color: value == "1" ? "yellow" : "gray" }} 
      />
    );
  };

  // Determine state class
  const getStateClass = () => {
    if (value == "1") {
      return isHighAlarm  && IsRevHighAlarm !== true ? "error" : "normal";
    }
    return isHighAlarm && IsRevHighAlarm !== true ? "normal" : "off";
  };

  return (
    <div className={`coil_item coil_state-${getStateClass()} ${previousValue !== value ? 'state-transitioning' : ''}`}>
      <div className="coil_item-header">
        <Tooltip 
          title={label} 
          arrow 
          placement="top"
          disableHoverListener={!isOverflowing}
          enterDelay={300}
        >
          <div className="coil_item-name" ref={labelRef}>{label}</div>
        </Tooltip>
        {item.IsModify === false && (
          <Tooltip title="Locked - Cannot modify" arrow placement="top">
            <LockIcon className="coil-lock-icon" />
          </Tooltip>
        )}
      </div>

      <div className="coil_item-content">
        <div className="coil_item-icon-container">
          {getIcon()}
        </div>

        {unit && (
          <div className="coil_item-unit">{unit}</div>
        )}
      </div>

      <div className="coil_item-status">
        <span className={`status-badge ${value == "1" ? "active" : "inactive"}`}>
          {value == "1" ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}