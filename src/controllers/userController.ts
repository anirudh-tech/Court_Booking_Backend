import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt/verifyToken";
import { User } from "../model/userSchema";
import { UserEntity } from "../entity/userEntity";

export const userController = () => {
  return {
    fetchData: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token : string = req.cookies.user_jwt
        const decodedValue: any = verifyToken(token)
        if(decodedValue) {
            const user = await User.findOne({_id: decodedValue._id})
            if(user) {
              res.status(200).json({
                status: true,
                data: user,
                message: "user fetched"
              })
            } else {
              throw new Error("user not found")
            }
        } else {
            throw new Error("could not verify user")
        }
      } catch (error) {
        next(error);
      }
    },
  };
};
