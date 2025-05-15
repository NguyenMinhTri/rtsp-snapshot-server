import React, { Fragment, useEffect, useId, useState } from "react";
import {
    Route,
    BrowserRouter as Router,
    Routes
} from "react-router-dom";
import DefaultLayout from "./components/Layout/DefaultLayout";
import { privateRoutes, publicRoutes } from "./routes";

import { ErrorBoundary } from "react-error-boundary";
import { Helmet } from "react-helmet";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import WebError from "./pages/WebError";
import ProtectedRoute from "./routes/ProtectedRoute";
function ErrorFallback({ error, resetErrorBoundary }) {
    return <WebError errorMessage={error.message} />;
}


var DEBUG = true;
if (!DEBUG) {
    if (!window.console) window.console = {};
    var methods = ["log", "debug", "warn", "info", "error"];
    for (var i = 0; i < methods.length; i++) {
        console[methods[i]] = function () {};
    }
}

function App() {
    const [currentDomain, setCurrentDomain] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [urlImg, setURLImg] = useState("");

    useEffect(() => {
        setCurrentDomain(window.location.href);
        if (window.location.href.toLowerCase().includes("namngonviet")) {
            setTitle("IoT - Nấm Ngon Việt");
            setURLImg("/image/nnv.png");
        } else if (
            window.location.href.toLowerCase().includes("tanphamnguyen")
        ) {
            setTitle("IoT - Tân Phạm Nguyên");
            setURLImg("/image/logo-tpn.png");
        }
    else if (
        window.location.href.toLowerCase().includes("tantruongthanhltd")
    ) {
        setTitle("IoT - Tân Trường Thành");
        setURLImg("/image/tantruongthanh.png");
    }
    else if (
        window.location.href.toLowerCase().includes("viet-industry")
    ) {
        setTitle("IoT - Viet Industry");
        setURLImg("/image/cnv-logo.png");
    }
    else if (
        window.location.href.toLowerCase().includes("iesem")
    ) {
        setTitle("IoT - Viện Khoa học Công nghệ và Quản lý Môi trường - Trường Đại học Công nghiệp TP. Hồ Chí Minh");
        setURLImg("/image/iuh-logo.png");
    }
    else if (
        window.location.href.toLowerCase().includes("kieufarm")
    ) {
        setTitle("IoT - KIEUFARM");
        setURLImg("/image/kieu-farm-logo.png");
    }
        else {
            setTitle("IoT - Đại Việt");
            setURLImg("/image/logo_cpn.png");
        }
    }, []);
    const id = useId();

    return (
        <Router>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content="Nền tảng giám sát IoT" />
                <meta property="og:title" content={title} />
                <meta
                    property="og:description"
                    content="Nền tảng giám sát IoT"
                />
                <meta property="og:image" content={urlImg} />
                <link rel="icon" href={urlImg} sizes="32x32" />
                <link rel="icon" href={urlImg} sizes="192x192" />
                {/*Thêm các thẻ meta khác tại đây*/}
            </Helmet>
            <ToastContainer />
            <div className="App">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <Routes>
                        <Route element={<ProtectedRoute />}>
                            {privateRoutes.map((route, index) => {
                                const Page = route.component;

                                let Layout;
                                if (route.layout === null) {
                                    Layout = Fragment;
                                } else if (route.layout) {
                                    Layout = route.layout;
                                } else {
                                    Layout = DefaultLayout;
                                }

                                return (
                                    <Route
                                        key={id}
                                        path={route.path}
                                        element={
                                            <Layout>
                                                <Page />
                                            </Layout>
                                        }
                                    />
                                );
                            })}
                        </Route>
                        {publicRoutes.map((route) => {
                            const Page = route.component;

                            let Layout;
                            if (route.layout === null) {
                                Layout = Fragment;
                            } else if (route.layout) {
                                Layout = route.layout;
                            } else {
                                Layout = DefaultLayout;
                            }

                            return (
                                <Route
                                    key={id}
                                    path={route.path}
                                    element={
                                        <Layout>
                                            <Page />
                                        </Layout>
                                    }
                                />
                            );
                        })}
                    </Routes>
                </ErrorBoundary>
            </div>
        </Router>
    );
}

export default App;
