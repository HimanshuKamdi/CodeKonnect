import React from 'react';
import { Comment,Image } from "semantic-ui-react";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

import "./MessageContent.css";

TimeAgo.locale(en);


const timeAgo = new TimeAgo();

const MessageContent = (props) => {

    return <Comment className={props.ownMessage ? "ownContent" : "otherMessage"}>
        {!props.ownMessage ? (<Comment.Avatar src={props.message.user.avatar} />): null}
        <Comment.Content className={props.ownMessage ? "ownMessage" : "otherMessage"}>
            <Comment.Author as="a">{props.message.user.name}</Comment.Author>
            <Comment.Metadata>{timeAgo.format(props.message.timestamp)}</Comment.Metadata>
            {props.message.image ? <Image onLoad={props.imageLoaded} src={props.message.image} /> :
                <Comment.Text>{props.message.content}</Comment.Text>
            }
            {props.message.fileName ? <a href={""} download={props.message.fileName}>{props.message.fileName}</a> :
                <Comment.Text>{props.message.fileName}</Comment.Text>
            }
        </Comment.Content>
    </Comment>
}

export default MessageContent;