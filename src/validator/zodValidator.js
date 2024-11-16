import { StatusCodes } from "http-status-codes";

import { customErrorResponse } from "../utils/common/responseObject.js";

export const validate = (schema) => {
    return async (req,res,next) => {
        try{
            await schema.parseAsync(req.body);
            next();
        }catch(error){
            console.log('error from zod validator: ',error);
            let explanation = [];
            let errorMessage = '';
            error.errors.forEach((key) => {
                explanation.push(key.path[0] + ' ' + key.message);
                errorMessage += ' : ' + key.message;
            })
            res.status(StatusCodes.BAD_REQUEST).json(
                customErrorResponse({
                    message: 'Validation error' + errorMessage,
                    explanation: explanation
                })
            )
        }
    }
}