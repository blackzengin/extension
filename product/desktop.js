/*

  _                       
 |_) ._ _   _|      _ _|_ 
 |   | (_) (_| |_| (_  |_ 
                          

*/

(function(){

	/*
	  _                       
	 |_) ._ _   _|      _ _|_ 
	 |   | (_) (_| |_| (_  |_ 

	*/
	var Product = {
		timeout: [],
		getElementsFromHTML: function(htmlstring, selector) {
			var doc = document.createElement("div");
			doc.innerHTML = htmlstring;

			var elements = doc.querySelectorAll(selector);
			return elements;
		},
		getProductsFromCart: function(callback, context) {
			var c = Extension.Common;
			var products = [];
			var response = new Extension.Common.xhr();
			if (c.checkurl("*secure.ikea.com*"))
				var cartUrl = "/webapp/wcs/stores/servlet/M2OrderItemDisplay?storeId=" + ExtensionSetting.Country.storeId + "&langId=" + ExtensionSetting.Country.langId + "&catalogId=11001";
			else if (c.checkurl("*www.ikea.com*"))
				var cartUrl = "/webapp/wcs/stores/servlet/OrderItemDisplay?storeId=" + ExtensionSetting.Country.storeId + "&langId=" + ExtensionSetting.Country.langId + "&catalogId=11001";


			var DONE = 4;
			var OK = 200;
			response.context = context;
			response.open('GET', cartUrl, true);
			//response.responseType = "document";
			response.onreadystatechange = function() {
				if (response.readyState === DONE) {
					if (response.status === OK) {
						var elem = Extension.Product.getElementsFromHTML(response.responseText, "form#updateAllForm li.productRow") || Extension.Product.getElementsFromHTML(response.responseText, "div#productSection div.productRow");
						//var products = response.response.querySelector("#productSection");
						if (elem){
							var c = Extension.Common;
							for (var i=0; i<elem.length; i++){
								if (c.checkurl("*secure.ikea.com*")){
									var artNumber = elem[i].className.match(/itemNo?S\d*|itemNo\d*/g);
									artNumber = artNumber[0].replace("itemNo","");
									var artQuantity = c.toInt(elem[i].querySelector("div.quantity select option[selected]").getAttribute("value"));
								} else if (c.checkurl("*www.ikea.com*")){
									var artNumber = c.toInt(elem[i].querySelector("div#itemNumber").innerHTML);
									var artQuantity = c.toInt(elem[i].querySelector("div.quantityField input]").getAttribute("value"));
								}

								products.push({
									n: artNumber,
									q: artQuantity
								});
							}
						}
						if (typeof callback == "function") callback(products, response.context);
					}
				}
			}
			response.send(null);
		},
		addProducts: function(products, callback, context) {

			if (products){
				var nrProducts = products.length;
				var currentProd = 0;

				var addToCart = function(url){
					var url = "https://secure.ikea.com/webapp/wcs/stores/servlet/IrwWSOrderItemAdd?storeId=" + ExtensionSetting.Country.storeId + "&langId=" + ExtensionSetting.Country.langId + "&type=json&partNumber=" + products[currentProd].n + "&quantity=" + products[currentProd].q + "&i=" + currentProd;
					var response = new Extension.Common.xhr();
					var DONE = 4;
					var OK = 200;
					response.context = context;
					response.open('GET', url, true);
					response.onreadystatechange = function() {
						if (response.readyState === DONE) {
							currentProd++;
							//console.log(response.status);
							//if (currentProd == nrProducts) if (typeof callback == "function") callback(response.context);
							if (response.status === OK) {
								var json = JSON.parse(response.responseText);
								if (json.code == 0) {
									if(currentProd < nrProducts){
										console.log("Another");
										addToCart();
									} else {
										console.log("Done");
										if (typeof callback == "function") callback(response.context);
									}
								}
							} else {
								console.log("Failed");
								if(currentProd < nrProducts){
									addToCart();
								}
							}
						}
					}
					response.send(null);
				}
				addToCart();
			} else if (typeof callback == "function") callback(context);
		},
		getProductsHtml: function(products, callback, context) {
			var c = Extension.Common
			  , p = Extension.Product
			  , productsHtml = [];
			if (c.checkMobile()) {
				for (var i = 0; i < products.length; i++) {
					var productFragment = 'https://m2.ikea.com' + ExtensionSetting.Country.homePath + 'products/' + products[i].substr(products[i].length - 3, products[i].length) + '/' + products[i].toLowerCase() + '-compact-fragment.html';
					if (document.URL.indexOf('/di/te/') > -1)
						productFragment = 'https://m2.ppe.ikeadt.com/di/te/products/' + products[i].substr(products[i].length - 3, products[i].length) + '/' + products[i] + '-compact-fragment.html';

					this.getFragmentM2(productFragment, i, function(fragment, i) {

						productsHtml[fragment.i] = fragment;
						var count = 0;
						for (var j = 0; j < products.length; j++)
							if (c.varExist(productsHtml[j]))
								count++;

						if (count == products.length)
							callback(productsHtml, context);
					}, context);
				}
			} else {

				for (var i = 0; i < products.length; i++) {
					var productFragment = '//www.ikea.com' + ExtensionSetting.Country.homePath + "catalog/products/" + products[i].toUpperCase() + "?type=xml&dataset=normal,prices,allimages,parentCategories,attributes";

					this.getFragmentIRW(productFragment, i, function(fragment, i) {

						productsHtml[fragment.i] = fragment;
						var count = 0;
						for (var j = 0; j < products.length; j++)
							if (c.varExist(productsHtml[j]))
								count++;

						if (count == products.length)
							callback(productsHtml, context);
					}, context);
				}

			}
			if (products.length == 0)
				callback(productsHtml, context);
		},
		addCxenseTracking: function(response, context) {
			var c = Extension.Common;
			var cxenseTracking = "";
			var responseText = response.responseText;
			if (c.varExist(context.vars.cxense)) {
				var items = context.vars.cxense.items;
				for (var j = 0; j < items.length; j++) {
					if (items[j]['ike-productid'].toLowerCase() == context.productChunks[context.i][response.i].toLowerCase()) {
						cxenseTracking = 'data-clickurl="' + items[j].click_url + '"';
					}
				}

			}
			if (c.varExist(cxenseTracking, true)) {
				responseText = responseText.replace(/href=/g, cxenseTracking + " href=");
			}
			return responseText
		},
		getFragmentM2: function(productFragment, i, callback, context) {
			var c = Extension.Common;
			try {
				var response = new Extension.Common.xhr();
				var DONE = 4;
				var OK = 200;
				response.context = context;
				response.i = i;
				response.open('GET', productFragment, true);
				response.onreadystatechange = function() {
					if (response.readyState === DONE) {
						if (response.status === OK) {
							var responseText = Extension.Product.addCxenseTracking(response, context);
							callback({
								html: responseText,
								i: response.i,
								failed: false
							});
						} else {
							callback({
								html: "File not found.",
								i: response.i,
								failed: true
							});
						}
					}
				}
				;
				response.send();
			} catch (err) {
				console.log("getFragmentM2: " + err)
			}
		},
		getFragmentIRW: function(productFragment, i, callback, context) {
			var c = Extension.Common;
			try {
				var response = new Extension.Common.xhr();
				var DONE = 4;
				var OK = 200;
				response.context = context;
				response.i = i;
				response.open('GET', productFragment, true);
				response.onreadystatechange = function() {
					if (response.readyState === DONE) {
						if (response.status === OK) {
							Extension.Product.createFragmentIRW(response, function(fragmentHtml, context) {
								//var responseText = Extension.Product.addCxenseTracking(response, context);
								if (fragmentHtml == "File not found."){
									callback({
										html: fragmentHtml,
										i: response.i,
										failed: true
									});
								} else {
									callback({
										html: fragmentHtml,
										i: response.i,
										failed: false
									});
								}
							}, response.context);
						} else {
							callback({
								html: "File not found.",
								i: response.i,
								failed: true
							});
						}
					}
				}
				;
				response.send();
			} catch (err) {
				console.log("getFragmentIRW: " + err)
			}
		},
		createFragmentIRW: function(response, callback, context) {
			this.readXml(response, function(product, context) {
				var c = Extension.Common;
				if (c.varExist(product.partnumber, true)){
					var c = Extension.Common;
					// Check for image="" attribute and return imageHTML
					var imageHtml = Extension.Product.getImageUrl(product);

					var unitDiv = ""
					  , unitSpan = "";
					//if (product.unit.indexOf("stk") == -1){
					unitDiv = '<div class="unit">/' + product.unit + '</div>';
					unitSpan = '<span class="unit">/' + product.unit + '</span>';
					//}

					var previous = "";
					if (product.pricePrevious.length > 0) {
						previous = '<div class="pricePrevious"><div class="strikePrice">' + product.pricePrevious + unitSpan + '</div></div>'
					}

					var nlp = "";
					var news = "";
					if (product.news == "true") {
						news = '<div><span class="newImgCssSmall">Nyhet</span></div>'
						previous = "";
					} else {
						if (product.nlp == "true") {
							nlp = '<img class="nlpImage" id="imgNLPProduct' + product.i + '" src="/ms/img/nlp/no_NO/nlp_02.png" border="0" alt="Ny lavere pris">';
						}
					}

					var btistart = ""
					  , btiend = "";
					if (product.bti == "true") {
						btistart = '<div class="btiSpace"></div><div class="productBtiBack"><div class="productBtiFront">';
						btiend = '</div></div>';
					}

					//energyLabel

					var energyLabel = "";
					var finche = "";
					if (product.finche == "true") {
						finche = '<a class="productFicheSmall align-center" href="javascript:energyLabelBox.open(\'' + product.partnumber + '\');">Energimerke</a>';
						var colorHex = "";
						var colorRgb = "";
						var letter = "";
						var sign = "";

						if (product.energyLabel == "A+++") {
							colorHex = "#198D42";
							colorRgb = "rgb(25, 141, 66)";
							letter = "A";
							sign = "+++";
						} else if (product.energyLabel == "A++") {
							colorHex = "#198D42";
							colorRgb = "rgb(25, 141, 66)";
							letter = "A";
							sign = "++";
						} else if (product.energyLabel == "A+") {
							colorHex = "#67A437";
							colorRgb = "rgb(103, 164, 55)";
							letter = "A";
							sign = "+";
						} else if (product.energyLabel == "A") {
							colorHex = "#F6E100";
							colorRgb = "rgb(246, 225, 0)";
							letter = "A";
							sign = "";
						} else if (product.energyLabel == "B") {
							colorHex = "#BCC714";
							colorRgb = "rgb(188, 199, 20)";
							letter = "B";
							sign = "";
						} else if (product.energyLabel == "C") {
							colorHex = "#F6E100";
							colorRgb = "rgb(246, 225, 0)";
							letter = "C";
							sign = "";
						} else if (product.energyLabel == "D") {
							colorHex = "#E3AF00";
							colorRgb = "rgb(227, 175, 0)";
							letter = "D";
							sign = "";
						} else if (product.energyLabel == "E") {
							colorHex = "";
							colorRgb = "";
							letter = "E";
							sign = "";
						}
						var btismall = "";
						if (product.bti == "true") {
							btismall = "bti-small";
						}

						energyLabel = '<a class="energy-small ' + btismall + '" href="javascript:energyLabelBox.open(\'' + product.partnumber + '\');"><span class="energy-arrow-left-small" style="border-right: 10px solid ' + colorHex + ';"></span><span class="energy-class-small" value="' + product.energyLabel + '" style="background: ' + colorRgb + ';">' + letter + '</span><span class="energy-class-plus-small" style="background: ' + colorRgb + ';">' + sign + '</span><div style="display:none">00008</div></a>'

					}

					var familyPrice = "";
					if (product.familyprice.length > 0) {
						familyPrice = '<div id="" class="prodFamily">IKEA FAMILY-pris</div>' + '<div class="price prodFamilyPrice">' + product.familyprice + unitDiv + '</div>' + '<div class="familyOfferDate" style="display: block; font-size: 11px">' + product.pricedisclaimer + '</div>' + '<div class="regularPriceHead">Ordinær pris</div>';
					}

					var co = ExtensionSetting.Country;
					var buttonContainer = "";
					if (product.buyable == "true") {
						buttonContainer = '<div class="buttonsContainer"><a data-id="' + product.partnumber + '" onclick="Extension.Product.addProductNew(this);return false;" href="#" class="blueBtn" id="popupAddToCart' + product.partnumber + '_1_' + product.i + '">Kjøp på nett</a>' + Extension.Template.options.addtocartloader + '<div class="clear-float"></div>' + '<span class="addToCartDone">Lagt i <a href="/webapp/wcs/stores/servlet/OrderItemDisplay?storeId=' + co.storeId + '&langId=' + co.langId + '&catalogId=11001&orderId=.&priceexclvat=&newLinks=true">handlevogna</a></span>' + '</div>';
					}

					var lastColumn = "";
					var newRow = c.isInt((product.i + 1) / 4);
					if (newRow) {//lastColumn = "lastColumn";
					}

					var cxenseTracking = "";
					if (c.varExist(context.vars.cxense)) {
						var items = context.vars.cxense.items;
						for (var j = 0; j < items.length; j++) {
							if (items[j]['ike-productid'].toLowerCase() == product.partnumber.toLowerCase()) {
								cxenseTracking = 'data-clickurl="' + items[j].click_url + '"';
							}
						}

					}

					var fragmentHtml = '<div id="item_' + product.partnumber + '_' + product.i + '" class="threeColumn product ' + lastColumn + '"'//+'onmouseover="Extension.Product.showBtn(this);"'
					//+'onmouseout="Extension.Product.hideBtn(this);"'
					+ '>' + '<div class="image"><a ' + cxenseTracking + ' href="' + co.homePath + 'catalog/products/' + product.partnumber + '/" class="productLink" onclick="irwStatTopProductClicked();">' + '<img id="imgThmbProduct' + product.i + '" src="' + Extension.Product.getImageUrl(product) + '" border="0" alt="' + product.name + ', ' + product.fulldescription + '" class="prodImg">' + '</a></div>' + '<div class="productDetails"><a ' + cxenseTracking + ' href="' + co.homePath + 'catalog/products/' + product.partnumber + '/" style="color:#000000" onclick="irwStatTopProductClicked();">' + nlp + news + '<div class="productTitle floatLeft">' + product.name + '</div>' + '<div class="productDesp">' + product.fulldescription + '</div>' + familyPrice + btistart + '<div class="price regularPrice">' + product.price + unitDiv + energyLabel + '</div>' + btiend + previous + finche + '<div style="clear:both"></div>' + '</div></a>' + buttonContainer + '</div>'//+'<div class="clearBoth"></div>'
					+ '';
				} else {
					fragmentHtml = "File not found.";
					try{
						console.log("Art: " + product.errornumber + ", " + product.errormessage);
					} catch(err){}
				}

				callback(fragmentHtml, context);

			}, context);
		},
		readXml: function(response, callback, context) {
			var product = {
				i: response.i,
				partnumber: this.getNodeVal(response, "item partNumber"),
				buyable: this.getNodeVal(response, "item buyable"),
				browsable: this.getNodeVal(response, "item browseable"),
				name: this.getNodeVal(response, "item name"),
				energyLabel: this.getNodeVal(response, "item energyClassLabel"),
				finche: this.getNodeVal(response, "item hasProductFiche"),
				description: this.getNodeVal(response, "item facts"),
				color: this.getNodeVal(response, "item attributesItems attributeItem", "farge", "name"),
				measurement: this.getNodeVal(response, "item attributesItems attributeItem", "størrelse", "name"),
				parentIdentifier: this.getNodeVal(response, "categories parents category identifier"),
				parentCatalogIdentifier: this.getNodeVal(response, "categories parents category catalogIdentifier"),
				parentName: this.getNodeVal(response, "categories parents category name"),
				parentURL: this.getNodeVal(response, "categories parents category URL"),
				fulldescription: "",
				price: this.getNodeVal(response, "item prices normal priceNormal"),
				unit: this.getNodeVal(response, "item prices normal priceNormal", "perUnit"),
				nlp: this.getNodeVal(response, "item prices normal priceNormal", "nlp"),
				news: this.getNodeVal(response, "item new"),
				bti: this.getNodeVal(response, "item bti"),
				pricePrevious: this.getNodeVal(response, "item prices normal pricePrevious"),
				familyprice: this.getNodeVal(response, "item prices family-normal priceNormal"),
				pricedisclaimer: this.getNodeVal(response, "item prices family-normal priceDisclaimer"),
				errornumber: this.getNodeVal(response, "error", "referencedId"),
				errormessage: this.getNodeVal(response, "error message"),
				images: [],
			};

			product.fulldescription = product.description;
			if (product.color.length > 2) {
				if (!(product.fulldescription.indexOf(product.color) > -1)) {
					product.fulldescription = product.fulldescription + ", " + product.color;
				}
			}
			if (product.measurement.length > 3) {
				product.fulldescription = product.fulldescription + ", " + product.measurement;
			}

			var images = this.getNodeElem(response, "item images normal image");

			try {
				for (var i = 0; i < images.length; i++) {
					product.images.push(this.nodeTextVal(images[i]));
				}
			} catch (err) {}
			for (var i=0; i<product.images.length; i++){
				product.images[i] = product.images[i].replace(/http:|https:/, "");
			}

			callback(product, context);
		},

		getImageUrl: function(product, targetElem) {
			var c = Extension.Common;
			var image = "";
			var imageUrl = "";
			var imageParam = 0;
			//c.getCustomAttribute(targetElem, "image");
			if (!isNaN(imageParam) || imageParam.length > 0) {
				if (isNaN(imageParam)) {
					if (imageParam.indexOf("/") > -1) {
						imageUrl = imageParam;
					}
				} else {
					var imageUrl = product.images[0];
					if (imageParam > -1) {
						if (product.images[imageParam]) {
							imageUrl = product.images[imageParam];
						}
					}
				}
			} else if (imageParam.length == 0) {
				var imageUrl = product.images[0];
			}
			return imageUrl;
		},

		getNodeVal: function(res, querystr, attr, childattr) {
			try {
				var elem = this.getNodeElem(res, querystr);
				if (elem.length > 0) {
					if (attr) {
						if (childattr) {
							for (var i = 0; i < elem.length; i++) {
								if (this.getNodeAttr(elem[i], childattr) == attr) {
									var e = elem[i].getElementsByTagName("value");
									return this.nodeText(e);
								}
							}
						} else {
							return this.getNodeAttr(elem[0], attr);
						}
					} else {
						return this.nodeText(elem);
					}
				} else
					return ""
			} catch (err) {
				return ""
			}
			return "";
		},
		nodeText: function(elem) {
			try {
				var e = elem[0].childNodes[0];
				return this.nodeTextVal(e);
			} catch (err) {
				return "";
			}
		},
		nodeTextVal: function(e) {
			try {
				if (e.nodeValue)
					return e.nodeValue
				else
					return e.textContent
			} catch (err) {
				return "";
			}
		},

		getNodeAttr: function(elem, attr) {
			try {
				if (typeof elem.getAttribute(attr) !== 'undefined')
					return elem.getAttribute(attr);
				else if (typeof elem[0].getAttribute(attr) !== 'undefined')
					return elem[0].getAttribute(attr);
			} catch (err) {
				return ""
			}
		},

		getNodeElem: function(res, querystr) {
			try {
				var qs = querystr.split(" ");
				var res = res.responseXML.getElementsByTagName(qs[0]);
				for (var i = 1; i < qs.length; i++) {
					res = res[0].getElementsByTagName(qs[i])
				}
				return res;
			} catch (err) {}
		},
		addProduct: function(elem) {
			var productid = elem.attributes["data-id"].value;
			addToShopListPopup.createGenericPopup(200, "", "slPopup", "slPopup", elem, elem.top, -100);
			searchESalesNotify(productid, elem, "non_esales_adding_to_cart");
			addItemToCart(productid, "", ExtensionSetting.Country.storeId, ExtensionSetting.Country.langId, 1, elem);
		},
		showBtn: function(elem) {
			var c = Extension.Common;
			c.addClass(elem.querySelector('.buttonsContainer'), 'fadein');
		},
		hideBtn: function(elem) {
			setTimeout(function() {
				var c = Extension.Common;
				c.removeClass(elem.querySelector('.buttonsContainer'), 'fadein');
			}, 2000);
		},
		addProductNew: function(elem) {
			var c = Extension.Common;
			var co = ExtensionSetting.Country;
			var quantity = "";
			var productNumber = ""
			if (elem.id.indexOf("popupAddToCart") > -1) {
				var id = elem.id.replace("popupAddToCart", "");
				var t = id.split("_");
				try {
					productNumber = t[0];
					quantity = t[1];
					if ((!isNaN(productNumber) && productNumber.length == 8) || (productNumber.substring(0, 1) == 'S' && !isNaN(productNumber.substring(1, 9)) && productNumber.length == 9)) {

						var loaderLoad = elem.parentNode.parentNode.querySelector("div.addToCartLoad")
						var loaderDone = elem.parentNode.parentNode.querySelector("span.addToCartDone")

						if (c.varExist(loaderLoad) && c.varExist(loaderDone)) {
							c.addClass(loaderLoad, "fadein");
							loaderDone.setAttribute("style", "visibility: hidden");
							c.removeClass(loaderDone, "fadein");
						}

						var ajaxUrl = '/webapp/wcs/stores/servlet/IrwWSOrderItemAdd?storeId=' + co.storeId + '&langId=' + co.langId + '&type=json&partNumber=' + productNumber + '&quantity=' + quantity;
						// + '&i=' + index;

						var c = Extension.Common;
						try {
							var response = new Extension.Common.xhr();
							var DONE = 4;
							var OK = 200;
							response.open('GET', ajaxUrl, true);
							response.onreadystatechange = function() {
								if (response.readyState === DONE) {
									if (response.status === OK) {
										try {
											updateNoOfCartItems(ExtensionSetting.Country.storeId);
											setTimeout(function(){
												Extension.Common.removeClass(loaderLoad, "fadein");
											}, 1000);
											setTimeout(function() {
												loaderDone.setAttribute("style", "visibility: visible");
												Extension.Common.addClass(loaderDone, "fadein");
												setTimeout(function() {
													Extension.Common.removeClass(loaderDone, "fadein");
												}, 5000);
											}, 100);
										} catch (e) {}
									} else {
										Extension.Common.removeClass(loaderLoad, "fadein");
										Extension.Common.removeClass(loaderDone, "fadein");
									}
								}
							}
							response.send();
						} catch (err) {
							console.log("getFragmentM2: " + err)
						}

					}

				} catch (err) {}
			}
		}
	}

	/*

	  _                                   
	 |_) ._ _   _|      _ _|_ |  o  _ _|_ 
	 |   | (_) (_| |_| (_  |_ |_ | _>  |_ 


	*/
	var ProductList = {
		productlists: [],
		swipers: [],
		insertProductsHtml: function(productChunks, callback, context) {

			Extension.Product.getProductsHtml(productChunks[context.i], function(productsHtml, context) {
				var c = Extension.Common;
				if (context.type == "list" || context.type == "") {

					//Fill productlist
					var targetElem = context.targetElem.querySelector('.product-list__products');
					for (var i = 0; i < productsHtml.length; i++) {
						try {
							if (c.varExist(productsHtml[i]))
								if (productsHtml[i].html.indexOf('product-missing') == -1 && productsHtml[i].html.indexOf('File not found.') == -1)
									targetElem.insertAdjacentHTML('beforeEnd', productsHtml[i].html);
						} catch (err) {}
					}
				} else if (context.type == "carusel") {

					//Fill Carusel
					var targetElem = context.targetElem.querySelector('.swiper-wrapper');
					for (var i = 0; i < productsHtml.length; i++)
						try {
							if (c.varExist(productsHtml[i]))
								if (productsHtml[i].html.indexOf('product-missing') == -1 && productsHtml[i].html.indexOf('File not found.') == -1)
									targetElem.insertAdjacentHTML('beforeEnd', '<div class="swiper-slide">' + productsHtml[i].html + '</div>');
							//Extension.ProductList.updateCarusel(context.productListId);
						} catch (err) {}

				}

				context.i++;
				if (context.i < context.productChunks.length) {
					callback(context, "update");
					Extension.ProductList.insertProductsHtml(context.productChunks, callback, context);
				} else
					callback(context, "filled");

			}, context);
			//{context: context, type: context.type, targetElem: context.targetElem, i: context.i, productChunks: context.productChunks});

		},

		updateAllCarusels: function() {
			var c = Extension.Common;
			for (var i = 0; i < this.swipers.length; i++)
				if (c.varExist(this.swipers[i]))
					this.updateCarusel(i)

		},
		updateCarusel: function(n, value) {
			var c = Extension.Common
			  , el = Extension.Element;
			if (c.varExist(this.swipers[n])) {
				if (c.varExist(value))
					this.swipers[n].appendSlide(value);
				else
					this.swipers[n].update(true);
			} else {
				var space = 10;
				var swiperElem = document.getElementById("swiper-container_" + n);
				var prodInView = 4;
				if (!c.checkMobile()) {
					if (swiperElem) {
						if (c.hasClass(swiperElem.parentNode.parentNode, "prod-5-small"))
							prodInView = 5;
						if (c.hasClass(swiperElem.parentNode.parentNode, "prod-4-small"))
							space = 81;
					}
				}
				var params = {
					//scrollbar: "#swiper-scrollbar_" + n,
					scrollbarHide: true,
					slidesPerView: 'auto',
					//paginationClickable: true,
					spaceBetween: space,
					freeMode: true,
					grabCursor: true,
					freeModeSticky: true

				}
				if (el.countChildNodes(swiperElem.querySelector(".swiper-wrapper")) > prodInView || c.checkMobile()) {
					params.nextButton = "#swiper-button-next_" + n;
					params.prevButton = "#swiper-button-prev_" + n;
				} else {
					document.getElementById('swiper-button-prev_' + n).style.setProperty('display', 'none');
					document.getElementById('swiper-button-next_' + n).style.setProperty('display', 'none');
				}

				this.swipers[n] = new Swiper("#swiper-container_" + n,params);

			}
		},
		setProductHeightList: function(elem) {
			if (!Extension.Common.checkMobile()) {
				setTimeout(function() {
					var c = Extension.Common;
					var prodInView = 4;
					if (c.hasClass(elem, "prod-5-small"))
						prodInView = 5;
					//var elemcontainer = elem.querySelector(".product-list__products");

					elem.style.setProperty('display', 'block');
					var elems = elem.querySelectorAll(".product");

					var containerHeight = 0
					  , maxHeight = 0
					  , previous = 0;
					for (var i = 0; i < elems.length; i++) {
						elems[i].style.setProperty("height", "auto");
						if (elems[i].clientHeight > maxHeight)
							maxHeight = elems[i].clientHeight;

						var newRow = c.isInt((i + 1) / prodInView);

						if (newRow || i + 1 == elems.length) {
							if (maxHeight > 72) {
								maxHeight += 72;
								for (var j = previous; j < i + 1; j++) {
									elems[j].style.setProperty("height", maxHeight + "px");
									var btn = elems[j].querySelector('.buttonsContainer');
									if (btn)
										Extension.Common.addClass(btn, "fadein");

								}
							}
							containerHeight += maxHeight;
							maxHeight = 0;
							previous = i + 1;
						}
						if (i + 1 == elems.length) {
							if (!c.hasClass(elems[i].parentNode, 'swiper-slide'))
								elems[i].parentNode.style.setProperty('height', containerHeight + 'px')
						}
					}
					elem.style.setProperty('display', '');

				}, 200);
			}
		},
		setProductHeightCarusel: function(elem) {
			if (!Extension.Common.checkMobile()) {
				setTimeout(function() {
					var maxHeight = 0;
					elem.style.setProperty('display', 'block');
					var elems = elem.querySelectorAll(".swiper-slide .product");
					for (var i = 0; i < elems.length; i++) {
						elems[i].style.setProperty("height", "auto");
						if (elems[i].clientHeight > maxHeight)
							maxHeight = elems[i].clientHeight;
					}
					elem.style.setProperty('display', '');
					if (maxHeight > 72) {
						maxHeight += 72;
						for (var i = 0; i < elems.length; i++) {
							elems[i].style.setProperty("height", maxHeight + "px");
							var btn = elems[i].querySelector('.buttonsContainer');
							if (btn)
								Extension.Common.addClass(btn, "fadein");

						}
					}
				}, 200);
			}
		},
		createList: function(vars) {
			// Create layout for lists
			var c = Extension.Common;
			if (vars.products.length > 0) {
				if (vars.type == "list" || vars.type == "") {

					//create PLP page
					var productlistHtml = '';
					//'<div class="product-list component">';
					if (c.varExist(vars.header, true))
						productlistHtml += '<div><strong>' + vars.header + '</strong></div>';
					productlistHtml += '<div class="product-list__products"></div>';

					var elem = document.createElement("div");
					elem.setAttribute("class", "product-list component");
					if (c.checkMobile())
						elem.className += " m2-list";
					else
						elem.className += " irw-list";
					elem.innerHTML = productlistHtml;
					vars.targetElem.insertBefore(elem, vars.targetElem.firstChild);

				} else if (vars.type == "carusel") {

					//create Carusel
					var swiperHtml = '<div class="swiper-heading">';
					if (c.varExist(vars.header, true))
						swiperHtml += '<p><strong>' + vars.header + '</strong></p>';
					swiperHtml += '</div><div id="swiper-button-next_' + vars.n + '" class="swiper-button-next"></div><div id="swiper-button-prev_' + vars.n + '" class="swiper-button-prev"></div><div id="swiper-container_' + vars.n + '" class="swiper-container"><div class="swiper-wrapper">';
					swiperHtml += '</div>';
					//swiperHtml += '<div id="swiper-scrollbar_' + n + '" class="swiper-scrollbar"></div>';
					swiperHtml += '</div>';

					var elem = document.createElement("div");
					elem.className = "swiper-main";
					if (c.checkMobile())
						elem.className += " m2-list";
					else
						elem.className += " irw-list";
					elem.innerHTML = swiperHtml;
					vars.targetElem.insertBefore(elem, vars.targetElem.firstChild);

				}

				//Devide productlist for faster load
				var productChunks = []
				  , productChunksStep = 12
				  , productChunksCurrent = 0;

				while (productChunksCurrent <= vars.products.length) {
					productChunks.push(vars.products.slice(productChunksCurrent, productChunksCurrent + productChunksStep));
					productChunksCurrent += productChunksStep;
				}

				if (typeof vars.callback == "function")
					vars.callback(vars, "started");

				//Fill list
				Extension.ProductList.insertProductsHtml(productChunks, function(context, status) {
					if (context.type == "carusel") {
						if (context.i == context.productChunks.length)
							Extension.ProductList.setProductHeightCarusel(context.targetElem);
						Extension.ProductList.updateCarusel(context.productListId);
					} else if (context.type == "list") {
						if (context.i == context.productChunks.length)
							Extension.ProductList.setProductHeightList(context.targetElem);
					}
					if (status == "filled") {
						Extension.DisplayTimer.abcountdown--;
						if (Extension.DisplayTimer.abcountdown < 1)
							Extension.DisplayTimer.abstatus = "filled";
						else
							Extension.DisplayTimer.abstatus = "working";
						if (typeof context.callback == "function")
							context.callback(context, status);
					}
				}, {
					vars: vars,
					context: vars.context,
					type: vars.type,
					callback: vars.callback,
					productListId: vars.n,
					targetElem: vars.targetElem,
					i: 0,
					productChunks: productChunks
				});
			}
		},
		init: function(productlists, callback, context) {
			var c = Extension.Common;
			if (typeof (productlists) == "undefined")
				var productlists = [];

			//Check the page for all lists that need to be filled
			var productListsElem = document.querySelectorAll('.productList');
			var productListsElemFilled = document.querySelectorAll('.productList-filled');
			
			//Fill each list
			var countpreload = 0
			  , countfillrest = 0
			  , total = productListsElem.length
			  , f = productListsElemFilled.length;

			for (var n = 0; n < productListsElem.length; n++) {
				this.productlists[n + f] = {
					empty: true
				};
				c.removeClass(productListsElem[n], "productList");
				c.addClass(productListsElem[n], "productList-filled")

				var vars = {
					n: n + f,
					type: c.getCustomAttribute(productListsElem[n], "data-type") || '',
					//type: "carusel",
					header: c.getCustomAttribute(productListsElem[n], "data-header") || '',
					productlistid: c.getCustomAttribute(productListsElem[n], "data-productlistid") || '',
					cxwid: c.getCustomAttribute(productListsElem[n], "data-cxwid") || '',
					products: c.getCustomAttribute(productListsElem[n], "data-products") || '',
					targetElem: productListsElem[n],
					callback: callback,
					context: context
				};

				if (c.varExist(vars.products, true)) {
					c.uridecode(vars.products).replace(/[^0-9|s|S|,]/g, "");
					vars.products = vars.products.split(',');
					this.createList(vars);
				} else if (c.varExist(vars.productlistid, true)) {
					vars.products = [];
					for (var i = 0; i < productlists.length; i++) {
						if (productlists[i]['id'] == vars.productlistid) {
							var productlist = productlists[i];
							if (productlist) {
								for (var j = 0; j < productlist.products.length; j++) {
									if (productlist.products[j]['artnr'].length >= 8) {
										var tempartnr = c.uridecode(productlist.products[j]['artnr']).replace(/[^0-9|s|S|,]/g, "");
										tempartnr = tempartnr.split(',');
										vars.products = vars.products.concat(tempartnr);
									}
								}
							}
							vars.header = productlists[i]['header'];
							break;
						}
					}
					this.createList(vars);

				} else if (c.varExist(vars.cxwid, true)) {
					vars.products = [];
					Extension.DataSource.Cxense.load(vars.cxwid, function(data, context) {
						Extension.ProductList.productlists[context.context.n].empty = false;
						Extension.ProductList.productlists[context.context.n].cxense = data;
						context.context.cxense = data;
						context.context.products = data.products;
						Extension.ProductList.createList(context.context);
					}, vars);
				}

			}
		},
		bootup: function(){
			//Initiate ProductList
			//Extension.ProductList.init();
		}
	}

	/*

	  _                        _                
	 |_) ._ _   _|      _ _|_ |_ o | _|_  _  ._ 
	 |   | (_) (_| |_| (_  |_ |  | |  |_ (/_ |  


	*/
	var ProductFilter = {
		productFilters: [],
		productInfo: [],
		store: [],
		sortbtn: [],
		isnumber: function(n) {
			return !isNaN(n) && n.toString().match(/^-?\d*(\.\d+)?$/);
		},
		move: function(elemlist, old_index, new_index) {
			if (new_index >= elemlist.length) {
				var k = new_index - elemlist.length;
				while ((k--) + 1) {
					elemlist.push(undefined);
				}
			}
			elemlist.splice(new_index, 0, elemlist.splice(old_index, 1)[0]);
			return elemlist;
		},
		compare: function(val1, val2, operator) {
			switch (operator) {
			case "+":
				return val1 + val2;
			case "-":
				return val1 - val2;
			case "*":
				return val1 * val2;
			case "/":
				return val1 / val2;
			case "<":
				return val1 < val2;
			case ">":
				return val1 > val2;
			}
		},
		sort: function(listid, sortbtnid) {
			try {
				var loader = document.getElementById("productFilter-loader-" + listid);
				if (loader){
					Extension.Common.addClass(loader, "ext-show");
				}

				setTimeout(function() {
					var elemlist = Extension.ProductFilter.store[listid];
					var sortbypropname = Extension.ProductFilter.sortbtn[sortbtnid].prop;
					if (typeof elemlist === 'object' && elemlist.length > 1) {
						var i, switching, shouldSwitch;
						switching = true;

						var operator = ">";
						var arrowElem = document.getElementById('sortArrow_' + listid + '_' + sortbtnid);
						if (arrowElem) {
							if (arrowElem.sortDirection) {
								if (arrowElem.sortDirection == 'desc') {
									arrowElem.sortDirection = 'asc';
									arrowElem.setAttribute('class', 'icon icon__arrow-up');
								} else {
									arrowElem.sortDirection = 'desc';
									arrowElem.setAttribute('class', 'icon icon__arrow-down');
								}
							} else
								arrowElem.sortDirection = 'desc';

							if (arrowElem.sortDirection == 'asc')
								operator = "<";
						}

						var elemlistparent = elemlist[0].parentNode;
						var elemlistclass = elemlist[0].className;
						if (elemlistclass)
							elemlistclass = '.' + elemlistclass.replace(' ', '.');
						var selector = elemlist[0].tagName + elemlistclass;

						var count = 0;
						while (switching) {

							switching = false;
							elemlist = elemlistparent.querySelectorAll(selector);
							for (i = 0; i < (elemlist.length - 1); i++) {
								shouldSwitch = false;
								if (Extension.ProductFilter.isnumber(elemlist[i].productInfo[sortbypropname])) {
									if (Extension.ProductFilter.compare(elemlist[i].productInfo[sortbypropname], elemlist[i + 1].productInfo[sortbypropname], operator)) {
										shouldSwitch = true;
										break;
									}
								} else {
									if (Extension.ProductFilter.compare(elemlist[i].productInfo[sortbypropname].toLowerCase(), elemlist[i + 1].productInfo[sortbypropname].toLowerCase(), operator)) {
										shouldSwitch = true;
										break;
									}
								}
							}
							if (shouldSwitch) {
								elemlist[i].parentNode.insertBefore(elemlist[i + 1], elemlist[i]);
								switching = true;
							}

							if (count > 500000)
								switching = false;
							else
								count++;
						}
					}
				}, 1);
				setTimeout(function() {
					if (loader){
						Extension.Common.removeClass(loader, "ext-show");
					}
				}, 1);
			} catch (e) {
				console.log("ProductFilter: sorting failed: " + e)
			}
		},
		filter: function(elem, e) {

			var searchStr = elem.value.toLowerCase()
			  , searchValues = searchStr.split(" ")
			  , productListId = elem.id.split("_")[1]
			  , productList = this.store[productListId];
			var length = searchValues.length;
			for (var i = 0; i < length; i++) {
				if (searchValues[i].toLowerCase().indexOf("o") > -1)
					searchValues[i] += "+" + searchValues[i].toLowerCase().replace("o", "ö");
				if (searchValues[i].toLowerCase().indexOf("a") > -1)
					searchValues[i] += "+" + searchValues[i].toLowerCase().replace("a", "ä");
			}

			for (var i = 0; i < productList.length; i++) {
				var count = 0;
				for (var j = 0; j < searchValues.length; j++) {
					var either = searchValues[j].split("+");
					var found = false;
					for (var k = 0; k < either.length; k++)
						if (productList[i].productInfo.tostring.indexOf(either[k]) > -1)
							found = true;
					if (found)
						count++;
				}

				if (count == searchValues.length)
					productList[i].style.display = "";
				else
					productList[i].style.display = "none";

			}
		},
		report: function(artnr) {
			var response = new Extension.Common.xhr();
			response.open('GET', "https://www.prougno.com/ikea/report/report_product.php?artnr=" + artnr, true);
			response.onreadystatechange = function() {}
			;
			response.send();
		},
		load: function(targetElem) {},
		showfilter: function(elem, targetelem) {
			if (elem && targetelem) {
				Extension.Common.removeClass(targetelem, "ext-show");
				setTimeout(function() {
					targetelem.innerHTML = "";
					targetelem.appendChild(elem);
					setTimeout(function() {
						Extension.Common.addClass(targetelem, "ext-show");
					}, 1);
				}, 300);
			}
		},
		init: function(input) {
			var c = Extension.Common;
			var el = Extension.Element;

			if (c.varExist(input.status))
				var status = input.status;
			else
				var status = "complete";

			if (c.varExist(input.productInfo))
				this.productInfo = input.productInfo;

			if (c.varExist(input.productFilters))
				this.productFilters = input.productFilters;

			//Check the page for all lists that need to be filled
			var productFilterElem = document.querySelectorAll('.productFilter');

			//Fill each list

			for (var n = 0; n < productFilterElem.length; n++) {

				productFilterElem[n].id = "productFilter_" + n;
				productFilterElem[n].className = "productFilter-started";

				var productfilterid = c.getCustomAttribute(productFilterElem[n], "data-productfilterid") || '';

				//Find the filters from productfilter data source
				if (c.varExist(productfilterid, true)) {
					for (var i = 0; i < this.productFilters.length; i++) {
						if (this.productFilters[i]['id'] == productfilterid) {
							var productFilter = this.productFilters[i];
							break;
						}
					}
				}

				if (c.varExist(productFilter)) {
					//Find the first productlist element after filter element in the DOM
					var count = 0
					  , searching = true;
					if (c.varExist(productFilterElem[n].nextSibling))
						var nextElem = el.nextSibling(productFilterElem[n]);
					else if (c.varExist(productFilterElem[n].parentNode))
						var nextElem = productFilterElem[n].parentNode;
					if (c.varExist(nextElem)) {
						while (searching) {
							var productListMasterContainer = nextElem.querySelector(".product-list");
							if (productListMasterContainer)
								searching = false;
							else if (c.varExist(el.nextSibling(nextElem)))
								nextElem = el.nextSibling(nextElem);
							else if (!c.varExist(nextElem.parentNode.querySelector("#productFilter_" + n)))
								nextElem = nextElem.parentNode;
							else
								searching = false;

							if (count > 10000)
								searching = false;
							else
								count++;
						}
					}

					if (c.varExist(productListMasterContainer))
						productListMasterContainer.id = "productListMaster_" + n;

					var productFilterContainer = document.createElement("div");
					productFilterContainer.setAttribute("class", "product-list component");
					productFilterContainer.setAttribute("style", "margin-bottom: 0")

					if (c.varExist(productFilter.filters)) {
						//Go through and add filters
						var filterContainer = document.createElement('div');
						filterContainer.setAttribute("id", "filterContainer");
						filterContainer.setAttribute("class", "filter-container");
						if (c.varExist(productFilter.filterheader, true))
							filterContainer.innerHTML = '<span class="filter-heading">' + productFilter.filterheader + '</span>';
						for (var j = 0; j < productFilter.filters.length; j++) {

							//Add free text search field
							if (productFilter.filters[j].type.toLowerCase() == 'search') {
								var search = document.createElement("form");
								search.setAttribute("class", "filter-search-field");
								search.setAttribute("action", "#");
								search.setAttribute("onsubmit", "return false");
								search.setAttribute("method", "get");
								var caption = "";
								if (c.varExist(productFilter.filters[j].caption))
									caption = productFilter.filters[j].caption;
								search.innerHTML = '<input id="filter-search_' + n + '" class="filter-search-field__input" placeholder="' + caption + '" autocomplete="off" type="text"><span class="filter-search-field__button" aria-label="Søk"><img src="' + ExtensionSetting.Country.homePath + 'search/static/nav-search.svg"></span>';
								var input = search.querySelector("#filter-search_" + n);
								input.onkeyup = function(e) {
									if (e.which == 13)
										this.blur();
									else
										Extension.ProductFilter.filter(this);
								}
								Extension.Version.load("extpf-sc", false, function(e) {
									if (Extension.Common.isMobile.any()) {
										input.onfocus = function() {
											if (Extension.Common.varExist(Extension.Anchor)) {
												Extension.Anchor.scroll(this, 300, true);
											}
										}
									}
								});
								filterContainer.appendChild(search);
							}

						}

						productFilterContainer.appendChild(filterContainer);
					}

					if (c.varExist(productFilter.sortbtn)) {
						this.sortbtn = productFilter.sortbtn;

						var sortContainer = document.createElement('div');
						sortContainer.setAttribute("id", "sortContainer");
						sortContainer.setAttribute("class", "filter-container");
						if (c.varExist(productFilter.sortheader, true))
							sortContainer.innerHTML = '<span class="filter-heading">' + productFilter.sortheader + '</span>';
						for (var j = 0; j < productFilter.sortbtn.length; j++) {
							var button = document.createElement('button');
							button.setAttribute('class', 'button button--blue-outline filter-button');
							button.setAttribute('onclick', 'Extension.ProductFilter.sort(' + n + ', ' + j + ')');
							button.innerHTML = '<span class="cta-link__link-text">' + productFilter.sortbtn[j].caption + '</span><span id="sortArrow_' + n + '_' + j + '" class="icon icon__arrow-down"></span>';
							sortContainer.appendChild(button);
						}

						productFilterContainer.appendChild(sortContainer);
					}

					var filterloader = document.createElement("div");
					filterloader.setAttribute("id", "productFilter-loader-" + n);
					filterloader.setAttribute("class", "productFilter-loader");
					filterloader.innerHTML = Extension.Template.options.loader;
					productFilterContainer.appendChild(filterloader);

					productFilterElem[n].className = "productFilter-filled ext-show";

					if (c.varExist(productListMasterContainer)) {
						//Get the first div with .product-list__products class, Container for the products
						var productListContainer = productListMasterContainer.querySelector(".product-list__products");

						//Get all the product span with class .product-compact
						var productList = productListContainer.querySelectorAll(".product-compact");
						var errorList = "";
						for (var i = 0; i < productList.length; i++) {

							//Retrieve the artnr from the product link
							var a = productList[i].querySelector("a");
							if (a) {
								try {
									var pn = a.href.match(/[s|S|\/|-]\d{8}/g);
									pn = pn[0].replace('/', '').replace('-', '');
								} catch (err) {
									console.log("Extension.Productfilter: regex artnr fail: " + a.href + " Err: " + err)
								}

							}
							if (pn) {
								//Create productInfo varible on DOM product nodes, and fill them from page info and productinfo datasource
								productList[i]['productInfo'] = {};

								productList[i].productInfo['artnr'] = pn;

								productList[i].productInfo['id'] = i;

								var name = productList[i].querySelector(".product-compact__name");
								if (name)
									productList[i].productInfo['name'] = name.innerHTML;

								var desc = productList[i].querySelector(".product-compact__type");
								if (desc)
									productList[i].productInfo['desc'] = desc.innerHTML;

								var price = productList[i].querySelector('.product-compact__price');
								if (price)
									productList[i].productInfo['price'] = parseInt(price.innerHTML.replace(/\D/g, ''));

								var found = false;
								for (var j = 0; j < this.productInfo.length; j++) {
									if (this.productInfo[j]['artnr'].toLowerCase() == productList[i].productInfo['artnr'].toLowerCase()) {
										found = true;
										var prop = Object.getOwnPropertyNames(this.productInfo[j]);
										for (var k = 0; k < prop.length; k++)
											if (this.productInfo[j][prop[k]] !== "")
												productList[i].productInfo[prop[k]] == this.productInfo[j][prop[k]];
									}
								}
								productList[i].productInfo['tostring'] = "";
								var prop = Object.getOwnPropertyNames(productList[i].productInfo);
								for (var k = 0; k < prop.length; k++)
									if (prop[k] !== "id")
										if (this.isnumber(productList[i].productInfo[prop[k]]))
											productList[i].productInfo['tostring'] += productList[i].productInfo[prop[k]] + " ";
										else
											productList[i].productInfo['tostring'] += productList[i].productInfo[prop[k]].toLowerCase() + " ";

								//If there are products on the page that are not present in the datasource, add them to the report
								if (!found)
									errorList += productList[i].productInfo['artnr'] + '|';

							} else {}
						}
						//Send the report if it exists
						if (c.varExist(errorList, true)) {//this.report(errorList);
						}

						this.store[0] = productList;
					}

					this.showfilter(productFilterContainer, productFilterElem[n]);

				}
			}

		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-product");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 
	
	var transfer = {
		objects: [
			{name: "Product", fn: Product},
			{name: "ProductList", fn: ProductList},
			{name: "ProductFilter", fn: ProductFilter}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup Product " + str);
			});
			//Initiate ProductFilter
			//Extension.ProductFilter.init();
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();