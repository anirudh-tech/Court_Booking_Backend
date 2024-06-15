import { NextFunction, Request, Response } from "express";
import { Sport } from "../model/sportSchema";
import { Money } from "../model/moneySchema";
import { Court } from "../model/courtSchema";

export const courtController = () => {
  return {
    addCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sportId, courtName, weekDays, weekEnds, extra } = req.body;
        const cost = await Money.create({
          weekDays,
          weekEnds,
          extra,
        });

        const court = await Court.create({
          courtName,
          cost: cost._id,
        });

        const sport = await Sport.findByIdAndUpdate(
          sportId,
          {
            $push: {
              court: court._id,
            },
          },
          { new: true }
        );
        return res.json({
          status: true,
          data: court,
          message: "Court added",
        });
      } catch (error) {
        next(error);
      }
    },

    editCourt: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { courtId, courtName, weekDays, weekEnds, extra } = req.body;

        const court = await Court.findById(courtId);

        if (!court) {
          return res.status(404).json({
            status: false,
            message: "Court not found",
          });
        }
        
        if (courtName) {
          court.courtName = courtName;
        }

        if (weekDays || weekEnds || extra) {
          const cost = await Money.findById(court.cost);

          if (!cost) {
            return res.status(404).json({
              status: false,
              message: "Cost details not found",
            });
          }

          if (extra) cost.extra = extra;

          await cost.save();
        }

        await court.save();

        return res.json({
          status: true,
          data: court,
          message: "Court updated",
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
