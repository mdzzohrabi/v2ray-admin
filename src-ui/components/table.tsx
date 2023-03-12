// @ts-check

import classNames from "classnames";
import React, { Fragment } from "react";
import { styles } from "../lib/styles";

export interface TableProps<T, G> {
    columns?: string[],
    rows: T[],
    cells?: (row: T, index: number) => any[],
    loading?: boolean,
    rowContainer?: (row: T, children: any, group?: G) => any
    index?: (row: T, index: number) => any
    groupBy?: (row: T, index: number) => G
    group?: (group: G) => any
    groupFooter?: (group: G, items: T[]) => any
    footer?: (items: T[]) => any
    className?: string
}


export function Table<T, G>({ columns, rows, cells, loading, rowContainer, index: indexGetter, groupBy, group, groupFooter, footer, className }: TableProps<T, G>) {

    let prevGroup = null;
    let groupItems = [];

    return <table className={classNames("w-full text-xs", className)}>
        <thead className="sticky top-0 xl:top-0 bg-white shadow-md z-40">
            <tr className="bg-white">
                <th className={classNames(styles.tableHead)}>#</th>
                {columns?.map(column => <th key={column} className={classNames(styles.tableHead)}>{column}</th>)}
            </tr>
        </thead>
        <tbody>
            {loading && !(rows?.length ?? 0 > 0) ?
            <tr>
                <td colSpan={(columns?.length ?? 0) + 1} className="py-3 text-gray-600 text-center">Loading ...</td>
            </tr> : null }
            {!loading && (!rows || rows?.length == 0) ?
            <tr>
                <td colSpan={(columns?.length ?? 0) + 1} className="py-3 text-gray-600 text-center">No records</td>
            </tr> : null }
            {rows?.map((row, index) => {
                let elGroupFooter = null;
                let elGroup = null;
                let rowGroup;
                if (groupBy && group) {
                    rowGroup = groupBy(row, index);
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


                let elRow = <tr className="bg-white odd:bg-slate-50" key={index}>
                    <td className={classNames(styles.td)}>{indexGetter ? indexGetter(row, index) : index}</td>
                    {cells?.call(this, row, index)?.map((cell, index) => <td key={index} className={classNames(styles.td)}>{cell}</td>)}
                </tr>;

                return <Fragment key={index}>
                    {elGroupFooter}
                    {elGroup}
                    {rowContainer ? rowContainer(row, elRow, rowGroup) : elRow}
                    {/* End of table */}
                    {!!groupFooter && !!prevGroup && rows.length == index + 1 ? groupFooter(prevGroup, groupItems) : null}
                </Fragment>;
            })}
        </tbody>
        {footer ? <tfoot>
            {footer(rows)}
        </tfoot> : null }
    </table>;
}