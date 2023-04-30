import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { AppContext } from "./app-context";

export function CheckConfig({ children }) {
    let context = useContext(AppContext);
    let router = useRouter();
    
    useEffect(() => {
        if (!context.isStoreLoaded) return;
        
        if ((!context?.server?.url || !context?.server?.token) && router.asPath != "/server_config") {
            router.push('/server_config');
        }
    }, [context, router]);

    if (!context.isStoreLoaded)
        return null;

    return children;
}