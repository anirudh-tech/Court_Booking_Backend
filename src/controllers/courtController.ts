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
        // const { sportId, courtName, weekDays, weekEnds, extra } = req.body;
        // const cost = await Money.create({
        //   weekDays,
        //   weekEnds,
        //   extra,
        // });

        // const court = await Court.create({
        //   courtName,
        //   cost: cost._id,
        // });

        // const sport = await Sport.findByIdAndUpdate(
        //   sportId,
        //   {
        //     $push: {
        //       court: court._id,
        //     },
        //   },
        //   { new: true }
        // );
        req.body.sportId = new mongoose.Types.ObjectId(req.body.sportId);
        console.log(req.body, "--)");
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
        await Court.updateOne({ _id: courtId }, { $set: data });
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
        ]);

        return res
          .status(200)
          .json({ status: true, message: "Successfull", court });
      } catch (error) {
        next(error);
      }
    },
    listAllcourts: async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log("API cl");

        // const courts = await Court.find();

        console.log("🚀 ~ listAllcourts: ~ courts:", Sport.collection.name);
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
        ]);
        console.log("🚀 ~ listAllcourts: ~ testCourt:", courts);
        return res
          .status(200)
          .json({ status: true, data: courts, message: "success" });
      } catch (error) {
        console.log("🚀 ~ listAllcourts: ~ error:", error);
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
    
  };
};
