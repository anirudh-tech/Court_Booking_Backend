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
      enum: ["Booked", "RequestingCancel", "Cancelled", "Played", "Pending","Not-Booked"],
      default: "Pending",
    },
    amountPaid: {
      type: Number,
    },
    paymentStatus: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum:["Full Payment","Advance Payment"]
    },
    totalAmount: {
      type: Number
    }
  },
  {
    timestamps: true,
  }
);

export const Booking = model("Booking", BookingSchema);
