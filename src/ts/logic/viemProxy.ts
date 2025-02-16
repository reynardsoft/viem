import { VMRepo } from "./vmlist.ts";

async function getVms(host: string) {
    console.log("Reading VMs from ViemProxy host at", host)
    const ws = new WebSocket(host);
    return new Promise<string[]>((resolve, reject) => {
        ws.onerror = (ev) => reject(new Error("WebSocket connect fail."));
        let gotData = false;
        ws.onmessage = (ev) => {
            ws.close();
            let data = JSON.parse(ev.data);
            gotData = true;
            resolve(data.map((vm: string) => host + "proxy?target=" + encodeURIComponent(vm) ));
        }
        ws.onclose = (ev) => {
            if (ev.code !== 1000 || !gotData) 
                return reject(new Error("WebSocket closed with error code " + ev.code + ": " + ev.reason));
        }
    })
}

export const ViemProxyRepo = (name: string, url: string): VMRepo => ({
    name, getVMs: () => getVms(url)
})