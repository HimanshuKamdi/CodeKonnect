import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import firebase from "../../../firebase";
import { Notification } from "../Notification/Notification.component";
import { setChannel, setfavouriteChannel, removefavouriteChannel } from "../../../store/actioncreator";
import './Channels.css';
import { Menu, Icon, Modal, Button, Form, Segment } from 'semantic-ui-react';

const Channels = (props) => {
    const [modalOpenState, setModalOpenState] = useState(false);
    const [channelAddState, setChannelAddState] = useState({ name: '', description: '', repo_name: '', members: [], admin: [] });
    const [isLoadingState, setLoadingState] = useState(false);
    const [channelsState, setChannelsState] = useState([]);
    const [createNewRepo, setCreateNewRepo] = useState(false);
    const [suggestInput, setSuggestInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [validChannels, setValidChannels] = useState([]);
    const [allMembers, setAllMembers] = useState(false);

    const handleCheckboxChange = () => {
        setCreateNewRepo(!createNewRepo);
    }

    const channelsRef = firebase.database().ref("channels");
    const usersRef = firebase.database().ref("users");

    useEffect(() => {
        if (props.user && props.user.uid) {
            setChannelAddState({ name: '', description: '', repo_name: '', members: [props.user], admin: [props.user.uid] });
        }
    }, [props.user])

    const githubToken = props.user.gitHub?.gitHubToken;

    useEffect(() => {
        if (props.user) {
            const filteredChannels = channelsState.filter(channel => {
                return !channel.members || channel.members.some(member => member.uid === props.user.uid);
            });
            setValidChannels(filteredChannels);
        }
    }, [channelsState, props.user]);

    useEffect(() => {
        if (suggestInput.length > 0) {
            let searchResults = props.users.filter(user => {
                return user.displayName.toLowerCase().includes(suggestInput.toLowerCase());
            });
            setSuggestions(searchResults);
        }
        else {
            setSuggestions([]);
        }
    }, [suggestInput]);

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

    // useEffect(() => {
    //     if (channelsState.length > 0) {
    //         props.selectChannel(channelsState[0])
    //     }
    // }, [!props.channel ? channelsState : null])

    const openModal = () => {
        setModalOpenState(true);
    }

    const closeModal = () => {
        setModalOpenState(false);
    }

    const checkIfFormValid = () => {
        return channelAddState && channelAddState.name && channelAddState.description;
    }

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

            return [...favoriteChannelsElements, ...nonFavoriteChannelsElements];
        }
        return null; 
    };

    const selectChannel = (channel) => {
        if(props.channel){
            setLastVisited(props.user, props.channel);
            setLastVisited(props.user, channel);
            channel.showFiles = false;
            channel.showCommits = false;
        }
        props.selectChannel(channel);
    }

    const setLastVisited = (user, channel) => {
        const lastVisited = usersRef.child(user.uid).child("lastVisited").child(channel.id);
        lastVisited.set(firebase.database.ServerValue.TIMESTAMP);
        lastVisited.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    }
    async function createRepository(name, description) {
        const token = githubToken;  
        try {
            const url = 'https://api.github.com/user/repos'; 
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    private: true, 
                    auto_init: true,
                }),
            });

            if (response.ok) {
                alert(`Repository "${name}" created successfully!`);
                return await response.json();
            } else {
                const errorMessage = await response.text();
                throw new Error(`Failed to create repository: ${response.status} ${response.statusText}\n${errorMessage}`);
            }
        } catch (error) {
            console.error('Error creating repository:', error);
            throw error;
        }
    }

    async function addCollaborator(owner, repo, collaborator) {
        const token = githubToken;
        const url = `https://api.github.com/repos/${owner}/${repo}/collaborators/${collaborator}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permission: "admin"
                }),
            });

            if (response.ok) {
                console.log(`Collaborator ${collaborator} added successfully!`);
                return await response.json();
            } else {
                const errorBody = await response.json();
                throw new Error(`Failed to add collaborator: ${response.status} ${response.statusText}\n${errorBody.message}`);
            }
        } catch (error) {
            console.error('Error adding collaborator:', error);
            throw error;
        }
    }


    const createChannel = (key) => {

        if (createNewRepo) {

            const channel = {
                id: key,
                name: channelAddState.name,
                description: channelAddState.description,
                members: channelAddState.members,
                created_by: props.user.uid,
                repo_name: channelAddState.repo_name,
                repo_owner: props.user.gitHub?.gitHubUsername,
                admin: channelAddState.admin
            }

            const owner = props.user.gitHub?.gitHubUsername;
            const new_repo_name = channel.repo_name;
            const description = channel.description;
            createRepository(new_repo_name, description)
                .then(repository => {
                    setTimeout(() => {
                        channel.members.forEach(member => {
                            if (member.gitHub?.gitHubUsername && member.gitHub.gitHubUsername !== owner) {
                                addCollaborator(owner, new_repo_name, member.gitHub.gitHubUsername)
                                    .then(collaborator => {
                                        console.log(collaborator);
                                    })
                                    .catch(error => {
                                        console.error('Failed to add collaborator:', error);
                                    });
                            }
                        });

                    }, 5000); 

                })
                .catch(error => {
                    console.error('Failed to create repository:', error);
                });
            return channel;
        }

        else {
            const channel = {
                id: key,
                name: channelAddState.name,
                description: channelAddState.description,
                members: channelAddState.members,
                created_by: props.user.uid,
                admin: channelAddState.admin
            }
            return channel;
        }
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
                setChannelAddState({ name: '', description: '', repo_name: '', members: [props.user], admin: [props.user.uid] });
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
