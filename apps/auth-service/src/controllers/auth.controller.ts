import { NextFunction, Request, Response } from "express";
import { validateRegisterData } from "../utils/auth.helper";
import prisma from "../../../../packages/libs/prisma";
import { ValidationError } from "../../../../packages/error-handler";

//Register a New User
export const userRegistration=async (req:Request,res:Response,next:NextFunction)=>{
    validateRegisterData(req.body,"user");
    const{name,email}=req.body;
    const existingUser =await prisma.user.findUnique({where:email});
    if(existingUser){
        return next (new ValidationError("User already exists with this email!"))
    };

    await checkOtpRestriction(email,next);
}