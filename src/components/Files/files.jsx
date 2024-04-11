import React, { useRef, useState, useEffect } from "react";
import { connect } from "react-redux";
import firebase from "../../firebase";

const Files = (props) => {
  const [fileContent, setFileContent] = useState("// write your code here");
  const valueGetter = useRef();
  const [repoContents, setRepoContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState("");

  const filesRef = firebase.database().ref('files');
  const channelFilesRef = filesRef.child(props.channel.id);


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
        throw new Error(`Failed to fetch repository contents: ${response.status}`);
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

  useEffect(() => {
    fetchRepoContents();
  }, []);

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
        filesPathRef.once('value').then(snapshot => {
          if (!snapshot.exists()) {
            filesPathRef.set({
              fileName: item.name,
              fileContent: content,
              connectedUsers: [props.user],
              changes: [],
              editedBy: "",
            }).then(() => {
              console.log("File created successfully.");
            }).catch(error => {
              console.error("Error creating file:", error);
            });
          } else {
            filesPathRef.child('connectedUsers').transaction(connectedUsers => {
              if (!connectedUsers) {
                return [{ uid: props.user.uid, displayName: props.user.displayName }];
              } else {
                const userExists = connectedUsers.some(user => user.uid === props.user.uid);
                if (!userExists) {
                  return [...connectedUsers, { uid: props.user.uid, displayName: props.user.displayName }];
                } else {
                  return connectedUsers;
                }
              }
            }).then(() => {
              console.log("User added to connected users.");
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
            console.log("On disconnect: User removed from connected users.");
          })
          .catch(error => {
            console.error("Error removing user on disconnect:", error);
          });

        props.history.push(`/code/${props.channel.repo_name}/${item.path}`, { filePath: filePath })

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

  const navigateUp = () => {
    const parts = currentDirectory.split("/");
    parts.pop();
    const parentDirectory = parts.join("/");
    fetchRepoContents(parentDirectory);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
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
              <button onClick={() => handleDirectoryClick(content.path)}>
                {content.name} (Directory)
              </button>
            ) : (
              <button onClick={() => handleItemClick(content)}>
                {content.name} (File)
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    channel: state.channel.currentChannel,
    user: state.user.currentUser,
    favouriteChannels: state.favouriteChannel.favouriteChannel
  }
}

export default connect(mapStateToProps)(Files);

