import {useState, useEffect} from "react";

export function useIsMobile(breakpoint:number = 768):boolean
{
    const [isMobile, setIsMobile] = useState<boolean>(false);
    useEffect(()=>{
        if (typeof window === 'undefined') return;
        const checkMobile = ()=>setIsMobile(window.innerWidth<breakpoint);
        checkMobile();
        window.addEventListener("resize", checkMobile)
        return ()=>window.removeEventListener("resize", checkMobile);
        }, [breakpoint])
    return isMobile;
}