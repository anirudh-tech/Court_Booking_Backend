import mongoose, { Schema, model } from "mongoose";

const CourtSchema = new Schema(
  {
    courtName: {
      type: String,
      required: true,
      unique: true,
    },
    sportId: {
      type: mongoose.Types.ObjectId,
    },
    normalcost: {
      price: Number,
      day: {
        from: String,
        to: String,
      },
      time: {
        from: String,
        to: String,
      },
    },
    specialcost: {
      type: {
        type: String,
        enum: ["day", "time"],
      },
      price: Number,
      diff: {
        from: String,
        to: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Court = model("Court", CourtSchema);


