
////Remove this file as this is no longer needed.

import { BACKEND_URL } from "@/config";
import axios from "axios";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width : number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | null;


export async function initDraw(canvas : HTMLCanvasElement, roomId: string, socket: WebSocket){
    const ctx = canvas.getContext('2d');
    let existingShapes : Shape[] = await getExistingShapes(roomId);
    if(!ctx){
        return;
    }
    //WHEN SOMEONE ELSE IS DRWAING
    //We need to re-render our canvas whenever we recieve a message(someone else is drawing)
    // console.log(">>>> excalidraw-FE > initDraw Socket? : ", (socket != null));
    socket.onmessage = (event) => {
        const resData = event.data;
        const parsedData = JSON.parse(resData);         //Parse raw data(ws sends raw data) into JSON
        
        if(parsedData.type == "chat"){
            const parsedMessage = JSON.parse(parsedData.message);       //Extract message object from parsedData
            // console.log(">>>initDraw parsed shape in chat : ", parsedMessage.shape);
            existingShapes.push(parsedMessage.shape);
            //Since new message is received we need to re-render/clear and fill the canvas again
            clearCanvas(existingShapes, canvas, ctx);
        }
    }

    clearCanvas(existingShapes, canvas, ctx);           //Render the existing shapes initially

    let clicked = false;
    let startX = 0, startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        let shape: Shape | null = null;
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        //@ts-ignore
        const selectedTool = window.selectedTool;
        if( selectedTool === "rect"){
            shape = {
                type: selectedTool,
                x: startX,
                y: startY,
                width: width,
                height: height
            };
        }
        else if(selectedTool === "circle"){
            const centerX = startX + (width/2)
            const centerY = startY + (height/2)
            const radius = Math.abs(Math.max(height, width)/2); //Consider width/height as diameter
            shape = {
                type: selectedTool,
                centerX: centerX,
                centerY: centerY,
                radius: radius
            };
        }
        
        existingShapes.push(shape);

        //Send a message across Websocket
        socket.send(JSON.stringify({
            type: "chat",
            roomId: parseInt(roomId),
            message: JSON.stringify({shape})        //shape is also an object so we need to convert it to string again
        }));       //Used extra braces( {} ) because we need to send shape as an labelled JSON object not anonymous object
        
    });

    canvas.addEventListener("mousemove", (e) => {
        if(clicked){
            const width = e.clientX - startX;
            const height = e.clientY - startY;

            clearCanvas(existingShapes, canvas, ctx);
            ctx.strokeStyle = "rgba(255,255,255)";
            //@ts-ignore
            const selectedTool = window.selectedTool;
            if( selectedTool === "rect"){
                ctx.strokeRect(startX, startY, width, height);
            }
            else if( selectedTool === "circle"){
                const centerX = startX + (width/2)
                const centerY = startY + (height/2)

                const radius = Math.abs(Math.max(height, width)/2); //Consider width/height as diameter
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
              
        }
    }); 
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    existingShapes.map( shape => {
        if( shape && typeof shape.type !== 'undefined' ){
            ctx.strokeStyle = "rgba(255,255,255)";
            if(shape.type === "rect"){
                ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }
            else if(shape.type === "circle"){
                ctx.beginPath();
                ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });
}

async function getExistingShapes(roomId: string){
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    const messages = response.data.messages;

    const existingShapes = messages.map( (x: {message: string}) => {
        const messageData = JSON.parse(x.message);
        const shape = messageData.shape;
        return shape;
    });

    return existingShapes;
}