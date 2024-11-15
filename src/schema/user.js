import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: [true,"email is required"],
        unique: true,
        trim: true,
        maxlength: 100,
        uniqueCaseInsensitive: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 
            'Please fill a valid email address'
        ],

    },
    password:{
        type: String,
        required: [true,'password is required'],

    },
    userName: {
        type: String,
        unique: true,
        required: [true,'Username is required'],
        trim: true,
        lowercase: true,
        uniqueCaseInsensitive: true,
        match: [
            /^[a-zA-Z0-9-_.]+$/,
            'Invalid Username'
        ]
    },
    avatar: {
        type: String,
    }
})

userSchema.pre('save',(next) => {
    const user = this;
    user.avatar = `https://api.multiavatar.com/${user.userName}`;
    next();
})
const User = mongoose.model('User',userSchema);


export default User;