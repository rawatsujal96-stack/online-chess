const express = require('express');
const app = express();
const cors = require('cors');
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const PORT = 4000;

app.use(cors());
app.use(express.json());

// mongoose.connect("mongodb+srv://dbadmin:3XtVylN6CqpLoEQ0@cluster0.mmdxo.mongodb.net/onlinechess?retryWrites=true&w=majority", 
//                     { useNewUrlParser: true, useUnifiedTopology: true });
// const conn = mongoose.connection;

let games = []
const getMoveCount = (pgn = "") => {
  return pgn.trim().split(/\s+/).filter(item => item && !item.includes(".")).length;
};

const getActiveColor = (game) => {
  return getMoveCount(game.pgn) % 2 === 0 ? "white" : "black";
};

const syncGameClock = (game) => {
  if (!game || !game.timer || game.timer <= 0) return;
  if (game.status !== "ongoing") return;
  if (!game.players || game.players.length < 2) return;

  const now = Date.now();

  if (!game.lastTickAt) {
    game.lastTickAt = now;
    return;
  }

  const elapsedSeconds = Math.floor((now - game.lastTickAt) / 1000);
  if (elapsedSeconds <= 0) return;

  const activeColor = getActiveColor(game);
if (activeColor === "white") {
  game.whiteTime = Math.max(0, game.whiteTime - elapsedSeconds);

  if (game.whiteTime <= 0) {
    game.status = "timeout";
    game.winner = "black";
    game.loser = "white";
  }
} else {
  game.blackTime = Math.max(0, game.blackTime - elapsedSeconds);

  if (game.blackTime <= 0) {
    game.status = "timeout";
    game.winner = "white";
    game.loser = "black";
  }
}

  game.lastTickAt += elapsedSeconds * 1000;
};

app.get('/', function (req, res) {
	res.send('Server is running correctly')
})

const logServerStatus = () => {
	console.clear()
	console.log(`Current online users: \t${io.engine.clientsCount}`)
	console.log(`Currently on-going games:`)
	console.log(games)
}

io.on("connection", (socket) => {
	logServerStatus();

	socket.on("create", ({ username, timer }) => {
		let id = Math.random().toString(36).slice(9);
	const initialTime = Number(timer) || 0;

games.push({
  id: id,
  players: [username],
  pgn: "",
  status: "starting",
  timer: initialTime,
  whiteTime: initialTime,
  blackTime: initialTime,
  lastTickAt: null
})
		socket.join(id)
		socket.emit("created", { game: games[games.length - 1] })

		logServerStatus();
	});

	socket.on("fetch", ({ id }) => {
		games.forEach(game => {
			if (game.id === id) {
				syncGameClock(game);
				if (game.status === "timeout") {
  io.to(id).emit("timeout", {
    winner: game.winner,
    loser: game.loser,
    game: game
  });
}
				if (![...socket.rooms].indexOf(id) >= 0)
					socket.join(id)
				socket.to(id).emit("fetch", { game: game })
				socket.emit("fetch", { game: game })
			}
		});

		logServerStatus();
	});

	socket.on("join", ({ username, id }) => {
		let gamefound = false;
		let usernameAlreadyInUse = false;
		games.forEach(game => {
			if (game.id === id) {
				if (game.players[0] === username) {
					usernameAlreadyInUse = true;
				}
				else {
					game.players.push(username);
					game.status = 'ongoing';
					game.lastTickAt = Date.now();
					socket.join(id);
					socket.emit("joined", { game: game });
					socket.to(id).emit("fetch", { game: game });
					gamefound = true;
				}
			}
		});

		if (!gamefound) {
			socket.emit("gamenotfound");
		}

		if (usernameAlreadyInUse) {
			socket.emit("usernamealreadyinuse");
		}

		logServerStatus();
	});

	socket.on("move", ({ id, from, to, pgn }) => {
  games.forEach(game => {
    if (game.id === id) {
      syncGameClock(game);
      game.pgn = pgn;
      game.lastTickAt = Date.now();

      socket.to(id).emit("moved", { from: from, to: to });
      socket.to(id).emit("fetch", { game: game });
      socket.emit("fetch", { game: game });
    }
  })

  logServerStatus();
})

	socket.on("resign", ({ id }) => {
		socket.to(id).emit("resigned")
		let index = -1;
		
		games.forEach(game => {
			if (game.id === id) {
				game.status = 'resigned'
				index = games.indexOf(game)
			}
		})
		
		if (index > -1) {
			games.splice(index, 1);
		}

		// array = [2, 9]
		logServerStatus();
	})

	socket.on("checkmate", ({ id }) => {
		socket.to(id).emit("checkmate")
		let index = -1;
		games.forEach(game => {
			if (game.id === id) {
				index = games.indexOf(game)
			}
		})

		if(index > -1) {
			games.splice(index, 1);
		}
		logServerStatus();
	})

	socket.on("disconnecting", () => {
		socket.rooms.forEach(room => {
			socket.to(room).emit("disconnected")
			if (io.sockets.adapter.rooms.get(room).size === 1) {
				let game = games.filter(g => g.id === room)[0]
				let index = games.indexOf(game)
				if (index > -1) {
					games.splice(index, 1);
				}
			}
		})

		logServerStatus();
	})
});

server.listen(process.env.PORT || PORT, function () {
	console.log("Server is running on Port: " + PORT);
	logServerStatus()
});