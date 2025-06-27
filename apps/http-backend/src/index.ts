import express from "express";
import { signinZodSchema, signupZodSchema } from "@repo/common/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";
import { authMiddleware } from "./authMiddleware";
const app = express();

app.use(express.json());            //Require to parse json into req object
app.post("/signup", async(req, res) =>{

    console.log("------>>>/signup hit : "+req.body);
    try {
        const result = signupZodSchema.safeParse(req.body);
        if(!result.success){
            throw new Error("Invalid Inputs : "+result.error);
        }

        const { email, password, name } : {email:string, password:string, name:string} = result.data;    
        const user = await prismaClient.user.create({
            data: {
                email: email,
                password: password,
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
                email, password
            }
        });

        if(!user){
            throw new Error("Invalid Credentials");
        }

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
    //db call

    res.status(200).json({
        roomId : 123
    });
});

app.listen(3001);