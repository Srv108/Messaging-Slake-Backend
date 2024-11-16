import userRepository from "../repository/userRepository.js";

export const SignUpService = async (data) => {
    try{
        const newUser = userRepository.create(data);
        return newUser;
    }catch(error){
        console.log("Internal Server Error");
        throw error;
    }
}