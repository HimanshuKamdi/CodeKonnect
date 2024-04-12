import { SET_USER, SET_USERS, SET_CHANNEL ,SET_FAVOURITECHANNEL,REMOVE_FAVOURITECHANNEL, UPDATE_CHANNEL_MEMBERS} from './actiontypes';

export const setUser = (user) => {
    return {
        type: SET_USER,
        payload: {
            currentUser: user
        }
    }
}

export const setUsers = (users) => {
    return {
        type: SET_USERS,
        payload: {
            allUsers: users
        }
    }
}

export const setChannel = (channel) => {
    return {
        type: SET_CHANNEL,
        payload: {
            currentChannel: channel,
            channelDescription: channel?.description,
            channelMembers: channel?.members,
            showFiles: channel?.showFiles ?? false,
            showCommits: channel?.showCommits ?? false,            
        }
    }
}

export const setfavouriteChannel = (channel) => {
    return {
        type: SET_FAVOURITECHANNEL,
        payload: {
            favouriteChannel: channel
        }
    }
}

export const removefavouriteChannel = (channel) => {
    return {
        type: REMOVE_FAVOURITECHANNEL,
        payload: {
            favouriteChannel: channel
        }
    }
}

export const updateChannelMembers = (channelId, updatedMembers) => {
    return {
        type: UPDATE_CHANNEL_MEMBERS,
        payload: {
            channelId: channelId,
            updatedMembers: updatedMembers
        }
    }
}
