/*

  __
 (_  ._  | o _|_ _|_  _  ._
 __) |_) | |  |_  |_ (/_ |
	 |

*/

(function(){

	var Splitter = {
		init: function() {
			var c = Extension.Common;
			var vars = c.getUrlVars();
			if (c.varExist(vars.m) || c.varExist(vars.d)) {
				if (c.isMobile.any()) {
					if (c.varExist(vars.m))
						this.redirekt(vars.m, vars.delay, "https");
				} else {
					if (c.varExist(vars.d))
						this.redirekt(vars.d, vars.delay, "https");
				}
			}
		},
		redirekt: function(url, delay, prot) {
			var c = Extension.Common;
			url = c.uridecode(url);
			url = url.replace(/\-q\-/g, "?").replace(/\-h\-/g, "#").replace(/\-e\-/g, "=").replace(/\-a\-/g, "&").replace(/\-p\-/g, "%").replace(/\-s\-/g, ";");
			if (url.indexOf(prot) == -1)
				url = prot + "://" + url;

			delay = delay || 1;
			if (delay > 1) {
				setTimeout(function() {
					window.location = url;
				}, delay);
			} else
				window.location = url;

		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-splitter");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 
	
	var transfer = {
		objects: [
			{name: "Splitter", fn: Splitter}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup Splitter " + str);
			});
			//Initiate Splitter
			//Extension.Splitter.init();
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();


