// import React, { useState } from 'react';
// import { Segment, Header, Input, Icon, Modal, List } from 'semantic-ui-react';

// const MessageHeader = (props) => {
//     console.log("MessageHeader props:", props);

//     const [modalOpen, setModalOpen] = useState(false);

//     const handleHeaderClick = (event) => {
//         // Check if the click target is the search input or the star icon
//         if (event.target.name === "search" || event.target.tagName === "I") {
            
//         } else {
//             // Open the modal for channel description and members
//             setModalOpen(true);
//         }
//     };
    

//     const handleCloseModal = () => {
//         setModalOpen(false);
//     };

//     console.log("Description: ", props.channel?.description || '');
//     console.log("Members: ", props.channel?.members || []);
//     return (
//         <>
//             <Segment clearing onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
//                 <Header floated="left" fluid as="h2">
//                     <span>
//                         {(props.isPrivateChat ? "@ " : "# ") + props.channelName}
//                         {!props.isPrivateChat && (
//                             <Icon
//                                 onClick={props.starChange}
//                                 name={props.starred ? "star" : "star outline"}
//                                 color={props.starred ? "yellow" : "black"}
//                             />
//                         )}
//                     </span>
//                     {!props.isPrivateChat && (
//                         <Header.Subheader>
//                             {props.uniqueUsers} User{props.uniqueUsers === 1 ? "" : "s"}
//                         </Header.Subheader>
//                     )}
//                 </Header>
//                 <Header floated="right">
//                     <Input
//                         name="search"
//                         icon="search"
//                         placeholder="Search Messages"
//                         size="mini"
//                         onChange={props.searchTermChange}
//                     />
//                 </Header>
//             </Segment>
//             <ChannelInfoModal
//                 open={modalOpen}
//                 onClose={handleCloseModal}
//                 channelDescription={props.channel?.description || ''}
//                 channelMembers={props.channel?.members || []}
//             />
//         </>
//     );
// };

// const ChannelInfoModal = ({ open, onClose, channelDescription, channelMembers }) => {
//     return (
//         <Modal open={open} onClose={onClose} size="small">
//             <Modal.Header>Channel Information</Modal.Header>
//             <Modal.Content>
//                 <Modal.Description>
//                     <Header>Description:</Header>
                    
//                     <p>{channelDescription}</p>
                    
//                     <Header>Members:</Header>
//                     {channelMembers && (
//                         <List divided relaxed>
//                             {channelMembers.map((member, index) => (
//                                 <List.Item key={index}>
//                                     <List.Icon name="user" />
//                                     {member.displayName}
//                                 </List.Item>
//                             ))}
//                         </List>
//                     )}
//                 </Modal.Description>
//             </Modal.Content>
//         </Modal>
//     );
// };

// export default MessageHeader;



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
