"use strict";
exports.id = 550;
exports.ids = [550];
exports.modules = {

/***/ 6550:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EV": () => (/* binding */ FieldObject),
/* harmony export */   "FE": () => (/* binding */ Collection),
/* harmony export */   "GG": () => (/* binding */ ObjectCollection),
/* harmony export */   "H_": () => (/* binding */ FieldsGroup),
/* harmony export */   "gN": () => (/* binding */ Field)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _lib_hooks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(2687);
/* harmony import */ var _lib_styles__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5384);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_hooks__WEBPACK_IMPORTED_MODULE_3__]);
_lib_hooks__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];
// @ts-check





/**
 * @template T
 * @type {import("react").Context<{
 * 		horizontal?: boolean,
 * 		data?: T,
 * 		dataSetter?: (value: T) => any,
 * 		unsetEmpty?: boolean
 * }>}
 */ let FieldContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_2__.createContext)({});
/**
 * Fields group
 * @param {React.HTMLAttributes<HTMLDivElement> & { children?: any, title?: string, titleClassName?: string, horizontal?: boolean, data?: any, dataSetter?: (value: any) => any, layoutVertical?: boolean, unsetEmpty?: boolean, containerClassName?: string }} param0 
 * @returns 
 */ function FieldsGroup({ title , children , className , titleClassName , horizontal =false , layoutVertical =false , data =undefined , dataSetter =undefined , unsetEmpty =true , containerClassName ="" , ...props }) {
    let provider = /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FieldContext.Provider, {
        value: {
            horizontal,
            data,
            dataSetter,
            unsetEmpty
        },
        children: children
    });
    if (!title && !className) {
        return provider;
    }
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("flex overflow-auto", className),
        ...props,
        children: [
            title ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("font-bold px-3 py-3 whitespace-nowrap", titleClassName),
                children: title
            }) : null,
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "self-center flex-1",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("flex flex-1", {
                        "flex-row": !layoutVertical,
                        "flex-col": layoutVertical
                    }, containerClassName),
                    children: provider
                })
            })
        ]
    });
}
function FieldObject({ children , path  }) {
    let context = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(FieldContext);
    let setData = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)((data)=>{
        console.log(`Set Data`, data, context.data, path);
        if (context.dataSetter) {
            let obj = {
                ...context.data
            };
            if (!data && context.unsetEmpty) {
                delete obj[path];
            } else {
                obj[path] = data;
            }
            console.log(obj);
            // @ts-ignore
            context.dataSetter(obj);
        }
    }, [
        context.data,
        context.dataSetter
    ]);
    let data = context.data && context.data[path] ? context.data[path] : {};
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FieldContext.Provider, {
        value: {
            ...context,
            dataSetter: setData,
            data
        },
        children: children
    });
}
/**
 * 
 * @param {{ label?: string, children?: any, className?: string, horizontal?: boolean, htmlFor?: string, data?: any, dataSetter?: Function, unsetEmpty?: boolean }} param0 
 * @returns 
 */ function Field({ label , children , className ="" , horizontal =undefined , htmlFor ="" , data =undefined , dataSetter =undefined , unsetEmpty =undefined  }) {
    let context = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(FieldContext);
    let childs = Array.isArray(children) ? children : [
        children
    ];
    horizontal = horizontal ?? context.horizontal ?? false;
    data = data ?? context.data;
    dataSetter = dataSetter ?? context.dataSetter;
    unsetEmpty = unsetEmpty ?? context.unsetEmpty ?? true;
    let setData = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(/** @param {React.ChangeEvent<HTMLInputElement>} e */ (e)=>{
        let target = e.currentTarget;
        let value = target.value;
        if (target.type == "checkbox") {
            // @ts-ignore
            value = target.checked;
        }
        if (target.type == "number") {
            // @ts-ignore
            value = value ? Number(value) : value;
        }
        if (typeof data == "object" && htmlFor) {
            if (!value && unsetEmpty) {
                data = {
                    ...data
                };
                delete data[htmlFor];
            } else {
                data = {
                    ...data,
                    [htmlFor]: value
                };
            }
        } else {
            data = value;
        }
        dataSetter?.call(this, data, htmlFor);
    }, [
        htmlFor,
        data,
        dataSetter
    ]);
    childs = childs.map((child, index)=>{
        if (dataSetter) {
            if (child?.type == "input" || child?.type == "select" || child?.type == "textarea") {
                let valueProp = "value";
                if (child.props.type == "checkbox") valueProp = "checked";
                return /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_2__.createElement)(child.type, {
                    key: index,
                    onChange: setData,
                    [valueProp]: (htmlFor && typeof data == "object" ? data[htmlFor] : data) ?? "",
                    ...child.props
                });
            }
        }
        return child;
    });
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("flex px-1", {
            "flex-col": !horizontal,
            "flex-row self-center": horizontal
        }, className),
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("label", {
                htmlFor: htmlFor,
                className: classnames__WEBPACK_IMPORTED_MODULE_1___default()(_lib_styles__WEBPACK_IMPORTED_MODULE_4__/* .styles.label */ .W.label, {
                    "pr-3": horizontal
                }, "whitespace-nowrap"),
                children: label
            }),
            childs
        ]
    });
}
/**
 * Field Collection
 * @template T
 * @param {{
 * 		data: T[],
 * 		dataSetter: (value: T[]) => any,
 * 		children: (props: {
 * 			items: T[],
 * 			addItem: (_: any, item: T) => any,
 * 			deleteItem: (deletedItem: T) => any,
 * 			updateItem: (item: T, edited: T) => any
 * 		}) => any
 * }} param0
 */ function Collection({ data , dataSetter , children  }) {
    let addItem = (0,_lib_hooks__WEBPACK_IMPORTED_MODULE_3__/* .useArrayInsert */ .un)(data, dataSetter);
    let deleteItem = (0,_lib_hooks__WEBPACK_IMPORTED_MODULE_3__/* .useArrayDelete */ .JU)(data, dataSetter);
    let updateItem = (0,_lib_hooks__WEBPACK_IMPORTED_MODULE_3__/* .useArrayUpdate */ .NP)(data, dataSetter);
    return children({
        items: data,
        addItem,
        deleteItem,
        updateItem
    });
}
/**
 * Field Collection
 * @template T
 * @param {{
 * 		path?: string
 * 		data?: T,
 * 		dataSetter?: (value: T) => any,
 * 		children: (props: {
 * 			value: T | null,
 * 			deleteKey: (key: any) => any,
 * 			setKey: (key: any, value: any) => any,
 * 			renameKey: (key: any, newKey: any) => any,
 * 		}) => any
 * }} param0
 */ function ObjectCollection({ data , dataSetter , children , path  }) {
    let context = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(FieldContext);
    if (path) {
        // @ts-ignore
        if (!data) data = context.data ?? {};
    }
    let memoDataSetter = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)((newData)=>{
        if (!dataSetter && path && context.dataSetter) {
            context.dataSetter(newData);
        } else if (dataSetter) {
            dataSetter(newData);
        }
    }, [
        dataSetter,
        context.dataSetter,
        data
    ]);
    let crud = (0,_lib_hooks__WEBPACK_IMPORTED_MODULE_3__/* .useObjectCRUD */ .fb)(data, memoDataSetter);
    return children(crud);
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 2687:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Ai": () => (/* binding */ useStoredState),
/* harmony export */   "G": () => (/* binding */ usePrompt),
/* harmony export */   "JU": () => (/* binding */ useArrayDelete),
/* harmony export */   "NP": () => (/* binding */ useArrayUpdate),
/* harmony export */   "fb": () => (/* binding */ useObjectCRUD),
/* harmony export */   "pN": () => (/* binding */ useOutsideAlerter),
/* harmony export */   "un": () => (/* binding */ useArrayInsert)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_hot_toast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6201);
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9713);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_hot_toast__WEBPACK_IMPORTED_MODULE_2__]);
react_hot_toast__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];
// @ts-check






function useOutsideAlerter(ref, callback) {
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        /**
	   * Alert if clicked on outside of element
	   */ function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return ()=>{
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [
        ref,
        callback
    ]);
}
function usePrompt() {
    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((message, okButton, onClick)=>{
        let clicked = false;
        react_hot_toast__WEBPACK_IMPORTED_MODULE_2__["default"].custom((t)=>{
            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "ring-1 ring-black ring-opacity-20 whitespace-nowrap text-sm shadow-lg bg-white flex rounded-lg pointer-events-auto px-3 py-2",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                        className: "flex-1 self-center mr-3",
                        children: message
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                        className: "rounded-lg duration-150 hover:shadow-md bg-slate-100 px-2 py-1 ml-1",
                        onClick: ()=>react_hot_toast__WEBPACK_IMPORTED_MODULE_2__["default"].remove(t.id),
                        children: "Cancel"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                        className: "rounded-lg duration-150 hover:shadow-md bg-blue-400 text-white px-2 py-1 ml-1 hover:bg-blue-600",
                        onClick: ()=>{
                            react_hot_toast__WEBPACK_IMPORTED_MODULE_2__["default"].remove(t.id);
                            if (!clicked) onClick();
                            clicked = true;
                        },
                        children: okButton
                    })
                ]
            });
        }, {
            position: "top-center"
        });
    }, []);
}
/**
 * @template T
 * @param {T[]} arr 
 * @param {(value: T[]) => any} setter 
 * @returns 
 */ function useArrayDelete(arr, setter) {
    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((/** @type {T} */ deletedItem)=>{
        setter(arr.filter((x)=>x != deletedItem));
    }, [
        arr,
        setter
    ]);
}
/**
 * @template T
 * @param {T[]} arr 
 * @param {(value: T[]) => any} setter 
 * @returns 
 */ function useArrayInsert(arr, setter) {
    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((_, /** @type {T} */ newItem)=>{
        setter([
            ...arr,
            newItem
        ]);
    }, [
        arr,
        setter
    ]);
}
/**
 * @template T
 * @param {T[]} arr 
 * @param {(value: T[]) => any} setter 
 * @returns 
 */ function useArrayUpdate(arr, setter) {
    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((/** @type {T} */ item, /** @type {T} */ edit)=>{
        let index = arr.indexOf(item);
        if (index >= 0) arr[index] = edit;
        setter([
            ...arr
        ]);
    }, [
        arr,
        setter
    ]);
}
/**
 * @template T
 * @param {T?} initValue Object value
 * @param {((value: T) => any)?} setter Setter function
 */ function useObjectCRUD(initValue = null, setter = null) {
    /** @ts-ignore */ if (!initValue) initValue = {};
    let { 0: value , 1: setValue  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(initValue);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        setValue(initValue);
    }, [
        initValue
    ]);
    let deleteKey = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((key)=>{
        let newValue = (0,_util__WEBPACK_IMPORTED_MODULE_3__/* .deepCopy */ .p$)(value);
        if (newValue) delete newValue[key];
        setter?.call(this, newValue);
        setValue(newValue);
    }, [
        value,
        setter
    ]);
    let setKey = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((key, keyValue)=>{
        let newValue = (0,_util__WEBPACK_IMPORTED_MODULE_3__/* .deepCopy */ .p$)(value);
        if (newValue) newValue[key] = keyValue;
        setter?.call(this, newValue);
        setValue(newValue);
    }, [
        value,
        setter
    ]);
    let renameKey = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((key, newKey)=>{
        let newValue = (0,_util__WEBPACK_IMPORTED_MODULE_3__/* .deepCopy */ .p$)(value);
        if (newValue) {
            newValue[newKey] = newValue[key];
            delete newValue[key];
        }
        setter?.call(this, newValue);
        setValue(newValue);
    }, [
        value,
        setter
    ]);
    return {
        value,
        deleteKey,
        setKey,
        renameKey
    };
}
/**
 * @template T
 * @param {string} key Storage key
 * @param {T} init Value
 * @returns {[ T, React.Dispatch<React.SetStateAction<T>> ]}
 */ function useStoredState(key, init) {
    let state = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)((0,_util__WEBPACK_IMPORTED_MODULE_3__/* .stored */ .VL)(key) ?? init);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>(0,_util__WEBPACK_IMPORTED_MODULE_3__/* .store */ .h)(key, state[0]), [
        state[0]
    ]);
    // @ts-ignore
    return state;
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 5384:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "W": () => (/* binding */ styles)
/* harmony export */ });
/* unused harmony export className */
const className = {
    tableHead: "px-3 py-2 border-b-2 text-left border-b-blue-900 rounded-tl-lg rounded-tr-lg",
    td: "whitespace-nowrap border-b-2 py-1 px-3",
    button: "border-2 border-slate-200 whitespace-nowrap rounded-3xl px-5 py-1 ml-2 duration-100 hover:border-blue-400 hover:text-blue-400 disabled:text-gray-400 disabled:border-slate-100",
    buttonPrimary: "border-2 border-green-600 text-green-600 whitespace-nowrap rounded-3xl px-5 py-1 ml-2 duration-100 hover:border-green-900 hover:text-green-900",
    addButtonSmall: "whitespace-nowrap text-xs rounded-3xl px-3 py-1 duration-150 hover:ring-2 ring-green-200 bg-slate-200 hover:bg-green-700 hover:text-white",
    addButton: "whitespace-nowrap rounded-3xl px-3 py-1 duration-150 hover:ring-2 ring-green-200 bg-slate-200 hover:bg-green-700 hover:text-white",
    input: "border-gray-500 border-solid border-b-0 bg-slate-100 rounded-md invalid:border-red-500 invalid:ring-red-600 px-2 py-1 focus:outline-blue-500",
    label: "py-1 self-start font-semibold",
    link: "cursor-pointer block text-blue-800 hover:underline rounded-lg"
};
const styles = className;


/***/ })

};
;