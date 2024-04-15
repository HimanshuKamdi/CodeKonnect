import React, { useRef, useState, useEffect } from "react";
import { connect } from "react-redux";
import { SideBar } from "../SideBar/SideBar.component";
import firebase from "../../firebase";
import { useHistory } from 'react-router-dom';
import { setfavouriteChannel, removefavouriteChannel, updateChannelMembers, } from "../../store/actioncreator";
import "./RepositoryContents.css";
import { FileUpload } from "../Messages/MessageUpload/FileUpload.component";
import { CommitPopup } from "./Commitpopup.component.jsx";
import { Button, Input } from "semantic-ui-react";

const Files = (props) => {
  const history = useHistory();
  const [repoContents, setRepoContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState("");
  const [commitHistory, setCommitHistory] = useState([]);
  const [branch, setBranch] = useState();

  const filesRef = firebase.database().ref('files');
  const channelFilesRef = filesRef.child(props.channel.id);

  const [messagesState, setMessagesState] = useState([]);
  const [fileDialogState, setFileDialog] = useState(false);
  const [showCommitHistory, setShowCommitHistory] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitPopup, setShowCommitPopup] = useState(false);
  const [firebaseFiles, setFirebaseFiles] = useState([]);
  const storageRef = firebase.storage().ref();
  const divRef = useRef();

  const username = props.channel.repo_owner || "HimanshuKamdi";
  const repo = props.channel.repo_name || "DBMS-Project";
  const githubRepoFullName = username ? `${username}/${repo}` : 'HimanshuKamdi/DBMS-Project';
  const accessToken = props.user.gitHub?.gitHubToken || "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";


  const fetchRepoContents = async (path = "") => {
    try {
      const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        console.log("Failed to fetch repo contents: ", response);
      }

      const data = await response.json();
      if (data?.message !== "This repository is empty." && data?.message !== "Not Found") {
        data.forEach(item => {
          pushToDatabase(item);
        });
        setRepoContents(data);
      } 
      else if(data?.message === "Not Found"){
        setRepoContents([]);
      }     
      setCurrentDirectory(path);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };



  const fetchCommitHistory = async () => {
    try {
      const apiUrl = `https://api.github.com/repos/${username}/${repo}/commits?sha=${branch}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        console.log(`Failed to fetch commit history: ${response.status}`);
      }

      const commits = await response.json();
      if(commits.message !== "Git Repository is empty."){
        setCommitHistory(commits);
      }
      // else{
      //   setCommitHistory(["No commits till now..."]);
      // }
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchDefaultBranch = async () => {
    try {
      const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        console.log(`Failed to fetch repository details: ${response.status}`);
        setBranch("main");
      }
      const repoDetails = await response.json();
      setBranch(repoDetails.default_branch);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchRepoContents();
    fetchDefaultBranch();
  }, []);

  useEffect(() => {
    if(branch){
    fetchCommitHistory();      
    }

  }, [branch])

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

  const toggleCommitHistory = () => {
    setShowCommitHistory(!showCommitHistory);
  };

  const toggleCommitPopup = () => {
    setShowCommitPopup(!showCommitPopup);
  };

  const handle_Commit = () => {
    setShowCommitPopup(false);
    setCommitMessage("");
    setTimeout(() => {
      fetchCommitHistory();
      fetchRepoContents(currentDirectory);
  }, 5000); 
  };

  const navigateUp = () => {
    const parts = currentDirectory.split("/");
    parts.pop();
    const parentDirectory = parts.join("/");
    fetchRepoContents(parentDirectory);
  };

  const handleItemClick = async (item) => {
    if (item.type === "file") {
      try {
        const response = await fetch(item.download_url);
        if (!response.ok) {
          console.log(`Failed to fetch file: ${response.status}`);
        }

        const filePath = item.path.replace(/[.#$/\[\]]/g, "_");
        const filesPathRef = channelFilesRef.child(filePath);
        const content = await response.text();
        filesPathRef.once('value').then(snapshot => {
          if (!snapshot.exists()) {
            filesPathRef.set({
              fileName: item.name,
              fileContent: content,
              connectedUsers: [props.user],
              changes: [],
              editedBy: "",
              edited: false,
              path: item.path,
              downloadUrl: item.download_url,
              type: "file",
            }).then(() => {
              console.log("File created successfully.");
            }).catch(error => {
              console.error("Error creating file:", error);
            });
          } else {
            filesPathRef.child('connectedUsers').transaction(connectedUsers => {
              if (!connectedUsers) {
                return [props.user];
              } else {
                const userExists = connectedUsers.some(user => user.uid === props.user.uid);
                if (!userExists) {
                  return [...connectedUsers, props.user];
                } else {
                  return connectedUsers;
                }
              }
            }).then(() => {
            }).catch(error => {
              console.error("Error updating connected users:", error);
            });

          }
        }).catch(error => {
          console.error("Error checking file existence:", error);
        });

        const userRef = filesPathRef.child('connectedUsers').child(props.user.uid);
        userRef.onDisconnect().remove()
          .then(() => {
          })
          .catch(error => {
            console.error("Error removing user on disconnect:", error);
          });

        history.push(`/code/${props.channel.repo_name}/${item.path}`, { filePath: filePath })
      } catch (error) {
        console.error("Error fetching file:", error.message);
      }
    }
  };

  const pushToDatabase = async (item) => {
    if (item.type === "file") {
      const response = await fetch(item.download_url);
      if (!response.ok) {
        console.error(`Failed to fetch file: ${response.status}`);
      }
      const filePath = item.path.replace(/[.#$/\[\]]/g, "_");
      const filesPathRef = channelFilesRef.child(filePath);
      const content = await response.text();
      filesPathRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
          filesPathRef.set({
            fileName: item.name,
            fileContent: content,
            connectedUsers: [],
            changes: [],
            editedBy: "",
            edited: false,
            path: item.path,
            downloadUrl: item.download_url,
            type: "file",
          }).then(() => {
            console.log("File created successfully.");
          }).catch(error => {
            console.error("Error creating file:", error);
          });
        }
      }).catch(error => {
        console.error("Error checking file existence:", error);
      });
    }
    if (item.type === "dir") {
      const folderPath = item.path.replace(/[.#$/\[\]]/g, "_");
      const folderPathRef = channelFilesRef.child(folderPath);
      folderPathRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
          folderPathRef.set({
            folderName: item.name,
            downloadUrl: item.download_url,
            path: item.path,
            type: "dir",
          }).then(() => {
          }).catch(error => {
            console.error("Error creating folder:", error);
          });
        }
      }
      ).catch(error => {
        console.error("Error checking folder existence:", error);
      }
      );

    }
  };

  const handleDirectoryClick = async (directory) => {
    await fetchRepoContents(directory.path);
  };

  const uploadFile = (file) => {
    const fileReader = new FileReader();  
    fileReader.onload = (event) => {
      const fileContent = event.target.result;
      handleUploadCommit(`Uploading ${file.name}...`,file,fileContent);
    };    
    fileReader.readAsText(file);
  };

  const createGithubFileBlob = async (accessToken, repoFullName, content, encoding = "utf-8") => {
    const blobResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/blobs`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        "content": content,
        "encoding": encoding
      })
    });
    const response = await blobResp.json();

    return response.sha;
  };

  const getShaForBaseTree = async (accessToken, repoFullName, branchName) => {
    const baseTreeResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${branchName}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
    });
    const response = await baseTreeResp.json();

    return response.sha;
  };

  const getParentSha = async (accessToken, repoFullName, branchName) => {
    const parentResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${branchName}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
    });
    const response = await parentResp.json();

    return response.object.sha;
  };

  const createGithubRepoTree = async (accessToken, repoFullName, branchName, commitFiles) => {
    const shaForBaseTree = await getShaForBaseTree(accessToken, repoFullName, branchName);

    const tree = [];

    for (const file of commitFiles) {
      const fileSha = await createGithubFileBlob(accessToken, repoFullName, file.content, file.encoding);
      tree.push({
        "path": file.path,
        "mode": "100644",
        "type": "blob",
        "sha": fileSha
      });
    }

    const payload = {
      "base_tree": shaForBaseTree,
      "tree": tree
    };

    const treeResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(payload)
    });
    const response = await treeResp.json();

    return response.sha;
  };

  const createGithubCommit = async (accessToken, repoFullName, branchName, commitMessage, commitFiles) => {
    const tree = await createGithubRepoTree(accessToken, repoFullName, branchName, commitFiles);
    const parentSha = await getParentSha(accessToken, repoFullName, branchName);

    const payload = {
      "message": commitMessage,
      "tree": tree,
      "parents": [parentSha]
    };

    const response = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(payload)
    });
    const commitResp = await response.json();
    const commitSha = commitResp.sha;

    await updateGithubBranchRef(accessToken, repoFullName, branchName, commitSha);
  };

  const updateGithubBranchRef = async (accessToken, repoFullName, branchName, commitSha) => {
    const payload = {
      "sha": commitSha,
      "force": false
    };

    const response = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${branchName}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(payload)
    });
    const commitResp = await response.json();
  };

  const handleUploadCommit = async (commitMessage, file, fileContent) => {
    const commitFile = [{
      path: currentDirectory ? `${currentDirectory}/${file.name}` : file.name,
      content: fileContent,
      encoding: "utf-8"
    }];
    await createGithubCommit(
      accessToken,
      githubRepoFullName,
      branch,
      commitMessage,
      commitFile,
    );

    setTimeout(() => {
      fetchRepoContents(currentDirectory);
      fetchCommitHistory();
    }, 10000);
  };

  

  const handleDownload = async (downloadUrl, inputFileName) => {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const content = await response.text();

      const lastDotIndex = inputFileName.lastIndexOf('.');
      const fileName = inputFileName.substring(0, lastDotIndex);
      const fileExtension = inputFileName.substring(lastDotIndex + 1);
      const blob = new Blob([content], { type: `text/${fileExtension}` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', inputFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
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
          }}
          channelFilesRef={channelFilesRef}
          accessToken={accessToken }
          githubRepoFullName={githubRepoFullName}
          branch={branch}
        />
      </div>

      {showCommitHistory ? (
        <div className="repository-contents">
        <h1>Commit History</h1>
        <ul>
            {commitHistory && commitHistory?.map((commit, index) => (
              <React.Fragment key={commit.sha}>                
                    <p>{commit.commit.author.date.slice(0, 10)} </p>
                <li>
                  {commit.commit.author.name}: {commit.commit.message}
                </li>
                    <hr />
              </React.Fragment>
            ))}
          </ul>
        </div>
      ) :
        (
          <div className="repository-contents">
            <h1>Repository Contents</h1>
            <ul>
              {currentDirectory && (
                <li key="Go Up">
                  <button onClick={navigateUp}>..</button>
                </li>
              )}
              {repoContents.map((content) => (
                <li key={content.name}>
                  {content.type === "dir" ? (
                    <button
                      onClick={() => handleDirectoryClick(content)}
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

                      <Button icon="download" onClick={() => handleDownload(content.download_url, content.name)} style={{ marginLeft: "auto", backgroundColor: "#64CCC5" }} />

                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
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