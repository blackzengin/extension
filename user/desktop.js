/*

               
 | |  _  _  ._ 
 |_| _> (/_ |  
               

*/

(function(){

	var User = {
		logOutReq: function(callback, context) {
			var response = new Extension.Common.xhr();
			var cartUrl = "/webapp/wcs/stores/servlet/Logoff?langId=" + ExtensionSetting.Country.langId + "&storeId=" + ExtensionSetting.Country.storeId + "&rememberMe=true"; //https://secure.ikea.com
			var DONE = 4;
			var OK = 200;
			response.context = context;
			response.open('GET', cartUrl, true);
			response.onreadystatechange = function() {
				if (response.readyState === DONE) {
					if (response.status === OK) {
						setTimeout(function(){
							if (typeof callback == "function") callback(response.context);
						}, 500);
					}
				}
			}
			response.send(null);
		},
		logOut: function(input, callback, context){
			var c = Extension.Common;
			if (c.varExist(context)){
				if (!c.isObject(context)){
					var t = context;
					context = {};
					context.content = t;
				}
			} else context = {};
			context.redirecturl = input.redirecturl;
			var data = {
				html: "<div>" + Extension.Translation.data.checkout.logoutpopuptext + "</div>" +  Extension.Template.options.loader,
				timeoutclose: 10000
			}
			if (c.varExist(input.includeclass)) data.includeclass = input.includeclass;
			if (c.varExist(input.includecontentclass)) data.includecontentclass = input.includecontentclass;

			Extension.Element.addModal(data);

			Extension.Product.getProductsFromCart(function(products, context){
				context.products = products;
				Extension.User.logOutReq(function(context){
					Extension.Product.addProducts(context.products, function(context){
						 if (Extension.User.redirecturls[context.redirecturl])
							context.redirecturl = Extension.User.redirecturls[context.redirecturl]
						 if (typeof callback == "function") callback(context)
						 else {
							window.location.replace(context.redirecturl);
							if (window.ext_modal){
								Extension.Common.removeClass(window.ext_modal, "ext-show");
								setTimeout(function(){
									Extension.Element.remove(window.ext_modal);
								},1000)
							}
						 }
					}, context);
				}, context);
			}, context);
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-user");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "User", fn: User}
		],
		dependencies: ["Product"],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup User " + str);
			});
			//Initiate User
			User.redirecturls = {
				m2cart: "https://secure.ikea.com/webapp/wcs/stores/servlet/M2OrderItemDisplay?storeId=" + ExtensionSetting.Country.storeId + "&langId=" + ExtensionSetting.Country.langId + "&catalogId=11001&orderId=.&priceexclvat=&newLinks=true",
				m2home: "https://m2.ikea.com" + ExtensionSetting.Country.homePath,
				irwcart: "//www.ikea.com/webapp/wcs/stores/servlet/OrderItemDisplay?storeId=" + ExtensionSetting.Country.storeId + "&langId=" + ExtensionSetting.Country.langId + "&catalogId=11001&orderId=.&priceexclvat=&newLinks=true",
				irwhome: "//www.ikea.com" + ExtensionSetting.Country.homePath,
			}
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();

