// URL mapping, from hash to a function that responds to that URL action
const router = {
  "/": () => showContent("content-home"),
  "/account": () => requireAuth(() => processAccount(), "/account"),
  "/login": () => login(),
  "/logout": () => logout(),
  "/cart": () => processCart(),
  "/cart/checkout": () => initOrder()
};

//Declare helper functions

const clearCart = () => {
  eachElement(".cart-buttons", (e) => e.classList.add("disabled"));
  document.getElementById("cart-total").setAttribute("hidden","");
  delete window.localStorage.currentCart;
  var cNode = document.getElementById("cart-item-list").cloneNode(false);
  document.getElementById("cart-item-list").parentNode.replaceChild(cNode, document.getElementById("cart-item-list"));
  document.getElementById("cart-empty").removeAttribute("hidden");
}

const processAccount = async () => {
  let user = await auth0.getUser();
  document.getElementById("email").innerText = user.email;
  document.getElementById("given_name").innerText = user.given_name ? user.given_name : "Please login with a social provider to enrich profile";
  document.getElementById("family_name").innerText = user.family_name ? user.family_name : "Please login with a social provider to enrich profile";
  
  if(user["https://pizza-poc/previousOrders"]){
    let previousOrders = user["https://pizza-poc/previousOrders"];
    for(var i = 0; i < previousOrders.length; i++){
      //Clone order card, increment ID and add to DOM
      let orderEl = document.getElementById("order");
      let clonedOrder = orderEl.cloneNode(true);
      clonedOrder.setAttribute("id","order-" + i);
      clonedOrder.removeAttribute("hidden");
      document.getElementById("order-history").appendChild(clonedOrder);
      //Add order items to new order card in DOM
      let orderItemListEl = document.querySelector("#order-" + i + " .order-item-list");
      let orderItemEl = document.querySelector("#order-" + i + " .order-item");
      let orderTotal = 0;
      if(Array.isArray(previousOrders[i].itemName)){
        for(var j = 0; j < previousOrders[i].itemName.length; j++){
          let clonedOrderItem = orderItemEl.cloneNode(true);
          clonedOrderItem.innerHTML = clonedOrderItem.innerHTML.replace("{itemName}", previousOrders[i].itemName[j]);
          clonedOrderItem.innerHTML = clonedOrderItem.innerHTML.replace("{itemPrice}", previousOrders[i].itemPrice[j]);
          orderTotal += parseInt(previousOrders[i].itemPrice[j]);
          clonedOrderItem.setAttribute("id","order-item-" + j);
          orderItemListEl.appendChild(clonedOrderItem);
        }
        orderItemEl.setAttribute("hidden","");
      }else{
        orderItemEl.innerHTML = orderItemEl.innerHTML.replace("{itemName}", previousOrders[i].itemName);
        orderItemEl.innerHTML = orderItemEl.innerHTML.replace("{itemPrice}", previousOrders[i].itemPrice);
        orderTotal = previousOrders[i].itemPrice;
      }
      document.getElementById("no-history").setAttribute("hidden","");
      document.querySelector("#order-" + i + " .card-header").innerHTML = document.querySelector("#order-" + i + " .card-header").innerHTML.replace("{orderNumber}", i);
      document.querySelector("#order-" + i + " .card-footer").innerHTML = document.querySelector("#order-" + i + " .card-footer").innerHTML.replace("{orderTotal}", orderTotal);
    }
  }
  showContent("content-account")
}

const processCart = () => {
  if(window.location.search){
    let itemToAdd = window.location.search;
    window.localStorage.currentCart = window.localStorage.currentCart ? window.localStorage.currentCart + itemToAdd.replace("?","&") : itemToAdd;
    window.history.replaceState({}, {}, "/cart");
    window.location.reload();
  }else if(window.localStorage.currentCart){
    let currentCart = queryStringToObj(window.localStorage.currentCart);
    let cartItemEl = document.getElementById('cart-item');
    let cartTotal = 0;
    if(Array.isArray(currentCart.itemName)){
      for(var i = 0; i < currentCart.itemName.length; i++){
        var clonedCartItem = cartItemEl.cloneNode(true);
        clonedCartItem.innerHTML = clonedCartItem.innerHTML.replace("{itemName}", currentCart.itemName[i]);
        clonedCartItem.innerHTML = clonedCartItem.innerHTML.replace("{itemPrice}", currentCart.itemPrice[i]);
        cartTotal += parseInt(currentCart.itemPrice[i]);
        clonedCartItem.removeAttribute("hidden");
        clonedCartItem.setAttribute("id","card-item-" + i);
        document.getElementById("cart-item-list").appendChild(clonedCartItem);
        document.getElementById("cart-item-list").appendChild(document.createElement("hr"));
      }
    }else{
      cartItemEl.innerHTML = cartItemEl.innerHTML.replace("{itemName}", currentCart.itemName);
      cartItemEl.innerHTML = cartItemEl.innerHTML.replace("{itemPrice}", currentCart.itemPrice);
      document.getElementById("cart-item-list").appendChild(document.createElement("hr"));
      cartItemEl.removeAttribute("hidden");
      cartTotal = currentCart.itemPrice;
    }
    document.getElementById("cart-empty").setAttribute("hidden","");
    document.getElementById("cart-total").innerHTML = document.getElementById("cart-total").innerHTML.replace("{totalPrice}", cartTotal);
    document.getElementById("cart-total").removeAttribute("hidden");
    eachElement(".cart-buttons", (e) => e.classList.remove("disabled"));
  }
  showContent("content-cart");
}

/**
 * Iterates over the elements matching 'selector' and passes them
 * to 'fn'
 * @param {*} selector The CSS selector to find
 * @param {*} fn The function to execute for every element
 */
const eachElement = (selector, fn) => {
  for (let e of document.querySelectorAll(selector)) {
    fn(e);
  }
};

/**
 * Tries to display a content panel that is referenced
 * by the specified route URL. These are matched using the
 * router, defined above.
 * @param {*} url The route URL
 */
const showContentFromUrl = (url) => {
  if (router[url]) {
    router[url]();
    return true;
  }

  return false;
};

/**
 * Returns true if `element` is a hyperlink that can be considered a link to another SPA route
 * @param {*} element The element to check
 */
const isRouteLink = (element) =>
  element.tagName === "A" && element.classList.contains("route-link");

/**
 * Displays a content panel specified by the given element id.
 * All the panels that participate in this flow should have the 'page' class applied,
 * so that it can be correctly hidden before the requested content is shown.
 * @param {*} id The id of the content to show
 */
const showContent = (id) => {
  eachElement(".page", (p) => p.setAttribute("hidden",""));
  document.getElementById(id).removeAttribute("hidden");
};

/**
 * Updates the user interface
 */
const updateUI = async () => {
  try {
    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0.getUser();
      let name = user.given_name ? user.given_name : user.nickname;
      document.getElementById("account-link").innerHTML = document.getElementById("account-link").innerHTML.replace("Login",name);
    }
    
    if(window.localStorage.currentCart){
      let currentCart = queryStringToObj(window.localStorage.currentCart);
      document.getElementById("cart-amount").innerText = Array.isArray(currentCart.itemName) ? currentCart.itemName.length : 1;
    }
    
  } catch (err) {
    console.log("Error updating UI!", err);
    return;
  }

  console.log("UI updated");
};

window.onpopstate = (e) => {
  console.log(e);
  if (e.state && e.state.url && router[e.state.url]) {
    showContentFromUrl(e.state.url);
  }
};

/**
 * Parses URL queryString into plain JS object
 * @param {*} queryString URL params to parse, or blank to use current URL
 */
const queryStringToObj = (queryString) => {
	queryString = (queryString) ? queryString : window.location.search;
	var obj = {};
	var singles = [];
	if(queryString){
		queryString = queryString.replace("?","");
		var pairs = queryString.split("&");
		for(i in pairs){
			var split = pairs[i].split("=");
			if(split.length === 1){
				singles.push(split[0]);
			}else{
				if(decodeURIComponent(split[0]) in obj){
					if(!Array.isArray(obj[decodeURIComponent(split[0])])){
						var tmp = obj[decodeURIComponent(split[0])];
						obj[decodeURIComponent(split[0])] = [tmp];
					}
					obj[decodeURIComponent(split[0])].push(decodeURIComponent(split[1]));
				}else{
					obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
				}
			}
		}
	}
	
	if(singles.length){
		obj.ValueArray = singles;
	}
	return obj;
}
