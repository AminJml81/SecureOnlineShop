# 🛒 Blockchain Online Shop

A decentralized marketplace DApp built on the Ethereum blockchain that ensures trust between buyers and sellers using a **Timeout-Based Auto-Release** mechanism.

![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

## 📄 Project Description

This project is a smart contract-based shopping system that manages the interaction between a **Seller (Admin)** and multiple **Buyers**. 
The core problem in online commerce is trust: Buyers fear paying without receiving goods, and Sellers fear sending goods without payment. This project solves this using an **Escrow System**:
1. Funds are locked in the contract upon purchase.
2. Funds are released to the seller only after they confirm the order.
3. If the seller fails to confirm within a specific timeframe, the buyer can claim a **Refund**.

## ✨ Features

### 👑 Seller (Owner/Admin) Role
* **Product Management:** Define and register new products (Name, Price in ETH, Quantity).
* **Order Oversight:** View a complete list of all orders placed in the system.
* **Order Confirmation:** Confirm orders to release the locked funds to their wallet and complete the purchase process.

### 🛍️ Buyer Role
* **Marketplace Access:** View available products and place orders via MetaMask.
* **Order History:** Access a personal history of all purchased items and their statuses.
* **Auto-Refund:** Request a full refund if the Seller does not confirm the order within the defined **Timeout Window**.

## 🛠️ Technical Architecture

This project is implemented using the following stack:

* **Blockchain Network:** Ethereum (Deployed on **Sepolia Testnet**).
* **Smart Contract Language:** [Solidity](https://docs.soliditylang.org/) (Version `0.8.30`).
* **Frontend Interface:** Vanilla HTML/CSS/JS.
* **Blockchain Interaction:** [Ethers.js](https://docs.ethers.org/v6/) library.
* **Wallet Connection:** [MetaMask](https://metamask.io/).

## 🧩 Smart Contract Logic

The contract relies on secure state management:

1.  **Structs:**
    * `Product`: Stores ID, Name, Price, and Quantity.
    * `Order`: Stores Buyer Address, Amount, Status (Pending/Completed/Refunded), and Purchase Time.
2.  **Mappings:** Uses `buyerOrderIds` to map user addresses to their specific order IDs for efficient retrieval.
3.  **Escrow Logic:**
    * **Buy:** `msg.value` is stored in the contract, not sent to the seller immediately. Status -> `Pending`.
    * **Refund:** The `refundByTimeOut` function checks `block.timestamp`. If `Current Time > Purchase Time + Timeout`, the contract allows the buyer to withdraw the funds.

## 🚀 How to Run

Since this project uses a serverless frontend architecture (connecting directly to the blockchain), no Node.js installation is strictly required to run the UI.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
    ```
2.  **Open the Interface:**
    Simply open the `index.html` file in any modern browser (Chrome/Firefox).
    * *Note: For better compatibility with MetaMask, it is recommended to use a local server (e.g., VS Code Live Server).*
3.  **Connect Wallet:**
    Ensure you have **MetaMask** installed and switched to the **Sepolia Testnet**. Click "Connect Wallet".

## 📸 Screenshots

| Seller Dashboard | User Marketplace | Seller OrderHistory | Buyer OrderHistory |
|:---:|:---:|:---:|:---:|
| <img width="800" height="600" alt="seller-dashboard2" src="https://github.com/user-attachments/assets/1d778644-6b5c-46cb-bd48-2b37496525cc" />|<img width="600" height="400" alt="marketplace" src="https://github.com/user-attachments/assets/6697b2c5-5bb9-41a7-87de-a1d6c0196990" />| <img width="800" height="600" alt="order-added-to-orders-owner-part" src="https://github.com/user-attachments/assets/2b5ec7f2-8958-4d16-b896-2718da7b4fb1" />|<img width="800" height="600" alt="order-added-to-orders" src="https://github.com/user-attachments/assets/4b54bc8f-4727-4cec-b97a-b999b24ba24a" />|

## 👤 Author

**Amin Jamali** 
---
*This project was developed for the Blockchain Programming Course.*
