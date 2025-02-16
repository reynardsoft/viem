import { computed } from '@preact/signals';
import { Fragment, h } from 'preact';
import { Awaited, Promise } from 'ts/components/util/awaited.ts';
import { VMListEntry } from 'ts/components/vm-list.tsx';
import { availableVms, probeVMCached } from 'ts/logic/vmlist.ts';

const VMRow = (p: {vm: string}) => <Promise promise={probeVMCached(p.vm)}>{(error, vm) => !vm ? <></> : 
  <VMListEntry vm={vm} url={p.vm} />
}</Promise>

const VMRepo = (p: {name: string, vms: Promise<string[]>}) => <details open>
  <summary>{p.name}</summary>
  <div class='vms'>
    <Awaited 
      error={(error) => <p>{error.toString()}</p>}
      loading={() => <p>Loading...</p>}
      promise={p.vms}>{
        vms => vms.map(v => <VMRow vm={v} />)
    }</Awaited>
  </div>
</details>

const VMList = () => {
  return (
      <div class="vm-list">
        <h1>VM List</h1>
        <p>By connecting to any of the below VMs, you agree to follow <a href="https://computernewb.com/collab-vm/rules/">the rules</a>.</p>
        {computed(() => Object.entries(availableVms.value).map(([repo,vms]) => <VMRepo name={repo} vms={vms} />))}
      </div>
  );
}
export default VMList;