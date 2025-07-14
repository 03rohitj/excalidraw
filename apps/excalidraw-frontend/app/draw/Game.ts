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
    private panX = 0;
    private panY = 0;
    private scale = 1;

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
        this.resetCanvas();
    }

    async init(){
        this.existingShapes = await getExistingShapes(this.roomId);
        this.refreshCanvas();
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
                this.refreshCanvas();
            }
        }
    }

    //Set current selected tool
    setTool(tool: Tool){
        this.selectedTool = tool;
    }

    refreshCanvas(){
        
        //Initial code - without pan
        // this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        // this.ctx.fillStyle = "rgba(0,0,0)";
        // this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to identity
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //transofrm(update) the canvas if panned or scaled
        this.ctx.transform(this.scale, 0, 0, this.scale, this.panX, this.panY);
        //Reset the canvas
        this.ctx.clearRect(
            -this.panX/this.scale,
            -this.panY/this.scale,
            this.canvas.width/this.scale,
            this.canvas.height/this.scale
        );
        this.ctx.fillStyle = "rgba(0,0,0)";
        this.ctx.fillRect(-this.panX/this.scale, -this.panY/this.scale, this.canvas.width/this.scale, this.canvas.height/this.scale);
        
        this.existingShapes.map( (shape) => {
            if( shape && typeof shape.type !== 'undefined' ){
                this.ctx.strokeStyle = "rgba(255,255,255)";
                if(shape.type === "rect"){
                    this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                }
                else if(shape.type === "circle"){
                    // console.log(">>>>refreshCanvas : shape : ", shape);
                    this.ctx.beginPath();
                    this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
                else if(shape.type === "pencil"){
                    const allCoordinates = shape.coordinates;
                    this.ctx.lineCap = "round";
                    this.ctx.lineWidth = 2;
                    for(let i=1; i<allCoordinates.length; i++){
                        this.ctx.beginPath();
                        this.ctx.moveTo(allCoordinates[i-1].x, allCoordinates[i-1].y);
                        this.ctx.lineTo(allCoordinates[i].x, allCoordinates[i].y);
                        this.ctx.stroke();
                    }
                    
                }
                else if( shape.type === "line"){
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.startX,shape.startY);
                    this.ctx.lineTo(shape.endX, shape.endY);
                    this.ctx.stroke();
                }
            }
        });
    }
    
    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        const { x, y } = this.transformPanScale(e.clientX, e.clientY);
        this.startX = x;
        this.startY = y;
        
        console.log(">>>>mousedown : (panX,panY) : (",this.panX,",",this.panY,")" );
        console.log(">>>>mousedown : (clientX,clientY) : (",e.clientX,",",e.clientY,")" );
        console.log(">>>>mousedown : (startX,startY) : (",this.startX,",",this.startY,")" );
        if( this.selectedTool === "pencil"){
            this.pencilCoordinates = [];            //start storing new coordinates
            this.pencilCoordinates.push({x: this.startX, y: this.startY});
        }
        else if(this.selectedTool === "hand"){
            //We nee real coordinates not the canvas coordinates, so :
            this.startX = e.clientX;
            this.startY = e.clientY;
        }

        this.refreshCanvas();
    }

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        let shape: Shape | null = null;
        const { x, y } = this.transformPanScale(e.clientX, e.clientY);
        const width = x - this.startX;
        const height = y - this.startY;

        if( this.selectedTool === "hand"){
            this.ctx.restore();
        }
        else if( this.selectedTool === "rect"){
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
            shape = {
                type: this.selectedTool,
                coordinates: this.pencilCoordinates
            }    
        }
        else if(this.selectedTool === "line"){
            shape = {
                type: this.selectedTool,
                startX: this.startX,
                startY: this.startY,
                endX: x,
                endY: y
            }
        }
        else if(this.selectedTool === "hand"){
            this.startX = e.clientX;
            this.startY = e.clientY;
        }
        
        this.existingShapes.push(shape);

        //Send a message across Websocket
        this.socket.send(JSON.stringify({
            type: "chat",
            roomId: parseInt(this.roomId),
            message: JSON.stringify({shape})        //shape is also an object so we need to convert it to string again
        }));       //Used extra braces( {} ) because we need to send shape as an labelled JSON object not anonymous object

        this.refreshCanvas();
        
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if(this.clicked){
            //Get canvas coordinates
            const {x,y} = this.transformPanScale(e.clientX, e.clientY);

            const width = x - this.startX;
            const height = y - this.startY;

            this.ctx.strokeStyle = "rgba(255,255,255)";
            
            if(this.selectedTool === "hand"){
                
                //Get transformed startX and startY
                const { x: startTransformedX, y: startTransformedY } = this.transformPanScale(this.startX, this.startY);
                const deltaX = x - startTransformedX;   
                const deltaY = y - startTransformedY;

                this.panX += deltaX*this.scale;             //Update the total panning
                this.panY += deltaY*this.scale;
                console.log(">>>>mousemove : (panX,panY) : (",this.panX,",",this.panY,")" );
                //Update the start pos
                this.startX = e.clientX;
                this.startY = e.clientY;

                // this.resetCanvas();
                // this.ctx.translate(this.panX, this.panY);
                this.refreshCanvas();
                // this.ctx.restore();

                // console.log(">>>>mousemove : offsetLeft : ", this.canvas.offsetLeft);
                // console.log(">>>>mousemove : offsetTop : ", this.canvas.offsetTop);
            }
            else if( this.selectedTool === "rect"){
                this.refreshCanvas();
                this.ctx.strokeRect(this.startX, this.startY, width, height);
            }
            else if( this.selectedTool === "circle"){
                this.refreshCanvas();
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
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                this.pencilCoordinates.push({x,y});
                // console.log(">>>>mousemove : start - x,y : ", this.startX, " , ", this.startY);
                // console.log(">>>>mousemove : cur - x,y : ", e.clientX, " , ", e.clientY);
                this.startX = x;
                this.startY = y;
            }
            else if( this.selectedTool === "line"){
                this.refreshCanvas();
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX,this.startY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
              
        }
    }

    //To clear the canvas, and give back blank canvas
    resetCanvas(){
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0,0,0)";
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
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

    //If canvas is panned or scaled we need the virtual coordinates, because screen coords remain same but canvas coords changes
    transformPanScale(
        clientX: number, clientY: number
    ) : { x: number; y: number }{
        const rect = this.canvas.getBoundingClientRect();  //pixel diff between viewport and element
        const x = (clientX - rect.left - this.panX) / this.scale;
        const y = (clientY - rect.top - this.panY) / this.scale;
        return { x , y };
    }
}