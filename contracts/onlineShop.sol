
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;


contract onlineShop {

struct Product {
        uint256 id;
        string name;
        uint256 price;
        uint256 quantity;
    }


Product[] public products;


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



function registerProduct(string memory _name, uint256 _price, uint256 _quantity) public
        validName(_name) validPrice(_price) validQuantity(_quantity) 
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



}

