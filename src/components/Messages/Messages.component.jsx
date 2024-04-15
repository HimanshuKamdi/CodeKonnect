import React, { useEffect, useState, useRef } from "react";
import MessageHeader from "./MessageHeader/MessageHeader.component";
import MessageContent from "./MessageContent/MessageContent.component";
import MessageInput from "./MessageInput/MessageInput.component";
import { connect } from "react-redux";
import {
  setfavouriteChannel,
  removefavouriteChannel,
  updateChannelMembers,
  setChannel,
} from "../../store/actioncreator";
import firebase from "../../firebase";
import { Segment, Comment, Grid } from "semantic-ui-react";
import loginImg from "./login_image.avif";
import "./Messages.css";
import { withRouter } from "react-router-dom";

const Messages = (props) => {
  // console.log("Messages props",props);

  const messageRef = firebase.database().ref("messages");

  const usersRef = firebase.database().ref("users");

  const [messagesState, setMessagesState] = useState([]);

  const [searchTermState, setSearchTermState] = useState("");

  let divRef = useRef();

  // useEffect(() => {
  //     if (!props.channel) {
  //         // Show image only if no channel is selected
  //         return () => {
  //             return (
  //                 <div className="no-channel-selected">
  //                     <Grid.Column width={8}>
  //                         <img src={loginImg} alt="Icon Image" />
  //                     </Grid.Column>
  //                 </div>
  //             );
  //         };
  //     }
  // }, [props.channel]);

  useEffect(() => {
    if (props.channel) {
      setMessagesState([]);
      messageRef.child(props.channel.id).on("child_added", (snap) => {
        setMessagesState((currentState) => {
          let updatedState = [...currentState];
          updatedState.push(snap.val());
          return updatedState;
        });
      });

      return () => messageRef.child(props.channel.id).off();
    }
  }, [props.channel]);

  useEffect(() => {
    if (props.user) {
      usersRef
        .child(props.user.uid)
        .child("favourite")
        .on("child_added", (snap) => {
          props.setfavouriteChannel(snap.val());
        });

      usersRef
        .child(props.user.uid)
        .child("favourite")
        .on("child_removed", (snap) => {
          props.removefavouriteChannel(snap.val());
        });

      return () => usersRef.child(props.user.uid).child("favourite").off();
    }
    console.log("favouriteChannels", props.favouriteChannels);
  }, [props.user]);

  useEffect(() => {
    if (props.channel) {
      divRef.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesState]);

  const displayMessages = () => {
    let messagesToDisplay = searchTermState
      ? filterMessageBySearchTerm()
      : messagesState;
    // console.log("Messages",messagesToDisplay);
    if (messagesToDisplay.length > 0 && props.user !== null) {
      return messagesToDisplay.map((message) => {
        // console.log(message);
        return (
          <MessageContent
            imageLoaded={imageLoaded}
            ownMessage={message.user.id === props.user.uid}
            key={message.timestamp}
            message={message}
          />
        );
      });
    }
  };

  const imageLoaded = () => {
    divRef.scrollIntoView({ behavior: "smooth" });
  };

  const searchTermChange = (e) => {
    const target = e.target;
    setSearchTermState(target.value);
  };

  const filterMessageBySearchTerm = () => {
    const regex = new RegExp(searchTermState, "gi");
    const messages = messagesState.reduce((acc, message) => {
      if (
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message);
      }
      return acc;
    }, []);

    return messages;
  };

  const starChange = () => {
    // console.log("Star change");
    let favouriteRef = usersRef
      .child(props.user.uid)
      .child("favourite")
      .child(props.channel.id);
    if (isStarred()) {
      favouriteRef.remove();
    } else {
      favouriteRef.set({
        channelId: props.channel.id,
        channelName: props.channel.name,
      });
    }
  };

  const isStarred = () => {
    // console.log("Is starred");
    // console.log(props.favouriteChannels);
    return Object.keys(props.favouriteChannels).includes(props.channel?.id);
  };

  const displaySourceFiles = () => {
    var channel = props.channel;
    channel.showFiles = true;
    channel.showCommits = false;
    console.log("Display source files", channel);
    props.setChannel(channel);
  };

  return (
    <div className="messages">
      {!props.channel && (
        <div className="no-channel-selected">
          <Grid.Column width={8} style={{ display: 'flex', justifyContent: 'center', marginTop: '6rem' }}>
            <img src={loginImg} alt="Icon Image" />
          </Grid.Column>
        </div>
      )}
      {props.channel && (
        <>
          <MessageHeader
            starChange={starChange}
            starred={isStarred()}
            isPrivateChat={props.channel.isPrivateChat}
            searchTermChange={searchTermChange}
            channelName={props.channel.name}
            updateChannelMembers={props.updateChannelMembers}
            displaySourceFiles={displaySourceFiles}
          />
          <Segment className="messagecontent">
            <Comment.Group style={{ maxWidth: "100vw" }}>
              {displayMessages()}
              <div
                ref={(currentEl) => {
                  divRef = currentEl;
                }}
              ></div>
            </Comment.Group>
          </Segment>
          <MessageInput />
        </>
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    channel: state.channel.currentChannel,
    user: state.user.currentUser,
    favouriteChannels: state.favouriteChannel.favouriteChannel,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setChannel: (channel) => dispatch(setChannel(channel)),
    setfavouriteChannel: (channel) => dispatch(setfavouriteChannel(channel)),
    removefavouriteChannel: (channel) =>
      dispatch(removefavouriteChannel(channel)),
    updateChannelMembers: (channelId, updatedMembers) =>
      dispatch(updateChannelMembers(channelId, updatedMembers)),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Messages)
);
