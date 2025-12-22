import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const usePathnameWatcher = (callback) => {
    const location = useLocation();
    const prevPath = useRef(location.pathname);

    useEffect(() => {
        if (location.pathname !== prevPath.current) {
            prevPath.current = location.pathname;
            callback(location.pathname);
        }
    }, [location.pathname]);
};
