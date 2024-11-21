import express from "express";
import { WebSocketServer } from "ws";
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  isAddress,
  parseEther,
} from "ethers";
import dotenv from "dotenv";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./utils.js";

dotenv.config();

const app = express();
const PORT = 4000;

const wss = new WebSocketServer({ port: 4001 });

const provider = new JsonRpcProvider("http://127.0.0.1:7545", {
  chainId: 1337,
  name: "ganache",
});

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error("Missing PRIVATE_KEY in .env file");

const wallet = new Wallet(privateKey, provider);

const contractAddress = CONTRACT_ADDRESS;
if (!contractAddress) throw new Error("Missing CONTRACT_ADDRESS in .env file");

const validateEthereumAddress = (address) => {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return address;
};

const gameContract = new Contract(contractAddress, CONTRACT_ABI, wallet);

let waitingPlayer = null;
let activeMatches = [];
const connections = new Map();

wss.on("connection", (ws) => {
  console.log("Player connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case "register":
          handleRegister(data, ws);
          break;
        case "join":
          handlePlayerJoin(data, ws);
          break;
        case "placeBet":
          handlePlaceBet(ws);
          break;
        case "updateScore":
          handleUpdateScore(data, ws);
          break;
        case "disconnect":
          handleDisconnect(ws);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  ws.on("close", () => {
    handleDisconnect(ws);
  });
});

const handleRegister = (data, ws) => {
  try {
    const address = validateEthereumAddress(data.address);
    connections.set(ws, address);
    console.log(`Registered address: ${address}`);
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: err.message,
      })
    );
  }
};

const handlePlayerJoin = (data, ws) => {
  if (waitingPlayer && waitingPlayer.betAmount === data.betAmount) {
    const opponent = waitingPlayer;
    waitingPlayer = null;

    const match = {
      player1: {
        id: data.id,
        address: connections.get(ws),
        ws,
        betAmount: data.betAmount,
        score: 0,
        moves: 0,
      },
      player2: {
        id: opponent.id,
        address: connections.get(opponent.ws),
        ws: opponent.ws,
        betAmount: opponent.betAmount,
        score: 0,
        moves: 0,
      },
      betAmount: data.betAmount,
      status: "waitingForBet",
    };

    activeMatches.push(match);

    ws.send(
      JSON.stringify({
        type: "matchFound",
        opponentId: opponent.id,
        betAmount: data.betAmount,
      })
    );
    opponent.ws.send(
      JSON.stringify({
        type: "matchFound",
        opponentId: data.id,
        betAmount: opponent.betAmount,
      })
    );
  } else {
    waitingPlayer = { id: data.id, ws, betAmount: data.betAmount };
    ws.send(JSON.stringify({ type: "searchingForPlayer" }));
  }
};

const handlePlaceBet = (ws) => {
  const match = activeMatches.find(
    (m) => m.player1.ws === ws || m.player2.ws === ws
  );
  if (match && match.status === "waitingForBet") {
    match.status = "betPlaced";
    match.player1.ws.send(
      JSON.stringify({ type: "betPlaced", betAmount: match.betAmount })
    );
    match.player2.ws.send(
      JSON.stringify({ type: "betPlaced", betAmount: match.betAmount })
    );
  }
};

const handleUpdateScore = (data, ws) => {
  const match = activeMatches.find(
    (m) => m.player1.ws === ws || m.player2.ws === ws
  );
  if (match) {
    const player = match.player1.ws === ws ? match.player1 : match.player2;
    player.score += data.selectedCardPow;
    player.moves += 1;

    match.player1.ws.send(
      JSON.stringify({
        type: "liveScoreUpdate",
        oppplayerScore: match.player2.score,
        oppplayerMoves: match.player2.moves,
      })
    );
    match.player2.ws.send(
      JSON.stringify({
        type: "liveScoreUpdate",
        oppplayerScore: match.player1.score,
        oppplayerMoves: match.player1.moves,
      })
    );

    if (match.player1.moves === 5 && match.player2.moves === 5) {
      finalizeMatch(match);
    }
  }
};

const handleDisconnect = (ws) => {
  if (waitingPlayer?.ws === ws) waitingPlayer = null;
  const match = activeMatches.find(
    (m) => m.player1.ws === ws || m.player2.ws === ws
  );
  if (match) finalizeMatch(match, true);
};

const finalizeMatch = async (match, disconnected = false) => {
  const winner =
    disconnected || match.player1.score > match.player2.score
      ? match.player1
      : match.player2;
  const loser = winner === match.player1 ? match.player2 : match.player1;

  try {
    const winnerAddress = validateEthereumAddress(winner.address);

    match.player1.ws.send(
      JSON.stringify({
        type: "matchResult",
        winner: winner.id,
        winnerAddress: winner.address,
      })
    );
    match.player2.ws.send(
      JSON.stringify({
        type: "matchResult",
        winner: winner.id,
        winnerAddress: winner.address,
      })
    );

    // Notify opponent that the winner has been determined
    loser.ws.send(
      JSON.stringify({
        type: "opponentFinished",
        winnerId: winner.id,
        winnerAddress: winner.address,
        winnerScore: winner.score,
      })
    );

    const tx = await gameContract.transferToWinner(winnerAddress);
    await tx.wait();
    console.log("Bet settled on-chain");
    match.player1.ws.send(
      JSON.stringify({
        type: "settled",
        winnerId: winner.id,
        winnerAddress: winner.address,
      })
    );
    match.player2.ws.send(
      JSON.stringify({
        type: "settled",
        winnerId: winner.id,
        winnerAddress: winner.address,
      })
    );
  } catch (err) {
    console.error("Error finalizing match or processing transaction:", err);
  }
  activeMatches = activeMatches.filter((m) => m !== match);
};

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
