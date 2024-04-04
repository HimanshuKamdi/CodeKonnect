import React, { useState } from 'react';
import { Segment, Header, Input, Icon, Image } from 'semantic-ui-react';

const MessageHeader = (props) => {
    const [isInfoVisible, setIsInfoVisible] = useState(false);

    console.log("MessageHeader props:", props);

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
                            {props.uniqueUsers} User{props.uniqueUsers === 1 ? "" : "s"}
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
                            </div>
                        ))}
                    </div>
                </Segment>
            )}
        </>
    );
};

export default MessageHeader;