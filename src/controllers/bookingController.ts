import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Court } from "../model/courtSchema";
import { Booking } from "../model/bookingSchema";
import Razorpay from "razorpay";
import { User } from "../model/userSchema";
import crypto from "crypto";
import mongoose from "mongoose";
import { generateTimeSlots, mainArray } from "../utils/generateTimeslot";
import { format } from "date-fns";
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
        console.log("Calling 1");
        let {
          courtId,
          date,
          startTime,
          endTime,
          duration,
          amount,
          paymentMethod,
          userId,
          sport,
        } = req.body;

        courtId = new mongoose.Types.ObjectId(courtId);
        sport = new mongoose.Types.ObjectId(sport);
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

        console.log("calling3");

        date = new Date(date);
        date.setDate(date.getDate() + 1);

        if (paymentMethod === "Online") {
          console.log("calling4");
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
            status: "Booked",
          });

          const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `#${booking._id}`,
          };
          const order = await razorpay.orders.create(options);
          const bookingId = booking._id;
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
            status: "Booked",
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
        const {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          bookingId,
        } = req.body;
        const sha = crypto.createHmac("sha256", keySecret);
        sha.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const digest = sha.digest("hex");
        if (digest !== razorpaySignature) {
          throw new Error("Transaction is not legit!");
        }
        await Booking.updateOne(
          { _id: new mongoose.Types.ObjectId(bookingId) },
          { $set: { status: "Booked" } }
        );

        // Second update: Set the paymentStatus to "Success"
        await Booking.updateOne(
          { _id: new mongoose.Types.ObjectId(bookingId) },
          { $set: { paymentStatus: "Success" } }
        );
        const data = await Booking.findOne({ _id: bookingId });
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
        // const bookings = await Booking.find({ userId: id })
        //   .populate("courtId")
        //   .populate("courtId.sportId");

        const bookings = await Booking.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(id),
            },
          },
          {
            $lookup: {
              from: Court.collection.name,
              localField: "courtId",
              foreignField: "_id",
              as: "courtId",
            },
          },
          {
            $unwind: "$courtId",
          },
          {
            $lookup: {
              from: Sport.collection.name,
              localField: "courtId.sportId",
              foreignField: "_id",
              as: "sportDetails",
            },
          },
          {
            $unwind: "$sportDetails",
          },
        ]);
        console.log("🚀 ~ bookingController ~ bookings:", bookings);
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

    listAllBookings: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { search } = req.query;
        let bookings;
        if (search) {
          const [courts, users] = await Promise.all([
            Court.find({}),
            User.find({}),
          ]);
          const courtNamesRegex = courts.map((court) => court.courtName);
          console.log(
            "🚀 ~ file: bookingController.ts:238 ~ bookingController ~ courtNamesRegex:",
            courtNamesRegex
          );
          const phoneNumbersRegex = users.map((user) => user.phoneNumber);

          const regexFilters = {
            $or: [
              {
                "courtId.courtName": {
                  $regex: search,
                  $options: "i",
                },
              },
              {
                "userId.phoneNumber": {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          };
          bookings = await Booking.aggregate([
            {
              $lookup: {
                from: Court.collection.name,
                localField: "courtId",
                foreignField: "_id",
                as: "courtId",
              },
            },
            {
              $unwind: "$courtId",
            },
            {
              $lookup: {
                from: User.collection.name,
                localField: "userId",
                foreignField: "_id",
                as: "userId",
              },
            },
            {
              $unwind: "$userId",
            },
            {
              $match: regexFilters,
            },
          ]);
        } else {
          bookings = await Booking.find()
            .populate("courtId")
            .populate("userId");
        }

        if (!bookings) {
          throw new Error("No bookings found");
        } else {
          res.status(200).json({
            success: true,
            data: bookings,
            message: "All bookings fetched successfully",
          });
        }
      } catch (error) {
        next(error);
      }
    },
    bookedSlots: async (req: Request, res: Response, next: NextFunction) => {
      const { courtId, date } = req.body;
      try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0); // Start of the day
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999); // End of the day

        const dio = await Booking.aggregate([
          {
            $match: {
              courtId: new mongoose.Types.ObjectId(courtId),
              status: { $ne: "Cancelled" },
            },
          },
          {
            $project: {
              courtId: 1,
              startTime: 1,
              duration: 1,
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
          },
          {
            $match: {
              year: new Date(date).getFullYear(),
              month: new Date(date).getMonth() + 1,
              day: new Date(date).getDate() + 1,
            },
          },
        ]);

        console.log("🚀 ~ bookedSlots: ~ dio:", dio);
        // Collect all time slots into a single array
        const allStartTimeSlots = dio.flatMap((booking) => {
          return generateTimeSlots(booking.startTime, booking.duration).slice(
            0,
            1
          ); // Only take the start time
        });

        // Remove duplicates and sort the slots
        const uniqueSortedSlots = Array.from(new Set(allStartTimeSlots)).sort(
          (a, b) => {
            const dateA = new Date(`1970-01-01T${a}`);
            const dateB = new Date(`1970-01-01T${b}`);
            return dateA.getTime() - dateB.getTime();
          }
        );
        console.log(
          "🚀 ~ bookedSlots: ~ uniqueSortedSlots:",
          mainArray.flat(Infinity)
        );

        return res.status(200).json({
          success: true,
          data: mainArray.flat(Infinity),
          message: "Booked Slots fetched successfully",
        });
      } catch (error) {
        next(error);
      }
    },

    getBookingsByUser: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { userId } = req.params;
        const booking = await Booking.aggregate([
          {
            $match: { userId: new mongoose.Types.ObjectId(userId) },
          },
          {
            $lookup: {
              from: Court.collection.name,
              localField: "courtId",
              foreignField: "_id",
              as: "courtDetail",
            },
          },
          {
            $unwind: "$courtDetail",
          },
          {
            $lookup: {
              from: Sport.collection.name,
              localField: "courtDetail.sportId",
              foreignField: "_id",
              as: "sportDetail",
            },
          },
          {
            $unwind: "$sportDetail",
          },
          {
            $set: {
              courtId: {
                $concat: [
                  "$courtDetail.courtName",
                  "[(*)]",
                  "$sportDetail.sportName",
                ],
              },
            },
          },
        ]);
        return res
          .status(200)
          .json({ status: true, message: "Success", booking });
      } catch (error) {
        next(error);
      }
    },

    updatePaymentMethod: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const { bookingId, value: paymentStatus } = req.body;
      console.log(
        "🚀 ~ file: bookingController.ts:353 ~ updatePaymentMethod: ~ req.body:",
        req.body
      );
      try {
        const result = await Booking.updateOne(
          { _id: bookingId },
          { $set: { paymentStatus } },
          { new: true }
        );
        console.log(
          "🚀 ~ file: bookingController.ts:360 ~ updatePaymentMethod: ~ result:",
          result
        );

        const data = await Booking.find()
          .populate("courtId")
          .populate("userId");
        return res.status(200).json({
          success: true,
          data,
          message: "Payment method updated successfully",
        });
      } catch (error) {
        next(error);
      }
    },

    bookingsByDate: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { date } = req.body;
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setUTCHours(0, 0, 0, 0);
        console.log(
          "🚀 ~ file: bookingController.ts:390 ~ bookingsByDate: ~ startDate:",
          startDate
        );
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setUTCHours(23, 59, 59, 999);
        console.log(
          "🚀 ~ file: bookingController.ts:482 ~ bookingsByDate: ~ endDate:",
          endDate
        );
        const bookings = await Booking.find({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
          status: { $ne: "Cancelled" },
        })
          .populate("courtId")
          .populate("userId");
        console.log(
          "🚀 ~ file: bookingController.ts:394 ~ bookingController ~ bookings:",
          bookings
        );
        if (!bookings) {
          throw new Error("Cannot find booked slots in this date");
        } else {
          res.status(200).json({
            status: true,
            data: bookings,
            message: "Booked slots fetched successfully",
          });
        }
      } catch (error) {
        next(error);
      }
    },
  };
};
