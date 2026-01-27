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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import DownloadIcon from "@mui/icons-material/Download";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SensorsIcon from "@mui/icons-material/Sensors";
import TuneIcon from "@mui/icons-material/Tune";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FolderIcon from "@mui/icons-material/Folder";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

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

// ---------- Color Helpers for MemoryType Badges ----------
const getTypeColor = (memoryType) => {
    switch (memoryType) {
        case 0: return "#2196F3"; // Coil - blue
        case 1: return "#4CAF50"; // Sensor - green
        case 6: return "#FF9800"; // Setting - orange
        case 9: return "#9C27B0"; // Display Value 2 - purple
        default: return "#9E9E9E"; // grey
    }
};

const getTypeLabel = (memoryType) => {
    switch (memoryType) {
        case 0: return "COIL";
        case 1: return "SENSOR";
        case 6: return "SETTING";
        case 9: return "DISP2";
        default: return `T${memoryType}`;
    }
};

const getTypeIcon = (memoryType) => {
    switch (memoryType) {
        case 0: return ToggleOnIcon;
        case 1: return SensorsIcon;
        case 6: return TuneIcon;
        case 9: return RadioButtonCheckedIcon;
        default: return SensorsIcon;
    }
};

// ---------- Quick Templates ----------
const configTemplates = [
    {
        id: "sensor",
        name: "Đọc Sensor",
        description: "Đọc giá trị cảm biến (Holding Register)",
        icon: SensorsIcon,
        color: "#4CAF50",
        defaults: {
            type: "int",
            functionCode: 3,
            memoryType: 1,
            dataLength: 1,
            isModify: false,
            isHighAlarm: false,
        }
    },
    {
        id: "setting",
        name: "Đọc/Ghi Thanh Ghi",
        description: "Thanh ghi có thể chỉnh sửa",
        icon: TuneIcon,
        color: "#FF9800",
        defaults: {
            type: "int",
            functionCode: 3,
            memoryType: 6,
            dataLength: 1,
            isModify: true,
            isHighAlarm: false,
        }
    },
    {
        id: "coil",
        name: "Điều Khiển Coil",
        description: "Điều khiển ON/OFF (Coil)",
        icon: ToggleOnIcon,
        color: "#2196F3",
        defaults: {
            type: "bool",
            functionCode: 1,
            memoryType: 0,
            dataLength: 1,
            isModify: true,
            isHighAlarm: false,
        }
    },
    {
        id: "input",
        name: "Giám Sát Input",
        description: "Đọc trạng thái input (Discrete)",
        icon: RadioButtonCheckedIcon,
        color: "#607D8B",
        defaults: {
            type: "bool",
            functionCode: 2,
            memoryType: 0,
            dataLength: 1,
            isModify: false,
            isHighAlarm: false,
        }
    },
    {
        id: "alarm",
        name: "Cảnh Báo Alarm",
        description: "Coil gửi cảnh báo khi ON",
        icon: WarningAmberIcon,
        color: "#F44336",
        defaults: {
            type: "bool",
            functionCode: 1,
            memoryType: 0,
            dataLength: 1,
            isModify: false,
            isHighAlarm: true,
            isHide: true,
        }
    },
];

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
export default function DeviceConfigPage({ deviceId, deviceName, userEmail }) {

    // Vietnamese diacritics removal for search
    const removeVietnameseDiacritics = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    };

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

    // ---------- New States for Enhanced Features ----------
    // Group Filter
    const [selectedGroupFilter, setSelectedGroupFilter] = useState(null);
    const [uniqueGroups, setUniqueGroups] = useState([]);

    // Template Selection Dialog
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

    // Context Menu for config items
    const [contextMenu, setContextMenu] = useState({ anchorEl: null, config: null, index: -1 });

    // Export/Import Dialog
    const [exportImportDialogOpen, setExportImportDialogOpen] = useState(false);

    // Review Changes Dialog
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewChanges, setReviewChanges] = useState({ added: [], modified: [], deleted: [], reordered: false });

    // Move to Group Dialog
    const [moveGroupDialogOpen, setMoveGroupDialogOpen] = useState(false);
    const [moveGroupTarget, setMoveGroupTarget] = useState({ config: null, index: -1 });

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
        // Reset ALL states when deviceId changes
        setAddressConfigs([]);
        setInitialAddressConfigs([]);
        setFiltered([]);
        setHasChanges(false);
        setSearch("");
        setSelectedGroupFilter(null);
        setIsLoading(true);

        // Close all dialogs to prevent showing old data
        setAddrDialog({ open: false, editingIndex: null, draft: null });
        setTemplateDialogOpen(false);
        setReviewDialogOpen(false);
        setContextMenu({ anchorEl: null, config: null, index: -1 });

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

    // Search filter + Group filter
    useEffect(() => {
        // Extract unique groups
        const groups = [...new Set(addressConfigs.map(c => c.groupName).filter(Boolean))];
        setUniqueGroups(groups);

        // Apply filters
        let result = addressConfigs;

        // Group filter
        if (selectedGroupFilter) {
            result = result.filter(c => c.groupName === selectedGroupFilter);
        }

        // Search filter (Vietnamese diacritics-insensitive)
        const q = removeVietnameseDiacritics(search.trim());
        if (q) {
            result = result.filter((c) => removeVietnameseDiacritics(c.name || "").includes(q));
        }

        setFiltered(result);
    }, [search, addressConfigs, selectedGroupFilter]);

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

    // Drag-and-drop reorder state
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDragIndex(index);
        setDragOverIndex(null);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIndex) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }
        // Reorder in addressConfigs (global array)
        const dragItem = filtered[dragIndex];
        const dropItem = filtered[dropIndex];
        const globalDragIndex = addressConfigs.findIndex((x) => x === dragItem);
        const globalDropIndex = addressConfigs.findIndex((x) => x === dropItem);

        if (globalDragIndex >= 0 && globalDropIndex >= 0) {
            const next = [...addressConfigs];
            const [removed] = next.splice(globalDragIndex, 1);
            next.splice(globalDropIndex, 0, removed);
            setAddressConfigs(next);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    // ---------- New Handlers ----------

    // Duplicate config with address+1
    const handleDuplicate = (config, indexInFiltered) => {
        const globalIndex = addressConfigs.findIndex((x) => x === config);
        const newConfig = {
            ...config,
            name: `${config.name} (Copy)`,
            address: config.address + 1,
        };
        const next = [...addressConfigs];
        next.splice(globalIndex + 1, 0, newConfig);
        setAddressConfigs(next);
        setSnack({ open: true, msg: `Đã nhân bản "${config.name}"`, sev: "success" });
        setContextMenu({ anchorEl: null, config: null, index: -1 });
    };

    // Move config to new group
    const handleMoveToGroup = (newGroup) => {
        if (!moveGroupTarget.config) return;
        const globalIndex = addressConfigs.findIndex((x) => x === moveGroupTarget.config);
        if (globalIndex >= 0) {
            const next = [...addressConfigs];
            next[globalIndex] = { ...next[globalIndex], groupName: newGroup };
            setAddressConfigs(next);
            setSnack({ open: true, msg: `Đã chuyển "${moveGroupTarget.config.name}" sang nhóm "${newGroup}"`, sev: "success" });
        }
        setMoveGroupDialogOpen(false);
        setMoveGroupTarget({ config: null, index: -1 });
    };

    // Export JSON to clipboard
    const handleExportJSON = async () => {
        const deviceConfig = {
            "RS485-Config": toRS485Json(rs485Config),
            "Address-Config": addressConfigs.map(toAddressJson),
        };
        if (groupModbus && groupModbus.length > 0) {
            deviceConfig["Group-Modbus"] = groupModbus.map(toGroupJson);
        }
        try {
            await navigator.clipboard.writeText(JSON.stringify(deviceConfig, null, 2));
            setSnack({ open: true, msg: "Đã copy JSON vào clipboard", sev: "success" });
        } catch (e) {
            setSnack({ open: true, msg: "Không thể copy JSON", sev: "error" });
        }
        setExportImportDialogOpen(false);
    };

    // Import JSON from clipboard
    const handleImportJSON = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const json = JSON.parse(text);

            // Parse Address-Config
            if (json["Address-Config"] && Array.isArray(json["Address-Config"])) {
                const addrs = json["Address-Config"].map((x) => ({
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
                    deltaValue: x["DeltaValue"] ?? 0.1,
                    changingUnit: x["ChangingUnit"] ?? 1,
                    digit: x["Digit"] ?? 0,
                    unit: x["Unit"] ?? null,
                    in_min: x["in_min"] ?? null,
                    in_max: x["in_max"] ?? null,
                    out_min: x["out_min"] ?? null,
                    out_max: x["out_max"] ?? null,
                    offset: x["Offset"] ?? 0,
                    isColumn: intToBool(x["IsColumn"] ?? 0),
                    CycleTime: x["CycleTime"] ?? 0,
                    getBit: x["GetBit"] ?? -1,
                }));
                setAddressConfigs(addrs);
                setSnack({ open: true, msg: `Đã import ${addrs.length} cấu hình`, sev: "success" });
            } else {
                throw new Error("Không tìm thấy Address-Config trong JSON");
            }
        } catch (e) {
            setSnack({ open: true, msg: `Import thất bại: ${e.message}`, sev: "error" });
        }
        setExportImportDialogOpen(false);
    };

    // Calculate changes for review dialog
    const calculateReviewChanges = () => {
        const initial = initialAddressConfigs;
        const current = addressConfigs;

        const added = [];
        const modified = [];
        const deleted = [];
        let reordered = false;

        // Find added and modified
        current.forEach((c, idx) => {
            const match = initial.find(i =>
                i.address === c.address &&
                i.slaveId === c.slaveId &&
                i.name === c.name
            );
            if (!match) {
                added.push(c);
            } else if (JSON.stringify(c) !== JSON.stringify(match)) {
                modified.push({ old: match, new: c });
            }
        });

        // Find deleted
        initial.forEach(i => {
            const match = current.find(c =>
                c.address === i.address &&
                c.slaveId === i.slaveId &&
                c.name === i.name
            );
            if (!match) {
                deleted.push(i);
            }
        });

        // Detect order changes - compare positions of matching items
        if (initial.length === current.length && added.length === 0 && deleted.length === 0) {
            for (let i = 0; i < initial.length; i++) {
                const initItem = initial[i];
                const currItem = current[i];
                if (initItem.address !== currItem.address ||
                    initItem.slaveId !== currItem.slaveId ||
                    initItem.name !== currItem.name) {
                    reordered = true;
                    break;
                }
            }
        } else if (initial.length > 0 && current.length > 0) {
            // Different lengths but some items might have been reordered along with add/delete
            // Check if any item has changed position
            const commonItems = current.filter(c =>
                initial.some(i => i.address === c.address && i.slaveId === c.slaveId && i.name === c.name)
            );
            commonItems.forEach((c, currIdx) => {
                const initIdx = initial.findIndex(i => i.address === c.address && i.slaveId === c.slaveId && i.name === c.name);
                const actualCurrIdx = current.findIndex(x => x.address === c.address && x.slaveId === c.slaveId && x.name === c.name);
                // Compare relative positions
                if (initIdx !== actualCurrIdx) {
                    reordered = true;
                }
            });
        }

        return { added, modified, deleted, reordered };
    };

    // Submit with review dialog
    const handleSubmitWithReview = () => {
        const changes = calculateReviewChanges();
        setReviewChanges(changes);
        setReviewDialogOpen(true);
    };

    // Handle template selection
    const handleSelectTemplate = (template) => {
        const nextAddress = addressConfigs.length > 0
            ? Math.max(...addressConfigs.map(c => c.address)) + 1
            : 0;
        const nextSlaveId = addressConfigs.length > 0
            ? addressConfigs[addressConfigs.length - 1].slaveId
            : 1;
        const defaultGroup = uniqueGroups.length > 0 ? uniqueGroups[0] : "Group 1";

        // Generate default name based on template type
        const countSameType = addressConfigs.filter(c =>
            (template.id === "sensor" && c.memoryType === 1) ||
            (template.id === "setting" && c.memoryType === 6) ||
            (template.id === "coil" && c.type === "bool" && !c.isHighAlarm) ||
            (template.id === "input" && c.type === "bool" && c.functionCode === 2) ||
            (template.id === "alarm" && c.isHighAlarm)
        ).length;
        const defaultName = `${template.name.split(" ")[0]} ${countSameType + 1}`;

        setAddrDialog({
            open: true,
            editingIndex: null,
            draft: {
                address: nextAddress,
                slaveId: nextSlaveId,
                name: defaultName,
                groupName: defaultGroup,
                unit: "",
                deltaValue: 0.1,
                changingUnit: 1,
                digit: 0,
                offset: 0,
                CycleTime: 1000,
                isColumn: false,
                in_min: null,
                in_max: null,
                out_min: null,
                out_max: null,
                getBit: -1,
                isHide: false,
                ...template.defaults,
            },
        });
        setTemplateDialogOpen(false);
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
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                fullWidth
                                size="small"
                                label="Tìm kiếm theo tên"
                                placeholder="Nhập tên config..."
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
                            <Tooltip title="Export / Import JSON">
                                <IconButton onClick={() => setExportImportDialogOpen(true)}>
                                    <ImportExportIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Hướng dẫn cấu hình Modbus">
                                <IconButton onClick={() => window.open("https://www.modbustools.com/modbus.html", "_blank")}>
                                    <HelpOutlineIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Paper>

                    {/* Group Filter Chips */}
                    {uniqueGroups.length > 0 && (
                        <Paper sx={{ p: 1, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                            <Chip
                                label={`Tất cả (${addressConfigs.length})`}
                                color={selectedGroupFilter === null ? "primary" : "default"}
                                onClick={() => setSelectedGroupFilter(null)}
                                size="small"
                            />
                            {uniqueGroups.map(group => {
                                const count = addressConfigs.filter(c => c.groupName === group).length;
                                return (
                                    <Chip
                                        key={group}
                                        label={`${group} (${count})`}
                                        color={selectedGroupFilter === group ? "primary" : "default"}
                                        onClick={() => setSelectedGroupFilter(group)}
                                        size="small"
                                        icon={<FolderIcon style={{ fontSize: 16 }} />}
                                    />
                                );
                            })}
                        </Paper>
                    )}

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

                    {/* Config Items Grid with Header */}
                    <Paper sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                        {/* List Header with Add/Update buttons */}
                        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "grey.50" }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Cấu hình Modbus - {deviceName || deviceId}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {filtered.length} items
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                {hasChanges && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        color="error"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSubmitWithReview}
                                        sx={{ textTransform: "none", animation: "pulse 1.5s infinite" }}
                                    >
                                        Cập nhật
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => setTemplateDialogOpen(true)}
                                    sx={{ textTransform: "none" }}
                                >
                                    Thêm mới
                                </Button>
                            </Stack>
                        </Box>

                        {filtered.length === 0 ? (
                            /* Empty State */
                            <Box sx={{ p: 4, textAlign: "center" }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Chưa có cấu hình nào
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Bắt đầu bằng cách chọn template nhanh hoặc thêm cấu hình mới
                                </Typography>
                                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={1}>
                                    {configTemplates.map(t => {
                                        const Icon = t.icon;
                                        return (
                                            <Chip
                                                key={t.id}
                                                icon={<Icon style={{ color: t.color }} />}
                                                label={t.name}
                                                variant="outlined"
                                                onClick={() => handleSelectTemplate(t)}
                                                sx={{ borderColor: t.color, "&:hover": { backgroundColor: `${t.color}15` } }}
                                            />
                                        );
                                    })}
                                </Stack>
                            </Box>
                        ) : (
                            /* Responsive Grid Layout */
                            <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                                <Grid container spacing={1.5}>
                                    {filtered.map((cfg, index) => {
                                        const TypeIcon = getTypeIcon(cfg.memoryType);
                                        const isAlarm = cfg.isHighAlarm;
                                        const badgeColor = isAlarm ? "#F44336" : getTypeColor(cfg.memoryType);
                                        const badgeLabel = isAlarm ? "ALARM" : getTypeLabel(cfg.memoryType);
                                        const isDragging = dragIndex === index;
                                        const isDropTarget = dragOverIndex === index && dragIndex !== null && dragIndex !== index;

                                        return (
                                            <Grid item xs={12} sm={6} lg={4} xl={3} key={`${cfg.name}-${cfg.address}-${index}`}>
                                                <Paper
                                                    elevation={isDragging ? 8 : isDropTarget ? 4 : 1}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                    onDrop={(e) => handleDrop(e, index)}
                                                    onDragEnd={handleDragEnd}
                                                    onDragLeave={() => dragOverIndex === index && setDragOverIndex(null)}
                                                    sx={{
                                                        p: 1.5,
                                                        borderLeft: `4px solid ${badgeColor}`,
                                                        cursor: "grab",
                                                        opacity: isDragging ? 0.5 : 1,
                                                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        transform: isDropTarget ? "scale(0.95) translateY(-4px)" : "scale(1)",
                                                        boxShadow: isDropTarget ? "0 8px 20px rgba(0,0,0,0.15)" : undefined,
                                                        border: isDropTarget ? "2px dashed #1976D2" : "2px solid transparent",
                                                        backgroundColor: isDropTarget ? "action.selected" : undefined,
                                                        "&:hover": {
                                                            elevation: 4,
                                                            backgroundColor: isDropTarget ? "action.selected" : "action.hover",
                                                        },
                                                        "&:active": { cursor: "grabbing" },
                                                    }}
                                                >
                                                    {/* Header row */}
                                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                        {/* Drag Handle */}
                                                        <DragIndicatorIcon sx={{ color: "grey.400", fontSize: 18 }} />

                                                        {/* Badge */}
                                                        <Chip
                                                            size="small"
                                                            icon={isAlarm ? <WarningAmberIcon style={{ color: "white", fontSize: 12 }} /> : <TypeIcon style={{ color: "white", fontSize: 12 }} />}
                                                            label={badgeLabel}
                                                            sx={{
                                                                backgroundColor: badgeColor,
                                                                color: "white",
                                                                fontWeight: 600,
                                                                fontSize: 9,
                                                                height: 20,
                                                                "& .MuiChip-icon": { ml: 0.3 },
                                                            }}
                                                        />

                                                        <Box sx={{ flex: 1 }} />

                                                        {/* Menu button */}
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => setContextMenu({ anchorEl: e.currentTarget, config: cfg, index })}
                                                        >
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>

                                                    {/* Name */}
                                                    <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
                                                        {cfg.name}
                                                    </Typography>

                                                    {/* Details row */}
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                                                        Addr: {cfg.address} | ID: {cfg.slaveId} | {(cfg.type || "").toUpperCase()}
                                                    </Typography>

                                                    {/* Group row */}
                                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                                                        <FolderIcon sx={{ fontSize: 11, color: "primary.main" }} />
                                                        <Typography variant="body2" color="primary.main" sx={{ fontSize: 10 }} noWrap>
                                                            {cfg.groupName}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        )}
                    </Paper>

                    {/* Context Menu for Config Items */}
                    <Menu
                        anchorEl={contextMenu.anchorEl}
                        open={Boolean(contextMenu.anchorEl)}
                        onClose={() => setContextMenu({ anchorEl: null, config: null, index: -1 })}
                    >
                        <MenuItem onClick={() => { openEdit(contextMenu.index); setContextMenu({ anchorEl: null, config: null, index: -1 }); }}>
                            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                            Chỉnh sửa
                        </MenuItem>
                        <MenuItem onClick={() => handleDuplicate(contextMenu.config, contextMenu.index)}>
                            <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                            Nhân bản
                        </MenuItem>
                        <MenuItem onClick={() => {
                            setMoveGroupTarget({ config: contextMenu.config, index: contextMenu.index });
                            setMoveGroupDialogOpen(true);
                            setContextMenu({ anchorEl: null, config: null, index: -1 });
                        }}>
                            <ListItemIcon><DriveFileMoveIcon fontSize="small" /></ListItemIcon>
                            Chuyển nhóm
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { handleDelete(contextMenu.index); setContextMenu({ anchorEl: null, config: null, index: -1 }); }} sx={{ color: "error.main" }}>
                            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                            Xóa
                        </MenuItem>
                    </Menu>

                    <Box sx={{ height: 24 }} />
                </Container>
            )}

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
                deviceId={deviceId}
                deviceName={deviceName}
                onClose={() => setAddrDialog({ open: false, editingIndex: null, draft: null })}
                onChange={(d) => setAddrDialog((s) => ({ ...s, draft: d }))}
                onSave={saveAddrDraft}
            />

            {/* Template Selection Dialog */}
            <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ background: "linear-gradient(135deg, #1976D2, #42A5F5)", color: "white" }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <AddIcon />
                        <span>Chọn Template Cấu Hình</span>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Chọn một template để bắt đầu nhanh hoặc tạo cấu hình trống.
                    </Typography>
                    <Stack spacing={1}>
                        {configTemplates.map(t => {
                            const Icon = t.icon;
                            return (
                                <Paper
                                    key={t.id}
                                    sx={{
                                        p: 2,
                                        cursor: "pointer",
                                        borderLeft: `4px solid ${t.color}`,
                                        "&:hover": { backgroundColor: `${t.color}10` },
                                    }}
                                    onClick={() => handleSelectTemplate(t)}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Icon sx={{ color: t.color, fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>{t.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialogOpen(false)}>Hủy</Button>
                    <Button variant="outlined" onClick={() => { setTemplateDialogOpen(false); openAdd(); }}>
                        Tạo Trống
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Export/Import Dialog */}
            <Dialog open={exportImportDialogOpen} onClose={() => setExportImportDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Export / Import Cấu Hình</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleExportJSON}
                        >
                            Copy JSON vào Clipboard
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                                const deviceConfig = {
                                    "RS485-Config": toRS485Json(rs485Config),
                                    "Address-Config": addressConfigs.map(toAddressJson),
                                };
                                if (groupModbus && groupModbus.length > 0) {
                                    deviceConfig["Group-Modbus"] = groupModbus.map(toGroupJson);
                                }
                                const blob = new Blob([JSON.stringify(deviceConfig, null, 2)], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `modbus_config_${deviceId}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                                setExportImportDialogOpen(false);
                                setSnack({ open: true, msg: "Đã tải file JSON", sev: "success" });
                            }}
                        >
                            Tải File JSON
                        </Button>
                        <Divider>hoặc</Divider>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<ContentPasteIcon />}
                            onClick={handleImportJSON}
                        >
                            Import từ Clipboard
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportImportDialogOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Review Changes Dialog */}
            <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ background: "linear-gradient(135deg, #FF5722, #FF8A65)", color: "white" }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <SaveIcon />
                        <span>Xác Nhận Thay Đổi</span>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mt: 0.5 }}>
                        Trạm: {deviceName || deviceId}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {/* Station Info Banner */}
                    <Box sx={{ mb: 2, p: 1.5, backgroundColor: "grey.100", borderRadius: 1, borderLeft: "4px solid #FF5722" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Đang cập nhật cấu hình cho:
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {deviceName || deviceId}
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Xem lại các thay đổi trước khi lưu:
                    </Typography>

                    {/* Summary chips */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" gap={0.5}>
                        <Chip
                            size="small"
                            label={`${reviewChanges.added.length} thêm`}
                            sx={{ backgroundColor: "#4CAF50", color: "white" }}
                        />
                        <Chip
                            size="small"
                            label={`${reviewChanges.modified.length} sửa`}
                            sx={{ backgroundColor: "#2196F3", color: "white" }}
                        />
                        <Chip
                            size="small"
                            label={`${reviewChanges.deleted.length} xóa`}
                            sx={{ backgroundColor: "#F44336", color: "white" }}
                        />
                        {reviewChanges.reordered && (
                            <Chip
                                size="small"
                                icon={<DragIndicatorIcon style={{ color: "white", fontSize: 14 }} />}
                                label="Thay đổi vị trí"
                                sx={{ backgroundColor: "#9C27B0", color: "white" }}
                            />
                        )}
                    </Stack>

                    {/* Added */}
                    {reviewChanges.added.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="success.main" gutterBottom>
                                Thêm mới ({reviewChanges.added.length})
                            </Typography>
                            {reviewChanges.added.map((c, i) => (
                                <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                                    + {c.name} (Addr: {c.address})
                                </Typography>
                            ))}
                        </Box>
                    )}

                    {/* Modified */}
                    {reviewChanges.modified.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="info.main" gutterBottom>
                                Chỉnh sửa ({reviewChanges.modified.length})
                            </Typography>
                            {reviewChanges.modified.map((m, i) => (
                                <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                                    ~ {m.new.name}
                                </Typography>
                            ))}
                        </Box>
                    )}

                    {/* Deleted */}
                    {reviewChanges.deleted.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="error.main" gutterBottom>
                                Xóa ({reviewChanges.deleted.length})
                            </Typography>
                            {reviewChanges.deleted.map((c, i) => (
                                <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                                    - {c.name} (Addr: {c.address})
                                </Typography>
                            ))}
                        </Box>
                    )}

                    {reviewChanges.added.length === 0 && reviewChanges.modified.length === 0 && reviewChanges.deleted.length === 0 && !reviewChanges.reordered && (
                        <Typography color="text.secondary">Chỉ có thay đổi RS485 config (RTU/TCP mode hoặc baudrate).</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialogOpen(false)}>Hủy</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => { setReviewDialogOpen(false); handleSubmit(); }}
                    >
                        Xác Nhận Lưu
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Move to Group Dialog */}
            <Dialog open={moveGroupDialogOpen} onClose={() => setMoveGroupDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Chuyển sang Nhóm Khác</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Chọn nhóm mới cho "{moveGroupTarget.config?.name}":
                    </Typography>
                    <Stack spacing={1}>
                        {uniqueGroups.map(group => (
                            <Button
                                key={group}
                                fullWidth
                                variant={moveGroupTarget.config?.groupName === group ? "contained" : "outlined"}
                                startIcon={<FolderIcon />}
                                onClick={() => handleMoveToGroup(group)}
                                disabled={moveGroupTarget.config?.groupName === group}
                            >
                                {group}
                            </Button>
                        ))}
                        <Divider />
                        <TextField
                            fullWidth
                            size="small"
                            label="Hoặc tạo nhóm mới"
                            placeholder="Nhập tên nhóm..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.target.value.trim()) {
                                    handleMoveToGroup(e.target.value.trim());
                                }
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMoveGroupDialogOpen(false)}>Hủy</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
                <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

// ---------- Address Add/Edit Dialog (JS) ----------
function AddressDialog({ open, isEdit, draft, deviceId, deviceName, onClose, onChange, onSave }) {
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

    // Field validation
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!local.name || local.name.trim() === "") {
            newErrors.name = "Tên không được để trống";
        }

        if (!local.groupName || local.groupName.trim() === "") {
            newErrors.groupName = "Nhóm không được để trống";
        }

        if (local.address == null || local.address < 0 || local.address > 65535) {
            newErrors.address = "Địa chỉ phải từ 0-65535";
        }

        if (local.slaveId == null || local.slaveId < 1 || local.slaveId > 247) {
            newErrors.slaveId = "Slave ID phải từ 1-247";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave();
        }
    };

    // Clear errors when dialog opens
    useEffect(() => {
        if (open) setErrors({});
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {isEdit ? "Chỉnh sửa cấu hình" : "Thêm cấu hình"}
                <Typography variant="caption" display="block" color="text.secondary">
                    Trạm: {deviceName || deviceId}
                </Typography>
            </DialogTitle>
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
                            <Typography variant="caption" color="text.secondary">
                                bool = coil/digital, int/float = analog
                            </Typography>
                        </Stack>

                        <TextField
                            label="Name"
                            size="small"
                            value={local.name || ""}
                            onChange={(e) => setField("name", e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name || "Tên hiển thị của thanh ghi trên dashboard"}
                        />

                        {!isBool && local.memoryType !== 0 && (
                            <TextField
                                label="Unit"
                                size="small"
                                value={local.unit || ""}
                                onChange={(e) => setField("unit", e.target.value)}
                                helperText="Đơn vị đo (VD: °C, %, m/s)"
                            />
                        )}

                        <TextField
                            label="Group Name"
                            size="small"
                            value={local.groupName || ""}
                            onChange={(e) => setField("groupName", e.target.value)}
                            error={!!errors.groupName}
                            helperText={errors.groupName || "Nhóm để sắp xếp/lọc các thanh ghi"}
                        />

                        <TextField
                            label="Address"
                            size="small"
                            type="number"
                            value={local.address ?? 0}
                            onChange={(e) => setField("address", Number(e.target.value))}
                            error={!!errors.address}
                            helperText={errors.address || "Địa chỉ Modbus register (0-65535)"}
                        />

                        <TextField
                            label="Slave ID"
                            size="small"
                            type="number"
                            value={local.slaveId ?? 1}
                            onChange={(e) => setField("slaveId", Number(e.target.value))}
                            error={!!errors.slaveId}
                            helperText={errors.slaveId || "ID thiết bị slave (1-247)"}
                        />

                        {!isBool && local.memoryType !== 0 && (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField
                                    label="Constant"
                                    size="small"
                                    type="number"
                                    value={local.changingUnit ?? 1}
                                    onChange={(e) => setField("changingUnit", Number(e.target.value))}
                                    helperText="Hệ số nhân giá trị thô"
                                />
                                <TextField
                                    label="Fractional Digit"
                                    size="small"
                                    type="number"
                                    value={local.digit ? String(Math.log10(local.digit)) : "0"}
                                    onChange={(e) => setField("digit", numberFromDigits(Number(e.target.value)))}
                                    helperText="Số chữ số sau dấu phẩy"
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
                                            {c} - {c === 1 ? "Coil" : c === 2 ? "Input" : c === 3 ? "Holding" : "Input Reg"}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <Typography variant="caption" sx={{ mt: 0.5, color: "text.secondary" }}>
                                    1=Coil, 2=Input, 3=Holding, 4=Input Reg
                                </Typography>
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
                                <Typography variant="caption" sx={{ mt: 0.5, color: "text.secondary" }}>
                                    Cách hiển thị trên dashboard
                                </Typography>
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
                <Button onClick={handleSave} variant="contained">
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
