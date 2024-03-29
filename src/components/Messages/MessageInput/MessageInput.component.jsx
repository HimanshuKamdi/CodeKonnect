import React, { useState } from 'react';
import { Segment, Input, Button } from "semantic-ui-react";
import firebase from "../../../server/firebase";
import { connect } from "react-redux";
import { ImageUpload } from "../ImageUpload/ImageUpload.component";
import uuidv4 from "uuid/v4";

const MessageInput = (props) => {

    const messageRef = firebase.database().ref('messages');

    const storageRef = firebase.storage().ref();

    const [messageState, setMessageState] = useState("");

    const [fileDialogState, setFileDialog] = useState(false);

    const sendMessage = () => {
        if (messageState.trim() || props.uploadedFileUrl) {
            messageRef.child(props.channel.id)
                .push()
                .set(createMessageInfo())
                .then(() => setMessageState(""))
                .catch((err) => console.log(err))
        }
    }

    const createMessageInfo = () => {
        return {
            user: {
                avatar: props.user.photoURL,
                name: props.user.displayName,
                id: props.user.uid
            },
            content: messageState,
            fileUrl: props.uploadedFileUrl || "",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }
    }

    const onMessageChange = (e) => {
        setMessageState(e.target.value);
    }

    const createActionButtons = () => {
        return (
            <>
                <Button icon="send" onClick={sendMessage} />
                <Button icon="upload" onClick={() => setFileDialog(true)} />
            </>
        );
    }

    const handleEnterKey = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    }

    const uploadFile = (file) => {
        const filePath = `chat/files/${uuidv4()}_${file.name}`;
        storageRef.child(filePath).put(file)
        .then((data) => {
            data.ref.getDownloadURL()
            .then((url) => {
                // Here we call the prop function passed down from parent
                props.setUploadedFileUrl(url);
                setFileDialog(false);
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    }

    return (
        <Segment>
            <Input
                onChange={onMessageChange}
                onKeyPress={handleEnterKey}
                fluid
                name="message"
                value={messageState}
                label={createActionButtons()}
                labelPosition="right"
            />
            {/* Here we pass the setUploadedFileUrl function as a prop */}
            <ImageUpload uploadFile={uploadFile} setUploadedFileUrl={props.setUploadedFileUrl} open={fileDialogState} onClose={() => setFileDialog(false)} />
        </Segment>
    );
}

const mapStateToProps = (state) => {
    return {
        user: state.user.currentUser,
        channel: state.channel.currentChannel
    }
}

export default connect(mapStateToProps)(MessageInput);