import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { ButtonWithLoading } from "./partOne";
import { InputWithHttpGet } from "./partTwo";
import { MultipleInput } from "./partThree";

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/part-one">Part One</Link>
            </li>
            <li>
              <Link to="/part-two">Part Two</Link>
            </li>
            <li>
              <Link to="/part-three">Part Three</Link>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path="/part-one">
            <ButtonWithLoading />
          </Route>
          <Route path="/part-two">
            <InputWithHttpGet />
          </Route>
          <Route path="/part-three">
            <MultipleInput />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
