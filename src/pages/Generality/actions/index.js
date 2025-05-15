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


const type = "GeneralPage"

export const COLLECTION_CACHING = `CachingData/${type}`;




// ! save
export const saveDataCaching = async (account, month, data) => {
    try {
        await setDoc(
            doc(dbStore, COLLECTION_CACHING,account, month),
            data
        );
    } catch (e) {
        Toast("error", "Error save document");
        console.error("Error save document: ", e);
    }
};

//! Read by sensor of station
export const readDataCachingByMonth = async (account, month) => {
    const docRef = doc(dbStore, COLLECTION_CACHING, account, month);
    const docSnap = await getDoc(docRef);

    let res = [];
    if (docSnap.exists()) {
        res.push({ ...docSnap.data(), month: month });
    } else {
        Toast("warning", "No such document!");
    }
    return res;
};

//! Read all data in Station
export const readDataCachingByAccount = async (account) => {
    const querySnapshot = await getDocs(
        collection(dbStore, COLLECTION_CACHING, account)
    );
    let result = [];
    querySnapshot.forEach((doc) => {
        result.push({ ...doc.data(), account: account, month: doc.id });
    });
    return result;
};

//! Delete

export const deleteFieldDataCaching = async (account, month) => {
    await deleteDoc(
        doc(dbStore, COLLECTION_CACHING, account, month)
    );
};

const deleteDocsData = async (station) => {
    await deleteDoc(collection(dbStore, COLLECTION_CACHING, station));
};
