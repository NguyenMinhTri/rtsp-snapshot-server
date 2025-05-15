import { Tabs, Tab } from "@mui/material";
import React from "react";
import MyTableNotStyle from "../../../components/MyTable/TableNotStyle";
import TabPanel from "./TabPanel";

function TabTable({
    tabTable,
    handleChangeTabTable,
    listSensor,
    dataAVG,
    dataMin,
    dataMax,
}) {
    return (
        <>
            <Tabs
                value={tabTable}
                onChange={handleChangeTabTable}
                textColor="primary"
                indicatorColor="primary"
                aria-label="secondary tabs example"
            >
                <Tab value="avg" label="Trung bình" />
                <Tab value="max" label="Max" />
                <Tab value="min" label="Min" />
            </Tabs>

            <TabPanel value={tabTable} index={"avg"} >
                <MyTableNotStyle columns={listSensor} name={"AVG"} rows={dataAVG} />
            </TabPanel>
            <TabPanel value={tabTable} index={"min"}>
                <MyTableNotStyle columns={listSensor} name={"MIN"} rows={dataMin} />
            </TabPanel>
            <TabPanel value={tabTable} index={"max"}>
                <MyTableNotStyle columns={listSensor} name={"MAX"} rows={dataMax} />
            </TabPanel>
        </>
    );
}

export default TabTable;
