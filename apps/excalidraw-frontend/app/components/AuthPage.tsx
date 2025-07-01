"use client"
import {Button} from "../../../../packages/ui/src/button";
import { useRouter } from "next/navigation";
export function AuthPage({isSignin}: {
    isSignin: boolean
}){
    const router = useRouter();

    return <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-6 m-2 bg-white rounded text-gray-800">
            <div className="m-2">
                <input className="p-2" type="text" placeholder="email"></input>
            </div>
            <div className="m-2">
                <input className="p-2" type="password" placeholder="password"></input>
            </div>
            <div>
                
                <Button className="cursor-pointer" onClick={() => {
                    const route = isSignin ? "/signin" : "/signup";
                    router.push(route);
                } } variant={"primary"} size={"lg"}>{isSignin ? "Sign-in" : "Sign-up"}</Button>
            </div>
            
        </div>
    </div>
}