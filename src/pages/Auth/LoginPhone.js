import GoogleIcon from '@mui/icons-material/Google';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import React, { useState } from 'react';
import './Auth.scss';

import { useNavigate } from 'react-router-dom';

import { getAuth } from 'firebase/auth';

import AppleIcon from '@mui/icons-material/Apple';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import Toast from '../../utils/toasts';
import './Auth.scss';

import Cookies from 'js-cookie';
import 'react-toastify/dist/ReactToastify.css';

import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

import asyncLocalStorage from '../../utils/async_localstorage';

export default function LoginPhone({ backToLogin }) {
    const [showInputPhone, setShowInputPhone] = useState(true);
    const [showInputOTP, setShowInputOTP] = useState(false);

    const [validatePhone, setValidatePhone] = useState(false);
    const [validateOTP, setValidateOTP] = useState(false);

    const [phoneNumber, setPhoneNumber] = useState('');

    const [result, setResult] = useState('');
    const [otp, setOTP] = useState('');

    const [disableBtnPhoneNumber, setDisableBtPhoneNumber] = useState(false);

    const navigate = useNavigate();

    // get deviced user
    const getDeviceUser = (author, accessToken) => {
        author.getIdToken().then((data) => {
            const token = `Bearer ${data}`;
            // let a = getDeviceUser(token);
            Toast('info', 'Vui lòng chờ... Đang chuyển hướng!');
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
                            Cookies.set('auth_token', accessToken, {
                                expires: 2147483647,
                            });
                            Toast('success', 'Đăng nhập thành công');
                            navigate('/home');
                        })
                        .catch(() => {
                            Toast('error', 'Đã xảy ra lỗi trong quá trình đăng nhập');
                        });
                })
                .catch((err) => {
                    console.log({ err_loin: err });
                });
        });
    };

    // handle login equal email
    const auth = getAuth();

    // login equal phone number
    const handleLoginPhoneNumber = () => {
        if (!phoneNumber) {
            setValidatePhone(true);
            return;
        }
        if (phoneNumber.length < 8) {
            Toast('error', 'Số điện thoại nhập không hợp lệ');
            return;
        }
        const a = phoneNumber.slice(1);
        const phone = '+84' + a;

        window.recaptchaVerifier = new RecaptchaVerifier(
            'recaptcha-container',
            {
                size: 'invisible',
            },
            auth
        );

        setDisableBtPhoneNumber(true);

        const verify = window.recaptchaVerifier;

        signInWithPhoneNumber(auth, phone, verify)
            .then((confirmationResult) => {
                console.log({ confirmationResult });
                setShowInputOTP(true);
                setShowInputPhone(false);
                setResult(confirmationResult);
                Toast('info', 'Vui lòng nhập mã OTP');
                setDisableBtPhoneNumber(false);
            })
            .catch((error) => {
                Toast('error', `Đăng nhập thất bại ${error.message} `);
                setDisableBtPhoneNumber(false);
            });
    };

    const verifyOTP = () => {
        if (!otp) {
            setValidateOTP(true);
            return;
        }
        if (otp.length < 6) {
            Toast('error', 'Mã OTP phải gồm 6 kí tự');
            return;
        }
        result
            .confirm(otp)
            .then((result) => {
                const user = result.user;
                console.log({ user });
                localStorage.setItem('loginUserName', user.phoneNumber);
                // sessionStorage.setItem('auth_token', user.refreshToken);

                getDeviceUser(user, user.accessToken);
            })
            .catch((error) => {
                Toast('error', `Đăng nhập thất bại ${error.message} `);
            });
    };

    // back to login page
    const handleBackLoginPage = () => {
        backToLogin('Login');
    };

    return (
        <div className="form_login">
            <h1 style={{ marginBottom: '15px' }}>ĐĂNG NHẬP SMS</h1>
            <div className="">
                {showInputPhone ? (
                    <div className="form_input">
                        {/* <p style={{ marginBottom: '10px' }}>Nhập mật khẩu của bạn</p> */}
                        <TextField
                            required
                            error={validatePhone}
                            id="outlined-required"
                            label="Nhập số điện thoại của bạn"
                            autoFocus
                            size="small"
                            color="success"
                            fullWidth
                            onChange={(e) => {
                                setValidatePhone(false);
                                setPhoneNumber(e.target.value);
                            }}
                        />
                    </div>
                ) : showInputOTP ? (
                    <div className="form_input">
                        <TextField
                            required
                            error={validateOTP}
                            id="outlined-required"
                            label="Nhập mã OTP"
                            autoFocus
                            value={otp}
                            size="small"
                            color="success"
                            fullWidth
                            onChange={(e) => {
                                setValidateOTP(false);
                                setOTP(e.target.value);
                            }}
                        />
                    </div>
                ) : null}

                <div className="">
                    {showInputPhone ? (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LocalPhoneRoundedIcon />}
                            size="medium"
                            disabled={disableBtnPhoneNumber}
                            onClick={handleLoginPhoneNumber}>
                            XÁC THỰC SỐ ĐIỆN THOẠI
                        </Button>
                    ) : showInputOTP ? (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LocalPhoneRoundedIcon />}
                            size="medium"
                            onClick={verifyOTP}>
                            ĐĂNG NHẬP NGAY
                        </Button>
                    ) : null}
                </div>
            </div>
            <div>
                <p style={{ textAlign: 'center', marginTop: '10px' }}>
                    Trở về đăng nhập bằng email
                </p>
                <div style={{ marginTop: '15px' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleBackLoginPage}>
                        TRỞ VỀ ĐĂNG NHẬP
                    </Button>
                </div>
            </div>
            <div id="recaptcha-container"></div>
        </div>
    );
}
