import React from "react";

// @ts-check
export function Price({value}) {
    let format = new Intl.NumberFormat().format(value);
    return <>{format} تومان</>
}