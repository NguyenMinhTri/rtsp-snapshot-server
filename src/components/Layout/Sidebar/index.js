import FindInPageOutlinedIcon from "@mui/icons-material/FindInPageOutlined";
import HomeIcon from "@mui/icons-material/Home";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { styled } from "@mui/material/styles";
import { memo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.scss";


import { getAuth, signOut } from "firebase/auth";
import Cookies from "js-cookie";
import Toast from "../../../utils/toasts";
import Header from "../Header";
import { accountPermissionSetting } from "../../../constants";

const drawerWidth = 180;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
    }),
}));

// accountPermissionSetting

function Sidebar() {
    const accountUser = localStorage.getItem("loginEmail");
    
    let sidebarPrivate = [];
    if (accountPermissionSetting.includes(accountUser)) {
        sidebarPrivate = [
            { id: 6, m: "Cài đặt", im: <SettingsIcon />, l: "/setting" },
        ];
    }
    const itemSideBar = [
        { id: 1, m: "Trang chủ", im: <HomeIcon />, l: "/home" },
        {
            id: 0,
            m: "Tổng quan",
            im: <InsertChartOutlinedIcon />,
            l: "/generality",
        },
        { id: 2, m: "Bản đồ", im: <MapOutlinedIcon />, l: "/map" },
        {
            id: 3,
            m: "Giám sát",
            im: <MonitorHeartOutlinedIcon />,
            l: "/monitor",
        },
        { id: 7, m: "Camera", im: <VideocamOutlinedIcon />, l: "/camera" },
        { id: 4, m: "Tra cứu", im: <FindInPageOutlinedIcon />, l: "/search" },
        {
            id: 5,
            m: "Thông báo",
            im: <NotificationsIcon />,
            l: "/notification",
        },

        ...sidebarPrivate,

        // { id: 6, m: 'Báo cáo', im: <ReportOutlinedIcon />, l: '/report' },
        //{ id: 8, m: 'Nhật ký', im: <HistoryOutlinedIcon />, l: '/history' },
    ];
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    console.log("sidebar ne");
    // open sidebar
    const handleOpenSidebar = (open) => {
        setOpen(open);
    };

    // open nested list
    const handleClickItemBar = (id) => {
        // console.log(id);
    };

    // logout

    const auth = getAuth();
    const handleLogOut = () => {
        signOut(auth)
            .then(() => {
                sessionStorage.clear();
                localStorage.clear();
                Cookies.remove("auth_token");
                Toast("success", "Bạn đã đăng xuất ra khỏi hệ thống");
                navigate("/");
            })
            .catch((error) => {
                // An error happened.
                // navigate('/');
            });
    };

    return (
        <Box
            sx={{ display: "flex" }}
            style={{ backgroundColor: "red !important" }}
        >
            {/* <CssBaseline /> */}
            <Header handleOpenSidebar={handleOpenSidebar} />
            {/* //xl={5} lg={5} md={12} sm={12} xs={12} */}
            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    display: { xs: open ? "block" : "none", sm: "block" },
                }}
            >
                <div className="side_bar">
                    <DrawerHeader></DrawerHeader>
                    <List className="side_bar-list">
                        <div style={{ flex: 1 }}>
                            {itemSideBar.map((v, index) => (
                                <ListItem
                                    key={index}
                                    disablePadding
                                    sx={{ display: "block" }}
                                >
                                    <Link
                                        to={v.l}
                                        style={{
                                            textDecoration: "none",
                                            color: "black",
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() =>
                                                handleClickItemBar(v.id)
                                            }
                                            sx={{
                                                minHeight: 48,
                                                justifyContent: open
                                                    ? "initial"
                                                    : "center",
                                                px: 2.5,
                                            }}
                                        >
                                            <ListItemIcon
                                                className="side_icon"
                                                sx={{
                                                    minWidth: 0,
                                                    mr: open ? 3 : "auto",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {v.im}
                                            </ListItemIcon>
                                            <ListItemText
                                                className="side_text"
                                                primary={v.m}
                                                sx={{ opacity: open ? 1 : 0 }}
                                            />
                                        </ListItemButton>
                                    </Link>
                                </ListItem>
                            ))}
                        </div>

                        <ListItem disablePadding sx={{ display: "block" }}>
                            <ListItemButton
                                onClick={handleLogOut}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? "initial" : "center",
                                    px: 2.5,
                                }}
                            >
                                <ListItemIcon
                                    className="side_icon"
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : "auto",
                                        justifyContent: "center",
                                    }}
                                >
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText
                                    className="side_text"
                                    primary={"Đăng xuất"}
                                    sx={{ opacity: open ? 1 : 0 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </div>
            </Drawer>
        </Box>
    );
}

export default memo(Sidebar);
