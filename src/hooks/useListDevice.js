import React, { useEffect, useState } from 'react'

function useListDevice(deviceTypeChange) {
    const deviceUser = localStorage.getItem("device_user");
    const listDevice = JSON.parse(deviceUser);
    const [devices, setDevice] = useState([]);
    const [deviceType , setListDeviceType] = useState([])

    const fullListDevice = () => {
        let devicesType = new Set()
        const id = Object.keys(listDevice);
        const devices =  id.map((v) => {

            devicesType.add(listDevice[v]["DeviceType"])

            return {
                id: v,
                label: listDevice[v]["FullName"],
                deviceType : listDevice[v]["DeviceType"]
            }
        });

        return {devicesType,devices }
        
    }

    useEffect(() => {
        

        const {devicesType, devices} = fullListDevice()

        setDevice(devices);

        if(deviceTypeChange) {
            setDevice((prv) => prv.filter((v) => v.deviceType === deviceTypeChange ));
        }else {
            setListDeviceType([...devicesType])
        }
       
    }, [deviceTypeChange]);
    

    return {
        devices,
        deviceType
    }
}

export default useListDevice