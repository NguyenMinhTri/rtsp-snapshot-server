import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    onSnapshot,
    getDoc,
    query,
    where,
    getDocFromCache,
    deleteDoc,
    updateDoc,
    deleteField,
} from "firebase/firestore";
import { dbStore, functions } from "../../../config/firebase";
import Toast from "../../../utils/toasts";
import { httpsCallable } from "firebase/functions";
import asyncLocalStorage from "../../../utils/async_localstorage";

export const COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE = `SensorOfDevice`;

// ! handle call db
export const handleGetListSensorByListDeviceId = async (listDeviceId) => {
    const GetDataAVGMinMaxByDate = httpsCallable(
        functions,
        "GetListSensorByListDeviceId"
    );
    const data = {
        listDeviceId: listDeviceId,
    };
    try {
        const result = await GetDataAVGMinMaxByDate(data);
        return JSON.parse(result.data);
    } catch (error) {}
};

// ! save sensor device
export const saveSensorOfDevice = async (listSensorOfDevice) => {
    const accountUser = await asyncLocalStorage.getItem("loginEmail");

    try {
        await setDoc(
            doc(
                dbStore,
                COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE,
                accountUser
            ),
            { data: JSON.stringify(res) }
        );
        localStorage.setItem(
            COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE,
            JSON.stringify(res)
        );
        
    } catch (e) {
        Toast("error", "Error save document");
        console.error("Error save document: ", e);
    }
};

//! Read by sensor of station
export const readSensorDeviceStore = async () => {
const accountUser = await asyncLocalStorage.getItem("loginEmail");

    let res = null
    const docRef = doc(
        dbStore,
        COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE,
        accountUser
    );
    const docSnap = await getDoc(docRef);
    console.log({docSnap})
    if(docSnap && docSnap.data() && docSnap.data().data) {
        localStorage.setItem(
            COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE,
            JSON.stringify(docSnap.data().data)
        );
        res = JSON.parse(docSnap.data().data);
    }


    return res
};


export const readSensorDevice =  async () => {
    const accountUser = await asyncLocalStorage.getItem("loginEmail");

    const sensorDevice = localStorage.getItem(
        COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE
    );
    if (sensorDevice) {
        return JSON.parse(sensorDevice);
    } else {
        return readSensorDeviceStore();
    }
};


