import moment from "moment";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import "../../components/Layout/Header";
import "./Monitor.scss";

import { getDatabase, onValue, ref } from "firebase/database";

import { Autocomplete, Button, Grid, TextField, Tooltip, ToggleButton, ToggleButtonGroup } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import SearchIcon from "@mui/icons-material/Search";

import Loading from "../../components/Loading";
import SubHeader from "../../components/SubHeader";
import compareDate from "../../utils/compare_date";
import { getUniqueListBy } from "../../utils/function";
import { dbStore } from "../../config/firebase";
import { TIME_DEVICE_OFF, colorStationStatus } from "../../constants";
import { getDocs, collection } from "firebase/firestore";
import { styleStateValue } from "../../utils/styleStateValue";

// Station Card Component
const StationCard = ({ station, onQuickView }) => {
    const isOnline = station.status_station?.includes("ON");
    const sensors = station.data_sensor || [];
    const coils = station.coil_data || [];

    // Get alarm coils (IsHighAlarm=true and Value=1)
    const alarmCoils = coils.filter(c => c.IsHighAlarm && c.Value === 1);

    // Hide card if no sensors and no alarm coils
    if (sensors.length === 0 && alarmCoils.length === 0) return null;

    // Check states
    const hasError = sensors.some(s => s.StateNum === 2) || alarmCoils.length > 0;
    const hasCalib = sensors.some(s => s.StateNum === 1);

    // Determine card class - offline or error gets gray sensors
    const shouldGraySensors = !isOnline || hasError;

    return (
        <div className={`station-card ${isOnline ? 'online' : 'offline'} ${hasError ? 'has-error' : ''}`}>
            {/* Header */}
            <div className="station-card-header">
                <div className="station-info">
                    <h3 className="station-name">{station.full_name || station.id_station}</h3>
                    <span className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                </div>
                <Tooltip title="Xem chi tiết">
                    <button
                        className="quick-view-btn"
                        onClick={() => onQuickView(station.id_station)}
                    >
                        <OpenInNewIcon fontSize="small" />
                    </button>
                </Tooltip>
            </div>

            {/* Alarm Indicators */}
            {alarmCoils.length > 0 && (
                <div className="alarm-indicators">
                    {alarmCoils.map((coil, idx) => (
                        <span key={idx} className="alarm-chip">
                            <WarningIcon sx={{ fontSize: 12 }} />
                            {coil.Name}
                        </span>
                    ))}
                </div>
            )}

            {/* Time */}
            <div className="station-time">
                <AccessTimeIcon fontSize="small" />
                <span>{station.last_time}</span>
            </div>

            {/* Sensors Grid */}
            {sensors.length > 0 && (
                <div className="sensors-grid">
                    {sensors.map((sensor, idx) => {
                        const value = sensor.Value;
                        const stateNum = sensor.StateNum || 0;
                        const unit = sensor.Unit || '';

                        // If offline or has error, use gray; otherwise use normal state color
                        let sensorStyle;
                        if (!isOnline) {
                            sensorStyle = { backgroundColor: colorStationStatus.off, color: 'white', padding: '5px', borderRadius: '5px', fontSize: '14px' };
                        } else {
                            sensorStyle = styleStateValue(`${value}*${stateNum}`);
                        }

                        return (
                            <div
                                key={idx}
                                className="sensor-item"
                                style={sensorStyle}
                            >
                                <div className="sensor-name">{sensor.Name}</div>
                                <div className="sensor-value">
                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                    <span className="sensor-unit">{unit}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Helper to get station priority for sorting
const getStationPriority = (station) => {
    const isOnline = station.status_station?.includes("ON");
    const sensors = station.data_sensor || [];
    const coils = station.coil_data || [];

    const hasError = sensors.some(s => s.StateNum === 2) || coils.some(c => c.IsHighAlarm && c.Value === 1);
    const hasCalib = sensors.some(s => s.StateNum === 1);

    if (!isOnline) return 3; // Offline last
    if (hasError) return 0;  // Error first
    if (hasCalib) return 1;  // Calib second
    return 2;                // Normal third
};

function Monitor() {
    const [dataChange, setDataChange] = useState(false);
    const [valueSelect, setValueSelect] = useState("");
    const [menuValue, setMenuSelect] = useState([]);
    const [monitorAll, setMonitorAll] = useState(true);
    const [deviceTypeValue, setDeviceTypeChoose] = useState("");
    const [listDeviceType, setListDeviceType] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all"); // all, online, offline, error, calib
    const [searchText, setSearchText] = useState("");

    let allSettingData = {};
    const db = getDatabase();
    const dataRealTime = useRef([]);

    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);

    let devices = [];
    useEffect(() => {
        if (listDevice) {
            const id = Object.keys(listDevice);
            let listTypeDevice = new Set();
            id.map((v) => {
                devices.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                    type: listDevice[v]["DeviceType"],
                });
                listTypeDevice.add(listDevice[v]["DeviceType"]);
            });
            setListDeviceType([...listTypeDevice]);
        }
        setMenuSelect(devices);
    }, []);

    // Get realtime data
    useEffect(() => {
        if (devices && devices.length > 0) {
            devices.map((v) => {
                return onValue(
                    ref(db, `Devices/DAIVIET-RS485/${v.id}`),
                    async (snapshot) => {
                        let { RS485Data, Location, LastTime } = snapshot.val();

                        // Filter sensors (MemoryType === 1 and not IsColumn)
                        const sensorData = RS485Data.filter(
                            (item) => item.MemoryType === 1 && !item.IsColumn
                        );

                        // Get coils with IsHighAlarm
                        const coilData = RS485Data.filter(
                            (item) => item.MemoryType === 0 && item.IsHighAlarm
                        );

                        Location = v.id;

                        let lastTime = moment(LastTime.slice(0, -1)).format(
                            "HH:mm DD/MM/YYYY"
                        );
                        let timeC = moment(LastTime.slice(0, -1)).format("HH:mm");
                        let timeP = moment(Date())
                            .subtract(TIME_DEVICE_OFF, "minutes")
                            .format("HH:mm");

                        let dateC = moment(LastTime.slice(0, -1)).format("MM/DD/YYYY");
                        let dateP = moment(Date()).format("MM/DD/YYYY");

                        let compare = compareDate(dateC, dateP);

                        // Get alarm settings
                        if (typeof allSettingData[v.id] === "undefined") {
                            allSettingData[v.id] = {};
                            for (var i = 0; i < sensorData.length; i++) {
                                let sensorItem = sensorData[i];
                                allSettingData[v.id][sensorItem.GroupName] = sensorItem.GroupName;
                            }
                            for (let groupName in allSettingData[v.id]) {
                                const querySnapshot = await getDocs(
                                    collection(dbStore, `SensorSettings/${Location}/${groupName}`)
                                );
                                allSettingData[v.id][groupName] = querySnapshot;
                            }
                        }

                        for (let i = 0; i < sensorData.length; i++) {
                            let sensorItem = sensorData[i];
                            sensorItem.AlarmSetting = {};
                            for (let groupName in allSettingData[v.id]) {
                                allSettingData[v.id][groupName].forEach((doc) => {
                                    if (doc.id === sensorItem.Name) {
                                        sensorItem.AlarmSetting = doc.data();
                                    }
                                });
                            }
                        }

                        const isOffline = typeof snapshot.val().IsSendingAlarm !== "undefined" &&
                            snapshot.val().IsSendingAlarm === true
                            ? true
                            : timeC < timeP || compare === 1;

                        dataRealTime.current.push({
                            id_station: v.id,
                            data_sensor: sensorData,
                            coil_data: coilData,
                            location: Location,
                            last_time: lastTime,
                            full_name: v.label,
                            deviceType: v.type,
                            status_station: isOffline ? `OFF*${"NOOK"}` : `ON*${"0"}`,
                        });

                        setDataChange({ last_time: LastTime });
                    }
                );
            });
        }
    }, []);

    // Get unique stations
    const stations = useMemo(() => {
        if (!dataChange) return [];
        return getUniqueListBy(dataRealTime.current, "location");
    }, [dataChange]);

    // Check if any station has calib state
    const hasCalibStations = useMemo(() => {
        return stations.some(s => s.data_sensor?.some(d => d.StateNum === 1));
    }, [stations]);

    // Filtered and sorted stations
    const filteredStations = useMemo(() => {
        let result = [...stations];

        // Apply station/device type filter
        if (!monitorAll) {
            if (valueSelect) {
                result = result.filter((s) => s.id_station === valueSelect.id);
            } else if (deviceTypeValue) {
                result = result.filter((s) => s.deviceType === deviceTypeValue);
            }
        }

        // Apply search filter
        if (searchText.trim()) {
            const search = searchText.toLowerCase().trim();
            result = result.filter(s =>
                s.full_name?.toLowerCase().includes(search) ||
                s.id_station?.toLowerCase().includes(search)
            );
        }

        // Apply status filter
        if (statusFilter === "online") {
            result = result.filter(s => s.status_station?.includes("ON"));
        } else if (statusFilter === "offline") {
            result = result.filter(s => s.status_station?.includes("OFF"));
        } else if (statusFilter === "error") {
            result = result.filter(s => {
                const hasAlarmCoil = s.coil_data?.some(c => c.IsHighAlarm && c.Value === 1);
                const hasSensorError = s.data_sensor?.some(d => d.StateNum === 2);
                return hasAlarmCoil || hasSensorError;
            });
        } else if (statusFilter === "calib") {
            result = result.filter(s => s.data_sensor?.some(d => d.StateNum === 1));
        }

        // Sort: error first, calib second, normal third, offline last
        result.sort((a, b) => getStationPriority(a) - getStationPriority(b));

        return result;
    }, [stations, monitorAll, valueSelect, deviceTypeValue, statusFilter, searchText]);

    const handleOnChangeSelectStation = (e, v) => {
        if (v !== null) {
            setValueSelect(v);
            setMonitorAll(false);
            setDeviceTypeChoose("");
        }
    };

    const handleOnchangeDeviceType = (e, v) => {
        if (v !== null) {
            setDeviceTypeChoose(v);
            setMonitorAll(false);
            setValueSelect("");
        }
    };

    const handleMonitorAll = () => {
        setMonitorAll(true);
        setDeviceTypeChoose("");
        setValueSelect("");
    };

    const handleStatusFilter = (e, newFilter) => {
        if (newFilter !== null) {
            setStatusFilter(newFilter);
        }
    };

    const handleQuickView = (stationId) => {
        window.open(`${window.location.origin}/?deviceId=${stationId}`, "_blank");
    };

    // Counts for filter buttons
    const statusCounts = useMemo(() => {
        let baseStations = stations;
        if (!monitorAll) {
            if (valueSelect) {
                baseStations = baseStations.filter((s) => s.id_station === valueSelect.id);
            } else if (deviceTypeValue) {
                baseStations = baseStations.filter((s) => s.deviceType === deviceTypeValue);
            }
        }

        // Apply search filter to counts too
        if (searchText.trim()) {
            const search = searchText.toLowerCase().trim();
            baseStations = baseStations.filter(s =>
                s.full_name?.toLowerCase().includes(search) ||
                s.id_station?.toLowerCase().includes(search)
            );
        }

        return {
            all: baseStations.length,
            online: baseStations.filter(s => s.status_station?.includes("ON")).length,
            offline: baseStations.filter(s => s.status_station?.includes("OFF")).length,
            error: baseStations.filter(s => {
                const hasAlarmCoil = s.coil_data?.some(c => c.IsHighAlarm && c.Value === 1);
                const hasSensorError = s.data_sensor?.some(d => d.StateNum === 2);
                return hasAlarmCoil || hasSensorError;
            }).length,
            calib: baseStations.filter(s => s.data_sensor?.some(d => d.StateNum === 1)).length,
        };
    }, [stations, monitorAll, valueSelect, deviceTypeValue, searchText]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const deviceType = searchParams.get("deviceType");
        if (deviceType && stations.length > 0) {
            handleOnchangeDeviceType("", deviceType);
        }
    }, [stations]);

    return (
        <>
            {stations.length > 0 ? (
                <div className="monitor_page">
                    <SubHeader text={"GIÁM SÁT NHIỀU TRẠM"} />

                    {/* Filters */}
                    <div className="monitor_page-select">
                        <Grid container spacing={2} alignItems="center">
                            {/* Search by name */}
                            <Grid item xl={3} lg={3} md={6} sm={12} xs={12}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Tìm theo tên trạm..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: '#9ca3af', mr: 1 }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xl={2} lg={2} md={6} sm={12} xs={12}>
                                <Autocomplete
                                    disablePortal
                                    id="device-type-select"
                                    size="small"
                                    color="success"
                                    onChange={handleOnchangeDeviceType}
                                    value={deviceTypeValue || null}
                                    getOptionLabel={(option) => option}
                                    options={listDeviceType}
                                    fullWidth
                                    renderInput={(params) => (
                                        <TextField {...params} fullWidth label="Loại trạm" />
                                    )}
                                />
                            </Grid>
                            <Grid item xl={2} lg={2} md={4} sm={6} xs={12}>
                                <Button
                                    variant="contained"
                                    style={{ backgroundColor: "#088f81" }}
                                    fullWidth
                                    onClick={handleMonitorAll}
                                >
                                    TẤT CẢ ({stations.length})
                                </Button>
                            </Grid>
                            <Grid item xl={5} lg={5} md={8} sm={12} xs={12}>
                                <ToggleButtonGroup
                                    value={statusFilter}
                                    exclusive
                                    onChange={handleStatusFilter}
                                    size="small"
                                    fullWidth
                                    sx={{ height: 40 }}
                                >
                                    <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: 12 }}>
                                        Tất cả ({statusCounts.all})
                                    </ToggleButton>
                                    <ToggleButton value="online" sx={{ textTransform: 'none', fontSize: 12, color: '#22c55e' }}>
                                        Online ({statusCounts.online})
                                    </ToggleButton>
                                    <ToggleButton value="offline" sx={{ textTransform: 'none', fontSize: 12, color: '#ef4444' }}>
                                        Offline ({statusCounts.offline})
                                    </ToggleButton>
                                    <ToggleButton value="error" sx={{ textTransform: 'none', fontSize: 12, color: '#f97316' }}>
                                        Lỗi ({statusCounts.error})
                                    </ToggleButton>
                                    {hasCalibStations && (
                                        <ToggleButton value="calib" sx={{ textTransform: 'none', fontSize: 12, color: '#eab308' }}>
                                            Calib ({statusCounts.calib})
                                        </ToggleButton>
                                    )}
                                </ToggleButtonGroup>
                            </Grid>
                        </Grid>
                    </div>

                    {/* Station Cards Grid */}
                    <div className="stations-grid">
                        {filteredStations.map((station, idx) => (
                            <StationCard
                                key={station.id_station || idx}
                                station={station}
                                onQuickView={handleQuickView}
                            />
                        ))}
                        {filteredStations.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: 40,
                                color: '#64748b'
                            }}>
                                Không có trạm nào phù hợp với bộ lọc
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <Loading />
            )}
        </>
    );
}

export default Monitor;
