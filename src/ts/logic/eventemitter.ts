export class EventEmitter {
    private handlers: Map<string, Set<(...args: any[]) => void>> = new Map()
    on(event: string, handler: (...args: any[]) => void) {
        let handlers = this.handlers.get(event);
        if (!handlers) this.handlers.set(event, handlers = new Set());
        handlers.add(handler);
    }
    once(event: string, handler: (...args: any[]) => void) {
        let wrapped = (...args: any[]) => {
            handler(...args);
            this.off(event, wrapped);
        }
        this.on(event, wrapped);
    }
    off(event: string, handler: (...args: any[]) => void) {
        let handlers = this.handlers.get(event);
        if (!handlers) return;
        handlers.delete(handler);
    }
    emit(event: string, ...args: any[]) {
        let handlers = this.handlers.get(event);
        if (!handlers) return;
        handlers.forEach(handler => queueMicrotask(() => handler(...args)));
    }
}