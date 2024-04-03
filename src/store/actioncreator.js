import { SET_USER, SET_USERS, SET_CHANNEL ,SET_FAVOURITECHANNEL,REMOVE_FAVOURITECHANNEL} from './actiontypes';

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
    console.log('Dispatching SET_CHANNEL action with payload:', channel);
    return {
        type: SET_CHANNEL,
        payload: {
            currentChannel: channel,
            channelDescription: channel.description,
            channelMembers: channel.members
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
