import React, { useState } from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import Web3 from 'web3';
import AppFooter from '../AppFooter/AppFooter';
import AppNav from '../AppNav/AppNav';
import ENS from '../ENS/ENS';
import Home from '../Home/Home';
// import IAM from '../IAM/IAM';
import Login from '../Login/Login';
import MyIam from '../MyIAM/MyIAM';
import './App.css';

function App() {
  const allowedChain = ["volta"];
  const [web3, setWeb3] = useState<Web3>();
  const [account, setAccount] = useState<string>("");
  const [chain, setChain] = useState<string>("");

  const loggedIn = web3 !== undefined && account.length > 0 && allowedChain.includes(chain);

  return (
    <>
      <Router>
        <header>
          <AppNav account={account} chain={chain}></AppNav>
        </header>
        <main role="main" className="container-fluid">
          {loggedIn ?
            <Switch>
              <Route path="/ens" exact>
                <ENS web3={web3}></ENS>
              </Route>
              <Route path="/iam" exact>
                <MyIam account={account}></MyIam>
              </Route>
              <Route path="/" component={Home} />
            </Switch>
            :
            <Login web3={web3} chain={chain} setAccount={setAccount} setWeb3={setWeb3} setChain={setChain}></Login>
          }
        </main>
        <footer className="fixed-bottom">
          <AppFooter></AppFooter>
        </footer>
      </Router>
    </>
  );
}

export default App;
