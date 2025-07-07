
import { RoomCanvas } from "@/app/components/RoomCanvas";

type drawShapes = null | "rect" | "circle";

export default async function CanvasPage({params} : {
    params : { roomId: string}
}){
    const roomId = (await params).roomId;
    console.log("Server CanvasPage : ", roomId);
    // const [curShape, setCurShape] = useState<drawShapes>("rect");
    return <RoomCanvas roomId={roomId}/>
}