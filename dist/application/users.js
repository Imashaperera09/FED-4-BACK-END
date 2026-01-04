import { User } from "../infrastructure/entities/User";
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    }
    catch (error) {
        next(error);
    }
};
