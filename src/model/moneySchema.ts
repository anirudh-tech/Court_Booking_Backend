import { Schema, model } from "mongoose";

const MoneySchema = new Schema(
  {
    weekDays: {
      type: Number,
      required: true,
    },
    weekEnds: {
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
