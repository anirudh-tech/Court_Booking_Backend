import { Schema, model } from "mongoose";

const CourtSchema = new Schema(
  {
    courtName: {
      type: String,
      required: true,
    },
    cost: {
      type: Schema.Types.ObjectId,
      ref: "Money"
    },
    specialCost: {
      type: Schema.Types.ObjectId,
      ref: "SpecialCost"
    }
  },
  {
    timestamps: true,
  }
);

export const Court = model("Court", CourtSchema);
