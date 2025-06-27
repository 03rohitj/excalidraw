import {z} from "zod";

export const signupZodSchema = z.object({
    "username" : z.string().trim().min(6, "Username should be of minimum 6 letters"),
    "password" : z.string().trim().min(6, "Password should be of minimum 6 letters"),
    "name"     : z.string()
});

export const signinZodSchema = z.object({
    "username" : z.string().trim().min(6, "Username should be of minimum 6 letters"),
    "password" : z.string().trim().min(6, "Password should be of minimum 6 letters")
});

export const createRoomZodSchema = z.object({
    "roomName": z.string().min(3).max(30)
});