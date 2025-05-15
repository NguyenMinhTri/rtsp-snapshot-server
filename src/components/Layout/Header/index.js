import { styled } from "@mui/material/styles";
import { memo, useState, useCallback, useEffect, useRef } from "react";

import Logout from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PersonAdd from "@mui/icons-material/PersonAdd";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { ListItemIcon } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";

import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import Toast from "../../../utils/toasts";
import "./Header.scss";
import Cookies from "js-cookie";
import Notification from "../../Notification";
// import ConfirmationDialog from '../../ConfirmationDialog';

import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import AsyncLocalStorage from "../../../utils/async_localstorage";

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
}));

function Header({ handleOpenSidebar }) {
    const [currentDomain, setCurrentDomain] = useState("");

    useEffect(() => {
        setCurrentDomain(window.location.href);
    }, []);

    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [deviceId, setDeviceId] = useState("");
    const deviceUser = localStorage.getItem("device_user");
    let listDevice;
    if (deviceUser !== "undefined") {
        listDevice = JSON.parse(deviceUser);
    } else {
        navigate("/nothing");
    }
    const openDialog = () => {
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
    };
    useEffect(() => {
        AsyncLocalStorage.getItem("home_station").then((station) => {
            const searchParams = new URLSearchParams(window.location.search);
            const deviceId = searchParams.get("deviceId");
            console.log(deviceId);
            if (station && deviceId === null) {
                let stationUser = JSON.parse(station);
                setDeviceId(stationUser.id);
            } else {
                let deviceIdTemp = Object.keys(listDevice)[0];
                if (
                    deviceId !== null &&
                    typeof listDevice[deviceId] !== "undefined"
                )
                    deviceIdTemp = deviceId;

                setDeviceId(deviceIdTemp);
            }
        });
    }, []);
    useEffect(() => {
        // setOffset(0);
        // setData([]);
        let clonedDeviceId = deviceId;
        AsyncLocalStorage.getItem("home_station").then((station) => {
            const searchParams = new URLSearchParams(window.location.search);
            const deviceId = searchParams.get("deviceId");
            console.log(deviceId);
            if (station && deviceId === null) {
                let stationUser = JSON.parse(station);
                setDeviceId(stationUser.id);
                if (clonedDeviceId !== stationUser.id) {
                    setOffset(0);
                    setData([]);
                }
            } else {
                let deviceIdTemp = Object.keys(listDevice)[0];
                if (
                    deviceId !== null &&
                    typeof listDevice[deviceId] !== "undefined"
                )
                    deviceIdTemp = deviceId;

                setDeviceId(deviceIdTemp);
                if (clonedDeviceId !== deviceIdTemp) {
                    setOffset(0);
                    setData([]);
                }
            }
        });
    }, [isOpen]);
    useEffect(() => {
        const fetchData = async () => {
            if (offset < 8) setIsLoading(true);

            const result = await axios(
                `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/noti-data?offset=${offset}&deviceId=${deviceId}`
            );
            setData([...data, ...result.data]);
            setIsLoading(false);
        };
        fetchData();
    }, [offset, deviceId]);

    const handleScroll = (e) => {
        const bottom =
            e.target.scrollHeight - e.target.scrollTop ===
            e.target.clientHeight;
        if (bottom) {
            setOffset(offset + 10);
        }
    };

    const [open, setOpen] = useState(false);

    const navigate = useNavigate();

    const handleDrawerOpen = () => {
        setOpen(!open);
        handleOpenSidebar(!open);
    };

    // menu
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);
    const handleClickAvatar = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
    };
    const handleNotiOpen = () => {};
    // get in local storage
    let username = localStorage.getItem("loginUserName");
    let imgUserLogin = !currentDomain.includes("tanphamnguyen")
        ? localStorage.getItem("imgUser")
        : "/image/logo-tpn.jpg";
    let email = localStorage.getItem("loginEmail");
    //log out
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
        <AppBar className="header" position="fixed" sx={{ display: "flex" }}>
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    edge="start"
                    sx={{
                        marginRight: 2,
                        // ...(open && { display: 'none' }),
                    }}
                >
                    {open ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
                {/* <img src="/image/logo_cpn.png" width={120} alt="" /> */}
                <Typography
                    sx={{ flexGrow: 1 }}
                    className="header_title"
                    variant="h6"
                    noWrap
                    component="div"
                >
                    QUẢN LÝ DỮ LIỆU
                </Typography>
                <IconButton
                    size="20"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={() => navigate("/notification")}
                    edge="start"
                    sx={{
                        marginRight: 2,
                        // ...(open && { display: 'none' }),
                    }}
                >
                    <NotificationsIcon />
                </IconButton>
                <Avatar
                    alt="Remy Sharp"
                    src={typeof imgUserLogin === "undefined" || imgUserLogin==="" || imgUserLogin===null ? "/image/navis.png": imgUserLogin}
                    onClick={handleClickAvatar}
                    sx={{ cursor: "pointer" }}
                />

                <Menu
                    id="fade-menu"
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleCloseMenu}
                    MenuListProps={{
                        "aria-labelledby": "basic-button",
                    }}
                >
                    {/* <MenuItem onClick={handleCloseMenu}>
                        <ListItemIcon>
                            <PersonAdd fontSize="small" />
                        </ListItemIcon>
                        Profile
                    </MenuItem> */}
                    <MenuItem onClick={handleLogOut}>
                        <ListItemIcon>
                            <Logout fontSize="small" />
                        </ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>
                <p className="header_username">{username}</p>
                <p className="header_mail">({email})</p>
                <Dialog
                    open={isOpen}
                    onClose={closeDialog}
                    aria-labelledby="notification-dialog-title"
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        style: {
                            minHeight: "200px",
                            maxHeight: "300px",
                            overflow: "auto",
                        },
                    }}
                >
                    <DialogTitle id="notification-dialog-title">
                        Notifications
                    </DialogTitle>
                    <DialogContent onScroll={handleScroll}>
                        {isLoading ? (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <CircularProgress />
                            </div>
                        ) : (
                            <List
                                sx={{
                                    width: "100%",
                                    maxWidth: 1024,
                                    bgcolor: "background.paper",
                                }}
                            >
                                {data.map((item, index) => (
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar
                                                alt="E"
                                                src="/static/images/avatar/1.jpg"
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            color="text.primary"
                                            primary={item.Time.value}
                                            secondary={
                                                <React.Fragment>
                                                    <Typography
                                                        sx={{
                                                            display: "inline",
                                                        }}
                                                        component="span"
                                                        variant="body2"
                                                        color="text.primary"
                                                    >
                                                        {item.Content}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                        <Divider
                                            variant="inset"
                                            component="li"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDialog} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Toolbar>
        </AppBar>
    );
}
export default memo(Header);
