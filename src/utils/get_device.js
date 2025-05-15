// const functions = getFunctions(app, 'asia-east2');
import asyncLocalStorage from './async_localstorage';

const getDeviceUser = (token) => {
    let a = 0;
    fetch(
        'https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/getListDevices',
        {
            method: 'POST',
            headers: new Headers({
                Authorization: token,
                'Content-Type': 'application/x-www-form-urlencoded',
            }),
        }
    )
        .then((response) => response.json())
        .then((myJson) => {
            const res = myJson.ListDevicesOfUser;
            const filteredObj = {};
            Object.keys(res)
              .filter(key => !key.includes("HUMATIC-HCE") && !key.includes("IRO-"))
              .forEach(key => {
                filteredObj[key] = res[key];
              });
            asyncLocalStorage
                .setItem('device_user', JSON.stringify(filteredObj))
                .then(() => {
                    a = 1;
                    return 'COMPLETE';
                })
                .catch(() => {
                    return 'ERROR';
                });
        });
    console.log('Save complete', a);
};

export default getDeviceUser;
