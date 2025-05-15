import React from 'react';

export default function Nothing({ text = 'Trang đang đưọc xây dựng' }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                height: '70vh',
                // marginTop: '10%',
            }}>
            <img src="/image/nothing.png" alt="" width={200} />
            <p style={{ fontSize: '18px', marginTop: '20px' }}>{text}</p>
        </div>
    );
}
