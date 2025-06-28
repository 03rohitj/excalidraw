//Define a websocket connect for the client, i.e. client connects to web socket server through web socket interfcae.

import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function useSocket(){
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect( ()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzFiYjU5Yi1mZTA5LTQ0NjEtOGIxMC1hMzNjM2U3Yjc2NmEiLCJpYXQiOjE3NTEwOTA0OTF9.0FPQm9Ht5o_VaCamtnUxV1_OVfd5aLzI7kgNFZxIqv8`);      //Hard coding token for now..Attach when signing in 
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    },[]);

    return {
        socket,
        loading
    }

}