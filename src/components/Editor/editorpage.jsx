import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Editor from './editor';
import { useHistory } from "react-router-dom";
import { connect } from "react-redux";
import { useLocation, useParams, } from 'react-router-dom';
import firebase from "../../firebase";
import { Image } from 'semantic-ui-react';
import "./editorpage.css";

function EditorPage(props) {
    const history = useHistory();
    const codeRef = useRef(null);
    const [clients, setClients] = useState([]);
    const { filePath } = props.location.state;
    const [editedBy, setEditedBy] = useState("");

    const filesRef = firebase.database().ref('files');
    const filesPathRef = filesRef.child(props.channel.id).child(filePath);

    useEffect(() => {
        filesPathRef.child('connectedUsers').on('value', (snap) => {
            const connectedUsers = snap.val();
            if (connectedUsers) {
                setClients(connectedUsers);
            }
        });
        filesPathRef.child('editedBy').on('value', (snap) => {
            const editedBy = snap.val();
            if (editedBy) {
                setEditedBy(editedBy);
            }
        });
    }, []);

    function leaveRoom() {
        filesPathRef.child('connectedUsers').transaction(connectedUsers => {
            if (connectedUsers) {
              const updatedUsers = connectedUsers.filter(user => user.uid !== props.user.uid);
              return updatedUsers;
            } else {
              return connectedUsers;
            }
          }).then(() => {
            console.log("User removed from connected users successfully.");
          }).catch(error => {
            console.error("Error removing user from connected users:", error);
          });
          filesPathRef.child("editedBy").set("");
          history.goBack();
        };



    if (props.user){
        if(!props.channel){
            history.push("/");
        }
    }

    return (<>
        {
        props?.channel && (
            <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (                            
                            <span>
                            <Image src={client.photoURL} avatar></Image>
                            {client.displayName}
                            {client.uid === editedBy && <span> (editing)</span>}
                        </span>
                        ))}
                    </div>
                </div>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                    <Editor
                    filePathRef={filesPathRef}
                    user={props.user.uid}
                />
            </div>
        </div>
        )
    }
    </>       
    );
};


const mapStateToProps = (state) => {
    return {
        user: state.user.currentUser,
        channel: state.channel.currentChannel,
    }
}

export default connect(mapStateToProps)(EditorPage);
