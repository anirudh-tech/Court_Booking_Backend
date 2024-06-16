import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Court } from "../model/courtSchema";
import { Booking } from "../model/bookingSchema";
import Razorpay from "razorpay";
import { User } from "../model/userSchema";
import crypto from "crypto";
export const bookingController = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  console.log(
    "🚀 ~ file: bookingController.ts:10 ~ bookingController ~ keyId:",
    keyId
  );
  const keySecret = process.env.RAZORPAY_SECRET;
  console.log(
    "🚀 ~ file: bookingController.ts:12 ~ bookingController ~ keySecret:",
    keySecret
  );

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay key ID or secret is not defined in environment variables"
    );
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  return {
    bookCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log("Calling ");
        const {
          courtId,
          date,
          startTime,
          endTime,
          duration,
          amount,
          paymentMethod,
          userId,
        } = req.body;
        console.log("Calling ", req.body);

        // const sport = await Sport.findById(sportId);
        // if (!sport) {
        //   return res.status(404).json({
        //     status: false,
        //     message: "Sport not found",
        //   });
        // }

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

        if (paymentMethod === "Online") {
          const booking = await Booking.create({
            courtId,
            date,
            startTime,
            endTime,
            userId,
            duration,
            amount,
            paymentStatus: "Pending",
            paymentMethod,
            status:"Booked"
          });
  
          const options = {
            amount: req.body.amount,
            currency: "INR",
            receipt: `#${booking._id} ${userId} ${courtId}`,
          };
          const order = await razorpay.orders.create(options);
          const bookingId = booking._id
          console.log("🚀 ~ bookCourt: ~ order:", order);
          if (!order) {
            throw new Error("Razorpay order err");
          }
          return res.json({
            status: true,
            order,
            bookingId,
            message: "Order created",
          });
        } else {
          const booking = await Booking.create({
            courtId,
            date,
            startTime,
            endTime,
            userId,
            duration,
            amount,
            paymentStatus: "Pending",
            paymentMethod,
          });
          return res.json({
            status: true,
            data: booking,
            message: "Booking added",
          });
        }
      } catch (error) {
        console.log("🚀 ~ bookCourt: ~ error:", error);
        next(error);
      }
    },

    validatePayment: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        console.log(
          "🚀 ~ file: bookingController.ts:114 ~ bookingController ~ req.body:",
          req.body
        );
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } =
          req.body.data;
        const sha = crypto.createHmac("sha256", keySecret);
        sha.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const digest = sha.digest("hex");
        if (digest !== razorpaySignature) {
          return res.status(400).json({
            status: false,
            message: "Transaction is not legit!",
          });
        }
        const data = await Booking.findByIdAndUpdate(bookingId,{status:"Booked",paymentStatus:"Success"},{new: true})
        res.status(200).json({
          status: true,
          data,
          message: "Payment successful",
        });
      } catch (error) {
        next(error);
      }
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

    listBookingsByDate: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { date, courtId } = req.body;
        const bookedSlots = await Booking.find({ courtId, date });
        if (!bookedSlots) {
          throw new Error("Cannot find booked slots in this date");
        } else {
          res.status(200).json({
            status: true,
            data: bookedSlots,
            message: "Booked slots fetched successfully",
          });
        }
      } catch (error) {
        next(error);
      }
    },
  };
};
