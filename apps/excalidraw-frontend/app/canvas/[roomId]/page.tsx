"use client";

import { useEffect, useRef } from "react";

export default function Canvas(){

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(canvasRef.current){      //If ref is not null
            const canvas = canvasRef.current;
            const ctx = (canvas as HTMLCanvasElement).getContext('2d');

            if(!ctx)
                return;

            let clicked = false;
            let startX = 0, startY = 0;

            canvas.addEventListener("mousedown", (e) => {
                clicked = true;
                startX = e.clientX;
                startY = e.clientY;
            });

            canvas.addEventListener("mouseup", (e) => {
                clicked = false;
                console.log(e.clientX);
                    console.log(e.clientY);
                
            });

            canvas.addEventListener("mousemove", (e) => {
                if(clicked){
                    const width = e.clientX - startX;
                    const height = e.clientY - startY;

                    ctx.clearRect(0,0,canvas.height, canvas.width);
                    ctx.strokeRect(startX, startY, width, height);
                    
                }
            });
        }
    }, [canvasRef]);
    
    return <div>
        <canvas ref={canvasRef} width={1000} height={1000}></canvas>
    </div>
}