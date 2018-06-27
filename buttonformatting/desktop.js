/*

  _                      _                                   
 |_)    _|_ _|_  _  ._  |_ _  ._ ._ _   _. _|_ _|_ o ._   _  
 |_) |_| |_  |_ (_) | | | (_) |  | | | (_|  |_  |_ | | | (_| 
                                                          _| 

*/
(function(){
	
	var ButtonFormatting = {
		init: function(data){
			Extension.Page.loaded(function() {
				if (Extension.Common.checkurl("*www.|preview.*/search/")){
					var cartBtnInSearchResult = Extension.ButtonFormatting.getElementByPartialId("popupAddToCart", "a");
			
					cartBtnInSearchResult.forEach(function(p){
						p.innerHTML = "";
						var newProduct = document.createElement("p");
						newProduct.className = "blueBtn btnBlueCustom";
						newProduct.innerHTML = "Kjøp på nett";
						p.appendChild(newProduct);
					});
			
					var listBtnInSearchResult = Extension.ButtonFormatting.getElementByPartialId("popupShoppingList", "a");
			
					listBtnInSearchResult.forEach(function(p){
						p.innerHTML = "";
						var newProduct = document.createElement("p");
						newProduct.className = "orangeBtn btnOrangeCustom";
						newProduct.innerHTML = "Huskeliste";
						p.appendChild(newProduct);
					});
				}
			});
		},
		getElementByPartialId: function (partialId, tag) {
			var a = [];
			var ele = document.getElementsByTagName(tag);
			var p = partialId.split(" ");
			for (var i = 0; i < ele.length; i++) {
				for (var j = 0; j < p.length; j++) {
					if(ele[i].id.indexOf(p[j]) > -1) {
						a.push(ele[i]);
					}
				}
			}
			return a;
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-buyability");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "ButtonFormatting", fn: ButtonFormatting}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup ButtonFormatting " + str);
			});
			//Initiate ButtonFormatting
			Extension.ButtonFormatting.init();
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();