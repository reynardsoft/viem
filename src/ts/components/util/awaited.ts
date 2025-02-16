import { ComponentChildren, h } from "preact";
import { PureComponent } from "preact/compat";

interface Props<T> {
    promise: Promise<T>
    loading?: () => ComponentChildren;
    error?: (error: Error) => ComponentChildren
    children: (result: T) => ComponentChildren
}

interface State<T> {
    result: T | Error,
    status: -1 | 0 | 1;
}
export class Awaited<T> extends PureComponent<Props<T>, State<T>> {
    await(prom: Promise<T>) {
        let comp = this;
        ;(async () => await prom)()
            .then((result) => {
                if (comp.props.promise !== prom) return;
                comp.setState({ status: 1, result })
            })
            .catch((result) => {
                if (comp.props.promise !== prom) return;
                comp.setState({ status: -1, result })
            })
    }

    componentWillMount(): void { this.await(this.props.promise); }
    componentWillReceiveProps(nextProps: Readonly<Props<T>>, nextContext: any): void {
        this.await(nextProps.promise);
    }

    render() {
        if (this.state.status == -1) return this.props.error?.(this.state.result as Error) ?? (this.state.result as Error).toString();
        else if (this.state.status == 1) return this.props.children(this.state.result as T);
        else return this.props.loading?.();
    }

}

export const Promise = <T>(p: {promise: Promise<T>, children: (error: Error | undefined, result: T | undefined) => ComponentChildren}) => 
    h(Awaited<T>, {
        promise: p.promise, 
        children: (result) => p.children(undefined, result),
        error: (error) => p.children(error, undefined),
        loading: () => p.children(undefined, undefined)
    });