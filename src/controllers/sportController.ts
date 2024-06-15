import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";

export const sportController = () => {
  return {
    addSport: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sportName, image } = req.body;
        let sport;
        sport = await Sport.findOne({ sportName });
        if (sport) {
          return res.status(400).json({ message: "Sport already exists" });
        }
        sport = await Sport.create({ sportName, image });
        return res.status(201).json({
          status: true,
          data: sport,
          message: "Sport added",
        });
      } catch (error) {
        next(error);
      }
    },

    editSport: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sportId, data } = req.body;

        const sport = await Sport.findByIdAndUpdate(sportId, data, {
          new: true,
        });

        if (!sport) {
          return res.status(404).json({
            status: false,
            message: "Sport not found",
          });
        }

        return res.status(200).json({
          status: true,
          data: sport,
          id: sportId,
          message: "Sport updated",
        });
      } catch (error) {
        next(error);
      }
    },
    listSports: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sports = await Sport.find();
        res.status(200).json({
          status: true,
          data: sports,
          message: "Sports fetched",
        });
      } catch (error) {
        next(error);
      }
    },
    deleteSport: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sportId } = req.params;
        await Sport.deleteOne({ _id: sportId });
        return res.status(200).json({
          status: true,
          id: sportId,
          message: "Successfully deleted",
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
