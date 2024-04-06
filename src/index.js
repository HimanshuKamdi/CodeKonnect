import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Provider } from "react-redux";
import { createStore } from "redux";
import { combinedReducers } from "./store/reducer";
import { BrowserRouter as Router} from 'react-router-dom';


import "semantic-ui-css/semantic.min.css"

const store = createStore(combinedReducers)

ReactDOM.render(
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>,
  document.getElementById('root')
);

serviceWorker.unregister();
