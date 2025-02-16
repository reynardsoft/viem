import { Signal } from "@preact/signals";

export type CVMUserRole = 'guest' | 'user' | 'admin' | 'moderator';

export interface CVMUser {
    name: string,
    role: CVMUserRole
}

export interface CVMProbeResponse {
    id: string,
    name: string,
    thumb: string
}


export type ViemAuthState = "anonymous" | "requested" | "authenticated"




export type BaseMessages = { timestamp: Date, type: string };
export type ChatMessages = BaseMessages & { type: "chat", author: StoredUser, messages: { message: string }[] };
export type UserJoinMessages = BaseMessages & { type: "user-join", messages: { user: StoredUser }[] };
export type UserPartMessages = BaseMessages & { type: "user-part", messages: { user: StoredUser }[] };
export type UserRenameMessages = BaseMessages & { type: "user-rename", user: StoredUser, messages: { oldName: string; newName: string }[] };
export type ServerMessages = BaseMessages & { type: "server-chat", messages: { message: string }[] };
export type Messages = ChatMessages | UserJoinMessages | UserPartMessages | UserRenameMessages | ServerMessages;
export type StoredUser = {
    id: number
    name: Signal<string>,
    role: Signal<CVMUserRole>
    country: Signal<string | null>,
}