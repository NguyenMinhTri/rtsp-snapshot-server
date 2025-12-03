import { styled } from "@mui/material/styles";
import React, { memo, useState, useEffect } from "react";


import Logout from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { ListItemIcon } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Slide from "@mui/material/Slide";

import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getToken } from "firebase/messaging";
import { messaging } from "../../../config/firebase";
import Toast from "../../../utils/toasts";
import Cookies from "js-cookie";
import AsyncLocalStorage from "../../../utils/async_localstorage";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DeviceConfigPage from "../../../pages/ModbusSetting";

import "./Header.scss";

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const TransitionUp = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function Header({ handleOpenSidebar }) {
  const [currentDomain, setCurrentDomain] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);

  // Notification dialog state
  const [openNoti, setOpenNoti] = useState(false);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [deviceId, setDeviceId] = useState("");

  // Modbus Settings dialog state
  const [openModbus, setOpenModbus] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Logout loading state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const deviceUser = localStorage.getItem("device_user");
  let listDevice;
  if (deviceUser !== "undefined") {
    try {
      listDevice = JSON.parse(deviceUser);
    } catch {
      listDevice = {};
    }
  } else {
    navigate("/nothing");
  }

  useEffect(() => setCurrentDomain(window.location.href), []);

  // Helpers
  const handleDrawerOpen = () => {
    setOpenSidebar((prev) => {
      const next = !prev;
      handleOpenSidebar(next);
      return next;
    });
  };

  const openDialogNoti = () => setOpenNoti(true);
  const closeDialogNoti = () => setOpenNoti(false);

  const openDialogModbus = () => {
    let prev = deviceId;
    AsyncLocalStorage.getItem("home_station").then((station) => {
      const searchParams = new URLSearchParams(window.location.search);
      const qDeviceId = searchParams.get("deviceId");

      if (station && qDeviceId === null) {
        const stationUser = JSON.parse(station);
        setDeviceId((cur) => {
          if (prev !== stationUser.id) {
            setOffset(0);
            setData([]);
          }
          return stationUser.id;
        });
      } else {
        let deviceIdTemp = Object.keys(listDevice || {})[0];
        if (qDeviceId !== null && typeof (listDevice || {})[qDeviceId] !== "undefined") {
          deviceIdTemp = qDeviceId;
        }
        setDeviceId((cur) => {
          if (prev !== deviceIdTemp) {
            setOffset(0);
            setData([]);
          }
          return deviceIdTemp;
        });
      }
    });
    setOpenModbus(true);
  };

  const closeDialogModbus = () => setOpenModbus(false);

  useEffect(() => {
    AsyncLocalStorage.getItem("home_station").then((station) => {
      const searchParams = new URLSearchParams(window.location.search);
      const qDeviceId = searchParams.get("deviceId");

      if (station && qDeviceId === null) {
        const stationUser = JSON.parse(station);
        setDeviceId(stationUser.id);
      } else {
        let deviceIdTemp = Object.keys(listDevice || {})[0];
        if (qDeviceId !== null && typeof (listDevice || {})[qDeviceId] !== "undefined") {
          deviceIdTemp = qDeviceId;
        }
        setDeviceId(deviceIdTemp);
      }
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (offset < 8) setIsLoading(true);
      try {
        const result = await axios(
          `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/noti-data?offset=${offset}&deviceId=${deviceId}`
        );
        setData((old) => [...old, ...result.data]);
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    if (deviceId) fetchData();
  }, [offset, deviceId]);

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) setOffset((x) => x + 10);
  };

  const handleClickAvatar = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const username = localStorage.getItem("loginUserName");
  const imgUserLogin =
    !currentDomain.includes("tanphamnguyen")
      ? localStorage.getItem("imgUser")
      : "/image/logo-tpn.jpg";
  const email = localStorage.getItem("loginEmail");

  const bulkTopicAction = async (token, topics, isSub) => {
    return await fetch(
      "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/bulk-topic-action",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, topics, isSub }),
      }
    ).then((res) => res.json());
  };

  const unsubscribeAllTopics = async (token) => {
    const key = `fcm_topics_${token.substring(0, 20)}`;
    const topicJson = localStorage.getItem(key);
    if (!topicJson) return;
    const topics = JSON.parse(topicJson);
    const result = await bulkTopicAction(token, topics, false);
    console.log("Unsubscribe result:", result);
    localStorage.removeItem(key);
  };

  const handleLogOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const token = await getToken(messaging);
      if (token) {
        await unsubscribeAllTopics(token);
        const subKey = `fcm_subscribed_${token.substring(0, 20)}`;
        localStorage.removeItem(subKey);
      }


    } catch (err) {
      console.error(err);
      await signOut(auth);
      sessionStorage.clear();
      localStorage.clear();
      Cookies.remove("auth_token");
      Toast("success", "Bạn đã đăng xuất ra khỏi hệ thống");
      navigate("/");
      Toast("error", "Có lỗi khi đăng xuất!");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AppBar className="header" position="fixed" sx={{ display: "flex" }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ marginRight: 2 }}
        >
          {openSidebar ? <CloseIcon /> : <MenuIcon />}
        </IconButton>

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
          aria-label="open notifications"
          onClick={openDialogNoti}
          edge="start"
          sx={{ marginRight: 1.5 }}
        >
          <NotificationsIcon />
        </IconButton>

        <IconButton
          size="20"
          color="inherit"
          aria-label="open modbus settings"
          onClick={openDialogModbus}
          edge="start"
          sx={{ marginRight: 2 }}
        >
          <SettingsOutlinedIcon />
        </IconButton>

        <Avatar
          alt="user"
          src={
            !imgUserLogin || imgUserLogin === "undefined"
              ? "/image/navis.png"
              : imgUserLogin
          }
          onClick={handleClickAvatar}
          sx={{ cursor: "pointer" }}
        />
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleCloseMenu}
          MenuListProps={{ "aria-labelledby": "basic-button" }}
        >
          <MenuItem
            onClick={isLoggingOut ? undefined : handleLogOut}
            disabled={isLoggingOut}
          >
            <ListItemIcon>
              {isLoggingOut ? <CircularProgress size={20} /> : <Logout fontSize="small" />}
            </ListItemIcon>
            {isLoggingOut ? "Đang đăng xuất..." : "Logout"}
          </MenuItem>
        </Menu>

        <p className="header_username">{username}</p>
        <p className="header_mail">({email})</p>

        {/* Notifications Dialog */}
        <Dialog
          open={openNoti}
          onClose={closeDialogNoti}
          aria-labelledby="notification-dialog-title"
          maxWidth="sm"
          fullWidth
          keepMounted={false}
          disableScrollLock
          TransitionComponent={TransitionUp}
          PaperProps={{ sx: { minHeight: 200, maxHeight: 300, overflow: "auto" } }}
        >
          <DialogTitle id="notification-dialog-title">Notifications</DialogTitle>
          <DialogContent onScroll={handleScroll} dividers>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </div>
            ) : (
              <List sx={{ width: "100%", maxWidth: 1024, bgcolor: "background.paper" }}>
                {data.map((item, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar alt="E" src="/static/images/avatar/1.jpg" />
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.Time?.value}
                      secondary={
                        <Typography component="span" variant="body2" color="text.primary">
                          {item.Content}
                        </Typography>
                      }
                    />
                    <Divider variant="inset" component="li" />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialogNoti} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modbus Settings Dialog */}
        <Dialog
          open={openModbus}
          onClose={closeDialogModbus}
          aria-labelledby="modbus-dialog-title"
          maxWidth="lg"
          fullWidth
          keepMounted={false}
          disableScrollLock
          TransitionComponent={TransitionUp}
          PaperProps={{
            sx: { height: "80vh", display: "flex", flexDirection: "column" },
          }}
        >
          <DialogTitle id="modbus-dialog-title" sx={{ pb: 1 }}>
            Modbus Configurations
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            <div style={{ height: "100%", minHeight: 0 }}>
              {deviceId ? (
                <DeviceConfigPage deviceId={deviceId} userEmail={email} />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 1.5 }}>
            <Button onClick={closeDialogModbus} variant="contained">
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}

export default memo(Header);
