import { Routes, Route, Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
const ProtectedRoute = ({ redirectPath = '/' }) => {
    const token = Cookies.get('auth_token');
    const navigate = useNavigate();

    if (!token) {
        return <Navigate to={redirectPath} replace />;
    }
    return (
        <>
            <Outlet />
        </>
    );
};

export default ProtectedRoute;
