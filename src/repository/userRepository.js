import User from '../schema/user.js';
import crudRepository from './crudRepository.js';

const userRepository = {
  ...crudRepository(User),
  getByUsername: async function (name) {
    const user = User.findOne({ userName: name }).select('-password'); // exclude password
    return user;
  },
  getByEmail: async function (email) {
    const user = await User.findOne({ email });
    return user;
  }
};

export default userRepository;
