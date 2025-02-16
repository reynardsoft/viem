import { signal } from "@preact/signals";
import { GuacConn, connectToGuac } from "../guac/connection.ts";
import { hashCode } from "../util.ts";
import { ChatMerger } from "./chatMerger.ts";
import { CVMRenderer } from "./renderer.ts";
import { CVMProbeResponse, CVMUser, StoredUser } from "./types.ts";
import { UserStore } from "./userStore.ts";


const CVMUserRoleMapping = {
    '0': 'guest',
    '1': 'user',
    '2': 'admin',
    '3': 'moderator'
} as Record<string, CVMUser["role"]>;

export class CollabVM {
    renderer = new CVMRenderer();
    user = signal<StoredUser | null>(null);
    authenticationHost = signal<string | null>(null);
    userIsAuthenticated = signal(false);
    users = new UserStore();
    chat = new ChatMerger();
    canReset = signal<boolean | null>(null);
    connectionStatus = signal<"awaiting" | "connecting" | "connected">("awaiting");

    
    constructor(private conn: GuacConn, public selectedVM?: string) {
        this.conn.on("nop", this.handleNop.bind(this));
        this.conn.on("adduser", this.handleAddUser.bind(this));
        this.conn.on("remuser", this.handleRemUser.bind(this));
        this.conn.on("rename", this.handleRename.bind(this));
        this.conn.on("auth", this.handleAuth.bind(this));
        this.conn.on("login", this.handleLogin.bind(this));
        this.conn.on("disconnect", this.handleDisconnect.bind(this));
        this.conn.on("chat", this.handleChat.bind(this));
        this.conn.on("connect", this.handleConnect.bind(this));
        this.conn.on("png", this.handlePng.bind(this));
        this.conn.on("size", this.handleSize.bind(this));
        this.conn.on("turn", this.handleTurn.bind(this));
        this.conn.on("vote", this.handleVote.bind(this));
        this.conn.on("flag", this.handleFlag.bind(this));

        if (selectedVM) {
            this.conn.sendCommand("rename","viem-test");
        }
    }

    close() { this.conn.close(); }
    onClose(cb: () => void) { this.conn.on("close", cb); }

    // Get the data for the VM list
    async list(timeout = 10000) {
        this.conn.sendCommand("list");
        let [id,name,thumb] = await this.conn.await("list", timeout);
        return {id,name,thumb: "data:image/jpeg;base64," + thumb};
    }
    
    private doConnect() {
        if (!this.selectedVM) throw new Error("No VM selected")
        if (this.connectionStatus.value !== "awaiting") return;
        this.connectionStatus.value = "connecting";
        this.conn.sendCommand("connect", this.selectedVM);
    }

    private handleNop() { this.conn.sendCommand("nop"); }

    private handleDisconnect() {
        this.conn.close();
    }

    private handleConnect(status: "0" | "1", _: "1", canReset: "0" | "1", __: "0") {
        if (status == "0") {
            console.warn("Failed to connect to VM");
            this.close();
        } else {
            this.canReset.value = canReset === "1";
            this.connectionStatus.value = "connected";
        }
    }

    private handleAuth(url: string) {
        this.authenticationHost.value = url;
        this.userIsAuthenticated.value = false;
    }
    private handleLogin(succcess: string) {
        if (succcess === "1") this.userIsAuthenticated.value = true;
        else this.userIsAuthenticated.value = false;
    }


    private handleAddUser(count: string, ...data: string[]) {
        for (let i = 0; i < (parseInt(count) * 2); i += 2) {
            let name = data[i];
            let role = CVMUserRoleMapping[data[i+1]];
            let newUser = this.users.addUser(name, role);
            if (newUser) {
                console.debug("New user:", name, newUser.id);
                this.chat.userJoined(newUser);
            }
        }
    }
    private handleRemUser(count: string, ...data: string[]) {
        for (let i = 0; i < parseInt(count); i++) {
            let user = this.users.get(data[i]);
            console.debug("Removing user:", data[i], user);
            if (!user) return console.warn("Couldn't find user to remove:", data[i]);
            this.users.remUser(user.id);
            this.chat.userParted(user);
            let queue = [...this.turnQueue.value];
            let idx = queue.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                queue.splice(idx, 1);
                this.turnQueue.value = queue;
            }
            

        }
    }
    private handleRename(type: "0" | "1", ...args: string[]) {
        let user ;
        let newUsername;
        let newRole;
        if (type == "0") { // our username changed
            let [status, username, role] = args;
            console.debug("Our username changed:", username, role);
            user = this.user.value;
            newUsername = username;
            newRole = CVMUserRoleMapping[role];
            if (!user) {
                user = this.users.addUser(username, newRole);
                user = this.users.get(username);
                this.user.value = user!;                
                this.doConnect();
            }
        } else if (type == "1") { // someone else's username changed
            let [oldName, newName, role] = args;
            console.debug("User renamed:", oldName, newName, role);
            user = this.users.get(oldName);
            newUsername = newName;
            newRole = CVMUserRoleMapping[role];
        } else return console.warn("Unknown rename type:", type);
        if (!user) return console.warn("Couldn't find our user to rename:", args);
        let oldUsername = user.name.value;
        user.name.value = newUsername;
        let oldRole = user.role.value;
        user.role.value = CVMUserRoleMapping[newRole];
        if (oldUsername !== newUsername) this.chat.userRenamed(user, oldUsername, newUsername);
        if (oldRole !== newRole) this.chat.userRenamed(user, oldRole, newRole);
    }

    private handleFlag(...args: string[]) {
        for (var i = 0; i < args.length; i += 2) {
            let user = this.users.get(args[i]);
            if (!user) return console.warn("Couldn't find user to flag:", args[i]);
            user.country.value = args[i+1];
        }

    }

    private handleChat(...args: string[]) {
        for (let i = 0; i < args.length; i += 2) {
            let author = args[i];
            let message = args[i+1];
            if (author == "") {
                this.chat.serverChatted(message);
            } else {
                let user = this.users.get(author) || {id: -hashCode(author), name: signal(author), role: signal("guest"), country: signal(null)};
                this.chat.userChatted(user, message);
            }
        }
    }

    private handlePng(_: "0", __: "0", dx: string, dy: string, image: string) {
        this.renderer.render(parseInt(dx), parseInt(dy), image);
    }
    private handleSize(type: "0", width: string, height: string) {
        if (type !== "0") return;
        this.renderer.resize(parseInt(width), parseInt(height));
    }

    turnQueue = signal<StoredUser[]>([]);
    turnEndTimestamp = signal<Date | null>(null);
    turnEstimate = signal<Date | null>(null);
    private handleTurn(...args: string[]) {
        let endTime =  new Date(Date.now() + parseInt(args.shift()!));
        let turnQueue = [];
        let tqLength = parseInt(args.shift()!);
        for (var i = 0; i < tqLength; i++) {
            let un = args.shift()!;
            let user = this.users.getOrAdd(un);
            turnQueue.push(user);
        }
        if (!turnQueue.length) {
            this.turnEndTimestamp.value = null;
        } { 
            this.turnEndTimestamp.value = endTime;
        }
        this.turnQueue.value = turnQueue;
        let estimate = args.shift();
        if (estimate) this.turnEstimate.value = new Date(Date.now() + parseInt(estimate));
        else this.turnEstimate.value = null;
    }

    requestTurn() {
        this.conn.sendCommand("turn", "1");
    }
    endTurn() {
        this.conn.sendCommand("turn", "0");
    }

    voteActive = signal<boolean>(false);
    voteTimeRemaining = signal<Date | null>(null);
    voteAffirmativeVotes = signal<number>(0);
    voteNegativeVotes = signal<number>(0);
    private handleVote(status: "0" | "1" | "2" | "3", timeRemaining: string, affirmativeVotes: string, negativeVotes: string) {
        if (status == '0') {
            // vote is starting
        } else if (status == "1") { // update
            this.voteActive.value = true;
            this.voteTimeRemaining.value = new Date(Date.now() + parseInt(timeRemaining));
            this.voteAffirmativeVotes.value = parseInt(affirmativeVotes);
            this.voteNegativeVotes.value = parseInt(negativeVotes);
        } else if (status == "2") { // vote has ended
            this.voteActive.value = false;
            this.voteTimeRemaining.value = null;
            this.voteAffirmativeVotes.value = 0;
            this.voteNegativeVotes.value = 0;
        } else if (status === "3") { // error
            this.chat.serverChatted(timeRemaining); // this is actually the 'Vote is on cooldown' message
        }
            
    }
    voteAffirmative() {
        this.conn.sendCommand("vote", "1");
    }
    voteNegative() {
        this.conn.sendCommand("vote", "0");
    }

    _mouseX = 0;
    _mouseY = 0;
    _mouseButton = 0;
    _mouseDirty: ReturnType<typeof setTimeout> | null = null;
    _sendMouse() {
        if (this._mouseDirty) clearTimeout(this._mouseDirty);
        this.conn.sendCommand("mouse", 
            this._mouseX.toFixed(0),
            this._mouseY.toFixed(0),
            this._mouseButton.toString()
        );
        this._mouseDirty = null;
    }

    updateMouse(x: number, y: number, button: number) {
        if (this.turnQueue.peek()[0]?.id !== this.user.value?.id) return;
        if (this._mouseX === x && this._mouseY === y && this._mouseButton === button) return;
        this._mouseX = x;
        this._mouseY = y;
        if (this._mouseButton !== button) {
            this._mouseButton = button;
            this._sendMouse();
        } else if (this._mouseDirty == null ){
            this._sendMouse();
            this._mouseDirty = setTimeout(this._sendMouse.bind(this), 66);
        }

    }

    static async connect(url: string, vmname?: string) {
        return new CollabVM(await connectToGuac(url), vmname);
    }
    static async probe(url: string): Promise<CVMProbeResponse & { cvm: CollabVM }> {
        let cvm = await this.connect(url);
        let listResponse = await cvm.list();
        cvm.close();
        return { ...listResponse, cvm };
    }
}