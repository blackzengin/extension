/*

  __                  ___
 (_  o ._ _  ._  |  _  |  _. |_   _
 __) | | | | |_) | (/_ | (_| |_) _>
			 |

*/

(function(){

	var SimpleTabs = {
		store: [],
		init: function(callback) {
			var c = Extension.Common;
			var elems = document.querySelectorAll(".simple-tabs-container");
			for (var n = 0; n < elems.length; n++) {
				if (!elems[n].loaded) {
					elems[n].loaded = true;
					elems[n].id = "simple-tabs-container_" + n;

					var tabs = elems[n].querySelectorAll("ul.simple-tabs");
					for (var i = 0; i < tabs.length; i++) {
						this.store[i] = new this.obj(tabs[i]);
					}
					var minheight = 333;
					if (c.checkMobile()) {
						minheight = 422;
					}
					var tabpage = elems[n].querySelectorAll("div.tab-page");
					for (var i = 0; i < tabpage.length; i++) {
						tabpage[i].style.setProperty("min-height", minheight + "px");
					}
				}
			}
		},

		obj: function(elem) {
			//get tab objects and store as pane + tab
			var activeTabObject;

			var TabObject = function() {
				var self = this;
				this.tab;
				//element
				this.pane;
				//element
				this.setClick = function() {
					self.tab.addEventListener('click', self.showThisTab)
				}

				this.showThisTab = function() {
					if (self !== activeTabObject && self.parentNode == activeTabObject.parentNode) {
						var c = Extension.Common;
						//change the tab page and update the active tab
						c.removeClass(activeTabObject.pane, 'active-page');
						c.removeClass(activeTabObject.tab, 'active');
						c.addClass(self.pane, 'active-page');
						c.addClass(self.tab, 'active');
						activeTabObject = self;
						Extension.ProductList.updateAllCarusels();
						if (Extension.DisplayTimer){
							if (Extension.Common.checkMobile()){
								if (Extension.DisplayTimer.productinjectagain){
									Extension.Targeting.reload = true;
									Extension.DisplayTimer.productinjectagain();
								}
							} else {
								if (Extension.DisplayTimer.productinjectagainirw){
									Extension.Targeting.reload = true;
									Extension.DisplayTimer.productinjectagainirw();
								}
							}
						}
						//if (activeTabObject.pane.getAttribute('data-type') == 'carusel') Extension.ProductList.setProductHeightCarusel(activeTabObject.pane);
						//if (activeTabObject.pane.getAttribute('data-type') == 'list') Extension.ProductList.setProductHeightList(activeTabObject.pane);
					}
				}

			};

			var ul = elem;
			var i;
			var items = ul.getElementsByTagName("li");
			for (i = 0; i < items.length; ++i) {
				var tab = new TabObject();
				tab.tab = items[i];
				var classString = items[i].className;
				var className = classString.split(' ')[0];
				tab.pane = ul.parentNode.querySelector("#" + className);
				tab.setClick();
				if (classString.indexOf('active') > -1) {
					activeTabObject = tab;
				}
			}
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-simpletabs");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "SimpleTabs", fn: SimpleTabs}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup SimpleTabs " + str);
			});
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();