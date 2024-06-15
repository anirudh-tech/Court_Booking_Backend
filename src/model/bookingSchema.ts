import { Schema, model } from "mongoose";
import { UserEntity } from "../entity/userEntity";

const BookingSchema = new Schema(
  {
    sportId: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },
    courtId: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    duration: {
      type: Number,
      required: true,
    },
    endTime: {
      type: Date,
      require: true,
    },
    status: {
      type: String,
      enum: ["Booked", "RequestingCancel", "Cancelled", "Played", "Pending"],
      default: "Pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionStatus: {
      type: String,
      enum:["Pending","Failed","Success"]
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = model("Booking", BookingSchema);
