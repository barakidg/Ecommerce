import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollRestore = (isReady = true) => {
    const location = useLocation();
    const restored = useRef(false);

    useEffect(() => {
        if (!isReady || restored.current) return;
        
        const pathKey = `scroll_${location.pathname}${location.search}`;
        const savedScroll = sessionStorage.getItem(pathKey);
        
        if (savedScroll) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll, 10));
                sessionStorage.removeItem(pathKey);
            }, 50);
            restored.current = true;
        }
    }, [isReady, location.pathname, location.search]);

    const saveScroll = () => {
        const pathKey = `scroll_${location.pathname}${location.search}`;
        sessionStorage.setItem(pathKey, window.scrollY);
    };

    return saveScroll;
};
