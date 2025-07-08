import { useEffect, useRef, useState } from "react";
import { initDraw } from "../draw";
import { Button } from "../../../../packages/ui/src/button";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "../draw/Game";

export type Tool = "pencil" | "rect" | "circle" | "line";

export function Canvas({roomId, socket} : {roomId: string, socket: WebSocket}){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("rect");
    const [curGame, setCurGame] = useState<Game>();

    //Whenver selectedTool changes
    useEffect(() => {
        curGame?.setTool(selectedTool);
    }, [selectedTool, curGame]);

    useEffect(() => {
        if(canvasRef.current){      //If ref is not null
            const canvas = canvasRef.current;
            // initDraw(canvas, roomId, socket);
            const game = new Game(canvas, roomId, socket);
            setCurGame(game);

            return () => {
                game.destroy();
            }
        }

    }, [canvasRef]);

    const basicButtonStyle = "cursor-pointer border border-1 bg-green-400 rounded-md p-2 m-2";
    return <div className="fh-dvh overflow-hidden">
        {/* <div className="fixed top-10 left-10 text-white gap-2">
            <Button size="lg" variant="primary" className="border-1 cursor-pointer min-w-20 p-2 rounded-xl bg-slate-600" onClick={ () => { handleShapeClick("rect")}}>Rectangle</Button>

            <Button size="lg" variant="primary" className=" border-1 cursor-pointer min-w-20 p-2 rounded-xl bg-slate-600" onClick={ () => {handleShapeClick("circle")}}>Circle</Button>

            <Button size="lg" variant="primary" className="cursor-pointer border-1 min-w-20 p-2 rounded-xl bg-slate-600" onClick={ () => {handleShapeClick("line")}}>Line</Button>
        </div> */}
        <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        
    </div>
}

function TopBar({selectedTool, setSelectedTool} : {selectedTool:Tool, setSelectedTool: (s: Tool) => void}){
    return <div className="fixed top-5 left-5 text-white">
            <div className="flex gap-2">
                <IconButton activated={ selectedTool === "pencil" }  icon={<Pencil/>} onClick={ () => { setSelectedTool("pencil")}}/>
                <IconButton  activated={ selectedTool === "rect" }  icon={<RectangleHorizontalIcon/>} onClick={ () => { setSelectedTool("rect") }}/>
                <IconButton  activated={ selectedTool === "circle" } icon={<Circle/>} onClick={ () => { setSelectedTool("circle") }}/>
            </div>
        </div>
}