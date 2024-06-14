import { Schema, model } from "mongoose";
import { UserEntity } from "../entity/userEntity";

const UserSchema = new Schema(
  {
    username: {
      type: String,
    },
    password: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User"
    }
  },
  {
    timestamps: true,
  }
);

export const User = model("User", UserSchema);
