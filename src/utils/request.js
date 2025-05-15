import axios from 'axios';

const AUTH_TOKEN = sessionStorage.getItem('call_token');

const request = axios.create({
    baseURL: 'https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/',
});

// Alter defaults after instance has been created
request.defaults.headers.common['Authorization'] = AUTH_TOKEN;
request.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

export default request;
