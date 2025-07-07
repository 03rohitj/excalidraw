import { useEffect, useRef, useState } from "react";
import { initDraw } from "../draw";
import { Button } from "../../../../packages/ui/src/button";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";

type Shape = "rect" | "circle" | "line";

export function Canvas({roomId, socket} : {roomId: string, socket: WebSocket}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const curShape = useRef<Shape>("rect");

    const handleShapeClick = (newShape: Shape) => {
        curShape.current = newShape;
        if(canvasRef.current){
            initDraw(canvasRef.current, roomId, socket, curShape.current);
        }
    };

    useEffect(() => {
        if(canvasRef.current){      //If ref is not null
            const canvas = canvasRef.current;
            initDraw(canvas, roomId, socket, curShape.current);
        }
    }, [canvasRef]);

    const basicButtonStyle = "cursor-pointer border border-1 bg-green-400 rounded-md p-2 m-2";
    return <div className="fh-dvh overflow-hidden">
        {/* <div className="fixed top-10 left-10 text-white gap-2">
            <Button size="lg" variant="primary" className="border-1 cursor-pointer min-w-20 p-2 rounded-xl bg-slate-600" onClick={ () => { handleShapeClick("rect")}}>Rectangle</Button>

            <Button size="lg" variant="primary" className=" border-1 cursor-pointer min-w-20 p-2 rounded-xl bg-slate-600" onClick={ () => {handleShapeClick("circle")}}>Circle</Button>

            <Button size="lg" variant="primary" className="cursor-pointer border-1 min-w-20 p-2 rounded-xl bg-slate-600" onClick={ () => {handleShapeClick("line")}}>Line</Button>
        </div> */}
        <TopBar/>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        
    </div>
}

function TopBar(){
    return <div className="fixed top-10 left-10 text-white">
            <div className="flex flex-col gap-2">
                <IconButton icon={<Pencil/>} onClick={ () => {}}></IconButton>
                <IconButton icon={<RectangleHorizontalIcon/>} onClick={ () => {}}></IconButton>
                <IconButton icon={<Circle/>} onClick={ () => {}}></IconButton>
            </div>
        </div>
}