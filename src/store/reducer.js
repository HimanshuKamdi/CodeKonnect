import { SET_USER, SET_USERS,SET_CHANNEL, SET_FAVOURITECHANNEL, REMOVE_FAVOURITECHANNEL, UPDATE_CHANNEL_MEMBERS } from './actiontypes';
import { combineReducers } from "redux";

let defaultUserState = {
    currentUser: null
}

const userReducer = (state = defaultUserState, action) => {
    if (action.type === SET_USER) {
        let payload = action.payload;
        state = { ...payload };
        return state;
    }
    return state;
}

let defaultUsersState = {
    allUsers: null
}

const allUsersReducer = (state = defaultUsersState, action) => {
    if (action.type === SET_USERS) {
        let payload = action.payload;
        state = { ...payload };
        return state;
    }
    return state;
}

let defaultChannelState = {
    currentChannel: null,
    loading : true,
    channelDescription: '',
    channelMembers: []
}


// const channelReducer = (state = defaultChannelState, action) => {
//     if (action.type === SET_CHANNEL) {
//         console.log('Handling SET_CHANNEL action with payload:', action.payload);
//         let payload = action.payload;
//         state = { ...state, currentChannel: payload.currentChannel };
//         return state;
//     }
//     return state;
// }

const channelReducer = (state = defaultChannelState, action) => {
    if (action.type === SET_CHANNEL) {
        // console.log('Handling SET_CHANNEL action with payload:', action.payload);
        const payload = action.payload;
        const { currentChannel, channelDescription, channelMembers } = payload;
        return {
            ...state,
            currentChannel,
            channelDescription, // Update channelDescription
            channelMembers, // Update channelMembers
            loading: false // Assuming loading should be set to false after channel is set
        };
    }else if (action.type === UPDATE_CHANNEL_MEMBERS) {
        const { channelId, updatedMembers } = action.payload;
        if (state.currentChannel && state.currentChannel.id === channelId) {
            return {
                ...state,
                currentChannel: {
                    ...state.currentChannel,
                    members: updatedMembers
                }
            };
        }
    }
    return state;
};

let defaultFavouriteChannelState = {
    favouriteChannel: {}
}


const favouriteChannelReducer = (state = defaultFavouriteChannelState, action) => {
    if (action.type === SET_FAVOURITECHANNEL) {
        let payload = action.payload.favouriteChannel;
        let updatedState = { ...state.favouriteChannel };
        updatedState[payload.channelId] = payload.channelName;
        console.log('Updated favorite channels:', updatedState);
        return { favouriteChannel: updatedState };
    } else if (action.type === REMOVE_FAVOURITECHANNEL) {
        let payload = action.payload.favouriteChannel;
        let updatedState = { ...state.favouriteChannel };
        delete updatedState[payload.channelId];
        console.log('Updated favorite channels:', updatedState);
        return { favouriteChannel: updatedState };
    }
    return state;
}

export const combinedReducers = combineReducers({ user: userReducer, users: allUsersReducer, channel: channelReducer ,favouriteChannel : favouriteChannelReducer  })