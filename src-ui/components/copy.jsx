import { useState } from "react";
import { useCallback } from "react"
import toast from "react-hot-toast";

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
        if (!navigator?.clipboard) {
            toast.error("Clipboard only works in HTTPS mode");
            return;
        }
        navigator.clipboard.writeText(data);
        setCopied(true);
        toast.success("Config copied to clipboard")
        setTimeout(() => setCopied(false), 2000);
    }, [data]);
    return <span className="cursor-pointer text-blue-600" onClick={copyData}>{ loading ? 'Loading ...' : copied ? copiedText : children }</span>
}