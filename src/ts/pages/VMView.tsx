import { useComputed } from '@preact/signals';
import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Chat } from 'ts/components/chat.tsx';
import { UserPill } from 'ts/components/user-pill.tsx';
import { VMScreen } from 'ts/components/vm-screen.tsx';
import { CollabVM } from 'ts/logic/cvm/cvm.ts';
import { DateTime } from 'ts/logic/datetime.tsx';
import "./vmview.scss";

const VMView = (p: {uri: string, vmname: string}) => {
  let [vm, setVm] = useState<CollabVM>()
  useEffect(() => {
    if (!vm) CollabVM.connect(p.uri, p.vmname)
      .then((vm) => {
        vm.onClose(() => { setVm(undefined); route('/') });
        setVm(vm);
      })
      .catch((error) => {
        setVm(undefined);
        alert("An error occurred while connecting to the VM: " + error);
        route('/');
      });
    
    return () => vm?.close();
  }, [p.uri, p.vmname]);

  let canvasRef = useRef<HTMLCanvasElement>(null);
  

  console.log(vm);
  return (
      <div id="vm-view">
        {!vm ? <h1>Connecting...</h1> : <>
          <VMScreen vm={vm} />
          <div class='controls'>
            <div class='takeTurn'>
              {useComputed(() => vm.turnQueue.value.findIndex(u => u.id === vm.user.value!.id) == -1 ?
                <button onClick={() => vm.requestTurn()}>Request Turn</button> :
                <button onClick={() => vm.endTurn()}>End Turn</button>
              )}
              
              
              
              {useComputed(()=> vm.turnEstimate.value ? <p>Next turn <DateTime date={vm.turnEstimate.value!} /></p> : <p>No turn estimate</p>)}
              {useComputed(() => vm.turnEndTimestamp.value ? <p>Turn ends <DateTime date={vm.turnEndTimestamp.value!} /></p> : <p>No turn end time</p>)}
              <div class='queue'>
                {useComputed(() => vm.turnQueue.value.map(u => <UserPill key={u.id} user={u} />))}
              </div>
            </div>
            <div class='reset'>
              {useComputed(() => vm.voteActive.value ? <>
                <p><DateTime date={vm.voteTimeRemaining.value!} /></p>
                <p>Ayes: {vm.voteAffirmativeVotes.value} &bull; Nays: {vm.voteNegativeVotes.value}</p>
                <button onClick={() => vm.voteAffirmative()}>Aye</button>
                <button onClick={() => vm.voteNegative()}>Nay</button>
              </> : <button onClick={() => vm.voteAffirmative()}>Vote for reset</button>)}
            </div>
          </div>

          <div class='chat'>
            <div class='users-shelf'>
              {useComputed(() => vm.users.users.value.map(u => <UserPill key={u.id} user={u} />))}
            </div>
            <Chat messages={vm.chat.messageHistory} />
          </div>

        </>}
        
      </div>
  );
}
export default VMView;