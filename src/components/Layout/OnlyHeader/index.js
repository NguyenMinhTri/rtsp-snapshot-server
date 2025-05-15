// import styled from '@emotion/styled';
import { styled } from '@mui/material/styles';

import React from 'react';
import HeaderOnly from '../Sidebar/HeaderOnly';
import './OnlyHeader.scss';

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

export default function OnlyHeader({ children }) {
    return (
        <div className="only_header">
            <HeaderOnly />

            <div className="content">
                <DrawerHeader />
                {children}
            </div>
        </div>
    );
}
