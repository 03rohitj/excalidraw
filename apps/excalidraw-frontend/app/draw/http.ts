import { BACKEND_URL } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string){
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    const messages = response.data.messages;

    const existingShapes = messages.map( (x: {message: string}) => {
        const messageData = JSON.parse(x.message);
        const shape = messageData.shape;
        return shape;
    });

    return existingShapes;
}