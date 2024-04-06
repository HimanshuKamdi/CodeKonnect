import React, { useEffect, useState } from 'react';
import { SideBar } from "../SideBar/SideBar.component";
import Messages from "../Messages/Messages.component"
import { Menu, Icon, Modal, Button, Form, Segment } from 'semantic-ui-react';
import { BrowserRouter as Router, Switch, Route, withRouter } from "react-router-dom";
import { Provider, connect } from "react-redux";
import firebase from "../../server/firebase";
import { Grid } from 'semantic-ui-react';

const usersRef = firebase.database().ref("users");


function Homepage(props) {
  const [count, setCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [gitDetails, setGitDetails] = useState({ gitHubUsername: "", gitHubToken: "" });

  useEffect(() => {
    console.log("Homepage.js useEffect");
    if (count === 0 && props.user && !props.user.gitHub) {
      console.log("props", props.user);
      setModalOpen(true);
      setCount(count + 1);
      console.log("App.js useEffect count", count);
    }
  }, [props.user]);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const onSubmitDetails = () => {
    console.log("Submit Details");
    if (gitDetails.gitHubUsername && gitDetails.gitHubToken) {
      submitDetails();
      handleCloseModal();
    }
    else {
      alert("Fill all required details")
    }
  }

  const submitDetails = () => {
    usersRef.child(`${props.user.uid}/gitHub`).set(gitDetails)
    .then(() => {
      console.log("Git details saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving Git details: ", error);
    });
  }

  const handleInput = (e) => {

    let target = e.target;
    setGitDetails((currentState) => {
      let updatedState = { ...currentState };
      updatedState[target.name] = target.value;
      return updatedState;
    })
  }

  return (
    <>
      <Grid columns="equal">
        <SideBar />
        <Grid.Column className="messagepanel" style={{paddingLeft: "300px", marginRight: "20px"}}>
          <Messages />
        </Grid.Column>

      </Grid>
      <Modal open={modalOpen} onClose={handleCloseModal} size="small">
        <Modal.Header>
          Complete your profile
        </Modal.Header>
        <Modal.Content>
          <p>Give your Github details</p>
          <Form onSubmit={onSubmitDetails}>
            <Segment stacked>
              <Form.Input
                name="gitHubUsername"
                value={gitDetails.gitHubUsername}
                onChange={handleInput}
                type="text"
                placeholder="Enter your Github username"
              />
              <Form.Input
                name="gitHubToken"
                value={gitDetails.gitHubToken}
                onChange={handleInput}
                type="text"
                placeholder="Enter your github token"
              />
            </Segment>
          </Form>
          <p style={{ marginTop: "10px" }}>
            <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target='_blank' >How to generate Github personal access token</a>
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onSubmitDetails}>
            <Icon name="checkmark" /> Save
          </Button>
          <Button onClick={handleCloseModal}>
            <Icon name="remove" /> Later
          </Button>
        </Modal.Actions>
      </Modal>
    </>

  );
}

const mapStateToProps = (state) => {
  return {
    user: state.user.currentUser,
  }
}

export default connect(mapStateToProps)(Homepage);
