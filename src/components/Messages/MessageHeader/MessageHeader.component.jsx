import React, { useState } from 'react';
import { Segment, Header, Input, Icon, Image } from 'semantic-ui-react';
import styled from 'styled-components';


// Define styled button component
const RemoveButton = styled.button`
  background-color: #ddedec;
  color: black;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-bottom: 5px;
  margin-left: auto;
  &:hover {
    background-color: #146568;
  }
`;

const MessageHeader = (props) => {
    const [isInfoVisible, setIsInfoVisible] = useState(false);

    console.log("MessageHeader props:", props);

    const handleRemoveMember = (member) => {
        // Filter out the member to be removed
        const updatedMembers = props.channel?.members?.filter(m => m.uid !== member.uid);

        // Update the channel's members
        props.updateChannelMembers(props.channel.id, updatedMembers);
        console.log("Remove member:", member);

    };

    const handleHeaderClick = (event) => {
        // Check if the click target is the search input or the star icon
        if (event.target.name === "search" || event.target.tagName === "I") {
            return; // Do nothing if clicked on search input or star icon
        } else {
            setIsInfoVisible(!isInfoVisible);
        }
    };

    return (
        <>
        {props.channel && <>
            <Segment clearing onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
                <Header floated="left" fluid as="h2">
                    <span>
                        {(props.isPrivateChat ? "@ " : "# ") + props.channelName}
                        {!props.isPrivateChat && (
                            <Icon
                                onClick={props.starChange}
                                name={props.starred ? "star" : "star outline"}
                                color={props.starred ? "yellow" : "black"}
                            />
                        )}
                    </span>
                    {!props.isPrivateChat && (
                        <Header.Subheader>
                            {props.channel.members.length} User{props.channel.members.length === 1 ? "" : "s"}                            
                        </Header.Subheader>
                    )}
                </Header>
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
            {isInfoVisible && (
                <Segment>
                    <Header>Description:</Header>
                    <p>{props.channel?.description || ''}</p>
                    <Header>Members:</Header>
                    <div>
                        {props.channel?.members?.map((member, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                <Image src={member.photoURL} avatar />
                                <span>{member.displayName}</span>
                                <RemoveButton onClick={() => handleRemoveMember(member)}>Remove</RemoveButton>
                            </div>
                        ))}
                    </div>
                </Segment>
            )}
                  </>      }
        </>
    );
};

export default MessageHeader;
