"use client"

import { useEffect, useRef, useState } from "react";
import { initDraw } from "../draw";
import { WS_URL } from "@/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId} : {roomId: string}){
    const [socket, setSocket] = useState<WebSocket | null>(null);        //socket to broadcast the message

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzFiYjU5Yi1mZTA5LTQ0NjEtOGIxMC1hMzNjM2U3Yjc2NmEiLCJpYXQiOjE3NTE2MDE5NDl9.0zPELl1hcRL7aTtnP9DSz0XRZavFE8HYicmHPxU01cM`);          //ToDO : Hardcoding token for now, use local storage.....
        
        ws.onopen = () => {
            
            // console.log(">>>>RoomCanvas - Socket connection created. room : ", roomId);
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }));
        }
    }, []);

    
    
    if(!socket){ 
        return <div> Connecting to server...</div>
    }
    
    return <Canvas roomId={roomId} socket={socket}/>
}