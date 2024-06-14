import { NextFunction, Request, Response } from "express";
import { hash, genSalt } from "bcryptjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model/userSchema";

// const adminUsername = "lalsportsacademy";
// const adminPassword = "d12Uc5OQ@47osOsiOD";

export const loginController = () => {
  return {
    // addAdmin: async (req: Request, res: Response, next: NextFunction) => {
    //   let { username, password, role } = req.body;
    //   req.body.password = await hash(password, await genSalt(10));
    //   const admin = await User.create(req.body)
    //   res.json({
    //     data: admin,
    //     message: "admin added"
    //   })
    // },

    adminLogin: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, password } = req.body;
        const admin: any = await User.findOne({ username });
        if (admin) {
          console.log("🚀 ~ file: loginController.ts:17 ~ adminLogin: ~ admin:", admin)
          const isMatch: boolean = await bcrypt.compare(
            password,
            admin.password
          );
          if (!isMatch) {
            throw new Error("Username or password incorrect");
          } else {
            let payload = {
              _id: String(admin?._id),
              username: admin?.username!,
              role: "admin",
            };
            const accessToken = jwt.sign(
              payload,
              String(process.env.ACCESS_TOKEN_SECRET),
              { expiresIn: "1h" }
            );
            res.cookie("admin_jwt", accessToken, {
              httpOnly: true,
              secure: true,
              sameSite: "none",
            });
            const adminObject = admin.toObject();
            delete adminObject.password;
            res.json({
              success: true,
              data: adminObject,
              message: "Admin verified!",
            });
          }
        } else {
          throw new Error("Account not found");
        }
      } catch (error) {
        next(error);
      }
    },
    userLogin: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {phoneNumber} = req.body
        const token = req.header('Authorization')?.split(' ')[1];
      } catch (error) {
        
      }
    }
  };
};
