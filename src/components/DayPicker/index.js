import * as React from "react";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField } from "@mui/material";

import 'dayjs/locale/en-gb';
export default function DayPicker({ label, onChange, value, defaultValue}) {
    const [cleared, setCleared] = React.useState(false);
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"} >
            <DatePicker
                label={label}
                value={value}
                onChange={onChange}
                defaultValue={defaultValue}
                slotProps={{
                    field: { clearable: true, onClear: () => setCleared(true) },
                  }}
                renderInput={(params) => (
                    <TextField fullWidth size="small" {...params} />
                )}
            />

        </LocalizationProvider>
    );
}
