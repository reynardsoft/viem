import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { CollabVM } from "ts/logic/cvm/cvm.ts";

export const VMScreen = ({vm}: {vm: CollabVM}) => {
    let canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        if (!vm) return;
        vm?.renderer.switch(canvasRef.current!);
        return ()=> {
          if (vm?.renderer.canvas === canvasRef.current) vm.renderer.switch();
        }
    },[vm, canvasRef.current]);

    function getMousePosition(e: MouseEvent) {
        let canv = canvasRef.current!;
        let rect = canv.getBoundingClientRect();
        let x = (e.clientX - rect.left) * (canv.width / rect.width);
        x = Math.min(canv.width, Math.max(0, x));
        let y = (e.clientY - rect.top) * (canv.height / rect.height);
        y = Math.min(canv.height, Math.max(0, y));
        return {x, y};
    }

    function handleMouseMove(e: MouseEvent) {
        let {x, y} = getMousePosition(e);
        console.log("BUTTONS", e.buttons);
        vm.updateMouse(x, y, e.buttons);
    }

    return <div class='screen' 
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseMove}
        onMouseUp={handleMouseMove}
    >
        <canvas ref={canvasRef} />
    </div>
}