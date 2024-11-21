import React, { useState, useEffect } from "react";
import imgsdata from "../utils/cardimgs";
import Card from "./Card";
import TransactionComponent from "./transaction";
import { BrowserProvider, formatEther } from "ethers";

const WEBSOCKET_URL = "ws://localhost:4001";

function PlayerComponent() {
  const [balance, setBalance] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isCardPopupVisible, setIsCardPopupVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ws, setWs] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [cardvalue, setSelectedCardPow] = useState(0);
  const [opcardvalue, opsetSelectedCardPow] = useState(0);
  const [movescount, setmovescount] = useState(5);
  const [opmovescount, setopmovescount] = useState(5);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledCards, setShuffledCards] = useState([]);
  const [revealedCards, setRevealedCards] = useState([]);
  const [betAmountsent, setbetamountstatus] = useState(false);
  const [account, setAccount] = useState(null);
  const [accountbal, setAccountbal] = useState(null);
  const [winner, setWinner] = useState(null);
  const [wonAmount, setWonAmount] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [playAgain, setPlayAgain] = useState(false);

  const fetchAccount = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);

        // Fetch account balance in Wei (1 ETH = 10^18 Wei)
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [accounts[0], "latest"],
        });

        const balanceInEth = formatEther(balance);
        setAccountbal(balanceInEth);
      } else {
        console.error("MetaMask is not installed.");
      }
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [betAmountsent]);

  const shuffleCards = () => {
    return imgsdata.sort(() => Math.random() - 0.5);
  };

  const handleCardSelect = (card) => {
    if (revealedCards.includes(card.id)) return;
    if (movescount > 0 && movescount <= 5) {
      const res = cardvalue + card.pow;
      setSelectedCardPow(res);
      const updatemove = movescount - 1;
      setmovescount(updatemove);
    }
    setRevealedCards((prev) => [...prev, card.id]);

    if (ws) {
      ws.send(
        JSON.stringify({
          type: "updateScore",
          selectedCardPow: card.pow,
        })
      );
    }

    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
    }, 1500);
  };

  useEffect(() => {
    const websocket = new WebSocket(WEBSOCKET_URL);
    console.log(account);
    websocket.onopen = () => {
      console.log("Connected to WebSocket server");
      setWs(websocket);
      if (account) {
        websocket.send(
          JSON.stringify({
            type: "register",
            address: account,
          })
        );
      } else {
        console.log("Account address is not available yet.");
      }
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message received:", data);

      switch (data.type) {
        case "matchFound":
          setOpponentId(data.opponentId);
          setIsSearching(false);
          setGameStarted(true);
          break;

        case "liveScoreUpdate":
          if (movescount >= 1 && movescount <= 5) {
            const res = opcardvalue + data.oppplayerScore;
            opsetSelectedCardPow(res);
          }
          const movesleftopp = opmovescount - data.oppplayerMoves;
          setopmovescount(movesleftopp);
          break;

        case "matchResult":
          if (data.winnerAddress === account) {
            setWinner("You");
            setWonAmount(1);
          } else {
            setWinner(data.winner);
            setWonAmount(0);
          }
          setGameOver(true);
          break;

        case "settleAmount":
          fetchAccount();
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      websocket.close();
    };
  }, [account]);

  useEffect(() => {
    if (gameStarted) {
      const shuffled = shuffleCards();
      setShuffledCards(shuffled);
    }
  }, [gameStarted]);

  const handleJoinGame = () => {
    if (ws) {
      const id = `player-${Math.floor(Math.random() * 1000)}`;
      setPlayerId(id);
      setIsSearching(true);

      ws.send(
        JSON.stringify({
          type: "join",
          id,
        })
      );
    }
  };

  const handleNextCards = () => {
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + 5, shuffledCards.length - 5)
    );
  };

  const handlePrevCards = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 5, 0));
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setPlayAgain(true);
    setWinner(null);
    setWonAmount(0);
    setGameStarted(false);
  };

  return (
    <div className="flex w-[100vw] flex-col items-center justify-between h-screen bg-gray-900 p-6">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-white text-2xl font-extrabold">
          Decentralized UNO Cards Game
        </h1>
        <div className="text-amber-100 font-semibold text-xl">
          Balance: {accountbal !== null ? `${accountbal} ETH` : "Loading..."}
        </div>
      </div>

      {!gameStarted ? (
        <div className="mt-8 flex flex-col items-center">
          {isSearching ? (
            <p className="text-white text-lg font-semibold">
              Searching for an opponent...
            </p>
          ) : (
            <button
              onClick={handleJoinGame}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Join Game
            </button>
          )}
        </div>
      ) : (
        <>
          {betAmountsent ? (
            <div className="h-screen flex flex-col justify-between">
              {/* Score Section */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between mb-4 w-full">
                  <div className="w-full bg-gray-900 p-4 rounded-lg shadow-md">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Your Score */}
                      <div className="text-white text-left">
                        <p className="font-semibold mb-2">
                          Your Score: <b>{cardvalue}</b>
                        </p>
                        <p className="mt-4">
                          Moves Left: <b>{movescount}</b>
                        </p>
                      </div>
                      {/* Opponent Score */}
                      <div className="text-white text-right">
                        <p className="font-semibold mb-2">
                          Opponent Score: <b>{opcardvalue}</b>
                        </p>
                        <p className="mt-4">Moves Left: {opmovescount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player vs Opponent Section */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="text-white text-lg">
                    <p>
                      <b className="text-green-700 italic">Player:</b>{" "}
                      {playerId || "You"}
                    </p>
                  </div>
                  <img src="vs.png" alt="vs" className="h-10 w-10" />
                  <div className="text-white text-lg">
                    <p>
                      <b className="text-red-700 italic">Opponent:</b>{" "}
                      {opponentId || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Horizontal Scrolling Cards Section */}
              <div className="flex justify-center items-center space-x-4 overflow-hidden">
                <button
                  onClick={handlePrevCards}
                  className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Prev
                </button>

                <div className="overflow-x-auto h-96 flex space-x-4 w-full">
                  {shuffledCards
                    .slice(currentIndex, currentIndex + 5)
                    .map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        isRevealed={revealedCards.includes(card.id)}
                        onClick={() => handleCardSelect(card)}
                        className="min-w-[150px] h-40 bg-white rounded-lg shadow-md"
                      />
                    ))}
                </div>
                <button
                  onClick={handleNextCards}
                  className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <TransactionComponent
              betAmount={1}
              ws={ws}
              opponentId={opponentId}
              settransactionstatus={setbetamountstatus}
            />
          )}
        </>
      )}

      {gameOver && wonAmount === 1 && (
        <div className="fixed inset-0 bg-black text-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-600 p-6 rounded-md text-center">
            <h2 className="text-xl font-bold mb-4">
              🎉 Congratulations {winner}! 🎉
            </h2>
            <p>
              You won <b>{wonAmount} ETH</b>
            </p>
            <button
              onClick={() => {
                fetchAccount();
              }}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 mt-4"
            >
              GET Won amount
            </button>
            <br />
            <button
              onClick={() => {
                setTimeout(() => {
                  window.location.reload(true);
                }, 1000);
              }}
              className="bg-yellow-200 text-white py-2 px-4 rounded hover:bg-green-700 mt-4"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {gameOver && wonAmount === 0 && (
        <div className="fixed inset-0 bg-black text-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-600 p-6 rounded-md text-center">
            <h2 className="text-xl font-bold mb-4">Better luck next time</h2>
            <p>
              You lost <b>1 ETH</b>
            </p>
            <button
              onClick={() => {
                setTimeout(() => {
                  window.location.reload(true);
                }, 1000);
              }}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-green-700 mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerComponent;
