import { getAuth, signOut } from "firebase/auth";
import Cookies from "js-cookie";
import React from "react";
import Toast from "../../utils/toasts";
import { useNavigate } from "react-router-dom";
import MyButton from "../../components/MyButton";
import { useState } from "react";
import { useEffect } from "react";
import subscribeTokenToTopic from "../../utils/compare_date";
import { getToken } from "firebase/messaging";
import {  messaging } from "../../config/firebase";
    const unsubscribeAllTopics = async (token) => {
        const key = `fcm_topics_${token.substring(0, 20)}`;
        const topicJson = localStorage.getItem(key);

        if (!topicJson) return;

        const topics = JSON.parse(topicJson);

        for (const topic of topics) {
            await subscribeTokenToTopic(token, topic, false); // false = unsubscribe
        }

        // Xóa cache sau khi unsubscribe
        localStorage.removeItem(key);
    };
export default function WebError({errorMessage}) {
    const [currentDomain, setCurrentDomain] = useState("");

    useEffect(() => {
        setCurrentDomain(window.location.href);
    }, []);
    const auth = getAuth();
    const navigate = useNavigate();
    const handleLogOut = async () => {
        await signOut(auth);

        const token = await getToken(messaging);
        if (token) {
            await unsubscribeAllTopics(token);
        }
        sessionStorage.clear();
        localStorage.clear();
        Cookies.remove("auth_token");
        Toast("success", "Bạn đã đăng xuất. Vui lòng đăng nhập lại");
        navigate("/");

    };
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                height: "70vh",
                // marginTop: '10%',
            }}
        >
       
       <p style={{ fontSize: "18px", margin: "20px 0", color: "red" }}>
                Có lỗi xảy ra vui lòng nhấn nút khởi động lại.
            </p>
            <p style={{ fontSize: "18px", margin: "20px 0", color: "red" }}>
                Error message: {errorMessage}
            </p>
            <MyButton
                name="Khởi động lại"
                fullWidth={false}
                icon={null}
                backgroundColor={"red"}
                onClick={handleLogOut}
            />
        </div>
    );
}
