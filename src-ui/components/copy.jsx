import { useState } from "react";
import { useCallback } from "react"

export function Copy({ data, children, copiedText = 'Copied !' }) {
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
        navigator.clipboard.writeText(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [data]);
    return <span className="cursor-pointer text-blue-600" onClick={copyData}>{ loading ? 'Loading ...' : copied ? copiedText : children }</span>
}