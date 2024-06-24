import { NextFunction, Request, Response } from "express";
import { hash, genSalt } from "bcryptjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model/userSchema";
import { decodeJWT } from "../utils/decodeFrontEndjwt";

// const adminUsername = "lalsportsacademy";
// const adminPassword = "d12Uc5OQ@47osOsiOD";

export const loginController = () => {
  return {
    // addAdmin: async (req: Request, res: Response, next: NextFunction) => {
    //   try {
    //     let { username, password, role } = req.body;
    //     req.body.password = await hash(password, await genSalt(10));
    //     const admin = await User.create(req.body)
    //     res.json({
    //       data: admin,
    //       message: "admin added"
    //     })
        
    //   } catch (error) {
    //     next(error)
    //   }
    // },

    adminLogin: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { username, password } = req.body;
        const admin: any = await User.findOne({ username });
        if (admin) {
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
              { expiresIn: "21h" }
            );
            res.cookie("user_jwt", accessToken, {
              httpOnly: true,
              secure: true,
              sameSite: "none",
            });
            const adminObject = admin.toObject();
            delete adminObject.password;
            res.status(200).json({
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
        const { phoneNumber } = req.body;
        const token = req?.headers?.["authorization"] as string;
        const secretToken = process.env.ACCESS_TOKEN_SECRET;
        if (secretToken) {
          const verified = decodeJWT(token);
          let user;
          if (verified) {
            user = await User.findOne({ phoneNumber });
            if (!user) {
              user = await User.create({ phoneNumber });
            }
            let payload = {
              _id: String(user?._id),
            };
            const accessToken = jwt.sign(
              payload,
              String(process.env.ACCESS_TOKEN_SECRET),
              { expiresIn: "21h" }
            );
            res.cookie("user_jwt", accessToken, {
              httpOnly: true,
              secure: true,
              sameSite: "none",
            });
            res.status(200).json({
              success: true,
              data: user,
              messaege: "User Logged in Successfully",
            });
          }
        } else {
          throw new Error("Token not found");
        }
      } catch (error) {
        next(error);
      }
    },
    logout: (req: Request, res: Response, next: NextFunction) => {
      try {
       

        res.clearCookie("user_jwt", {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
        res.status(200).json({ message: "Logged out", data: null });
      } catch (error) {
        next(error);
      }
    },
  };
};
