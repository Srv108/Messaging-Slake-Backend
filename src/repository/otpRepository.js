import OTP from "../schema/otp.js";
import crudRepository from "./crudRepository.js";

const otpRepository = {
    ...crudRepository(OTP),
    getOtpByEmail: async function(email){
        const otpDetails = OTP.findOne({email: email});
        return otpDetails;
    }
}

export default otpRepository;