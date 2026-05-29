import React, { useEffect, useState, useRef } from 'react'
import WithMoveValidation from "./integrations/WithMoveValidation";
import { Button, Icon, Input, Dropdown } from 'semantic-ui-react';
import { useLocation, useHistory } from 'react-router-dom';

import socket from './SocketConfig';
import WinLostPopup from './WinLostPopup';
import Parser from 'html-react-parser';

import './css/ChessBoard.css'

function ChessBoard() {
	const location = useLocation()
const history = useHistory()	
	const locState = location.state
	const [game, setGame] = useState(locState.game)
	const gameRef = useRef(game)
	const [orientation, setOrientation] = useState()
	const [disconnected, setDisconnected] = useState(false)
	const [resigned, setResigned] = useState(false)
	const [opponentResigned, setOpponentResigned] = useState(false)
	const [pieces, setPieces] = useState("neo")
	const [board, setBoard] = useState("green.svg")
	const [timeoutResult, setTimeoutResult] = useState(null);
const timeoutHandledRef = useRef(false);
	

	const selectedTimer = locState.game.timer || locState.game.whiteTime || 0;


	const [whiteTime, setWhiteTime] = useState(selectedTimer)
const [blackTime, setBlackTime] = useState(selectedTimer)
	useEffect(() => {

		socket.emit("fetch", { id: locState.game.id })
		socket.on("fetch", ({ game }) => {
	
			console.log("RICEVUTO FETCH")
			
			setGame(game)
			const fallbackTime = selectedTimer || 300;

setWhiteTime(
  game.whiteTime !== undefined
    ? game.whiteTime
    : fallbackTime
);

setBlackTime(
  game.blackTime !== undefined
    ? game.blackTime
    : fallbackTime
);

		
			setDisconnected(false)
			if (locState.username === game.players[0]) {
				setOrientation("white")
			}
			else {
				setOrientation("black")
			}
		});
		socket.on("disconnected", () => {
			setDisconnected(true)
		})
		socket.on("resigned", () => {
			setOpponentResigned(true)
		})
		socket.on("connect_error", () => {
  alert("Connection lost. Please refresh or try again.");
});

	}, 
	 [locState.game.id, locState.username, selectedTimer]);
	useEffect(() => {
  gameRef.current = game;
}, [game]);
useEffect(() => {
  const handleTimeout = ({ winner, loser }) => {
    if (timeoutHandledRef.current) return;

    timeoutHandledRef.current = true;
    setTimeoutResult({ winner, loser });

    alert(`${winner.toUpperCase()} wins on time! ${loser.toUpperCase()} lost.`);
  };

  socket.on("timeout", handleTimeout);

  return () => {
    socket.off("timeout", handleTimeout);
  };
}, []);
useEffect(() => {
  if (!selectedTimer || selectedTimer === 0) return;

  const interval = setInterval(() => {
    const currentGame = gameRef.current;

    if (
      !currentGame ||
      currentGame.status !== "ongoing" ||
      !currentGame.players ||
      currentGame.players.length < 2
    ) {
      return;
    }

    const moves = currentGame.pgn
      .trim()
      .split(/\s+/)
      .filter(item => item && !item.includes("."));

    const moveCount = moves.length;
if (moveCount % 2 === 0) {
  setWhiteTime(prev => {
    const next = prev > 0 ? prev - 1 : 0;

    if (next === 0 && !timeoutHandledRef.current) {
      timeoutHandledRef.current = true;
      setTimeoutResult({ winner: "black", loser: "white" });
      alert("BLACK wins on time! WHITE lost.");
    }

    return next;
  });
} else {
  setBlackTime(prev => {
    const next = prev > 0 ? prev - 1 : 0;

    if (next === 0 && !timeoutHandledRef.current) {
      timeoutHandledRef.current = true;
      setTimeoutResult({ winner: "white", loser: "black" });
      alert("WHITE wins on time! BLACK lost.");
    }

    return next;
  });
}
  }, 1000);

  return () => clearInterval(interval);
}, [selectedTimer]);



	const handleResignClick = () => {
		socket.emit("resign", { id: game.id })
		setResigned(true)
	}

	const displayMoves = () => {
		let moves = game.pgn.split(" ")
		let rows = "";
		for (let i = 1; i < moves.length; i += 3) {
			rows += `<tr class="${i % 2 === 0 ? "even-row" : "odd-row"}">` +
				`<td className="index"><span>${moves[i - 1]}</span></td>` +
				`<td className="white"><span>${moves[i]}</span></td>` +
				`<td className="black"><span>${moves[i + 1] ? moves[i + 1] : ""}</span></td>` +
				"</tr>"
		}

		return rows;
	}
	if (!game || !game.id) {
  return <div style={{ color: "white", padding: "40px" }}>Loading Game...</div>;
}

return (
  <div className="classic-game-page">

    <div className="classic-board-panel chessboard">
		 {timeoutResult && (
    <h2 style={{ color: "gold", textAlign: "center" }}>
      {timeoutResult.winner.toUpperCase()} wins on time!
    </h2>
  )}

      {!timeoutResult && (
  <WithMoveValidation
    id={game.id}
    pgn={game.pgn}
    orientation={orientation}
    pieces={pieces}
    board={board}
  />
)}
    </div>

    <div className="classic-side-panel">

				{disconnected ? <><p style={{ color: "red" }}>Opponent disconnected...</p><br /></> : ""}
				<WinLostPopup win={opponentResigned ? true : false} lost={resigned ? true : false} draw={false} resigned={(opponentResigned || resigned) ? true : false} />
				<div>
					<div>
					<span>
  <span style={{ color: "grey" }}>
    Player 1 (White):
  </span>
  {" "}
  {(game.players[0]) ? game.players[0] : "waiting..."}
</span>

<br />

<div className="timer-card white-timer">
  <div className="timer-title">♔ White</div>
  <div className="timer-time">
    {Math.floor(whiteTime / 60)}:
    {(whiteTime % 60).toString().padStart(2, "0")}
  </div>
</div>

<br />
<br />

<span>
  <span style={{ color: "grey" }}>
    Player 2 (Black):
  </span>
  {" "}
  {(game.players[1]) ? game.players[1] : "waiting..."}
</span>

<br />
<div className="timer-card black-timer">
  <div className="timer-title">♚ Black</div>
  <div className="timer-time">
    {Math.floor(blackTime / 60)}:
    {(blackTime % 60).toString().padStart(2, "0")}
  </div>
</div>
					</div>
				</div>
				<br />
				<br />
				<span>Gamne ID:</span>
				<Input readOnly style={{ width: "65px" }} value={game.id} />
				<Dropdown icon="setting" style={{ color: "white", marginLeft: "20px" }} pointing className='link item'>
					<Dropdown.Menu>
						<Dropdown.Item>
							<Dropdown text='Pieces'>
								<Dropdown.Menu>
									<Dropdown.Item onClick={() => { setPieces("classic") }}>Classic</Dropdown.Item>
									<Dropdown.Item onClick={() => { setPieces("light") }}>Light</Dropdown.Item>
									<Dropdown.Item onClick={() => { setPieces("neo") }}>Neo</Dropdown.Item>
									<Dropdown.Item onClick={() => { setPieces("tournament") }}>Tournament</Dropdown.Item>
									<Dropdown.Item onClick={() => { setPieces("newspaper") }}>Newspaper</Dropdown.Item>
									<Dropdown.Item onClick={() => { setPieces("ocean") }}>Ocean</Dropdown.Item>
									<Dropdown.Item onClick={() => { setPieces("8bit") }}>8-Bit</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
							<Dropdown.Divider /><br />
							<Dropdown text='Board'>
								<Dropdown.Menu>
									<Dropdown.Item onClick={() => { setBoard("brown.svg") }}>Brown</Dropdown.Item>
									<Dropdown.Item onClick={() => { setBoard("blue.svg") }}>Blue</Dropdown.Item>
									<Dropdown.Item onClick={() => { setBoard("green.svg") }}>Green</Dropdown.Item>
									<Dropdown.Item onClick={() => { setBoard("wood4.jpg") }}>Wood</Dropdown.Item>
									<Dropdown.Item onClick={() => { setBoard("newspaper.png") }}>Newspaper</Dropdown.Item>
									<Dropdown.Item onClick={() => { setBoard("leather.jpg") }}>Leather</Dropdown.Item>
									<Dropdown.Item onClick={() => { setBoard("metal.jpg") }}>Metal</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				{!timeoutResult ? (
  <Button
    animated='vertical'
    className='resign'
    style={{ marginLeft: "20px" }}
    onClick={handleResignClick}
  >
    <Button.Content hidden>Resign</Button.Content>

    <Button.Content visible>
      <Icon name='flag' />
    </Button.Content>
  </Button>
) : (
  <>
    <Button
      color="green"
      style={{ marginLeft: "20px" }}
      onClick={() => window.location.reload()}
    >
      Rematch
    </Button>

    <Button
      color="yellow"
      style={{ marginLeft: "10px" }}
      onClick={() => history.push("/")}
    >
      Back
    </Button>
  </>
)}<br />{!timeoutResult && (
  <Button
    animated='vertical'
    className='resign'
    style={{ marginLeft: "20px" }}
    onClick={() => socket.emit("fetch", { id: locState.game.id })}
  >
    <Button.Content hidden>Fetch</Button.Content>

    <Button.Content visible>
      <Icon name='refresh' />
    </Button.Content>
  </Button>
)}<br />
				{/* <span>{game.pgn}</span> */}
				<div className="moves-div">
					<br />
					<p style={{ fontSize: "20px", color: "white" }}>Moves:</p>

					<table>
						<tbody>
							{Parser(displayMoves())}
						</tbody>
					</table>
				</div>
			</div>
			
		</div>
	);
}

export default ChessBoard;

