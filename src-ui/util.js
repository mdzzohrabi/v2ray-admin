// @ts-check

/**
 * @param {import("./components/app-context").ServerContext} server
 * @param {string} action Action
 * @param {any} body 
 * @returns 
 */
export function serverRequest(server, action, body = undefined) {
    return fetch(server.url + action, {
        method: body ? 'POST' : 'GET',
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + btoa(server.token)
        }
    }).then(result => result.json()).then(result => { if (result.error) throw Error(result.error); else return result });
}

export function store(key, value) {
    localStorage[key] = value ? JSON.stringify(value) : undefined;
}

export function stored(key) {
    try {
        return localStorage[key] ? JSON.parse(localStorage[key]) : undefined;
    } catch {
        return undefined;
    }
}

/**
 * 
 * @param {string | number | Date} date1 
 * @param {string | number | Date | undefined} date2 
 */
export function dateDiff(date1, date2 = undefined) {
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

    let texts = [];
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
 * @param {string} sortColumn Sort column name
 * @param {boolean} sortAsc Sort asc
 * @returns 
 */
export function arrSort(sortColumn, sortAsc) {
    return (a, b) => !sortColumn ? 0 : 
            a[sortColumn] == b[sortColumn] ? 0 : 
                a[sortColumn] < b[sortColumn] ? 
                    (sortAsc ? -1 : 1) : 
                    (sortAsc ? 1 : -1);
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

/**
 * 
 * @param {any} a 
 * @param {any} b 
 */
export function equals(a, b) {
    if (a===b) return true;
    if (typeof a != typeof b) return false;
    if (Array.isArray(a)) {
        return a.every((v, i) => v == b[i]);
    }
    if (typeof a == 'object') {
        let aKeys = Object.keys(a);
        let bKeys = Object.keys(b);
        if (aKeys.length != bKeys.length) return false;
        if (aKeys.filter(a => bKeys.includes(a) == false).length > 0) return false;
        if (bKeys.filter(b => aKeys.includes(b) == false).length > 0) return false;
        return aKeys.every(k => equals(a[k], b[k]));
    }
    return a == b;
}

/**
 * Get two object difference
 * @param {any} base Base object
 * @param {any} modified Modified object
 */
export function objectDiff(base, modified) {
    let diffs = {};
    let bKeys = Object.keys(base);
    let mKeys = Object.keys(modified);
    mKeys.forEach(key => {
        if (!bKeys.includes(key)) diffs[key] = modified[key];
        else if (!equals(modified[key], base[key])) diffs[key] = modified[key];
    });
}

export function applyChanges(value, changes) {
    let result = value;
}