import { Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";
const PublishRoute = ({ redirectPath = "/" }) => {
    const token = Cookies.get("auth_token");
    if (token) {
        return <Navigate to={"/home"} />;
    }
};

export default PublishRoute;
