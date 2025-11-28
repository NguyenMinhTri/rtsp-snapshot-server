import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import {
  Stack,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Box,
} from "@mui/material";

function ConfirmationDialogSensor(props) {
  const {
    open,
    onClose,
    title,
    message,
    onConfirm,
    isNoButton,
    item,
  } = props;

  const [updatedItem, setUpdatedItem] = useState(item || {});

  useEffect(() => {
    if (open) {
      setUpdatedItem(item || {});
    }
  }, [open, item]);

  const handleClose = () => onClose?.();

  const handleConfirm = (oldSensorValue) => {
    onConfirm?.(updatedItem, oldSensorValue);
    handleClose();
  };

  // cập nhật price ngưỡng
  const handleInputChange = (e, field) => {
    const raw = e.target.value;
    const value = raw === "" ? "" : Number(raw);
 setUpdatedItem((prev) => ({
      ...prev,
      AlarmSetting: {
        ...prev.AlarmSetting,
        [field]: value,
      },
    }));
 
  };

  const toggleLevel = (field) => (e) => {
    setUpdatedItem((prev) => ({
      ...prev,
      AlarmSetting: {
        ...prev.AlarmSetting,
        [field]: e.target.checked,
      },
    }));
  };

  const isMinute = updatedItem?.AlarmSetting?.IsMinute ?? false;

  return (
    <Dialog maxWidth="xs" fullWidth open={open} onClose={handleClose}>
      <Stack spacing={1.4} sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Cài đặt cảnh báo [{title}]
        </Typography>

        {message && <Typography>{message}</Typography>}

        <Divider sx={{ my: 1 }} />

        {/* CHÚ THÍCH MÀU */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Chú thích màu:
          </Typography>
          <Typography variant="body2" sx={{ color: "#FF9800" }}>
            ● Vàng = Cảnh báo mức 1
          </Typography>
          <Typography variant="body2" sx={{ color: "#F44336" }}>
            ● Đỏ = Cảnh báo mức 2
          </Typography>
        </Box>

        {/* LEVEL 1 */}
        <Stack spacing={1}>
          <Typography fontWeight="bold" sx={{ color: "#FF9800" }}>
            Mức cảnh báo 1 (Vàng)
          </Typography>

          {/* HIGH LV1 */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <TextField
              label="Ngưỡng cao (Level 1)"
              type="number"
              size="small"
              fullWidth
              value={updatedItem?.AlarmSetting?.HighAlarmSetting1 ?? ""}
              onChange={(e) => handleInputChange(e,  "HighAlarmSetting1")}
            />
            <Switch
              checked={updatedItem?.AlarmSetting?.IsAlarmHigh1 ?? false}
              onChange={toggleLevel("IsAlarmHigh1")}
            />
          </Stack>

          {/* LOW LV1 */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <TextField
              label="Ngưỡng thấp (Level 1)"
              type="number"
              size="small"
              fullWidth
              value={updatedItem?.AlarmSetting?.LowAlarmSetting1 ?? ""}
              onChange={(e) => handleInputChange(e,  "LowAlarmSetting1")}
            />
            <Switch
              checked={updatedItem?.AlarmSetting?.IsAlarmLow1 ?? false}
              onChange={toggleLevel("IsAlarmLow1")}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 1 }} />

        {/* LEVEL 2 */}
        <Stack spacing={1}>
          <Typography fontWeight="bold" sx={{ color: "#F44336" }}>
            Mức cảnh báo 2 (Đỏ)
          </Typography>

          {/* HIGH LV2 */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <TextField
              label="Ngưỡng cao (Level 2)"
              type="number"
              size="small"
              fullWidth
              value={updatedItem?.AlarmSetting?.HighAlarmSetting ?? ""}
              onChange={(e) => handleInputChange(e,  "HighAlarmSetting")}
            />
            <Switch
              checked={updatedItem?.AlarmSetting?.IsAlarmHigh ?? true}
              onChange={toggleLevel("IsAlarmHigh")}
            />
          </Stack>

          {/* LOW LV2 */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <TextField
              label="Ngưỡng thấp (Level 2)"
              type="number"
              size="small"
              fullWidth
              value={updatedItem?.AlarmSetting?.LowAlarmSetting ?? ""}
              onChange={(e) => handleInputChange(e,  "LowAlarmSetting")}
            />
            <Switch
              checked={updatedItem?.AlarmSetting?.IsAlarmLow ?? false}
              onChange={toggleLevel("IsAlarmLow")}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 1 }} />

        {/* DELAY */}
        <TextField
          label={`Thời gian trễ (${isMinute ? "phút" : "giây"})`}
          type="number"
          size="small"
          fullWidth
          value={updatedItem?.AlarmSetting?.DelayTime ?? ""}
          onChange={(e) =>
            setUpdatedItem((prev) => ({
              ...prev,
              AlarmSetting: {
                ...prev.AlarmSetting,
                DelayTime: Number(e.target.value),
              },
            }))
          }
        />

        {/* BUTTON */}
        <Stack direction="row" spacing={1}>
          {isNoButton && (
            <Button onClick={handleClose} variant="contained" fullWidth>
              Hủy
            </Button>
          )}

          <Button
            onClick={() => handleConfirm(item)}
            variant="contained"
            color="success"
            fullWidth
          >
            Cập nhật
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default ConfirmationDialogSensor;
