import { useState } from "react";
import React, { useEffect } from "react";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import moment from "moment";
import { Typography } from "@mui/material";
import CsvDownloader from 'react-csv-downloader';
function MyTableNotStyle({
    columns,
    rows,
    rowsPage = 20,
    name,
    rowPageOptions = [20, 50, 100],
}) {
    debugger;
    const [page, setPage] = useState(0);
    const [columnCSV, setColumnCSV] = useState([]);
    const [dataCSV, setDataCSV] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPage);
    //pagination
    const handleChangePage = (event, newPage) => {

        setPage(newPage);
    };

    useEffect(() => {
        for(let index = 0; index < columns.length;index++){
            columnCSV.push({
                id: columns[index].id,
                displayName:columns[index].label === "#" ? "STT":columns[index].label
            })
         
        }
        if(rows && rows.length > 0 ){
            rows.map((row, index) => {
               
                        columns.map((column) => {
                 
                            if(column.id == "time"){
                      
                                row[column.id] =row[column.id];
                            }
                            else if (column.id !== "#" && column.id !== "STT"){
                             
                                try{
                                    //row[column.id] = (row[column.id]).toFixed(3);
                                }
                                catch(e){}
                            }
                    
                   
                
            });
        });
        }
    }, []);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };
    return (
        <div className="my_table">
           <CsvDownloader 
                     datas={rows}
                     columns={columnCSV}
                     text="Export Excel CSV"
                     filename={`${name}_Data_`+new Date().toLocaleString()}
                     extension=".csv"
                    
                     />
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <TableContainer>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows && rows.length > 0 ? rows
                                .slice(
                                    page * rowsPerPage,
                                    page * rowsPerPage + rowsPerPage
                                )
                                .map((row, index) => {
                                    return (
                                        <TableRow
                                            hover
                                            role="checkbox"
                                            tabIndex={-1}
                                            key={index}
                                        >
                                            {columns.map((column) => {
                                                const value = row[column.id];
                                                let valueTime ='';
                                                if(column.id == "time"){
                                                    {/* debugger;
                                                     valueTime = moment(
                                                                 value
                                                              ).format(
                                                                  "DD/MM/YYYY HH:mm:ss"
                                                              );
                                                              //row[column.id] = valueTime;
                                                              if(valueTime.toString() =="Invalid date"){
                                                                valueTime =value;
                                                                //row[column.id] = valueTime;
                                                              } */}
                                                }
                                                return (
                                                    <TableCell
                                                        key={column.id}
                                                        align={column.align}
                                                    >
                                                        {column.id == "time"
                                                            ? value
                                                            : column.id != "stt"
                                                            ? (+value).toFixed(
                                                                  3
                                                              )
                                                            : value}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                }) : <Typography sx={{p : 2}}>Không có dữ liệu hiện thị</Typography>}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={rowPageOptions}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={"Số dòng trên một trang"}
                />
            </Paper>
        </div>
    );
}

export default MyTableNotStyle;
