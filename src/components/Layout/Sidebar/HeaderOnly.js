import { useCallback } from 'react';

import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import { memo, useState } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import subscribeTokenToTopic from "../../../utils/compare_date";
import { getToken } from "firebase/messaging";
import {  messaging } from "../../../config/firebase";
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.scss';

import { getAuth, signOut } from 'firebase/auth';
import Toast from '../../../utils/toasts';
import Header from '../Header';
import Cookies from 'js-cookie';

const drawerWidth = 180;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    })
);

const itemSideBar = [
    { id: 1, m: 'Trang chủ', im: <InsertChartOutlinedIcon />, l: '/home' },
    { id: 2, m: 'Bản đồ', im: <MapOutlinedIcon />, l: '/map' },
    { id: 3, m: 'Giám sát', im: <MonitorHeartOutlinedIcon />, l: '/monitor' },
    { id: 4, m: 'Tra cứu', im: <FindInPageOutlinedIcon />, l: '/search' },
    { id: 5, m: 'Thông báo', im: <NotificationsIcon />, l: '/notification' },
    { id: 6, m: 'Báo cáo', im: <ReportOutlinedIcon />, l: '/report' },
    
   // { id: 7, m: 'Nhật ký', im: <HistoryOutlinedIcon />, l: '/history' },
    //{ id: 8, m: 'Camera', im: <VideocamOutlinedIcon />, l: '/camera' },
];
function HeaderOnly() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // open sidebar
    const handleOpenSidebar = (open) => {
        setOpen(open);
    };

    // open nested list
    const handleClickItemBar = (id) => {
        // console.log(id);
    };

    // logout

    const unsubscribeAllTopics = async (token) => {
        const key = `fcm_topics_${token.substring(0, 20)}`;
        const topicJson = localStorage.getItem(key);

        if (!topicJson) return;

        const topics = JSON.parse(topicJson);

        for (const topic of topics) {
            await subscribeTokenToTopic(token, topic, false); // false = unsubscribe
        }

        // Xóa cache sau khi unsubscribe
        localStorage.removeItem(key);
    };
    // Logout
    const auth = getAuth();


    return (
        <Box sx={{ display: 'flex' }} style={{ backgroundColor: 'red !important' }}>
            {/* <CssBaseline /> */}

            <Header handleOpenSidebar={handleOpenSidebar} />
        </Box>
    );
}

export default memo(HeaderOnly);
