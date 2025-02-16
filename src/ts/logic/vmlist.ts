import { computed, signal } from "@preact/signals";
import { CollabVM } from "./cvm/cvm.ts";
import { ViemProxyRepo } from "./viemProxy.ts";

export interface VMRepo {
    name: string,
    getVMs: () => Promise<string[]>
}
export const vmRepos = signal({
    localProxy: ViemProxyRepo("Available VMs",localStorage.getItem("proxy-host") || "ws://localhost:5138/"),
} satisfies Record<string, VMRepo>);

let repoPromises: Record<string, Promise<string[]>> = {};
export const availableVms = computed(() => {
    const repos = vmRepos.value;
    let vms: Partial<Record<keyof typeof repos, Promise<string[]>>> = {};
    for (const [name, repo] of Object.entries(repos)) {
        if (!repoPromises[name]) repoPromises[name] = repo.getVMs();
        vms[name as keyof typeof repos] = repoPromises[name];
    }
    console.log({vms});
    return vms as Record<keyof typeof vmRepos.value, Promise<string[]>>;  
});

let cachedProbes: Record<string, ReturnType<typeof CollabVM.probe>> = {};
export function probeVMCached(url: string) {
    if (!cachedProbes[url]) cachedProbes[url] = CollabVM.probe(url);
    return cachedProbes[url];
}