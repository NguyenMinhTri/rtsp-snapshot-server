import React from "react";
import MapGL, { Marker } from "@goongmaps/goong-map-react";
function MarkerInfo({data}) {
    return (
        <Marker
            key={data.name}
            longitude={data.longitude}
            latitude={data.latitude}
        >
            <div onClick={() => handleHide(data)} className="closeable">
                {!data.isHide ? (
                    <span className="close-icon">&times;</span>
                ) : (
                    <span className="close-icon">&#9666;</span>
                )}
            </div>

            <div
                onClick={() =>
                    onSelectCity(data.longitude, data.latitude, data.isHide)
                }
                className={`background-sensor-${data.state}`}
            >
                <div className={`title-sensor-${data.state}`}>
                    {data.name} ({data.lastTime})
                </div>
                {!data.isHide &&
                    (typeof data.sensor !== "undefined"
                        ? data.sensor.map((item) => (
                              <div
                                  className={`content-sensor-${
                                      data.state == "OFF"
                                          ? "OFF"
                                          : item.stateNum
                                  }`}
                              >
                                  {item.name} : {item.value} {item.unit}
                              </div>
                          ))
                        : "")}
                <div
                    onClick={() =>
                        openInNewTab(
                            `${window.location.origin}/home?deviceId=${data.id}`
                        )
                    }
                    className="content-more"
                >
                    <span className="">More..</span>
                </div>
            </div>
        </Marker>
    );
}

export default MarkerInfo;
