import React from "react";
import { versionApp } from "../../constants";
import MyMapV1 from "./MapV1";
import MyMapV2 from "./MapV2";

function Map() {
    
    const MapPage = {
        1: <MyMapV1 />,
        2: <MyMapV2 />,
    };

    return MapPage[versionApp];
}
export default Map;
