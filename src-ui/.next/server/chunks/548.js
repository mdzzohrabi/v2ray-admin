"use strict";
exports.id = 548;
exports.ids = [548];
exports.modules = {

/***/ 7548:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Rh": () => (/* binding */ useDialog),
/* harmony export */   "Vq": () => (/* binding */ Dialog),
/* harmony export */   "wC": () => (/* binding */ DialogsContainer)
/* harmony export */ });
/* unused harmony export DialogContext */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
// @ts-check


const DialogContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)({
    dialogs: [],
    setDialogs: (dialogs)=>null
});
/**
 * Dialog
 * @template {Function} T
 * @param {T} builder Dialog builder
 * @returns 
 */ function useDialog(builder) {
    let { dialogs , setDialogs  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(DialogContext);
    let closeDialog = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((dialog)=>{
        setDialogs(dialogs.filter((x)=>x != dialog));
    }, [
        dialogs
    ]);
    return {
        /**
         * Show dialog
         * @param {Parameters<T>} props Builder properties
         */ show (...props) {
            let boundBuilder = builder.bind(dialogs, ...props);
            setDialogs([
                ...dialogs,
                boundBuilder
            ]);
        }
    };
}
function DialogsContainer({ children  }) {
    let { 0: dialogs , 1: setDialogs  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    let closeDialog = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((dialog)=>{
        setDialogs(dialogs.filter((x)=>x != dialog));
    }, [
        dialogs
    ]);
    // @ts-ignore
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(DialogContext.Provider, {
        value: {
            dialogs,
            setDialogs
        },
        children: [
            children,
            dialogs.length > 0 ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                id: "dialogs-container",
                className: "fixed flex items-center justify-center z-[100] top-0 left-0 w-full h-full",
                children: dialogs.map((dialog, index)=>{
                    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                onClick: ()=>closeDialog(dialog),
                                className: "absolute backdrop-blur-sm top-0 left-0 w-full h-full bg-black bg-opacity-10"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                className: "z-[101] max-h-full",
                                children: // @ts-ignore
                                dialog(()=>closeDialog(dialog))
                            }, index)
                        ]
                    }, index);
                })
            }) : null
        ]
    });
}
/**
 * Dialog
 * @param {{    
 *      children?: any,
 *      title?: string,
 *      onClose?: any,
 *      onSubmit?: (event: import("react").FormEvent) => any
 * }} param0 
 * @returns 
 */ function Dialog({ children , title =undefined , onClose =undefined , onSubmit =undefined  }) {
    let elDialog = /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "bg-white rounded-xl p-2 min-w-[30rem] flex flex-col max-h-[90vh] text-xs md:text-sm lg:text-base",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "flex flex-row px-1 pb-2",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                        className: "flex-1 font-bold",
                        children: title
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        children: onClose ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                            onClick: onClose,
                            className: "aspect-square bg-slate-200 rounded-full px-2 py-1 text-gray-600 cursor-pointer hover:bg-slate-900 hover:text-white",
                            children: "X"
                        }) : null
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "overflow-auto",
                children: children
            })
        ]
    });
    if (onSubmit) return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("form", {
        onSubmit: onSubmit,
        children: elDialog
    });
    return elDialog;
}


/***/ })

};
;