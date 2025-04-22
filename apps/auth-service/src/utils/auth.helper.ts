import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";


export const validateRegisterData =(data:any,userType:"user"|"seller")=>{
    const {name,email,password,phone_number,country}=data
    if(!name||!email||!password||(userType=="seller"&&(!phone_number||!country))){
        return new ValidationError(`Missing Required Fields`,undefined);
    }
}