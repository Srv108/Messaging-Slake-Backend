import userRepository from '../repository/userRepository.js';
import ValidationError from '../utils/Errors/validationError.js';

export const SignUpService = async (data) => {
  try {
    const newUser = userRepository.create(data);
    return newUser;
  } catch (error) {
    console.log('User Service Error', error);
    if (error.name === 'ValidationError') {
      throw new ValidationError(
        {
          error: error.errors
        },
        error.message
      );
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      throw new ValidationError(
        {
          error: ['A user with same email or username already exists']
        },
        'A user with same email or username already exists'
      );
    }
  }
};
