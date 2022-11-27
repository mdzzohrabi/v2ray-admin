// @ts-check

import classNames from "classnames";
import React, { createElement } from "react";
import { useState } from "react";

/**
 * @typedef {{
 *      children?: any,
 *      title?: string,
 *      isSelected?: boolean
 * }} TabProps
 */

/**
 * Tabs
 * @param {{
 *      children: import("react").ReactElement<TabProps, typeof Tab>[]
 * }} param0 Parameters
 */
export function Tabs({ children }) {
    let [selectedTab, setSelectedTab] = useState('');

    if (selectedTab == '') {
        selectedTab = children[0]?.props?.title ?? '';
    }

    return <div className="tabs flex flex-col">
        <div className="flex flex-row flex-nowrap mb-2 rounded-3xl bg-slate-100 w-fit">
            {children.map(child => <div className={classNames("px-3 py-1 whitespace-nowrap cursor-pointer rounded-3xl", {
                'bg-slate-600 text-white': child?.props?.title == selectedTab
            })} onClick={() => setSelectedTab(child?.props?.title ?? '')}>{child?.props?.title}</div>)}
        </div>
        <div>
            {children.map(tab => {
                return createElement(tab.type, { ...tab.props, isSelected: tab.props.title == selectedTab });
            })}
        </div>
    </div>
}

/**
 * Tab
 * @param {TabProps} param0 Parameters
 */
function Tab({ children, title, isSelected }) {
    return <div className={classNames({ 'hidden': !isSelected })}>
        {children}
    </div>
}

Tabs.Tab = Tab;