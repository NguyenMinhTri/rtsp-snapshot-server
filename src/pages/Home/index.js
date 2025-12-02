import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../utils/toasts";
import { readDataByStation } from "../Setting/actions";

import HomePage from "../HomePage/HomePage";
function Home() {
    const navigate = useNavigate();
    const deviceUser = localStorage.getItem("device_user");
    let listDevice;

    if (deviceUser !== "undefined") {
        listDevice = JSON.parse(deviceUser);
    } else {
        navigate("/nothing");
    }


    const id = Object.keys(listDevice);


    useEffect(() => {
        if (id.length && id.length> 0) {
            
               

            let d = [];
            let keyValue = {};
            
            id.map((v) => {
                d.push({
                    id: v,
                    label: listDevice[v]["FullName"],
                });

                let obj = {
                    [v]: listDevice[v]["FullName"],
                };
                keyValue[v] = listDevice[v]["FullName"];
              

                

                const key = `SettingThreshold_${v}`;
                const existGetSettingThreshold = localStorage.getItem(key);

                if (!existGetSettingThreshold) {
                    readDataByStation(v).then((s) => {
                        if (s && s.length) {
                            localStorage.setItem(
                                `SettingThreshold_${v}`,
                                JSON.stringify(s)
                            );
                        }
                    });
                }
            });

           
            
            localStorage.setItem("listDeviceWithIdAndLabel", JSON.stringify(d));
            localStorage.setItem(
                "listDeviceWithKeyAndLabel",
                JSON.stringify(keyValue)
            );
        } else {
            Toast("");
        }
    }, [id]);

    

    return <HomePage />;
}
export default Home;
