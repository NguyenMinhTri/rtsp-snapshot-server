import * as React from 'react';

import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker';
import 'dayjs/locale/en-gb';

export default function MyDateRange({ label, onChange, value, Type = 'DAY' }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
            {/* <DateTimePicker
                label={label}
                value={value}
                onChange={onChange}
                renderInput={(params) => <TextField size="small" {...params} />}
            /> */}
            <MobileDateTimePicker
                 

                label={label}
                value={value}
                onChange={onChange}
                renderInput={(params) => <TextField fullWidth size="small" {...params} />}
            />
            {/* <DesktopDateTimePicker
                label={label}
                value={value}
                onChange={onChange}
                renderInput={(params) => <TextField size="small" {...params} />}
            /> */}
        </LocalizationProvider>
    );
}
