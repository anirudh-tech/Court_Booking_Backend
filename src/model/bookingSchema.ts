import { Schema, model } from "mongoose";
import { UserEntity } from "../entity/userEntity";

const BookingSchema = new Schema(
  {
    courtId: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
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
      type: String,
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
    paymentStatus: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum:["Online","Offline"]
    }
  },
  {
    timestamps: true,
  }
);

export const Booking = model("Booking", BookingSchema);
