import bcrypt from 'bcrypt';
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        expires: '5m'
    }
    
},{ timestamps: true })

otpSchema.pre('save',function saveOtp(next){
    
    const SALT = bcrypt.genSaltSync(9);
    const hashedOtp = bcrypt.hashSync(this.otp,SALT);
    console.log(this.otp);
    console.log('Hashed Otp is ' , hashedOtp);
    this.otp = hashedOtp;
    next();
})

const OTP = mongoose.model('OTP',otpSchema);
export default OTP;