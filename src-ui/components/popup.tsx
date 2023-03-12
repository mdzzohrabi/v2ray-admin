import classNames from "classnames";
import { useState } from "react"

export function Popup({ children, popup, className ='' }) {
    let [isShowPopup, setShowPopup] = useState(false);

    if (!popup) return children;

    return <div className={classNames("inline relative cursor-help",className)} onMouseOver={() => setShowPopup(true)} onMouseOut={() => setShowPopup(false)}>
        {children}
        {isShowPopup ?
        <div className="shadow-lg z-10 absolute top-full rounded-lg bg-white px-2 py-2 ring-1 ring-slate-400">
            {popup}
        </div> : null }
    </div>;
}