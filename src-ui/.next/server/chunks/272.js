"use strict";
exports.id = 272;
exports.ids = [272];
exports.modules = {

/***/ 1272:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "I": () => (/* binding */ AppContext),
/* harmony export */   "h": () => (/* binding */ AppContextContainer)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_util__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9713);



/**
 * @typedef {{ url: string, token: string }} ServerContext
 * 
 * @typedef {{ server: ServerContext, setServer: Dispatch<SetStateAction<ServerContext>> }} AppContext
 */ /** @type {Context<AppContext>} */ const AppContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();
function AppContextContainer({ children  }) {
    let { 0: server , 1: setServer  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)((0,_lib_util__WEBPACK_IMPORTED_MODULE_2__/* .stored */ .VL)("server") ?? {
        url: "",
        token: ""
    });
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        (0,_lib_util__WEBPACK_IMPORTED_MODULE_2__/* .store */ .h)("server", server);
    }, [
        server
    ]);
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(AppContext.Provider, {
        value: {
            server,
            setServer
        },
        children: children
    });
}


/***/ }),

/***/ 9713:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Bh": () => (/* binding */ dateDiff),
/* harmony export */   "Em": () => (/* binding */ DateUtil),
/* harmony export */   "KJ": () => (/* binding */ arrSort),
/* harmony export */   "My": () => (/* binding */ getChanges),
/* harmony export */   "Pu": () => (/* binding */ serverRequest),
/* harmony export */   "VL": () => (/* binding */ stored),
/* harmony export */   "h": () => (/* binding */ store),
/* harmony export */   "p$": () => (/* binding */ deepCopy),
/* harmony export */   "r0": () => (/* binding */ withoutKey),
/* harmony export */   "uM": () => (/* binding */ queryString)
/* harmony export */ });
/* unused harmony exports equals, objectDiff */
/* harmony import */ var crypto_js_aes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2837);
/* harmony import */ var crypto_js_aes__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(crypto_js_aes__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6930);
/* harmony import */ var crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_1__);
// @ts-check


/**
 * @param {import("../components/app-context").ServerContext} server
 * @param {string} action Action
 * @param {any} body 
 * @returns 
 */ function serverRequest(server, action, body = undefined) {
    if (typeof action == "object") {
        body = action["body"];
        action = action["url"];
    }
    return fetch(server.url + action, {
        method: body ? "POST" : "GET",
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + btoa(server.token)
        }
    }).then((result)=>result.json()).then((result)=>{
        if (result.encoded) {
            console.log("Encode data");
            let data = JSON.parse((0,crypto_js_aes__WEBPACK_IMPORTED_MODULE_0__.decrypt)(result.encoded, "masoud").toString((crypto_js_enc_utf8__WEBPACK_IMPORTED_MODULE_1___default())));
            console.log(data);
            return data;
        }
        return result;
    }).then((result)=>{
        if (result.error) throw Error(result.error);
        else return result;
    });
}
function store(key, value) {
    localStorage[key] = value ? JSON.stringify(value) : undefined;
}
/**
 * @template T
 * @param {string} key Key
 * @param {T?} _default Default value
 * @returns {T extends null ? any : T}
 */ function stored(key, _default = null) {
    try {
        return localStorage[key] ? JSON.parse(localStorage[key]) : _default ?? null;
    } catch  {
        // @ts-ignore
        return _default ?? null;
    }
}
/**
 * 
 * @param {string | number | Date} date1 
 * @param {string | number | Date | undefined} date2 
 */ function dateDiff(date1, date2 = undefined) {
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
    let text = texts.join(" ") + (ago ? " پیش" : " مانده");
    return {
        totalYears,
        totalMonths,
        totalDays,
        totalHours,
        totalMinutes,
        totalSeconds,
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        text,
        ago
    };
}
/**
 * 
 * @param {string} sortColumn Sort column name
 * @param {boolean} sortAsc Sort asc
 * @returns 
 */ function arrSort(sortColumn, sortAsc) {
    return (a, b)=>!sortColumn ? 0 : a[sortColumn] == b[sortColumn] ? 0 : a[sortColumn] < b[sortColumn] ? sortAsc ? -1 : 1 : sortAsc ? 1 : -1;
}
const DateUtil = {
    /**
     * Add days to given date
     * @param {any} date Date
     * @param {number} days Days to add
     * @returns 
     */ addDays (date, days) {
        if (!date) return undefined;
        return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
    }
};
/**
 * 
 * @param {any} a 
 * @param {any} b 
 */ function equals(a, b) {
    if (a === b) return true;
    if (typeof a != typeof b) return false;
    return JSON.stringify(a) == JSON.stringify(b);
}
/**
 * Get two object difference
 * @param {any} base Base object
 * @param {any} modified Modified object
 */ function objectDiff(base, modified) {
    let diffs = {};
    let bKeys = Object.keys(base ?? {});
    let mKeys = Object.keys(modified ?? {});
    mKeys.forEach((key)=>{
        // New Node
        if (!bKeys.includes(key)) diffs[key] = modified[key];
        else if (!equals(modified[key], base[key])) diffs[key] = modified[key];
    });
    bKeys.forEach((key)=>{
        // Deleted Node
        if (!mKeys.includes(key)) diffs[key] = undefined;
    });
    return diffs;
}
/**
 * @typedef {{
 *      action: 'set' | 'delete' | 'add',
 *      value?: any,
 *      path?: string[],
 *      prevValue?: any
 * }} Change
 */ /**
 * Get changes actions
 * @param {any} base Base value
 * @param {any} modified Modified value
 * @returns
 */ function getChanges(base, modified, path = []) {
    /** @type {Change[]} */ let changes = [];
    let typeA = typeof base;
    let typeB = typeof modified;
    // Types are different
    if (typeA != typeB) {
        changes.push({
            action: "set",
            value: modified,
            path,
            prevValue: base
        });
        return changes;
    } else if (Array.isArray(base) && Array.isArray(modified)) {
        for(let i in modified){
            let nodePath = [
                ...path,
                i
            ];
            let nodeChanges = getChanges(base[i], modified[i], nodePath);
            nodeChanges.forEach((change)=>changes.push(change));
        }
        for(let i1 in base){
            let nodePath1 = [
                ...path,
                i1
            ];
            let value = base[i1];
            if (!modified.find((x)=>equals(x, value))) changes.push({
                action: "delete",
                path: [
                    ...path
                ],
                value
            });
        }
        return changes;
    } else if (typeA == "object") {
        let bKeys = Object.keys(base ?? {});
        let mKeys = Object.keys(modified ?? {});
        mKeys.forEach((key)=>{
            let nodePath = [
                ...path,
                key
            ];
            let nodeChanges = getChanges(base[key], modified[key], nodePath);
            nodeChanges?.forEach((change)=>changes.push(change));
        });
        bKeys.forEach((key)=>{
            // Deleted Node
            if (!mKeys.includes(key)) {
                changes.push({
                    action: "delete",
                    path: [
                        ...path,
                        key
                    ]
                });
            }
        });
        return changes;
    }
    // Modified
    if (!equals(base, modified)) {
        changes.push({
            action: "set",
            value: modified,
            path,
            prevValue: base
        });
        return changes;
    }
    return changes;
}
/**
 * 
 * @param {any} value Value
 * @param {Change[]} changes Changes
 */ function applyChanges(value, changes) {
    let result = deepCopy(value);
    changes?.forEach((change)=>{
        let path = change.path?.map((x)=>typeof x == "string" ? `"${x}"` : x).join("][");
        let parentPath = change.path?.slice(0, change.path.length - 1).map((x)=>typeof x == "string" ? `"${x}"` : x).join("][");
        switch(change.action){
            case "set":
                {
                    if (change.path?.length == 0) result = change.value;
                    else {
                        let parentNode = [];
                        eval(`parentNode = result[${parentPath}]`);
                        if (Array.isArray(parentNode)) {
                            if (change.prevValue) {
                                let index = parentNode.findIndex((x)=>equals(x, change.prevValue));
                                if (index >= 0) parentNode[index] = change.value;
                            // else
                            //     parentNode.push(change.value);
                            } else {
                                parentNode.push(change.value);
                            }
                        } else {
                            eval(`result[${path}] = change.value;`);
                        }
                    }
                    break;
                }
            case "delete":
                {
                    if (change.value) {
                        let arr = [];
                        eval(`arr = result[${path}];`);
                        eval(`result[${path}] = arr.filter(x => !equals(x, change.value));`);
                    } else {
                        eval(`delete result[${path}];`);
                    }
                    break;
                }
            case "add":
                {
                    eval(`result[${path}].push(change.value);`);
                }
        }
    });
    return result;
}
/**
 * Deep copy of a value
 * @template T
 * @param {T} value Value
 * @returns {T}
 */ function deepCopy(value) {
    if (typeof value != "object") return value;
    return JSON.parse(JSON.stringify(value));
}
/**
 * Copy object without keys
 * @template T
 * @param {T} obj Object
 * @param  {...(keyof T)} keys Keys to remove
 */ function withoutKey(obj, ...keys) {
    let clone = {
        ...obj
    };
    keys.forEach((k)=>delete clone[k]);
    return clone;
}
/**
 * Create query string from object
 * @param {{ [key: string]: any }} values Values
 */ function queryString(values) {
    let qs = Object.keys(values).map((key)=>{
        let value = values[key];
        if (value == undefined) value = "";
        if (Array.isArray(value)) {
            return value.map((v)=>`${key}[]=${v}`).join("&");
        }
        return `${key}=${value}`;
    }).join("&");
    if (qs) return "?" + qs;
    return "";
}


/***/ })

};
;