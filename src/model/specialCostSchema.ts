import { Schema, model } from "mongoose";

const CostTypeSchema = new Schema({
  day: {
    type: {
      cost: {
        type: Number,
      },
      days: [
        {
          type: String,
        },
      ],
      extra: {
        type: Number,
      }
    },
  },
  time: {
    type: {
      cost: {
        type: Number,
      },
      times: [
        {
          type: String,
        },
      ],
      extra: {
        type: Number,
      }
    },
  },
});

const SpecialCostSchema = new Schema(
  {
    costType: {
      type: [CostTypeSchema],
    },
  },
  {
    timestamps: true,
  }
);

export const SpecialCost = model("SpecialCost", SpecialCostSchema);
