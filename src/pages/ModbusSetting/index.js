import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Button,
    Snackbar,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip,
    Fab,
    Stack,
    Chip,
    Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// ---------- Helpers ----------
const types = ["bool", "int", "float", "float-inverse"];
const functionCodes = [1, 2, 3, 4];
const memoryTypes = [0, 1, 6, 9];
const baudrates = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 256000];

const getDisplayTypeName = (memoryType) => {
    if (memoryType === 0) return "Coil (On/Off)";
    if (memoryType === 1) return "Display Value";
    if (memoryType === 6) return "Setting Value";
    if (memoryType === 9) return "Display Value 2";
    return "Other";
};

const numberFromDigits = (digits) => {
    const n = parseInt(digits, 10);
    if (!n || n <= 0) return 0;
    return (n === 1 ? 1 : 10 * Math.pow(10, n - 2)) * 10;
};
// --- helpers bool-int ---
// ---- Helpers khớp Flutter model ----
const boolTo01 = (b) => (b ? 1 : 0);
const calcEndFromStartLen = (start, length) => start + Math.max(0, Number(length || 0));
const intToBool = (n) => n === 1;

// RS485 -> Flutter toJson
const toRS485Json = (r) => {
    const data = {
        Baudrate: Number(r.baudrate),
        Parity: Number(r.parity ?? 0),
        ScanTime: Number(r.scanTime ?? 0),
        DeviceType: -1,
        IsSocket: 0,
        TryAgain: Number(r.tryAgain ?? 0),
        IsClearAll: r.isClearAll == null ? 1 : Number(r.isClearAll),
    };
    if (r.slaveIp && String(r.slaveIp).trim() !== "") data["SlaveIp"] = String(r.slaveIp).trim();
    if (r.isClearAll != null) data["IsClearAll"] = Number(r.isClearAll);
    return data;
};

// Group-Modbus -> Flutter toJson
const toGroupJson = (g) => ({
    Type: g.type,
    Start: Number(g.startAddress),
    End: calcEndFromStartLen(Number(g.startAddress), Number(g.length)), // Flutter: length = End - Start
    SlaveId: Number(g.slaveId),
    FunctionCode: Number(g.functionCode),
});

// Address-Config -> Flutter toJson (đúng điều kiện trong Flutter)
const toAddressJson = (c) => {
    const data = {
        Address: Number(c.address),
        SlaveId: Number(c.slaveId),
        Type: c.type,
        DataLength: Number(c.dataLength),
        Name: c.name,
        FunctionCode: Number(c.functionCode),
        MemoryType: Number(c.memoryType),
        GroupName: c.groupName,
    };

    // isHighAlarm / isHide / isModify
    if (c.type === "bool" && c.isHighAlarm) data["IsHighAlarm"] = 1;
    if (c.type === "int" && c.getBit >= 0 && c.isHighAlarm) data["IsHighAlarm"] = 1;
    if (c.isModify) data["IsModify"] = 1;
    if (c.type === "bool" && c.isHide) data["IsHide"] = 1;
    if (c.type === "int" && c.isHide) data["IsHide"] = 1;

    // Numeric optionals (chỉ gửi khi thỏa điều kiện)
    if (c.type !== "bool" && c.deltaValue != null && Number(c.deltaValue) !== 0) data["DeltaValue"] = Number(c.deltaValue);
    if (c.type !== "bool" && c.changingUnit != null) {
        const v = Number(c.changingUnit);
        if (v !== 0 && v !== 1) data["ChangingUnit"] = v;
    }
    if (c.type !== "bool" && c.digit != null && Number(c.digit) !== 0) data["Digit"] = Number(c.digit);

    if (c.address2 != null) data["Address2"] = Number(c.address2);
    if (c.slaveId2 != null && Number(c.slaveId2) !== 0) data["Address2"] = Number(c.slaveId2); // (giữ đúng code Flutter)

    if (c.isWriteOtherD != null) data["IsWriteOtherD"] = Number(c.isWriteOtherD);
    if (c.type !== "bool" && c.iAV != null) data["IAV"] = Number(c.iAV);

    if (c.type !== "bool" && c.unit && String(c.unit).trim() !== "") data["Unit"] = String(c.unit).trim();

    if (c.type !== "bool" && c.in_max != null) data["in_max"] = Number(c.in_max);
    if (c.type !== "bool" && c.in_min != null) data["in_min"] = Number(c.in_min);
    if (c.type !== "bool" && c.out_min != null) data["out_min"] = Number(c.out_min);
    if (c.type !== "bool" && c.out_max != null) data["out_max"] = Number(c.out_max);

    if (c.type !== "bool" && c.offset != null && Number(c.offset) !== 0) data["Offset"] = Number(c.offset);

    if (c.type !== "bool" && c.isColumn != null && c.isColumn !== false) data["IsColumn"] = boolTo01(c.isColumn);

    if (c.type !== "bool" && c.CycleTime != null && Number(c.CycleTime) > 1) data["CycleTime"] = Number(c.CycleTime);

    if (c.type !== "bool" && c.getBit >= 0) {
        data["GetBit"] = Number(c.getBit);
        // Flutter ép DeltaValue = 0.5 khi có GetBit
        data["DeltaValue"] = 0.5;
    }

    if (c.isRev != null) data["IsRev"] = Number(c.isRev);
    if (c.Range != null) data["Range"] = Number(c.Range);

    return data;
};

// End tính theo schema Flutter: length = End - Start
// => End = Start + Length  (không trừ 1)

// ---------- Main Page (JavaScript) ----------
export default function DeviceConfigPage({ deviceId, userEmail }) {

    if (!deviceId) {
        const searchParams = new URLSearchParams(window.location.search);
        const q = searchParams.get("deviceId");
        deviceId = q || ""; // nếu rỗng, sẽ tạm không fetch cho tới khi có
    }
    if (!userEmail) {
        try { userEmail = localStorage.getItem("loginEmail") || "user@example.com"; } catch (_) { userEmail = "user@example.com"; }
    }

    const [addressConfigs, setAddressConfigs] = useState([]);
    const [initialAddressConfigs, setInitialAddressConfigs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [groupModbus, setGroupModbus] = useState([]);
    const [rs485Config, setRS485Config] = useState({
        baudrate: 9600,
        slaveIp: null,
        parity: 0,
        scanTime: 0,
        deviceType: -1,
        isSocket: 0,
        tryAgain: 0,
        isClearAll: 1,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSupport, setIsSupport] = useState(false);
    const [search, setSearch] = useState("");
    const [idRadioRTUTCP, setIdRadioRTUTCP] = useState(0);
    const [selectedBaudrate, setSelectedBaudrate] = useState(9600);
    const [tcpIp, setTcpIp] = useState("192.168.0.1");
    const [port, setPort] = useState("502");
    const [deviceIPError, setDeviceIPError] = useState(null);
    const [portError, setPortError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [previousConfig, setPreviousConfig] = useState("");
    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });

    // Unsaved-change guard
    useEffect(() => {
        const handler = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [hasChanges]);

    useEffect(() => {
        (async () => {
            try {
                const token = Cookies.get("auth_token");
                const url = `https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/get-config-modbus?deviceId=${encodeURIComponent(deviceId)}`;
             
                const res = await fetch(url,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Credentials": "true",
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },

                    }
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();

                // ----- RS485-Config (Flutter keys) -----
                const rs = json["RS485-Config"] || {};
                const rsCfg = {
                    baudrate: rs["Baudrate"] ?? 9600,
                    slaveIp: rs["SlaveIp"] ?? null,
                    parity: rs["Parity"] ?? 0,
                    scanTime: rs["ScanTime"] ?? 0,
                    deviceType: -1,           // theo Flutter
                    isSocket: 0,              // theo Flutter
                    tryAgain: rs["TryAgain"] ?? 0,
                    isClearAll: rs["IsClearAll"] == null ? 1 : rs["IsClearAll"],
                };

                // ----- Group-Modbus (Flutter keys) -----
                // length = End - Start (theo Flutter)
                const groups = (json["Group-Modbus"] || []).map((g) => {
                    const start = g["Start"] ?? 0;
                    const end = g["End"] ?? start;
                    return {
                        startAddress: start,
                        endAddress: end,
                        length: Math.max(0, (end - start)),
                        type: g["Type"] || "int",
                        slaveId: g["SlaveId"] ?? 0,
                        functionCode: g["FunctionCode"] ?? 0,
                    };
                });

                // ----- Address-Config (Flutter keys) -----
                const addrs = (json["Address-Config"] || []).map((x) => ({
                    address: x["Address"],
                    slaveId: x["SlaveId"],
                    type: x["Type"],
                    dataLength: x["DataLength"],
                    isHighAlarm: intToBool(x["IsHighAlarm"] ?? 0),
                    isHide: intToBool(x["IsHide"] ?? 0),
                    name: x["Name"],
                    isModify: intToBool(x["IsModify"] ?? 0),
                    functionCode: x["FunctionCode"],
                    memoryType: x["MemoryType"],
                    groupName: x["GroupName"],
                    deltaValue: x["DeltaValue"] == null ? 0.1 : Number(x["DeltaValue"]),
                    changingUnit: x["ChangingUnit"] == null ? 1 : Number(x["ChangingUnit"]),
                    digit: x["Digit"] == null ? 0 : Number(x["Digit"]),
                    address2: x["Address2"] ?? null,
                    slaveId2: x["SlaveId2"] ?? null,
                    isWriteOtherD: x["IsWriteOtherD"] ?? null,
                    iAV: x["IAV"] ?? null,
                    unit: x["Unit"] ?? null,
                    in_min: x["in_min"] == null ? null : Number(x["in_min"]),
                    in_max: x["in_max"] == null ? null : Number(x["in_max"]),
                    out_min: x["out_min"] == null ? null : Number(x["out_min"]),
                    out_max: x["out_max"] == null ? null : Number(x["out_max"]),
                    offset: x["Offset"] == null ? 0 : Number(x["Offset"]),
                    isColumn: x["IsColumn"] == null ? false : intToBool(x["IsColumn"]),
                    CycleTime: x["CycleTime"] == null ? 0 : Number(x["CycleTime"]),
                    getBit: x["GetBit"] == null ? -1 : Number(x["GetBit"]),
                    isRev: x["IsRev"] ?? null,
                    Range: x["Range"] ?? null,
                }));

                debugger;
                setGroupModbus(groups);
                setRS485Config(rsCfg);
                setSelectedBaudrate(rsCfg.baudrate);
                const tcpMode = rsCfg.slaveIp != null ? 1 : 0;
                setIdRadioRTUTCP(tcpMode);
                setTcpIp(rsCfg.slaveIp ?? "192.168.0.1");
                setPort(String(rsCfg.baudrate ?? 502));
                setAddressConfigs(addrs);
                setInitialAddressConfigs(addrs);
                setFiltered(addrs);
                setIsSupport(true);
                setPreviousConfig(JSON.stringify(json));
            } catch (e) {
                console.error(e);
                setIsSupport(false);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [deviceId]);

    // Search filter
    useEffect(() => {
        const q = search.trim().toLowerCase();
        if (!q) return setFiltered(addressConfigs);
        setFiltered(addressConfigs.filter((c) => (c.name || "").toLowerCase().includes(q)));
    }, [search, addressConfigs]);

    useEffect(() => {
        const changed = (
            JSON.stringify(addressConfigs) !== JSON.stringify(initialAddressConfigs) ||
            idRadioRTUTCP !== (rs485Config.slaveIp ? 1 : 0) ||
            (idRadioRTUTCP === 0 && selectedBaudrate !== rs485Config.baudrate) ||
            (idRadioRTUTCP === 1 && (tcpIp !== (rs485Config.slaveIp || "") || port !== String(rs485Config.baudrate)))
        );
        setHasChanges(changed);
    }, [addressConfigs, initialAddressConfigs, idRadioRTUTCP, selectedBaudrate, tcpIp, port, rs485Config]);

    const handleDelete = (indexInFiltered) => {
        const item = filtered[indexInFiltered];
        const globalIndex = addressConfigs.findIndex((x) => x === item);
        if (globalIndex >= 0) {
            const next = addressConfigs.slice();
            next.splice(globalIndex, 1);
            setAddressConfigs(next);
        }
    };

    const handleSubmit = async () => {
        // 1) Validate pre-conditions
        if (!deviceId) {
            setSnack({ open: true, msg: "Thiếu deviceId. Vui lòng chọn trạm/thiet bi.", sev: "error" });
            return;
        }

        if (idRadioRTUTCP === 1) {
            const ipErr = tcpIp ? null : "Device IP cannot be empty";
            const pErr = port ? null : "Port cannot be empty";
            setDeviceIPError(ipErr);
            setPortError(pErr);
            if (ipErr || pErr) return;
        } else {
            // RTU: đảm bảo baudrate hợp lệ
            if (!selectedBaudrate || isNaN(Number(selectedBaudrate))) {
                setSnack({ open: true, msg: "Baudrate không hợp lệ.", sev: "error" });
                return;
            }
        }

        // 2) Tạo RS485 mới theo mode
        const nextRS =
            idRadioRTUTCP === 1
                ? { ...rs485Config, baudrate: Number(port), slaveIp: String(tcpIp).trim() }
                : { ...rs485Config, baudrate: Number(selectedBaudrate), slaveIp: null };

        // 3) Build deviceConfig theo Flutter DeviceConfig.toJson()
        const deviceConfig = {
            "RS485-Config": toRS485Json(nextRS),
            "Address-Config": addressConfigs.map(toAddressJson),
        };
        if (groupModbus && groupModbus.length > 0) {
            deviceConfig["Group-Modbus"] = groupModbus.map(toGroupJson);
        }

        // 4) Build payload giống Flutter screen trước đây (key rs485Config chứa toàn bộ)
        let prev = {};
        try {
            prev = previousConfig ? JSON.parse(previousConfig) : {};
        } catch (_) {
            prev = {};
        }
        const payload = {
            deviceId,
            email: userEmail || "user@example.com",
            previousConfig: prev,
            rs485Config: deviceConfig,
        };

        // 5) Gọi API
        try {
            const apiUrl =
                "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/update-config-modbus";
            const token = Cookies.get("auth_token");

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                            Authorization: `Bearer ${token}`,
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Credentials": "true",
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${text}`);
            }

            const text = await res.text();
            setSnack({ open: true, msg: text || "Cập nhật thành công", sev: "success" });

            // 6) Cập nhật state “đã lưu”
            setInitialAddressConfigs(addressConfigs);
            setRS485Config(nextRS);
            setHasChanges(false);
        } catch (e) {
            setSnack({
                open: true,
                msg: e?.message || "Failed to update configuration",
                sev: "error",
            });
        }
    };
    const [openAdv, setOpenAdv] = useState(false);
    const onSaveGroups = (groups) => {
        setGroupModbus(groups);
        setHasChanges(true);
    };

    const [addrDialog, setAddrDialog] = useState({ open: false, editingIndex: null, draft: null });

    const openAdd = () => {
        if (addressConfigs.length > 50) {
            setSnack({ open: true, msg: "Đã quá số 50 Tags quy định. Vui lòng liên hệ nhà cung cấp để biết thêm thông tin?", sev: "error" });
            return;
        }
        const draft = {
            address: 0,
            slaveId: 1,
            name: "",
            type: "int",
            functionCode: 3,
            memoryType: 1,
            unit: "",
            dataLength: 1,
            isHighAlarm: false,
            isHide: false,
            isModify: true,
            isColumn: false,
            groupName: "",
            deltaValue: 0.1,
            CycleTime: 0,
            offset: 0,
            changingUnit: 1,
            digit: numberFromDigits(0),
            in_min: 0,
            in_max: 0,
            out_min: 0,
            out_max: 0,
            getBit: -1,
            isRev: null,
            Range: null,
        };
        setAddrDialog({ open: true, editingIndex: null, draft });
    };

    const openEdit = (indexInFiltered) => {
        const item = filtered[indexInFiltered];
        const globalIndex = addressConfigs.findIndex((x) => x === item);
        if (globalIndex < 0) return;
        setAddrDialog({ open: true, editingIndex: globalIndex, draft: JSON.parse(JSON.stringify(addressConfigs[globalIndex])) });
    };

    const saveAddrDraft = () => {
        if (!addrDialog.draft) return;
        const d = addrDialog.draft;

        const invalidName = !d.name || d.name.includes("/") || d.name.length > 30;
        const invalidGroup = !d.groupName || d.groupName.includes("/") || d.groupName.length > 30;
        const invalidAddr = d.address === undefined || d.address === null;
        const invalidSlave = d.slaveId === undefined || d.slaveId === null;

        if (invalidName || invalidGroup || invalidAddr || invalidSlave) {
            setSnack({ open: true, msg: "Vui lòng kiểm tra lại các trường và điền đầy đủ thông tin.", sev: "error" });
            return;
        }

        if (d.type === "bool" || d.type === "int") d.dataLength = 1;
        if (d.type === "float" || d.type === "float-inverse") d.dataLength = 2;

        const next = addressConfigs.slice();
        if (addrDialog.editingIndex == null) next.push(d);
        else next[addrDialog.editingIndex] = d;
        setAddressConfigs(next);
        setAddrDialog({ open: false, editingIndex: null, draft: null });
    };

    const RTU = idRadioRTUTCP === 0;

    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>


            {isLoading ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress />
                </Box>
            ) : !isSupport ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography>Your device does not support this feature.</Typography>
                </Box>
            ) : (
                <Container maxWidth="md" sx={{ py: 1, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <Paper sx={{ p: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search by Name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Paper>

                    <Paper sx={{ p: 1 }}>
                        <RadioGroup row value={idRadioRTUTCP} onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v === 1) alert("Notice: Modbus TCP/IP is not supported when using the 4G SIM mode!");
                            setIdRadioRTUTCP(v);
                            setHasChanges(true);
                        }}>
                            <FormControlLabel value={0} control={<Radio />} label="MODBUS RTU" />
                            <FormControlLabel value={1} control={<Radio />} label="MODBUS TCP/IP" />
                        </RadioGroup>

                        {RTU ? (
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                                <Typography variant="body1">Select Baudrate (RTU-8N1)</Typography>
                                <FormControl size="small" sx={{ width: 180 }}>
                                    <InputLabel>Baudrate</InputLabel>
                                    <Select label="Baudrate" value={selectedBaudrate} onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setSelectedBaudrate(v);
                                        setRS485Config((prev) => ({ ...prev, baudrate: v }));
                                        setHasChanges(true);
                                    }}>
                                        {baudrates.map((b) => (
                                            <MenuItem key={b} value={b}>{b}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        ) : (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Device IP"
                                    value={tcpIp}
                                    onChange={(e) => setTcpIp(e.target.value)}
                                    error={!!deviceIPError}
                                    helperText={deviceIPError || ""}
                                    inputProps={{ inputMode: "decimal" }}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label="Port"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    error={!!portError}
                                    helperText={portError || ""}
                                    type="number"
                                    size="small"
                                    sx={{ width: { xs: "100%", sm: 160 } }}
                                />
                            </Stack>
                        )}
                    </Paper>

                    <Paper sx={{ p: 1 }}>
                        <Stack direction="row" alignItems="center">
                            <Typography variant="body1">Advance Settings</Typography>
                            <Box sx={{ flexGrow: 1 }} />
                            <Tooltip title="Open advanced Modbus settings">
                                <IconButton onClick={() => setOpenAdv(true)}>
                                    <SettingsOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Paper>

                    <Paper sx={{ p: 0, flex: 1, overflow: "auto" }}>
                        <List dense>
                            {filtered.map((cfg, index) => (
                                <ListItem key={`${cfg.name}-${index}`} divider alignItems="flex-start">
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography variant="subtitle1" fontWeight={600}>{cfg.name}</Typography>
                                                <Chip size="small" label={cfg.type} />
                                                <Chip size="small" label={getDisplayTypeName(cfg.memoryType)} />
                                            </Stack>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2">Address: {cfg.address} | Slave ID: {cfg.slaveId}</Typography>
                                                <Typography variant="body2">Function: {cfg.functionCode} | Group: {cfg.groupName}</Typography>
                                            </>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Edit">
                                            <IconButton edge="end" onClick={() => openEdit(index)}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton edge="end" onClick={() => handleDelete(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    <Box sx={{ height: 88 }} />
                </Container>
            )}

            {/* Floating buttons */}
            <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 16, display: "flex", justifyContent: "center", gap: 2 }}>
                <Stack spacing={2} alignItems="center">
                    {hasChanges && (
                        <Fab color="error" variant="extended" onClick={handleSubmit} aria-label="save">
                            <SaveIcon sx={{ mr: 1 }} /> Update
                        </Fab>
                    )}
                    {isSupport && (
                        <Fab color="primary" onClick={openAdd} aria-label="Save">
                            <AddIcon />
                        </Fab>
                    )}
                </Stack>
            </Box>

            {/* Dialogs */}
            <AdvancedSettingsDialog
                open={openAdv}
                onClose={() => setOpenAdv(false)}
                groups={groupModbus}
                onSave={(g) => { onSaveGroups(g); setOpenAdv(false); }}
            />
            <AddressDialog
                open={addrDialog.open}
                isEdit={addrDialog.editingIndex !== null}   // <-- thêm dòng này
                draft={addrDialog.draft}
                onClose={() => setAddrDialog({ open: false, editingIndex: null, draft: null })}
                onChange={(d) => setAddrDialog((s) => ({ ...s, draft: d }))}
                onSave={saveAddrDraft}
            />

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
                <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

// ---------- Address Add/Edit Dialog (JS) ----------
function AddressDialog({ open, isEdit, draft, onClose, onChange, onSave }) {
    const local = draft || {};
    const isBool = local.type === "bool";

    const setField = (key, val) => {
        onChange({ ...(local || {}), [key]: val });
    };
    const setFields = (patch) => {
        onChange({ ...(local || {}), ...patch });
    };

    const handleTypeChange = (newType) => {
        if (!newType) return;
        // Luôn chỉnh dataLength theo type
        const next = {
            type: newType,
            dataLength: (newType === "float" || newType === "float-inverse") ? 2 : 1,
        };

        // CHỈ áp mặc định khi THÊM MỚI (giống Flutter: !isEditing)
        if (!isEdit) {
            if (newType === "bool") {
                next.functionCode = 1;
                next.memoryType = 0;
            } else {
                next.functionCode = 3;
                next.memoryType = 1;
            }
        }
        setFields(next);
    };

    // Đồng bộ dataLength theo type nếu đang lệch; KHÔNG ép memoryType khi edit
    useEffect(() => {
        if (!draft) return;
        const wantLen = (draft.type === "float" || draft.type === "float-inverse") ? 2 : 1;
        if (draft.dataLength !== wantLen) setField("dataLength", wantLen);
        // Không set functionCode/memoryType ở đây để tránh ghi đè khi Edit
        // (Flutter cũng chỉ set mặc định khi thêm mới)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft && draft.type, open]);

    const showAnalogScale =
        local.in_min != null || local.in_max != null || local.out_min != null || local.out_max != null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? "Chỉnh sửa cấu hình" : "Thêm cấu hình"}</DialogTitle>
            <DialogContent dividers>
                {!draft ? (
                    <Typography variant="body2">No data</Typography>
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography>Address type:</Typography>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <Select
                                    value={local.type}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                >
                                    {types.map((t) => (
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

                        <TextField
                            label="Name"
                            size="small"
                            value={local.name || ""}
                            onChange={(e) => setField("name", e.target.value)}
                        />

                        {!isBool && local.memoryType !== 0 && (
                            <TextField
                                label="Unit"
                                size="small"
                                value={local.unit || ""}
                                onChange={(e) => setField("unit", e.target.value)}
                            />
                        )}

                        <TextField
                            label="Group Name"
                            size="small"
                            value={local.groupName || ""}
                            onChange={(e) => setField("groupName", e.target.value)}
                        />

                        <TextField
                            label="Address"
                            size="small"
                            type="number"
                            value={local.address ?? 0}
                            onChange={(e) => setField("address", Number(e.target.value))}
                        />

                        <TextField
                            label="Slave ID"
                            size="small"
                            type="number"
                            value={local.slaveId ?? 1}
                            onChange={(e) => setField("slaveId", Number(e.target.value))}
                        />

                        {!isBool && local.memoryType !== 0 && (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField
                                    label="Constant"
                                    size="small"
                                    type="number"
                                    value={local.changingUnit ?? 1}
                                    onChange={(e) => setField("changingUnit", Number(e.target.value))}
                                />
                                <TextField
                                    label="Fractional Digit"
                                    size="small"
                                    type="number"
                                    value={local.digit ? String(Math.log10(local.digit)) : "0"}
                                    onChange={(e) => setField("digit", numberFromDigits(Number(e.target.value)))}
                                />
                            </Stack>
                        )}

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Function code</InputLabel>
                                <Select
                                    label="Function code"
                                    value={local.functionCode ?? 3}
                                    onChange={(e) => setField("functionCode", Number(e.target.value))}
                                >
                                    {functionCodes.map((c) => (
                                        <MenuItem key={c} value={c}>
                                            {c}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Display type</InputLabel>
                                <Select
                                    label="Display type"
                                    value={Number(local.memoryType ?? 1)}        // <— ép về number
                                    onChange={(e) => setField("memoryType", Number(e.target.value))}
                                >
                                    {memoryTypes.map((m) => (
                                        <MenuItem key={m} value={m}>{getDisplayTypeName(m)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

                        {isBool && (
                            <>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!local.isHighAlarm}
                                            onChange={(e) => setField("isHighAlarm", e.target.checked)}
                                        />
                                    }
                                    label="Alarm Coil"
                                />
                                {!!local.isHighAlarm && (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={!!local.isHide}
                                                onChange={(e) => setField("isHide", e.target.checked)}
                                            />
                                        }
                                        label="Hide"
                                    />
                                )}
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!local.isModify}
                                            onChange={(e) => setField("isModify", e.target.checked)}
                                        />
                                    }
                                    label="Read/Write"
                                />
                            </>
                        )}

                        {!isBool && (
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    Advance Settings
                                </AccordionSummary>
                                <AccordionDetails>
                                    {local.type === "int" && local.memoryType === 0 && (
                                        <TextField
                                            label="Bit Position"
                                            size="small"
                                            type="number"
                                            value={local.getBit ?? -1}
                                            onChange={(e) => setField("getBit", Number(e.target.value))}
                                        />
                                    )}
                                    {local.memoryType !== 0 && (
                                        <TextField
                                            sx={{ mt: 2 }}
                                            label="Delta Value"
                                            size="small"
                                            type="number"
                                            value={local.deltaValue ?? 0.1}
                                            onChange={(e) => setField("deltaValue", Number(e.target.value))}
                                        />
                                    )}
                                    {local.memoryType === 1 && (
                                        <>
                                            <TextField
                                                sx={{ mt: 2 }}
                                                label="Cycle Time"
                                                size="small"
                                                type="number"
                                                value={local.CycleTime ?? 0}
                                                onChange={(e) => setField("CycleTime", Number(e.target.value))}
                                            />
                                            <TextField
                                                sx={{ mt: 2 }}
                                                label="Offset"
                                                size="small"
                                                type="number"
                                                value={local.offset ?? 0}
                                                onChange={(e) => setField("offset", Number(e.target.value))}
                                            />
                                            <FormControlLabel
                                                sx={{ mt: 1 }}
                                                control={
                                                    <Switch
                                                        checked={!!local.isColumn}
                                                        onChange={(e) => setField("isColumn", e.target.checked)}
                                                    />
                                                }
                                                label="Column Chart"
                                            />
                                        </>
                                    )}

                                    <FormControlLabel
                                        sx={{ mt: 1 }}
                                        control={
                                            <Switch
                                                checked={!!showAnalogScale}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setField("in_min", local.in_min ?? 0);
                                                        setField("in_max", local.in_max ?? 100);
                                                        setField("out_min", local.out_min ?? 0);
                                                        setField("out_max", local.out_max ?? 100);
                                                    } else {
                                                        setField("in_min", null);
                                                        setField("in_max", null);
                                                        setField("out_min", null);
                                                        setField("out_max", null);
                                                    }
                                                }}
                                            />
                                        }
                                        label="Analog Scale"
                                    />

                                    {showAnalogScale && (
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                                            <TextField
                                                label="Convert Value Min"
                                                size="small"
                                                type="number"
                                                value={local.in_min ?? 0}
                                                onChange={(e) => setField("in_min", Number(e.target.value))}
                                            />
                                            <TextField
                                                label="Convert Value Max"
                                                size="small"
                                                type="number"
                                                value={local.in_max ?? 0}
                                                onChange={(e) => setField("in_max", Number(e.target.value))}
                                            />
                                            <TextField
                                                label="Analog Value Min"
                                                size="small"
                                                type="number"
                                                value={local.out_min ?? 0}
                                                onChange={(e) => setField("out_min", Number(e.target.value))}
                                            />
                                            <TextField
                                                label="Analog Value Max"
                                                size="small"
                                                type="number"
                                                value={local.out_max ?? 0}
                                                onChange={(e) => setField("out_max", Number(e.target.value))}
                                            />
                                        </Stack>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={onSave} variant="contained">
                    {isEdit ? "Lưu" : "Thêm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ---------- Advanced Settings (Group Modbus) (JS) ----------
function AdvancedSettingsDialog({ open, onClose, groups, onSave }) {
    const [local, setLocal] = useState([]);

    useEffect(() => {
        if (open) {
            setLocal((groups || []).map((g) => ({ ...g })));
        }
    }, [open, groups]);

    const calcEnd = (g) => ({ ...g, endAddress: g.startAddress + g.length - 1 });

    const addGroup = () => {
        if (local.length >= 10) return;
        setLocal((prev) => [...prev, calcEnd({ startAddress: 0, length: 1, endAddress: 0, functionCode: 0, slaveId: 0, type: "int" })]);
    };
    const update = (i, patch) => {
        setLocal((prev) => {
            const next = prev.slice();
            next[i] = calcEnd({ ...next[i], ...patch });
            return next;
        });
    };
    const remove = (i) => {
        setLocal((prev) => prev.filter((_, idx) => idx !== i));
    };

    return (
        <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="sm">
            <DialogTitle>Advance Modbus Settings</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2}>
                    {local.map((g, i) => (
                        <Paper key={i} sx={{ p: 2 }} elevation={3}>
                            <Typography variant="subtitle1" fontWeight={700}>Modbus Group {i + 1}</Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                                <TextField label="Start Address" size="small" type="number" value={g.startAddress}
                                    onChange={(e) => update(i, { startAddress: Number(e.target.value) })} />
                                <TextField label="Length" size="small" type="number" value={g.length}
                                    onChange={(e) => update(i, { length: Math.max(1, Number(e.target.value)) })} />
                                <TextField label="Function Code" size="small" type="number" value={g.functionCode}
                                    onChange={(e) => update(i, { functionCode: Number(e.target.value) })} />
                                <TextField label="Slave ID" size="small" type="number" value={g.slaveId}
                                    onChange={(e) => update(i, { slaveId: Number(e.target.value) })} />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select label="Type" value={g.type} onChange={(e) => update(i, { type: e.target.value })}>
                                        {types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Stack>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                <Typography variant="body2">End Address: <b>{g.endAddress}</b></Typography>
                                <IconButton onClick={() => remove(i)}><DeleteIcon /></IconButton>
                            </Box>
                        </Paper>
                    ))}
                    {local.length < 10 && (
                        <Button onClick={addGroup} variant="outlined">Add Group</Button>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button onClick={() => { onSave(local); }} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
