"use strict";
exports.id = 685;
exports.ids = [685];
exports.modules = {

/***/ 4685:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "i": () => (/* binding */ Table)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9003);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _lib_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5384);
// @ts-check




/**
 * @template T
 * @template G
 * @typedef {{
 *      columns?: string[],
 *      rows: T[],
 *      cells?: (row: T) => any[],
 *      loading?: boolean,
 *      rowContainer?: (row: T, children: any) => any
 *      index?: (row: T, index: number) => any
 *      groupBy?: (row: T, index: number) => G
 *      group?: (group: G) => any
 *      groupFooter?: (group: G, items: T[]) => any
 * }} TableProps
 */ /**
 * Table
 * @template T
 * @template G
 * @param {TableProps<T, G>} param0 
 */ function Table({ columns , rows , cells , loading , rowContainer , index: indexGetter , groupBy , group , groupFooter  }) {
    let prevGroup = null;
    let groupItems = [];
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("table", {
        className: "w-full text-xs",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("thead", {
                className: "sticky top-0 xl:top-12 bg-white shadow-md z-40",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tr", {
                    className: "bg-white",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("th", {
                            className: classnames__WEBPACK_IMPORTED_MODULE_1___default()(_lib_styles__WEBPACK_IMPORTED_MODULE_3__/* .styles.tableHead */ .W.tableHead),
                            children: "#"
                        }),
                        columns?.map((column)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("th", {
                                className: classnames__WEBPACK_IMPORTED_MODULE_1___default()(_lib_styles__WEBPACK_IMPORTED_MODULE_3__/* .styles.tableHead */ .W.tableHead),
                                children: column
                            }, column))
                    ]
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tbody", {
                children: [
                    loading && !(rows?.length ?? 0 > 0) ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("tr", {
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                            colSpan: (columns?.length ?? 0) + 1,
                            className: "py-3 text-gray-600 text-center",
                            children: "Loading ..."
                        })
                    }) : null,
                    !loading && (!rows || rows?.length == 0) ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("tr", {
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                            colSpan: (columns?.length ?? 0) + 1,
                            className: "py-3 text-gray-600 text-center",
                            children: "No records"
                        })
                    }) : null,
                    rows?.map((row, index)=>{
                        let elGroupFooter = null;
                        let elGroup = null;
                        if (groupBy && group) {
                            let rowGroup = groupBy(row, index);
                            if (rowGroup) {
                                // New Group
                                if (rowGroup != prevGroup) {
                                    // End of group
                                    if (prevGroup != null && !!groupFooter) {
                                        elGroupFooter = groupFooter(prevGroup, groupItems);
                                    }
                                    elGroup = group(rowGroup);
                                    prevGroup = rowGroup;
                                    groupItems = [];
                                }
                                groupItems.push(row);
                            }
                        }
                        let elRow = /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("tr", {
                            className: "bg-white odd:bg-slate-50",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                                    className: classnames__WEBPACK_IMPORTED_MODULE_1___default()(_lib_styles__WEBPACK_IMPORTED_MODULE_3__/* .styles.td */ .W.td),
                                    children: indexGetter ? indexGetter(row, index) : index
                                }),
                                cells?.call(this, row)?.map((cell, index)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("td", {
                                        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()(_lib_styles__WEBPACK_IMPORTED_MODULE_3__/* .styles.td */ .W.td),
                                        children: cell
                                    }, index))
                            ]
                        }, index);
                        return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
                            children: [
                                elGroupFooter,
                                elGroup,
                                rowContainer ? rowContainer(row, elRow) : elRow,
                                !!groupFooter && !!prevGroup && rows.length == index + 1 ? groupFooter(prevGroup, groupItems) : null
                            ]
                        }, index);
                    })
                ]
            })
        ]
    });
}


/***/ })

};
;