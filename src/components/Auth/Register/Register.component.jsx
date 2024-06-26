import React, { useState } from 'react';
import { Grid, Form, Segment, Header, Button, Message } from 'semantic-ui-react'
import firebase from '../../../firebase';
import CustomIcon from '../../SideBar/UserInfo/image/black_logo.png';

import "../Auth.css";
import { Link } from 'react-router-dom';
import loginImg from './login_image.avif';

const Register = () => {

    let user = {
        userName: '',
        email: '',
        password: '',
        confirmpassword: ''
    }

    let errors = [];

    let userCollectionRef = firebase.database().ref('users');

    const [userState, setuserState] = useState(user);
    const [errorState, seterrorState] = useState(errors);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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
        else if (!checkPassword()) {
            return false;
        }
        return true;
    }

    const isFormEmpty = () => {
        return !userState.userName.length ||
            !userState.password.length ||
            !userState.confirmpassword.length ||
            !userState.email.length;
    }

    const checkPassword = () => {
        if (userState.password.length < 8) {
            seterrorState((error) => error.concat({ message: "Password length should be greater than 8" }));
            return false;
        }
        else if (userState.password !== userState.confirmpassword) {
            seterrorState((error) => error.concat({ message: "Password and Confirm Password does not match" }));
            return false;
        }
        return true;
    }

    const onSubmit = (event) => {
        seterrorState(() => []);
        setIsSuccess(false);
        if (checkForm()) {
            setIsLoading(true);
            firebase.auth()
                .createUserWithEmailAndPassword(userState.email, userState.password)
                .then(createdUser => {
                    setIsLoading(false);
                    updateuserDetails(createdUser);
                    firebase.auth().signOut();
                })
                .catch(serverError => {
                    setIsLoading(false);
                    seterrorState((error) => error.concat(serverError));
                })

        }
    }

    const updateuserDetails = (createdUser) => {
        if (createdUser) {
            setIsLoading(true);
            createdUser.user
                .updateProfile({
                    displayName: userState.userName,
                    photoURL: `http://gravatar.com/avatar/${createdUser.user.uid}?d=identicon`
                })
                .then(() => {
                    setIsLoading(false);
                    saveUserInDB(createdUser);
                })
                .catch((serverError) => {
                    setIsLoading(false);
                    seterrorState((error) => error.concat(serverError));
                })
        }
    }


    const saveUserInDB = (createdUser) => {
        setIsLoading(true);
        userCollectionRef.child(createdUser.user.uid).set({
            displayName: createdUser.user.displayName,
            photoURL: createdUser.user.photoURL
        })
            .then(() => {
                setIsLoading(false);
                setIsSuccess(true);
            })
            .catch(serverError => {
                setIsLoading(false);
                seterrorState((error) => error.concat(serverError));
            })
    }

    const formaterrors = () => {
        return errorState.map((error, index) => <h4 key={index}>{error.message}</h4>)
    }

    return (<Grid verticalAlign="middle" textAlign="center" className="grid-form" style={{ backgroundColor: 'white' }}>
        <Grid.Column width={8}>
            <img src={loginImg} alt="Login Image" />
        </Grid.Column>
        <Grid.Column width={8} style={{ maxWidth: '500px' }}>
            <Header icon as="h2">
                <img src={CustomIcon} style={{ height: "100px", width: "120px", marginTop: "20px" }} alt="Icon"  />
                <Header>
                    <span style={{ color: '#1a244a' }}>Register</span>
                </Header>
            </Header>
            <Form onSubmit={onSubmit}>
                <Segment stacked style={{ backgroundColor: '#ddedec' }}>
                    <Form.Input
                        name="userName"
                        value={userState.userName}
                        icon="user"
                        iconPosition="left"
                        onChange={handleInput}
                        type="text"
                        placeholder="User Name"
                    />
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
                    <Form.Input
                        name="confirmpassword"
                        value={userState.confirmpassword}
                        icon="lock"
                        iconPosition="left"
                        onChange={handleInput}
                        type="password"
                        placeholder="Confirm Password"
                    />
                </Segment>
                <Button disabled={isLoading} loading={isLoading} style={{ backgroundColor: '#3b969a' }}>Submit</Button>
            </Form>
            {errorState.length > 0 && <Message error className="error-message">
                {formaterrors()}
            </Message>
            }
            {isSuccess && <Message success style={{ backgroundColor: '#ddedec' }}>
                <h3>Successfully Registered</h3>
            </Message>
            }
            <Message style={{ backgroundColor: '#ddedec' }}>
                Already an User? <Link to="/login" >Login </Link>
            </Message>
        </Grid.Column>
        
    </Grid>)
}

export default Register;