import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import firebase from "../../../firebase";
import { Notification } from "../Notification/Notification.component";
import { setChannel, setfavouriteChannel, removefavouriteChannel } from "../../../store/actioncreator";
import './Channels.css';
import { Menu, Icon, Modal, Button, Form, Segment } from 'semantic-ui-react';

const Channels = (props) => {
    const [modalOpenState, setModalOpenState] = useState(false);
    const [channelAddState, setChannelAddState] = useState({ name: '', description: '', repo_name: '', members: [], admin: []});
    const [isLoadingState, setLoadingState] = useState(false);
    const [channelsState, setChannelsState] = useState([]);
    const [createNewRepo, setCreateNewRepo] = useState(false);
    const [suggestInput, setSuggestInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [validChannels, setValidChannels] = useState([]);
    const [allMembers, setAllMembers] = useState(false);

    console.log("channel props", props);

    const handleCheckboxChange = () => {
        setCreateNewRepo(!createNewRepo);
    }

    const channelsRef = firebase.database().ref("channels");
    const usersRef = firebase.database().ref("users");

    useEffect(() => {
        if (props.user && props.user.uid) {
            setChannelAddState({ name: '', description: '', repo_name: '', members: [props.user], admin: [props.user.uid]});
        }
    }, [props.user])

    useEffect(() => {
        if (props.user) {
            const filteredChannels = channelsState.filter(channel => {
                return !channel.members || channel.members.some(member => member.uid === props.user.uid);
            });
            setValidChannels(filteredChannels);
        }
    }, [channelsState, props.user]);

    const toggleFavoriteChannel = (channelId) => {
        // console.log("Inside toggle");
        const isFavourite = props.favouriteChannels[channelId];
        if (isFavourite) {
            props.removefavouriteChannel(channelId);
            // console.log("Favorite Channel:", props.favouriteChannels);
        } else {
            props.setfavouriteChannel(channelId);
            // console.log("Favorite Channel:", props.favouriteChannels);
        }
    };

    const moveChannelToTop = (channelId) => {
        const updatedChannels = channelsState.filter(channel => channel.id !== channelId);
        const selectedChannel = channelsState.find(channel => channel.id === channelId);
        updatedChannels.unshift(selectedChannel);
        setChannelsState(updatedChannels);
    };

    useEffect(() => {
        channelsRef.on('child_added', (snap) => {
            setChannelsState((currentState) => {
                let updatedState = [...currentState];
                updatedState.push(snap.val());
                return updatedState;
            })
        });

        return () => channelsRef.off();
    }, []);

    useEffect(() => {
        if (channelsState.length > 0) {
            props.selectChannel(channelsState[0])
        }
    }, [!props.channel ? channelsState : null])

    const openModal = () => {
        setModalOpenState(true);
    }

    const closeModal = () => {
        setModalOpenState(false);
    }

    const checkIfFormValid = () => {
        return channelAddState && channelAddState.name && channelAddState.description;
    }

    const handleChannelButtonClick = (channel) => {

        const fetchRepositoryContents = async (owner, repo) => {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
            if (response.ok) {
                const contents = await response.json();
                return contents;
            } else {
                throw new Error('Failed to fetch repository contents');
            }
        };

    let repo = "repo name from channel";
    let owner = "owner username from channel";

    fetchRepositoryContents(owner, repo)
            .then(contents => {
                // Display repository contents in your UI
                const contentsList = document.getElementById('contentsList');

                contents.forEach(content => {
                    const listItem = document.createElement('li');
                    listItem.textContent = content.name;
                    contentsList.appendChild(listItem);
                });
            })
            .catch(error => {
                // Handle error
                console.error(error);
            });
    };

    const displayChannels = () => {
        if (channelsState.length > 0) {
            const favoriteChannelsIds = Object.keys(props.favouriteChannels);
            const favoriteChannels = [];
            const nonFavoriteChannels = [];

            channelsState.forEach(channel => {
                if (favoriteChannelsIds.includes(channel.id)) {
                    favoriteChannels.push(channel);
                } else {
                    nonFavoriteChannels.push(channel);
                }
            });
            // console.log("favoriteChannels", favoriteChannels);
            // console.log("nonFavoriteChannels", nonFavoriteChannels);
    
            // Render favorite channels
            const favoriteChannelsElements = favoriteChannels.map(channel => {
                if (channel.members && props.user && channel.members.some(member => member.uid === props.user.uid)) {
                    return (
                        <Menu.Item
                            key={channel.id}
                            name={channel.name}
                            onClick={() => selectChannel(channel)}
                            active={props.channel && channel.id === props.channel.id && !props.channel.isFavourite}
                        >
                            <Notification
                                user={props.user}
                                channel={props.channel}
                                notificationChannelId={channel.id}
                                displayName={"# " + channel.name}
                            />
                            <span style={{ float: "right", fontSize: "1em", marginRight: '0.5em' }}>&#9733;</span>
                        </Menu.Item>
                    );
                }
            });
    
            // Render non-favorite channels
            const nonFavoriteChannelsElements = nonFavoriteChannels.map(channel => {
                if (channel.members && props.user && channel.members.some(member => member.uid === props.user.uid)) {
                    return (
                        <Menu.Item
                            key={channel.id}
                            name={channel.name}
                            onClick={() => selectChannel(channel)}
                            active={props.channel && channel.id === props.channel.id && !props.channel.isFavourite}
                        >
                            <Notification
                                user={props.user}
                                channel={props.channel}
                                notificationChannelId={channel.id}
                                displayName={"# " + channel.name}
                            />
                        </Menu.Item>
                    );
                }
            });
    
            // Concatenate favorite and non-favorite channels elements
            return [...favoriteChannelsElements, ...nonFavoriteChannelsElements];
        }
        return null; // Return null if no channels
    };

    const selectChannel = (channel) => {
        console.log(props);
        setLastVisited(props.user, props.channel);
        setLastVisited(props.user, channel);
        channel.showFiles = false;
        channel.showCommits = false;
        props.selectChannel(channel);
    }

    const setLastVisited = (user, channel) => {
        const lastVisited = usersRef.child(user.uid).child("lastVisited").child(channel.id);
        lastVisited.set(firebase.database.ServerValue.TIMESTAMP);
        lastVisited.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    }

    const createChannel = (key) => {
        const channel = {
            id: key,
            name: channelAddState.name,
            description: channelAddState.description,
            members: channelAddState.members,
            created_by: props.user.uid,
            repo_name: channelAddState.repo_name,
            admin: channelAddState.admin
        }
        return channel;
    }

    const adduser = async () => {
        var user = props.users.find(user => user.uid === props.user.uid);
        await setChannelAddState((currentState) => {
            let updatedState = { ...currentState };
            updatedState.members = updatedState.members.concat(user);
            return updatedState;
        })
    }

    const onSubmit = async () => {
        if (!checkIfFormValid()) {
            return;
        }

        const key = channelsRef.push().key;
        await adduser();
        const channel = await createChannel(key);
        setLoadingState(true);
        channelsRef.child(key)
            .update(channel)
            .then(() => {
                setChannelAddState({ name: '', description: '', repo_name: '', members: [props.user], admin: [props.user.uid]});
                setLoadingState(false);
                closeModal();
            })
            .catch((err) => {
                console.log(err);
            })
    }

    const handleInput = (e) => {
        let target = e.target;
        setChannelAddState((currentState) => {
            let updatedState = { ...currentState };
            updatedState[target.name] = target.value;
            return updatedState;
        })
    }

    const handleSuggestInput = (e) => {
        let target = e.target;
        setSuggestInput(target.value);
    };

    const handleSelectUser = (user) => {
        if (channelAddState.members.includes(user)) {
            setChannelAddState((currentState) => {
                const updatedMembers = currentState.members.filter(member => member.uid !== user.uid);
                return { ...currentState, members: updatedMembers };
            });
        }
        else if (!channelAddState.members.some(member => member === user)) {
            setChannelAddState((currentState) => {
                let updatedState = { ...currentState };
                updatedState.members = updatedState.members.concat(user);
                return updatedState;
            })
        }
    }

    const selectAllMembers = () => {
        setAllMembers(!allMembers);
        if (!allMembers) {
            setChannelAddState((currentState) => {
                let updatedState = { ...currentState };
                updatedState.members = props.users;
                return updatedState;
            })
        }
        else {
            setChannelAddState((currentState) => {
                let updatedState = { ...currentState };
                updatedState.members = [];
                return updatedState;
            })
        }
    }

    return <> <Menu.Menu style={{ marginTop: '35px' }}>
        <Menu.Item style={{ fontSize: '17px' }}>
            <span>
                <Icon name="exchange" /> Channels
            </span>
            ({validChannels.length})
        </Menu.Item>
        {displayChannels()}
        <Menu.Item>
            <span className="clickable" onClick={openModal} >
                <Icon name="add" /> ADD
            </span>
        </Menu.Item>
    </Menu.Menu>
        <Modal open={modalOpenState} onClose={closeModal}>
            <Modal.Header>
                Create Channel
            </Modal.Header>
            <Modal.Content>
                <Form onSubmit={onSubmit}>
                    <Segment stacked>
                        <Form.Input
                            name="name"
                            value={channelAddState.name}
                            onChange={handleInput}
                            type="text"
                            placeholder="Enter Channel Name"
                        />
                        <Form.Input
                            name="description"
                            value={channelAddState.description}
                            onChange={handleInput}
                            type="text"
                            placeholder="Enter Channel Description"
                        />
                        <Form.Input
                            name="members"
                            value={suggestInput}
                            onChange={handleSuggestInput}
                            type="text"
                            placeholder="Add Members"
                            autocomplete="off"
                        />
                        <label>Select all members &nbsp;</label>
                        <input
                            type="checkbox"
                            checked={allMembers}
                            onChange={selectAllMembers}
                        />
                        <br />  <br />

                        {suggestions.length > 0 ? (
                            <ul>
                                {suggestions.map(user => (
                                    user.uid !== props.user.uid && (
                                    <li
                                        key={user.uid}
                                        onClick={() => handleSelectUser(user)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            backgroundColor: channelAddState.members.includes(user) ? "green" : "transparent",
                                            margin: "10px"
                                        }}
                                    >
                                        <img src={user.photoURL} style={{ width: "30px", height: "30px" }} />
                                        {user.displayName}
                                    </li>
                                    )
                                ))}
                            </ul>
                        ) : null}

                        {
                            channelAddState.members.length > 0 ? (
                                <>
                                    <h3>Selected Members</h3>
                                    <ul style={{ listStyle: "none" }}>
                                        {channelAddState.members.map(member => (
                                            member.uid !== props.user.uid && (
                                                <li key={member.uid} style={{ display: "flex", alignItems: "center", margin: "8px" }}>
                                                    <img src={member.photoURL} style={{ width: "30px", height: "30px" }} />
                                                    {member.displayName}
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                </>
                            ) : null
                        }
                        
                            {props.user?.gitHub ? <>
                            <label>Create New GitHub Repository &nbsp;</label>
                            <input
                                type="checkbox"
                                checked={createNewRepo}
                                onChange={handleCheckboxChange}
                            /> <br />  <br /></> : <p style={{ color: "red" }}>Add your git details to create github repo</p>}
                        {createNewRepo ? <Form.Input
                            name="repo_name"
                            value={channelAddState.repo_name}
                            onChange={handleInput}
                            type="text"
                            placeholder="Enter Repository Name"
                        /> : null}


                    </Segment>
                </Form>
            </Modal.Content>
            <Modal.Actions>
                <Button loading={isLoadingState} onClick={onSubmit}>
                    <Icon name="checkmark" /> Save
                </Button>
                <Button onClick={closeModal}>
                    <Icon name="remove" /> Cancel
                </Button>
            </Modal.Actions>
        </Modal>


    </>
}

const mapStateToProps = (state) => {
    return {
        user: state.user.currentUser,
        channel: state.channel.currentChannel,
        users: state.users.allUsers,
        favouriteChannels: state.favouriteChannel.favouriteChannel
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        selectChannel: (channel) => dispatch(setChannel(channel)),
        setfavouriteChannel: (channel) => dispatch(setfavouriteChannel(channel)),
        removefavouriteChannel: (channel) => dispatch(removefavouriteChannel(channel))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channels);
