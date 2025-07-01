"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient({
    messages, id
}: {
    messages: {message: string}[],
    id: string
}){
    const {socket, loading} = useSocket();
    const [chats, setChats] = useState(messages);               //Fetch prev messages from db and store them in chats
    const [currentMessage, setCurrentMessage] = useState("");       //Current message in chat input box

    useEffect(() => {
        if( socket && !loading){

            socket.send(JSON.stringify({            //Optimise this
                type: "join_room",
                roomId: id
            }));

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);      //Converts JSON string into JSON object
                if(parsedData.type === "chat"){
                    setChats(c => [...c, {message: parsedData.message}]);
                }
            }

        }
    }, [socket, loading, id]);

    return <div>
        {chats.map( c => <div>{c.message}</div>)}
        <input onChange={e => {
            setCurrentMessage(e.target.value);
        }} value={currentMessage} type="text" placeholder="Enter message"></input>

        <button onClick={() => {
            socket?.send(JSON.stringify({       //Remember : WebSocket understands string json only not json object
                type: "chat",
                roomId: id,
                message: currentMessage
            }));
            setCurrentMessage("");              //Clear input box
        }}>Send</button>

    </div>

}