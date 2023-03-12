// @ts-check

import classNames from "classnames";
import React, { createElement, Fragment, ReactElement } from "react";
import { useState } from "react";

interface TabProps {
    children?: any,
    title?: string,
    isSelected?: boolean,
    className?: string
}

export function Tabs({ children }: { children: ReactElement<TabProps, typeof Tab>[] | ReactElement<TabProps, typeof Tab> }) {
    let [selectedTab, setSelectedTab] = useState('');

    if (selectedTab == '') {
        selectedTab = children[0]?.props?.title ?? '';
    }

    if (!Array.isArray(children))
        children = [children];

    return <div className="tabs flex flex-col">
        <div className="flex flex-row flex-nowrap mb-2 rounded-3xl bg-slate-100 w-fit">
            {children.map((child, index) => <div key={index} className={classNames("px-3 py-1 whitespace-nowrap cursor-pointer rounded-3xl", {
                'bg-slate-600 text-white': child?.props?.title == selectedTab
            })} onClick={() => setSelectedTab(child?.props?.title ?? '')}>{child?.props?.title}</div>)}
        </div>
        <div>
            {children.map((tab, index) => {
                return <Fragment key={index}>{createElement(tab.type, { ...tab.props, isSelected: tab.props.title == selectedTab })}</Fragment>
            })}
        </div>
    </div>
}

/**
 * Tab
 */
function Tab({ children, title, isSelected, className = '' }: TabProps) {
    return <div className={classNames({ 'hidden': !isSelected }, className)}>
        {children}
    </div>
}

Tabs.Tab = Tab;