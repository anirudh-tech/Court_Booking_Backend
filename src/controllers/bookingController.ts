import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Court } from "../model/courtSchema";
import { Booking } from "../model/bookingSchema";
import Razorpay from "razorpay";
import { User } from "../model/userSchema";
import crypto from "crypto";
import mongoose from "mongoose";
import { generateTimeSlots } from "../utils/generateTimeslot";
import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../config/envConfig/config";
import { format } from "date-fns";

const convertUTCToIST = (date: Date) => {
  const utcDate = new Date(date);
  utcDate.setHours(utcDate.getHours() + 5);
  utcDate.setMinutes(utcDate.getMinutes() + 30);
  return utcDate;
};
export const bookingController = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_SECRET;

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
          totalAmount,
        } = req.body;

        courtId = new mongoose.Types.ObjectId(courtId);
        sport = new mongoose.Types.ObjectId(sport);
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

        date = new Date(date);
        // date.setDate(date.getDate() + 1);
        // let paymentStatus;
        // if(paymentMethod === "Full Payment"){
        //   paymentStatus = "Paid";
        // }else{
        //   paymentStatus = "Advance Paid";
        // }

        if (user.role === "Admin") {
          const booking = await Booking.create({
            courtId,
            date,
            startTime,
            endTime,
            userId,
            duration,
            paymentStatus: "Booked By Admin",
            status: "Booked",
          });

          return res.json({
            status: true,
            booking,
            message: "Court Booked",
          });

        } else {
          const booking = await Booking.create({
            courtId,
            date,
            startTime,
            endTime,
            userId,
            duration,
            amountPaid: amount,
            paymentStatus: "Pending",
            paymentMethod,
            status: "Not-Booked",
            totalAmount,
          });

          const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `#${booking._id}`,
          };
          const order = await razorpay.orders.create(options);
          const bookingId = booking._id;
          if (!order) {
            throw new Error("Razorpay order err");
          }
          return res.json({
            status: true,
            order,
            bookingId,
            message: "Order created",
          });
        }

      } catch (error) {
        next(error);
      }
    },

    validatePayment: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        bookingId,
      } = req.body;
      const booking = await Booking.findById(bookingId);
      try {
        const sha = crypto.createHmac("sha256", keySecret);
        sha.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const digest = sha.digest("hex");
        if (digest !== razorpaySignature) {
          throw new Error("Transaction is not legit!");
        }
        if (booking) {
          if (booking?.paymentMethod == "Full Payment") {
            booking.paymentStatus = "Paid";
          } else {
            booking.paymentStatus = "Advance Paid";
          }
          booking.status = "Booked";
          booking.save();
        }
        // await Booking.updateOne(
        //   { _id: new mongoose.Types.ObjectId(bookingId) },
        //   { $set: { status: "Booked" } }
        // );
        const data: any = await Booking.findOne({ _id: bookingId }).populate("courtId").populate("userId");

        // NodeMailer code
        const transporter = nodemailer.createTransport({
          port: 465,
          service: "Gmail",
          auth: {
            user: EMAIL,
            pass: PASSWORD,
          },
          secure: true,
        });
        const bookingDetailsHtml = `
          <h2>New Booking Received</h2>
          <p>Dear Turf Owner,</p>
          <p>A new booking has been made. Here are the details:</p>
          <ul>
          <li><strong>Customer Detail:</strong> ${data?.userId?.phoneNumber}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.startTime} to ${data.endTime}</li>
          <li><strong>Court Number:</strong> ${data.courtId.courtName}</li>
          </ul>
          <p>Please ensure the court is ready for the customer at the specified time.</p>
          <p>Lal Sports Academy</p>
          `;

        const mailData = {
          from: "tickerpage@gmail.com",
          to: "Lalsportsacademy@gmail.com",
          // to: "anirudhjagath43@gmail.com",
          subject: "OTP FROM LALSPORTS BOOKING",
          html: bookingDetailsHtml,
        };

        const result = transporter.sendMail(mailData, (error, info) => {
          return new Promise((resolve, reject) => {
            if (error) {
              console.log("Error occurred while sending the", error);
              reject(false);
            } else {
              resolve(true);
            }
          });
        });

        res.status(200).json({
          status: true,
          data,
          message: "Payment successful",
        });
      } catch (error) {
        if (booking) {
          booking.paymentStatus = "Paid";
          booking.save();
        }
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
              paymentStatus: { $nin: ["Failed", "Pending"] }
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
        const bookedSlots = await Booking.find({
          courtId,
          date,
          paymentStatus: { $nin: ["Failed", "Pending"] }
        });

        if (bookedSlots.length === 0) { // Modify this condition to check for an empty array
          throw new Error("Cannot find booked slots on this date");
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
        const bookingStatusFilter = { paymentStatus: { $nin: ["Failed", "Pending"] } };

        if (search) {
          const [courts, users] = await Promise.all([
            Court.find({}),
            User.find({}),
          ]);

          const courtNamesRegex = courts.map((court) => court.courtName);
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
                from: "sports", // Use the collection name for the Sport model
                localField: "courtId.sportId",
                foreignField: "_id",
                as: "courtId.sportId",
              },
            },
            {
              $unwind: "$courtId.sportId",
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
              $match: {
                ...regexFilters,
                paymentStatus: { $ne: "Failed" }, // Add filter for booking status
              },
            },
          ]).sort({ createdAt: -1 })
        } else {
          bookings = await Booking.find(bookingStatusFilter)
            .populate({
              path: "courtId",
              populate: {
                path: "sportId",
              },
            })
            .populate("userId").sort({ createdAt: -1 })
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
      let mainArray: string[][] = [];
      try {
        const startDate = new Date(date);
        startDate.setUTCHours(18, 30, 0, 0);
        const endDate = new Date(date);
        endDate.setUTCDate(endDate.getUTCDate() + 1); // Move to the next day
        endDate.setUTCHours(18, 29, 59, 999);

        const dio = await Booking.aggregate([
          {
            $match: {
              courtId: new mongoose.Types.ObjectId(courtId),
              status: { $ne: "Cancelled" },
              paymentStatus: { $nin: ["Failed", "Pending"] },
              date: { $gte: new Date(startDate), $lt: new Date(endDate) },
            },
          },
          {
            $project: {
              courtId: 1,
              startTime: 1,
              duration: 1,
            },
          },
        ]);

        const allStartTimeSlots = dio.flatMap((booking: any) => {
          return generateTimeSlots(
            booking.startTime,
            booking.duration,
            mainArray
          ).slice(0, 1);
        });

        // Remove duplicates and sort the slots
        const uniqueSortedSlots = Array.from(new Set(allStartTimeSlots)).sort(
          (a, b) => {
            const dateA = new Date(`1970-01-01T${a}`);
            const dateB = new Date(`1970-01-01T${b}`);
            return dateA.getTime() - dateB.getTime();
          }
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
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              paymentStatus: { $nin: ["Failed", "Pending"] }
            },
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
      try {
        const result = await Booking.updateOne(
          { _id: bookingId },
          { $set: { paymentStatus } },
          { new: true }
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
        // startDate.setDate(startDate.getDate() + 1);
        const startDate = new Date(date);
        startDate.setUTCHours(18, 30, 0, 0);

        const endDate = new Date(date);
        endDate.setUTCDate(endDate.getUTCDate() + 1); // Move to the next day
        endDate.setUTCHours(18, 29, 59, 999);
        // endDate.setDate(endDate.getDate() + 1);

        const bookings = await Booking.find({
          date: {
            $gte: startDate,
            $lte: endDate,
          },
          status: { $ne: "Cancelled" },
          paymentStatus: { $nin: ["Failed", "Pending"] }
        })
          .populate({
            path: "courtId",
            populate: {
              path: "sportId",
            },
          })
          .populate("userId");
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

    deleteBooking: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        await Booking.deleteOne({ _id: id })
        res.status(200).json({
          status: true,
          message: "Booking Deleted Successfully"
        })
      } catch (error) {
        next(error)
      }
    }
  };
};
