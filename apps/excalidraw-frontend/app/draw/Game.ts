import { Tool } from "../components/Canvas";
import { getExistingShapes } from "./http";

type PencilCoordinates = {
    x: number;
    y: number
}

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
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "pencil";
    coordinates: PencilCoordinates[];
} | null;


export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
    private roomId: string;
    private selectedTool: Tool = "rect";
    private clicked: boolean;
    private startX = 0;
    private startY = 0;

    socket: WebSocket;
    private pencilCoordinates: PencilCoordinates[];

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.existingShapes = [];
        this.pencilCoordinates = []
        this.init();
        this.initHandler();
        this.initMouseHandler();
    }

    async init(){
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandler(){
            //WHEN SOMEONE ELSE IS DRWAING
        //We need to re-render our canvas whenever we recieve a message(someone else is drawing)
        // console.log(">>>> excalidraw-FE > initDraw Socket? : ", (socket != null));
        this.socket.onmessage = (event) => {
            const resData = event.data;
            const parsedData = JSON.parse(resData);         //Parse raw data(ws sends raw data) into JSON
            
            if(parsedData.type == "chat"){
                const parsedMessage = JSON.parse(parsedData.message);       //Extract message object from parsedData
                // console.log(">>>initDraw parsed shape in chat : ", parsedMessage.shape);
                this.existingShapes.push(parsedMessage.shape);
                //Since new message is received we need to re-render/clear and fill the canvas again
                this.clearCanvas();
            }
        }
    }

    //Set current selected tool
    setTool(tool: Tool){
        this.selectedTool = tool;
    }

    clearCanvas(){
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0,0,0)";
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
        
        this.existingShapes.map( (shape) => {
            if( shape && typeof shape.type !== 'undefined' ){
                this.ctx.strokeStyle = "rgba(255,255,255)";
                if(shape.type === "rect"){
                    this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                }
                else if(shape.type === "circle"){
                    // console.log(">>>>clearCanvas : shape : ", shape);
                    this.ctx.beginPath();
                    this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
                else if(shape.type === "pencil"){
                    const allCoordinates = shape.coordinates;
                    this.ctx.lineCap = "round";
                    this.ctx.lineWidth = 2;
                    console.log(">>>>clearCanvas : pencil coords : ", allCoordinates);
                    for(let i=1; i<allCoordinates.length; i++){
                        this.ctx.beginPath();
                        this.ctx.moveTo(allCoordinates[i-1].x, allCoordinates[i-1].y);
                        this.ctx.lineTo(allCoordinates[i].x, allCoordinates[i].y);
                        this.ctx.stroke();
                    }
                    
                }
            }
        });
    }
    
    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        if( this.selectedTool === "pencil"){
            this.pencilCoordinates = [];            //start storing new coordinates
            this.pencilCoordinates.push({x: this.startX, y: this.startY});
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        let shape: Shape | null = null;
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        //console.log(">>>>mouseUP : tool : ", this.selectedTool);
        if( this.selectedTool === "rect"){
            shape = {
                type: this.selectedTool,
                x: this.startX,
                y: this.startY,
                width: width,
                height: height
            };
        }
        else if(this.selectedTool === "circle"){
            const centerX = this.startX + (width/2)
            const centerY = this.startY + (height/2)
            const radius = Math.abs(Math.max(height, width)/2); //Consider width/height as diameter
            shape = {
                type: this.selectedTool,
                centerX: centerX,
                centerY: centerY,
                radius: radius
            };
        }
        else if(this.selectedTool === "pencil"){
            // this.ctx.stroke();
            // this.ctx.beginPath();
            shape = {
                type: this.selectedTool,
                coordinates: this.pencilCoordinates
            }    
        }
        else if(this.selectedTool === "line"){
            //Todo
        }
        
        this.existingShapes.push(shape);

        //Send a message across Websocket
        this.socket.send(JSON.stringify({
            type: "chat",
            roomId: parseInt(this.roomId),
            message: JSON.stringify({shape})        //shape is also an object so we need to convert it to string again
        }));       //Used extra braces( {} ) because we need to send shape as an labelled JSON object not anonymous object
        
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if(this.clicked){
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;

            this.ctx.strokeStyle = "rgba(255,255,255)";
            
            if( this.selectedTool === "rect"){
                this.clearCanvas();
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            }
            else if( this.selectedTool === "circle"){
                this.clearCanvas();
                const centerX = this.startX + (width/2)
                const centerY = this.startY + (height/2)

                const radius = Math.abs(Math.max(height, width)/2); //Consider width/height as diameter
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            }
            else if(this.selectedTool === "pencil"){
                this.ctx.lineCap = "round";
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX,this.startY);
                this.ctx.lineTo(e.clientX, e.clientY);
                this.ctx.stroke();
                this.pencilCoordinates.push({x:e.clientX, y:e.clientY});
                // console.log(">>>>mousemove : start - x,y : ", this.startX, " , ", this.startY);
                // console.log(">>>>mousemove : cur - x,y : ", e.clientX, " , ", e.clientY);
                this.startX = e.clientX;
                this.startY = e.clientY;
            }
              
        }
    }

    initMouseHandler(){
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler); 
    }

    //Due to multiple re-rendering we are removing handlers in cleanup
    destroy(){
        this.canvas.removeEventListener("mousedown",this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup",this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove",this.mouseMoveHandler);
    }


}