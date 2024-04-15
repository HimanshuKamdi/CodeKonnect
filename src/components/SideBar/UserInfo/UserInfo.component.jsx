import React from 'react';
import { Grid, Header, Icon, Image, Dropdown } from 'semantic-ui-react';
import { connect } from "react-redux";
import firebase from '../../../firebase';
import CustomIcon from '../../../components/SideBar/UserInfo/image/logo3.png';
import { setUser, setUsers, setChannel } from "../../../store/actioncreator";

import "./UserInfo.css";

const connectedRef = firebase.database().ref(".info/connected");

const statusRef = firebase.database().ref("status");


const UserInfo = (props) => {


    const getDropDownOptions = () => {
        return [{
            key: 'signout',
            text: <span onClick={signOut} >Sign Out</span>
        }]
    }

    const signOut = () => {
        connectedRef.on("value", snap => {
            if (props.user && snap.val()) {
                const userStatusRef = statusRef.child(props.user.uid);
                userStatusRef.remove();
            }
        })
        firebase.auth()
            .signOut()
            .then(() => {
                console.log("user signed out");
                window.location.reload();
            }
            );
        setChannel(null);
        setUser(null);
    }

    if (props.user) {
        return (<Grid>
            <Grid.Column>
                <Grid.Row className="userinfo_grid_row">
                    <Header inverted as="h2">
                        <img src={CustomIcon} alt="Icon" />
                        <Header.Content>CodeKonnect</Header.Content>


                    </Header>
                    <Header className="userinfo_displayname" inverted as="h4">
                        <Dropdown
                            trigger={
                                <span>
                                    <Image src={props.user.photoURL} avatar></Image>
                                    {props.user.displayName}
                                </span>
                            }
                            options={getDropDownOptions()}
                        >
                        </Dropdown>

                    </Header>
                </Grid.Row>
            </Grid.Column>
        </Grid>)
    }
    return null;
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
        setUsers: (users) => { dispatch(setUsers(users)) },
        setChannel: (users) => { dispatch(setChannel(users)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserInfo);