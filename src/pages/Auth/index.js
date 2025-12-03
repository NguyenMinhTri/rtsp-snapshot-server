
import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPass from './ForgotPass';

import { Navigate, useNavigate } from 'react-router-dom';
import {
    getAuth,
    
    GoogleAuthProvider,
    onAuthStateChanged,
    OAuthProvider,
    RecaptchaVerifier,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    signInWithPopup,
} from 'firebase/auth';
import './Auth.scss';
import Cookies from 'js-cookie';
async function handleAuthStateChanged() {
    return new Promise((resolve, reject) => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
     
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not authenticated'));
        }
      });
    });
  }
  
  function Auth() {
    const [currentDomain, setCurrentDomain] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userObj, setUserObji] = useState({});
    useEffect(() => {
      setCurrentDomain(window.location.href);
    }, []);
    useEffect(() => {
      async function fetchAuthData() {
        try {
          const user = await handleAuthStateChanged();
          console.log('User authenticated:', user.uid);
          const tokenData = await user.getIdToken();
          setUserObji(user);
          Cookies.set('auth_token', tokenData, { expires: 2147483647 });
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchAuthData();
    }, []);
  
    if (isLoading) {

      return <p>Loading...</p>;
    }
  
    if (isLoggedIn) {
      return userObj.email !== null && (userObj.email.includes("datalogger") || userObj.email.includes("tttservice")) ? <Navigate to="/generality" replace />:  <Navigate to="/home" replace />;
    }
  
    const hostname = window.location.hostname;

    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.");

    const logoSrc = isLocalhost
      ? "/image/navis.png" // Logo cho localhost
      : currentDomain.includes("namngonviet")
      ? "/image/nnv.png"
      : currentDomain.includes("datalogger.iotdaiviet.com")
      ? "/image/logo_cpn.png"
      : currentDomain.includes("ec-monitoring.tanphamnguyen.com")
      ? "/image/logo-tpn.jpg"
      : currentDomain.includes("kieufarm.vn")
      ? "/image/kieu-farm-logo.png"
      : currentDomain.includes("iesem")
      ? "/image/iuh-logo.png"
      : currentDomain.includes("viet-industry")
      ? "/image/cnv-logo.png"
      : "/image/tantruongthanh.png";

    const logoWidth = isLocalhost
      ? 200
      : currentDomain.includes("iotdaiviet")
      ? 200
      : 100;

    return (
      <>
        <div className="auth_wrap">
          <div className="auth_container">
            <div className="bg_auth_wrap">
              <img className="auth_logo enhanced_logo" src={logoSrc} width={logoWidth} alt="" />
              <div className="bg_auth"></div>
            </div>
            <div className="login_register">
              <Login />
            </div>
          </div>
        </div>
      </>
    );

  }
  
  export default Auth;