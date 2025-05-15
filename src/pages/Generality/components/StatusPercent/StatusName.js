import { Autocomplete, Box, Paper, Stack, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import StackBetween from "../../../../components/StackBeetwen";
import CardStatus from "./CardStatus";

function StatusName({ totalListStatus }) {
    const [optionStation, setOptionStation] = useState([]);

    const statusOptions = [
        {
            label: "Trạm có thiết bị lỗi",
            id: "error",
        },
        {
            label: "Trạm có thiết bị đang hiệu chuẩn",
            id: "calif",
        },
        {
            label: "Trạm có đang hoạt động tốt",
            id: "active",
        },
        {
            label: "Trạm có thiêt bị vượt ngưỡng",
            id: "over",
        },
        {
            label: "Trạm mất két nối",
            id: "off",
        },
       
    ];

    const [station, setStation] = useState(totalListStatus[0]);
    const [value, setValue] = useState(totalListStatus[0]);

    const [status, setStatus] = useState(statusOptions[0]);
    const [valueStatus, setValueStatus] = useState(statusOptions[0]);

    const handleOnChangeSelectStation = (e, newInputValue) => {
        if (newInputValue) {
            setOptionStation([newInputValue]);
            setValue(newInputValue);
        } else {
            setOptionStation([]);
        }
    };

    const handleOnChangeSelectStatus = (e, v) => {
        if (v) {
            setValueStatus(v);
            const newStation = totalListStatus.filter(
                (v2) => v2.status == v.id
            );

            setOptionStation(newStation);
        } else {
            setValueStatus("");
            setOptionStation([]);
        }
    };

    let renderCardStatus =
        optionStation && optionStation.length > 0
            ? optionStation
            : totalListStatus;

    return (
        <Paper sx={{ padding: 2 }}>
            <Box sx={{ height: "40px" }}>
                <StackBetween spacing={2}>
                    <Autocomplete
                        disablePortal
                        id="controllable-states-demo-20"
                        size="small"
                        color="success"
                        onChange={handleOnChangeSelectStation}
                        getOptionLabel={(option) => option?.station}
                        options={totalListStatus}
                        value={value}
                        fullWidth={true}
                        inputValue={station}
                        onInputChange={(event, newInputValue) => {
                            setStation(newInputValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth={true}
                                label="Lọc theo tên trạm"
                            />
                        )}
                    />

                    <Autocomplete
                        disablePortal
                        id="controllable-states-demo-21"
                        size="small"
                        color="success"
                        onChange={handleOnChangeSelectStatus}
                        options={statusOptions}
                        value={valueStatus}
                        fullWidth={true}
                        inputValue={status}
                        onInputChange={(event, newInputValue) => {
                            setStatus(newInputValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth={true}
                                label="Lọc theo trạng thái"
                            />
                        )}
                    />
                </StackBetween>
            </Box>

            <Box sx={{ mt: 2, height: "400px", overflowY: "auto" }}>
                <Stack spacing={1}>
                    {renderCardStatus &&
                        renderCardStatus.length > 0 &&
                        renderCardStatus.map((v,index) => (
                            <CardStatus title={v.station} status={v.status} key={index} />
                        ))}
                </Stack>
            </Box>
        </Paper>
    );
}

export default StatusName;
