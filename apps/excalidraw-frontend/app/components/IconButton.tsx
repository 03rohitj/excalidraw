import { ReactNode } from "react";

export function IconButton( {
    icon, onClick, activated 
} : {
    icon: ReactNode, onClick: () => void, 
    activated: boolean
}){
    const textStyle = activated ? "text-red-500" : "text-white";
    return <div className={`cursor-pointer rounded-full ${textStyle} border p-2 bg-black hover:bg-gray-500`} onClick={ onClick }>
        {icon}
    </div>
}