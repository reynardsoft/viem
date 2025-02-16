
function getOffscreenCanvas(w: number,h: number) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(w,h);
    } else {
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }
}
export class CVMRenderer {
    canvas = getOffscreenCanvas(1,1);
    private ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    resize(width: number, height: number) {
        if (width === this.canvas.width && height === this.canvas.height) return;
        let id = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.putImageData(id,0,0);
    }

    switch(newCanvas: HTMLCanvasElement | OffscreenCanvas = getOffscreenCanvas(this.canvas.width,this.canvas.height)) {
        console.log("Switching renderer canvas", newCanvas);
        newCanvas.width = this.canvas.width;
        newCanvas.height = this.canvas.height;
        let id = this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
        this.ctx.reset();
        this.canvas = newCanvas;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx.putImageData(id,0,0);
    }
    private renderQueue: [number, number, string][] = [];
    private rendering = false;

    private async doRender() {
        if (this.renderQueue.length === 0) {
            this.rendering = false;
            return;
        }
        this.rendering = true;
        let [dx, dy, image] = this.renderQueue.shift()!;
        try {
            let img = new Image();
            await new Promise((res,rej) => {
                img.onload = res;
                img.onerror = rej;
                img.src = "data:image/jpeg;base64," + image;
            })
            this.ctx.drawImage(img,dx,dy);
        } catch (e) {
            console.error("Failed to render image", e);
        } finally {
            this.doRender();
        }
    }
    render(dx: number, dy: number, image: string) {
        this.renderQueue.push([dx,dy,image]);
        if (!this.rendering) this.doRender();
    }
}