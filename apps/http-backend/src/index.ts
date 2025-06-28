import express from "express";
import { createRoomZodSchema, signinZodSchema, signupZodSchema } from "@repo/common/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET, SALT_ROUNDS } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import { authMiddleware } from "./authMiddleware";
import bcrypt from "bcrypt";

const app = express();

app.use(express.json());            //Require to parse json into req object
app.post("/signup", async(req, res) =>{

    console.log("------>>>/signup hit : ",req.body);
    try {
        const result = signupZodSchema.safeParse(req.body);
        if(!result.success){
            throw new Error("Invalid Inputs : "+result.error);
        }

        const { email, password, name } : {email:string, password:string, name:string} = result.data;    
        const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
        const user = await prismaClient.user.create({
            data: {
                email: email,
                password: hashedPassword,
                name: name
            }
        });

        res.status(201).json({
            "user Id"  : user.id,
            "message" : "Successfully signedup with user : "+user.email
        });
        return ;
    } catch (error) {
        console.error("------->>>Signup error : "+error);
        res.status(400).json({
            "message" : error
        });
        return;
    }
});


app.post("/signin", async (req, res) =>{
    console.log("------>>>/signin hit : ",req.body);
    try {
        const result = signinZodSchema.safeParse( req.body );
        if(!result.success){
            throw new Error("Invalid Input : "+result.error);
        }
        
        const { email, password} = result.data;
        
        const user = await prismaClient.user.findFirst({
            where: {
                email
            }
        });

        if(!user){
            throw new Error("Invalid Email, No user found");
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        console.log("IsPassword Valid? : ", isPasswordValid);
        if(!isPasswordValid)
            throw new Error("Invalid Password, Please check the password");

        const token = jwt.sign({
            userId : user.id
        }, JWT_SECRET);

    res.status(200).json({
        "message" : user.name+" signed-in successfully",
        token
    });
    return;

    } catch (error) {
        res.status(400).json({
            "Message" : "Error : "+error
        });
        return;
    }
});

app.post("/room", authMiddleware , async (req, res) =>{
    console.log("------>>>/room hit : ",req.body);
    try {
        const result = createRoomZodSchema.safeParse( req.body );
        if(!result.success){
            throw new Error("Invalid Input : "+result.error);
        }
        //@ts-ignore            TODO : req.userId is throwing ts error
        const userId = req.userId;

        const { roomName } = result.data;

        const room = await prismaClient.room.create({
            data:{
                slug: roomName,
                adminId: userId
            }
        });

        res.status(201).json({
            "message" : "Room created successfully",
            "id" : room.id
        });
        return;
    }
    catch(error){
        res.status(400).json({
            "Message" : "Error : "+error
        });
        return;
    }

});

//endpoint to get all messages in a particular room
app.get("/chats/:roomId", async(req, res) =>{
    const roomId = parseInt(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
        
        where:{
            roomId:roomId
        },
        orderBy:{
            id : "desc"
        },
        take: 50
    });

    console.log("---->>>Get Room messages : "+messages);

    res.status(200).json({
        messages
    });
    return;
});

//Endpoint to get roomId from roomSlug(i.e. roomName)
app.get("/room/:roomSlug", async(req, res) =>{        //Room Slug means room name, this endpoints gives room id from roomSlug
    const roomSlug = req.params.roomSlug;
    console.log(">>>>BE Hit, /room/roomSlug : "+roomSlug);
    const room = await prismaClient.room.findFirst({
        where:{
            slug: roomSlug
        }
    });

    if(!room){
        res.status(400).json({
            "message" : "Room not found"
        });
        return;
    }
    console.log(">>>>BE : Find Room Id hit : "+room.id);
    res.status(200).json({
        roomId: room.id
    });
    return;
});
app.listen(3001);