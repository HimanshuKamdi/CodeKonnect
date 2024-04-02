import React, { useState } from 'react';
import { Grid, Form, Segment, Header, Icon, Button, Message, Image } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import google from './google.png';
import loginImg from './login_image.avif';

import firebase from '../../../server/firebase';
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import "../Auth.css"

const Login = () => {

    let user = {
        email: '',
        password: ''
    }

    let errors = [];

    const [userState, setuserState] = useState(user);
    const [isLoading, setIsLoading] = useState(false);
    const [errorState, seterrorState] = useState(errors);

    const handleInput = (event) => {
        let target = event.target;
        setuserState((currentState) => {
            let currentuser = { ...currentState };
            currentuser[target.name] = target.value;
            return currentuser;
        })
    }

    const checkForm = () => {
        if (isFormEmpty()) {
            seterrorState((error) => error.concat({ message: "Please fill in all fields" }));
            return false;
        }
        return true;
    }

    const isFormEmpty = () => {
        return !userState.password.length ||
            !userState.email.length;
    }

    const formaterrors = () => {
        return errorState.map((error, index) => <p key={index}>{error.message}</p>)
    }

    const onSubmit = (event) => {
        seterrorState(() => []);
        if (checkForm()) {
            setIsLoading(true);
            firebase.auth()
                .signInWithEmailAndPassword(userState.email, userState.password)
                .then(user => {
                    setIsLoading(false);
                    console.log(user);
                })
                .catch(error => {
                    setIsLoading(false);
                    if (error.code === "auth/internal-error") {
                        // User not found in the Firebase database
                        // Display a message to prompt the user to register
                        seterrorState(["Wrong Username OR Password.."]);
                    } else {
                        // Other errors
                        seterrorState((prevErrors) => prevErrors.concat(error.message));
                    }
                    console.log(error);
                    // seterrorState(["User not found. Please register."]);
                    // seterrorState((error) => error.concat(serverError));
                    
                })

        }
        else{
            formaterrors();
        }
    }

    const handleSignInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                setIsLoading(false);
                const user = result.user;
    
                const userRef = firebase.database().ref('users/' + user.uid);
                userRef.once('value')
                    .then((snapshot) => {
                        if (!snapshot.exists()) {
                            userRef.set({
                                displayName: user.displayName,
                                photoURL: user.photoURL
                            })
                            
                            .catch((error) => {
                                seterrorState(prevErrors => [...prevErrors, error]);
                            });
                        } 
                    })
                    .catch((error) => {
                        seterrorState(prevErrors => [...prevErrors, error]);
                    });
            })
            .catch((error) => {
                setIsLoading(false);
                console.error(error);
            });
    };

    const handleSignInWithFacebook = () => {
        setIsLoading(true);
        const provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider)
          .then((result) => {
            setIsLoading(false);
            console.log("Result", result);
            const user = result.user;
            console.log("User", user);
          })
          .catch((error) => {
            setIsLoading(false);
            console.error(error);
          });
    };

    return (
        <Grid verticalAlign="middle" textAlign="center" className="grid-form" style={{ backgroundColor: 'white' }}>
            <Grid.Column width={8} style={{ maxWidth: '400px' }}>
                <Header icon as="h2">
                    <Icon name="slack" />
                    <span style={{ color: '#1a244a' }}>Login</span>
                </Header>
                <Form onSubmit={onSubmit} >
                    <Segment stacked style={{ backgroundColor: '#ddedec' }}>
                        <Form.Input
                            name="email"
                            value={userState.email}
                            icon="mail"
                            iconPosition="left"
                            onChange={handleInput}
                            type="email"
                            placeholder="User Email"
                        />
                        <Form.Input
                            name="password"
                            value={userState.password}
                            icon="lock"
                            iconPosition="left"
                            onChange={handleInput}
                            type="password"
                            placeholder="User Password"
                        />
                    </Segment>
                    <Segment style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: '#ddedec' }}>
                        <div onClick={handleSignInWithGoogle} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", margin: "8px", border: "1px solid black", borderRadius: "10px", cursor:"pointer" }}>
                            <img src={google} alt="google" style={{ height: "20px", marginRight: "10px" }} />
                            <span>Signin with Google</span>
                        </div>
                        <div onClick={handleSignInWithFacebook} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", margin: "8px", border: "1px solid black", borderRadius: "10px", cursor:"pointer" }}>
                            <img src={google} alt="google" style={{ height: "20px", marginRight: "10px" }} />
                            <span>Signin with Facebook</span>
                        </div>
                    </Segment>
                    <Button disabled={isLoading} loading={isLoading} style={{ backgroundColor: '#3b969a' }}>Login</Button>
                </Form>
                {errorState.length > 0 && <Message error>
                    <h3>Errors</h3>
                    {formaterrors()}
                </Message>
                }
                <Message style={{ backgroundColor: '#ddedec' }}>
                    Not an User? <Link to="/register" >Register </Link>
                </Message>
            </Grid.Column>
            <Grid.Column width={8}>
                <img src={loginImg} alt="Icon Image" />
            </Grid.Column>
        </Grid>
    );

}

const mapStateToProps = (state) => {
    return {
      users: state.users.allUsers,
    }
  }
  
  const IndexWithRouter = withRouter(connect(mapStateToProps)(Login));

export default Login;
