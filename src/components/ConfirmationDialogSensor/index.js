import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { Box, Stack, Typography } from "@mui/material";
function ConfirmationDialogSensor(props) {
    let { open, onClose, title, message, onConfirm, isNoButton, item } = props;
    console.log(item)
    let [updatedItem, setUpdatedItem] = useState(item);

    const [isThresHold, setIsThresHold] = useState(false);

    const handleClose = () => {
        onClose();
    };
    useEffect(() => {
        if (open) {
            setUpdatedItem(item);
        }
    }, [open, item]);
    const handleConfirm = (v) => {
        onConfirm(updatedItem, v);
        handleClose();
    };
    useEffect(() => {}, []);
    const handleInputChange = (event, field) => {
        const value = Number(event.target.value);
        setUpdatedItem((prevItem) => ({
            ...prevItem,
            AlarmSetting: {
                ...prevItem.AlarmSetting,
                [field]: value,
            },
        }));
    };

    return (
        <Dialog
            maxWidth={"xs"}
            fullWidth={true}
            open={open}
            onClose={handleClose}
            aria-labelledby="confirmation-dialog-title"
        >
            {/* <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle> */}
            <Stack spacing={1.2} sx={{ p: 2 }}>
                <Typography variant="h5">{title}</Typography>

                <Stack spacing={1.2}>
                        {message && (
                            <Typography sx={{ mb: 1 }}>{message}</Typography>
                        )}

                        <TextField
                            label="High Alarm Setting"
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.HighAlarmSetting
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) =>
                                handleInputChange(e, "HighAlarmSetting")
                            }
                        />
                        <TextField
                            label="Low Alarm Setting"
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.LowAlarmSetting
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) =>
                                handleInputChange(e, "LowAlarmSetting")
                            }
                        />
                        <TextField
                            label=   {`Delay (${ typeof updatedItem.AlarmSetting !== "undefined" && typeof updatedItem.AlarmSetting.IsMinute !== "undefined"?"m": "s"}): ` }
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.DelayTime
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) => handleInputChange(e, "DelayTime")}
                        />

                        <Stack direction={"row"} spacing={1}>
                            {isNoButton ? (
                                <Button
                                    onClick={handleClose}
                                    variant="contained"
                                    fullWidth={true}
                                >
                                    Cancel
                                </Button>
                            ) : (
                                ""
                            )}
                            <Button
                                onClick={() => handleConfirm(item)}
                                variant="contained"
                                color="success"
                                autoFocus
                                fullWidth={true}
                            >
                                Update
                            </Button>
                        </Stack>
                        {/* <Button
                            onClick={() => setIsThresHold(true)}
                            variant="contained"
                            color="warning"
                            autoFocus
                            fullWidth={true}
                        >
                            Cài đặt Ngưỡng
                        </Button> */}
                    </Stack>
                {/* {!isThresHold ? (
                    <Stack spacing={1.2}>
                        {message && (
                            <Typography sx={{ mb: 1 }}>{message}</Typography>
                        )}

                        <TextField
                            label="High Alarm Setting"
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.HighAlarmSetting
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) =>
                                handleInputChange(e, "HighAlarmSetting")
                            }
                        />
                        <TextField
                            label="Low Alarm Setting"
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.LowAlarmSetting
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) =>
                                handleInputChange(e, "LowAlarmSetting")
                            }
                        />
                        <TextField
                            label="Delay time (s)"
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.DelayTime
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) => handleInputChange(e, "DelayTime")}
                        />

                        <Stack direction={"row"} spacing={1}>
                            {isNoButton ? (
                                <Button
                                    onClick={handleClose}
                                    variant="contained"
                                    fullWidth={true}
                                >
                                    Cancel
                                </Button>
                            ) : (
                                ""
                            )}
                            <Button
                                onClick={() => handleConfirm(item)}
                                variant="contained"
                                color="success"
                                autoFocus
                                fullWidth={true}
                            >
                                Update
                            </Button>
                        </Stack>
                        <Button
                            onClick={() => setIsThresHold(true)}
                            variant="contained"
                            color="warning"
                            autoFocus
                            fullWidth={true}
                        >
                            Cài đặt Ngưỡng
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={1.2}>
                        <TextField
                            label="Nhập ngưỡng cài đặt"
                            value={
                                typeof updatedItem.AlarmSetting === "undefined"
                                    ? ""
                                    : updatedItem.AlarmSetting.HighAlarmSetting
                            }
                            type="number"
                            size="small"
                            fullWidth
                            onChange={(e) =>
                                handleInputChange(e, "HighAlarmSetting")
                            }
                        />

                        <Stack direction={"row"} spacing={1}>
                            <Button
                                onClick={() => setIsThresHold(false)}
                                variant="contained"
                                fullWidth={true}
                            >
                                Back
                            </Button>

                            <Button
                                onClick={() => handleConfirm(item)}
                                variant="contained"
                                color="success"
                                autoFocus
                                fullWidth={true}
                            >
                                Update
                            </Button>
                        </Stack>
                    </Stack>
                )} */}
            </Stack>
        </Dialog>
    );
}

export default ConfirmationDialogSensor;
