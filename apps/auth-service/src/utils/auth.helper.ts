import crypto from "crypto";
import { ValidationError } from "@packages/error-handler";
import redis from "@packages/libs/redis";
import { sendEmail } from "./sendMail";
import { NextFunction, Request, Response } from "express";
import prisma from "@packages/libs/prisma";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//#region Validating register Data
export const validateRegisterData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;
  if (
    !name ||
    !email ||
    !password ||
    (userType == "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError(`Missing Required Fields`);
  }
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format!");
  }
};
//#endregion

//#region Check OTP Restriction
export const checkOtpRestriction = async (
  email: string,
  next: NextFunction
) => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        "Account is lock due to multiple failed attempts! Try again after 30 min"
      )
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        "Too many OTP requests! PLease wait 1hour before requesting again"
      )
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError("Please wait 1 min before requesting a new OTP")
    );
  }
};
//#endregion

//#region Track OTP Request
export const trackOtpRequests=async(email:string,next:NextFunction)=>{
    const otpRequestKey=`otp_request_count:${email}`;
    let otpRequests=parseInt((await redis.get(otpRequestKey))||"0");

    if(otpRequests>=2){
        await redis.set(`otp_spam_lock:${email}`,"locked","EX",3600); //Locked for 1 hour
        return next(new ValidationError("Too many OTP requests! Please wait for 1 hour before request again"));
    }
    await redis.set(otpRequestKey,otpRequests,"EX",3600)
}
//#endregion

//#region sending OTP
export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendEmail(email, "Verify your email !", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};
//#endregion

//#region verify OTP
export const verifyOtp =async(email:String,otp:String,next:NextFunction)=>{
  const storedOtp= await redis.get(`otp:${email}`);
  console.log(`storedOtp:${storedOtp} otp:${otp}`)
  if(!storedOtp)
    throw new ValidationError("Invalid or Expired Otp!");

  const failedAttemptsKey =`otp_attempt :${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey))||"0");

  if(storedOtp!==otp){
    if(failedAttempts>2){
      await redis.set(`otp_lock:${email}`,"locked","EX",1800);
      await redis.del(`otp:${email}`,failedAttemptsKey);
      throw new ValidationError("Too many failed attempts. Your account is locked for 30 min!.");
    }
    await redis.set(failedAttemptsKey,failedAttempts+1,"EX",300);
    throw new ValidationError(`Incorrect Otp,${2-failedAttempts} attempts left.`);
  }
  await redis.del(`otp:${email}`,failedAttemptsKey);
}
//#endregion

//#region verify Forgot. Password OTP
export const verifyForgotPasswordOTP= async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const {email,otp} = req.body;

    if(!email ||!otp) throw new ValidationError("Email and OTP are requirted!");

    await verifyOtp(email,otp,next);

    res.status(200).json({message:"OTP verified, You can reset your password!"})
  } catch (error) {
    next(error)
  }
}
//#endregion

//#region handle Forgot Password
export const handleForgotPassword=async (req:Request,res:Response,next:NextFunction,userType:"user"|"seller")=>{
  try {
    const email=req.body;

    if(!email)throw new ValidationError("Email is required!");
    //find the user/seller in DB
    const user= userType==="user"&&await prisma.users.findUnique({where:{email}});

    if(!user) throw new ValidationError(`${userType} is not found! `);

    //check otp restrictions
    await checkOtpRestriction(email,next);
    await trackOtpRequests(email,next);

    //Generate otp send
    await sendOtp(email,user.name,"forgot-password-user-mail");

    res.status(200).json({message:"OTP sent to email. Please verify your account!"});
  } catch (error) {
    next(error);
  }
} 
//#endregion