import { Router } from "express";
import { loginController } from "../controllers/loginController";
import { verifyAdminToken } from "../utils/jwt/adminVerify/verifyAdminToken";
import { sportController } from "../controllers/sportController";
import { courtController } from "../controllers/courtController";
import { bookingController } from "../controllers/bookingController";
import { userController } from "../controllers/userController";

export const routes = () => {
  const { adminLogin, userLogin, logout } = loginController();
  const { addSport, editSport, listSports, deleteSport } = sportController();
  const {
    addCourt,
    editCourt,
    listAllcourts,
    deleteCourt,
    getCourtsWithSportId,
  } = courtController();
  const {
    bookCourt,
    userBookingList,
    validatePayment,
    listBookingsByDate,
    listAllBookings,
    bookedSlots,
    updatePaymentMethod,
  } = bookingController();
  const { fetchData } = userController();
  const router = Router();

  //admin routes
  // router.route("/add-admin").post(addAdmin)
  router.route("/admin-login").post(adminLogin);
  router.route("/user-login").post(userLogin);
  router.route("/logout").get(logout);

  //user routes
  router.route("/fetch-user").get(fetchData);

  //sport routes
  router.route("/add-sport").post(addSport);
  router.route("/edit-sport").patch(editSport);
  router.route("/list-sports").get(listSports);
  router.route("/delete-sport/:sportId").delete(deleteSport);

  //court routes
  router.route("/add-court").post(addCourt);
  router.route("/edit-court").patch(editCourt);
  router.route("/list-court").get(listAllcourts);
  router.delete("/delete-court/:courtId", deleteCourt);

  //booking routes
  router.route("/book-court").post(bookCourt);
  router.route("/validate-payment").post(validatePayment);
  router.route("/user-bookings-list/:id").get(userBookingList);
  router.post("/getcourt-withsport", getCourtsWithSportId);
  router.route("/list-bookings").get(listAllBookings);
  router.route("/bookings-list-by-date").post(listBookingsByDate);
  router.route("/booked-slots").post(bookedSlots);
  router.route("/update-payment-status").post(updatePaymentMethod);

  return router;
};
