import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter as Router, Switch, Route, withRouter } from "react-router-dom";
import { Provider, connect } from "react-redux";
import { createStore } from "redux";
import Register from "./components/Auth/Register/Register.component";
import Login from "./components/Auth/Login/Login.component";
import firebase from "./server/firebase";
import { combinedReducers } from "./store/reducer";
import { setUser, setUsers } from "./store/actioncreator";
import { AppLoader } from "./components/AppLoader/AppLoader.component";

import "semantic-ui-css/semantic.min.css"

const store = createStore(combinedReducers)

const usersRef = firebase.database().ref("users");

const Index = (props) => {

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // props.setUser(user);
        props.history.push("/");
      } else {
        props.setUser(null);
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
            if(user && user.uid === uid) {
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

  // console.log("Current User", props.currentUser);

  return (<>
    {/* <AppLoader loading={props.loading && props.location.pathname === "/"} /> */}
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={App} />
    </Switch></>)
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



const IndexWithRouter = withRouter(connect(mapStateToProps, mapDispatchToProps)(Index));

ReactDOM.render(
    <Provider store={store}>
      <Router>
        <IndexWithRouter />
      </Router>
    </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
