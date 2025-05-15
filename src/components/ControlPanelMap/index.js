import { useState } from 'react';
import Box from '@mui/material/Box';
import Popper from '@mui/material/Popper';
import MyButton from '../../components/MyButton';

import './ControlPanelMap.scss';

export default function ControlPanelMap({ data, onSelectCity }) {
    const [open, setOpen] = useState(false);

    const handleClick = () => {
        setOpen(!open);
    };

    return (
        <div className="pn_wrapper">
            <button className="pn_btn-all" onClick={handleClick}>
                {!open ? <span>Tất cả trạm</span> : <span>Đóng</span>}
            </button>
            {open && (
                <div className="pn_popper">
                    {data.map((v) => (
                        <div className="pm_popper-item">
                            <p className="pm_popper-item-text">{v.name}</p>
                            <button
                                className="pm_popper-btn"
                                onClick={() => onSelectCity(v.longitude, v.latitude)}>
                                Tới vị trí
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
