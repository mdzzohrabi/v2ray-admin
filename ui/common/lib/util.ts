
export function store(key: string, value: any) {
    localStorage[key] = value ? JSON.stringify(value) : undefined;
}

export function stored<T>(key: string, _default: T | null = null): T extends null ? any : T {
    try {
        return localStorage[key] ? JSON.parse(localStorage[key]) : _default ?? null;
    } catch {
        // @ts-ignore
        return _default ?? null;
    }
}

export function dateDiff(date1: string | number | Date, date2: string | number | Date | undefined = undefined) {
    let d1 = new Date(date1);
    let d2 = new Date(date2 ?? Date.now());
    let diff = d2.getTime() - d1.getTime();
    let ago = diff >= 0;
    diff = Math.abs(diff);
    let totalSeconds = diff / 1000;
    let totalMinutes = totalSeconds / 60;
    let totalHours = totalMinutes / 60;
    let totalDays = totalHours / 24;
    let totalMonths = totalDays / 30;
    let totalYears = totalDays / 365;

    let aMinute = 60 * 1000;
    let aHour = 60 * aMinute;
    let aDay = 24 * aHour;
    let aMonth = 30 * aDay;
    let aYear = 365 * aDay;

    let years = Math.floor(diff / aYear);
    let months = Math.floor(diff % aYear / aMonth);
    let days = Math.floor(diff % aMonth / aDay);
    let hours = Math.floor(diff % aDay / aHour);
    let minutes = Math.floor(diff % aHour / aMinute);
    let seconds = Math.floor(diff % aMinute / 1000);

    let texts: string[] = [];
    if (years > 0) texts.push(`${years} سال`);
    if (months > 0) texts.push(`${months} ماه`);
    if (days > 0) texts.push(`${days} روز`);
    if (hours > 0) texts.push(`${hours} ساعت`);
    if (minutes > 0) texts.push(`${minutes} دقیقه`);
    if (months == 0 && years == 0 && days == 0 && hours == 0 && seconds > 0) texts.push(`${seconds} ثانیه`);

    let text = texts.join(' ') + (ago ? ' پیش' : ' مانده');

    return {totalYears, totalMonths, totalDays, totalHours, totalMinutes, totalSeconds, years, months, days, hours, minutes, seconds, text, ago};
}

/**
 * 
 * @param sortColumn Sort column name
 * @param sortAsc Sort asc
 * @param transform Tranform value
 * @returns 
 */
export function arrSort(sortColumn: string, sortAsc: boolean, transform: ((value: any) => any) | undefined = undefined) {
    return (a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];
        if (transform) {
            aValue = transform(aValue);
            bValue = transform(bValue);
        }
        return !sortColumn ? 0 : 
            aValue == bValue ? 0 : 
                aValue < bValue ? 
                    (sortAsc ? -1 : 1) : 
                    (sortAsc ? 1 : -1);
    }
}

export const DateUtil = {

    /**
     * Add days to given date
     * @param {any} date Date
     * @param {number} days Days to add
     * @returns 
     */
    addDays(date, days) {
        if (!date) return undefined;
        return new Date(new Date(date).getTime() + (days * 24 * 60 * 60 * 1000));
    }

}

export function equals(a: any, b: any) {
    if (a===b) return true;
    if (typeof a != typeof b) return false;
    return JSON.stringify(a) == JSON.stringify(b);
}

/**
 * Get two object difference
 * @param base Base object
 * @param modified Modified object
 */
export function objectDiff(base: any, modified: any) {
    let diffs = {};
    let bKeys = Object.keys(base ?? {});
    let mKeys = Object.keys(modified ?? {});
    mKeys.forEach(key => {
        // New Node
        if (!bKeys.includes(key)) diffs[key] = modified[key];
        // Modified Node
        else if (!equals(modified[key], base[key])) diffs[key] = modified[key];
    });
    bKeys.forEach(key => {
        // Deleted Node
        if (!mKeys.includes(key)) diffs[key] = undefined;
    });
    return diffs
}

interface Change {
    action: 'set' | 'delete' | 'add',
    value?: any,
    path?: string[],
    prevValue?: any
}


/**
 * Get changes actions
 * @param {any} base Base value
 * @param {any} modified Modified value
 * @returns
 */
export function getChanges(base: any, modified: any, path: string[] = []) {
    let changes: Change[] = [];
    let typeA = typeof base;
    let typeB = typeof modified;

    // Types are different
    if (typeA != typeB) {
        changes.push({ action: 'set', value: modified, path, prevValue: base });
        return changes;
    }
    // Array
    else if (Array.isArray(base) && Array.isArray(modified)) {
        for (let i in modified) {
            let nodePath = [...path, i];
            let nodeChanges = getChanges(base[i], modified[i], nodePath);
            nodeChanges.forEach(change => changes.push(change));
        }
        for (let i in base) {
            let nodePath = [...path, i];
            let value = base[i];
            if (!modified.find(x => equals(x, value)))
                changes.push({ action: 'delete', path: [...path], value });
        }
        return changes;
    }
    // Object
    else if (typeA == 'object') {
        let bKeys = Object.keys(base ?? {});
        let mKeys = Object.keys(modified ?? {});
        mKeys.forEach(key => {
            let nodePath = [...path, key];
            let nodeChanges = getChanges(base[key], modified[key], nodePath);
            nodeChanges?.forEach(change => changes.push(change));
        });
        bKeys.forEach(key => {
            // Deleted Node
            if (!mKeys.includes(key)) {
                changes.push({ action: 'delete', path: [...path, key] });
            }
        });
        return changes;
    }

    // Modified
    if (!equals(base, modified)) {
        changes.push({ action: 'set', value: modified, path, prevValue: base });
        return changes;
    }

    return changes;
}

 function applyChanges(value: any, changes: Change[]) {
    let result = deepCopy(value);
    changes?.forEach(change => {
        let path = change.path?.map(x => typeof x == 'string' ? `"${x}"` : x).join('][');
        let parentPath = change.path?.slice(0, change.path.length - 1).map(x => typeof x == 'string' ? `"${x}"` : x).join('][');
        switch (change.action) {
            case 'set': {
                if (change.path?.length == 0)
                    result = change.value;
                else {
                    let parentNode: any[] = [];
                    eval(`parentNode = result[${parentPath}]`);
                    if (Array.isArray(parentNode)) {
                        if (change.prevValue) {
                            let index = parentNode.findIndex(x => equals(x, change.prevValue));
                            if (index >= 0)
                                parentNode[index] = change.value;
                            // else
                            //     parentNode.push(change.value);
                        }
                        else {
                            parentNode.push(change.value);
                        }
                    }
                    else {
                        eval(`result[${path}] = change.value;`);
                    }
                }
                break;
            }
            case 'delete': {
                if (change.value) {
                    let arr = [];
                    eval(`arr = result[${path}];`);
                    eval(`result[${path}] = arr.filter(x => !equals(x, change.value));`);
                }
                else {
                    eval(`delete result[${path}];`);
                }
                break;
            }
            case 'add': {
                eval(`result[${path}].push(change.value);`);
            }
        }
    });
    return result;
}

/**
 * Deep copy of a value
 */
export function deepCopy<T>(value: T): T {
    if (typeof value != 'object') return value;
    return JSON.parse(JSON.stringify(value));
}

/**
 * Copy object without keys
 */
export function withoutKey<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
    let clone = { ...obj };
    keys.forEach(k => delete clone[k]);
    return clone as any;
}

/**
 * Create query string from object
 * @param values Values
 */
export function queryString(values: { [key: string]: any }) {
    let qs = Object.keys(values).map(key => {
        let value = values[key];
        if (value == undefined) return '';
        if (Array.isArray(value)) {
            return value.map(v => `${key}[]=${v}`).join('&');
        }
        return `${key}=${value}`;
    }).filter(x => !!x).join('&');

    if (qs) return '?' + qs;
    return '';
}

export function moveItemInArray<T>(arr: T[], item: T, move: number) {
    let index = arr.indexOf(item);
    let newIndex = index + move;
    arr.splice(index, 1);
    arr.splice(newIndex, 0, item);
    return arr;
}
