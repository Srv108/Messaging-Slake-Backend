import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'email is required'],
            unique: true,
            trim: true,
            maxlength: 100,
            match: [
                // eslint-disable-next-line no-useless-escape
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please fill a valid email address'
            ]
        },
        password: {
            type: String,
            required: [true, 'password is required']
        },
        name: {
            type: String,
            // required: [true, 'Name is required'], 
        },
        username: {
            type: String,
            unique: true,
            required: [true, 'Username is required'],
            trim: true,
            match: [/^[a-zA-Z0-9-_.]+$/, 'Invalid Username']
        },
        about: {
            type: String,
        },
        avatar: {
            type: String
        },
        awsKey: {
            type: String,
        }
    },
    { timestamps: true }
);

userSchema.pre('save', function saveUser(next) {
    const user = this;

    const SALT = bcrypt.genSaltSync(9);
    const hashedPassword = bcrypt.hashSync(user.password, SALT);
    user.password = hashedPassword;
    user.avatar = `https://api.multiavatar.com/${user.username}`;
    next();
});

userSchema.pre('findOneAndUpdate',function updatePassword(next){
    const user = this.getUpdate();
    if(user.password && !user.skipPasswordHashing){
        const SALT = bcrypt.genSaltSync(9);
        const hashedPassword = bcrypt.hashSync(user?.password, SALT);
        user.password = hashedPassword;
    }
    next();
})
userSchema.index({ username: 1 }, { unique: true }); // Enforce unique constraint explicitly
const User = mongoose.model('User', userSchema);

export default User;
