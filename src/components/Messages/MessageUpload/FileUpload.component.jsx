import React, { useState } from 'react';
import { Input, Modal, Button, Icon } from 'semantic-ui-react';

export const FileUpload = (props) => {
    const [fileState, setFileState] = useState(null);

    const onFileAdded = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileState(file);
        }
    }

    const submit = () => {
        if (fileState) {
            props.uploadFile(fileState);
            props.onClose();
            setFileState(null);
        }
    }

    return (
        <Modal basic open={props.open} onClose={props.onClose}>
            <Modal.Header>Select a file</Modal.Header>
            <Modal.Content>
                <Input
                    type="file"
                    name="file"
                    onChange={onFileAdded}
                    fluid
                    label="Choose File"
                />
            </Modal.Content>
            <Modal.Actions>
                <Button color="green" onClick={submit}>
                    <Icon name="checkmark" />Add
                </Button>
                <Button color="red" onClick={props.onClose}>
                    <Icon name="remove" />Cancel
                </Button>
            </Modal.Actions>
        </Modal>
    );
}