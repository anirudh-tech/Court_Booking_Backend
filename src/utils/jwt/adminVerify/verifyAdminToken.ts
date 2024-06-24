import jwt from "jsonwebtoken";
import { IDecodedInterface } from "../../../interfaces/IDecodedInterface";
import { NextFunction, Request, Response } from "express";
export const verifyAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.admin_jwt;
    jwt.verify(
      token,
      String(process.env.ACCESS_TOKEN_SECRET),
      (error: any, decoded: any) => {
        if (error) {
          throw new Error(error.message);
        } else {
          if (decoded!.role == "admin") {
            req.body._id = decoded._id;
          } else {
            throw new Error("admin not verified");
          }
        }
      }
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};
