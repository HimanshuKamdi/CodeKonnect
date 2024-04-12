import React, { useState } from 'react';
import { Modal, Button, Icon } from 'semantic-ui-react';

export const CommitPopup = (props) => {
    const [commitMessage, setCommitMessage] = useState('');

    const handleCommit = () => {
        // Logic to handle commit submission
        // For now, let's just close the commit popup and clear the commit message
        props.onCommit(commitMessage);
        setCommitMessage('');
        console.log('Commit message:', commitMessage);
        props.onClose();
    };

    return (
        <Modal basic open={props.open} onClose={props.onClose}>
            <Modal.Header>Add Commit</Modal.Header>
            <Modal.Content>
                <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Enter commit message..."
                    rows={4}
                    style={{ width: '100%', resize: 'none', fontSize: '20px' }}
                />
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
