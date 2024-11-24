import Channel from '../schema/channel.js';
import crudRepository from './crudRepository.js';

const channelRepository = {
    ...crudRepository(Channel),
    getChannelByName: async function (channelName) {
        const response = Channel.findOne({ name: channelName });
        return response;
    }
};

export default channelRepository;
