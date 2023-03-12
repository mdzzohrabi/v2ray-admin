interface ProgressProps {
    title?: string
    bars?: {
        title?: string
        value?: number
    }[]
    total?: number
    noBarsMessage?: string
}

export function Progress({ title, bars, noBarsMessage = 'No Data', total }: ProgressProps) {
    return <div>
        {title ? <span className="pb-2 text-gray-500 block">{title}</span> : null}
        <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl overflow-hidden">
            {!bars || bars.length == 0 ? <div className="flex-1 flex items-center justify-center">{noBarsMessage}</div> : <>
                {bars.map(x => {
                    return <span className={"bg-emerald-700 overflow-hidden items-center justify-center flex text-white text-[.6rem]"} style={{ width: `${x.value * 100 / total}%` }} title={x.title}>
                        {x.title}
                    </span>
                })}
            </>}
        </div>
    </div>
}