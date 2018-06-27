/*


 |\/|  _ _|_  _.
 |  | (/_ |_ (_|


*/

(function(){

	var Meta = {
		getprod: function(data) {
			var product = {};
			if (document.URL.indexOf('/p/') > -1 || document.URL.indexOf('/catalog/products/') > -1) {
				var c = Extension.Common;
				product.urlprod = c.getProdNumUrl();
				if (c.varExist(product.urlprod, true)) {
					product.urlprod = product.urlprod.toLowerCase();
					for (var i = 0; i < data.length; i++) {
						if (c.varExist(data[i].artnr)) {
							var tempartnr = data[i].artnr.replace(/[^0-9|s|S|,]/g, "");
							tempartnr = tempartnr.split(',');
							for (var j = 0; j < tempartnr.length; j++) {
								if (product.urlprod == tempartnr[j].toLowerCase()) {
									product.found = true;
									var prop = Object.getOwnPropertyNames(data[i]);
									for (var k = 0; k < prop.length; k++)
										product[prop[k]] = data[i][prop[k]];

								}
							}

						}
					}
				}
			}
			return product;
		},
		blacklist: function(blacklist, product) {
			var c = Extension.Common;
			if (!product) {
				var product = {};
				product = this.getprod(blacklist);
			} else {
				var product2 = {};
				product2 = this.getprod(blacklist);
				product = Extension.Merge.merge(product, product2);
			}
			if (c.varExist(product)) {
				if (product.found) {
					product.meta_date = "";
					if (c.varExist(product.uppdt)) {
						product.meta_date = '<meta property="article:modified_time" content="' + product.uppdt + '"/>';
					}
					product.meta_blacklist = "";
					if (c.varExist(product.cxwids)) {
						product.meta_blacklist = '<meta property="cXenseParse:recs:ike-widgetBl" content="' + product.cxwids.replace(/\,/g, " ") + '"/>';
					} else {
						product.meta_blacklist = '<meta name="cXenseParse:recs:recommendable" content="false"/>';
					}
				}
				return product;
			} else
				return {};

		},
		forcecrawl: function(forcecrawl, product) {
			var c = Extension.Common;
			if (!product) {
				var product = {};
				product = this.getprod(forcecrawl);
			} else {
				product.found = false;
				var product2 = {};
				product2 = this.getprod(forcecrawl);
				product = Extension.Merge.merge(product, product2);
			}
			if (c.varExist(product)) {
				if (product.found) {
					product.meta_date = "";
					if (c.varExist(product.uppdt)) {
						product.meta_date = '<meta property="article:modified_time" content="' + product.uppdt + '"/>';
					}
				}
				return product;
			} else
				return {};
		},
		init: function(data) {
			var c = Extension.Common;
			var product = this.forcecrawl(data.forcecrawl, this.blacklist(data.blacklist)) || {};

			if (c.varExist(product.meta_date, true))
				document.head.insertAdjacentHTML('afterbegin', product.meta_date);
			if (c.varExist(product.meta_blacklist, true))
				document.head.insertAdjacentHTML('afterbegin', product.meta_blacklist);

		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-meta");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "Meta", fn: Meta}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup Meta " + str);
			});
			//Initiate Meta on PIP pages
			if (Extension.Common.checkurl(['*m2*/no/no/p|/no/n2/p*', '*www.|preview.*/catalog/products*'])) {
				Extension.Source.load('Meta', Extension.Version.forcePreview || Extension.Version.preview, function(data) {
					Extension.Meta.init(data);
				});
			}
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();