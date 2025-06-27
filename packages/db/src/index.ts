import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient();


//To avoid code duplication we created a separate DB package, where we keep all db related things