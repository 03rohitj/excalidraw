import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });
// try tsx dependency for compilation

//User type to store list of users currently on the server
interface User{
  ws: WebSocket,      //ws object for each client
  rooms: string[],    //What all rooms are they connected to
  userId: string      //To uniquely identify the user
}

const users : User[] = [];    //This is usgly state management

//Function returns userId if token is valid otherwise it returns null
function checkUser(token: string) : string | null{
  const decoded = jwt.verify(token, JWT_SECRET);

    if(typeof decoded == "string"){
      return null;
    }

    if(!decoded || !decoded.userId){        //Infer decoded as JwtPayload
        return null;
    }

    return decoded.userId;
}

wss.on('connection', function connection(ws, request) {
    ws.on('error', console.error);
    const url = request.url;
    if(!url){
        return;
    }

    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") || "";
    const userId = checkUser(token);

    if(!userId){
      ws.close();
      return;
    }

    console.log(">>>WS Connection ValidUser : "+userId);
    //Add user to the list of connected users
    users.push({
      userId, 
      rooms: [],
      ws
    });


  ws.on('message', async function message(data) {
    const parsedData = JSON.parse(data as unknown as string);
    //In data payload, type field should be passed to determine the request
    if(parsedData.type === "join_room"){
      const user = users.find(x => x.ws === ws);
      //ToDo : verify roomId axists, verify user has permission to access room, etc etc
      user?.rooms.push(parsedData.roomId);
      console.log(">>>>WS JoinRoom : User : "+user?.userId+" joined room : "+parsedData.roomId);
      
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x => x.ws === ws);
      if(!user)
        return

      user.rooms = user.rooms.filter(x => x ===parsedData.room);
      console.log(">>>>WS LeaveRoom : User : "+user?.userId+" left room : "+parsedData.roomId);
    }

    if(parsedData.type === "chat"){
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      console.log(">>>>WS Chat : Message : "+message+" roomId : "+roomId);
      

      //NOTE : This approach is not good(storing in db and then sending through ws), so try and use queue for messaging. Take ref. from harkirat's chess YT video(TODO). 
      //We can use Redux or some state management lib.
      await prismaClient.chat.create({
        data:{
          roomId,
          message,
          userId
        }
      });

      users.forEach(user => {
        if(user.rooms.includes(roomId)){
          console.log(">>>>WS Chat : broadcasting message to user - "+user.userId);
          user.ws.send(JSON.stringify({     //We can send only string or binary data in websockets
            type: "chat",
            message : message,
            roomId
          }));
        }   //ToDo : User not getting broadcasted messages. Check
      });
    }
  });

});