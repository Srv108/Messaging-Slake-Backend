// import { StatusCodes } from "http-status-codes";
// import mongoose from "mongoose"

// import ClientError from "../utils/Errors/clientError.js";


// export const roomCreateSchema = (req,res,next) => {
//         const isValidUserId = mongoose.Types.ObjectId.isValid(req.body.recieverId);
//         if(!isValidUserId){
//             throw new ClientError({
//                 message: 'Invalid Reciever id',
//                 explanation: ['Reciever id sent by you is invalid'],
//                 statusCodes: StatusCodes.NOT_FOUND
//             });
//         }

//         next();
// }