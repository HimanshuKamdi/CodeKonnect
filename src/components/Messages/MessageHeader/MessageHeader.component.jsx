import React, { useState } from 'react';
import { Segment, Header, Input, Icon, Modal, List } from 'semantic-ui-react';

const MessageHeader = (props) => {
    console.log("MessageHeader props:", props);

    const [modalOpen, setModalOpen] = useState(false);

    const handleHeaderClick = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
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
            <ChannelInfoModal
                open={modalOpen}
                onClose={handleCloseModal}
                channelDescription={props.channel?.currentChannel?.description || ''}
                channelMembers={props.channel?.currentChannel?.members || []}
            />
        </>
    );
};

const ChannelInfoModal = ({ open, onClose, channelDescription, channelMembers }) => {
    return (
        <Modal open={open} onClose={onClose} size="small">
            <Modal.Header>Channel Information</Modal.Header>
            <Modal.Content>
                <Modal.Description>
                    <Header>Description:</Header>
                    <p>{channelDescription}</p>
                    <Header>Members:</Header>
                    {channelMembers && (
                        <List divided relaxed>
                            {channelMembers.map((member, index) => (
                                <List.Item key={index}>
                                    <List.Icon name="user" />
                                    {member.displayName}
                                </List.Item>
                            ))}
                        </List>
                    )}
                </Modal.Description>
            </Modal.Content>
        </Modal>
    );
};

export default MessageHeader;