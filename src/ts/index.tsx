import { Fragment, h, render } from 'preact';
import AsyncRoute from 'preact-async-route';
import Router from 'preact-router';
const App = () => {
    return <>
        <Router>
            <AsyncRoute path="/"
                getComponent={() => import('./pages/VMList.tsx').then(module => module.default)} />

            <AsyncRoute path="/vm/:uri/:vmname"
                getComponent={() => import('./pages/VMView.tsx').then(module => module.default)} />
                
                
            <div id="not-found" default>
                <h1>No route matched</h1>
            </div>
        </Router>
    </>
}
render(<App />, document.getElementById('app')!);