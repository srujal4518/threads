document.addEventListener("DOMContentLoaded", function () {
    // Navigation Toggle
    const bar = document.getElementById("bar");
    const close = document.getElementById("close");
    const nav = document.getElementById("navbar");
    const cartLink = document.querySelector("#lg-bag a"); // Cart icon link
  
    if (bar) {
        bar.addEventListener("click", () => {
            nav.classList.add("active");
        });
    }
  
    if (close) {
        close.addEventListener("click", () => {
            nav.classList.remove("active");
        });
    }
  
    // Show popup if cart is empty when clicking cart icon
    if (cartLink) {
        cartLink.addEventListener("click", function (event) {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            if (cart.length === 0) {
                event.preventDefault(); // Stop navigation
                alert("Your cart is empty!");
            }
        });
    }

    // Load the cart when the page loads
    loadCart();
  
    // ✅ Fix: Prevent scrolling when clicking cart button
    let cartButtons = document.querySelectorAll(".bx-cart");
    cartButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
            event.preventDefault(); // Prevents scrolling to top
            let product = event.target.closest(".pro");
            addToCart(product);
        });
    });
  
    // Handle cart quantity changes, size selection & remove items
    let cartTable = document.querySelector(".cart-items");
    if (cartTable) {
        cartTable.addEventListener("click", function (event) {
            if (event.target.classList.contains("quantity-plus")) {
                updateQuantity(event.target, 1);
            }
            if (event.target.classList.contains("quantity-minus")) {
                updateQuantity(event.target, -1);
            }
            if (event.target.classList.contains("remove-item")) {
                removeItem(event.target);
            }
        });

        // Handle size change
        cartTable.addEventListener("change", function (event) {
            if (event.target.classList.contains("size-select")) {
                updateSize(event.target);
            }
        });
    }
  
    // Handle Purchase button
    let purchaseButton = document.querySelector(".btn-purchase");
    if (purchaseButton) {
        purchaseButton.addEventListener("click", function () {
            window.location.href = "final.html";
            localStorage.removeItem("cart");
            loadCart();
        });
    }
});

// Function to add a product to cart
function addToCart(product) {
    if (!product) return;

    let title = product.querySelector("h5").innerText;
    let price = product.querySelector("h4").innerText.replace("₹", "").trim();
    let imageSrc = product.querySelector("img").src;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existingItem = cart.find((item) => item.title === title);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ title, price, imageSrc, quantity: 1, size: "M" }); // Default size M
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Item added to cart!");
    loadCart();
}

// Function to load cart items into the cart table
function loadCart() {
    let cartTable = document.querySelector(".cart-items");
    let totalPriceElement = document.querySelector(".cart-total-price");

    if (!cartTable || !totalPriceElement) return;

    cartTable.innerHTML = "";
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalPrice = 0;

    cart.forEach((item, index) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${item.imageSrc}" width="50"> ${item.title}</td>
            <td>₹${item.price}</td>
            <td>
                <button class="quantity-minus" data-index="${index}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-plus" data-index="${index}">+</button>
            </td>
            <td>
                <select class="size-select" data-index="${index}">
                    <option value="S" ${item.size === "S" ? "selected" : ""}>S</option>
                    <option value="M" ${item.size === "M" ? "selected" : ""}>M</option>
                    <option value="L" ${item.size === "L" ? "selected" : ""}>L</option>
                    <option value="XL" ${item.size === "XL" ? "selected" : ""}>XL</option>
                    <option value="XXL" ${item.size === "XXL" ? "selected" : ""}>XXL</option>
                    <option value="3XL" ${item.size === "3XL" ? "selected" : ""}>3XL</option>
                    <option value="4XL" ${item.size === "4XL" ? "selected" : ""}>4XL</option>
                </select>
            </td>
            <td><button class="remove-item btn btn-danger" data-index="${index}">Remove</button></td>
        `;
        cartTable.appendChild(row);
        totalPrice += item.price * item.quantity;
    });

    totalPriceElement.innerText = `₹${totalPrice}`;
}

// Function to update cart when quantity changes
function updateQuantity(button, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let index = button.getAttribute("data-index");
    let item = cart[index];

    // Adjust quantity and ensure it doesn't go below 1
    item.quantity = Math.max(1, item.quantity + change);

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Function to update item size in cart
function updateSize(select) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let index = select.getAttribute("data-index");

    cart[index].size = select.value;
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Function to remove an item from cart
function removeItem(button) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let index = button.getAttribute("data-index");

    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}
