import { h } from 'preact'
import { Link } from 'preact-router'
import { probeVMCached } from 'ts/logic/vmlist.ts'
import { UserPill } from './user-pill.tsx'
import "./vm-list.scss"

export const VMListEntry = (p: {url: string,  vm: Awaited<ReturnType<typeof probeVMCached>>}) =>  
  <Link href={"/vm/" + encodeURIComponent(p.url) + "/" + encodeURIComponent(p.vm?.id!)} class="vm-list-entry" data-vmid={p.vm.id}>
    <div class='thumb'>
      <img src={p.vm?.thumb} />
      <div class='cover'></div>
    </div>
    <div class='data'>
      <h3>{p.vm?.name ?? p.url}</h3>
      <div class='userList'>
        {p.vm.cvm.users.users.peek().map(u => <UserPill user={u} />)}
      </div>

    </div>
  </Link>