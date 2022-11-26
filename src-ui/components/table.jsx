// @ts-check

import classNames from "classnames";
import React from "react";
import { styles } from "../lib/styles";

/**
 * @template T
 * @typedef {{
 *      columns?: string[],
 *      rows: T[],
 *      cells?: (row: T) => any[],
 *      loading?: boolean,
 *      rowContainer?: (row: T, children: any) => any
 * }} TableProps
 */


/**
 * Table
 * @template T
 * @param {TableProps<T>} param0 
 */
export function Table({ columns, rows, cells, loading, rowContainer }) {
    return <table className="w-full text-xs">
        <thead className="sticky top-0 xl:top-12 bg-white shadow-md z-40">
            <tr className="bg-white">
                <th className={classNames(styles.tableHead)}>#</th>
                {columns?.map(column => <th key={column} className={classNames(styles.tableHead)}>{column}</th>)}
            </tr>
        </thead>
        <tbody>
            {loading ?
            <tr>
                <td colSpan={(columns?.length ?? 0) + 1} className="py-3 text-gray-600 text-center">Loading ...</td>
            </tr> : null }
            {!rows || rows?.length == 0 ?
            <tr>
                <td colSpan={(columns?.length ?? 0) + 1} className="py-3 text-gray-600 text-center">No records</td>
            </tr> : null }
            {rows?.map((row, index) => {
                let elRow = <tr className="bg-white odd:bg-slate-50" key={index}>
                    <td className={classNames(styles.td)}>{index}</td>
                    {cells?.call(this, row)?.map((cell, index) => <td key={index} className={classNames(styles.td)}>{cell}</td>)}
                </tr>;
                if (rowContainer) return rowContainer(row, elRow);
                return elRow;
            })}
        </tbody>
    </table>;
}