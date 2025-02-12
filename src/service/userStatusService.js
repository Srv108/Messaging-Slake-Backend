import userStatusRepository from "../repository/userStatusRepository.js";


export const createUserStatusService = async(data) => {
    try {

        const newUserDoc = await userStatusRepository.create(data);
        return newUserDoc;

    } catch (error) {
        console.log('Error in creating user status',error);
        throw error;
    }
}

export const updateUserStatus = async(userId,data) => {
    try {

        const response = await userStatusRepository.update(userId,data);

        return response;
    } catch (error) {
        console.log('Error in updating user status',error);
        throw error;
    }
}