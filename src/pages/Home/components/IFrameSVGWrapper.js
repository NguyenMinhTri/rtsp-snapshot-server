import React, { useEffect, useState } from "react";
import IFrameSVG from "./IFrameSVG";

function IFrameSVGWrapper({ valueSelectId }) {
    const [shouldRender, setShouldRender] = useState(null);

    const url = `https://storage.googleapis.com/weatherstationiotdaiviet.appspot.com/PID/${valueSelectId}.html`;

    useEffect(() => {
        let ignore = false;

        fetch(url)
            .then((res) => {
                if (!res.ok) {
                    if (!ignore) setShouldRender(false);
                    return;
                }
                return res.text();
            })
            .then((text) => {
                if (ignore || typeof text !== "string") return;

                if (text.includes("NoSuchKey") || text.includes("No such object")) {
                    setShouldRender(false);
                } else {
                    setShouldRender(true);
                }
            })
            .catch(() => {
                if (!ignore) setShouldRender(false);
            });

        return () => {
            ignore = true;
        };
    }, [url]);

    if (shouldRender === null) return null;
    if (!shouldRender) return null;

    return <IFrameSVG url={url} />;
}

export default IFrameSVGWrapper;
