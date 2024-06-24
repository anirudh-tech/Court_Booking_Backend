import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Money } from "../model/moneySchema";
import { Court } from "../model/courtSchema";
import mongoose from "mongoose";
import { Booking } from "../model/bookingSchema";

export const courtController = () => {
  return {
    addCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body.sportId = new mongoose.Types.ObjectId(req.body.sportId);
        
        const court = new Court(req.body);
        await court.save();
        const courts = await Court.aggregate([
          {
            $match: {
              _id: court._id,
            },
          },
          {
            $lookup: {
              from: "sports",
              localField: "sportId",
              foreignField: "_id",
              as: "sportdetail",
            },
          },
          {
            $unwind: "$sportdetail",
          },
          {
            $set: {
              sportId: {
                $concat: [
                  "$sportdetail.sportName",
                  "[(*)]",
                  "$sportdetail.image",
                ],
              },
            },
          },
          {
            $addFields: {
              sport: "$sportdetail._id",
            },
          },
        ]);
        return res.json({
          status: true,
          data: courts[0],
          message: "Court added",
        });
      } catch (error) {
        next(error);
      }
    },

    editCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { courtId, data } = req.body;

        

        await Court.replaceOne(
          { _id: courtId }, // Filter
          data, // New document
          { upsert: true } // Options
        );
        const court = await Court.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(courtId),
            },
          },
          {
            $lookup: {
              from: "sports",
              localField: "sportId",
              foreignField: "_id",
              as: "sportdetail",
            },
          },
          {
            $unwind: "$sportdetail",
          },
          {
            $set: {
              sportId: {
                $concat: [
                  "$sportdetail.sportName",
                  "[(*)]",
                  "$sportdetail.image",
                ],
              },
            },
          },
          {
            $addFields: {
              sport: "$sportdetail._id",
            },
          },
        ]);

        return res.status(200).json({
          status: true,
          message: "Successfull",
          court: court[0],
          courtId,
        });
      } catch (error) {
        next(error);
      }
    },
    listAllcourts: async (req: Request, res: Response, next: NextFunction) => {
      try {
        // const courts = await Court.find();

        const courts = await Court.aggregate([
          {
            $lookup: {
              from: "sports",
              localField: "sportId",
              foreignField: "_id",
              as: "sportdetail",
            },
          },
          {
            $unwind: "$sportdetail",
          },
          {
            $set: {
              sportId: {
                $concat: [
                  "$sportdetail.sportName",
                  "[(*)]",
                  "$sportdetail.image",
                ],
              },
            },
          },
          {
            $addFields: {
              sport: "$sportdetail._id",
            },
          },
        ]);
  
        return res
          .status(200)
          .json({ status: true, data: courts, message: "success" });
      } catch (error) {
       
        next(error);
      }
    },
    deleteCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { courtId } = req.params;
        await Court.deleteOne({ _id: courtId });
        return res
          .status(200)
          .json({ status: true, message: "Success", courtId });
      } catch (error) {
        next(error);
      }
    },
    getCourtsWithSportId: async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { sportId } = req.body;
        const courts = await Court.find({ sportId: sportId });
        return res
          .status(200)
          .json({ status: true, courts, message: "Success" });
      } catch (err) {
        next(err);
      }
    },
    getCourtPrice: async () => {

    },
  };
};
