import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { json } from "zod/v4";
import { JWT_SECRET } from "@repo/backend-common/config";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    
    try {
        const token = req.headers.authorization;
        if(!token){
            throw new Error("UnAuthorized Access"); 
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if(!decoded)
            throw new Error("Invalid token");

        //@ts-ignore
        req.userId = decoded.userId;        //###ToDO : Check how to structure the request object in express using TS - Do not use ts-ignore

        next();

    } catch (error) {
        res.status(401).json({
            message : error
        });
    }


}