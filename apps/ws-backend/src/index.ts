import { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });
// try tsx dependency for compilation

wss.on('connection', function connection(ws, request) {
    ws.on('error', console.error);
    const url = request.url;
    if(!url){
        return;
    }

    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") || "";
    const decoded = jwt.verify(token, JWT_SECRET);

    if(typeof decoded == "string"){
      ws.close();
      return;
    }

    if(!decoded || !decoded.userId){        //Infer decoded as JwtPayload
        ws.close();
        return;
    }


  ws.on('message', function message(data) {
    console.log('~~~~~server : received: %s', data);
  });

  ws.send('something');
});