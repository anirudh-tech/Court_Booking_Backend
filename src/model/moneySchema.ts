import { Schema, model } from "mongoose";

const MoneySchema = new Schema(
  {
    cost: {
      type: Number,
      required: true,
    },
    extra: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export const Money = model("Money", MoneySchema);
