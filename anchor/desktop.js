/*


  /\  ._   _ |_   _  ._
 /--\ | | (_ | | (_) |


*/

(function(){

	var Anchor = {
		interupted: false,
		go: function(selector, scrollDiff) {
			var c = Extension.Common
			  , el = Extension.Element
			  , p = Extension.Page;
			try {
				this.onclick();
				if (selector) {
					el.get(selector, function(selector, elem) {
						if (elem.length) {
							if (c.isArray(elem) || c.isNodeList(elem))
								elem = elem[0];
							if (c.varExist(scrollDiff))
								elem.scrollDiff = c.toInt(scrollDiff)
							else
								elem.scrollDiff = c.toInt(0)
							Extension.Anchor.scroll(elem, 0, true);
						}
					});
				} else {
					/*
					c.onetime(document, "click", function() {
						Extension.Anchor.interupted = true;
					});
					*/
					p.loaded(function() {
						var c = Extension.Common
						  , hash = c.getUrlHash()
						  , vars = c.getUrlVars();
						if (c.varExist(hash, true) || c.varExist(vars.anc, true)) {
							if (!c.varExist(hash, true))
								hash = "#" + vars.anc;
							if (hash !== '#' && hash.indexOf("#/") == -1) {
								var selector = decodeURI(hash);
								selector = selector.replace(/\.p\./g, "|").replace(/\.t\./g, "~");
								if (selector.indexOf('|') > -1) {
									selector = selector.split('|');
									var scrollDiff = selector[1];
									selector = selector[0];
								}
								el.get(selector, function(selector, elem, scrollDiff) {
									setTimeout(function() {
										if (!Extension.Anchor.interupted) {
											elem = elem[0];
											var c = Extension.Common
											  , vars = c.getUrlVars();
											if (c.varExist(scrollDiff))
												elem.scrollDiff = c.toInt(scrollDiff);
											else
												elem.scrollDiff = c.toInt(0);

											Extension.Anchor.scroll(elem, 0, true);
										}
									}, 100);
								}, scrollDiff);
							}
						}
					});
				}
			} catch (err) {}
		},
		onclick: function() {
			var c = Extension.Common
			  , el = Extension.Element
			  , p = Extension.Page;
			p.loaded(function() {
				var a = document.querySelectorAll("a");
				for (var i = 0; i < a.length; i++) {
					var selector = a[i].getAttribute('href');
					if (c.varExist(selector)) {
						if (selector.indexOf("#") > -1) {
							if (selector !== '#' && selector.indexOf("#/") == -1 && selector.indexOf("#content") == -1) {
								if (selector.indexOf('|') > -1) {
									selector = selector.split('|');
									var scrollDiff = selector[1];
									selector = selector[0];
								}
								if (c.varExist(scrollDiff))
									a[i].scrollDiff = c.toInt(scrollDiff);
								else
									a[i].scrollDiff = c.toInt(0);
								a[i].scrollSelector = selector;
								c.addEvent(a[i], 'click', function(e) {
									e.scrollDiff = this.scrollDiff;
									el.get(this.scrollSelector, function(selector, elem, e) {
										elem = elem[0];
										e.preventDefault();
										elem.scrollDiff = e.scrollDiff;
										Extension.Anchor.scroll(elem, 0, true);
									}, e);
								});
							}
						}
					}
				}
			});
		},
		expandcollapsable: function(elem) {
			try {
				var c = Extension.Common
				  , parent = elem.parentNode;
				if (c.varExist(parent)) {
					while (parent.nodeName !== "BODY") {
						if (c.varExist(parent.className)) {
							if (parent.className == "collapsable-area js-collapsable-area component") {
								var collapsarea = parent.querySelector("div.collapsable-area__content.js-collapsable-area__content");
								collapsarea.setAttribute('aria-hidden', 'false');
								collapsarea.setAttribute('style', 'max-height: 6000px;');

								var collapsbuttoncontainer = parent.querySelector("div.collapsable-area__button-container.js-collapsable-area__button-container");
								collapsbuttoncontainer.setAttribute('aria-hidden', 'false');

								var collapsbutton = collapsbuttoncontainer.querySelector("button.js-collapsable-area__button");
								collapsbutton.setAttribute('aria-expanded', 'true');

								var collapsbuttonmore = collapsbutton.querySelector("div.collapsable-area__more.js-collapsable-area__more");
								collapsbuttonmore.setAttribute('aria-hidden', 'true');

								var collapsbuttonless = collapsbutton.querySelector("div.collapsable-area__less.js-collapsable-area__less");
								collapsbuttonless.setAttribute('aria-hidden', 'false');

								break;
							}
						}
						parent = parent.parentNode;
					}
				}
			} catch (err) {
				console.log("Extension.Anchor: expandcollapsable: Err: " + err)
			}
		},
		scroll: function(elem, duration, animate) {
			try {
				this.expandcollapsable(elem);

				var c = Extension.Common
				  , scrollDiff = 0;
				if (c.varExist(elem.scrollDiff))
					scrollDiff = elem.scrollDiff;
				if (animate) {
					var startingY = window.pageYOffset,
						elemY = window.pageYOffset + elem.getBoundingClientRect().top,
						targetY = document.body.scrollHeight - elemY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elemY,
						diff = targetY + scrollDiff - startingY,
						easing = function(t) {
							return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
						},
						start;

					if (!diff)
						return;
					if (duration == 0){
						duration = parseInt(diff/3);
						if (duration < 400)
							duration = 400;
						if (duration > 2000)
							duration = 2000;
					}

					window.requestAnimationFrame(function step(timestamp) {
						if (!start)
							start = timestamp;
						var time = timestamp - start
						  , percent = Math.min(time / duration, 1)
						  , percent = easing(percent);
						window.scrollTo(0, startingY + diff * percent);
						if (time < duration)
							window.requestAnimationFrame(step);
					});
				} else {
					var elemY = window.pageYOffset + elem.getBoundingClientRect().top
					  , targetY = document.body.scrollHeight - elemY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elemY;
					window.scrollTo(0, targetY + scrollDiff);
				}
			} catch (err) {
				console.log("Extension.Anchor.scroll: Err: " + err);
			}
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-anchor");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "Anchor", fn: Anchor}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup Anchor " + str);
			});
			//Initiate Anchor
			Extension.Anchor.go();
		}
	}

	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();


