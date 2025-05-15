import { Fragment, useState } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import NativeSelect from '@mui/material/NativeSelect';
import { Grid } from '@mui/material';
import { IndeterminateCheckBoxOutlined } from '@mui/icons-material';

export default function MySelect({
    label = 'Label',
    menuValue = [
        { id: 1, label: 'Value 1' },
        { id: 2, label: 'Value 1' },
        { id: 3, label: 'Value 1' },
    ],
    defaultValue,
    defaultChecked,
    defaultOpen,
    onChange,
    value,
}) {
    // const [value, setValue] = useState('');
    // console.log(value);
    // const handleChange = (event) => {
    //     setValue(event.target.value);
    // };

    return (
        <Box sx={{ minWidth: 50 }}>
            <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label" color="success">
                    {label}
                </InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={value}
                    label={label}
                    defaultValue={defaultValue}
                    defaultOpen={defaultOpen}
                    defaultChecked={defaultChecked}
                    color="success"
                    onChange={onChange}>
                    {menuValue.map((v, index) => (
                        <MenuItem value={v.id} key={v.id}>
                            {v.label}
                        </MenuItem>
                    ))}
                </Select>
                {/* <NativeSelect
                    defaultValue={30}
                    inputProps={{
                        name: 'age',
                        id: 'uncontrolled-native',
                    }}>
                    {menuValue.map((v, index) => (
                        <MenuItem value={v.id} key={v.id}>
                            {v.name}
                        </MenuItem>
                    ))}
                    <option value={10}>Ten</option>
                    <option value={20}>Twenty</option>
                    <option value={30}>Thirty</option>
                </NativeSelect> */}
            </FormControl>
        </Box>
    );
}
