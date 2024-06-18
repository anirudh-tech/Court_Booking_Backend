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
      ref:'Sport'
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
      category: {
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


