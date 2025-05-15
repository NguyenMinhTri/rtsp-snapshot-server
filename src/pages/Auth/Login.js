import "react-toastify/dist/ReactToastify.css";
import "./Auth.scss";

import GoogleIcon from "@mui/icons-material/Google";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {
    getAuth,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { child, get, getDatabase, ref } from "firebase/database";
import BackDropLoading from "../../components/BackDropLoading";
import asyncLocalStorage from "../../utils/async_localstorage";
import Toast from "../../utils/toasts";
import QRLogin from "./QRLogin";
import { SENSOR_OF_DEVICE_KEY } from "../../constants";

const provider = new GoogleAuthProvider();
const providerApple = new OAuthProvider("apple.com");

export default function Login() {
    const [loginSocial, setLoginSocial] = useState(false);
    const [completeLogin, setCompleteLogin] = useState(false);

    const [registerForm, setRegisterForm] = useState(false);
    const [forgotForm, setForgotForm] = useState(false);

    const [validateEmail, setValidateEmail] = useState(false);
    const [validateEmailPass, setValidateEmailPass] = useState(false);

    const [email, setEmail] = useState("");
    const [emailPass, setEmailPass] = useState("");

    const [loginPhone, setLoginPhone] = useState(false);
    const [showInputOTP, setShowInputOTP] = useState(true);

    const [validatePhone, setValidatePhone] = useState(false);
    const [validateOTP, setValidateOTP] = useState(false);

    const [phoneNumber, setPhoneNumber] = useState("");

    const [result, setResult] = useState("");
    const [otp, setOTP] = useState("");

    const [disableBtnPhoneNumber, setDisableBtPhoneNumber] = useState(false);

    const [loading , setLoading] = useState(false);
    const db = ref(getDatabase());
    const navigate = useNavigate();
    const auth = getAuth();
    // handle get listsor of device 
    const handleGetListSensorFromDevice = async (listDevice) => {
        try {
            const reqGetSensors = listDevice.map((device) => {
                return (async () => {
                    const res = await get(child(db, `Devices/DAIVIET-RS485/${device}`))
                    if(res.exists()) {
                        const listSensorOfDevice = new Set()
                        const {RS485Data} = res.val();
                        try{
                            RS485Data.forEach((sensor) => {
                                listSensorOfDevice.add(sensor.Name)
                            })
                        }
                        catch(e){
                            
                        }
                        return {
                            device : device,
                            sensors : [...listSensorOfDevice]
                        }
                    }
                })()
            })
    
            const  res = await Promise.all(reqGetSensors)
            localStorage.setItem(SENSOR_OF_DEVICE_KEY, JSON.stringify(res))
        }
        catch(error) {
            Toast(
                "error",
                "Đã xảy ra lỗi trong quá trình đăng nhập"
            );
            setLoading(false)
            throw Error(error)
        }
        
        
    }

    // get deviced user
    const getDeviceUser = (author, accessToken) => {
        author.getIdToken().then((data) => {
            const token = `Bearer ${data}`;
            

            fetch(
                "https://asia-east2-weatherstationiotdaiviet.cloudfunctions.net/HttpPostRequest/api/getListDevices",
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: token,
                        "Content-Type": "application/x-www-form-urlencoded",
                    }),
                }
            )
                .then((response) => response.json())
                .then(async (myJson) => {
                    const res = myJson.ListDevicesOfUser;
                    const filteredObj = {};
                    const listSensorKeys = Object.keys(res)
                    listSensorKeys
                        .filter(
                            (key) =>
                                !key.includes("HUMATIC-HCE") &&
                                !key.includes("IRO-")
                        )
                        .forEach((key) => {
                            filteredObj[key] = res[key];
                        });
                    await handleGetListSensorFromDevice(listSensorKeys)
                    asyncLocalStorage
                        .setItem("device_user", JSON.stringify(filteredObj))
                        .then(() => {
                           
                            Cookies.set("auth_token", accessToken, {
                                expires: 2147483647,
                            });
                            Toast("success", "Đăng nhập thành công");
                            if(author.email.includes("datalogger") || author.email.includes("tttservice")){
                                navigate("/generality");
                            } else {
                                navigate("/home");
                            }                        
                            setCompleteLogin(true);
                            setLoading(false)
                        })
                        .catch((e) => {
                            Toast(
                                "error",
                                "Đã xảy ra lỗi trong quá trình đăng nhập"
                            );
                            setLoading(false)
                            setCompleteLogin(false);
                        });
                })
                .catch((err) => {
                    console.log({ err_loin: err });
                });
        });
    };

    // handle login equal email
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        let userNameParam = searchParams.get("user");
        let passwordParam = searchParams.get("pass");

        if (userNameParam !== null && passwordParam !== null) {
            setEmail(userNameParam);
            setEmailPass(passwordParam);
            setCompleteLogin(true);
            signInWithEmailAndPassword(auth, userNameParam, passwordParam)
                .then((userCredential) => {
                    const author = userCredential.user;
                    const isVerify = author.emailVerified;
                    console.log(author);
                    console.log({ isVerify });
                    const accessToken = userCredential.user.accessToken;
                    localStorage.setItem("loginUserName", author.displayName);
                    localStorage.setItem("loginEmail", author.email);
                    // localStorage.setItem('author', JSON.stringify(userCredential));

                    getDeviceUser(author, accessToken);
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    Toast("error", `Đăng nhập thât bại ${errorMessage}`);
                    setCompleteLogin(false);
                });
        }
    }, []);
    const handleLoginEmail = () => {
        if (!email) {
            setValidateEmail(true);
            return;
        }
        if (!emailPass) {
            setValidateEmailPass(true);
            return;
        }
        setLoading(true)
        setCompleteLogin(true);
        signInWithEmailAndPassword(auth, email, emailPass)
            .then((userCredential) => {
                const author = userCredential.user;
                const isVerify = author.emailVerified;
               
                const accessToken = userCredential.user.accessToken;
                localStorage.setItem("loginUserName", author.displayName);
                localStorage.setItem("loginEmail", author.email);
                localStorage.setItem("imgUser", author.photoURL);

                getDeviceUser(author, accessToken);
            })
            .catch((error) => {
                const errorMessage = error.message;
                setLoading(false)
                Toast("error", `Đăng nhập thât bại ${errorMessage}`);
                setCompleteLogin(false);
            });
    };

    //show input phone
    const handleShowFormPhone = (e) => {
        setLoginPhone(true);
    };

    // login google
    const handleLoginGG = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                setLoading(true);
                setCompleteLogin(true);
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential =
                    GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;

                const user = result.user;

                const name = user.displayName;
                const imgUser = user.photoURL;
                localStorage.setItem("loginUserName", name);
                localStorage.setItem("imgUser", imgUser);
                localStorage.setItem("loginEmail", user.email);
                getDeviceUser(user, token);
            })
            .catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The AuthCredential type that was used.
                const credential =
                    GoogleAuthProvider.credentialFromError(error);
                console.log({ errorCode, errorMessage, email, credential });
                Toast("error", "Đăng nhập thất bại");

                // ...
            });
    };

    // login apple

    providerApple.addScope("email");
    providerApple.addScope("name");

    providerApple.setCustomParameters({
        // Localize the Apple authentication screen in French.
        locale: "en_US",
    });

    const handleLoginApple = () => {
        signInWithPopup(auth, providerApple)
            .then((result) => {
                // The signed-in user info.
                const user = result.user;

                // Apple credential
                const credential = OAuthProvider.credentialFromResult(result);
                const accessToken = credential.accessToken;

                const name = user.displayName;
                const imgUser = user.photoURL;
                localStorage.setItem("loginUserName", name);
                localStorage.setItem("imgUser", imgUser);
                localStorage.setItem("loginEmail", user.email);
                getDeviceUser(user, accessToken);

                // ...
            })
            .catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                const email = error.customData.email;
                // The credential that was used.
                const credential = OAuthProvider.credentialFromError(error);

                console.log({ error });
                Toast("error", "Đăng nhập thất bại");

                // ...
            });
    };

    // const handleLoginPhoneNumber = () => {
    //     if (!phoneNumber) {
    //         setValidatePhone(true);
    //         return;
    //     }
    //     const a = phoneNumber.slice(1);
    //     const phone = '+84' + a;
    //     window.recaptchaVerifier = new RecaptchaVerifier(
    //         'recaptcha-container',
    //         {
    //             size: 'invisible',
    //         },
    //         auth
    //     );
    //     setDisableBtPhoneNumber(true);
    //     const verify = window.recaptchaVerifier;
    //     signInWithPhoneNumber(auth, phone, verify)
    //         .then((confirmationResult) => {
    //             setShowInputOTP(true);
    //             setShowInputPhone(false);
    //             setResult(confirmationResult);
    //             Toast('info', 'Vui lòng nhập mã OTP');
    //             setDisableBtPhoneNumber(false);
    //         })
    //         .catch((error) => {
    //             alert(error);
    //             Toast('error', `Đăng nhập thất bại ${error.message} `);
    //             setDisableBtPhoneNumber(false);

    //             // Error; SMS not sent
    //             // ...
    //         });
    // };

    const verifyOTP = () => {
        if (!otp) {
            setValidateOTP(true);
            return;
        }
        result
            .confirm(otp)
            .then((result) => {
                const user = result.user;
                console.log({ user });
                localStorage.setItem("loginUserName", user.phoneNumber);
                // sessionStorage.setItem('auth_token', user.refreshToken);

                getDeviceUser(user, user.accessToken);
            })
            .catch((error) => {
                Toast("error", `Đăng nhập thất bại ${error.message} `);
            });
    };

    // register
    const handleRegister = () => {
        setRegisterForm(true);
    };

    //forgot pass
    const handleForgotPass = () => {
        setForgotForm(true);
    };

    // back to login
    const backToLogin = (v) => {
        if (v) {
            setRegisterForm(false);
            setForgotForm(false);
            setLoginSocial(false);
            setLoginPhone(false);
        }
    };

    return (
        <> 
                {loading && <BackDropLoading/>}
                <div className="form_login">
                    {/* <img src="/image/logo_cpn.png" width={200} height={100} alt="" /> */}
                    <h1>ĐĂNG NHẬP</h1>
                    <div id="recaptcha-container"></div>
                    <div>
                        <div className="form_input">
                            {/* <p style={{ marginBottom: '10px' }}>Nhập email của bạn</p> */}
                            <TextField
                                required
                                error={validateEmail}
                                id="outlined-required"
                                type={"email"}
                                label="Nhập email của bạn"
                                defaultValue=""
                                size="small"
                                color="success"
                                fullWidth
                                onChange={(e) => {
                                    setValidateEmail(false);
                                    setEmail(e.target.value);
                                }}
                            />
                        </div>
                        <div className="form_input">
                            {/* <p style={{ marginBottom: '10px' }}>Nhập mật khẩu của bạn</p> */}
                            <TextField
                                required
                                error={validateEmailPass}
                                type={"password"}
                                id="outlined-required"
                                label="Nhập mật khẩu của bạn"
                                defaultValue=""
                                size="small"
                                color="success"
                                fullWidth
                                onChange={(e) => {
                                    setValidateEmailPass(false);
                                    setEmailPass(e.target.value);
                                }}
                            />
                        </div>
                        <div style={{ marginTop: "5px" }}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                style={{ backgroundColor: "#088f81" }}
                                onClick={handleLoginEmail}
                                disabled={completeLogin}
                            >
                                ĐĂNG NHẬP
                            </Button>
                        </div>
                        {/* <div className="register_forgot">
                                <p className="register" onClick={handleRegister}>
                                    Đăng ký ngay
                                </p>
                                <p className="forgot_pass" onClick={handleForgotPass}>
                                    Quên mật khẩu
                                </p>
                            </div> */}
                    </div>

                    <div className="break_auth">
                        <div className="break_first"></div>
                        <span
                            style={{
                                fontWeight: "500",
                                fontSize: "18px",
                                margin: " 0 10px",
                            }}
                        >
                            OR
                        </span>
                        <div className="break_second"></div>
                    </div>
                    <div className="login_social">
                        <div className="login_social-gg">
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                size="medium"
                                style={{ fontWeight: "500" }}
                                startIcon={<GoogleIcon sx={{ color: "red" }} />}
                                onClick={handleLoginGG}
                            >
                                ĐĂNG NHẬP BẰNG GOOGLE
                            </Button>
                        </div>
                        {/* <div className="login_social-sms">
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<LocalPhoneRoundedIcon />}
                                size="medium"
                                onClick={handleShowFormPhone}
                            >
                                ĐĂNG NHẬP BẰNG SMS
                            </Button>
                        </div> */}

                        <QRLogin loading={loading} setLoading={setLoading} backToLogin={backToLogin} handleGetListSensorFromDevice={handleGetListSensorFromDevice} />
                        {/* <div className="login_social-apple">
                            <Button
                                fullWidth
                                variant="outlined"
                                color="success"
                                size="medium"
                                style={{ fontWeight: '500', color: 'black' }}
                                startIcon={<AppleIcon sx={{ color: 'black' }} />}
                                onClick={handleLoginApple}>
                                ĐĂNG NHẬP BẰNG APPLE
                            </Button>
                        </div> */}
                    </div>
                </div>
        </>
    );
}

// {
//     showInputPhone ? (
//         <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<LocalPhoneRoundedIcon />}
//             size="medium"
//             disabled={disableBtnPhoneNumber}
//             onClick={handleLoginPhoneNumber}>
//             XÁC THỰC SỐ ĐIỆN THOẠI
//         </Button>
//     ) : showInputOTP ? (
//         <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<LocalPhoneRoundedIcon />}
//             size="medium"
//             onClick={verifyOTP}>
//             ĐĂNG NHẬP NGAY
//         </Button>
//     ) : (
//         <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<LocalPhoneRoundedIcon />}
//             size="medium"
//             onClick={handleShowFormPhone}>
//             SMS
//         </Button>
//     );
// }

// {
//     showInputPhone ? (
//         <div className="form_input">
//             {/* <p style={{ marginBottom: '10px' }}>Nhập mật khẩu của bạn</p> */}
//             <TextField
//                 required
//                 error={validatePhone}
//                 id="outlined-required"
//                 label="Nhập số điện thoại của bạn"
//                 autoFocus
//                 size="small"
//                 color="success"
//                 fullWidth
//                 onChange={(e) => {
//                     setValidatePhone(false);
//                     setPhoneNumber(e.target.value);
//                 }}
//             />
//         </div>
//     ) : showInputOTP ? (
//         <div className="form_input">
//             <TextField
//                 required
//                 error={validateOTP}
//                 id="outlined-required"
//                 label="Nhập mã OTP"
//                 autoFocus
//                 value={otp}
//                 size="small"
//                 color="success"
//                 fullWidth
//                 onChange={(e) => {
//                     setValidateOTP(false);
//                     setOTP(e.target.value);
//                 }}
//             />
//         </div>
//     ) : null;
// }
