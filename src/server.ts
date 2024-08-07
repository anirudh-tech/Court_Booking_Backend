import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { routes } from "./routes/routes";
import cors from "cors";
import { Court } from "./model/courtSchema";
import { Booking } from "./model/bookingSchema";
import { cleanUpFailedBookings } from "./utils/cleanUpFailedBookings";
import cron from "node-cron";
dotenv.config();

const app: Application = express();

const PORT: number = Number(process.env.PORT) || 3000;
const corsOptions = {
  origin: ["https://lal-sports-academy.vercel.app","http://localhost:5173","https://www.lalsportsacademy.com"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cleanUpFailedBookings);
app.use("/api", routes());

const checkAndDeletePendingBookings = async () => {
  try {
    const pendingBookings = await Booking.find({ paymentStatus: "Pending" });
    await Booking.deleteMany({ paymentStatus: "Pending" });
    console.log(`Deleted ${pendingBookings.length} pending bookings`);
  } catch (err) {
    console.error('Error deleting pending bookings:', err);
  }
};

// Schedule the task to run every minute
// cron.schedule('* * * * *', () => {
//   checkAndDeletePendingBookings();
// });

// Also run the task every 30 seconds using setInterval
// setInterval(checkAndDeletePendingBookings, 30000);


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {

  const errorResponse = {
    errors: [{ message: err?.message || "Something went wrong" }],
  };
  return res.status(500).json(errorResponse);
});

app.listen(PORT, async() => {
  // await Booking.deleteMany({})
  console.log(`Server is running on port  ${PORT}`);
  
});

export default app;
