import classNames from "classnames";
import { HTMLProps, useState } from "react"

interface PopupProps extends HTMLProps<HTMLDivElement> {
    popup?: any
}

export function Popup({ children, popup, className, ...props }: PopupProps) {
    let [isShowPopup, setShowPopup] = useState(false);

    if (!popup) return <>{children}</>;

    return <div
        className={classNames("inline relative cursor-help", className)}
        {...props}
        onMouseOver={() => setShowPopup(true)}
        onMouseOut={() => setShowPopup(false)}
      >
        {children}
        {isShowPopup ? <div className="shadow-lg z-10 absolute top-full translate-y-2 rounded-lg bg-white px-2 py-1 ring-1 ring-slate-400 text-black">
          {popup}
        </div> : null}
      </div>;
}