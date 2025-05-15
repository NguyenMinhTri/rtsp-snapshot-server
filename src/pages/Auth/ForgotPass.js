import React, { useState } from 'react';
import './Auth.scss';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Toast from '../../utils/toasts';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';
export default function ForgotPass({ backToLogin }) {
    const [validateEmail, setValidateEmail] = useState(false);
    const [validateEmailPass, setValidateEmailPass] = useState(false);

    const [email, setEmail] = useState('');
    const auth = getAuth();
    // handle login equal email
    const handleForgotPass = () => {
        if (!email) {
            setValidateEmail(true);
            return;
        }

        sendPasswordResetEmail(auth, email)
            .then(() => {
                Toast('success', `Vui lòng truy cập email ${email} để đặt lại mật khẩu `);
                // alert('Vui long kiem tra email cua ban');
                // Password reset email sent!
                // ..
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log({ errorCode, errorMessage });
                // ..
            });
    };

    // back to login page
    const handleBackLoginPage = () => {
        backToLogin('Login');
    };

    return (
        <div className="form_login">
            <h1 style={{ marginBottom: '20px', marginTop: '10px' }}>QUÊN MẬT KHẨU</h1>
            <div>
                <div className="form_input">
                    <p style={{ marginBottom: '10px' }}>Nhập email để lấy lại mật khẩu</p>
                    <TextField
                        required
                        error={validateEmail}
                        id="outlined-required"
                        type={'email'}
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

                <div style={{ marginTop: '5px' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        style={{ backgroundColor: '#088f81' }}
                        onClick={handleForgotPass}>
                        LẤY LẠI MẬT KHẨU
                    </Button>
                </div>
                <div style={{ marginTop: '5px' }}>
                    <p style={{ textAlign: 'center', margin: '5px 0' }}>Đã có mật khẩu</p>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleBackLoginPage}>
                        TRỞ VỀ ĐĂNG NHẬP
                    </Button>
                </div>
            </div>
        </div>
    );
}
