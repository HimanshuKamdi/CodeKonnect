// App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, withRouter, useHistory } from 'react-router-dom';
import './App.css';
import Homepage from './components/Homepage/homepage';
import Editorpage from './components/Editor/editorpage';
import Login from "./components/Auth/Login/Login.component";
import Register from "./components/Auth/Register/Register.component";
import Files from "./components/Files/files";
import firebase from "./firebase";
import { connect } from "react-redux";
import { setUser, setUsers } from "./store/actioncreator";
import { AppLoader } from "./components/AppLoader/AppLoader.component";

const App = (props) => {
  const history = useHistory();
  console.log("App.js",props)
  const usersRef = firebase.database().ref("users");

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        props.history.push("/");
        console.log("User is logged in", props.user)
      } else {
        props.setUser(null);
        console.log("User is not logged in", props.user)
        props.history.push("/login");
      }
      usersRef.once("value")
        .then(snapshot => {
          var allUsers = [];
          snapshot.forEach(childSnapshot => {
            const userData = childSnapshot.val();
            const uid = childSnapshot.key;
            const userWithUid = { ...userData, uid };
            allUsers.push(userWithUid);
            if (user && user.uid === uid) {
              props.setUser(userWithUid);
            }
          });
          props.setUsers(allUsers);
        })
        .catch(error => {
          console.error("Error fetching users:", error);
        });
    })
  }, []);

  useEffect(() => {
    if (!props.channel || !props.user) {
      props.history.push('/');
    }
  }, [props.channel, props.user]);

return (
    <div className="App">
      {/* <AppLoader loading={props.loading && props.location.pathname === "/"} /> */}
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/code/:repoName/:filePath*" component={Editorpage} />
        <Route path="/files/:channelname" component={Files} />
        <Route path="/" component={Homepage} />
      </Switch>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    user: state.user.currentUser,
    users: state.users.allUsers,
    loading: state.channel.loading
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setUser: (user) => { dispatch(setUser(user)) },
    setUsers: (users) => { dispatch(setUsers(users)) }
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
