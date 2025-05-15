import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import MyDateRange from "../../components/DateRange";
import moment from "moment";
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Box, Stack, Typography, FormControlLabel, Checkbox } from "@mui/material";
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
function CNVDialog(props) {
    let { open, onClose, onConfirm, isNoButton, item } = props;

    let [updatedItem, setUpdatedItem] = useState(item);
    const [startDateTemp, setStartDateTemp] = useState(
        moment(new Date()).format("MM/DD/YYYY HH:mm:ss")
    );


    const handleClose = () => {
        onClose();
    };
    useEffect(() => {
        if (open) {
            setStartDateTemp (moment(new Date()).format("MM/DD/YYYY HH:mm:ss"));
            setUpdatedItem(item);
        }
    }, [open, item]);
    const handleConfirm = (v) => {
        onConfirm(updatedItem, v);
        handleClose();
    };

    const handleInputChange = (event, field) => {
        const value =event.target.value;
        setUpdatedItem((prevItem) => ({
            ...prevItem,
            ReportFormData: {
                ...prevItem.ReportFormData,
                [field]: value,
            },
        }));
    };
    const handleInputChangeCheckBox = (event, field) => {
        const value =event.target.checked;
        setUpdatedItem((prevItem) => ({
            ...prevItem,
            ReportFormData: {
                ...prevItem.ReportFormData,
                [field]: value,
            },
        }));
    };
    const handleChangeStartDate = (e) => {
        // const startTime = moment(e.$d).format("HH:mm MM-DD-YYYY");
        // item.ReportFormData.historyDate = startTime;
        // setUpdatedItem(item);
        setStartDateTemp(moment(e.$d).format("HH:mm MM-DD-YYYY"));
        setUpdatedItem((prevItem) => ({
            ...prevItem,
            ReportFormData: {
                ...prevItem.ReportFormData,
                ['historyDate']: moment(e.$d).format("HH:mm MM-DD-YYYY"),
            },
        }));
        
        // 
    };
    return (
        <Dialog
            maxWidth={"sm"}
            fullWidth={true}
            open={open}
            onClose={handleClose}
            aria-labelledby="confirmation-dialog-title"
        >
            {/* <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle> */}
            <Stack spacing={1.2} sx={{ p: 2 }}>
                <Typography variant="h5">EXPORT CERTIFICATE OF ANALYSIS</Typography>

                <Stack spacing={1.2}>
                  

                    <TextField
                        label="Customer / (Tên khách hàng):"
                        value={updatedItem.ReportFormData.customerName}
                        type="text"
                        size="small"
                        fullWidth
                        onChange={(e) =>
                            handleInputChange(e, "customerName")
                        }
                    />
                    <TextField
                        label="Containing facility No/(Mã t/bị v/chuyển):"
                        value={updatedItem.ReportFormData.facilityNo}
                        type="text"
                        size="small"
                        fullWidth
                        onChange={(e) =>
                            handleInputChange(e, "facilityNo")
                        }
                    />
                    <TextField
                        label="Tank No/(Bồn số):"
                        value={updatedItem.ReportFormData.tankNo}
                        type="text"
                        size="small"
                        fullWidth
                        onChange={(e) => handleInputChange(e, "tankNo")}
                    />
              
                    <TextField
                        label="Production Date/(Ngày SX): "
                        value={updatedItem.ReportFormData.productDate}
                        type="text"
                        size="small"
                        fullWidth
                        onChange={(e) => handleInputChange(e, "productDate")}
                    />
                    <TextField
                        label="Delivery Date/(Ngày g/hàng): "
                        value={updatedItem.ReportFormData.deliverDate}
                        type="text"
                        size="small"
                        fullWidth
                        onChange={(e) => handleInputChange(e, "deliverDate")}
                    />
                    <Stack direction={"row"} spacing={1}>
                    <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsCO2")
                                }}
                                checked={updatedItem.ReportFormData.IsCO2}
                                    name="CO2"
                                    value="SomeValue"
                                />
                            }
                            label="CO2" />
                                                    <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsO2")
                                }}
                                checked={updatedItem.ReportFormData.IsO2}
                                    name="O2"
                                    value="SomeValue"
                                />
                            }
                            label="O2" />
                        <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsN2")
                                }}
                                checked={updatedItem.ReportFormData.IsN2}
                                    name="N2"
                                    value="SomeValue"
                                />
                            }
                            label="N2" />
                        <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsC6H6")
                                }}
                                checked={updatedItem.ReportFormData.IsC6H6}
                                    name="C6H6"
                                    value="SomeValue"
                                />
                            }
                            label="C6H6" />
                        <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsH2S")
                                }}
                                checked={updatedItem.ReportFormData.IsH2S}
                                    name="H2S"
                                    value="SomeValue"
                                />
                            }
                            label="H2S" />

                        <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsTHC")
                                }}
                                checked={updatedItem.ReportFormData.IsTHC}
                                    name="THC"
                                    value="SomeValue"
                                />
                            }
                            label="THC" />
                        <FormControlLabel
                            control={
                                <Checkbox
                                onChange={e=> {
                                    console.log("target checked? - ", e.target.checked);
                                    handleInputChangeCheckBox(e,"IsH2O")
                                }}
                                checked={updatedItem.ReportFormData.IsH2O}
                                    name="H2O"
                                    value="SomeValue"
                                />
                            }
                            label="H2O" />

                    </Stack>

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
                            Export Report
                        </Button>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
                        <MobileDateTimePicker
                 

                 label={ "Time"}
                 value={startDateTemp}
                 onChange={handleChangeStartDate}
                 renderInput={(params) => <TextField fullWidth size="small" {...params} />}
                   
                                                                />
                 </LocalizationProvider>
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

export default CNVDialog;
