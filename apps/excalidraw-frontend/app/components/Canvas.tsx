import { useEffect, useRef } from "react";
import { initDraw } from "../draw";

export function Canvas({roomId, socket} : {roomId: string, socket: WebSocket}){
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
       
        if(canvasRef.current){      //If ref is not null
            const canvas = canvasRef.current;
            initDraw(canvas, roomId, socket);
        }
    }, [canvasRef]);

    const basicButtonStyle = "cursor-pointer border border-1 bg-green-400 rounded-md p-2 m-2";
    return <div>
        <canvas ref={canvasRef} width={"1800"} height={"900"}></canvas>
    </div>
}