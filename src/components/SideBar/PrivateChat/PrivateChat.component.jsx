import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import firebase from "../../../firebase";
import { setChannel } from "../../../store/actioncreator"
import { Notification } from "../Notification/Notification.component";

import { Menu, Icon } from 'semantic-ui-react';

const PrivateChat = (props) => {
    // console.log("PrivateChat", props);

    const [usersState, setUsersState] = useState([]);

    const [connectedUsersState, setConnectedUsersState] = useState([]);
    const [channelsVisitedState, setChannelsVisitedState] = useState({});

    const usersRef = firebase.database().ref("users");

    const statusRef = firebase.database().ref("status");
    
    const connectedRef = firebase.database().ref(".info/connected");

    useEffect(() => {
        usersRef.on('child_added', (snap) => {
            setUsersState((currentState) => {
                const userId = snap.key;
                const isUserPresent = currentState.some(user => user.id === userId);
                if (!isUserPresent) {
                    return [
                        ...currentState,
                        {
                            ...snap.val(),
                            name: snap.val().displayName,
                            id: userId,
                            isPrivateChat: true
                        }
                    ];
                }
                return currentState;
            });
        });  
        
        usersRef.on('child_removed', (snap) => {
            setUsersState((currentState) => {
                const userId = snap.key;
                return currentState.filter(user => user.id !== userId);
            });
        });

        connectedRef.on("value", snap => {
            if (props.user && snap.val()) {
                const userStatusRef = statusRef.child(props.user.uid);
                userStatusRef.set(true);
                userStatusRef.onDisconnect().remove();
            }
        })

        return () => { usersRef.off(); connectedRef.off(); }
    }, [props.user])

    useEffect(() => {

        statusRef.on("child_added", snap => {
            setConnectedUsersState((currentState) => {
                let updatedState = [...currentState];
                updatedState.push(snap.key);
                return updatedState;
            })
        });

        statusRef.on("child_removed", snap => {
            setConnectedUsersState((currentState) => {
                let updatedState = [...currentState];

                let index = updatedState.indexOf(snap.key);
                updatedState.splice(index, 1);
                return updatedState;
            })
        });

        return () => statusRef.off();
    }, [usersState]);
    

    const displayUsers = () => {
        if (usersState.length > 0 && props.user !== null) {
            return usersState.filter((user) => user.id !== props.user.uid).map((user) => {
                return <Menu.Item
                    key={user.id}
                    name={user.name}
                    onClick={() => selectUser(user)}
                    active={props.channel && generateChannelId(user.id) === props.channel.id}
                >
                    <Icon name="circle" color={`${connectedUsersState.indexOf(user.id) !== -1 ? "green" : "red"}`} />

                    <Notification user={props.user} channel={props.channel}
                        notificationChannelId={generateChannelId(user.id)}
                        displayName={"@ " + user.name} />
                        
                </Menu.Item>
            })
        }
    }

   
    const selectUser = (user) => {
        // console.log(user);
        let userTemp = { ...user };
        // console.log("Temp",userTemp);
        userTemp.id = generateChannelId(user.id);
        if (props.channel !==null){
            setLastVisited(props.user, props.channel);
        }
        setLastVisited(props.user, userTemp);
        props.selectChannel(userTemp);
    }

    const setLastVisited = (user, channel) => {
        const lastVisited = usersRef.child(user.uid).child("lastVisited").child(channel.id);
        lastVisited.set(firebase.database.ServerValue.TIMESTAMP);
        lastVisited.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    }

    const generateChannelId = (userId) => {
        if (props.user.uid < userId) {
            return props.user.uid + userId;
        }
        else {
            return userId + props.user.uid;
        }
    }

    return <Menu.Menu style={{ marginTop: '35px' }}>
        <Menu.Item style={{ fontSize: '17px' }}>
            <span>
                <Icon name="mail" /> Chat
            </span>
            ({usersState.length - 1})
        </Menu.Item>
        {displayUsers()}
    </Menu.Menu>
}

const mapStateToProps = (state) => {
    return {
        user: state.user.currentUser,
        channel: state.channel.currentChannel,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        selectChannel: (channel) => dispatch(setChannel(channel))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PrivateChat);