import WorksSpace from '../schema/workspace.js';
import crudRepository from './crudRepository.js';

const userRepository = {
    ...crudRepository(WorksSpace),
    getWorkspaceByName: async function(){
        
    },
    getWorkspaceByJoinCode: async function(){

    },
    addMemberToWorkspace: async function(){

    },
    addChannelToWorkspace: async function(){

    },
    fetchAllWorkspceByMemberId: async function(){

    }
};

export default userRepository;
