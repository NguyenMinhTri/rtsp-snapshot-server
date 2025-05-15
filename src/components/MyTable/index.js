import { useState } from "react";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import QuickView from "../QuickView";
function MyTable({
    columns,
    rows,
    styleStateValue,
    rowsPage = 20,
    rowPageOptions = [20, 50, 100],
}) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPage);
    //pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };
    return (
        <div className="my_table">
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
                            {rows
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
                                                return (
                                                    <TableCell
                                                        key={column.id}
                                                        align={column.align}
                                                       
                                                    >                                       
                                                        {
                                                            column.id === "quickview" ?  <QuickView deviceId={ row['id_station']} />:
                                                            
                                                            column.format &&
                                                        typeof value ===
                                                            "number" ? (
                                                            column.format(value)
                                                        ) : value ? (
                                                            <span
                                                                style={
                                                                    value.split(
                                                                        "*"
                                                                    )[1]
                                                                        ? styleStateValue(
                                                                              value
                                                                          )
                                                                        : {}
                                                                }
                                                            >
                                                                {value.split(
                                                                    "*"
                                                                )[0] +
                                                                    " " +
                                                                    (column.label.split(
                                                                        "("
                                                                    ).length >
                                                                        0 &&
                                                                    typeof column.label.split(
                                                                        "("
                                                                    )[1] !==
                                                                        "undefined"
                                                                        ? column.label
                                                                              .split(
                                                                                  "("
                                                                              )[1]
                                                                              .split(
                                                                                  ")"
                                                                              )[0]
                                                                        : "")}
                                                            </span>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
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
                />
            </Paper>
        </div>
    );
}

export default MyTable;
