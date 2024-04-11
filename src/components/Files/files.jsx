import React, { useRef, useState, useEffect } from "react";
import { connect } from "react-redux";
import { SideBar } from "../SideBar/SideBar.component";
import firebase from "../../firebase";
import {
  setfavouriteChannel,
  removefavouriteChannel,
  updateChannelMembers,
} from "../../store/actioncreator";
import "./RepositoryContents.css";
import { FileUpload } from "../Messages/MessageUpload/FileUpload.component";
import { CommitPopup } from "./Commitpopup.component.jsx";
import { Button, Input } from "semantic-ui-react";
import uuidv4 from "uuid/v4";

const Files = (props) => {
  const [fileContent, setFileContent] = useState("// write your code here");
  const [repoContents, setRepoContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState("");
  const [commitHistory, setCommitHistory] = useState([]);

  const filesRef = firebase.database().ref("files");
  const channelFilesRef = filesRef.child(props.channel.id);

  const [messagesState, setMessagesState] = useState([]);
  const [fileDialogState, setFileDialog] = useState(false);
  const [showCommitHistory, setShowCommitHistory] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitPopup, setShowCommitPopup] = useState(false);

  const storageRef = firebase.storage().ref();
  const divRef = useRef();
  const usersRef = firebase.database().ref("users");

  console.log("Files props: ", props);

  const fetchRepoContents = async (path = "") => {
    try {
      const username = "HimanshuKamdi";
      const repo = "DBMS-Project";
      const branch = "main";
      const accessToken = "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";
      const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch repository contents: ${response.status}`
        );
        throw new Error(
          `Failed to fetch repository contents: ${response.status}`
        );
      }

      const data = await response.json();
      setRepoContents(data);
      setCurrentDirectory(path);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitHistory = async () => {
    try {
      const username = "HimanshuKamdi";
      const repo = "DBMS-Project";
      const branch = "main";
      const accessToken = "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";
      const apiUrl = `https://api.github.com/repos/${username}/${repo}/commits?sha=${branch}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch commit history: ${response.status}`);
      }

      const commits = await response.json();
      setCommitHistory(commits);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchRepoContents();
    fetchCommitHistory();
  }, []);

  useEffect(() => {
    if (props.channel) {
      setMessagesState([]);
      const messageRef = firebase.database().ref("messages");
      messageRef.child(props.channel.id).on("child_added", (snap) => {
        setMessagesState((currentState) => [...currentState, snap.val()]);
      });

      return () => messageRef.child(props.channel.id).off();
    }
  }, [props.channel]);

  useEffect(() => {
    if (props.user) {
      const usersRef = firebase.database().ref("users");
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
  }, [props.user]);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesState]);

  const navigateUp = () => {
    const parts = currentDirectory.split("/");
    parts.pop();
    const parentDirectory = parts.join("/");
    fetchRepoContents(parentDirectory);
  };

  const handleItemClick = async (item) => {
    console.log("item", item);
    if (item.type === "file") {
      try {
        const response = await fetch(item.download_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }

        const content = await response.text();
        setSelectedFileName(item.name);
        setFileContent(content);
        const filePath = item.path.replace(/[.#$/\[\]]/g, "_");
        const filesPathRef = channelFilesRef.child(filePath);
        filesPathRef
          .once("value")
          .then((snapshot) => {
            if (!snapshot.exists()) {
              filesPathRef
                .set({
                  fileName: item.name,
                  fileContent: content,
                  connectedUsers: [props.user],
                  changes: [],
                  editedBy: "",
                })
                .then(() => {
                  console.log("File created successfully.");
                })
                .catch((error) => {
                  console.error("Error creating file:", error);
                });
            } else {
              filesPathRef
                .child("connectedUsers")
                .transaction((connectedUsers) => {
                  if (!connectedUsers) {
                    return [
                      {
                        uid: props.user.uid,
                        displayName: props.user.displayName,
                      },
                    ];
                  } else {
                    const userExists = connectedUsers.some(
                      (user) => user.uid === props.user.uid
                    );
                    if (!userExists) {
                      return [
                        ...connectedUsers,
                        {
                          uid: props.user.uid,
                          displayName: props.user.displayName,
                        },
                      ];
                    } else {
                      return connectedUsers;
                    }
                  }
                })
                .then(() => {
                  console.log("User added to connected users.");
                })
                .catch((error) => {
                  console.error("Error updating connected users:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Error checking file existence:", error);
          });

        const userRef = filesPathRef
          .child("connectedUsers")
          .child(props.user.uid);
        userRef
          .onDisconnect()
          .remove()
          .then(() => {
            console.log("On disconnect: User removed from connected users.");
          })
          .catch((error) => {
            console.error("Error removing user on disconnect:", error);
          });

        props.history.push(`/code/${props.channel.repo_name}/${item.path}`, {
          filePath: filePath,
        });
      } catch (error) {
        console.error("Error fetching file:", error.message);
      }
    }
  };

  const handleDirectoryClick = (directoryPath) => {
    setSelectedFileName(null);
    setFileContent(null);
    fetchRepoContents(directoryPath);
  };

  const uploadFile = (file) => {
    const filePath = `chat/files/${uuidv4()}_${file.name}`;
    // setMessageState(file.name);
    storageRef
      .child(filePath)
      .put(file)
      .then((data) => {
        data.ref
          .getDownloadURL()
          .then((url) => {
            //sendFile(url, file.name);
            // console.log("URL",url);
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  };

  const handleDownload = async (downloadUrl, inputFileName) => {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const content = await response.text();

      const lastDotIndex = inputFileName.lastIndexOf(".");
      const fileName = inputFileName.substring(0, lastDotIndex);
      const fileExtension = inputFileName.substring(lastDotIndex + 1);
      const blob = new Blob([content], { type: `text/${fileExtension}` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", inputFileName); // Set the download attribute with original filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const toggleCommitHistory = () => {
    setShowCommitHistory(!showCommitHistory);
  };

  const toggleCommitPopup = () => {
    setShowCommitPopup(!showCommitPopup);
  };

  const handle_Commit = () => {
    const newCommit = {
      author: props.user.displayName,
      message: commitMessage,
    };

    console.log("Commit array: ", newCommit);

    setCommitHistory((prevCommitHistory) => [...prevCommitHistory, newCommit]);

    setShowCommitPopup(false);
    setCommitMessage("");
  };

  const addCommitToHistory = (commitMessage) => {
    setCommitHistory([commitMessage, ...commitHistory]);
    console.log("Commit added to history:", commitMessage);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="header_section">
        <button className="commit_btn" onClick={() => setFileDialog(true)}>
          Upload File
        </button>
        <FileUpload
          uploadFile={uploadFile}
          open={fileDialogState}
          onClose={() => setFileDialog(false)}
        />

<button className="commit_btn" onClick={toggleCommitHistory}>
          {showCommitHistory ? "Hide Commit History" : "View Commit History"}
        </button>
        <button className="commit_btn" onClick={toggleCommitPopup}>
          Add Commit
        </button>
        <CommitPopup
          open={showCommitPopup}
          onClose={toggleCommitPopup}
          onCommit={(commitMessage) => {
            handle_Commit(commitMessage);
            addCommitToHistory({
              commit: {
                author: {
                  name: props.user.displayName, 
                },
                message: commitMessage,
              }
            });
          }}
        />
      </div>

      <div className="repository-contents">
        <h1>Repository Contents</h1>
        <ul>
          {currentDirectory && (
            <li key="Go Up">
              <button onClick={navigateUp}>..</button>
            </li>
          )}
          {showCommitHistory ? (
            <div>
              <h2>Commit History:</h2>
              <ul>
                {commitHistory.map((commit, index) => (
                  <React.Fragment key={commit.sha}>
                    {index > 0 &&
                      commitHistory[index - 1].commit.author.name !==
                        commit.commit.author.name && (
                        <hr />
                      )}
                    <li>
                      {commit.commit.author.name}: {commit.commit.message}
                    </li>
                  </React.Fragment>
                ))}
              </ul>
            </div>
          ) : (
            repoContents.map((content) => (
              <li key={content.name}>
                {content.type === "dir" ? (
                  <button
                    onClick={() => handleDirectoryClick(content.path)}
                    className="directory-button"
                  >
                     {content.name} (Directory)
                  </button>
                  ) : (
                    <div className="file-list">
                      <button
                        onClick={() => handleItemClick(content)}
                        className="file-button"
                      >
                        {content.name} (File)
                      </button>
  
                      <Button
                        icon="download"
                        onClick={() => handleDownload(content.name)}
                        style={{ backgroundColor: "#64CCC5", marginLeft: "auto" }}
                      />
                    </div>
                  )}
                </li>
              ))
            )}

        </ul>
      </div>

      <SideBar />
    </>
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
    setfavouriteChannel: (channel) => dispatch(setfavouriteChannel(channel)),
    removefavouriteChannel: (channel) =>
      dispatch(removefavouriteChannel(channel)),
    updateChannelMembers: (channelId, updatedMembers) =>
      dispatch(updateChannelMembers(channelId, updatedMembers)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Files);
