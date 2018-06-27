/*

				  _
  /\     _|_  _  /   _  ._ _  ._  |  _ _|_  _
 /--\ |_| |_ (_) \_ (_) | | | |_) | (/_ |_ (/_
							  |

*/
(function(){

	var AutoBuyButtons = {
		init: function(){
	        var productsWithBuyButtons, productsInImages;

	        if (document.URL.indexOf('www.ikea.com') > -1) {
	            
                /************************************************************
                        Remove all existing Buybuttons from 
                        products in images
                *************************************************************/

                productsWithBuyButtons = this.getElementByPartialSrc("Buy-BTN-small.png", "img");

                productsWithBuyButtons.forEach(function(p){
                    if (document.URL.indexOf('.html') > -1) {
                        var artNr = p.parentNode.href.match(/(\d+|s\d+)[^\d]*$/gi).toString().replace("/","");
                        if (artNr.length >= 8){
                            var article = this.ajaxGetArtInfo(artNr, function(xmlDoc) {
                                var buyable = xmlDoc.getElementsByTagName("buyable")[0].childNodes[0];
                                if (buyable.data == "false" || !this.checkArticleBuybutton(artNr)) {                                
                                    p.parentNode.removeChild(p);                                
                                }
                            }); 
                        }                               
                    } else {
                        p.parentNode.removeChild(p);
                    }
                });


                /************************************************************
                        Add new Buybuttons
                *************************************************************/
                if (!(document.URL.indexOf('/ideas/') > -1)) {
                    productsInImages = this.getElementByPartialId("toolTipBigPrice_", "div");


                    productsInImages.forEach(function(p){
                    	if(p.className.indexOf("toolTipClass") == -1){
	                        var artNr = p.id.split("_");
	                        if (artNr.length > 1){
	                            var article = this.ajaxGetArtInfo(artNr[1], function(xmlDoc) {
	                                var buyable = xmlDoc.getElementsByTagName("buyable")[0].childNodes[0];
	                                if (buyable.data == "true") {
	                                    if (this.checkArticleBuybutton(artNr[1])) {
	                                        if (this.checkStopBuyButton(p)){
	                                           this.addBuyButton(p);
	                                        }
	                                    }
	                                }
	                            }); 
	                        }
	                    }
                    });             
                }

                /************************************************************
                        Fix for all error href linking to 
                *************************************************************/
                var allLinks = document.getElementsByTagName("a");
                for (var i = 0; i < allLinks.length; i++){
                    if (allLinks[i].href.indexOf("preview.") > -1) {
                        allLinks[i].href = allLinks[i].href.replace("preview.","www.");
                    }
                    if (allLinks[i].href.indexOf("/se/en/") > -1) {
                        allLinks[i].href = allLinks[i].href.replace("/se/en/","/no/no/");
                    }
                }        
	            
	        } else {
	            if (activate_AAB === true) {
	                /************************************************************
	                        Temp fix for all error href linking to 
	                *************************************************************/
	                var allLinks = document.getElementsByTagName("a");
	                for (var i = 0; i < allLinks.length; i++){
	                    if (allLinks[i].href.indexOf("preview.") > -1) {
	                        allLinks[i].href = allLinks[i].href.replace("preview.","m.");
	                    }
	                }
	            }
	        }
	    },

        getElementByPartialSrc: function (partialSrc, tag) {
            var a = [];
            var ele = document.getElementsByTagName(tag);
            var p = partialSrc.split(" ");
            for (var i = 0; i < ele.length; i++) {
                for (var j = 0; j < p.length; j++) {
                    if (ele[i].src.indexOf(p[j]) > -1) {
                        a.push(ele[i]);
                    }
                }
            }
            return a;
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
        }, 

        addBuyButton: function (targetEle) {
            var artNr = targetEle.id.split("_");
            if (artNr.length > 1){
                var paddingTop = 0;
                var btiTag = targetEle.querySelector("div.productBtiFront");
                if (btiTag){
                    paddingTop = 10;
                }
                var newLocation = this.checkHeightPlacement(targetEle, paddingTop);
                if (newLocation > 0){
                    var myContainer = targetEle.parentNode.parentNode;
                    if (myContainer) {
                        myContainer.style.setProperty("top",  newLocation + "px");
                    }
                }
                var targetEle2 = targetEle.parentNode.parentNode.querySelector("#toolTipBigPriceWee_" + artNr[1]);
                var newBuyButtonContainer = document.createElement("div");
                newBuyButtonContainer.setAttribute("style", "text-align:left");
                newBuyButtonContainer.innerHTML = '<a href="/no/no/catalog/products/' + artNr[1] + '/"><img src="/ms/no_NO/img/homepage/inspirational/Buy-BTN-small.png" alt="Kjøp på nett" style="padding-top:' + paddingTop + 'px;width:94px;height:32px;z-index:50" class=""></a>';
                if (targetEle2) {
                    this.insertAfter(targetEle2, newBuyButtonContainer);
                } else if (targetEle) {
                    this.insertAfter(targetEle, newBuyButtonContainer);
                }
            }
        },

        ajaxGetArtInfo: function (artNum, callback) {
            new Ajax.Request("/no/no/catalog/products/" + artNum + "?type=xml&dataset=normal,prices,allimages,parentCategories,attributes", {
                method: 'get',
                type: 'application/xml',
                onSuccess: function(response) {
                    callback(response.responseXML);
                }
            });
        },

        insertAfter: function (targetNode, newNode) {
            try {
                targetNode.parentNode.insertBefore(newNode, targetNode.nextSibling);
            } catch (err) {}
        },

        checkHeightPlacement: function(targetEle, extrabuffer){
            var buffer = 15 + extrabuffer,
                button = 32,
                newLocation = 0;

            try {
                var myImage;
                var myContainer = targetEle.parentNode.parentNode;
                if (myContainer) {
                    var EleX = Math.floor(myContainer.style.left.replace(/\D/g,''));
                    var EleY = Math.floor(myContainer.style.top.replace(/\D/g,''));
                    var myImages = targetEle.parentNode.parentNode.parentNode.parentNode.getElementsByTagName("img");
                    if (myImages) {
                        for (var i = 0; i < myImages.length; i++) {
                            var ImgX = Math.floor(myImages[i].style.left.replace(/\D/g,''));
                            var ImgY = Math.floor(myImages[i].style.top.replace(/\D/g,''));
                            var ImgW = myImages[i].clientWidth;
                            var ImgH = myImages[i].clientHeight;

                            if ((EleX >= ImgX && EleX <= (ImgX + ImgW)) && (EleY >= ImgY && EleY <= (ImgY + ImgH))) {
                                myImage = myImages[i];
                            }                                                 
                        }

                        if (myImage) {
                            var myImageLocationTop = Math.floor(myImage.style.top.replace(/\D/g,''));
                            var myImageLocationHeight = myImage.clientHeight;

                            var myContainer = targetEle.parentNode.parentNode;
                            if (myContainer) {
                                var myContainerLocationTop = Math.floor(myContainer.style.top.replace(/\D/g,''));
                                var myContainerLocationHeight = myContainer.clientHeight;

                                var myImageActualHeight = myImageLocationTop + myImageLocationHeight;
                                var myContainerActualHeight = myContainerLocationTop + myContainerLocationHeight + button + buffer;
                                if (myContainerActualHeight >= myImageActualHeight) {
                                    newLocation = myContainerLocationTop - (myContainerActualHeight - myImageActualHeight);
                                }   
                            }
                        }
                    }
                }
                return newLocation;
            } catch (err) {return newLocation}
        },

        checkArticleBuybutton: function(artNr) {
            var result = true;
            try {
                for (var i = 0; i < removeButtonsData.length; i++) {
                    if (artNr == removeButtonsData[i].productNumber) {
                        if (removeButtonsData[i].actions.removeAddToCartButton.toLowerCase() == 'true') {
                            if (dateValidation(removeButtonsData[i].dateSettings.fromDate, removeButtonsData[i].dateSettings.toDate, serverTime)) {
                                result = false;
                            }
                        }
                    }
                }
                return result;
            } catch (err) {return result}   
        },

        checkStopBuyButton: function(targetEle) {
            var result = true;
            try {
                var myComponent = targetEle.parentNode.parentNode.parentNode.parentNode.querySelector("span.stop-buy-button");
                if (myComponent) {
                    result = false;                
                } else {
                    result = true
                }
                return result;
            } catch (err) {return result}   
        }
    }
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-autocomplete");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 
	
	var transfer = {
		objects: [
			{name: "AutoBuyButtons", fn: AutoBuyButtons}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup AutoBuyButtons " + str);
			});
			//Initiate AutoComplete
			if (!Extension.Common.checkMobile()) {
				Extension.AutoBuyButtons.init(data.autocompletedata);
			}
		}
	}

	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();