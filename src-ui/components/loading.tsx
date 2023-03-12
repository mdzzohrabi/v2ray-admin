import React from "react";

// @ts-check
export function Loading({ isLoading = true, children = 'Loading ...' }) {
    return isLoading ? <div className="fixed z-50 bg-slate-900 text-white rounded-lg px-3 py-1 bottom-3 left-3">
        {children}
    </div> : null;
}