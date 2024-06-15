import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Court } from "../model/courtSchema";
import { Booking } from "../model/bookingSchema";
import Razorpay from "razorpay";
import { User } from "../model/userSchema";
import crypto from "crypto";
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
        const { sportId, courtId, date, time, userId, duration, amount } =
          req.body;

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
          data: order,
          message: "Order Created in Razorpay",
        });
      } catch (error) {
        next(error);
      }
    },

    validatePayment: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          req.body;
        const sha = crypto.createHmac("sha256", keySecret);
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = sha.digest("hex")
        if(digest !== razorpay_signature){
          return res.status(400).json({
            status:false,
            message:"Transaction is not legit!"
          })
        }
        const data = {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        }
        res.status(200).json({
          status: true,
          data,
          message: "Payment successful"
        })
      } catch (error) {}
    },

    userBookingList: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { id } = req.params;
        const bookings = await Booking.find({ userId: id });
        if (bookings) {
          res.json({
            success: true,
            data: bookings,
            message: "Bookings fetched successfuly",
          });
        } else {
          throw new Error("No bookings found for this user.");
        }
      } catch (error) {
        next(error);
      }
    },
  };
};
