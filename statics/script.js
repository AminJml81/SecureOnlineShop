const CONTRACT_ADDRESS = "0x44d1132FB0d12DcC9dea35c0827AB46102797a79"; 
const ABI = [
    "function registerProduct(string name, uint256 price, uint256 quantity)",
    "function buyProduct(uint256 productId, uint256 quantity) payable",
    "function confirmOrder(uint256 _orderId)",
    "function refundByTimeOut(uint256 _orderId)",
    "function products(uint256) view returns (uint256 id, string name, uint256 price, uint256 quantity)",
    "function getProductCount() view returns (uint256)",
    "function getMyOrders() view returns (tuple(uint256 productId, address buyer, uint256 amount, uint256 quantity, uint256 purchaseTime, uint8 status)[])",
    "function getAllOrders() view returns (tuple(uint256 productId, address buyer, uint256 amount, uint256 quantity, uint256 purchaseTime, uint8 status)[])",
    "function owner() view returns (address)",
    "function CONFIRMATION_WINDOW() view returns (uint256)"
];

let provider, signer, contract, userAddress, isOwner;
let allProducts = []; // Global array to store product info

async function connectWallet() {
    if (!window.ethereum) return alert("Please Install MetaMask to use this dApp.");
    
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        document.getElementById("connectBtn").innerText = "Wallet Connected";
        document.getElementById("connectBtn").disabled = true;
        document.getElementById("connectBtn").style.backgroundColor = "#10b981"; // Green
        document.getElementById("walletAddr").innerText = userAddress.substring(0,6) + "..." + userAddress.slice(-4);

        const ownerAddr = await contract.owner();
        isOwner = (ownerAddr.toLowerCase() === userAddress.toLowerCase());

        await loadProducts(); 
        await loadOrders();

    } catch (err) {
        console.error(err);
        alert("Connection Failed: " + err.message);
    }
}

// --- Seller Functions ---
async function registerProduct() {
    if(!isOwner) return alert("Access Denied: Only the owner can register products.");
    const name = document.getElementById("pName").value;
    const price = document.getElementById("pPrice").value;
    const qty = document.getElementById("pQty").value;

    if(!name || !price || !qty) return alert("Please fill in all fields.");

    try {
        const tx = await contract.registerProduct(name, ethers.parseEther(price), qty);
        alert("Transaction sent. Waiting for confirmation...");
        await tx.wait();
        loadProducts();
        alert("Product registered successfully!");
        
        // Clear inputs
        document.getElementById("pName").value = "";
        document.getElementById("pPrice").value = "";
        document.getElementById("pQty").value = "";
    } catch(err) { alert("Error: " + err.message); }
}

async function confirmOrder(index) {
    try {
        const tx = await contract.confirmOrder(index);
        alert("Confirming order...");
        await tx.wait();
        loadOrders();
        alert("Order confirmed. Funds released to seller.");
    } catch(err) { alert("Error: " + err.message); }
}

// --- Buyer Functions ---
async function buyProduct(id, priceEth) {
    // 1. Get quantity from the specific input field for this product
    const qtyInput = document.getElementById(`qty-${id}`);
    const quantity = qtyInput ? qtyInput.value : 1;

    if(quantity <= 0) return alert("Quantity must be at least 1");

    try {
        // 2. Calculate total price (Price * Quantity)
        // BigInt math for precision with Wei
        const priceWei = ethers.parseEther(priceEth);
        const totalValue = priceWei * BigInt(quantity);

        const tx = await contract.buyProduct(id, quantity, { value: totalValue });
        alert("Order submitted. Waiting for blockchain confirmation...");
        await tx.wait();
        
        // Refresh data
        loadProducts(); // To update stock
        loadOrders();   // To show new order
        alert("Purchase successful!");
    } catch(err) { 
        console.error(err);
        alert("Transaction failed: " + err.message); 
    }
}

async function refundOrder(index) {
    try {
        const tx = await contract.refundByTimeOut(index);
        alert("Requesting refund...");
        await tx.wait();
        loadOrders();
        alert("Refund successful! Money returned to buyer.");
    } catch(err) { 
        console.error(err);
        alert("Refund Failed: The timeout period may not have passed yet, or you are not authorized."); 
    }
}

// --- Data Loading Functions ---
async function loadProducts() {
    if(!contract) return;
    const count = await contract.getProductCount();
    const listDiv = document.getElementById("productsList");
    listDiv.innerHTML = "";
    allProducts = []; // Reset global array

    if(count == 0) {
        listDiv.innerHTML = "<p class='text-muted'>No products available yet.</p>";
        return;
    }

    for(let i=0; i<count; i++) {
        const p = await contract.products(i);
        // Store in global array for Order List to use later
        const pData = { id: i, name: p.name, price: ethers.formatEther(p.price), qty: Number(p.quantity) };
        allProducts.push(pData);

        const item = document.createElement("div");
        item.className = "list-item";
        
        // Logic to show Buy button or Out of Stock
        let actionHtml = "";
        if(pData.qty > 0) {
            actionHtml = `
                <div style="display:flex; align-items:center;">
                    <input type="number" id="qty-${pData.id}" class="qty-input" min="1" max="${pData.qty}" value="1">
                    <button onclick="buyProduct(${pData.id}, '${pData.price}')">Buy</button>
                </div>
            `;
        } else {
            actionHtml = `<button disabled>Out of Stock</button>`;
        }

        item.innerHTML = `
            <div>
                <strong>${pData.name}</strong><br>
                <small style="color: #cbd5e1;">Price: ${pData.price} ETH | Stock: ${pData.qty}</small>
            </div>
            ${actionHtml}
        `;
        listDiv.appendChild(item);
    }
}

async function loadOrders() {
    if(!contract) return;
    
    // Ensure products are loaded first to map Names to IDs
    if(allProducts.length === 0) {
        await loadProducts();
    }

    let orders = [];
    
    if(isOwner) {
        orders = await contract.getAllOrders();
    } else {
        orders = await contract.getMyOrders();
    }

    const listDiv = document.getElementById("ordersList");
    listDiv.innerHTML = "";

    if(orders.length === 0) { listDiv.innerHTML = "<p class='text-muted'>No orders found.</p>"; return; }

    const timeoutWindow = await contract.CONFIRMATION_WINDOW(); 
    const now = Math.floor(Date.now() / 1000);

    orders.forEach((o, index) => {
        // Find product name using the ID from the order
        const product = allProducts.find(p => p.id == o.productId);
        const pName = product ? product.name : `Unknown Product (ID: ${o.productId})`;
        
        let statusBadge = "";
        let actionBtn = "";

        // Status Logic
        if(o.status == 0) { // Pending
            statusBadge = `<span class="badge badge-pending">Pending</span>`;
            
            if(isOwner) {
                actionBtn = `<button class="green" onclick="confirmOrder(${index})">Confirm Order</button>`;
            } else {
                // Refund Logic
                const purchaseTime = Number(o.purchaseTime);
                const windowTime = Number(timeoutWindow);
                const canRefund = now > (purchaseTime + windowTime);
                
                if(canRefund) {
                    actionBtn = `<button class="red" onclick="refundOrder(${index})">Request Refund</button>`;
                } else {
                    actionBtn = `<small class="text-muted">Refund available after timeout</small>`;
                }
            }
        } 
        else if (o.status == 1) statusBadge = `<span class="badge badge-completed">Completed</span>`;
        else if (o.status == 2) statusBadge = `<span class="badge badge-refunded">Refunded</span>`;

        const item = document.createElement("div");
        item.className = "list-item";
        
        item.innerHTML = `
            <div>
                <strong>Order #${index} - ${pName}</strong><br>
                <small style="color: #cbd5e1;">
                    Total: ${ethers.formatEther(o.amount)} ETH | Qty: ${o.quantity} <br>
                    Buyer: ${o.buyer.substring(0,6)}...${o.buyer.slice(-4)}
                </small>
            </div>
            <div style="text-align:right">
                ${statusBadge}<br>
                <div style="margin-top:8px">${actionBtn}</div>
            </div>
        `;
        listDiv.appendChild(item);
    });
}