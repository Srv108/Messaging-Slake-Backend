import DirectMessage from "../schema/directMessage.js";
import crudRepository from "./crudRepository.js";

const directMessageRepository = {
    ...crudRepository,
    getDMsByAdminId: async function(adminId){
        const response = await DirectMessage.findOne({ adminId: adminId}).populate(
            'participants.memberId',' email username avatar name'
        ).populate('participants.workspace', '_id');

        return response;
    }
}

export default directMessageRepository;