import { Schema, model } from "mongoose";

const SportSchema = new Schema(
  {
    sportName: {
      type: String,
      required: true,
    },
    image: String,
  },
  {
    timestamps: true,
  }
);

export const Sport = model("Sport", SportSchema);
