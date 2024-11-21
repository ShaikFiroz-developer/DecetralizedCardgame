# **Blockchain-Powered Card Game Application**

This is a decentralized card game built using the **MERN** stack with blockchain technology to handle transactions and game logic securely.

---

## **Tech Stack**

### **Frontend**

- **Vite + React**: Lightning-fast development environment and UI framework for creating responsive and dynamic user interfaces.

### **Blockchain**

- **Truffle**: A development framework for deploying and testing smart contracts efficiently.
- **Solidity**: A programming language used for writing Ethereum-based smart contracts.
- **Ganache**: A personal Ethereum blockchain for deploying and testing smart contracts locally.
- **MetaMask**: A browser extension wallet for connecting to Ethereum-based networks.

---

## **Steps to Add Ganache Network to MetaMask**

1. **Start Ganache**:

   - Open Ganache and create a workspace or use the default settings.
   - Note the **RPC URL** (e.g., `http://127.0.0.1:7545`) and **Chain ID** (usually `1337`).

2. **Open MetaMask**:

   - Click the MetaMask browser extension icon and log in.

3. **Add a Custom Network**:

   - Navigate to **Settings > Networks > Add a Network**.
   - Enter the following details:
     - **Network Name**: Ganache Local
     - **RPC URL**: `http://127.0.0.1:7545`
     - **Chain ID**: `1337`
     - **Currency Symbol**: ETH
   - Save the network.

4. **Import Ganache Accounts**:
   - In Ganache, copy the private key of one of the accounts.
   - In MetaMask, import this account using the private key.

Now your MetaMask wallet is connected to the local Ganache blockchain!

---

## **Application Workflow**

```plaintext
+------------+       +----------------+       +-----------------+
|  Player A  |-------|    WebSocket   |-------|    Player B      |
+------------+       +----------------+       +-----------------+
       |                     |                         |
       |                     |                         |
       v                     v                         v
+---------------------------------------------------------------+
|                    Node.js Backend Server                    |
|          - Synchronizes game state using WebSocket          |
|          - Processes scores and actions                     |
|          - Updates blockchain via smart contracts           |
+---------------------------------------------------------------+
                               |
                               v
+---------------------------------------------------------------+
|                   Ethereum Blockchain (Ganache)               |
|         - Solidity smart contracts handle transactions       |
|         - Tracks bets, scores, and crypto transfers          |
+---------------------------------------------------------------+
```

## **How to Run**

### **Start Ganache**

- Launch Ganache and keep it running to serve as your local blockchain.

### **Deploy Contracts**

- Use Truffle to compile and deploy the smart contracts:
  ```bash
  truffle compile
  truffle migrate
  ```

start backend:
`bash
    nodemon server.js
    `

start frontend ui:
`bash
    npm run dev
    `

### **Connect MetaMask**

1. **Open MetaMask** and navigate to:

   - `Settings` > `Networks` > `Add a Network`.

2. **Enter the following details**:

   - **Network Name**: Ganache Local
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: ETH

3. **Save the network**.

4. **Import the account** from Ganache using the "Import Account" option:

   - Provide the **private key** of the importing account.

5. **Set the imported account as the default**:

   - After selecting the network, choose the imported account and make sure it appears first in the account list.

   You can now interact with the Ganache network from MetaMask.
