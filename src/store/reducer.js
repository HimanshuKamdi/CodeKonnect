import { SET_USER, SET_USERS,SET_CHANNEL, SET_FAVOURITECHANNEL, REMOVE_FAVOURITECHANNEL, UPDATE_CHANNEL_MEMBERS, UPDATE_CHANNEL_ADMINS } from './actiontypes';
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
    channelMembers: [],
    showFiles: false,
    showCommits: false,
    admin: [],
}

const channelReducer = (state = defaultChannelState, action) => {
    if (action.type === SET_CHANNEL) {
        const payload = action.payload;
        const { currentChannel, channelDescription, channelMembers, showFiles, showCommits } = payload;
        return {
            ...state,
            currentChannel,
            channelDescription, 
            channelMembers, 
            showFiles, 
            showCommits,
            loading: false 
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
    else if (action.type === UPDATE_CHANNEL_ADMINS){
        const { channelId, updatedAdmins } = action.payload;
        if (state.currentChannel && state.currentChannel.id === channelId) {
            return {
                ...state,
                currentChannel: {
                    ...state.currentChannel,
                    admin: updatedAdmins
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
        return { favouriteChannel: updatedState };
    } else if (action.type === REMOVE_FAVOURITECHANNEL) {
        let payload = action.payload.favouriteChannel;
        let updatedState = { ...state.favouriteChannel };
        delete updatedState[payload.channelId];
        return { favouriteChannel: updatedState };
    }
    return state;
}

export const combinedReducers = combineReducers({ user: userReducer, users: allUsersReducer, channel: channelReducer ,favouriteChannel : favouriteChannelReducer  })