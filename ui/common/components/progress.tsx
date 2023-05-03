import classNames from "classnames"
import { HTMLProps, useMemo } from "react"
import { Popup } from "./popup"

interface ProgressProps extends HTMLProps<HTMLDivElement> {
    title?: any
    bars?: {
        title?: string
        value?: number
        className?: string
    }[]
    total?: number
    noBarsMessage?: string
    renderValue?: (value: number) => any
    zeroValue?: boolean
}

export const ProgressColors = [
    "bg-yellow-500",
    "bg-blue-500",
    "bg-red-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-lime-500",
    "bg-teal-500",
    "bg-sky-500",
    "bg-emerald-700",
    "bg-black",
]

export function Progress({ title, bars, noBarsMessage = 'No Data', total, renderValue, zeroValue = false, ...props }: ProgressProps) {

    let colors = useMemo(() => ProgressColors, []);

    return <div {...props}>
        {title ? <span className="pb-2 text-gray-500 block">{title}</span> : null}
        <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl">
            {!bars || bars.length == 0 ? <div className="flex-1 flex items-center justify-center">{noBarsMessage}</div> : <>
                {bars.map((x, index) => {
                    if (!zeroValue && !x.value) return null;
                    let percent = x.value * 100 / total;
                    return <Popup key={index} popup={<>{x.title}  ({percent.toFixed(2)}%)</>} className={classNames("items-center justify-center flex text-white text-[.6rem] first:rounded-tl-xl first:rounded-bl-xl last:rounded-tr-xl last:rounded-br-xl whitespace-nowrap", x.className ?? colors[index])} style={{ width: `${percent}%` }}>
                        <span className="overflow-hidden trail">
                        {renderValue?.call(this, x.value) ?? x.value}
                        </span>
                    </Popup>
                })}
            </>}
        </div>
    </div>
}