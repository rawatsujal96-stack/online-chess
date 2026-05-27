import './css/App.css'
import { Header, Icon } from 'semantic-ui-react'
import { BrowserRouter as Router, Route } from "react-router-dom"
import NewGamePopup from './NewGamePopup'
import JoinGamePopup from './JoinGamePopup'
import ChessBoard from './ChessBoard'

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="main ui">
        <Route path="/game">
          <Header as='h2' inverted style={{ display: "flex", justifyContent: "center", paddingTop: "10px" }} textAlign="left">
            <Icon name='chess' />
            <Header.Content>
              Online Chess
              <Header.Subheader>Play Chess Online with your friends!</Header.Subheader>
            </Header.Content>
          </Header>

        </Route>
       <Route path="/" exact>
  <div className="home-container">
    <div className="home-card">

      <div className="logo-icon">♔ ♜</div>

      <h1 className="main-title">ONLINE CHESS</h1>

      <p className="subtitle">
        Play Chess Online with your friends!
      </p>

      <div className="button-group">
        <NewGamePopup />
        <JoinGamePopup />
      </div>

    </div>
  </div>
</Route>
        <Route path="/game" component={ChessBoard} />
      </div>
    </Router>
  );
}

export default App;
