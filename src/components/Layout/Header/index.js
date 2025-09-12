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
// thêm vào nhóm import icons/material
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Slide from "@mui/material/Slide";
import DeviceConfigPage from "../../../pages/ModbusSetting";

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

// Transition nhẹ cho dialog (tùy chọn)
const TransitionUp = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function Header({ handleOpenSidebar }) {
  const [currentDomain, setCurrentDomain] = useState("");
  useEffect(() => setCurrentDomain(window.location.href), []);

  const [openSidebar, setOpenSidebar] = useState(false);

  // ===== Notification dialog state =====
  const [openNoti, setOpenNoti] = useState(false);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [deviceId, setDeviceId] = useState("");

  // ===== Modbus Settings dialog state =====
  const [openModbus, setOpenModbus] = useState(false);

  // ===== Device list from localStorage =====
  const navigate = useNavigate();
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

  // ===== Helpers open/close =====
  const openDialogNoti = () => setOpenNoti(true);
  const closeDialogNoti = () => setOpenNoti(false);
  const openDialogModbus = () =>{
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

  // ===== Resolve deviceId from URL or saved home station =====
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

  // Reload notification list when dialog open toggles (nếu đổi trạm)
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNoti]);

  // Fetch notifications
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

  // Sidebar
  const handleDrawerOpen = () => {
    setOpenSidebar((prev) => {
      const next = !prev;
      handleOpenSidebar(next);
      return next;
    });
  };

  // Menu user
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleClickAvatar = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  // Profile
  const username = localStorage.getItem("loginUserName");
  const imgUserLogin = !currentDomain.includes("tanphamnguyen")
    ? localStorage.getItem("imgUser")
    : "/image/logo-tpn.jpg";
  const email = localStorage.getItem("loginEmail");

  // Logout
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
      .catch(() => {});
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

        {/* Nút Notification */}
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

        {/* Nút Settings (Modbus) */}
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

        {/* Avatar + menu */}
        <Avatar
          alt="user"
          src={
            typeof imgUserLogin === "undefined" || imgUserLogin === "" || imgUserLogin === null
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
          <MenuItem onClick={handleLogOut}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
        <p className="header_username">{username}</p>
        <p className="header_mail">({email})</p>

        {/* ===== Notifications Dialog (giữ như cũ) ===== */}
        <Dialog
          open={openNoti}
          onClose={closeDialogNoti}
          aria-labelledby="notification-dialog-title"
          maxWidth="sm"
          fullWidth
          keepMounted={false}
          disableScrollLock
          TransitionComponent={TransitionUp}
          PaperProps={{
            sx: {
              minHeight: 200,
              maxHeight: 300,
              overflow: "auto",
            },
          }}
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
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {item.Content}
                          </Typography>
                        </React.Fragment>
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

        {/* ===== Modbus Settings Dialog (KHÔNG full-screen) ===== */}
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
            sx: {
              height: "80vh",          // không chiếm toàn màn hình
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <DialogTitle id="modbus-dialog-title" sx={{ pb: 1 }}>
            Modbus Configurations
          </DialogTitle>

          {/* Nội dung trang Modbus */}
      
  <DialogContent dividers sx={{ p: 0 }}>
    <div style={{ height: "100%", minHeight: 0 }}>
      {/* TRUYỀN deviceId + email vào đây */}
      {deviceId ? (
        <DeviceConfigPage deviceId={deviceId} userEmail={email} />
      ) : (
        <div style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
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