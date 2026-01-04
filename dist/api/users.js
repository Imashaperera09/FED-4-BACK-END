import express from "express";
import { getAllUsers } from "../application/users";
const usersRouter = express.Router();
usersRouter.route("/").get(getAllUsers);
export default usersRouter;
