import classNames from "classnames"

export function Info({ label, children, className = '' }) {
    return <div className={classNames("flex flex-row border-b-[1px] border-b-gray-200 last:border-b-0", className)}>
        <span className="flex-1 text-gray-400 mr-2">{ label }</span>
        {children}
    </div>
}

export function Infos({ children, className = '' }) {
    return <div className={classNames("flex flex-col", className)}>{children}</div>
}