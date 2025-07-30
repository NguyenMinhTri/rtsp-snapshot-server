import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Toast = (type, message, time = 5000, onClick) => {
    const options = {
        position: "top-right",
        autoClose: time,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
    };

    if (typeof onClick === "function") {
        options.onClick = onClick;
    }

    toast[type](message, options);
};


export default Toast;
