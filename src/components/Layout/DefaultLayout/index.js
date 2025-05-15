import React from "react";

import "./DefaultLayout.scss";
import Sidebar from "../Sidebar";
import { styled, useTheme } from "@mui/material/styles";

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

function DefaultLayout({ children }) {
    return (
        <div className="wrapper">
            <Sidebar />

            <div className="content">
                <DrawerHeader />
                {children}
            </div>
        </div>
    );
}

export default DefaultLayout;
