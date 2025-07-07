import { ReactNode } from "react";

export function IconButton( {
    icon, onClick 
} : {
    icon: ReactNode, onClick: () => void
}){
    return <div className="cursor-pointer rounded-full border p-2 bg-black hover:bg-gray-500" onClick={ onClick }>
        {icon}
    </div>
}