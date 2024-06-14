import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";

export const sportController = () => {
  return {
    addSport: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sportName } = req.body;
        const sport = await Sport.create({ sportName });
        return res.json({
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
        const { sportId, sportName } = req.body;
    
        const sport = await Sport.findByIdAndUpdate(
          sportId,
          { sportName },
          { new: true }
        );
    
        if (!sport) {
          return res.status(404).json({
            status: false,
            message: "Sport not found",
          });
        }
    
        return res.json({
          status: true,
          data: sport,
          message: "Sport updated",
        });
      } catch (error) {
        next(error);
      }
    },    
  };
};