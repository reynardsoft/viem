import { computed, signal } from "@preact/signals";
import { Messages, StoredUser } from "./types.ts";


export class ChatMerger {
    private _messageHistory = signal<Messages[]>([]);
    private _currentMessage = signal<Messages | null>(null);
    public messageHistory = computed<Messages[]>(() => [
        ...this._messageHistory.value, 
        ...(this._currentMessage.value ? [this._currentMessage.value] : [])
    ]);

    private canMerge(current: Messages | null, incoming: Messages) {
        if (this.forceNoMerge) {
            this.forceNoMerge = false;
            return false;
        }
        if (!current) return false;
        if (current.type !== incoming.type) return false;
        let nm = incoming as any;
        if (current.type === "chat" && current.author.id !== nm.author.id) return false;
        if (current.type === "user-rename" && current.user.id !== nm.user.id) return false;
        return true;
    }
    
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private forceNoMerge = false;

    private _addMessage<T extends Messages['type']>(
        type: T, 
        meta: Omit<Messages & {type: T}, 'type' | "messages">, 
        data:(Messages & {type: T})['messages'][number]
    ) {
        if (type == "user-rename") return; 
        // check if the new message can be merged with the current message
        let current = this._currentMessage.value;
        console.log(
            current,
            type,
            data
        )
        if (this.canMerge(current, {type, ...meta, messages: [data]} as any)) {
            // if so, add the message to the current message
            this._currentMessage.value = {
                ...current,
                messages: [...current!.messages, data] as any
            } as Messages & {type: T};
        } else if (
            type == "user-part" && 
            current?.type == "user-join" &&
            current.messages.find(x => x.user.id === (data as any).user.id)
        ) {
            // if the current message is a user-join message and the new message is a user-part message for the same user,
            // remove the current message
            let messages = current.messages.filter(x => x.user.id !== (data as any).user.id);

            if (messages.length === 0) {
                let prev = this._messageHistory.value;
                this._currentMessage.value = prev.pop() || null;
                this._messageHistory.value = prev;
            } else {
                this._currentMessage.value = {
                    ...current,
                    messages
                }

            }
        } else {
            // otherwise, add the current message to the message history and start a new message
            if (current) this._messageHistory.value = [
                ...this._messageHistory.value,
                current
            ];
            this._currentMessage.value = {
                type,
                ...meta,
                messages: [data]
            } as any;
        }
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.forceNoMerge = true, 15000);
    }

    serverChatted(message: string) {
        this._addMessage("server-chat", {timestamp: new Date()}, {message});
    }
    userChatted(author: StoredUser, message: string) {
        this._addMessage("chat", {author, timestamp: new Date()}, {message});
    }
    userJoined(user: StoredUser) {
        this._addMessage("user-join", {timestamp: new Date()}, {user});
    }
    userParted(user: StoredUser) {
        this._addMessage("user-part", {timestamp: new Date()}, {user});
    }
    userRenamed(user: StoredUser, oldName: string, newName: string) {
        this._addMessage("user-rename", {user, timestamp: new Date()}, {oldName, newName});
    }


}