import { Fragment, useMemo, useState } from "react";

export function Interval({ children, interval }: { children: any, interval: number }) {
    let [counter, setCounter] = useState(0);
    
    let timerId = useMemo(() => {
        clearInterval(timerId);
        return setInterval(() => setCounter(counter++), interval);
    }, [interval]);

    return <Fragment key={counter}>
        {typeof children == 'function' ? children() : children}
    </Fragment>;
}