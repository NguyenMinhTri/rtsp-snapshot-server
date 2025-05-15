import React from 'react';
import SensorsIcon from '@mui/icons-material/Sensors';
import SensorsOffIcon from '@mui/icons-material/SensorsOff';
import WarningIcon from '@mui/icons-material/Warning';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import Check from '@mui/icons-material/Check';
import LockIcon from '@mui/icons-material/Lock';
import './CoilValueDevice.scss';
import MyChart from '../MyChart/SubChart';

export default function CoilValueDevice({ label, value, unit, state, fillColor = '#0E5E6F' ,isHighAlarm, item}) {
    return (
        <div className={`sensor_item coil_state-${ value == "1"?  `${isHighAlarm ? "error":"normal"}`: `${isHighAlarm?"normal" :"off"}`}`}>
            <div className="sensor_item-wrap">
                <div>
                    <div  className="sensor_item-name">{label}</div>

                    <div>
                    {isHighAlarm !== true ? (
                        
                        label.toLowerCase().includes("pump") ||  label.toLowerCase().includes("bơm") ||  label.toLowerCase().includes("p0") ?  <img src="/image/pump.svg" alt=""  height={60}  />:
                         <Check style={{ color: value == "1" ? "blue" :"gray"}} sx={{ fontSize: 60 }} />
                    ) : (
                        value == "0" ? <Check style={{ color:  "blue" }} sx={{ fontSize: 60 }} /> :
                        <WarningIcon style={{ color: value == "1" ? "yellow" :"gray"}} sx={{ fontSize: 20 }} />
                    )}
                </div>
                </div>
             
            </div>
          { item.IsModify === false ? (<LockIcon style={{ color: value == "1" ? "grey" :"grey"}} sx={{ fontSize: 10 }} />) :(<div></div>)}
        </div>
        
    );
}
