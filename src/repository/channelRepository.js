import Channel from '../schema/channel.js';
import crudRepository from './crudRepository.js';

const channelRepository = {
    ...crudRepository(Channel),
    getChannelByName: async function (channelName) {
        const response = await Channel.findOne({ name: channelName });
        return response;
    },
    getChannelWithWorkspace: async function (channelId) {
        const response = await Channel.findById(channelId).populate('workspaceId');
        return response;
    }
};

export default channelRepository;
