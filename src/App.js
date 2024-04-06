import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';

import Homepage from './components/Homepage/homepage';
// import Profile from './components/Profile/profile';
// import Editorpage from './components/Editor/editor';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={Homepage} />
          {/* <Route path="/profile" component={Profile} /> */}
          {/* <Route path="/code/:filename" component={Editorpage} /> */}
        </Switch>
      </div>
    </Router>
  );
}

export default App;
