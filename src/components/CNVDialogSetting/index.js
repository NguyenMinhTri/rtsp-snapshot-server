import React, { useState, useEffect } from "react";

import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Autocomplete } from '@mui/material';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { child, get, getDatabase, ref } from "firebase/database";
const CNVDialogSetting = ({ open, handleClose, deviceId, onConfirm ,isEnglish}) => {
  const db = ref(getDatabase());
  // Dữ liệu từ đoạn văn bản


  // State để lưu trữ dữ liệu và cho phép thay đổi giá trị
  const [data, setData] = useState(undefined);
  useEffect(() => {

    if (typeof deviceId !== "undefined" && open === true) {
      get(child(db, `Devices/DAIVIET-RS485/${deviceId}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            let { RS485Data } = snapshot.val();
            setData(RS485Data);
            setIdPressureUnit(RS485Data[6].Value);
            setIdPDPressureUnit(RS485Data[7].Value);
            setIdLiquid(RS485Data[10].Value);
          } else {
            console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [open]);
  // Handler để xử lý khi giá trị thay đổi
  const handleValueChange = (event, index) => {
    // Chỉ cho phép nhập số nguyên không âm
    if (/^\d*$/.test(event.target.value) && (index === 13 || index === 14 || index === 15)) {
      const newData = [...data];
      newData[index].Value = event.target.value;
      setData(newData);
    }
    else if (/^\d*\.?\d*$/.test(event.target.value) && (index !== 13 && index !== 14 && index !== 15)) {
      const newData = [...data];
      newData[index].Value = event.target.value;
      setData(newData);
    }



  };

  // Handler khi nhấn nút Submit
  const handleSubmit = () => {
    // Thực hiện các thao tác cần thiết khi nhấn nút Submit ở đây
    console.log('Submitted:', data);
    onConfirm(data);
    // Đóng dialog
    handleClose();
  };
  const [idPressureUnit, setIdPressureUnit] = useState(0);

  const handleChangePressureUnit = async (event) => {
    data[6].Value = event.target.value;
    setIdPressureUnit(event.target.value);

  };
  const [idLiquid, setIdLiquid] = useState(0);

  const handleChangeIdLiquid = async (event) => {

    data[10].Value = event.target.value;
    setIdLiquid(event.target.value);
  };

  const [idPDPressureUnit, setIdPDPressureUnit] = useState(0);

  const handleChangePDPressureUnit = async (event) => {

    data[7].Value = event.target.value;


    setIdPDPressureUnit(event.target.value);
  };

  function getPressureUnit(index) {
    if (index === 0) return "bar";
    if (index === 1) return "kg/cm2";
    if (index === 2) return "Mpa";
    if (index === 3) return "PSI";
    return "Undefined";
  }

  function getPDPressureUnit(index) {
    if (index === 0) return "mbar";
    if (index === 1) return "mmH2O";
    if (index === 2) return "mmHg(Torr)";
    if (index === 3) return "Pa";
    return "Undefined";

  }

  const [openPressureUnit, setOpenPressureUnit] = useState(false);

  const handleOpenPressureUnit = async (event) => {
    setOpenPressureUnit(true);
  };
  const handleClosePressureUnit = async (event) => {
    setOpenPressureUnit(false);
  };
  const optionsLiquid = ['LIN', 'LOX', 'LAR', 'LN2O', 'LCO2', 'LNG']; // Danh sách các tùy chọn
  const optionsPressureUnit = ['bar', 'kg/cm2', 'Mpa', 'PSI']; // Danh sách các tùy chọn
  const optionsPDPressureUnit = ['mbar', 'mmH2O', 'mmHg(Torr)', 'Pa']; // Danh sách các tùy chọn
  return (

    open == false ? <div></div> : <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Cài đặt</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow key={0}>
                <TableCell>{isEnglish  ?"Tank Serial No.": "Sê-ri bồn"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[0].Value : ''}
                    onChange={(event) => handleValueChange(event, 0)}
                  />
                </TableCell>
                <TableCell>{""}</TableCell>
              </TableRow>

              <TableRow key={10}>
                <TableCell>{isEnglish  ?"Fluid":"Môi chất"}</TableCell>
                <TableCell>
                { typeof data !== "undefined" ? 
                <Autocomplete
                    disableClearable
                    options={optionsLiquid}
                    defaultValue={optionsLiquid[idLiquid]} // Giá trị mặc định
                    onChange={(event, value) => {
                      console.log(value); // Xử lý sự kiện thay đổi giá trị
                      let tempI = 0;
                      for (let i = 0; i < optionsLiquid.length; i++) {
                        if (optionsLiquid[i] === value) {
                          tempI = i;
                        }
                      }
                      data[10].Value = tempI;
                      setIdLiquid(tempI);
                    }}
                    renderInput={(params) => <TextField  {...params} label="" />} // Render input field
                  /> 
              :<div></div>  }
                </TableCell>
                <TableCell>{""}</TableCell>
              </TableRow>


              <TableRow key={9}>
                <TableCell>{isEnglish  ?"Tank volume":"Dung tích bồn"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[9].Value : ''}
                    onChange={(event) => handleValueChange(event, 9)}
                  />
                </TableCell>
                <TableCell>{"m3"}</TableCell>
              </TableRow>

              <TableRow key={6}>
                <TableCell>{isEnglish  ?"Pressure unit":"Đơn vị áp suất"}</TableCell>
                <TableCell>
                { typeof data !== "undefined" ? 
                  <Autocomplete
                    disableClearable
                    options={optionsPressureUnit}
                    defaultValue={optionsPressureUnit[idPressureUnit]} // Giá trị mặc định
                    onChange={(event, value) => {
                      console.log(value); // Xử lý sự kiện thay đổi giá trị
                      let tempI = 0;
                      for (let i = 0; i < optionsPressureUnit.length; i++) {
                        if (optionsPressureUnit[i] === value) {
                          tempI = i;
                        }
                      }
                      data[6].Value = tempI;
                      setIdPressureUnit(tempI);
                    }}
                    renderInput={(params) => <TextField  {...params} label="" />} // Render input field
                  />     :<div></div>  }
                  {/* <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel id="pressure-unit-label">Đơn vị áp suất</InputLabel>
                    <Select

                      onOpen={handleOpenPressureUnit}
                      onClose={handleClosePressureUnit}
                      value={idPressureUnit}
                      onChange={handleChangePressureUnit}
                      label="Đơn vị áp suất"
                    >
                      <MenuItem value={0}>bar</MenuItem>
                      <MenuItem value={1}>kg/cm2</MenuItem>
                      <MenuItem value={2}>Mpa</MenuItem>
                      <MenuItem value={3}>PSI</MenuItem>
                    </Select>
                  </FormControl> */}
                </TableCell>
                <TableCell>{""}</TableCell>
              </TableRow>

              <TableRow key={7}>
                <TableCell>{isEnglish  ?"Differential pressure unit":"Đơn vị chênh áp"}</TableCell>
                <TableCell>
                { typeof data !== "undefined" ?     <Autocomplete
                    disableClearable
                    options={optionsPDPressureUnit}
                    defaultValue={optionsPDPressureUnit[idPDPressureUnit]} // Giá trị mặc định
                    onChange={(event, value) => {
                      console.log(value); // Xử lý sự kiện thay đổi giá trị
                      let tempI = 0;
                      for (let i = 0; i < optionsPDPressureUnit.length; i++) {
                        if (optionsPDPressureUnit[i] === value) {
                          tempI = i;
                        }
                      }
                      data[7].Value = tempI;
                      setIdPDPressureUnit(tempI);
                    }}
                    renderInput={(params) => <TextField  {...params} label="" />} // Render input field
                  />  :<div></div>  }
                  {/* <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel id="pressure-unit-label">Đơn vị chênh áp</InputLabel>
                    <Select

                      value={idPDPressureUnit}
                      onChange={handleChangePDPressureUnit}
                      label="Đơn vị chênh áp"
                    >
                      <MenuItem value={0}>mbar</MenuItem>
                      <MenuItem value={1}>mmH2O</MenuItem>
                      <MenuItem value={2}>mmHg(Torr)</MenuItem>
                      <MenuItem value={3}>Pa</MenuItem>
                    </Select>
                  </FormControl> */}
                </TableCell>
                <TableCell>{""}</TableCell>
              </TableRow>


              <TableRow key={8}>
                <TableCell>{isEnglish  ?"Max differential pressure":"Chênh áp tối đa"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[8].Value : ''}
                    onChange={(event) => handleValueChange(event, 8)}
                  />
                </TableCell>
                <TableCell>{getPDPressureUnit(idPDPressureUnit)}</TableCell>
              </TableRow>


              <TableRow key={11}>
                <TableCell>{isEnglish  ?"Pressure transmitter range":"Khoảng cách đo cảm biến áp suất"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[11].Value : ''}
                    onChange={(event) => handleValueChange(event, 11)}
                  />
                </TableCell>
                <TableCell>{getPressureUnit(idPressureUnit)}</TableCell>
              </TableRow>
              <TableRow key={12}>
                <TableCell>{isEnglish  ?"Differential pressure transmitter range":"Khoảng cách đo cảm biến chênh áp"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[12].Value : ''}
                    onChange={(event) => handleValueChange(event, 12)}
                  />
                </TableCell>
                <TableCell>{getPDPressureUnit(idPDPressureUnit)}</TableCell>
              </TableRow>

              <TableRow key={13}>
                <TableCell>{isEnglish  ?"Low liquid level alarm":"Cảnh báo mức lỏng thấp"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[13].Value : ''}
                    onChange={(event) => handleValueChange(event, 13)}
                  />
                </TableCell>
                <TableCell>{"%"}</TableCell>
              </TableRow>


              <TableRow key={15}>
                <TableCell>{isEnglish  ?"Low pressure alarm":"Cảnh báo áp suất thấp"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[15].Value : ''}
                    onChange={(event) => handleValueChange(event, 15)}
                  />
                </TableCell>
                <TableCell>{getPressureUnit(idPressureUnit)}</TableCell>
              </TableRow>


              <TableRow key={14}>
                <TableCell>{isEnglish  ?"High pressure alarm":"Cảnh báo áp suất cao"}</TableCell>
                <TableCell>
                  <TextField
                    InputProps={{
                      inputProps: {
                        pattern: '[0-9]*\\.?[0-9]*', // pattern HTML5 để chỉ cho phép nhập số thực
                        inputMode: 'decimal', // inputMode HTML5 để hiển thị bàn phím số trên điện thoại di động
                      },
                    }}
                    value={typeof data !== "undefined" ? data[14].Value : ''}
                    onChange={(event) => handleValueChange(event, 14)}
                  />
                </TableCell>
                <TableCell>{getPressureUnit(idPressureUnit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{isEnglish  ?"Close":"Đóng"}</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">{isEnglish  ?"Update":"Cập nhật"}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CNVDialogSetting;