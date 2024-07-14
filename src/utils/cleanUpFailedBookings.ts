import { NextFunction, Request, Response } from "express";
import { Booking } from "../model/bookingSchema";

export const cleanUpFailedBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Booking.deleteMany({ paymentStatus: "Failed" });
    next();
  } catch (err) {
    next(err);
  }
};