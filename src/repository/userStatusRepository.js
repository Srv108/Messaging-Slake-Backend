import UserStatus from "../schema/userStatus";
import crudRepository from "./crudRepository";

const userStatusRepository = {
    ...crudRepository(UserStatus),
    findByUserId: async function(userId){
        const doc = await UserStatus.findOne({userId: userId});
        return doc;
    },
    findAndUpdateByUserId: async function(userId,data){
        const doc = await UserStatus.findByIdAndUpdate(userId,data,{
            upsert: true,
            new: true
        });

        return doc;
    }
}

export default userStatusRepository;