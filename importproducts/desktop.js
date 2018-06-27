/*

 ___                       _                          
  |  ._ _  ._   _  ._ _|_ |_) ._ _   _|      _ _|_  _ 
 _|_ | | | |_) (_) |   |_ |   | (_) (_| |_| (_  |_ _> 
           |                                          

*/


(function(){

	var ImportProducts = {
		init: function(input, callback, context){
			var c = Extension.Common;
			var params = c.getUrlVars();
			if (c.varExist(params.prodlist))
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
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-importproducts");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 
	
	var transfer = {
		objects: [
			{name: "ImportProducts", fn: ImportProducts}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup ImportProducts " + str);
			});
			//Initiate ImportProducts
			//Extension.ImportProducts.init();
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();