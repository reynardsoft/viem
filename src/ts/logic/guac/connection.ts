import { EventEmitter } from "../eventemitter.ts";
import { guacDecode, guacEncode } from "./lineProtocol.ts";

/**
 * Low-level class for Guacamole connection.
 * Does not deal with any commands or responses, or any other high-level logic (like screen updates, input events, etc).
 */
class GuacConnection extends EventEmitter {
    public isClosed = false;
    constructor (private _sendMessage: (data: string) => void, private _close: () => void) { super(); }

    // Sends a command to the server
    sendCommand(opcode: string, ...args: string[]) {
        if ("GUAC_DEBUG" in window) console.debug("Sending command", opcode, args);
        if (this.isClosed) throw new Error("Connection is closed");
        return this._sendMessage(guacEncode(opcode,...args))
    }
    // Waits for a command from the server
    await(opcode: string, timeout?: number) {
        return new Promise<string[]>((a,r) => {
            this.once(opcode, (...args: string[]) => a(args));
            this.once("close", () => r(new Error("Connection closed.")));
            if (timeout) setTimeout(() => r(new Error("Timeout")), timeout);
        })
    }


    // Close the connection
    close() { this._close(); }

    // Call when the connection is closed
    _onClose() {
        this.isClosed = true;
        this.emit("close");
    }

    // Call when a message is received
    _onMessage(data: string) {
        let commands = guacDecode(data);
        for (let command of commands) {
            if ("GUAC_DEBUG" in window && !(["png","sync","nop"].includes(command[0]))) console.debug("Received command", command);
            this.emit(command[0], ...command.slice(1));
        }
    }
}
export type GuacConn = GuacConnection;

/**
 * Connect to a Guacamole server via WebSocket.
 * @param url The URL of the Guacamole server. (must be ws:// or wss://)
 */
function connectGuacWS(url: string): Promise<GuacConnection> {
    return new Promise((a,r) => {
        let socket = new WebSocket(url, "guacamole");
        socket.onopen = () => {
            let conn = new GuacConnection(
                (data) => socket.send(data),
                () => socket.close()
            );
            socket.onerror = () => conn._onClose();
            socket.onclose = () => conn._onClose();
            socket.onmessage = (ev) => conn._onMessage(ev.data);
            a(conn);
        }
        socket.onerror = () => r(new Error("WebSocket connect fail."));
        socket.onclose = (ev) => {
            if (ev.code !== 1000 || !ev.reason) r(new Error("WebSocket closed with error code " + ev.code + ": " + ev.reason));
            else r(new Error("WebSocket closed"));
        }
    })
}

/**
 * Connect to a Guacamole server.
 * This function exists to abstract the connection method, for example, to support other protocols in the future.
 * Or, to support wrapping the connection in a proxy, etc.
 * @param url The URL of the Guacamole server. 
 */
export function connectToGuac(url: string) {
    let parsed = new URL(url);
    switch (parsed.protocol) {
        case "ws:":
        case "wss:":
            return connectGuacWS(url);
        default:
            throw new Error("Unsupported protocol " + parsed.protocol);
    }
}