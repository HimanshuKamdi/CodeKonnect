import React, { useEffect, useState } from "react";
import { Segment, Header, Input, Icon, Image, Button, Modal, Form } from "semantic-ui-react";
// import "../Messages.css";
import styled from "styled-components";
import { connect } from "react-redux";
import { updateChannelMembers, updateChannelAdmins } from "../../../store/actioncreator";
import firebase from '../../../firebase';

const MessageHeader = (props) => {
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isFileInterfaceHovered, setIsFileInterfaceHovered] = useState(false);
  const [channelAddState, setChannelAddState] = useState([]);
  const [suggestInput, setSuggestInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isAddMembersHovered, setIsAddMembersHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [channelsRef, setChannelRef] = useState(null);

  useEffect(() => {
    if (props.channel) {
      setChannelRef(firebase.database().ref("channels").child(props.channel.id));
    }
  }, [props.channel]);

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


  const handleHeaderClick = (event) => {
    if (event.target.name === "search" || event.target.tagName === "I") {
      return;
    } else {
      setIsInfoVisible(!isInfoVisible);
    }
  };

  const deleteChannel = () => {
    if (props.channel?.id) {
      channelsRef.remove()
        .then(() => {
          console.log("Channel deleted successfully");
        })
        .catch((error) => {
          console.error("Error deleting channel: ", error);
        });
    }
    window.location.reload();
  };

  const handleMakeAdmin = (member) => {
    if (props.channel?.id) {
      const updatedAdmins = props.channel.admin.concat(member.uid);
      props.updateChannelAdmin(props.channel.id, updatedAdmins);
      channelsRef.child("admin").set(updatedAdmins);
;    }
  };
  

  const handleSelectUser = (user) => {
    if (channelAddState.includes(user)) {
      setChannelAddState((currentState) => {
        const updatedMembers = currentState.filter(member => member.uid !== user.uid);
        return updatedMembers;
      });
    }
    else if (!channelAddState.some(member => member === user)) {
      setChannelAddState((currentState) => {
        let updatedState = currentState.concat(user);
        return updatedState;
      });
    }
  }


  const handleRemoveMember = (member) => {
    const updatedMembers = props.channel?.members?.filter(
      (m) => m.uid !== member.uid
    );

    props.updateChannelMembers(props.channel.id, updatedMembers);

    const updatedAdmins = props.channel.admin.filter(
      (admin) => admin !== member.uid
    );

    props.updateChannelAdmin(props.channel.id, updatedAdmins);

    channelsRef.child("admin").set(updatedAdmins);
    channelsRef.child("members").set(updatedMembers);

  };

  const handleFileInterfaceMouseEnter = () => {
    setIsFileInterfaceHovered(true);
  };

  const handleFileInterfaceMouseLeave = () => {
    setIsFileInterfaceHovered(false);
  };

  const handleAddMembersMouseEnter = () => {
    setIsAddMembersHovered(true);
  };

  const handleAddMembersMouseLeave = () => {
    setIsAddMembersHovered(false);
  };

  // Define styled button component
  const RemoveButton = styled.button`
  background-color: #ddedec;
  color: black;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin: 10px;

  &:hover {
    background-color: #146568;
  }
  `;


  const buttonStyle = {
    backgroundColor: isFileInterfaceHovered ? "#51a2a5" : "#146568",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 20px",
    cursor: "pointer",
    transition: "background-color 0.3s ease-in-out",
  };

  const buttonStyle2 = {
    backgroundColor: isAddMembersHovered ? "#51a2a5" : "#146568",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 20px",
    marginTop: "20px",
    cursor: "pointer",
    transition: "background-color 0.3s ease-in-out",
  };

  const buttonStyle3 = {
    backgroundColor: isAddMembersHovered ? "#dc3545" : "red",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "10px 20px",
    marginTop: "20px",
    cursor: "pointer",
    transition: "background-color 0.3s ease-in-out",
  };

  const handleAddButtonClick = () => {
    setModalOpen(true);
  };

  async function addCollaborator(owner, repo, collaborator) {
    const token = props.user.gitHub?.gitHubToken;
    console.log("token", token)
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

  const handleAddMembers = async () => {
    const updatedMembers = props.channel.members.concat(channelAddState);
    const owner = props.user.gitHub?.gitHubUsername;
    const repo_name = props.channel.repo_name;
    channelAddState.forEach(member => {
      if (member.gitHub && member.gitHub?.gitHubUsername ) {
        addCollaborator(owner, repo_name, member.gitHub.gitHubUsername)
            .then(collaborator => {
                console.log(collaborator);
            })
            .catch(error => {
                console.error('Failed to add collaborator:', error);
            });
    }
  });      

    props.updateChannelMembers(props.channel.id, updatedMembers);

    channelsRef.child("members").set(updatedMembers);

    setChannelAddState([]);

    setModalOpen(false);
  };

  const handleSuggestInput = (e) => {
    let target = e.target;
    setSuggestInput(target.value);
  };


  return (
    <>
      {props.channel && (
        <>
          <Segment clearing style={{ cursor: "pointer" }}>
            <Header floated="left" fluid as="h2">
              <div style={{ display: "block-inline" }}>
                <span onClick={handleHeaderClick}>
                  {(props.isPrivateChat ? "@ " : "# ") + props.channelName}
                </span>
                {!props.isPrivateChat && (
                  <Icon
                    onClick={props.starChange}
                    name={props.starred ? "star" : "star outline"}
                    color={props.starred ? "yellow" : "black"}
                  />
                )}
              </div>
              {!props.isPrivateChat && (
                <Header.Subheader>
                  {props.channel.members.length} User
                  {props.channel.members.length === 1 ? "" : "s"}
                </Header.Subheader>
              )}
            </Header>
            {!props.isPrivateChat &&  props.channel.repo_name && (
              <Button
                onClick={props.displaySourceFiles}
                className="fileInterface"
                style={buttonStyle}
                onMouseEnter={handleFileInterfaceMouseEnter}
                onMouseLeave={handleFileInterfaceMouseLeave}
              >
                File Interface
              </Button>
            )}
            <Header floated="right">
              <Input
                name="search"
                icon="search"
                placeholder="Search Messages"
                size="mini"
                onChange={props.searchTermChange}
              />
            </Header>
          </Segment>
          {isInfoVisible && props.channel && (
            <Segment>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Header>Description:</Header>
                <div>
                <Button
                  onClick={deleteChannel}
                  style={buttonStyle3}
                  onMouseEnter={handleAddMembersMouseEnter}
                  onMouseLeave={handleAddMembersMouseLeave}
                >
                  Delete Channel
                </Button>
                </div>
              </div>

              <p>{props.channel?.description || ""}</p>
              <Header>Members:</Header>
              <div>
                {props.channel.members?.map((member, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "5px",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                    <Image src={member.photoURL} avatar />
                    <span>{member.displayName}</span>
                    {props.channel.admin.includes(member.uid) && (
                      <>
                        <span style={{
                          marginLeft: '10px', // Adds space between the member name and the admin tag
                          border: '2px solid green', // Defines the border color and thickness
                          borderRadius: '10px', // Makes the corners rounded
                          padding: '3px 7px', // Adds space inside the border around the content
                          display: 'inline-block' // Ensures the span behaves like a block for padding and border to work but flows like inline
                        }}>
                          Admin
                        </span>
                      </>
                    )}
                    </div>
                    <div >
                    {props.channel.admin.includes(props.user.uid) && (
                      <>
                      { !props.channel.admin.includes(member.uid) && (
                      <RemoveButton onClick={() => handleMakeAdmin(member)}>
                          Make Admin
                        </RemoveButton>
                      )}     
                      {member.uid !== props.user.uid && ( 
                        <RemoveButton onClick={() => handleRemoveMember(member)}>
                          Remove
                        </RemoveButton>
                      )}
                      </>
                    )}
                    </div>

                  </div>
                ))}
                <Button
                  onClick={handleAddButtonClick}
                  style={buttonStyle2}
                  onMouseEnter={handleAddMembersMouseEnter}
                  onMouseLeave={handleAddMembersMouseLeave}
                >
                  Add Members
                </Button>
              </div>
            </Segment>
          )}
        </>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>Add Members</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input
              name="members"
              value={suggestInput}
              onChange={handleSuggestInput}
              type="text"
              placeholder="Add Members"
            />
          </Form>
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map(user => (
                !props.channel.members.some(member => member.uid === user.uid) && (
                  <li
                    key={user.uid}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      backgroundColor: channelAddState.includes(user) ? "green" : "transparent",
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
            channelAddState.length > 0 ? (
              <>
                <h3>Selected Members</h3>
                <ul style={{ listStyle: "none" }}>
                  {channelAddState.map(member => (
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
        </Modal.Content>
        <Modal.Actions>
          <Button color="green" onClick={handleAddMembers}>
            Add
          </Button>
          <Button color="red" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
        </Modal.Actions>
      </Modal>

    </>
  );
};

const mapStateToProps = (state) => {
  return {
    user: state.user.currentUser,
    users: state.users.allUsers,
    channel: state.channel.currentChannel,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateChannelMembers: (channelId, updatedMembers) =>
      dispatch(updateChannelMembers(channelId, updatedMembers)),
    updateChannelAdmin: (channelId, updatedAdmins) =>
      dispatch(updateChannelAdmins(channelId, updatedAdmins)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MessageHeader);
