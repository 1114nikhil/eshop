import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";

const emailRegex=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

export const validateRegisterData =(data:any,userType:"user"|"seller")=>{
    const {name,email,password,phone_number,country}=data
    if(!name||!email||!password||(userType=="seller"&&(!phone_number||!country))){
        return new ValidationError(`Missing Required Fields`);
    }
    if(!emailRegex.test(email)){
        return new ValidationError("Invalid email format!")
    }
};

export const checkOtpRestriction=(email:string,next:NewableFunction)=>{

}

export const sendOtp=async(name:String,email:String,template:String)=>{
    const otp=crypto.randomInt(1000,9999).toString();
    //
}

