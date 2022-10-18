/**
 * Date view
 * @param {{ date: Date | string | undefined | null }} param0 
 * @returns 
 */
export function DateView({ date }) {
    if (!date) return <>-</>;
    date = date instanceof Date ? date : new Date(date);
    return <>{date.toLocaleString()}</>;
}