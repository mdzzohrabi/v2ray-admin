import classNames from "classnames";
import { useState } from "react";
import { useCallback } from "react"
import toast from "react-hot-toast";

export interface CopyProps {
    data?: any | (() => any)
    children?: any | ((copy: Function, isCopied: boolean, isLoading: boolean) => any)
    copiedText?: string
    notifyText?: string
    className?: string
}

export function Copy({ data, children, copiedText = 'Copied !', notifyText = 'Config copied to clipboard', className = '' }: CopyProps) {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const copyData = useCallback(async () => {
        if (typeof data == 'function') {
            data = data();
            if (data instanceof Promise) {
                setLoading(true);
                data = await data;
                setLoading(false);
            }
        }
        if (!navigator?.clipboard) {
            toast.error("Clipboard only works in HTTPS mode");
            return;
        }
        navigator.clipboard.writeText(data);
        setCopied(true);
        toast.success(notifyText);
        setTimeout(() => setCopied(false), 2000);
    }, [data]);

    if (typeof children == 'function') {
        return children(copyData, copied, loading);
    }

    return <span className={classNames("cursor-pointer text-blue-600", className)} onClick={copyData}>{ loading ? 'Loading ...' : copied ? copiedText : children }</span>
}