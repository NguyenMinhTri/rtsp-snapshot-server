import React from 'react';

export default function TabStateStation({ left = '7%', top = '13%' ,onClick}) {
    const handleConfirm = (v) => {
  
        onClick(v);
      };
    return (
        <div style={{ position: 'absolute', left: left, top: top, display: 'flex' }}>
                    <div onClick={() => handleConfirm(-1)} style={{ marginRight: '5px' }}>
                <div
                    style={{
                        // width: '50px',
                        height: '10px',
                        backgroundColor: 'gray',
                    }}></div>
                <p style={{ fontSize: '10px' }}>Tất cả các trạm</p>
            </div>
            <div  onClick={() => handleConfirm(0)} style={{ marginRight: '5px' }}>
                <div
                    style={{
                        // width: '50px',
                        height: '10px',
                        backgroundColor: '#11cc67',
                    }}></div>
                <p style={{ fontSize: '10px' }}>Hoạt động tốt</p>
            </div>
            <div onClick={() => handleConfirm(1)} style={{ marginRight: '5px' }}>
                <div
                    style={{
                        // width: '50px',
                        height: '10px',
                        backgroundColor: 'red',
                    }}></div>
                <p style={{ fontSize: '10px' }}>Trạm lỗi</p>
            </div>
            <div onClick={() => handleConfirm(2)} style={{ marginRight: '5px' }}>
                <div
                    style={{
                        // width: '50px',
                        height: '10px',
                        backgroundColor: 'orange',
                    }}></div>
                <p style={{ fontSize: '10px' }}>Trạm calib</p>
            </div>

        </div>
    );
}
