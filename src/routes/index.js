import { lazy } from "react";

// import Home from "../pages/Home";
// import Account from "../pages/Account";
// import Auth from "../pages/Auth";
// import Login from "../pages/Auth/Login";
// import NotFound from "../pages/404";
// import Camera from "../pages/Camera";
// import Monitor from "../pages/Monitor";
// import Report from "../pages/Report";
// import MyMap from "../pages/Map";
// import History from "../pages/History";
// import Search from "../pages/Search";
// import NotDevice from "../pages/NotDevice";
import WebError from "../pages/WebError";

// level 2
import DetailChart from "../components/DetailChart";

// layout
import OnlyHeader from "../components/Layout/OnlyHeader";
import Notification from "../pages/Notification";
import Loadable from "../components/Loadable";

// lazy load
const Home = Loadable(lazy(() => import("../pages/Home")));
const Auth = Loadable(lazy(() => import("../pages/Auth")));
const NotFound = Loadable(lazy(() => import("../pages/404")));
const Login = Loadable(lazy(() => import("../pages/Auth/Login")));
const Monitor = Loadable(lazy(() => import("../pages/Monitor")));
const MyMap = Loadable(lazy(() => import("../pages/Map")));
const Search = Loadable(lazy(() => import("../pages/Search")));
const History = Loadable(lazy(() => import("../pages/History")));
const NotDevice = Loadable(lazy(() => import("../pages/NotDevice")));
const Report = Loadable(lazy(() => import("../pages/Report")));
const Camera = Loadable(lazy(() => import("../pages/Camera")));
const Account = Loadable(lazy(() => import("../pages/Account")));
const SettingPage = Loadable(lazy(() => import("../pages/Setting")));
const Generality = Loadable(lazy(() => import("../pages/Generality")));
const QuickChart = Loadable(lazy(() => import("../pages/QuickChart")));
// public route
const privateRoutes = [
    {
        path: "/home",
        component: Home,
    },
    {
        path: "/generality",
        component: Generality,
    },
    {
        path: "/account",
        component: Account,
    },
    {
        path: "/map",
        component: MyMap,
    },
    {
        path: "/monitor",
        component: Monitor,
    },
    {
        path: "/search",
        component: Search,
    },
    {
        path: "/notification",
        component: Notification,
    },
    {
        path: "/report",
        component: Report,
    },
    {
        path: "/camera",
        component: Camera,
    },
    {
        path: "/history",
        component: History,
    },
    {
        path: "/search",
        component: History,
    },
    {
        path: "/search/chart/:station",
        component: DetailChart,
    },
    {
        path: "/nothing",
        component: NotDevice,
        layout: OnlyHeader,
    },
    {
        path: "/setting",
        component: SettingPage,
        // layout: OnlyHeader,
    },
    {
        path: "/chart",
        component: QuickChart,
    },
    
    // {
    //     path: '/error',
    //     component: WebError,
    //     layout: OnlyHeader,
    // },
];

// private route
const publicRoutes = [
    {
        path: "/",
        component: Auth,
        layout: null,
    },
    {
        path: "/*",
        component: NotFound,
        layout: null,
    },
];

export { privateRoutes, publicRoutes };
