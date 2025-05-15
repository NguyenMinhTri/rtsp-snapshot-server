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
import { dbStore } from "../../../config/firebase";
import Toast from "../../../utils/toasts";

const OWNER = "TanTruongThanh";
export const COLLECTION_SETTING_THRESHOLD = `SettingThreshold/${OWNER}`;
export const COLLECTION_SAVE_SENSOR_ACCOUNT_BY_DEVICE = `SensorOfDevice`

// ! save
export const saveDataSetting = async (station, sensor, data) => {
    try {
        await setDoc(
            doc(dbStore, COLLECTION_SETTING_THRESHOLD, station, sensor),
            data
        );
    } catch (e) {
        Toast("error", "Error save document");
        console.error("Error save document: ", e);
    }
};


//! Read by sensor of station
export const readDataStationSensor = async (station, sensor) => {
    const docRef = doc(dbStore, COLLECTION_SETTING_THRESHOLD, station, sensor);
    const docSnap = await getDoc(docRef);

    let res = [];
    if (docSnap.exists()) {
        res.push({ ...docSnap.data(), sensor: sensor });
    } else {
        Toast("warning", "No such document!");
    }
    return res;
};

//! Read all data in Station
export const readDataByStation = async (station) => {
    const querySnapshot = await getDocs(
        collection(dbStore, COLLECTION_SETTING_THRESHOLD, station)
    );
    let result = [];
    querySnapshot.forEach((doc) => {
        result.push({ ...doc.data(), station: station, sensor: doc.id });
    });
    return result;
};

//! Delete

export const deleteFieldSensor = async (station, sensor) => {
    await deleteDoc(
        doc(dbStore, COLLECTION_SETTING_THRESHOLD, station, sensor)
    );
};

const deleteDocsData = async (station) => {
    await deleteDoc(collection(dbStore, COLLECTION_SETTING_THRESHOLD, station));
};
