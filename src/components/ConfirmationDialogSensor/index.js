import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import { Stack, Typography, TextField } from "@mui/material";

function ConfirmationDialogSensor(props) {
  const {
    open,
    onClose,
    title,
    message,
    onConfirm,
    isNoButton,
    item, // chứa giá trị hiện tại & cũ
  } = props;

  const [updatedItem, setUpdatedItem] = useState(item || {});



  // Đảm bảo luôn có AlarmSetting với các field cần thiết
  const ensureAlarmSetting = (src) => ({
    ...src,
    AlarmSetting: {
      HighAlarmSetting: src?.AlarmSetting?.HighAlarmSetting ?? "",
      LowAlarmSetting: src?.AlarmSetting?.LowAlarmSetting ?? "",
      DelayTime: src?.AlarmSetting?.DelayTime ?? "",
      IsMinute: src?.AlarmSetting?.IsMinute ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      setUpdatedItem((prev) => ensureAlarmSetting(item || prev || {}));
    }
  }, [open, item]);

  const handleClose = () => {
    onClose?.();
  };

  const handleConfirm = (oldSensorValue) => {
    onConfirm?.(updatedItem, oldSensorValue);
    handleClose();
  };

  const handleInputChange = (event, field) => {
    const raw = event.target.value;
    const value = raw === "" ? "" : Number(raw);

    setUpdatedItem((prevItem) => {
      const safe = ensureAlarmSetting(prevItem || {});
      return {
        ...safe,
        AlarmSetting: {
          ...safe.AlarmSetting,
          [field]: value,
        },
      };
    });
  };

  const isMinute = updatedItem?.AlarmSetting?.IsMinute ?? false;

  return (
    <Dialog
      maxWidth="xs"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="confirmation-dialog-title"
    >
      <Stack spacing={1.2} sx={{ p: 2 }}>
        <Typography variant="h5">{title}</Typography>

        {message && <Typography sx={{ mb: 1 }}>{message}</Typography>}

        <TextField
          label="High Alarm Setting"
          value={updatedItem?.AlarmSetting?.HighAlarmSetting ?? ""}
          type="number"
          size="small"
          fullWidth
          onChange={(e) => handleInputChange(e, "HighAlarmSetting")}
        />

        <TextField
          label="Low Alarm Setting"
          value={updatedItem?.AlarmSetting?.LowAlarmSetting ?? ""}
          type="number"
          size="small"
          fullWidth
          onChange={(e) => handleInputChange(e, "LowAlarmSetting")}
        />

        <TextField
          label={`Delay (${isMinute ? "m" : "s"}):`}
          value={updatedItem?.AlarmSetting?.DelayTime ?? ""}
          type="number"
          size="small"
          fullWidth
          onChange={(e) => handleInputChange(e, "DelayTime")}
        />

        <Stack direction="row" spacing={1}>
          {isNoButton ? (
            <Button onClick={handleClose} variant="contained" fullWidth>
              Cancel
            </Button>
          ) : null}
          <Button
          onClick={() => handleConfirm(item)}
            variant="contained"
            color="success"
            autoFocus
            fullWidth
          >
            Update
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default ConfirmationDialogSensor;
