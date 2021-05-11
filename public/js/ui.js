// URL mapping, from hash to a function that responds to that URL action
const router = {
  "/": () => showContent("content-home"),
  "/account": () => requireAuth(() => showContent("content-account"), "/account"),
  "/login": () => login(),
  "/logout": () => logout(),
  "/cart": () => processCart(),
  "/cart/checkout": () => initOrder()
};

//Declare helper functions

const processCart = () => {
  if(window.location.search){
    let itemToAdd = queryStringToObj();
    window.localStorage.currentCart = window.localStorage.currentCart ? JSON.stringify(JSON.parse(window.localStorage.currentCart).push(itemToAdd)) : JSON.stringify([itemToAdd]);
    window.history.replaceState({}, {}, "/cart");
  }else if(window.localStorage.currentCart){
    let currentCart = JSON.parse(window.localStorage.currentCart);
    document.getElementById("item-name").innerText = currentCart[0].itemName;
    document.getElementById("item-price").innerText = currentCart[0].itemPrice;
    document.getElementById("cart-total").innerText = currentCart[0].itemPrice;
    document.getElementById("cart-empty").setAttribute("hidden","");
    document.getElementById("cart-item").removeAttribute("hidden");
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
      document.getElementById("account-link").innerHTML = document.getElementById("account-link").innerHTML.replace("Login",user.nickname);
    }
    
    if(window.localStorage.currentCart){
      document.getElementById("cart-amount").innerText = JSON.parse(window.localStorage.currentCart).length;
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
