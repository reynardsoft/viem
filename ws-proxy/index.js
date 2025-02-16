const WebSocket = require("ws");
const AllowedHosts = [
    "wss://computernewb.com/collab-vm/vm0",
    "wss://computernewb.com/collab-vm/vm1",
    "wss://computernewb.com/collab-vm/vm2",
    "wss://computernewb.com/collab-vm/vm3",
    "wss://computernewb.com/collab-vm/vm4",
    "wss://computernewb.com/collab-vm/vm5",
    "wss://computernewb.com/collab-vm/vm6",
    "wss://computernewb.com/collab-vm/vm7",
    "wss://computernewb.com/collab-vm/vm8",
];
const Origin = "https://computernewb.com";

/**
 * 
 * @param {WebSocket} ws 
 * @param {string} target 
 */
function startProxy(ws,target) {
    let buffer = [];
    const bufferHandler = (data,isBinary) => 
        buffer.push([data,isBinary]);

    ws.on("message", bufferHandler);
    ws.on("close", () => {
        ws.off("message", bufferHandler);
        buffer = null;
    });

    const proxied = new WebSocket(target, ws.protocol, {
        origin: Origin,
        autoPong: false
    })
    proxied.on("open", () => {
        buffer.forEach(([data,binary]) => 
            proxied.send(data, { binary }));
        buffer = null;
        ws.off("message", bufferHandler);
        ws.on("message", (data,binary) => proxied.send(data, { binary }));
    });
    proxied.on("message", (data,binary) => ws.send(data, { binary }));
    proxied.on("close", (code,reason) => ws.close(1014,reason));
    proxied.on("error", (err) => ws.close(1014, err.message));
    ws.on("close", (code,reason) =>  proxied.close(1014,reason));
    ws.on("error", (err) => proxied.close(1014, err.message));
    
}

const wss = new WebSocket.Server({ port: parseInt(process.env.PORT) || 5138, autoPong: false });
wss.on("connection", async (ws, req) => {
    let url = new URL(req.url, "inv://alid");
    if (url.pathname === "/") {
        ws.send(JSON.stringify(AllowedHosts));
        ws.close(1000);
    } else if (url.pathname === "/proxy") {
        let target = url.searchParams.get("target");
        if (!AllowedHosts.includes(target)) 
            return ws.close(3003, "Connections to that URL are not allowed by this proxy.");

        startProxy(ws, target);
    } else {
        ws.close(1003, "Not found");
    }



})
