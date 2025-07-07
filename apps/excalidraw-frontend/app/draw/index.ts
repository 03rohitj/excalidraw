
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
} | null;


export async function initDraw(canvas : HTMLCanvasElement, roomId: string, socket: WebSocket, shapeType: "rect" | "circle" | "line"){
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
        // console.log(">>>initdraw > Receiving Msg from broadcast, data : ", parsedData);
        // console.log(">>>initdraw > Receiving Msg from broadcast, type : ", parsedData.type);
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
        console.log(">>>>FE initDraw shapeType : ", shapeType);
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        
        let shape: Shape;
        if( shapeType === "rect"){
            shape = {
                type: "rect",
                x: startX,
                y: startY,
                width: e.clientX-startX,
                height: e.clientY-startY
            };
        }
        else if(shapeType === "circle"){
            shape = {
                type: "circle",
                centerX: startX,
                centerY: startY,
                radius: 0
            };
        }
        else{
            shape = null;
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
            ctx.strokeRect(startX, startY, width, height);
            
        }
    }); 
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    existingShapes.map( shape => {
        if( shape && typeof shape.type !== 'undefined' && shape.type === "rect"){
            ctx.strokeStyle = "rgba(255,255,255)";
            // console.log(">>>initdraw > clearCanvas > Shape : ", shape);
            // console.log(`>>>initdraw > clearCanvas > Shape cords :  ${shape.x}, ${shape.y}, ${shape.width}, ${shape.height}`);
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
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