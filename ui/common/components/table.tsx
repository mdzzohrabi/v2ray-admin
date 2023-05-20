import classNames from "classnames";
import React, { Fragment, ReactElement, useMemo, useState } from "react";
import { styles } from "../lib/styles";

export interface TableProps<T, G, C extends string> {
    columns?: C[],
    rows: T[],
    cells?: (row: T, index: number, items: T[]) => any[],
    loading?: boolean,
    rowContainer?: (row: T, children: any, group?: G) => any
    index?: (row: T, index: number) => any
    groupBy?: (row: T, index: number) => G
    group?: (group: G, isCollapsed: boolean, setCollapsed?: ((collapsed?: boolean) => any)) => any
    groupFooter?: (group: G, items: T[]) => any
    footer?: (items: T[]) => any
    className?: string
    cellMerge?: C[]
    sortColumns?: C[]
}

function isReactNode(value: any): value is ReactElement {
    return typeof value == 'object' && !!value && 'key' in value;
}

export function Table<T, G, C extends string>({ columns, rows, cells, loading, rowContainer, index: indexGetter, groupBy, group, groupFooter, footer, className, cellMerge }: TableProps<T, G, C>) {

    let groupItems: any[] = [];
    let mergedCells: { [cellIndex: number]: number } = {};

    const [collapsedGroups, setCollapsedGroups] = useState<G[]>([]);

    // Render all rows cells
    let renderedRows = useMemo(() => rows?.map((row, index) => cells?.call(this, row, index, rows)), [rows, cells]);

    // All rows groups
    let groups = useMemo(() => {
        return groupBy ? rows?.map((row, index) => groupBy(row, index)) : [];
    }, [rows, groupBy]);

    return <table className={classNames("w-full text-xs border-separate border-spacing-0", className)}>
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
                let rowGroup = groups[index];
                let prevGroup = groups[index - 1];
                let isGroupChanged = rowGroup != prevGroup;
                let isCollapsed = collapsedGroups.includes(rowGroup);
                if (rowGroup) {
                    // New Group
                    if (isGroupChanged) {
                        // End of group
                        if (prevGroup != null && !!groupFooter) {
                            elGroupFooter = groupFooter(prevGroup, groupItems);
                        }

                        let setCollapsed = (value?: boolean) => {
                            if (value)
                                setCollapsedGroups([ ...collapsedGroups, rowGroup ]);
                            else
                                setCollapsedGroups(collapsedGroups.filter(x => x != rowGroup));
                        };
                        elGroup = group ? group(rowGroup, isCollapsed, setCollapsed) : null;
                        groupItems = [];
                    }
                    groupItems.push(row);
                }
            

                let renderedCells: any[] = renderedRows[index];

                // Merged Cells
                if (cellMerge) {
                    mergedCells = {};
                    let cursor = 1;
                    while (true) {
                        let nextRowIndex = index + cursor;
                        if (groups[index] != groups[nextRowIndex]) break;
                        let nextCells = renderedRows[nextRowIndex];
                        if (nextCells) {
                            let hasAnyMerge = false;
                            renderedCells.forEach((cell, index) => {
                                if (!cellMerge.includes(columns[index])) return;
                                let nextRowCell = nextCells[index];
                                if (cell && nextRowCell && cell == nextRowCell || (isReactNode(cell) && isReactNode(nextRowCell) && cell.key?.toString()?.startsWith('merge-') && cell.key == nextRowCell.key)) {
                                    let rowSpan = (mergedCells[index] ?? 1) + 1;
                                    if (rowSpan == cursor + 1) {
                                        mergedCells[index] = (mergedCells[index] ?? 1) + 1;
                                        nextCells[index] = undefined;
                                        hasAnyMerge = true;
                                    }
                                }
                            });
                            cursor++;
                            if (!hasAnyMerge)
                                break;
                        } else {
                            break;
                        }
                    }
                }

                let elRow = isCollapsed ? null : <tr className={classNames("bg-white", { "odd:bg-slate-50": !cellMerge })} key={index}>
                    <td className={classNames(styles.td, {
                        'border-r-[1px]': cellMerge
                    })}>{indexGetter ? indexGetter(row, index) : index}</td>
                    {renderedCells?.map((cell, index) => {
                        if (cell === undefined) return null;
                        let rowSpan = mergedCells[index] ?? 1;
                        return <td rowSpan={rowSpan} key={index} className={classNames(styles.td, {
                            'border-r-[1px]': cellMerge
                        })}>{cell}</td>;
                    })}
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