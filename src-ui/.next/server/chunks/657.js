"use strict";
exports.id = 657;
exports.ids = [657];
exports.modules = {

/***/ 3657:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "M": () => (/* binding */ DateView)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var jalali_moment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9308);
/* harmony import */ var jalali_moment__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(jalali_moment__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1853);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _lib_util__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9713);
/* harmony import */ var _popup__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(1211);
// @ts-check







/**
 * @typedef {{
 *      date: any,
 *      className?: string,
 *      containerClassName?: string
 * 		full?: boolean
 * 		precision?: boolean
 * 		locale?: string
 * 		options?: Intl.DateTimeFormatOptions
 * }} DateViewProps
 */ /**
 * Date view
 * @param {DateViewProps} param0
 */ function DateView({ date , className ="" , containerClassName ="" , full =false , precision =false , locale ="" , options =undefined  }) {
    let router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)();
    let isEN = (locale ?? router.query.date) == "en";
    if (!date) return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: "-"
    });
    date = date instanceof Date ? date : new Date(date);
    // return <>
    //     {isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}
    //     <span className='block text-gray-500 text-rtl'>{moment(date).locale('fa').fromNow()}</span>
    // </>;
    let intl = new Intl.DateTimeFormat(isEN ? "en-US" : "fa-IR-u-nu-latn", options ?? {
        timeStyle: "medium",
        dateStyle: "full"
    });
    let fromNow = precision ? (0,_lib_util__WEBPACK_IMPORTED_MODULE_5__/* .dateDiff */ .Bh)(date).text : jalali_moment__WEBPACK_IMPORTED_MODULE_2___default()(date).locale("fa").fromNow();
    let strDate = intl.format(date); // isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a');
    if (full) {
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_popup__WEBPACK_IMPORTED_MODULE_6__/* .Popup */ .G, {
            className: containerClassName,
            popup: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                dir: "rtl",
                children: fromNow
            }),
            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("block text-gray-900 text-rtl", className),
                children: strDate
            })
        });
    }
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_popup__WEBPACK_IMPORTED_MODULE_6__/* .Popup */ .G, {
        popup: strDate,
        className: containerClassName,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
            className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("block text-gray-500 text-rtl", className),
            children: fromNow
        })
    });
}


/***/ }),

/***/ 1211:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "G": () => (/* binding */ Popup)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);



function Popup({ children , popup , className =""  }) {
    let { 0: isShowPopup , 1: setShowPopup  } = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
    if (!popup) return children;
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()("inline relative cursor-help", className),
        onMouseOver: ()=>setShowPopup(true),
        onMouseOut: ()=>setShowPopup(false),
        children: [
            children,
            isShowPopup ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "shadow-lg z-10 absolute top-full rounded-lg bg-white px-2 py-2 ring-1 ring-slate-400",
                children: popup
            }) : null
        ]
    });
}


/***/ })

};
;