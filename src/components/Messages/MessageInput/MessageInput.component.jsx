import React, { useState } from 'react';
import { Segment, Input, Button } from "semantic-ui-react";
import firebase from "../../../server/firebase";
import { connect } from "react-redux";
import { ImageUpload } from "../MessageUpload/ImageUpload.component";
import { FileUpload } from "../MessageUpload/FileUpload.component";
import uuidv4 from "uuid/v4";

const MessageInput = (props) => {
    const messageRef = firebase.database().ref('messages');
    const storageRef = firebase.storage().ref();

    const [messageState, setMessageState] = useState("");
    const [imgDialogState, setImgDialog] = useState(false);
    const [fileDialogState, setFileDialog] = useState(false);


    const createMessageInfo = (downloadUrl) => {
        return {
            user: {
                avatar: props.user.photoURL,
                name: props.user.displayName,
                id: props.user.uid
            },
            content: messageState,
            image : downloadUrl || "",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }
    }

    const sendMessage = (downloadUrl) => {
        if (messageState || downloadUrl) {
            messageRef.child(props.channel.id)
                .push()
                .set(createMessageInfo(downloadUrl))
                .then(() => setMessageState(""))
                .catch((err) => console.log(err))
        }
    }

    const sendFile = (url, file_name) => {
        if (url) {
            messageRef.child(props.channel.id)
                .push()
                .set(createFileInfo(url, file_name))
                .then(() => setMessageState(""))
                .catch((err) => console.log(err))
        }
    }

    const createFileInfo = (url, file_name) => {
        return {
            user: {
                avatar: props.user.photoURL,
                name: props.user.displayName,
                id: props.user.uid
            },
            fileName : file_name,
            fileUrl: url,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }
    }

    const onMessageChange = (e) => {
        setMessageState(e.target.value);
    }

    const createActionButtons = () => {
        return (
            <>
                <Button icon="send" onClick={sendMessage} style={{ backgroundColor: '#ddedec' }}/>
                <Button icon="image" onClick={() => setImgDialog(true)} style={{ backgroundColor: '#ddedec' }}/>
                <Button icon="upload" onClick={() => setFileDialog(true)} style={{ backgroundColor: '#ddedec' }}/>
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
        // setMessageState(file.name);
        storageRef.child(filePath).put(file)
            .then((data) => {
                data.ref.getDownloadURL()
                    .then((url) => {
                        sendFile(url, file.name);
                        console.log("URL",url);
                    })
                    .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
    }
    const uploadImage = (file, contentType) => {

                const filePath = `chat/images/${uuidv4()}.jpg`;
        
                storageRef.child(filePath).put(file, { contentType: contentType })
                    .then((data) => {
                        data.ref.getDownloadURL()
                        .then((url) => {
                            sendMessage(url);
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
            <ImageUpload uploadImage={uploadImage} open={imgDialogState} onClose={() => setImgDialog(false)} />
            <FileUpload uploadFile={uploadFile}  open={fileDialogState} onClose={() => setFileDialog(false)} />
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
