import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Court } from "../model/courtSchema";
import { Booking } from "../model/bookingSchema";
import Razorpay from "razorpay";
import { User } from "../model/userSchema";
export const bookingController = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay key ID or secret is not defined in environment variables"
    );
  }

  const razorpay: any = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  return {
    bookCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sportId, courtId, date, time, userId, duration, amount } = req.body;

       
        const sport = await Sport.findById(sportId);
        if (!sport) {
          return res.status(404).json({
            status: false,
            message: "Sport not found",
          });
        }

        const court = await Court.findById(courtId);
        if (!court) {
          return res.status(404).json({
            status: false,
            message: "Court not found",
          });
        }

        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            status: false,
            message: "User not found",
          });
        }

        const booking = await Booking.create({
          sportId,
          courtId,
          date,
          time,
          userId,
          duration,
          amount,
        });

        const options = {
          amount: amount,
          currency: "INR",
          receipt: booking._id,
        };
        const order = await razorpay.orders.create(options);


        return res.json({
          status: true,
          data: booking,
          message: "Booking added",
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
