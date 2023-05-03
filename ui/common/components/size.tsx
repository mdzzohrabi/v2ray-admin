/**
 * Size
 * @param {{ size: number }} param0 
 * @returns 
 */
export function Size({ size }) {
    if (!size) return <>{size}</>;

    let postfix = ['B', 'KB', 'MB', 'GB', 'TB', 'EB'];
    let index = 0;
    while (size > 1024) {
        size = size / 1024;
        index++;
    }

    return <>{size.toFixed(2)} {postfix[index]}</>;
}