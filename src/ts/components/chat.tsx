import { ReadonlySignal } from "@preact/signals";
import DOMPurify from 'dompurify';
import { Fragment, h } from "preact";
import { ChatMessages, Messages, ServerMessages, UserJoinMessages, UserPartMessages, UserRenameMessages } from "ts/logic/cvm/types.ts";
import "./chat.scss";
import { UserPill } from "./user-pill.tsx";


const PurifiedHtml = ({children}: {children: string}) => {
    const purify = DOMPurify.sanitize;
    return <span dangerouslySetInnerHTML={{__html: purify(children)}}></span>    
}

const UserPartJoinMessage = ({m}: {m: (UserPartMessages | UserJoinMessages)}) => <div class='message meta' data-type={m.type}>
    
    <div class='author-container'>
        <i class="material-symbols">{m.type === "user-join" ? "person_add" : "person_remove"}</i>
    </div>
    <span class='chat-msgs'>
        <span>{m.messages.map(m => m.user.name).join(", ")}</span>
    </span>
</div>

const UserRenameMessage = ({m}: {m: (UserRenameMessages)}) => <div class='message meta' data-type={m.type}>
    <i class="material-symbols">badge</i>
    <span>{m.messages.map(m => m.oldName + " -> " + m.newName).join(", ")}</span>
</div>

const UserChatMessage = ({m}: {m: (ChatMessages)}) => <div class='message chat user' data-type={m.type}>
    <div class='author-container'>
        <UserPill user={m.author} />
    </div>
    <span class='chat-msgs'>
        {m.messages.map(m => <PurifiedHtml>{m.message}</PurifiedHtml>)}
    </span>
</div>
const ServerChatMessage = ({m}: {m: (ServerMessages)}) => <div class='message chat server' data-type={m.type}>
    <div class='author-container'>
        <i class="material-symbols">info</i>
    </div>
    <span class='chat-msgs'>
        {m.messages.map(m => <PurifiedHtml>{m.message}</PurifiedHtml>)}
    </span>
</div>

export const Chat = (props: {messages: ReadonlySignal<Messages[]>}) => 
    <div class='chat-view'>
        {props.messages.value.map(m => <Fragment key={m.type + m.timestamp.getTime()}>
            {
                m.type === "user-join" || m.type === "user-part" ? <UserPartJoinMessage m={m} /> :
                m.type === "user-rename" ? <UserRenameMessage m={m} /> :
                m.type === "chat" ? <UserChatMessage m={m} /> :
                m.type === "server-chat" ? <ServerChatMessage m={m} /> :
                <p class='invalid-message'>{JSON.stringify(m)}</p>
            }
        </Fragment>)}

    </div>