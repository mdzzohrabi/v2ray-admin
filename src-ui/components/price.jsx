export function Price({value}) {
    let format = new Intl.NumberFormat().format(value);
    return <>{format} تومان</>
}