/*

  _
 |_   _|_  _  ._   _ o  _  ._
 |_ >< |_ (/_ | | _> | (_) | |


*/

//Override other Extension vars, only for testing purposes
//window.Extension = undefined; window.ExtensionMaxymiser = undefined; window.ExtensionSetting = undefined;
//window.ExtensionSnippetOverride = true;
//window.ExtensionVersionOverride = "preview";
//----------------------

window.Extension = window.Extension;
window.ExtensionMaxymiser = window.ExtensionMaxymiser;
window.ExtensionVersionOverride = window.ExtensionVersionOverride;
window.ExtensionSetting = window.ExtensionSetting || {
    Country: {
        homePath: "/no/no/",
        locale: "no_NO",
        storeId: "16",
        langId: "-14",
        numeric: {
			thousandseparator: ".",
			decimalseparator: ",",
			beforeprice: "",
			decimalconditionalafterprice: ",-",
			afterprice: "",
			decimalsum: false
        }
    },
    CountryDK: {
        homePath: "/dk/da/",
        locale: "da_DK",
        storeId: "14",
        langId: "-12",
        numeric: {
			thousandseparator: ".",
			decimalseparator: ",",
			beforeprice: "",
			decimalconditionalafterprice: ".-",
			afterprice: "",
			decimalsum: false
        }
    },
    CountryUS: {
        homePath: "/us/en/",
        locale: "us_EN",
        storeId: "12",
        langId: "-1",
        numeric: {
        	thousandseparator: ",",
			decimalseparator: ".",
			beforeprice: "$",
			decimalconditionalafterprice: ".00",
			afterprice: "",
        	decimalsum: true
        },
    },
    CountryFR: {
        homePath: "/fr/fr/",
        locale: "fr_FR",
        storeId: "4",
        langId: "-2",
        numeric: {
        	thousandseparator: " ",
			decimalseparator: ",",
			beforeprice: "",
			decimalconditionalafterprice: "",
			afterprice: " €",
        	decimalsum: false
        },
    },
    DataSources: {
        preview: "https://m2.ikea.com/no/no/data-sources/f9ea1a70986411e7930feb21aba72cd3.json",
        live: "https://m2.ikea.com/no/no/data-sources/3fae5170986f11e7930feb21aba72cd3.json"
    },
    PreviewFiles: {
        scriptUrl: "https://www.prougno.com/ikea/ext/ext/desktop.js",
        removestyles: "/iplugins/",
        mainfolder: "https://www.prougno.com/ikea/ext",
        folders: [
			{folder: "anchor", filename: "desktop", js: true, css: false},
			{folder: "autocomplete", filename: "desktop", js: true, css: true},
			{folder: "buyability", filename: "desktop", js: true, css: true},
			{folder: "changedates", filename: "desktop", js: true, css: false},
			{folder: "displaytimer", filename: "desktop", js: true, css: true},
			{folder: "freightcalc", filename: "desktop", js: true, css: true},
			{folder: "importproducts", filename: "desktop", js: true, css: false},
			{folder: "meta", filename: "desktop", js: true, css: false},
			{folder: "product", filename: "desktop", js: true, css: true},
			{folder: "simpletabs", filename: "desktop", js: true, css: true},
			{folder: "splitter", filename: "desktop", js: true, css: false},
			{folder: "swiper", filename: "desktop", js: true, css: true},
			{folder: "user", filename: "desktop", js: true, css: false}
        ]
    }
};


(function() {
    'use strict';
    try {

		var LoadExtension = function(callback){

			Extension.Version.load('ext', true, function(e) {
				if (e.preview) {
					Extension.Version.preview = true;
				} else {
					Extension.Version.preview = false;
				}

				if (Extension.Version.previewfiles)
					window.ExtensionQueuePreview = window.ExtensionQueuePreview || [];
				else
					window.ExtensionQueue = window.ExtensionQueue || [];

				window.ExtensionMaxymiser = window.ExtensionMaxymiser || {};
				var ExtensionTemp = {
					Source: {
						sources: {},
						load: function(properties, preview, callback, context) {
							var c = Extension.Common;
							Extension.SourceQueryStarted = Extension.SourceQueryStarted || false;
							Extension.SourceRequestList = Extension.SourceRequestList || [];
							if (Object.getOwnPropertyNames(this.sources).length > 0) {
								this.getfiles(properties, preview, callback, context);
							} else {
								Extension.SourceRequestList.push({
									properties: properties,
									preview: preview,
									callback: callback,
									context: context
								});
								if (!Extension.SourceQueryStarted) {
									Extension.SourceQueryStarted = true;
									var datasource = ExtensionSetting.DataSources.live;
									if (preview)
										datasource = ExtensionSetting.DataSources.preview;
									Extension.DataSource.JSON.load(datasource, function(data, context) {
										Extension.Source.sources = data.datasources;
										Extension.Source.waitingRoom();
									}, context);
								}

							}

						},
						getfiles: function(properties, preview, callback, context) {
							properties = properties.split(" ");
							var file = [];
							for (var i = 0; i < properties.length; i++) {
								var prop = properties[i]
								  , optional = false;
								if (properties[i].slice(0, 1) == "~") {
									prop = properties[i].slice(1, properties[i].length);
									optional = true;
								}
								if (!this.sources[prop] && !optional) {
									console.log("Extension.Source.getfiles: property " + prop + " does not exist.")
									return false;
								} else {
									if (this.sources[prop]) {
										for (var j = 0; j < this.sources[prop].length; j++) {
											file.push(this.sources[prop][j]);
										}
									}
								}
							}

							Extension.DataSource.JSON.load(file, function(data, context) {
								callback(data, context);
							}, context);
						},
						waitingRoom: function() {
							for (var i = 0; i < Extension.SourceRequestList.length; i++) {
								var f = Extension.SourceRequestList[i];
								this.getfiles(f.properties, f.preview, f.callback, f.context);
							}
							Extension.SourceRequestList = [];
						}

					},
					Common: {
						getCustomAttribute: function(targetElem, attr) {
							var value = "";
							try {
								var regex = new RegExp(attr + "\=[" + '"' + "|'](.*?)[" + '"' + "|']");
								var valueAttr = targetElem.outerHTML.match(regex);
								value = valueAttr[1];
								if (!isNaN(value) && value.length < 4 && value.length > 0) {
									value = parseInt(value.replace(/\D/g, ''));
								}
							} catch (err) {}
							return value;
						},
						getElementsByClassName: function(className, holdingElement) {
							if (!holdingElement)
								holdingElement = document;
							var found = [];
							var elements = holdingElement.getElementsByTagName("*");

							for (var i = 0; i < elements.length; i++) {
								var names = elements[i].className.split(' ');
								for (var j = 0; j < names.length; j++) {
									if (names[j] == className)
										found.push(elements[i]);
								}
							}
							return found;
						},
						getMetaContent: function(attribute, search) {
							try {
								var metas = document.getElementsByTagName('meta');
								for (var i = 0; i < metas.length; i++) {
									var attr = metas[i].getAttribute(attribute);
									if (this.varExist(attr)) {
										if (attr.toLowerCase() == search.toLowerCase()) {
											return metas[i].getAttribute('content');
										}
									}
								}
								return '';
							} catch (e) {
								return ''
							}
						},
						checkurl: function(input, returnindex) {
							if (!this.isObject(input)) input = {masks: input, returnindex: returnindex};

							var bool = true;
							if (this.varExist(returnindex))
								if (returnindex)
									bool = false;
							var masks = []
							  , found = false;
							if (this.isArray(input.masks))
								masks = input.masks;
							else
								masks.push(input.masks);

							var initialurl = document.URL.split("?")[0];
							if (this.varExist(input.includeparams)) if (input.includeparams) initialurl = document.URL;

							for (var n = 0; n < masks.length; n++) {
								var url = {
									doc: initialurl.toLowerCase(),
									mask: masks[n].toLowerCase()
								}
								var parts = url.mask.split("*");
								url.doctemp = url.doc.replace("/?", "?").replace("/#", "#");
								if (url.doctemp.slice(url.doctemp.length - 1, url.doctemp.length) == "/")
									url.doctemp = url.doctemp.slice(0, url.doctemp.length - 1);
								for (var i = 0; i < parts.length; i++) {
									var either = parts[i].split("|");
									for (var j = 0; j < either.length; j++) {
										either[j] = either[j].replace("/?", "?").replace("/#", "#");
										if (either[j].slice(either[j].length - 1, either[j].length) == "/")
											either[j] = either[j].slice(0, either[j].length - 1);

										var loc = url.doctemp.indexOf(either[j]);
										if (loc > -1) {
											parts[i] = either[j];
											break;
										}
									}
									if (loc > -1) {
										if (i == parts.length - 1 || (i == parts.length - 2 && parts[parts.length - 1].length == 0)) {
											if (parts[i].length == 0 || parts[parts.length - 1].length == 0) {
												if (bool)
													return true;
												else
													return n;
											} else {
												if (parts[i].match(/[?|#]/g)) {
													if (parts[i] == url.doctemp) {
														if (bool)
															return true;
														else
															return n;
													}
													break;
												} else {
													url.doctempnoparam = /.+?[?|#]|.+/.exec(url.doctemp);
													url.docref = url.doctempnoparam[0].slice(loc, url.doctempnoparam[0].length).replace(/[?|#]/g, "");
													if (parts[i] == url.docref) {
														if (bool)
															return true;
														else
															return n;
													}
													break;
												}
											}

										}
										url.doctemp = url.doctemp.slice(loc + parts[i].length, url.doctemp.length);
									} else
										break;

								}
							}
							if (bool)
								return false;
							else
								return -1;
						},
						monitorUrlChange: function (input) {
							if (this.isObject(input)){
								if (this.isFunction(input.onchange)){
									var firsturl = input.url;
									input.url = input.url || document.URL;
									input.time = input.time || 100;

									if (document.URL != input.url || !this.varExist(firsturl, true)) {
										input.onchange(input);
										input.url = document.URL;
									}
									setTimeout(function() {
										Extension.Common.monitorUrlChange(input);
									}, input.time);
								}
							}
						},
						monitorDomChange: function (input) {
							if (this.isObject(input) || this.isFunction(input)){
								if (this.isFunction(input)) input = {onchange: input};
								if (this.isFunction(input.onchange)){
									input.baseelem = input.baseelem || document;
									var changed = false;
									var dom = input.baseelem.getElementsByTagName("*");
									var i, len;
									if (this.varExist(input.dom)){
										len = input.dom.length;
										if (input.len !== len)
											changed = true;
										else {
											for (i=0;i<len;i++){
												if (input.dom[i].tagName !== dom[i].tagName){
													changed = true;
													break;
												}
											}
										}
									} else {
										len = dom.length;
										changed = true;
									}

									if (changed){
										input.dom = dom;
										input.len = len;
										input.onchange(input);
									}

									var continuemonitor = true;
									input.time = input.time || 100;
									if (this.varExist(input.timeout)){
										input.timeout -= input.time;
										if (input.timeout<0)
											continuemonitor = false;
									}
									if (continuemonitor){
										setTimeout(function() {
											Extension.Common.monitorDomChange(input);
										}, input.time);
									}
								}
							}
						},

						checkMobile: function() {
							return this.checkurl("*m2.ikea.|m2.ppe.*");
						},
						setDeviceCookie: function() {
							var c = this
							  , value = ""
							  , vars = c.getUrlVars();
							if (c.varExist(vars.device)) {
								if (vars.device.toLowerCase() == "mobile") {
									c.setCookie("device", "mobile");
								} else if (vars.device.toLowerCase() == "clear") {
									c.clearCookie("device");
								} else {
									c.setCookie("device", "desktop");
								}
							}
						},
						checkMaxymiserOverrideCookie: function() {
							var c = this
							  , value = ""
							  , vars = c.getUrlVars();
							if (c.varExist(vars.maxymiser)) {
								if (vars.maxymiser.toLowerCase() == "variant") {
									c.setCookie("maxymiser", "variant");
								} else if (vars.maxymiser.toLowerCase() == "clear") {
									c.clearCookie("maxymiser");
								} else {
									c.setCookie("maxymiser", "default");
								}
							}
							var cookie = c.getCookie("maxymiser");
							if (c.varExist(cookie, true)) {
								if (c.varExist(window.ExtensionMaxymiser)) {
									window.ExtensionMaxymiser.override = cookie;
								} else {
									window.ExtensionMaxymiser = {};
									window.ExtensionMaxymiser.override = cookie;
								}
							}

						},
						setCookie: function(cn, value, days) {
							var expires = '';
							if (days) {
								var date = new Date();
								date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
								expires = '; expires=' + date.toGMTString();
							}
							document.cookie = cn + '=' + value + expires + ';domain=.' + this.removeSubDomain(window.location.hostname) + ';path=/';
						},
						clearCookie: function(cn) {
							document.cookie = cn + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT' + ';domain=.' + this.removeSubDomain(window.location.hostname) + ';path=/';
						},
						getCookie: function(cn) {
							var match = document.cookie.match(new RegExp('(^|; )' + cn + '=([^;]+)'));
							if (match){
								if (match.length >= 2)
									return match[2];
							}
						},
						checkStorage: function(){

						},
						setStorage: function(cn, value, days) {
							if (typeof(Storage) !== "undefined") {
								if (days)
									localStorage.setItem(cn, value);
								else
									sessionStorage.setItem(cn, value);
							} else {
								this.setCookie(cn, value, days);
							}
						},
						clearStorage: function(cn) {
							if (typeof(Storage) !== "undefined") {
								localStorage.removeItem("lastname");
							} else {
								this.setCookie(cn, value, days);
							}
						},
						getStorage: function(cn) {
							if (typeof(Storage) !== "undefined") {
								var s;
								s = sessionStorage.getItem(cn);
								if (s) return s;
								else {
									s = localStorage.getItem(cn);
									if (s) return s;
								}
							} else {
								return this.getCookie(cn);
							}
						},

						removeSubDomain: function(hostn) {
							var is_co = hostn.match(/\.co\./);
							hostn = hostn.split('.');
							hostn = hostn.slice(is_co ? -3 : -2);
							hostn = hostn.join('.');
							return hostn;
						},
						varExist: function(variable, notEmpty) {
							if (typeof variable == 'undefined')
								return false;
							if (variable === 'undefined')
								return false;
							if (variable === null)
								return false;
							if (typeof notEmpty !== 'undefined')
								if (notEmpty)
									if (variable == "")
										return false;
							return true;
						},
						waitVarExist: function(input, callback, context) {
							window.setTimeout(function() {

								try {
									var endvar = window;
									var varchain = input.globalvarname.split(".");
									for (var i = 0; i < varchain.length; i++) {
										endvar = endvar[varchain[i]];
									}
									if (typeof endvar !== 'undefined') {
										callback({
											endvar: endvar,
											status: "success"
										}, context);
										return;
									}
								} catch (err) {}

								input.timeout = input.timeout - input.interval;
								if (input.timeout > 0)
									Extension.Common.waitVarExist(input, callback, context);
								else
									callback({
										endvar: undefined,
										status: "failed"
									}, context);

							}, input.interval);
						},
						hasClass: function(elem, cls) {
							if (elem){
								if (this.varExist(elem.className, true))
									return !!elem.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
								else
									return false;
							}
						},
						addClass: function(elem, cls) {
							if (elem){
								if (!this.hasClass(elem, cls)) {
									var t = elem.className + " " + cls;
									elem.className = t.replace("  ", " ");
								}
							}
						},
						removeClass: function(elem, cls) {
							var elems = this.toArray(elem);
							for (var i=0; i<elems.length; i++){
								if (this.hasClass(elems[i], cls)) {
									var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
									elems[i].className = elems[i].className.replace(reg, ' ');
								}
							}
						},
						addTimeoutClass: function(elem, cls, timeout){
							if (elem) {
								this.addClass(elem, cls);
								this.removeClass(elem, "ext-hidden");
								setTimeout(function(){
									//Extension.Common.removeClass(elem, cls);
								}, timeout)
							}		
						},
						toArray: function(elems){
							var arr = [];
							if (this.isArray(elems)) arr = elems;
							else if (this.isNodeList(elems)){
								for (var i=0; i<elems.length; i++)
									arr.push(elems[i]);
							} else if (this.isObject(elems) || this.isElement(elems))
								arr.push(elems);
							else if (this.varExist(elems, true))
								arr.push(elems);
							return arr;
						},
						formatNumber: function(input) {
							var numeric = ExtensionSetting.Country.numeric;
							var result = "", decimalseparator = "", decimalconditionalafterprice = "";
							if (!this.isObject(input)) input = {value: input}
							input.type = input.type || "int";
							if (input.type == "float") {
								var nr = this.toFloat(input);
								var nrstr = nr.toString();

								if (nrstr.indexOf(".") == -1) {
									decimalconditionalafterprice = numeric.decimalconditionalafterprice;
								} else {
									nr = nr.toFixed(2);
									nr = nr.replace(/\./g, numeric.decimalseparator);
								}
							} else {
								var nr = this.toInt(input);
								decimalconditionalafterprice = numeric.decimalconditionalafterprice;

							}

							return numeric.beforeprice + nr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, numeric.thousandseparator) + decimalconditionalafterprice + numeric.afterprice;
						},
						toInt: function(input) {
							var numeric = ExtensionSetting.Country.numeric;
							if (!this.isObject(input)) input = {value: input}
							try {
								if (this.isInt(input.value)){
									try{
										input.value = parseFloat(input.value);
										return input.value;
									}catch(err){
										return input.value;
									}
								}else if (this.isFloat(input.value)){
									try{
										input.value = Math.round(input.value);
										return input.value;
									}catch(err){
										return input.value;
									}
								} else {
									input.value = input.value.replace(/[^-0-9,.]/g, "");
									if (input.format == "price"){
										//input.value = input.value.replace(/&nbsp;/g, " ");
										var regex = new RegExp('\\' + numeric.thousandseparator,  "g");
										input.value = input.value.replace(regex, "");
										var regex = new RegExp('\\' + numeric.decimalseparator,  "g");
										input.value = input.value.replace(regex, ".");
									}

									if (input.value.slice(0, 1) == "-") {
										var t = parseInt(input.value);
										if (isNaN(t)) t = 0;
										return t - (t * 2);
									} else {
										var t = parseInt(input.value);
										if (isNaN(t)) t = 0;
										return t;
									}
								}
							} catch (err) {
								return -1
							}
						},
						isInt: function(value) {
							if (isNaN(value)) {
								return false;
							}
							var x = parseFloat(value);
							var y = (x | 0) === x;
							return y;
						},
						toFloat: function(input) {
							var numeric = ExtensionSetting.Country.numeric;
							if (!this.isObject(input)) input = {value: input}
							try {
								if (this.isInt(input.value) || this.isFloat(input.value)){
									try{
										input.value = parseFloat(input.value);
										return input.value;
									}catch(err){
										return input.value;
									}
								} else {
									input.value = input.value.replace(/[^-0-9,.]/g, "");
									if (input.format == "price"){
										//input.value = input.value.replace(/&nbsp;/g, " ");
										var regex = new RegExp('\\' + numeric.thousandseparator,  "g");
										input.value = input.value.replace(regex, "");
										var regex = new RegExp('\\' + numeric.decimalseparator,  "g");
										input.value = input.value.replace(regex, ".");
									}
									if (input.value.slice(0, 1) == "-") {
										var t = parseFloat(input.value);
										if (isNaN(t)) t = 0;
										return t - (t * 2);
									} else {
										var t = parseFloat(input.value);
										if (isNaN(t)) t = 0;
										return t;
									}
								}
							} catch (err) {
								return -1
							}
						},
						isFloat: function(n) {
							return Number(n) === n && n % 1 !== 0;
						},
						isArray: function(obj) {
							return Object.prototype.toString.call(obj) === "[object Array]";
						},
						isNodeList: function(obj) {
							return Object.prototype.toString.call(obj) === "[object NodeList]";
						},
						isObject: function(obj) {
							return Object.prototype.toString.call(obj) === "[object Object]";
						},
						isElement: function(obj, returntype) {
							var type = Object.prototype.toString.call(obj);
							if (type.indexOf("Element")> -1){
								if (this.varExist(returntype)){
									if (returntype) return type.replace(/\[|\]|HTML|object| |Element/g, "");
									else return true;
								} else return true;
							} else return false;
						},
						isFunction: function(obj) {
							return Object.prototype.toString.call(obj) == "[object Function]";
						},
						getUrlVars: function() {
							var vars = {};
							var parts = document.URL.replace(/[?&]+([^=&]+)=([^&#]*)/gi, function(m, key, value) {
								if (vars[key]) {
									if (vars[key]instanceof Array) {
										vars[key].push(value);
									} else {
										vars[key] = [vars[key], value];
									}
								} else {
									vars[key] = value;
								}
							});
							return vars;
						},
						getUrlHash: function() {
							var hash = "";
							var parts = document.URL.replace(/([#]+[^&?]*)/gi, function(m, value) {
								hash = value;
							});
							return hash;
						},
						getProdNumUrl: function(url) {
							try {
								if (url)
									var pn = url.match(/[s|S|\/|-]\d{8}/g);
								else
									var pn = document.URL.match(/[s|S|\/|-]\d{8}/g);
								if (pn){
									if (pn.length > 0)
										return pn[0].replace('/', '').replace('-', '');
									else
										return "";
								} else return ""
							} catch (err) {
								return "";
							}
						},
						checkProdUrl: function(prodnum) {
							if (prodnum.toString().replace(/\D/g, "") == this.getProdNumUrl())
								return true;
							else
								return false;
						},
						xhr: function() {
							try {
								return new XMLHttpRequest();
							} catch (e) {}
							try {
								return new ActiveXObject("Msxml3.XMLHTTP");
							} catch (e) {}
							try {
								return new ActiveXObject("Msxml2.XMLHTTP.6.0");
							} catch (e) {}
							try {
								return new ActiveXObject("Msxml2.XMLHTTP.3.0");
							} catch (e) {}
							try {
								return new ActiveXObject("Msxml2.XMLHTTP");
							} catch (e) {}
							try {
								return new ActiveXObject("Microsoft.XMLHTTP");
							} catch (e) {}
							return null;
						},
						addEvent: function(elem, type, callback) {
							if (elem.addEventListener)
								return elem.addEventListener(type, callback, false);
							else
								return elem.attachEvent('on' + type, callback);
						},
						removeEvent: function(elem, type, func) {
							if (elem.removeEventListener)
								elem.removeEventListener(type, func, false);
							else {
								elem.detachEvent("on" + type, func);
							}
						},
						triggerEvent: function(elem, type, callback){
							if (document.createEvent) {
								var event = document.createEvent('HTMLEvents');
								event.initEvent(type, true, false);
								elem.dispatchEvent(event);
								if (typeof callback == "function") callback();
							} else {
								elem.fireEvent("on" + type);
								if (typeof callback == "function") callback();
							}
						},
						onetime: function(elem, type, callback) {
							var c = Extension.Common;
							c.addEvent(elem, type, function(e) {
								/*
								c.removeEvent(e.target, e.type, arguments.callee)
								*/
								callback(e);
							});
						},
						uridecode: function(value) {
							try {
								value = decodeURIComponent(value.replace(/\+/g, " "));
								return value;
							} catch (err) {}

						},
						urldecoderecur: function(value) {
							if (value.indexOf('%') != -1) {
								return this.urldecoderecur(this.uridecode(value));
							}

							return value;
						},
						uriencode: function(value) {
							try {
								value = encodeURIComponent(value).replace(/'/g, "%27").replace(/"/g, "%22");
								return value
							} catch (err) {}
						},
						goto: function (href, target) {
							var a = document.createElement("a");
							a.target = target || "";
							a.href = href;
							a.click();
						},						
						isMobile: {
							Android: function() {
								return navigator.userAgent.match(/Android/i);
							},
							BlackBerry: function() {
								return navigator.userAgent.match(/BlackBerry/i);
							},
							iOS: function() {
								return navigator.userAgent.match(/iPhone|iPad|iPod/i);
							},
							Opera: function() {
								return navigator.userAgent.match(/Opera Mini/i);
							},
							Windows: function() {
								return navigator.userAgent.match(/IEMobile/i);
							},
							any: function() {
								return (this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows());
							}
						}

					},
					//Common
					AJAX: {
						load: function(url, input, context){
							var c = Extension.Common;
							var type = "",
								method = "get";
							if (c.isObject(input)){
								type = input.type || "";
								method = input.method || "get";
							}
							var response = new c.xhr();
							var DONE = 4;
							var OK = 200;
							response.context = context;
							if (type.toLowerCase() == "json")
								response.overrideMimeType("application/json");
							response.open(method, url, true);
							response.onreadystatechange = function() {
								var c = Extension.Common;
								if (c.isObject(input)){
									if (response.readyState === DONE) {
										if (response.status === OK) {
											try {
												var obj = JSON.parse(response.responseText);
												if (c.isFunction(input.success))
													input.success(obj, response.context);

											} catch (e) {
												if (c.isFunction(input.fail))
													input.fail(response, response.context);
											}
										} else {
											if (c.isFunction(input.fail))
												input.fail(response, response.context);
										}
									}
								}
							}
							response.send(null);
						}
					},
					DataSource: {
						JSON: {
							corsbust: function(file, callback, context) {
								//this.cachebust(function(time, file) {
									var c = Extension.Common
									  , device = "";
									if (c.checkurl("*m2.ikea.*"))
										device = "m2";
									else
										device = "irw";
									callback(file += "?" + device); // + time);
								//}, file);

							},
							cachebust: function(callback, context) {
								var t = Extension.Time;
								t.get(function(time, context) {
									time = time.slice(11, 15).replace(/:/g, "");
									callback(time, context);
								}, context);
							},
							combine: function(data) {
								var c = Extension.Common;
								var combined = [];
								for (var i = 0; i < data.length; i++) {

									var prop = Object.getOwnPropertyNames(data[i]);
									for (var j = 0; j < prop.length; j++) {

										if (c.isArray(data[i][prop[j]])) {
											combined[prop[j]] = combined[prop[j]] || [];
											for (var k = 0; k < data[i][prop[j]].length; k++) {
												combined[prop[j]].push(data[i][prop[j]][k]);
											}
										} else if (c.isObject(data[i][prop[j]])) {
											combined[prop[j]] = combined[prop[j]] || {};
											var objprop = Object.getOwnPropertyNames(data[i][prop[j]]);
											for (var k = 0; k < objprop.length; k++) {
												combined[prop[j]][objprop[k]] = data[i][prop[j]][objprop[k]];
											}

										} else {
											combined[prop[j]] = data[i][prop[j]] || "";
										}

									}
								}
								return combined;
							},
							load: function(file, callback, context) {
								var c = Extension.Common;
								var failed = 0
								  , success = 0
								  , data = [];

								var files = c.toArray(file);
								var total = files.length;
								for (var i = 0; i < files.length; i++) {
									this.corsbust(files[i], function(file) {
										Extension.DataSource.store = Extension.DataSource.store || [];
										var store = Extension.DataSource.store;
										var found = false;
										for (var s=0; s<store.length; s++){
											if (store[s].url == file){
												if (store[s].obj){
													data.push(store[s].obj);
													success++;
												} else {
													failed++;
												}
												found = true;
												break;
											}
										}
										if (found){
											if (success + failed == total) {
												callback(Extension.DataSource.JSON.combine(data), context);
											}
										} else {
											var response = new Extension.Common.xhr();
											var DONE = 4;
											var OK = 200;
											response.context = context;
											response.overrideMimeType("application/json");
											response.open('GET', file, true);
											response.onreadystatechange = function() {
												if (response.readyState === DONE) {
													if (response.status === OK) {
														try {
															var obj = JSON.parse(response.responseText);
															Extension.DataSource.store.push({
																url: response.responseURL,
																obj: obj
															});
															//Special for loading displaytimerdata
															if (obj.displaytimerdata){
																for (var i=0; i<obj.displaytimerdata.length; i++){
																	obj.displaytimerdata[i].filepath = response.responseURL;
																}
															}
															//-----------------------
															data.push(obj);
															success++;
														} catch (e) {
															Extension.DataSource.store.push({
																url: response.responseURL
															});
															failed++;
														}
													} else {
														Extension.DataSource.store.push({
															url: response.responseURL
														});
														failed++;
													}
													if (success + failed == total) {
														callback(Extension.DataSource.JSON.combine(data), response.context);
													}
												}
											}
											response.send(null);
										}
									});
								}
							}
						},
						Cxense: {
							load: function(cxwid, callback, context) {
								//var category = document.querySelectorAll("meta[name='IRWStats.categoryLocal']").length > 0 ? document.querySelectorAll("meta[name='IRWStats.categoryLocal']")[0].content: "";
								try {
									window.cX.callQueue.push(['insertWidget', {
										widgetId: cxwid,
										renderFunction: function(data, context) {
											if (data.response.items.length > 0) {
												// data.response has all elementens including product id
												var response = data.response;
												response.products = [];
												try {
													var items = response.items;
													for (var i = 0; i < items.length; i++)
														response.products.push(items[i]['ike-productid']);
												} catch (err) {
													console.log("Extension.DataSource.Cxense.load: Loading products: " + err)
												}
												callback(response, context);

											}
										},
										context: context
									}]);

								} catch (err) {
									console.log("Extension.DataSource.Cxense.load: " + err)
								}
							},

							loadParams: function(cxwid, params, callback) {
								//var category = document.querySelectorAll("meta[name='IRWStats.categoryLocal']").length > 0 ? document.querySelectorAll("meta[name='IRWStats.categoryLocal']")[0].content: "";
								try {
									window.cX.callQueue.push(['insertWidget', {
										widgetId: cxwid,
										renderFunction: function(data, context) {
											if (data.response.items.length > 0) {
												// data.response inneholder alle elementene inkludert produktid
												callback(data.response);
											}
										}
									}, {
										context: {
											"parameters": params
										}
									}]);

								} catch (err) {}
							}
						}
					},
					//DataSource
					Customer: {
						getlocation: function(callback){
							this.location = this.location || Extension.Common.getStorage("ext_location");
							this.location = this.validatelocation(this.location);
							
							if (this.location.city == "na" && this.location.region == "na" && this.location.country == "na"){
								if (ExtensionSetting.Country.locale = "no_NO"){
									Extension.Customer.checkcxense(this.location, function(data){
										callback(data);
									});
								} else {
									this.location = {city: "other", region: "other", country: "other"};
									Extension.Common.setStorage("ext_location", JSON.stringify(this.location));
									callback(this.location);
								}
							} else {
								callback(this.location);
							}
						},
						validatelocation: function(data){
							var default_data = {city: "na", region: "na", country: "na"};
							if (!Extension.Common.isObject(data)){
								try{
									data = JSON.parse(this.location);
								} catch(err){}
							}
							if (Extension.Common.isObject(data)){
								if (data.items){
									if (data.items[0]){
										if (data.items[0].city && data.items[0].region && data.items[0].country){
											data = data.items[0];
										} else data = default_data;
									} else data = default_data;
								} else {
									if (!(data.city && data.region && data.country)){
										data = default_data;
									}
								}
							} else data = default_data;
							return data;
						},
						checkcxense: function(data, callback){
							Extension.DataSource.Cxense.load("cb1b26e2ebdeeb72190ba03a226decc3e3db5504", function(data){
								data = Extension.Customer.validatelocation(data);
								if (!(data.city == "na" && data.region == "na" & data.country == "na")){
									Extension.Common.setStorage("ext_location", JSON.stringify(data));
									callback(data);
								} else {
									Extension.Customer.tries = Extension.Customer.tries || 0;
									Extension.Customer.tries++;
									if (Extension.Customer.tries < 2){
										cX.callQueue.push(['sendPageViewEvent', {
											location: "https://www.ikea.no/dummy"
										}, function() {
											cX.callQueue.push(['invoke', function() {
												setTimeout(function() {
													Extension.Customer.checkcxense(data, function(data){
														callback(data);
													});
												}, 500);
											}]);
										}]);
									} else if (Extension.Customer.tries < 8){
										setTimeout(function() {
											Extension.Customer.checkcxense(data, function(data){
												callback(data);
											});
										}, 200);
									} else {
										callback(Extension.Customer.location);
									}
								}
							});

						}
					},
					//Customer
					Element: {
						get: function(input, callback, context) {
							var c = Extension.Common;
							if (!c.varExist(input.selector))
								if (c.varExist(input, true))
									var input = {
										selector: input
									};
							input.baseelem = input.baseelem || document;
							if (!c.isArray(input.selector)) input.selector = input.selector.split("|");
							if (input.selector.length > 1)
								this.geteither(input, callback, context);
							else {
								input.selector = input.selector[0];

								if (c.varExist(input.selector, true)) {
									input.selector = c.urldecoderecur(input.selector);

									if (input.selector !== '#' && input.selector.indexOf("#/") == -1) {
										var timeout = input.timeout || 5000;
										var interval = input.interval || 20;

										if (input.selector.indexOf("~") > -1) {
											input.selector = input.selector.replace("#", "").replace(/_/g, " ");

											window.setTimeout(function() {
												Extension.Element.getrecur(document.getElementsByTagName('body')[0], input.selector, function(elem, context) {
													if (c.varExist(elem)){
														if (c.varExist(input.returnstatus))
															   if (input.returnstatus)
																   elem.status = "success";
														if (typeof callback == "function")
															callback(Extension.Element.getSelector(elem), [elem], context);
														else
															return elem;
													} else {
														input.timeout = timeout - interval;
														if (input.timeout > 0)
															Extension.Element.get(input, callback, context);
														else {
															if (c.varExist(input.returnstatus)){
															   if (input.returnstatus){
																   var elem = {};
																   elem.status = "failed";
																   callback(input.selector, [elem], context);
															   }
															}
														}
													}
												}, context);
											}, interval);
										} else {
											var elem = input.baseelem.querySelectorAll(input.selector);
											if (c.varExist(input.elementnumber)){
												input.elementnumber = c.toInt(input.elementnumber);
												if (elem.length >= c.toInt(input.elementnumber)){
													elem = [elem[input.elementnumber]];
												} else elem = [];
											}
											if (elem.length > 0) {
												if (c.varExist(input.returnstatus)){
												   if (input.returnstatus){
													   elem = {
														   elem: elem,
														   status: "success"
													   }
												   }
												}
												if (typeof callback == "function")
													callback(input.selector, elem, context);
												else
													return elem.elem || elem;
											} else {
												window.setTimeout(function() {
													var elem = input.baseelem.querySelectorAll(input.selector);
													if (c.varExist(input.elementnumber)){
														input.elementnumber = c.toInt(input.elementnumber);
														if (elem.length >= c.toInt(input.elementnumber)){
															elem = [elem[input.elementnumber]];
														} else elem = [];
													}
													if (elem.length > 0) {
														if (c.varExist(input.returnstatus)){
														   if (input.returnstatus){
															   elem = {
																   elem: elem,
																   status: "success"
															   }
														   }
														}
														if (typeof callback == "function")
															callback(input.selector, elem, context);
														else
															return elem.elem || elem;
													} else {
														input.timeout = timeout - interval;
														if (input.timeout > 0)
															Extension.Element.get(input, callback, context);
														else {
															if (c.varExist(input.returnstatus)){
															   if (input.returnstatus){
																   var elem = {};
																   elem.status = "failed";
																   callback(input.selector, elem, context);
															   }
															}
														}
													}
												}, interval);
											}
										}
									}
								}
							}
						},
						geteither: function(input, callback, context){
							var c = Extension.Common;
							if (!c.varExist(input.selector))
								if (c.varExist(input, true))
									var input = {
										selector: input
									};
							if (!c.isArray(input.selector)) input.selector = input.selector.split("|");
							var found = false;
							for (var i=0; i<input.selector.length; i++){
								var t_input = {
									selector: input.selector[i],
									elementnumber: input.elementnumber,
									timeout: input.timeout,
									interval: input.interval,
									returnstatus: input.returnstatus
								}
								this.get(t_input, function(selector, elem, context){
									if (!found) callback(selector, elem, context);
									found = true;

								}, context);
							}
						},
						getrecur: function(elem, searchtxt, callback, context) {
							var c = Extension.Common;
							searchtxt = searchtxt.replace("~", "");
							if (elem.childNodes.length == 1) {
								callback(elem, context);
								return;
							} else {
								for (var i = 0; i < elem.childNodes.length; i++) {
									var nn = elem.childNodes[i].nodeName;
									if (nn == "#text") {
										var haystack = elem.childNodes[i].data;
										if (haystack.indexOf(searchtxt) > -1) {
											callback(elem, context);
											return;
										}
									} else if (nn !== "#comment") {
										//nn !== "#text" &&
										var haystack = this.stripHTML(elem.childNodes[i].innerHTML);
										if (haystack.indexOf(searchtxt) > -1) {
											if (c.varExist(elem.childNodes[i].childNodes))
												this.getrecur(elem.childNodes[i], searchtxt, callback, context);
											else
												callback(elem.childNodes[i], context);
											return;
										}
									}
								}

								var haystack = this.stripHTML(elem.innerHTML);
								if (haystack.indexOf(searchtxt) > -1) {
									callback(elem, context);
									return;
								}
								callback('undefined', context);
							}
						},
						stripHTML: function(html){
							html = html.replace(/&amp;/gmi, "&");
							html = html.replace(/&lt;/gmi, "<");
							html = html.replace(/&gt;/gmi, ">");
							html = html.replace(/&nbsp;/gmi, " ");
							html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, "");
							html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, "");
							html = html.replace(/\s?<[^>]*>\s?/gmi, "");
							html = html.replace(/\s{3,}/gmi, "");
							return html;
						},
						countChildNodes: function(elem) {
							var count = 0;
							try {
								for (var i = 0; i < elem.childNodes.length; i++) {
									var nn = elem.childNodes[i].nodeName;
									if (nn !== "#text" && nn !== "#comment")
										count++;
								}
							} catch (err) {
								return 0
							}
							return count;
						},
						getChildNodes: function(elem) {
							var arr = [];
							try {
								for (var i = 0; i < elem.childNodes.length; i++) {
									var nn = elem.childNodes[i].nodeName;
									if (nn !== "#comment")
										arr.push(elem.childNodes[i]);
								}
							} catch (err) {
								return [];
							}
							return arr;
						},
						nextSibling: function(elem) {
							if (elem.nextElementSibling)
								return elem.nextElementSibling;
							do {
								elem = elem.nextSibling
							} while (elem && elem.nodeType !== 1);return elem;
						},
						hide: function (input){
							this.setcss(input, "display", "none");
						},
						show: function (input){
							this.setcss(input, "display", "block");
						},
						setcss: function(input, prop, value){
							var c = Extension.Common,
								elem, selelem;
							if (c.isObject(input)){
								if (c.varExists(input.selector)){
									if (!c.isArray(input.selector))
										input.selector.split("|");
									for (var i=0; i<input.selector.length; i++)
										this.get(input.selector[i], function(selector, elem){
											for (var j=0; j<elem.length; j++)
												elem[j].style.setProperty(prop, value);
										});
								} else {
									elem = c.toArray(input);
									for (var j=0; j<elem.length; j++)
										elem[j].style.setProperty(prop, value);
								}
							} else if (c.isArray(input) || c.isNodeList(input)){
								selelem = c.toArray(input);
								for (var i=0; i<selelem.length; i++){
									if (c.isObject(selelem[i]))
										selelem[i].style.setProperty(prop, value);
									else {
										this.get(selelem[i], function(selector, elem){
											for (var j=0; j<elem.length; j++)
												elem[j].style.setProperty(prop, value);
										});
									}
								}
							} else {
								input.split("|");
								for (var i=0; i<input.selector.length; i++)
									this.get(input.selector[i], function(selector, elem){
										for (var j=0; j<elem.length; j++)
											elem[j].style.setProperty(prop, value);
									});
							}
						},

						hidestyle: function(input) {
							var c = Extension.Common;
							if (!c.isObject(input))
								input = {selector: ""}
							if (c.isObject(input)) {
								if (!c.varExist(input.selector)){
									if (!c.varExist(input.elem))
										input.elem = input;
									for (var i = 0; i < input.elem.length; i++) {
										input.selector += this.getSelector(input.elem[i]);
										if (i < input.elem.length - 1)
											input.selector += ', ';
									}
								} else {
									if (c.isObject(input.elem)){
										if (input.selector.length>0) input.selector += ", ";
										for (var i = 0; i < input.elem.length; i++) {
											input.selector += this.getSelector(input.elem[i]);
											if (i < input.elem.length - 1)
												input.selector += ', ';
										}
									}
								}
							}

							if (!c.varExist(input.selector)) {
								if (c.varExist(input, true)){
									var input = {selector: input};
								}
							}
							input.id = input.id || "";
							if (input.id.length>0)
								input.id = "-" + input.id;
							var hse = document.querySelector("head style#ext-hse" + input.id);
							if (!c.varExist(hse)) {
								var hse = document.createElement("style");
								hse.id = "ext-hse" + input.id;
								document.head.appendChild(hse);
							}
							hse.innerHTML += input.selector + "{visibility:hidden!important}";
							setTimeout(function() {
								Extension.Element.showall("ext-hse" + input.id);
							}, 2000);
						},
						showall: function(id) {
							var c = Extension.Common;
							if(c.varExist(id))
								if (id.length>0)
									id = "-" + id;
							var hse = document.querySelector("head style#ext-hse" + id);
							if (c.varExist(hse)){
								var timeout = 100;
								Extension.Version.load('extshowalltimout1', false, function(e) {
									timeout = 1;
								});
								Extension.Version.load('extshowalltimout20', false, function(e) {
									timeout = 20;
								});
								Extension.Version.load('extshowalltimout50', false, function(e) {
									timeout = 50;
								});
								setTimeout(function(){
									hse.innerHTML = "";
								}, 100);
							}

						},
						getSelector: function(elem) {
							if (elem == null)
								return '';
							if (elem.parentElement == null)
								return 'html'
							return this.getSelector(elem.parentElement) + '>' + ':nth-child(' + this.getIndex(elem) + ')';
						},
						getIndex: function(elem) {
							if (elem == null)
								return -1;
							if (elem.parentElement == null)
								return 0;
							var parent = elem.parentElement;
							for (var index = 0; index < parent.childElementCount; index++)
								if (parent.children[index] == elem)
									return index + 1;
						},
						inject: function(elem, targetelem, placing){
							var run = true;
							if (!Extension.Common.isElement(elem)) run = false;
							if (run){
								switch(placing) {
									case "before":
										targetelem.parentNode.insertBefore(elem, targetelem);
										break;
									case "append":
										targetelem.appendChild(elem);
										break;
									case "prepend":
										targetelem.insertBefore(elem, targetelem.firstChild);
										break;
									case "replace":
										targetelem.innerHTML = "";
										targetelem.appendChild(elem);
										break;
									case "after":
										targetelem.parentNode.insertBefore(elem, targetelem.nextSibling);
										break;
									default:
										targetelem.parentNode.insertBefore(elem, targetelem.nextSibling);
										break;
								}
							}
						},
						remove: function(elem){
							var c = Extension.Common;
							elem = c.toArray(elem);
							for (var i=0; i<elem.length; i++){
								if (c.isElement(elem[i])) {
									try{
										elem[i].parentNode.removeChild(elem[i]);
									} catch(err){}
								}
							}
						},
						addModal:function(input){
							var c = Extension.Common;
							if (!c.varExist(input.html)) if (!c.isObject(input)) input = {html: input};
							this.ext_modal = document.createElement("div");
							this.ext_modal.id = "ext-modal";
							var cls = "ext-modal"
							if (c.varExist(input.includeclass)) cls += " " + input.includeclass;
							this.ext_modal.className = cls;
							cls = "ext-modal-content"
							var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
							var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

							if (c.varExist(input.includecontentclass)) cls += " " + input.includecontentclass;
							this.ext_modal.innerHTML = "<div class=\"" + cls + "\" style=\"max-height:" + (h-200) + "px\">" +
								"<span id=\"ext-modal-close\" class=\"ext-modal-close\" style=\"display:none\">&times;</span>" +
								input.html +
								"</div>";
							document.body.appendChild(this.ext_modal);

							setTimeout(function(){
								Extension.Common.addClass(Extension.Element.ext_modal, "ext-show");
							},1);
							input.timeoutclose = input.timeoutclose || 1;
							setTimeout(function(){
								var c = Extension.Common,
									closed = false;
								if (c.varExist(input.autoclose)) {
									if (input.autoclose) {
										c.removeClass(Extension.Element.ext_modal, "ext-show");
										setTimeout(function(){
											var m = document.querySelectorAll(".ext-modal");
											for (var i=0; i<m.length; i++)
												Extension.Element.remove(m[i]);
											delete Extension.Element.ext_modal;
										},1000);
										closed = true;
									}
								}
								if (!closed){
									Extension.Element.ext_modal_close = Extension.Element.ext_modal.querySelector("#ext-modal-close");
									Extension.Element.ext_modal_close.style.setProperty("display", "")

									c.addEvent(window, "click", function(e){
										if (e.target == Extension.Element.ext_modal) {
											Extension.Common.removeClass(Extension.Element.ext_modal, "ext-show");
											setTimeout(function(){
												var m = document.querySelectorAll(".ext-modal");
												for (var i=0; i<m.length; i++)
													Extension.Element.remove(m[i]);
												delete Extension.Element.ext_modal;
											},1000);
										}
									});
									c.addEvent(Extension.Element.ext_modal_close, "click", function(e){
										Extension.Common.removeClass(Extension.Element.ext_modal, "ext-show");
										setTimeout(function(){
											var m = document.querySelectorAll(".ext-modal");
											for (var i=0; i<m.length; i++)
												Extension.Element.remove(m[i]);
											delete Extension.Element.ext_modal;
										},1000);
									});
								}
							}, input.timeoutclose)
						}
					},
					//Element
					Targeting: {
						reload: true,
						products: function(crit, callback, context){
							//Extension.Page.loaded(function(){
								var c = Extension.Common,
									t = Extension.Targeting;
								if (c.varExist(t.data)){
									if (t.data.currentpage !== document.URL || t.reload){
										t.allProducts(function(data){
											t.data = data;
											if (c.isFunction(callback))
												callback(t.filterProducts(crit, t.data), context);
										});
									} else {
										if (c.isFunction(callback))
											callback(t.filterProducts(crit, t.data), context);
									}
								} else {
									t.allProducts(function(data){
										t.data = data;
										if (c.isFunction(callback))
											callback(t.filterProducts(crit, t.data), context);
									});
								}
								t.reload = false;

							//});
						},
						allProducts: function (callback, context) {
							var c = Extension.Common,
								e = Extension.Element;
							var data = {},
								elem;
							data.currentpage = document.URL;
							data.pagetype = "na";
							data.dom = {
								main: {
									elems: [],
									data: [],
									loc: []
								},
								other: {
									compl: {
										elems: [],
										data: [],
										loc: []
									},
									more: {
										elems: [],
										data: [],
										loc: []
									},
									spr: {
										elems: [],
										data: [],
										loc: []
									}

								}
							}
							if (c.checkMobile()){

								//M2

								if (c.checkurl("*" + ExtensionSetting.Country.homePath + "p/*")){
									data.pagetype = "pip";
									e.get("footer.footer", function(selector, elem, data){
										data.dom.main = {
											elems: [document],
											data: [],
											loc: [
												{selector: "#pip-carousel", placing: "prepend"},
												{selector: ".price-package", placing: "before"},
												{selector: ".product-pip__purchase", placing: "before"},
												{selector: "#stock-check", placing: "before"},
												{selector: "div.product-pip__top-container", placing: "after"},
												{selector: "main div.product-pip", placing: "append"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											artnr = c.getProdNumUrl().replace(/\D/g, "");
											elem = data.dom.main.elems[i].querySelector("div.product-pip__price-package h1.product-pip__product-heading span.pip-header-font");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("div.product-pip__price-package h1.product-pip__product-heading span.normal-font");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (c.checkurl("*" + ExtensionSetting.Country.homePath + "search/*")) {
									data.pagetype = "search";
									e.get("footer.footer", function(selector, elem, data){
										data.dom.main = {
											elems: document.querySelectorAll("span.product-compact"),
											data: [],
											loc: [
												{selector: ".image-claim-height", placing: "prepend"},
												{selector: ".product-compact__name", placing: "before"},
												{selector: "a", placing: "after"},
												{selector: "a", placing: "after"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											elem = data.dom.main.elems[i].querySelector("a");
											if (elem) artnr = c.getProdNumUrl(elem.href).replace(/\D/g, "");
											elem = data.dom.main.elems[i].querySelector("span.product-compact__name");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span.product-compact__type");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (c.checkurl("*/shop/wishlist/*")) {
									data.pagetype = "wishlist";
									e.get("footer.footer", function(selector, elem, data){
										data.dom.main = {
											elems: document.querySelectorAll(".productlist .product"),
											data: [],
											loc: [
												{selector: "div._Rfxh_._Rfx2_", placing: "after"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											elem = data.dom.main.elems[i].querySelector("span.product_description-article-number");
											if (elem) artnr = elem.innerHTML.replace(/[^0-9]/g,"");
											elem = data.dom.main.elems[i].querySelector("div._Rfx3_ h2");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span.product_description-type");
											if (elem) desc = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span.product__description-design-text");
											if (elem) desc += ", " + elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (!c.checkurl("*/webapp/wcs/stores/servlet/*")) {
									data.pagetype = "plp";
									e.get("footer.footer", function(selector, elem, data){
										data.dom.main = {
											elems: document.querySelectorAll("span.product-compact"),
											data: [],
											loc: [
												{selector: ".image-claim-height", placing: "prepend"},
												{selector: ".product-compact__name", placing: "before"},
												{selector: "a", placing: "after"},
												{selector: "a", placing: "after"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											elem = data.dom.main.elems[i].querySelector("a");
											if (elem) artnr = c.getProdNumUrl(elem.href).replace(/\D/g, "");
											elem = data.dom.main.elems[i].querySelector("span.product-compact__name");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span.product-compact__type");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else {
									data.dom.main = {
										elems: [document],
										data: [],
										loc: []
									}
									if (Extension.Common.isFunction(callback))
										callback(data, context);
								}
							} else {
								
								//IRW

								if (c.checkurl("*/catalog/products/*")){
									data.pagetype = "pip";
									e.get("div#footer", function(selector, elem, data){
										data.dom.main = {
											elems: [document],
											data: [],
											loc: [
												{selector: "#mainImgConatiner", placing: "prepend"},
												{selector: "#rightNavInfoDiv", placing: "before"},
												{selector: "#rightNavInfoDiv", placing: "after"},
												{selector: "#stockResultHolder", placing: "before"},
												{selector: "#pipContainer", placing: "after"},
												{selector: "#footer", placing: "before"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											elem = data.dom.main.elems[i].querySelector("div.itemNumber #itemNumber");
											if (elem) artnr = elem.innerHTML.replace(/[^0-9]/g,"");
											elem = data.dom.main.elems[i].querySelector("div#productInfoWrapper2 #name");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("div#productInfoWrapper2 #type");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}

										data.dom.other.compl = {
											elems: document.querySelectorAll("#complementaryProductContainer li.prodClass"),
											data: [],
											loc: [
												{selector: ".svgButtonContainer", placing: "before"}
											]
										}
										var max = data.dom.other.compl.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											artnr = data.dom.other.compl.elems[i].id.split("_")[1].replace(/[^0-9]/g,"");
											elem = data.dom.other.compl.elems[i].querySelector("span.prodName");
											if (elem) name = elem.innerHTML;
											elem = data.dom.other.compl.elems[i].querySelector("span.prodDesc");
											if (elem) desc = elem.innerHTML;
											data.dom.other.compl.data.push({artnr: artnr, name: name, desc: desc});
										}
										data.dom.other.more = {
											elems: document.querySelectorAll("#moreProdModule li.prodClass"),
											data: [],
											loc: [
												{selector: "a", placing: "append"}
											]
										}
										var max = data.dom.other.more.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											artnr = data.dom.other.more.elems[i].id.split("_")[1].replace(/[^0-9]/g,"");
											elem = data.dom.other.more.elems[i].querySelector("span.prodName");
											if (elem) name = elem.innerHTML;
											elem = data.dom.other.more.elems[i].querySelector("span.prodDesc");
											if (elem) desc = elem.innerHTML;
											data.dom.other.more.data.push({artnr: artnr, name: name, desc: desc});
										}

										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (c.checkurl("*/catalog/availability/*")){
									data.pagetype = "availability";
									e.get("div#footer", function(selector, elem, data){
										data.dom.main = {
											elems: document.querySelectorAll(".sc_product_container"),
											data: [],
											loc: [
												{selector: ".sc_product_img_container", placing: "after"}
											]
										};
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											elem = data.dom.main.elems[i].querySelector("a#pipUrl");
											if (elem) artnr = /([^sS\/]*)\/?$/g.exec(elem.href)[1];
											elem = data.dom.main.elems[i].querySelector("span#name");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span#type");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (c.checkurl("*/search/*")) {
									data.pagetype = "search";
									e.get("div#footer", function(selector, elem, data){
										data.dom.main = {
											elems: document.querySelectorAll("#productsTable .productContainer"),
											data: [],
											loc: [
												{selector: "img.prodImg", placing: "before"},
												{selector: ".prodName", placing: "before"},
												{selector: ".moreInfo .buttonsContainer", placing: "before"},
												{selector: ".buttonsContainer", placing: "before"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											artnr = data.dom.main.elems[i].id.split("_")[1].replace(/[^0-9]/g,"");
											elem = data.dom.main.elems[i].querySelector("span.prodName");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span.prodDesc");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (c.checkurl("*/InterestItemDisplay")) {
									data.pagetype = "wishlist";
									e.get("div#footer", function(selector, elem, data){
										data.dom.main = {
											elems: document.querySelectorAll("#productsContainer table tbody tr"),
											data: [],
											loc: [
												{ selector: "td.colBuyable", placing: "after"}
											]
										}
										var elems = [];
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											if (c.varExist(data.dom.main.elems[i].id, true)){
												if (data.dom.main.elems[i].id.indexOf("tr_") > -1)
													elems.push(data.dom.main.elems[i]);
											}
										}
										data.dom.main.elems = elems;
										max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											artnr = data.dom.main.elems[i].id.split("_")[1].replace(/[^0-9]/g,"");
											elem = data.dom.main.elems[i].querySelector("span.prodName");
											if (elem) name = elem.innerHTML;
											elem = data.dom.main.elems[i].querySelector("span.prodDesc");
											if (elem) desc = elem.innerHTML;
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else if (!c.checkurl("*/webapp/wcs/stores/servlet/*")) {
									data.pagetype = "plp";
									e.get("div#footer", function(selector, elem, data){
										//elems: document.querySelectorAll("#productLists .product .products"),
										data.dom.main = {
											elems: document.querySelectorAll(".productLists .product, .product-list .product"),
											data: [],
											loc: [
												{selector: ".image", placing: "before"},
												{selector: ".productDetails", placing: "before"},
												{selector: ".moreInfo", placing: "before"},
												{selector: ".moreInfo .buttonsContainer", placing: "before"},
												{selector: ".moreInfo .buttonsContainer", placing: "after"}
											]
										}
										var max = data.dom.main.elems.length;
										for (var i=0; i<max; i++){
											var artnr = "", name = "", desc = "";
											/*
											if (c.hasClass(data.dom.main.elems[i], "threeColumn")){
												artnr = data.dom.main.elems[i].id.split("_")[1].replace(/[^0-9]/g,"");
												elem = data.dom.main.elems[i].querySelector("div.productDetails .productTitle");
												if (elem) name = elem.innerHTML;
												elem = data.dom.main.elems[i].querySelector("div.productDetails .productDesp");
												if (elem) desc = elem.innerHTML;
											} else {
												*/
												elem = data.dom.main.elems[i].querySelector("div.productDetails .productTitle");
												if (elem) {
													name = elem.innerHTML;
													artnr = /([^sS\/]*)\/?$/g.exec(elem.parentNode.parentNode.href)[1];
													if (artnr == "undefined"){
														artnr = /([^sS\/]*)\/?$/g.exec(elem.parentNode.href)[1];
													}
												}
												elem = data.dom.main.elems[i].querySelector("div.productDetails .productDesp");
												if (elem) desc = elem.innerHTML;
											//}
											data.dom.main.data.push({artnr: artnr, name: name, desc: desc});
										}
										data = Extension.Targeting.clean(data);
										if (Extension.Common.isFunction(callback))
											callback(data, context);
									}, data);
								} else {
									if (Extension.Common.isFunction(callback))
										callback(data, context);
								}
							}

						},
						clean: function(data){
							for (var i=0; i<data.dom.main.data.length; i++){
								data.dom.main.data[i].desc = data.dom.main.data[i].desc.replace(/&nbsp;/g, "");
							}
							for (var i=0; i<data.dom.other.compl.data.length; i++){
								data.dom.other.compl.data[i].desc = data.dom.other.compl.data[i].desc.replace(/&nbsp;/g, "");
							}
							for (var i=0; i<data.dom.other.more.data.length; i++){
								data.dom.other.more.data[i].desc = data.dom.other.more.data[i].desc.replace(/&nbsp;/g, "");
							}
							return data;
						},

						filterProducts: function(crit, input, callback, context) {
							var c = Extension.Common;
							var maxi, maxj, maxk;
							
							if (c.varExist(input.dom)) {
								var output = this.newoutput(input);
								if (crit.artnr){
									if (!c.varExist(crit.artnr.incl) && !c.varExist(crit.artnr.excl)){
										var t = {incl: [], excl:[]}
										crit.artnr = crit.artnr.toString().replace(/[^0-9,]/g,"");
										crit.artnr = c.toArray(crit.artnr);
										for (var i=0; i<crit.artnr.length; i++){
											var split_ie = crit.artnr[i].split("!");
											if (split_ie[0])
												t.incl.push(split_ie[0]);
											if (split_ie[1])
												t.excl.push(split_ie[1]);
										}
										crit.artnr = t;
									}
									if (c.varExist(crit.artnr.incl)){
										crit.artnr.incl = c.toArray(crit.artnr.incl);
										var t = [];
										for (var i=0; i<crit.artnr.incl.length; i++){
											crit.artnr.incl[i] = crit.artnr.incl[i].toString().replace(/[^0-9,]/g,"");
											var split_artnr = crit.artnr.incl[i].split(",");
											for (var j=0; j<split_artnr.length; j++){
												if (split_artnr[j].length >= 3)
													t.push(split_artnr[j]);
											}
										}
										crit.artnr.incl = t;
									} else crit.artnr.incl = [];

 									if (c.varExist(crit.artnr.excl)){
										crit.artnr.excl = c.toArray(crit.artnr.excl);
										var t = [];
										for (var i=0; i<crit.artnr.excl.length; i++){
											crit.artnr.excl[i] = crit.artnr.excl[i].toString().replace(/[^0-9,]/g,"");
											var split_artnr = crit.artnr.excl[i].split(",");
											for (var j=0; j<split_artnr.length; j++){
												if (split_artnr[j].length >= 3)
													t.push(split_artnr[j]);
											}
										}
										crit.artnr.excl = t;
									} else crit.artnr.excl = [];
								} else crit.artnr = {incl: [], excl: []};

								if (crit.name){
									if (!c.varExist(crit.name.incl) && !c.varExist(crit.name.excl)){
										var t = {incl: [], excl:[]}
										if (crit.name.replace(/\s/g, "") == "")
											crit.name = "";
										crit.name = c.toArray(crit.name);
										for (var i=0; i<crit.name.length; i++){
											var split_ie = crit.name[i].split("!");
											if (split_ie[0])
												t.incl.push(split_ie[0]);
											if (split_ie[1])
												t.excl.push(split_ie[1]);
										}
										crit.name = t;
									}
									if (c.varExist(crit.name.incl)){
										crit.name.incl = c.toArray(crit.name.incl);
										var t = [];
										for (var i=0; i<crit.name.incl.length; i++){
											if (crit.name.incl[i].replace(/\s/g, "") == "")
												crit.name.incl[i] = "";
											var split_name = crit.name.incl[i].split("|");
											for (var j=0; j<split_name.length; j++){
												t.push(split_name[j]);
											}
										}
										crit.name.incl = t;
									}  else crit.name.incl = [];
									if (c.varExist(crit.name.excl)){
										crit.name.excl = c.toArray(crit.name.excl);
										var t = [];
										for (var i=0; i<crit.name.excl.length; i++){
											if (crit.name.excl[i].replace(/\s/g, "") == "")
												crit.name.excl[i] = "";
											var split_name = crit.name.excl[i].split("|");
											for (var j=0; j<split_name.length; j++){
												t.push(split_name[j]);
											}
										}
										crit.name.excl = t;
									}  else crit.name.excl = [];
								}  else crit.name = {incl: [], excl: []};


								if (crit.desc){
									if (!c.varExist(crit.desc.incl) && !c.varExist(crit.desc.excl)){
										var t = {incl: [], excl:[]}
										if (crit.desc.replace(/\s/g, "") == "")
											crit.desc = "";
										crit.desc = c.toArray(crit.desc);
										for (var i=0; i<crit.desc.length; i++){
											var split_ie = crit.desc[i].split("!");
											if (split_ie[0])
												t.incl.push(split_ie[0]);
											if (split_ie[1])
												t.excl.push(split_ie[1]);
										}
										crit.desc = t;
									}
									if (c.varExist(crit.desc.incl)){
										crit.desc.incl = c.toArray(crit.desc.incl);
										var t = [];
										for (var i=0; i<crit.desc.incl.length; i++){
											if (crit.desc.incl[i].replace(/\s/g, "") == "")
												crit.desc.incl[i] = "";
											var split_desc = crit.desc.incl[i].split("|");
											for (var j=0; j<split_desc.length; j++){
												t.push(split_desc[j]);
											}
										}
										crit.desc.incl = t;
									}  else crit.desc.incl = [];
									if (c.varExist(crit.desc.excl)){
										crit.desc.excl = c.toArray(crit.desc.excl);
										var t = [];
										for (var i=0; i<crit.desc.excl.length; i++){
											if (crit.desc.excl[i].replace(/\s/g, "") == "")
												crit.desc.excl[i] = "";
											var split_desc = crit.desc.excl[i].split("|");
											for (var j=0; j<split_desc.length; j++){
												t.push(split_desc[j]);
											}
										}
										crit.desc.excl = t;
									}  else crit.desc.excl = [];
								} else crit.desc = {incl: [], excl: []};
								
								if (crit.artnr.incl.length > 0 || crit.artnr.excl.length > 0 ||
									crit.name.incl.length > 0 || crit.name.excl.length > 0 ||
									crit.desc.incl.length > 0 || crit.desc.excl.length > 0) {
									output.hascrit = true;	
								} else {
									output.hascrit = false;
								}

								if (crit.artnr.incl.length > 0 || crit.artnr.excl.length > 0){
									maxi = input.dom.main.data.length;
									for (var i=0; i<maxi; i++){
										
										var excl = false;
										maxj = crit.artnr.excl.length;
										for (var j=0; j<maxj; j++){
											if (input.dom.main.data[i].artnr.indexOf(crit.artnr.excl[j]) > -1){
												excl = true;
											}
										}
										if (!excl){
											var incl = false;
											if (crit.artnr.incl.length > 0){
												maxj = crit.artnr.incl.length;
												for (var j=0; j<maxj; j++){
													if (input.dom.main.data[i].artnr.indexOf(crit.artnr.incl[j]) > -1)
														incl = true;
												}
											} else if (crit.artnr.excl.length > 0)
												incl = true;
												
											if (incl){
												output.dom.main.elems.push(input.dom.main.elems[i]);
												output.dom.main.data.push(input.dom.main.data[i]);
											}
										}
									}

									if (c.varExist(output.dom.other)){
										maxi = input.dom.other.compl.data.length;
										for (var i=0; i<maxi; i++){
											var excl = false;
											maxj = crit.artnr.excl.length;
											for (var j=0; j<maxj; j++){
												if (input.dom.other.compl.data[i].artnr.indexOf(crit.artnr.excl[j]) > -1){
													excl = true;
												}
											}
											if (!excl){
												var incl = false;
												if (crit.artnr.incl.length > 0){
													maxj = crit.artnr.incl.length;
													for (var j=0; j<maxj; j++){
														if (input.dom.other.compl.data[i].artnr.indexOf(crit.artnr.incl[j]) > -1)
															incl = true;
													}
												} else incl = true;
												if (incl){
													output.dom.other.compl.elems.push(input.dom.other.compl.elems[i]);
													output.dom.other.compl.data.push(input.dom.other.compl.data[i]);
												}
											}
										}
										maxi = input.dom.other.more.data.length;
										for (var i=0; i<maxi; i++){
											var excl = false;
											maxj = crit.artnr.excl.length;
											for (var j=0; j<maxj; j++){
												if (input.dom.other.more.data[i].artnr.indexOf(crit.artnr.excl[j]) > -1){
													excl = true;
												}
											}
											if (!excl){
												var incl = false;
												if (crit.artnr.incl.length > 0){
													maxj = crit.artnr.incl.length;
													for (var j=0; j<maxj; j++){
														if (input.dom.other.more.data[i].artnr.indexOf(crit.artnr.incl[j]) > -1)
															incl = true;
													}
												} else incl = true;
												if (incl){
													output.dom.other.more.elems.push(input.dom.other.more.elems[i]);
													output.dom.other.more.data.push(input.dom.other.more.data[i]);
												}
											}
										}
									}
									if (crit.artnr.incl.length == 0){
										var input = this.filteredinput(output);
										var output = this.newoutput(input);
										if (crit.name.incl.length > 0 || crit.name.excl.length > 0){
											output = this.filterName(crit, input, output, "main");
											if (c.varExist(output.dom.other)){
												output = this.filterName(crit, input, output, "other.compl");
												output = this.filterName(crit, input, output, "other.more");
											}
										} else if (crit.desc.incl.length > 0 || crit.desc.excl.length > 0){
											output = this.filterDesc(crit, input, output, "main");
											if (c.varExist(output.dom.other)){
												output = this.filterDesc(crit, input, output, "other.compl");
												output = this.filterDesc(crit, input, output, "other.more");
											}
										}
									}
								} else if (crit.name.incl.length > 0 || crit.name.excl.length > 0){
									output = this.filterName(crit, input, output, "main");
									if (c.varExist(output.dom.other)){
										output = this.filterName(crit, input, output, "other.compl");
										output = this.filterName(crit, input, output, "other.more");
									}
								} else if (crit.desc.incl.length > 0 || crit.desc.excl.length > 0){
									output = this.filterDesc(crit, input, output, "main");
									if (c.varExist(output.dom.other)){
										output = this.filterDesc(crit, input, output, "other.compl");
										output = this.filterDesc(crit, input, output, "other.more");
									}
								}
							}
							if (c.isFunction(callback)) callback(output, context);
							else return output;

						},
						filterName: function(crit, input, output, objstr){
							var c = Extension.Common;
							var maxi, maxj, maxk;
							if (!c.isArray(objstr)) objstr = objstr.split(".");
							var current_input = input.dom;
							var current_output = output.dom;
							for (var i=0; i<objstr.length; i++){
								current_input = current_input[objstr[i]];
								current_output = current_output[objstr[i]];
							}
							maxi = current_input.data.length;
							for (var i=0; i<maxi; i++){

								var excl = false;
								maxj = crit.name.excl.length;
								for (var j=0; j<maxj; j++){
									if (current_input.data[i].name.toLowerCase().indexOf(crit.name.excl[j].toLowerCase()) > -1) {
										excl = true;
									}
								}
								if (!excl){
									var incl = false;
									if (crit.name.incl.length > 0){
										maxj = crit.name.incl.length;
										for (var j=0; j<maxj; j++){
											if (current_input.data[i].name.toLowerCase().indexOf(crit.name.incl[j].toLowerCase()) > -1) {
												incl = true;
											}
										}
									} else incl = true;
									if (incl){
										current_output.elems.push(current_input.elems[i]);
										current_output.data.push(current_input.data[i]);
									}
								}
							}
							if (crit.desc.incl.length > 0 || crit.desc.excl.length > 0){
								var input = this.filteredinput(output);
								var output = this.newoutput(input);

								output = this.filterDesc(crit, input, output, "main");
								if (c.varExist(output.dom.other)){
									output = this.filterDesc(crit, input, output, "other.compl");
									output = this.filterDesc(crit, input, output, "other.more");
								}
							}

							return output;
						},
						filterDesc: function(crit, input, output, objstr){
							var c = Extension.Common;
							var maxi, maxj, maxk;
							if (!c.isArray(objstr)) objstr = objstr.split(".");
							var current_input = input.dom;
							var current_output = output.dom;
							for (var i=0; i<objstr.length; i++){
								current_input = current_input[objstr[i]];
								current_output = current_output[objstr[i]];
							}
							maxi = current_input.data.length;
							for (var i=0; i<maxi; i++){
								var excl = false;

								maxj = crit.desc.excl.length;
								for (var j=0; j<maxj; j++){
									if (current_input.data[i].desc.toLowerCase().indexOf(crit.desc.excl[j].toLowerCase()) > -1) {
										excl = true;
									}
								}
								if (!excl){
									var incl = false;
									if (crit.desc.incl.length > 0){
										maxj = crit.desc.incl.length;
										for (var j=0; j<maxj; j++){
											if (current_input.data[i].desc.toLowerCase().indexOf(crit.desc.incl[j].toLowerCase()) > -1) {
												incl = true;
											}
										}
									} else incl = true;
									if (incl){
										current_output.elems.push(current_input.elems[i]);
										current_output.data.push(current_input.data[i]);
									}
								}
							}
							return output;
						},
						newoutput: function(input){
							var c = Extension.Common;
							var output = {};
							output.pagetype = input.pagetype;
							output.hascrit = input.hascrit;
							output.dom = {};
							output.dom.main = {};
							output.dom.main.elems = [];
							output.dom.main.data = [];
							output.dom.main.loc = input.dom.main.loc;
							if (c.varExist(input.dom.other)){
								output.dom.other = {};
								output.dom.other.compl = {};
								output.dom.other.compl.elems = [];
								output.dom.other.compl.data = [];
								output.dom.other.compl.loc = input.dom.other.compl.loc;
								output.dom.other.more = {};
								output.dom.other.more.elems = [];
								output.dom.other.more.data = [];
								output.dom.other.more.loc = input.dom.other.more.loc;
							}
							return output;
						},
						filteredinput: function(input){
							var newinput = input;
							return newinput;
						}
					},
					//Targeting
					Page: {
						loaded: function(callback, context) {
							var c = Extension.Common;
							if (!c.varExist(Extension.PageReadyList))
								Extension.PageReadyList = [];
							if (!c.varExist(Extension.PageReadyFired))
								Extension.PageReadyFired = false;
							if (!c.varExist(Extension.PageReadyEventHandlersInstalled))
								Extension.PageReadyEventHandlersInstalled = false;

							if (typeof callback !== "function") {
								throw new TypeError("callback for Page.loaded(fn) must be a function");
							}

							if (Extension.PageReadyFired) {
								setTimeout(function() {
									callback(context);
								}, 1);
								return;
							} else {
								Extension.PageReadyList.push({
									fn: callback,
									context: context
								});
							}
							if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
								setTimeout(this.waitingRoom, 1);
							} else if (!Extension.PageReadyEventHandlersInstalled) {
								if (document.addEventListener) {
									document.addEventListener("DOMContentLoaded", this.waitingRoom, false);
									window.addEventListener("load", this.waitingRoom, false);
								} else {
									document.attachEvent("onreadystatechange", this.readyStateChange);
									window.attachEvent("onload", this.waitingRoom);
								}
								Extension.PageReadyEventHandlersInstalled = true;
							}
						},
						readyStateChange: function() {
							if (document.readyState === "complete") {
								this.waitingRoom();
							}
						},
						waitingRoom: function() {
							if (!Extension.PageReadyFired) {
								Extension.PageReadyFired = true;
								for (var i = 0; i < Extension.PageReadyList.length; i++) {
									Extension.PageReadyList[i].fn.call(window, Extension.PageReadyList[i].context);
								}
								Extension.PageReadyList = [];
							}
						},
						check: function(data) {
							var c = Extension.Common;
							if (c.varExist(data.url, true)) {}

						},

					},
					//Page

					Time: {
						get: function(callback, context) {
							this.checkDateType();
							var c = Extension.Common;
							if (!c.varExist(Extension.TimeNow))
								Extension.TimeNow = new Date().toISOString();
							if (!c.varExist(Extension.TimeSet))
								Extension.TimeSet = false;
							if (!c.varExist(Extension.TimeQueryStarted))
								Extension.TimeQueryStarted = false;
							if (!c.varExist(Extension.TimeRequestList))
								Extension.TimeRequestList = [];

							if (Extension.TimeSet) {
								if (c.isFunction(callback))
									callback(Extension.TimeNow, context);
								else
									return Extension.TimeNow;
							} else {
								if (c.isFunction(callback))
									Extension.TimeRequestList.push({
										fn: callback,
										context: context
									});
								if (!Extension.TimeQueryStarted) {
									Extension.TimeQueryStarted = true;
									this.getServerTime(function() {
										Extension.Time.waitingRoom();
									});
								}
							}
						},
						checkDateType: function() {
							if (!Date.prototype.toISOString) {
								//(function() {
								var pad = function(number) {
									if (number < 10) {
										return '0' + number;
									}
									return number;
								}
								Date.prototype.toISOString = function() {
									return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
								}
								;
								//}());
							}
						},
						getServerTime: function(callback, context) {
							var c = Extension.Common;
							if (!Extension.TimeSet) {
								//Set local time as default
								Extension.TimeNow = new Date().toISOString();

								//Check for time in meta, it is quickest.
								//var meta = c.getMetaContent('property', 'og:time');
								var time = document.getElementById("time");
								if (c.varExist(time)) {
									Extension.TimeNow = new Date(parseInt(time.innerText) * 1e3).toISOString();
									Extension.TimeSet = true;
									if (typeof callback == "function")
										callback(context);
								} else if (c.getCookie("ext_diff")) {
									//Check for time difference cookie, use that as it is quicker.
									//Refresh diff for next load
									var response = new Extension.Common.xhr();
									response.onreadystatechange = function() {
										if (response.readyState == 4) {
											if (response.status == 200) {
												var headerDate = new Date(response.getResponseHeader('Date'));
												var Local = new Date(Extension.TimeNow);
												var Server = new Date(headerDate.toISOString());
												var timeDiff = Server.getTime() - Local.getTime();
												Extension.Common.setCookie("ext_diff", timeDiff);
											}
										}
									}
									;
									response.open("HEAD", "/", true);
									response.send();

									//Set servertime from local and diff
									var diff = c.getCookie("ext_diff");
									var Local = new Date(Extension.TimeNow);
									Extension.TimeNow = new Date(Local.getTime() + c.toInt(diff)).toISOString();
									Extension.TimeSet = true;
									if (typeof callback == "function")
										callback(context);
								} else {
									//Get servertime from head async
									var response = new Extension.Common.xhr();
									response.context = context;
									response.onreadystatechange = function() {
										if (response.readyState == 4) {
											if (response.status == 200) {
												var headerDate = new Date(response.getResponseHeader('Date'));
												var Local = new Date(Extension.TimeNow);
												Extension.TimeNow = headerDate.toISOString();

												var Server = new Date(Extension.TimeNow);
												var timeDiff = Server.getTime() - Local.getTime();
												Extension.Common.setCookie("ext_diff", timeDiff);
											}
											Extension.TimeSet = true;
											if (typeof callback == "function")
												callback(context);
										}
									}
									;
									response.open("HEAD", "/", true);
									response.send();
								}
							} else {
								if (typeof callback == "function") callback(context);
							}
						},
						dateValidation: function(from, to) {
							try {
								var From = new Date(from)
								  , To = new Date(to)
								  , Server = new Date(this.get());
								if (Server.getTime() > From.getTime() && Server.getTime() < To.getTime())
									return true;
								else
									return false;

							} catch (err) {
								return false;
							}
						},
						dateValidationTimes: function(times){
							try {
								var found = false;
								for (var i = 0; i < times.length; i++) {
									if (this.dateValidation(times[i].date_from, times[i].date_to))
										found = true;
								}
								return found;
							} catch (err) {
								return false;
							}
						},
						waitingRoom: function() {
							for (var i = 0; i < Extension.TimeRequestList.length; i++) {
								Extension.TimeRequestList[i].fn.call(window, Extension.TimeNow, Extension.TimeRequestList[i].context);
							}
							Extension.TimeRequestList = [];
						}
					},
					//Time
					Template: {
						options: {
							loader: "<div class=\"ext-spinner\"> <div class=\"ext-bounce1\"></div> <div class=\"ext-bounce2\"></div> <div class=\"ext-bounce3\"></div></div>",
							addtocartloader: "<div class=\"ext-spinner addToCartLoad\"> <div class=\"ext-bounce1\"></div> <div class=\"ext-bounce2\"></div> <div class=\"ext-bounce3\"></div></div>",
							freightcalcloader: "<div class=\"ext-spinner ext-freightcalc-loader ext-pup-viscon\"> <div class=\"ext-bounce1\"></div> <div class=\"ext-bounce2\"></div> <div class=\"ext-bounce3\"></div></div>"
						},
						load: function(input) {
							var c = Extension.Common;
							if (c.varExist(input.htmlcontent)) {
								try {
									var html = ""
									  , options = {};
									input.htmlcontent = c.toArray(input.htmlcontent);
									for (var i=0; i<input.htmlcontent.length; i++){
										html += input.htmlcontent[i];
									}
									input.htmlcontent = html;
									if (c.varExist(input.htmloptions))
										options = input.htmloptions;

									options = Extension.Merge.merge(options, this.options);
									if (c.varExist(input.texttemplates))
										options = Extension.Merge.merge(options, input.texttemplates);
									this.alloptions = options;

									var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
									var add = function(line, js) {
										js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') : (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
										return add;
									}
									while (match = re.exec(html)) {
										add(html.slice(cursor, match.index))(match[1], true);
										cursor = match.index + match[0].length;
									}
									add(html.substr(cursor, html.length - cursor));
									code += 'return r.join("");';
									input.htmlcontent = new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
									if (!c.varExist(input.cyclecount))
										input.cyclecount = 20;
									var m = input.htmlcontent.match(/<%.+%>/g);
									if (m){
										if (m.length > 0 && input.cyclecount > 0) {
											input.cyclecount--;
											return this.load(input);
										} else return input.htmlcontent;
									} else return input.htmlcontent;
								} catch (err) {
									return input.htmlcontent;
								}
							}

						}
					},
					Translation: {
						data: {},
						get: function(prop){
							return this.data[prop];
						}
					},
					Queue: {
						loaded: [],
						load: function(input){
							var all_loaded = 0, obj_length = input.objects.length;
							for (var i=0; i<obj_length; i++){
								if (this.loaded.indexOf(input.objects[i].name) == -1){
									this.loaded.push(input.objects[i].name);
									window.Extension[input.objects[i].name] = input.objects[i].fn;
								} else all_loaded ++;
							}
							if (all_loaded !== obj_length)
								this.dependencies(input)
						},
						dependencies: function(input){
							var allok = true;
							for (var i=0; i<input.dependencies.length; i++){
								if (!window.Extension[input.dependencies[i]])
									allok = false;
							}
							if (allok)
								input.bootup();
							else {
								input.timeout = input.timeout-25 || 5000;
								if (input.timeout>0){
									setTimeout(function(){
										Extension.Queue.dependencies(input);
									}, 25);
								}
							}
						},
						dump: function(queue){
							queue = queue || "ExtensionQueue";
							while (window[queue].length > 0){
								var input = window[queue][0];
								this.load(input);
								window[queue].splice(0,1);
							}
						}

					}
				};
				Extension.Merge.merge(Extension, ExtensionTemp);



				/*  EXAMPLE
				var template =
					'My <%this.skill%>:<%if(this.showSkills) {%>' +
						'<%for(var index in this.skills) {%>' +
						'<a href="#"><%this.skills[index]%></a>' +
						'<%}%>' +
					'<%} else {%>' +
						'<p>none</p>' +
					'<%}%>';
					console.log(Extension.Template.load({htmlcontent: template, htmloptions: {skill: "test"}}));
				*/


				/*


				 |   _   _.  _| o ._   _
				 |_ (_) (_| (_| | | | (_|
									   _|

				*/

				//Override preview for testing
				//Extension.Version.forcePreview = true;
				//*********************************

				var Initiate = (function() {

					//Check for and set device cookie
					Extension.Common.setDeviceCookie();

					//Check for and set Maxymiser Override cookie
					Extension.Common.checkMaxymiserOverrideCookie();

					//Load queued functions
					if (Extension.Version.previewfiles){
						if (window.ExtensionSnippetOverride)
							ExtensionQueue = [];
						else
							Extension.Queue.dump("ExtensionQueuePreview");
					} else
						Extension.Queue.dump();
					
					//Preload datasources
					if (Extension.Version.forcePreview || Extension.Version.preview){
						var datasources = ExtensionSetting.DataSources.preview;
					} else {
						var datasources = ExtensionSetting.DataSources.prod;
					}
					Extension.DataSource.JSON.load(datasources, function(data) {
						for (var d in data.datasources){
							Extension.Source.load(d, Extension.Version.forcePreview || Extension.Version.preview, function(data) {});
						}
					});


				})();

				if (Extension.Common.isFunction(callback))
					callback();

			});
		}


		//function that clears all css added by scripts in iPlugins, then loads files from test server
		var Reload = function(){
			var scripturl, styleurl;
			for (var i=0; i<ExtensionSetting.PreviewFiles.folders.length; i++){
				var linkelem = document.getElementsByTagName("link");
				var max = linkelem.length;
				for (var j=max-1; j>=0; j--){
					if (Extension.Common.varExist(linkelem[j].href)){
						if (linkelem[j].href.indexOf(ExtensionSetting.PreviewFiles.removestyles) > -1 && linkelem[j].href.indexOf("/" + ExtensionSetting.PreviewFiles.folders[i].folder + "/") > -1)
							linkelem[j].parentNode.removeChild(linkelem[j])
					}
				}
				if (ExtensionSetting.PreviewFiles.folders[i].js){
					scripturl = ExtensionSetting.PreviewFiles.mainfolder + "/" + ExtensionSetting.PreviewFiles.folders[i].folder + "/" + ExtensionSetting.PreviewFiles.folders[i].filename + ".js";
					Extension.IncludeScript.load({
						scriptUrl: scripturl,
						scriptId: "ext-preview-script-" + ExtensionSetting.PreviewFiles.folders[i].folder,
						attributes: [
							{name: "preview", value: "true"}
						]} );
					console.log("Extension Preview script: " + ExtensionSetting.PreviewFiles.folders[i].folder);
				}
				if (ExtensionSetting.PreviewFiles.folders[i].css){
					styleurl = ExtensionSetting.PreviewFiles.mainfolder + "/" + ExtensionSetting.PreviewFiles.folders[i].folder + "/" + ExtensionSetting.PreviewFiles.folders[i].filename + ".css";
					Extension.IncludeScript.load(styleurl);
					console.log("Extension Preview style: " + ExtensionSetting.PreviewFiles.folders[i].folder);
				}
			}
		}

		//First time load of Extension and initial functions defined
        if (typeof Extension == 'undefined') {

            Extension = {

                Version: {
                    store: [],
                    save: function(key, value) {
                        var c = this;
                        if (!c.varExist(c.store[key], true))
                            c.store[key] = value;
                    },
                    load: function(cn, on_off, callback, context) {
                        var c = this
                          , value = "";

                        if (typeof ExtensionVersionOverride !== 'undefined') {
                            c.save("versionoverride", ExtensionVersionOverride);
                            if (c.varExist(context))
                                context.preview = false;
                            else {
                                var context = {};
                                context.preview = false;
                            }
                            if (ExtensionVersionOverride == "preview")
                                context.preview = true;
                            if (typeof callback == "function")
                                callback(context);
                        } else {
                            if (c.checkurl({masks: ["*" + cn + "=on*"], includeparams: true}))
                                value = 'on';
                            if (c.checkurl({masks: ["*" + cn + "=off*"], includeparams: true}))
                                value = 'off';
                            if (c.checkurl({masks: ["*" + cn + "=preview*"], includeparams: true}))
                                value = 'preview';
                            if (c.checkurl({masks: ["*" + cn + "=clear*"], includeparams: true}))
                                c.clearCookie(cn);
                            if (value !== "") {
                                c.setCookie(cn, value);
                                c.save(cn, value);
                            }

                            if (c.varExist(context))
                                context.preview = false;
                            else {
                                var context = {};
                                context.preview = false;
                            }
                            if (c.getCookie(cn) == "preview")
                                context.preview = true;
                            if (c.getCookie(cn) == "on" || c.getCookie(cn) == "preview")
                                on_off = true;
                            else if (c.getCookie(cn) == "off")
                                on_off = false;
                            if (on_off) {
                                if (typeof callback == "function")
                                    callback(context);
                            }
                        }
                    },
                    checkurl: function(input, returnindex) {
                        if (!this.isObject(input)) input = {masks: input, returnindex: returnindex};

                        var bool = true;
                        if (this.varExist(returnindex))
                            if (returnindex)
                                bool = false;
                        var masks = []
                          , found = false;
                        if (this.isArray(input.masks))
                            masks = input.masks;
                        else
                            masks.push(input.masks);

                        var initialurl = document.URL.split("?")[0];
                        if (this.varExist(input.includeparams)) if (input.includeparams) initialurl = document.URL;

                        for (var n = 0; n < masks.length; n++) {
                            var url = {
                                doc: initialurl.toLowerCase(),
                                mask: masks[n].toLowerCase()
                            }
                            var parts = url.mask.split("*");
                            url.doctemp = url.doc.replace("/?", "?").replace("/#", "#");
                            if (url.doctemp.slice(url.doctemp.length - 1, url.doctemp.length) == "/")
                                url.doctemp = url.doctemp.slice(0, url.doctemp.length - 1);
                            for (var i = 0; i < parts.length; i++) {
								//var nor = parts[i].split("!");
								
								//var either = nor[0].split("|");
								var either = parts[i].split("|");
                                for (var j = 0; j < either.length; j++) {
                                    either[j] = either[j].replace("/?", "?").replace("/#", "#");
                                    if (either[j].slice(either[j].length - 1, either[j].length) == "/")
                                        either[j] = either[j].slice(0, either[j].length - 1);

                                    var loc = url.doctemp.indexOf(either[j]);
                                    if (loc > -1) {
                                        parts[i] = either[j];
                                        break;
                                    }
								}
								/*
								if (nor.length > 1){
									var either = nor[1].split("|");
									for (var j = 0; j < either.length; j++) {
										either[j] = either[j].replace("/?", "?").replace("/#", "#");
										if (either[j].slice(either[j].length - 1, either[j].length) == "/")
											either[j] = either[j].slice(0, either[j].length - 1);

										var loc = url.doctemp.indexOf(either[j]);
										if (loc == -1) {
											parts[i] = "";
											break;
										}
									}
								}
								*/
                                if (loc > -1) {
                                    if (i == parts.length - 1 || (i == parts.length - 2 && parts[parts.length - 1].length == 0)) {
                                        if (parts[i].length == 0 || parts[parts.length - 1].length == 0) {
                                            if (bool)
                                                return true;
                                            else
                                                return n;
                                        } else {
                                            if (parts[i].match(/[?|#]/g)) {
                                                if (parts[i] == url.doctemp) {
                                                    if (bool)
                                                        return true;
                                                    else
                                                        return n;
                                                }
                                                break;
                                            } else {
                                                url.doctempnoparam = /.+?[?|#]|.+/.exec(url.doctemp);
                                                url.docref = url.doctempnoparam[0].slice(loc, url.doctempnoparam[0].length).replace(/[?|#]/g, "");
                                                if (parts[i] == url.docref) {
                                                    if (bool)
                                                        return true;
                                                    else
                                                        return n;
                                                }
                                                break;
                                            }
                                        }

                                    }
                                    url.doctemp = url.doctemp.slice(loc + parts[i].length, url.doctemp.length);
                                } else
                                    break;

                            }
                        }
                        if (bool)
                            return false;
                        else
                            return -1;
                    },
                    setCookie: function(cn, value, days) {
                        var expires = '';
                        if (days) {
                            var date = new Date();
                            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                            expires = '; expires=' + date.toGMTString();
                        }
                        document.cookie = cn + '=' + value + expires + ';domain=.' + this.removeSubDomain(window.location.hostname) + ';path=/';
                    },
                    clearCookie: function(cn) {
                        document.cookie = cn + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT' + ';domain=.' + this.removeSubDomain(window.location.hostname) + ';path=/';
                    },
                    getCookie: function(cn) {
						var match = document.cookie.match(new RegExp('(^|; )' + cn + '=([^;]+)'));
						if (match){
							if (match.length >= 2)
								return match[2];
						}
					},
                    removeSubDomain: function(hostn) {
                        var is_co = hostn.match(/\.co\./);
                        hostn = hostn.split('.');
                        hostn = hostn.slice(is_co ? -3 : -2);
                        hostn = hostn.join('.');
                        return hostn;
                    },
                    varExist: function(variable, notEmpty) {
                        if (typeof variable == 'undefined')
                            return false;
                        if (variable === 'undefined')
                            return false;
                        if (variable === null)
                            return false;
                        if (typeof notEmpty !== 'undefined')
                            if (notEmpty)
                                if (variable == "")
                                    return false;
                        return true;
                    },
                    isInt: function(value) {
                        if (isNaN(value)) {
                            return false;
                        }
                        var x = parseFloat(value);
                        return (x | 0) === x;
                    },
                    isArray: function(obj) {
                        return Object.prototype.toString.call(obj) === "[object Array]";
                    },
                    isObject: function(obj) {
                        return Object.prototype.toString.call(obj) === "[object Object]";
                    },
                    isFunction: function(obj) {
                        return Object.prototype.toString.call(obj) == "[object Function]";
                    },
                    checkMobile: function() {
                        return this.checkurl("*m2.ikea.|m2.ppe.*");
                    },

                },
                //Version
                IncludeScript: {
                    load: function(data, callback, context) {
                        var c = Extension.Version;
                        var validpage = true;
                        if (c.varExist(data.urlMask))
                            validpage = c.checkurl(data.urlMask);
                        if (validpage) {
                            if (!c.varExist(Extension.ScriptLib))
                                Extension.ScriptLib = [];
                            if (!c.varExist(data.scriptUrl) && !c.varExist(data.styleUrl)) {
                                try {
                                    if (data.slice(data.length - 3, data.length).toLowerCase() == ".js")
                                        var data = {
                                            "scriptUrl": data
                                        };
                                    else if (data.slice(data.length - 4, data.length).toLowerCase() == ".css")
                                        var data = {
                                            "styleUrl": data
                                        };
                                } catch (err) {
                                    console.log("IncludeScript: Check string: " + err)
                                }
                            }
                            if (!c.varExist(data.syncLoad))
                                data.syncLoad = false;

                            if (c.varExist(data.styleUrl, true)) {
                                if (this.updateLib(data, 0)) {
                                    this.loadStyle(data, callback, context)
                                } else {
                                    this.waitingRoom(data, function() {
                                        if (typeof callback == "function")
                                            callback(context);
                                    });
                                }
                            } else if (c.varExist(data.scriptUrl, true)) {
                                if (this.updateLib(data, 0)) {
                                    this.loadScript(data, callback, context)
                                } else {
                                    this.waitingRoom(data, function() {
                                        if (typeof callback == "function")
                                            callback(context);
                                    });
                                }
                            }
                        }
                    },
                    loadScript: function(data, callback, context) {
                        var c = Extension.Version;
                        var js = document.createElement("script");
                        if (c.varExist(data.scriptId, true))
                            js.id = data.scriptId;
                        if (c.varExist(data.attributes)){
                        	for (var i=0; i<data.attributes.length; i++){
                        		js.setAttribute("data-" + data.attributes[i].name, data.attributes[i].value);
                        	}
                        }
                        js.type = "text/javascript";
                        js.data = data;
                        js.onload = function() {
                            Extension.IncludeScript.updateLib(this.data, 1);
                            if (typeof callback == "function")
                                callback(context);
                        }
                        ;
                        js.src = data.scriptUrl;
                        /*
                        if (data.syncLoad){
                            Extension.Page.loaded(function(){});
                            if (!Extension.PageReadyFired){
                                document.write('<script type="text/javascript" src="' + data.scriptUrl + '"></script>');
                            }
                        } else
                        */
                        //document.getElementsByTagName("head")[0].appendChild(js);
                        document.head.appendChild(js);
                    },
                    loadStyle: function(data, callback, context) {
                        var c = Extension.Version;
                        var css = document.createElement("link");
                        if (c.varExist(data.styleId, true))
                            css.id = data.styleId;
                        css.rel = "stylesheet";
                        css.type = "text/css";
                        css.href = data.styleUrl;
                        document.head.appendChild(css);

                        if (c.varExist(data.scriptUrl, true)) {
                            this.loadScript(data, callback, context);
                        } else {
                            Extension.IncludeScript.updateLib(data, 1);
                            if (typeof callback == "function")
                                callback(context);
                        }
                    },
                    updateLib: function(data, val) {
                        var i = this.checkLib(data);
                        if (i > -1) {
                            if (Extension.ScriptLib[i].loaded == 0) {
                                Extension.ScriptLib[i].loaded = val;
                            }
                            return false;
                        } else {
                            Extension.ScriptLib.push({
                                data: data,
                                "loaded": 0
                            });
                            return true;
                        }
                    },
                    checkLib: function(data) {
                        var c = Extension.Version;
                        try {
                            for (var i = 0; i < Extension.ScriptLib.length; i++) {
                                if (c.varExist(data.scriptUrl, true) && c.varExist(data.styleUrl, true))
                                    if (c.varExist(Extension.ScriptLib[i].data.scriptUrl, true) && c.varExist(Extension.ScriptLib[i].data.styleUrl, true))
                                        if (data.scriptUrl.toLowerCase().indexOf(Extension.ScriptLib[i].data.scriptUrl.toLowerCase()) > -1 && data.styleUrl.toLowerCase().indexOf(Extension.ScriptLib[i].data.styleUrl.toLowerCase()) > -1)
                                            return i;
                                if (c.varExist(data.scriptUrl, true))
                                    if (c.varExist(Extension.ScriptLib[i].data.scriptUrl, true))
                                        if (data.scriptUrl.toLowerCase().indexOf(Extension.ScriptLib[i].data.scriptUrl.toLowerCase()) > -1)
                                            return i;
                                if (c.varExist(data.styleUrl, true))
                                    if (c.varExist(Extension.ScriptLib[i].data.styleUrl, true))
                                        if (data.styleUrl.toLowerCase().indexOf(Extension.ScriptLib[i].data.styleUrl.toLowerCase()) > -1)
                                            return i;
                            }
                        } catch (e) {
                            console && console.log("Extension.scriptLib");
                        }
                        return -1;
                    },
                    waitingRoom: function(data, callback, context) {
                        var timeout = 400;
                        var queue = setInterval(function() {
                            if (Extension.ScriptLib[Extension.IncludeScript.checkLib(data)].loaded == 1) {
                                window.clearInterval(queue);
                                if (typeof callback == "function")
                                    callback(context);
                            }
                            timeout--;
                            if (timeout < 0)
                                window.clearInterval(queue);
                        }, 25)
                    }
                },
                //IncludeScript
                Merge: {
					merge: function(destination, source) {
						for (var property in source)
							destination[property] = source[property];
						return destination;
					},
					deepmerge: function(dest, src, exclude_array, concat_array) {
						var c = Extension.Common;
						for (var key in src){
							/*
							var do_merge = true;
							if (c.isArray(exclude_array)){
								if (exclude_array.indexOf(key) > -1){
									do_merge = false;
								}
							}
							if (do_merge){
							*/
								if (dest[key]){
									if (c.isArray(dest[key]) && c.isArray(src[key])){
										for (var i=0; i<src[key].length; i++){
											if (dest[key][i]){
												if (concat_array) 
													dest[key].concat(src[key]);
												else 
													dest[key][i] = this.deepmerge(dest[key][i], src[key][i], exclude_array, concat_array);
											} else
												dest[key][i] = src[key][i];
										}
									} else if (c.isArray(dest[key])){
										dest[key].push(src[key]);
									} else if (c.isArray(src[key])){
										dest[key] = c.toArray(dest[key]);
										dest[key].concat(src[key]);
									} else if (c.isObject(src[key])){
										dest[key] = this.deepmerge(dest[key], src[key], exclude_array, concat_array);
									} else {
										dest[key] = src[key];	
									}
								} else	
									dest[key] = src[key];
							//}
						}
						return dest;
					}

                }//Merge
            }
            //Extension

			if (window.ExtensionSnippetOverride){
				Extension.Version.previewfiles = true;
				LoadExtension(function(){
					Reload();
				});
			} else {
				Extension.Version.load('extload', true, function(e) {
					if (e.preview) {
						Extension.Version.previewfiles = true;
						Extension.IncludeScript.load(ExtensionSetting.PreviewFiles.scriptUrl);
					} else {
						LoadExtension();
					}
				});
			}


        } else if(Extension.Version.previewfiles){
			LoadExtension(function(){
				Reload();
			});
        }
    } catch (err) {console.log("Extension: General Error: " + err.stack)}
}
)();