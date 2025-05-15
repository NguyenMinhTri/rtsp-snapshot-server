export const register = () => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((registration) => {
            console.log("Service worker registered:", registration);
          })
          .catch((error) => {
            console.log("Service worker registration failed:", error);
          });
      });
    } else {
      console.log("Service workers are not supported.");
    }
  };
  
  export const unregister = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister();
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  };
  