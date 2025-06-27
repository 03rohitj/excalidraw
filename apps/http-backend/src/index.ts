import express from "express";
import { signupZodSchema } from "@repo/common/types";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

import { authMiddleware } from "./authMiddleware";
const app = express();



app.post("/signup", async (req, res) =>{

    try {
        const result = signupZodSchema.safeParse(req.body);
        if(!result.success){
            throw new Error("Invalid Inputs : "+result.error);
        }

        const { username, password } = req.body;    

        res.status(201).json({
            "userId"  : "123",
            "message" : "Successfully signedup with user : "+username
        });
    } catch (error) {
        res.status(400).json({
            "message" : error
        });
    }


    
});


app.post("/signin", async (req, res) =>{

    const userId = 1;
    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        token
    });
});

app.post("/room", authMiddleware , async (req, res) =>{
    //db call

    res.status(200).json({
        roomId : 123
    });
});

app.listen(3001);