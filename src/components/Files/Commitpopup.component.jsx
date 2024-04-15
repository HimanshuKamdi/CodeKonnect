import React, { useState, useEffect } from 'react';
import { Modal, Button, Icon, Segment } from 'semantic-ui-react';

export const CommitPopup = (props) => {
    const [commitMessage, setCommitMessage] = useState('');
    const [commitFiles, setCommitFiles] = useState([]);

    const fetchFileChanges = () => {
        props.channelFilesRef.once('value').then(snapshot => {
            const files = snapshot.val();
            const editedFiles = [];
    
            snapshot.forEach(fileSnapshot => {
                const file = fileSnapshot.val();
                if (file.edited) {
                    const fileObject = {
                        path: file.path,
                        content: file.fileContent,
                        encoding: "utf-8" 
                    };
                    editedFiles.push(fileObject);
                }
            });
    
            setCommitFiles(editedFiles); 
        }).catch(error => {
            console.error('Error fetching file changes:', error);
        });
    };   
    

    useEffect(() => {
        fetchFileChanges();
    }, []);

    const resetChangedFiles = () => {
        props.channelFilesRef.once('value').then(snapshot => {
            const files = snapshot.val();
    
            snapshot.forEach(fileSnapshot => {
                const file = fileSnapshot.val();
                if (file.edited) {
                    fileSnapshot.ref.child("edited").set(false);
                }
            });
    
        }).catch(error => {
            console.error('Error fetching file changes:', error);
        });
    };

    const createGithubFileBlob = async (githubAccessToken, repoFullName, content, encoding = "utf-8") => {
        const blobResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/blobs`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${githubAccessToken}`,
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

    const getShaForBaseTree = async (githubAccessToken, repoFullName, branchName) => {
        const baseTreeResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${branchName}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${githubAccessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
        });
        const response = await baseTreeResp.json();
        return response.sha;
    };

    const getParentSha = async (githubAccessToken, repoFullName, branchName) => {
        const parentResp = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${branchName}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${githubAccessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
        });
        const response = await parentResp.json();

        return response.object.sha;
    };

    const createGithubRepoTree = async (githubAccessToken, repoFullName, branchName, commitFiles) => {
        const shaForBaseTree = await getShaForBaseTree(githubAccessToken, repoFullName, branchName);

        const tree = [];

        for (const file of commitFiles) {
            const fileSha = await createGithubFileBlob(githubAccessToken, repoFullName, file.content, file.encoding);
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
                'Authorization': `Bearer ${githubAccessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify(payload)
        });
        const response = await treeResp.json();

        return response.sha;
    };

    const createGithubCommit = async (githubAccessToken, repoFullName, branchName, commitMessage, commitFiles) => {
        console.log("Inside create github ");
        const tree = await createGithubRepoTree(githubAccessToken, repoFullName, branchName, commitFiles);
        const parentSha = await getParentSha(githubAccessToken, repoFullName, branchName);

        const payload = {
            "message": commitMessage,
            "tree": tree,
            "parents": [parentSha]
        };

        const response = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${githubAccessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify(payload)
        });
        const commitResp = await response.json();
        const commitSha = commitResp.sha;

        await updateGithubBranchRef(githubAccessToken, repoFullName, branchName, commitSha);
    };

    const updateGithubBranchRef = async (githubAccessToken, repoFullName, branchName, commitSha) => {
        const payload = {
            "sha": commitSha,
            "force": false
        };

        const response = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${branchName}`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${githubAccessToken}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify(payload)
        });
        const commitResp = await response.json();
        console.log("response",commitResp);
    };



    const handleCommit = async () => {
        const githubAccessToken = props.accessToken;
        const githubRepoFullName = props.githubRepoFullName;
        const githubRepoBranchName = props.branch;
        const commitTitle = commitMessage;
        await createGithubCommit(
            githubAccessToken,
            githubRepoFullName,
            githubRepoBranchName,
            commitTitle,
            commitFiles,
        );
        console.log("commit");
        props.onCommit(commitMessage);
        setCommitMessage('');
        resetChangedFiles();
        props.onClose();
    };



    return (
        <Modal open={props.open} onClose={props.onClose}>
            <Modal.Header>Add Commit</Modal.Header>
            <Modal.Content>
                <Segment stacked>
                <p style={{fontSize: "25px"}}>Files to commit</p>  
                <ul>             
                {commitFiles?.map((file, index) => (
                        <li key={index} style={{color:"Black", fontSize:"18px", marginBottom: '25px' }}>{file.path}</li>
                ))}
                </ul> 
                <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Enter commit message..."
                    rows={4}
                    style={{ width: '100%', resize: 'none', fontSize: '20px' }}
                />
                </Segment>
            </Modal.Content>
            <Modal.Actions>
                <Button color="green" onClick={handleCommit}>
                    <Icon name="checkmark" />Commit
                </Button>
                <Button color="red" onClick={props.onClose}>
                    <Icon name="remove" />Cancel
                </Button>
            </Modal.Actions>
        </Modal>
    );
};



