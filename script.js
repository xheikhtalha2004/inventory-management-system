const PRODUCT_FILE = "products.json";
const SAVED_PRODUCTS_KEY = "addedProducts";

let products = [];
let addedProducts = [];

const form = document.getElementById("inventoryForm");
const productName = document.getElementById("productName");
const productSku = document.getElementById("productSku");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const formMessage = document.getElementById("formMessage");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceSort = document.getElementById("priceSort");
const categoryOptions = document.getElementById("categoryOptions");

const productList = document.getElementById("productList");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const productTemplate = document.getElementById("productCardTemplate");

window.addEventListener("DOMContentLoaded", startApp);

async function startApp() {
    await loadProducts();
    fillCategoryLists();
    showProducts();

    searchInput.addEventListener("input", showProducts);
    categoryFilter.addEventListener("change", showProducts);
    priceSort.addEventListener("change", showProducts);
    form.addEventListener("submit", addProduct);
}

async function loadProducts() {
    addedProducts = getSavedProducts();

    try {
        const response = await fetch(PRODUCT_FILE);
        const jsonProducts = await response.json();

        products = jsonProducts.concat(addedProducts);
    } catch (error) {
        products = addedProducts;
        showMessage("Could not load products.json. Please run this app with a local server.", true);
    }
}

function addProduct(event) {
    event.preventDefault();

    const newProduct = {
        id: Date.now(),
        name: productName.value.trim(),
        sku: productSku.value.trim().toUpperCase(),
        category: productCategory.value.trim(),
        price: Number(productPrice.value),
        stock: Number(productStock.value)
    };

    if (!isProductValid(newProduct)) {
        return;
    }

    products.push(newProduct);
    addedProducts.push(newProduct);
    saveAddedProducts();

    form.reset();
    fillCategoryLists();
    showProducts();
    showMessage("Product added successfully.");
}

function isProductValid(product) {
    if (product.name === "" || product.sku === "" || product.category === "") {
        showMessage("Please fill all required fields.", true);
        return false;
    }

    if (product.price < 0 || Number.isNaN(product.price)) {
        showMessage("Please enter a valid price.", true);
        return false;
    }

    if (product.stock < 0 || !Number.isInteger(product.stock)) {
        showMessage("Please enter a valid stock quantity.", true);
        return false;
    }

    const skuAlreadyExists = products.some(function (item) {
        return item.sku.toLowerCase() === product.sku.toLowerCase();
    });

    if (skuAlreadyExists) {
        showMessage("This SKU already exists.", true);
        return false;
    }

    return true;
}

function showProducts() {
    const filteredProducts = getFilteredProducts();

    productList.innerHTML = "";
    resultsCount.textContent = filteredProducts.length;
    emptyState.hidden = filteredProducts.length > 0;

    const productCards = document.createDocumentFragment();

    filteredProducts.forEach(function (product) {
        productCards.appendChild(createProductCard(product));
    });

    productList.appendChild(productCards);
}

function getFilteredProducts() {
    let filteredProducts = products.filter(searchByName);
    filteredProducts = filteredProducts.filter(filterByCategory);
    filteredProducts = sortByPrice(filteredProducts);

    return filteredProducts;
}

function searchByName(product) {
    const searchText = searchInput.value.trim().toLowerCase();

    if (searchText === "") {
        return true;
    }

    return product.name.toLowerCase().includes(searchText);
}

function filterByCategory(product) {
    const selectedCategory = categoryFilter.value;

    if (selectedCategory === "all") {
        return true;
    }

    return product.category === selectedCategory;
}

function sortByPrice(productList) {
    const selectedSort = priceSort.value;

    if (selectedSort === "price-asc") {
        productList.sort(function (a, b) {
            return a.price - b.price;
        });
    }

    if (selectedSort === "price-desc") {
        productList.sort(function (a, b) {
            return b.price - a.price;
        });
    }

    return productList;
}

function createProductCard(product) {
    const card = productTemplate.content.cloneNode(true);

    card.querySelector(".product-name").textContent = product.name;
    card.querySelector(".product-sku").textContent = "SKU: " + product.sku;
    card.querySelector(".product-category").textContent = product.category;
    card.querySelector(".product-price").textContent = "$" + product.price.toFixed(2);
    card.querySelector(".product-stock").textContent = product.stock + " in stock";

    return card;
}

function fillCategoryLists() {
    const categories = getCategories();
    const selectedCategory = categoryFilter.value;

    categoryFilter.innerHTML = "";
    categoryOptions.innerHTML = "";

    addOption(categoryFilter, "All categories", "all");

    categories.forEach(function (category) {
        addOption(categoryFilter, category, category);
        addOption(categoryOptions, category, category);
    });

    if (categories.includes(selectedCategory)) {
        categoryFilter.value = selectedCategory;
    }
}

function getCategories() {
    const categories = [];

    products.forEach(function (product) {
        if (!categories.includes(product.category)) {
            categories.push(product.category);
        }
    });

    categories.sort();
    return categories;
}

function addOption(selectElement, label, value) {
    const option = document.createElement("option");

    option.textContent = label;
    option.value = value;
    selectElement.appendChild(option);
}

function getSavedProducts() {
    const savedProducts = localStorage.getItem(SAVED_PRODUCTS_KEY);

    if (savedProducts === null) {
        return [];
    }

    try {
        return JSON.parse(savedProducts);
    } catch (error) {
        return [];
    }
}

function saveAddedProducts() {
    localStorage.setItem(SAVED_PRODUCTS_KEY, JSON.stringify(addedProducts));
}

function showMessage(message, isError) {
    formMessage.textContent = message;

    if (isError) {
        formMessage.classList.add("error");
    } else {
        formMessage.classList.remove("error");
    }
}
