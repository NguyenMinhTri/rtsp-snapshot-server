/* global document */
import MapGL, {
    FlyToInterpolator,
    FullscreenControl,
    Marker,
    NavigationControl,
    Popup,
} from "@goongmaps/goong-map-react";

import { easeCubic } from "d3-ease";
import { useCallback } from "react";
import { memo, useMemo, useState } from "react";
import Pins from "./components/Pins";
import StationInfo from "./components/StationInfo";
import map_style from "../../utils/map_style.json";
import { useEffect, useRef } from "react";
import ControlPanelMap from "../ControlPanelMap";
import TabStateStation from "../TabStateStation";
import AutocompleteInput from "./components/AutocompleteInput";
import "./MapD.scss";
import { Box, Paper } from "@mui/material";
import { useSelector } from "react-redux";
import { locationStationSelector } from "../../redux/reducer/locationStationSlice";
import { filterMarkSelector } from "../../redux/reducer/filterMarkMapSlice";
import PopupInfo from "./components/PopupInfo";
import TabHideLabel from "./components/TabHideLabel";
const GOONG_MAPTILES_KEY = process.env.REACT_APP_GOONG_MAPTILES_KEY;

const navControlStyle = {
    right: 10,
    top: 45,
};
const fullscreenControlStyle = {
    right: 10,
    top: 10,
};

function MapD({
    //`${window.location.origin}/home?deviceId=`

    height = `calc(100vh - 65px)`,
    data = [
        {
            name: "Ho Chi Minh",
            latitude: 10.8231,
            longitude: 106.6297,
        },
        {
            name: "Ha Noi",
            latitude: 21.0278,
            longitude: 105.8342,
        },
        {
            name: "Da Nang",
            latitude: 16.0545,
            longitude: 108.0717,
        },
    ],
    latitudeDefault = 16.0545,
    longitudeDefault = 108.0717,
    zoomDefault = 5,
    showMarkerInfo = false,
    showButtonHideLabel = true,
    showTabState = true,
    showBtnAll = true,
    deviceId,
}) {
    
    const [popupInfo, setPopupInfo] = useState(null);

    const [viewport, setViewport] = useState({
        latitude: latitudeDefault,
        longitude: longitudeDefault,
        zoom: zoomDefault,
        transitionDuration: "auto",
        transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
    });
    useEffect(() => {
        //
        onSelectCity(longitudeDefault, latitudeDefault, false);
    }, [latitudeDefault]);
    useEffect(() => {
        //
        onSelectCity(longitudeDefault, latitudeDefault, false);
    }, [longitudeDefault]);
    const [dataUpdated, setDataUpdated] = useState(data);
    const [categorySelected, setCategorySelected] = useState(100);
    useEffect(() => {
        setDataUpdated(data);
        if(typeof deviceId !== "undefined" && deviceId !== null){
            for(let i = 0;i< data.length;i++){
                if(data[i].id===deviceId){
                    handleClickMarker(data[i]);
                    onSelectCity(data[i].longitude, data[i].latitude, false);
                }
            }
        }
    }, [data]);
    const onSelectCity = useCallback((longitude, latitude, isHide) => {
        if (
            longitude &&
            latitude &&
            !isHide &&
            latitude != 16.0545 &&
            longitude != 108.0717
        )
            setViewport({
                longitude,
                latitude,
                zoom: 15,
                transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
                transitionDuration: "auto",
            });
    }, []);
    const handleClickMarker = async (city) => {
        let tem= deviceId;
        let long = city.longitude;
        let lati = city.latitude;
        console.log({city})
        setPopupInfo(city);

        // onSelectCity(long, lati, false);
    };
    const handleAddress = (placeID) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
            "GET",
            `https://rsapi.goong.io/Place/Detail?place_id=${placeID}&api_key=wKzieQsXK3Vaa70q6o9oprwEUdeNnWOAvHyCDRmy`
        );
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                //
                let long = data.result.geometry.location.lng;
                let lati = data.result.geometry.location.lat;
                onSelectCity(long, lati, false);
            }
        };
        xhr.send();
        // setDataUpdated(dataUpdated.map((c) => c.name === city.name ? { ...c, isHide: !c.isHide } : c));
    };
    const handleCategory = (cate) => {
        //
        console.log({ cate });
        setCategorySelected(cate);
        // setDataUpdated(dataUpdated.map((c) => c.name === city.name ? { ...c, isHide: !c.isHide } : c));
    };
    const handleHide = (city) => {
        setDataUpdated(
            dataUpdated.map((c) =>
                c.name === city.name ? { ...c, isHide: !c.isHide } : c
            )
        );
    };

    const dataLocation = useSelector(locationStationSelector);
    const filterMark = useSelector(filterMarkSelector);

    useEffect(() => {
        if (dataLocation.longitude && dataLocation.latitude) {
            onSelectCity(dataLocation.longitude, dataLocation.latitude, false);

            // handle show popup
            const stationClick = dataUpdated.find((v) => v.id === dataLocation.id)
            // console.log({dataUpdated})
            setPopupInfo(stationClick);
        }
    }, [dataLocation]);

    useEffect(() => {
        if (filterMark != null) {
            setCategorySelected(filterMark);
        }
    }, [filterMark]);

    return (
        <MapGL
            {...viewport}
            width="100%"
            height={height}
            mapStyle={map_style}
            onViewportChange={setViewport}
            showCompass={true}
            goongApiAccessToken={GOONG_MAPTILES_KEY}
        >
            {/* {showTabState && (
                <TabStateStation onClick={handleCategory} top="2%" left="2%" />
            )} */}
            {/* {showTabState && (
                <TabStateStation onClick={handleCategory} top="2%" left="2%" />
            )} */}
            {/* {showBtnAll && (
                <ControlPanelMap data={data} onSelectCity={onSelectCity} />
            )} */}
            <AutocompleteInput onClickItem={handleAddress} />
            {showButtonHideLabel && <TabHideLabel />}

            <Pins
                category={categorySelected}
                data={dataUpdated}
                onClick={handleClickMarker}
            />

                {!showMarkerInfo && popupInfo && (
                    <Popup
                        tipSize={10}
                        anchor="right"
                        longitude={popupInfo.longitude}
                        latitude={popupInfo.latitude}
                        closeOnClick={false}
                        onClose={setPopupInfo}
                        closeButton={true}
                        
                        // offsetTop={11}
                        offsetLeft={-10}
                    >
                        <PopupInfo popupInfo={popupInfo} />
                    </Popup>
                )}

            <NavigationControl style={navControlStyle} />
            <FullscreenControl style={fullscreenControlStyle} />
        </MapGL>
    );
}
export default memo(MapD);
