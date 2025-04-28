import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestriction,
  sendOtp,
  trackOtpRequests,
  validateRegisterData,
} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { ValidationError } from "@packages/error-handler";

//Register a New User
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegisterData(req.body, "user");
    const { name, email } = req.body;
    const existingUser = await prisma.users.findUnique({ where: {email}});
    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    await checkOtpRestriction(email, next);
    await trackOtpRequests(email, next);
    await sendOtp( name,email, "user-activation-mail");

    res.status(200).json({
      message: "OTP send to mail. Please verify you account!",
    });
  } catch (error) {
    return next(error);
  }
};
