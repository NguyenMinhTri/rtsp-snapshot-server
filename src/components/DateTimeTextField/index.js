import React, { useState } from 'react';
import TextField from '@mui/material/TextField';

function DateTimeTextField() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const updateDateTime = () => {
    setCurrentDateTime(new Date());
  };

  // Format date time to display
  const formattedDateTime = currentDateTime.toLocaleString();

  // Update date time every second
  setInterval(updateDateTime, 1000);

  return (
    <TextField
    readOnly
      label=""
      value={formattedDateTime}
      InputProps={{
        readOnly: true,
      }}
    />
  );
}

export default DateTimeTextField;