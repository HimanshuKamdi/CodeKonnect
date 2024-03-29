import React, { useState } from 'react';
import { Grid, Form, Segment, Header, Icon, Button, Message } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import firebase from '../../../server/firebase';

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
            seterrorState((error) => error.concat(["Please fill in all fields" ]));
            return false;
        }
        return true;
    }

    const isFormEmpty = () => {
        return !userState.password.length ||
            !userState.email.length;
    }

    const formaterrors = () => {
        return errorState.map((error, index) => <h3 key={index}>{error}</h3>)
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

    return <Grid verticalAlign="middle" textAlign="center" className="grid-form" >
        <Grid.Column style={{ maxWidth: '500px' }}>
            <Header icon as="h2">
                <Icon name="slack" />
            Login
        </Header>
            <Form onSubmit={onSubmit}>
                <Segment stacked>
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
                <Button disabled={isLoading} loading={isLoading}>Login</Button>
            </Form>
            {errorState.length > 0 && <Message error>
                {/* <h3>Errors</h3> */}
                {formaterrors()}
            </Message>
            }
            <Message>
                Not an User? <Link to="/register" >Register </Link>
            </Message>
        </Grid.Column>
    </Grid>
}

export default Login;