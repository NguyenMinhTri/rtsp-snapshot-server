import { memo } from "react";
import "./SubHeader.scss";

function SubHeader({ text}) {
    return (
        <div className="sub_header_wrapper">
            <p className="sub_text">{text}</p>
        </div>
    );
}

export default memo(SubHeader);
