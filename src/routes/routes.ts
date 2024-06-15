import { Router } from "express";
import { loginController } from "../controllers/loginController";
import { verifyAdminToken } from "../utils/jwt/adminVerify/verifyAdminToken";
import { sportController } from "../controllers/sportController";
import { courtController } from "../controllers/courtController";
import { bookingController } from "../controllers/bookingController";
import { userController } from "../controllers/userController";

export const routes = () => {
  const { adminLogin, userLogin, logout } = loginController();
  const { addSport, editSport, listSports,deleteSport } = sportController();
  const { addCourt, editCourt } = courtController();
  const { bookCourt, userBookingList,validatePayment } = bookingController();
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
  router.route("/delete-sport/:sportId").delete(deleteSport)

  //court routes
  router.route("/add-court").post(addCourt);
  router.route("/edit-court").patch(editCourt);

  //booking routes
  router.route("/book-court").post(bookCourt);
  router.route("/validate-payment").post(validatePayment);
  router.route("/user-bookings-list/:id").get(userBookingList);

  return router;
};
