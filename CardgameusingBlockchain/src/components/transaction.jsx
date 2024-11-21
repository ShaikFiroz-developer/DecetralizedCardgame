import React, { useState, useEffect } from "react";
import { ethers, parseEther, BrowserProvider, toBigInt } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./utils";

const TransactionComponent = ({
  betAmount,
  opponentId,
  ws,
  settransactionstatus,
}) => {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  // Connect to MetaMask and set up provider
  const connectToMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const userAccount = await signer.getAddress();
        setAccount(userAccount);
        return signer;
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        setStatus("Failed to connect to MetaMask.");
      }
    } else {
      setStatus("MetaMask is not installed. Please install MetaMask.");
    }
    return null;
  };

  const sendTransaction = async () => {
    if (!betAmount || !opponentId) {
      setStatus("Bet amount and opponent ID are required.");
      return;
    }

    setIsTransactionPending(true);
    setStatus("Preparing transaction...");

    const signer = await connectToMetaMask();

    if (signer) {
      try {
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        const txResponse = await contract.payBetAmount({
          value: parseEther(toBigInt(betAmount).toString()),
        });

        console.log("Transaction Response:", txResponse);
        setTransactionHash(txResponse.hash);
        setStatus("Transaction sent. Waiting for confirmation...");

        const receipt = await txResponse.wait();

        if (receipt.status === 1) {
          setStatus("Transaction confirmed!");
          sendTransactionStatusToServer(true, account);
        } else {
          setStatus("Transaction failed during confirmation.");
          sendTransactionStatusToServer(false);
        }
        settransactionstatus(true);
      } catch (error) {
        console.error("Transaction error:", error);
        setStatus("Transaction failed. Check console for details.");
        sendTransactionStatusToServer(false);
      } finally {
        setIsTransactionPending(false);
      }
    } else {
      setStatus("Unable to connect to signer.");
      setIsTransactionPending(false);
    }
  };

  const sendTransactionStatusToServer = (isSuccessful, accountaddress = "") => {
    if (ws) {
      ws.send(
        JSON.stringify({
          type: "transactionStatus",
          betAmount,
          transactionHash: accountaddress,
          isSuccessful,
          opponentId,
        })
      );
    }
  };

  useEffect(() => {
    if (!account) {
      connectToMetaMask();
    }
  }, [account]);

  return (
    <div class="bet-transaction bg-gray-100 p-6 rounded-lg shadow-lg w-80 mx-auto">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Bet Transaction</h2>
      <div class="details text-gray-700">
        <p class="mb-2">
          <span class="font-semibold">Bet Amount:</span> {betAmount} ETH
        </p>
        <p class="mb-4">
          <span class="font-semibold">Opponent ID:</span> {opponentId}
        </p>
        {status && (
          <p class="status mb-4">
            <span class="font-semibold">Status:</span> {status}
          </p>
        )}
      </div>
      {!isTransactionPending ? (
        <button
          class="action-btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          onClick={sendTransaction}
        >
          Pay Bet
        </button>
      ) : (
        <p class="text-sm text-gray-500">Processing...</p>
      )}
    </div>
  );
};

export default TransactionComponent;
