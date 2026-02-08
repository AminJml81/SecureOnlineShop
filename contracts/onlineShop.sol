
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;


contract onlineShop {

address payable public owner; // Owner is our main seller
uint256 public constant CONFIRMATION_WINDOW = 2 minutes;


struct Product {
        uint256 id;
        string name;
        uint256 price;
        uint256 quantity;
    }

enum OrderStatus { Pending, Completed, Refunded }

struct Order {
        uint256 productId;
        address payable buyer;
        uint256 amount;
        uint256 quantity;
        uint256 purchaseTime; 
        OrderStatus status;  
    }

Product[] public products;
Order[] public orders;

mapping(address => uint256[]) private buyerOrderIds;


event OrderPlaced(uint256 indexed orderId, address indexed buyer, uint256 productId, uint256 amount);
event OrderConfirmed(uint256 indexed orderId, address indexed seller, uint256 amountReleased);
event OrderRefunded(uint256 indexed orderId, address indexed buyer, uint256 amountRefunded);


constructor() {
        owner = payable(msg.sender);
    }


modifier onlyOwner() {
        require(msg.sender == owner, "Only owner/seller can perform this action");
        _;
    }

modifier onlyBuyer(uint256 _orderId) {
        require(orders[_orderId].buyer == msg.sender, "Not the buyer");
        _;
    }

modifier isOrderPending(uint256 _orderId) {
        require(orders[_orderId].status == OrderStatus.Pending, "Order handled already");
        _;
    }

modifier hasTimedOut(uint256 _orderId) {
        require(block.timestamp > orders[_orderId].purchaseTime + CONFIRMATION_WINDOW, "Timeout not reached yet");
        _;
    }

modifier validName(string memory _name) {
        require(bytes(_name).length > 0, "Product name cannot be empty");
        _;
    }

modifier validPrice(uint256 _price){
    require(_price > 0, "Price must be greater than zero");
        _;
}


modifier validQuantity(uint256 _quantity) {
        require(_quantity > 0, "Quantity must be at least 1");
        _;
}

modifier canPurchase(uint256 _productId, uint256 _quantity) {
        require(_productId < products.length, "Product does not exist");
        require(products[_productId].quantity >= _quantity, "Out of stock");
        uint256 unitPrice = products[_productId].price;
        require(msg.value == (unitPrice * _quantity), "Incorrect Price value sent");
        _;
    }

function registerProduct(string memory _name, uint256 _price, uint256 _quantity) public
        onlyOwner validName(_name) validPrice(_price) validQuantity(_quantity) 
    {
        // product id is derived based on products length.
        uint256 newId = products.length;
        
        products.push(Product({
            id: newId,
            name: _name,
            price: _price,
            quantity: _quantity
        }));
    }


function listProducts() public view returns (Product[] memory)  {

    return products;
}


function getProductCount() public view returns (uint256) {
        return products.length;
    }


function buyProduct(uint256 _productId, uint256 _quantity) public payable canPurchase(_productId, _quantity) {
        
        Product storage product = products[_productId];
        product.quantity -= _quantity;

        uint256 orderId = orders.length;

        orders.push(Order({
            productId: _productId,
            buyer: payable (msg.sender),
            amount: msg.value,
            quantity: _quantity,
            purchaseTime: block.timestamp,
            status: OrderStatus.Pending
        }));

        buyerOrderIds[msg.sender].push(orderId);

    emit OrderPlaced(orderId, msg.sender, _productId, msg.value);
    }


function confirmOrder(uint256 _orderId) public onlyOwner isOrderPending(_orderId) {
        Order storage order = orders[_orderId];

        order.status = OrderStatus.Completed;

        (bool success, ) = owner.call{value: order.amount}("");
        require(success, "Transfer to owner failed");

        emit OrderConfirmed(_orderId, msg.sender, order.amount);
    }


function refundByTimeOut(uint256 _orderId) public 
        onlyBuyer(_orderId) isOrderPending(_orderId) hasTimedOut(_orderId)
{
        
        Order storage order = orders[_orderId];

        order.status = OrderStatus.Refunded;

        // reverting the quantity of the product.
        products[order.productId].quantity += order.quantity;

        // refund the buyer money back
        (bool success, ) = order.buyer.call{value: order.amount}("");
        require(success, "Refund failed");

        emit OrderRefunded(_orderId, msg.sender, order.amount);
    }

function getMyOrders() public view returns (Order[] memory) {
        uint256[] memory userOrderIds = buyerOrderIds[msg.sender];
        
        Order[] memory myOrders = new Order[](userOrderIds.length);

        // add each order id of the corresponding seller in myOrders list.
        for (uint i = 0; i < userOrderIds.length; i++) {
            myOrders[i] = orders[userOrderIds[i]];
        }
        
        return myOrders;
    }

function getAllOrders() public view onlyOwner returns (Order[] memory) {
        return orders;
    }

// function to see live balance in contract.
function getContractBalance() public view returns (uint256) {
    return address(this).balance;
}



}


