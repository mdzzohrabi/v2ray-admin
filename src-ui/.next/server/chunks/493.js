"use strict";
exports.id = 493;
exports.ids = [493];
exports.modules = {

/***/ 1016:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "C": () => (/* binding */ Editable)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);



/**
 * @typedef {{
 *      value?: any
 *      children?: any
 *      onEdit?: Function
 *      className?: any
 *      editable?: boolean
 *      input?: import("react").HTMLProps<HTMLInputElement>
 *      postfix?: any
 * }} EditableProps
 */ /**
 * Editable
 * @param {EditableProps} param0 
 * @returns 
 */ function Editable({ value , children , onEdit , className ="" , editable =true , input , postfix  }) {
    let { 0: isEdit , 1: setEdit  } = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
    let { 0: valueState , 1: setValueState  } = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(value);
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        setValueState(value);
    }, [
        value
    ]);
    const onSubmit = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)((e)=>{
        e?.preventDefault();
        onEdit?.call(this, valueState);
        setEdit(false);
    }, [
        valueState
    ]);
    // if (!isEdit) return <>
    //     {children}
    //     <span className="text-blue-500 text-sm ml-2 cursor-pointer px-1 rounded-lg hover:bg-slate-600 hover:text-white" onClick={() => setEdit(!isEdit)}>Edit</span>
    // </>;
    if (!editable) return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("ml-2 px-1", className),
        children: children
    });
    if (!isEdit) return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("text-blue-500 ml-2 cursor-pointer px-1 rounded-lg hover:ring-slate-400 hover:ring-1 block", className),
        onClick: ()=>setEdit(!isEdit),
        children: children
    });
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("form", {
        onSubmit: onSubmit,
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("input", {
                type: "text",
                value: valueState,
                onChange: (e)=>setValueState(e.currentTarget.value),
                className: "ring-1 ring-slate-600 rounded-lg px-1",
                ...input
            }),
            postfix,
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                className: "text-sm ml-1 bg-slate-200 rounded-lg px-2 hover:bg-slate-800 hover:text-white",
                type: "submit",
                children: "OK"
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                onClick: ()=>setEdit(false),
                className: "text-sm ml-1 bg-slate-200 rounded-lg px-2 hover:bg-slate-800 hover:text-white",
                type: "button",
                children: "Cancel"
            })
        ]
    });
}


/***/ }),

/***/ 1757:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (/* binding */ PopupMenu)
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







/**
 * 
 * @param {{ children: any, action?: (setVisible: React.Dispatch<React.SetStateAction<boolean>>) => any }} param0 
 */ function PopupMenuItem({ children , action  }) {
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {});
}
/**
 * 
 * @param {{
 *      visible?: boolean,
 *      text?: string,
 *      children?: (React.ComponentElement<typeof PopupMenuItem> | null)[] | React.ComponentElement<typeof PopupMenuItem> | null
 * }} params0 Parameters
 */ function PopupMenu({ visible =false , text ="Actions" , children =[]  }) {
    let { 0: isVisible , 1: setVisible  } = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(visible);
    let refPopup = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)();
    (0,_lib_hooks__WEBPACK_IMPORTED_MODULE_3__/* .useOutsideAlerter */ .pN)(refPopup, ()=>{
        setVisible(false);
    });
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        if (typeof visible == "boolean") setVisible(visible);
    }, [
        visible,
        setVisible
    ]);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "relative inline-block",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                onClick: ()=>setVisible(!isVisible),
                className: classnames__WEBPACK_IMPORTED_MODULE_1___default()(_lib_styles__WEBPACK_IMPORTED_MODULE_4__/* .styles.link */ .W.link, {
                    "bg-slate-200": isVisible
                }),
                children: text
            }),
            isVisible ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                ref: refPopup,
                className: "min-w-[10rem] absolute z-50 right-0 top-full bg-white shadow-lg ring-1 ring-black ring-opacity-10 px-2 py-2 rounded-lg",
                children: (Array.isArray(children) ? children : [
                    children
                ]).map((action, index)=>{
                    if (!action) return null;
                    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "py-1 px-2 border-b-[1px] border-b-gray-200 last:border-b-0 hover:bg-cyan-100 cursor-pointer",
                        onClick: ()=>{
                            action.props.action?.call(this, setVisible);
                        },
                        children: action.props.children
                    }, index);
                })
            }) : null
        ]
    });
}
PopupMenu.Item = PopupMenuItem;

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
;