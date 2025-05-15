import { CircularProgress } from '@mui/material';
import React from 'react';

export default function Loading() {
    return (
        <div style={{ margin: '50px 0', textAlign: 'center' }}>
            <CircularProgress color="success" />
            <p>Vui lòng chờ...</p>
        </div>
    );
}
