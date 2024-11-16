import { StatusCodes } from "http-status-codes";
import { SignUpService } from "../service/userService.js";

export const signUp = async(req,res) => {
    try{
        const user = req.body;
        const response = await SignUpService(user);
        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: "User created successfully",
            data: response
        })

    }catch(error){
        console.log(error);
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Internal Server Error",
            data: error
        })
    }
}