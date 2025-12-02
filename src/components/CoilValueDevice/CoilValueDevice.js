// Enhanced CoilValueDevice with consistent styling
import React from 'react';
import Check from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
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
    <div className={`coil_item coil_state-${getStateClass()}`}>
      <div className="coil_item-header">
        <div className="coil_item-name">{label}</div>
        {item.IsModify === false && (
          <LockIcon className="coil-lock-icon" />
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