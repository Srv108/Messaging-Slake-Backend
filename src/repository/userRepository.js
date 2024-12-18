import User from '../schema/user.js';
import crudRepository from './crudRepository.js';

const userRepository = {
    ...crudRepository(User),
    getUserDetails: async function (id) {
        const user = User.findById(id).select('-password');
        return user;
    },
    getByUsername: async function (name) {
        const user = User.findOne({ username: name }).select('-password'); // exclude password
        return user;
    },
    getByEmail: async function (email) {
        const user = await User.findOne({ email });
        return user;
    },
    getUserByUsername: async function (name) {
        const user = User.findOne({ username: name });
        return user;
    },
    getUserByEmailAndUsername: async function(userDetails){
        const user = User.find(userDetails).select('-password');
        return user;
    },
    findByEmailAndUpdate: async function(updateObject){
        const user = User.findOneAndUpdate(
            {email: updateObject.email},
            {password: updateObject.password},
            {new: true})
            .select('-password');
        return user;
    }
        
};

export default userRepository;
