import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestriction,
  sendOtp,
  trackOtpRequests,
  validateRegisterData,
  verifyOtp,
} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthenticationError, ValidationError } from "@packages/error-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookies } from "../utils/cookies/setCookies";

//Register a New User
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegisterData(req.body, "user");
    const { name, email } = req.body;
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    await checkOtpRestriction(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "user-activation-mail");

    res.status(200).json({
      message: "OTP send to mail. Please verify you account!",
    });
  } catch (error) {
    return next(error);
  }
};

//verify user with otp
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, otp, name } = req.body;
    if (!email || !password || !otp || !name)
      return next(new ValidationError("All fields are required!"));

    const existingUser = await prisma.users.findUnique({ where: { email } });

     

    await verifyOtp(email, otp, next);
    const hashPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: { name, email, password: hashPassword },
    });

    res.status(201).json({
      success: true,
      message: "User Register successfully!",
    });
  } catch (error) {
    next(error);
  }
};

//login user
export const loginUser = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const {email,password}=req.body;
    if(!email||!password)
      return next("Email and password are required!");

    const user = await prisma.users.findUnique({where:{email}});
    if(!user)
      return next(new AuthenticationError("User doesn't exists!"));

    //verify password
    const isMatch= await bcrypt.compare(password,user.password!);
    if(!isMatch)
      return next(new AuthenticationError("Invalid email or password"));

    //Generate access refresh token
    const accessToken =jwt.sign({id:user.id,role:"user"}
      ,process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn:"15min"
      }
    );
     const refreshToken =jwt.sign({id:user.id,role:"user"}
      ,process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn:"7days"
      }
    );

    //store refresh and access token in httpOnly secure cookie
    setCookies(res,"refresh_token",refreshToken);
    setCookies(res,"access_token",accessToken);

    res.status(200).json({
      message:"Login successful!",
      user:{id:user.id,email:user.email,name:user.name}
    });
     
  } catch (error) {
    return next(error)
  }
};

//user forget passowrd
