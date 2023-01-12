"use strict";
exports.id = 257;
exports.ids = [257];
exports.modules = {

/***/ 1257:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "W": () => (/* binding */ Container)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1664);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1853);
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
// @ts-check





function Container({ children  }) {
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    const isFull = router.query.all == "1";
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex flex-col h-screen overflow-x-auto w-full text-xs xl:text-sm",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", {
                className: "px-2 py-3 flex xl:sticky top-0 z-50 bg-slate-100",
                children: [
                    isFull ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/logs" + (isFull ? "?all=1" : ""),
                        text: "Logs"
                    }) : null,
                    isFull ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/usages/traffic" + (isFull ? "?all=1" : ""),
                        text: "Traffic Usages"
                    }) : null,
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/transactions" + (isFull ? "?all=1" : ""),
                        text: "Transactions"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/users" + (isFull ? "?all=1" : ""),
                        text: "Users"
                    }),
                    isFull ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/configuration" + (isFull ? "?all=1" : ""),
                        text: "Configuration"
                    }) : null,
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/server_config" + (isFull ? "?all=1" : ""),
                        text: "Servers"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(MenuLink, {
                        href: "/logout",
                        children: "Logout"
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "bg-white block shadow-md mt-2 min-w-fit",
                children: children
            })
        ]
    });
}
/**
 * 
 * @param {{ children?: any, text?: string, href: string }} param0 
 * @returns 
 */ function MenuLink({ href , text =undefined , children =undefined  }) {
    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {
        href: href,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
            className: classnames__WEBPACK_IMPORTED_MODULE_3___default()("whitespace-nowrap px-3 py-1 cursor-pointer rounded-lg", {
                "hover:bg-white": router.asPath != href
            }, {
                "font-bold bg-slate-800 text-white": router.asPath == href
            }),
            children: text ?? children
        })
    });
}


/***/ })

};
;