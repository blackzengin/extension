/*

  _                     _          
 |_ ._ _  o  _  |_ _|_ /   _. |  _ 
 |  | (/_ | (_| | | |_ \_ (_| | (_ 
             _|                    

*/

(function(){

	var Settings = {
		country: "no",
		calculatebutton: false,							/* show a calculation button or auto calculate when field input is correct */ 	
		zipcodedigits: 4,								/* how many digit is the zipcode */ 	
		forcezipcodeentry: false,	 					/* continue to checkout button disabled until zipcode is entered and calculated */ 	
		deliveryrestrictions: true,  					/* turns on and off check of delivery restrictions */  
		clickcollect: true,			 					/* turns on and off click & collect */  
		pickuppoints: true, 		 					/* turns on and off pickuppoints */  
		parcelcheck: false,			 					/* only relevant if pickuppoints are on - DOES NOT WORK PERFECTLY */ 
		parcelcheckzipcode: 1396,    					/* only relevant if pickuppoints are on - DOES NOT WORK PERFECTLY */                         	
		parcelcheckwords: ["pakkeboks", "postkontor", "Parcel", "Paketlieferung"],  /* word that exist in the text key response from IRW when getting freight calculaiton, used to determine parcel or not */  
		expressontop: false,
		expressdefault: false,
		klarna:{
			country: "no",
			submitUrl: 'https://ww8.ikea.com/checkout/pages/payment-no.php',
			submitUrlIRW: 'https://ww8.ikea.com/checkout/pages/paymentirw-no.php',
			//submitUrl: 'https://www.prougno.com/ikea/klarna/payment-no.php',
			//submitUrlIRW: 'https://www.prougno.com/ikea/klarna/paymentirw-no.php',
			defaults: {
				m2: {
					hs: false,
					ex: false,
					pp: false,
					cc: false
				},
				irw: {
					hs: false,
					ex: false,
					pp: false,
					cc: false
				}
			},
			switches:{}
		}
	}



	/*

	 ___  _   _  __
	  |  |_) |_ (_
	 _|_ |_) |_ __)


	*/

	var IBES = {
		cnc_configuration_url: "",
		exclude_prefix: "DO_NOT_USE_",

		// counts the list of collections points excluding "DO_NOT_USE_" prefix
		getFetchLocationsLength: function(fetchLocations){
			var count = Object.keys(fetchLocations).length;
			if(count > 0){
				var storeName;
				for (var prop in this.fetchLocations) {
					storeName = (this.isClosingTimeWindow) ? this.fetchLocations[prop].name : this.fetchLocations[prop];
					if(this.exclude_prefix != "" && storeName.indexOf(this.exclude_prefix) == 0) {
						count--;
					}
				}
			}
			return count;
		},

		// Fetches the list of collection points from the microsite
		getFetchLocations: function (input) {
			var version = (this.isClosingTimeWindow) ? '?version=2' : '';
			if (!window.cnc_configuration){
				Extension.IncludeScript.load(Extension.IBES.cnc_configuration_url, function(){
					Extension.IBES.getFetchLocations(input);
				});
			} else {

				var url = cnc_configuration.CFG_LIVE_PAYLOAD_URL + 'listfetchlocations' + version;

				if (Extension.Common.isFunction(input.loading))
					input.loading();
				var response = new Extension.Common.xhr();
				var DONE = 4;
				var OK = 200;
				response.overrideMimeType("application/x-www-form-urlencoded");
				response.open("get", url, true);
				response.onreadystatechange = function() {
					if (response.readyState === DONE) {
						try{
							if (response.status === OK) {
								response.responseJSON = JSON.parse(response.responseText);
								if(response.responseJSON){
									if (Extension.Common.isFunction(input.success))
										input.success(response);
								} else {
									if (Extension.Common.isFunction(input.failure))
										input.failure(response);
								}
							} else {
								if (Extension.Common.isFunction(input.failure))
									input.failure(response);
							}
						} catch (err) {
							if (Extension.Common.isFunction(input.exception))
								input.exception(err);
						}

						if (Extension.Common.isFunction(input.complete))
							input.complete(response);
					}
				}
				response.send(null);
			}

		},

		getPositionCCBtn: function(el) {
			var rect = el.getBoundingClientRect(),
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
				scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
		},

		//Current loaded page has to be the shoppingcart page
		fetchCart: function(){
			var form = document.querySelector('form#updateAllForm');
			var totalRow = form.querySelector('input#totalRow').getAttribute("value");
			var cart = {};
				cart.orderId = form.querySelector('input[name="orderId"]').getAttribute("value");
				cart.items = [];

			for (var i = 1; i <= totalRow; i++) {
				cart.items.push({
				  'count': form.querySelector('#order_qty_' + i).getAttribute("value"),
				  'articleNo': form.querySelector('#prodId_' + i).getAttribute("value")
				});
			}

			return cart;
		},

		//generates the payload for sending to Click&Collect. Iterates through all items on shoppinglist, counts and returns them with store-id & shoppinglist-id
		getPayload: function (input) {
			var input = input || {};
			input.system = input.system || "M2";
			input.service = input.service || "fetchlocation";
			input.selector = input.selector || "";
			input.selectorIRW = input.selectorIRW || "";
			input.selectorM2 = input.selectorM2 || "";

			var cart = this.fetchCart();
			var servicevalue = "";
			var device = "desktop";
			if (Extension.Common.checkurl({masks: "*/PromotionCodeManage?*", includeparams: true}) || Extension.Common.checkurl(["*/M2OrderItemDisplay", "*/OrderItemDisplayMobile", "*/mcommerce/shoppingcart"]))
				device = "mobile";

			var selector = "";
			if (device == "desktop"){
				selector = "select.storesList";
				if (Extension.Common.varExist(input.selectorIRW, true))
					selector = input.selectorIRW;

			} else {
				selector = "select.ccStoresList";
				if (Extension.Common.varExist(input.selectorM2, true))
					selector = input.selectorM2;
			}
			if (Extension.Common.varExist(input.selector, true))
				selector = input.selector;
			var elem = document.querySelectorAll(selector);
			for (var i=0; i<elem.length; i++){
				if (elem[i].value != "")
					servicevalue = elem[i].value;
			}
			return {
				selectedService: input.service,
				selectedServiceValue: servicevalue,
				slId: cart.orderId,
				articles: cart.items,
				locale: irwstats_locale,
				customerView: device,
				vis_id: utag.data["ut.visitor_id"],
				system: input.system
			};
		},

		//gerates the hash from payload with cryptojs and given password from Click&Collect and returns. Click&Collect needs the hash for checking the transported payload.
		getHashFromPayload: function (payload) {
			return Extension.CryptoJS.HmacSHA1(payload, cnc_configuration.CFG_HASHCODE).toString();
		},

		// returns error-message by given errorcode
		getErrorMessageByErrorCode: function (errorcode) {
			switch (errorcode) {
				case 1477918816:
                return {
                    'short' : 'closingTimeWindow',
                    'text'  : cnc_text.ALL_ERROR_CLOSING_TIME_WINDOW
                };
                break;
			case 1480409707:
                return {
                    'short' : 'noArticleinList',
                    'text'  : cnc_text.ALL_ERROR_NO_ITEMS_IN_SALESLIST
                };
                break;
            case 1470143968:
                return {
                    'short' : 'reachedCapacity',
                    'text'  : cnc_text.ALL_ERROR_REACHED_CAPACITY
                };
                break;
            case 1472636219:
                return {
                    'short' : 'reachedCapacity',
                    'text'  : cnc_text.ALL_ERROR_RESPONSEERROR
                };
                break;
            case 1472475118:
                return {
                    'short' : 'reachedCapacity',
                    'text'  : cnc_text.ALL_ERROR_HIGHER_DEMAND
                };
                break;
			case 1488979749:
                return {
                    'short' : 'onemanDelivery',
                    'text'  : cnc_text.ONE_MAN_BIG_ORDER_SIZE
                };
                break;
            case 100:
                return {
                    'short' : 'noStoreSelected',
                    'text'  : cnc_text.ALL_ERROR_NOSTORESELECTED
                };
                break;
            case 110:
                return {
                    'short' : 'noItemsInShoppinglist',
                    'text'  : cnc_text.ALL_ERROR_NOITEMSINSHOPPINGLIST
                };
                break;
            case 120:
                return {
                    'short' : 'responseError',
                    'text'  : cnc_text.ALL_ERROR_RESPONSEERROR
                };
                break;
            case 130:
                return {
                    'short' : 'responseError',
                    'text'  : cnc_text.ALL_ERROR_RESPONSEERROR
                };
                break;
            case 200:
                return {
                    'short' : 'responseError',
                    'text'  : cnc_text.ALL_ERROR_RESPONSEERROR
                };
                break;
            case 300:
                return {
                    'short' : 'ajaxError',
                    'text'  : cnc_text.ALL_ERROR_AJAXERROR
                };
                break;
            default:
                return {
                    'short' : 'responseError',
                    'text'  : cnc_text.ALL_ERROR_RESPONSEERROR
                };
                break;
			}
		},


		/**
		 * Actual function that validates shoppinglist, collect payload, generates hash and sends all to Click&Collect.
		 * If sending succeed and Click&Collect validates payload and hash correct, we redirect to the given target-url from Click&Collect-Response.
		 * If sending failed we display the error on page.
		 */
		sendPayloadJsonp: function (input) {

			if (!window.cnc_configuration){
				Extension.IncludeScript.load(Extension.IBES.cnc_configuration_url, function(){
					Extension.IBES.sendPayloadJsonp(input);
				});
			} else {
				input = input || {};
				input.service = input.service || "fetchlocation";

				if (Extension.Common.isFunction(input.loading))
					input.loading();

				var url = "";
				if (input.service=="express")
					url = cnc_configuration.CFG_LIVE_EXPRESS_DELIVERY_PAYLOAD_URL
				else
					url = cnc_configuration.CFG_LIVE_PAYLOAD_URL;

				if (url){
					// get payload
					var payload = JSON.stringify(Extension.IBES.getPayload(input));

					// get hash
					var hash = Extension.IBES.getHashFromPayload(payload);

					// send payload
					var params = {
						'payload': payload,
						'backUrl': document.location.href,
						'hmac': hash
					};
					params = JSON.stringify(params);
					params = encodeURIComponent(params);

					//var version = (this.isClosingTimeWindow) ? '?version=2' : '';
					//var version = ""; //"?version=2";
					//var url = cnc_configuration.CFG_LIVE_PAYLOAD_URL; // + 'listfetchlocations' + version;
					
					var active = true;
					var request_too_long = setTimeout(function(){
						active = false;
						var res = {
							code: 300,
							message: "Unresponsive",
							status: "ERROR"
						}
						if (Extension.Common.isFunction(input.failure))
							input.failure(res);
						if (Extension.Common.isFunction(input.complete))
							input.complete(res);
					}, 15000);

					var response = new Extension.Common.xhr();
					var DONE = 4;
					var OK = 200;

					response.open("post", url, true);
					response.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					response.onreadystatechange = function() {
						if (response.readyState === DONE) {
							if (active){
								window.clearTimeout(request_too_long);
								try{
									if (response.status === OK) {
										response.responseJSON = JSON.parse(response.responseText);
										if(response.responseJSON) {
											if (response.responseJSON.status && response.responseJSON.status == 'OK' && response.responseJSON.target && response.responseJSON.target != '') {
												if (Extension.Common.isFunction(input.success))
													input.success(response);
											} else {
												if (Extension.Common.isFunction(input.failure))
													input.failure(response);
											}
										}
									} else {
										if (Extension.Common.isFunction(input.failure))
											input.failure(response);
									}
								} catch (err) {
									if (Extension.Common.isFunction(input.exception))
										input.exception(err);
								}

								if (Extension.Common.isFunction(input.complete))
									input.complete(response);
							}
						}
					}
					response.send(params);
				} else {
					var errorResponse = {
						responseJSON:{
							status: "ERROR"
						}
					};
					if (Extension.Common.isFunction(input.failure))
						input.failure(errorResponse);
					if (Extension.Common.isFunction(input.complete))
						input.complete(errorResponse);
				}
			}
		}
	}


	/* CryptoJS v3.1.2 code.google.com/p/crypto-js */
	var CryptoJS = function (g, l) {
		var e = {},
			d = e.lib = {},
			m = function () {},
			k = d.Base = {
				extend: function (a) {
					m.prototype = this;
					var c = new m;
					a && c.mixIn(a);
					c.hasOwnProperty("init") || (c.init = function () {
						c.$super.init.apply(this, arguments)
					});
					c.init.prototype = c;
					c.$super = this;
					return c
				},
				create: function () {
					var a = this.extend();
					a.init.apply(a, arguments);
					return a
				},
				init: function () {},
				mixIn: function (a) {
					for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
					a.hasOwnProperty("toString") && (this.toString = a.toString)
				},
				clone: function () {
					return this.init.prototype.extend(this)
				}
			},
			p = d.WordArray = k.extend({
				init: function (a, c) {
					a = this.words = a || [];
					this.sigBytes = c != l ? c : 4 * a.length
				},
				toString: function (a) {
					return (a || n).stringify(this)
				},
				concat: function (a) {
					var c = this.words,
						q = a.words,
						f = this.sigBytes;
					a = a.sigBytes;
					this.clamp();
					if (f % 4)
						for (var b = 0; b < a; b++) c[f + b >>> 2] |= (q[b >>> 2] >>> 24 - 8 * (b % 4) & 255) << 24 - 8 * ((f + b) % 4);
					else if (65535 < q.length)
						for (b = 0; b < a; b += 4) c[f + b >>> 2] = q[b >>> 2];
					else c.push.apply(c, q);
					this.sigBytes += a;
					return this
				},
				clamp: function () {
					var a = this.words,
						c = this.sigBytes;
					a[c >>> 2] &= 4294967295 <<
						32 - 8 * (c % 4);
					a.length = g.ceil(c / 4)
				},
				clone: function () {
					var a = k.clone.call(this);
					a.words = this.words.slice(0);
					return a
				},
				random: function (a) {
					for (var c = [], b = 0; b < a; b += 4) c.push(4294967296 * g.random() | 0);
					return new p.init(c, a)
				}
			}),
			b = e.enc = {},
			n = b.Hex = {
				stringify: function (a) {
					var c = a.words;
					a = a.sigBytes;
					for (var b = [], f = 0; f < a; f++) {
						var d = c[f >>> 2] >>> 24 - 8 * (f % 4) & 255;
						b.push((d >>> 4).toString(16));
						b.push((d & 15).toString(16))
					}
					return b.join("")
				},
				parse: function (a) {
					for (var c = a.length, b = [], f = 0; f < c; f += 2) b[f >>> 3] |= parseInt(a.substr(f,
						2), 16) << 24 - 4 * (f % 8);
					return new p.init(b, c / 2)
				}
			},
			j = b.Latin1 = {
				stringify: function (a) {
					var c = a.words;
					a = a.sigBytes;
					for (var b = [], f = 0; f < a; f++) b.push(String.fromCharCode(c[f >>> 2] >>> 24 - 8 * (f % 4) & 255));
					return b.join("")
				},
				parse: function (a) {
					for (var c = a.length, b = [], f = 0; f < c; f++) b[f >>> 2] |= (a.charCodeAt(f) & 255) << 24 - 8 * (f % 4);
					return new p.init(b, c)
				}
			},
			h = b.Utf8 = {
				stringify: function (a) {
					try {
						return decodeURIComponent(escape(j.stringify(a)))
					} catch (c) {
						throw Error("Malformed UTF-8 data");
					}
				},
				parse: function (a) {
					return j.parse(unescape(encodeURIComponent(a)))
				}
			},
			r = d.BufferedBlockAlgorithm = k.extend({
				reset: function () {
					this._data = new p.init;
					this._nDataBytes = 0
				},
				_append: function (a) {
					"string" == typeof a && (a = h.parse(a));
					this._data.concat(a);
					this._nDataBytes += a.sigBytes
				},
				_process: function (a) {
					var c = this._data,
						b = c.words,
						f = c.sigBytes,
						d = this.blockSize,
						e = f / (4 * d),
						e = a ? g.ceil(e) : g.max((e | 0) - this._minBufferSize, 0);
					a = e * d;
					f = g.min(4 * a, f);
					if (a) {
						for (var k = 0; k < a; k += d) this._doProcessBlock(b, k);
						k = b.splice(0, a);
						c.sigBytes -= f
					}
					return new p.init(k, f)
				},
				clone: function () {
					var a = k.clone.call(this);
					a._data = this._data.clone();
					return a
				},
				_minBufferSize: 0
			});
		d.Hasher = r.extend({
			cfg: k.extend(),
			init: function (a) {
				this.cfg = this.cfg.extend(a);
				this.reset()
			},
			reset: function () {
				r.reset.call(this);
				this._doReset()
			},
			update: function (a) {
				this._append(a);
				this._process();
				return this
			},
			finalize: function (a) {
				a && this._append(a);
				return this._doFinalize()
			},
			blockSize: 16,
			_createHelper: function (a) {
				return function (b, d) {
					return (new a.init(d)).finalize(b)
				}
			},
			_createHmacHelper: function (a) {
				return function (b, d) {
					return (new s.HMAC.init(a,
						d)).finalize(b)
				}
			}
		});
		var s = e.algo = {};
		return e
	}(Math);

	var CryptoJSInit1 = function () {
		var g = Extension.CryptoJS,
			l = g.lib,
			e = l.WordArray,
			d = l.Hasher,
			m = [],
			l = g.algo.SHA1 = d.extend({
				_doReset: function () {
					this._hash = new e.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520])
				},
				_doProcessBlock: function (d, e) {
					for (var b = this._hash.words, n = b[0], j = b[1], h = b[2], g = b[3], l = b[4], a = 0; 80 > a; a++) {
						if (16 > a) m[a] = d[e + a] | 0;
						else {
							var c = m[a - 3] ^ m[a - 8] ^ m[a - 14] ^ m[a - 16];
							m[a] = c << 1 | c >>> 31
						}
						c = (n << 5 | n >>> 27) + l + m[a];
						c = 20 > a ? c + ((j & h | ~j & g) + 1518500249) : 40 > a ? c + ((j ^ h ^ g) + 1859775393) : 60 > a ? c + ((j & h | j & g | h & g) - 1894007588) : c + ((j ^ h ^
							g) - 899497514);
						l = g;
						g = h;
						h = j << 30 | j >>> 2;
						j = n;
						n = c
					}
					b[0] = b[0] + n | 0;
					b[1] = b[1] + j | 0;
					b[2] = b[2] + h | 0;
					b[3] = b[3] + g | 0;
					b[4] = b[4] + l | 0
				},
				_doFinalize: function () {
					var d = this._data,
						e = d.words,
						b = 8 * this._nDataBytes,
						g = 8 * d.sigBytes;
					e[g >>> 5] |= 128 << 24 - g % 32;
					e[(g + 64 >>> 9 << 4) + 14] = Math.floor(b / 4294967296);
					e[(g + 64 >>> 9 << 4) + 15] = b;
					d.sigBytes = 4 * e.length;
					this._process();
					return this._hash
				},
				clone: function () {
					var e = d.clone.call(this);
					e._hash = this._hash.clone();
					return e
				}
			});
		g.SHA1 = d._createHelper(l);
		g.HmacSHA1 = d._createHmacHelper(l)
	}

	var CryptoJSInit2 = function () {
		var g = Extension.CryptoJS,
			l = g.enc.Utf8;
		g.algo.HMAC = g.lib.Base.extend({
			init: function (e, d) {
				e = this._hasher = new e.init;
				"string" == typeof d && (d = l.parse(d));
				var g = e.blockSize,
					k = 4 * g;
				d.sigBytes > k && (d = e.finalize(d));
				d.clamp();
				for (var p = this._oKey = d.clone(), b = this._iKey = d.clone(), n = p.words, j = b.words, h = 0; h < g; h++) n[h] ^= 1549556828, j[h] ^= 909522486;
				p.sigBytes = b.sigBytes = k;
				this.reset()
			},
			reset: function () {
				var e = this._hasher;
				e.reset();
				e.update(this._iKey)
			},
			update: function (e) {
				this._hasher.update(e);
				return this
			},
			finalize: function (e) {
				var d =
					this._hasher;
				e = d.finalize(e);
				d.reset();
				return d.finalize(this._oKey.clone().concat(e))
			}
		})
	}
	

	
	/*

	  _                     _          
	 |_ ._ _  o  _  |_ _|_ /   _. |  _ 
	 |  | (/_ | (_| | | |_ \_ (_| | (_ 
				 _|                    

	*/

	var FreightCalc = {
		settings: Settings,
		resultstore: {},
		mobileCheckout: function(){
			var c = Extension.Common,
				t = false;
			if (c.checkurl("*/servlet/M2*")) {
				t = true;
			} else if (c.checkurl("*/servlet/*PromotionCodeManage|IrwProceedFromCheckoutAddressView*")) {
				if (c.getStorage("freight_mobileplatform") == "true") t = true;
				var elem = document.querySelector("footer.footer");
				if (elem) t = true;
			} else if (c.checkurl("*/mcommerce/shoppingcart*")) {
				t = true;
			} else if (c.checkurl("*/servlet/*/OrderItemDisplayMobile")){
				t = true;
			}
			return t;
		},
		calcButtonValidate: function(input) {
			var result = false;
			input = input || {};
			input.state = document.getElementById("ext-hs-input-lower-field-state");
			input.zipcode = document.getElementById("ext-hs-input-lower-field");
			if (input.state && input.zipcode) {
				if (input.state.selectedIndex > 0) {
					if (input.zipcode.value.length == Extension.FreightCalc.settings.zipcodedigits)
						result = true;
				}
			} else if (input.zipcode) {
				if (input.zipcode.value.length == Extension.FreightCalc.settings.zipcodedigits)
					result = true;
			}
			
			if (result){
				if (Extension.FreightCalc.mobileCheckout()){
					//M2
					var elem = document.querySelector("#ext-hs-calculate-button");
					if (elem) {
						Extension.Common.removeClass(elem, "ui-disabled");
						Extension.Common.removeClass(elem, "ext-faded");
					}

				} else {
					//IRW
					var elem = document.querySelector("#ext-hs-calculate-button");
					if (elem) var inputelem = elem.querySelector("input");
					if (inputelem) {
						inputelem.removeAttribute('disabled');
						inputelem.style.setProperty('cursor', "pointer");
					}
					Extension.Common.removeClass(elem,"disabledButton");
				}
			} else {
				if (Extension.FreightCalc.mobileCheckout()){
					//M2
					var elem = document.querySelector("#ext-hs-calculate-button");
					if (elem) {
						Extension.Common.addClass(elem, "ui-disabled");
						Extension.Common.addClass(elem, "ext-faded");
					}
				} else {
					//IRW
					var elem = document.querySelector("#ext-hs-calculate-button");
					if (elem) var inputelem = elem.querySelector("input");
					if (inputelem) {
						inputelem.setAttribute('disabled', 'disabled');
						inputelem.style.setProperty('cursor', "default");
					}
					Extension.Common.addClass(elem,"disabledButton");
				}
			}
		},

		homeshippingButtonClick: function(){
			
			Extension.FreightCalc.toggleDeliveryType('hs', 'auto');
			var state = "";
			if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
				var elem = document.getElementById("ext-hs-input-lower-field-state");
				if (elem) {
					if (elem.selectedIndex > 0)
						state = elem.value + "|";
				}
			}
			var zipcode = document.getElementById("ext-hs-input-lower-field").value;
			var value = state + zipcode;
			Extension.FreightCalc.calculateShipping({
				zc: value,
				na: '',
				dt: 'hs',
				ex: Extension.FreightCalc.cookie.ex
			});
			var elem = document.getElementById("ext-hs-calculate-button");
			if (elem) Extension.Common.removeClass(elem, "ext-show");
		},
		homeShippingInputClick: function(elem){
			Extension.FreightCalc.toggleDeliveryType('hs', 'auto');
			if(elem.value.substring(0,10-1) == Extension.Translation.data.freight.inputfieldplaceholder.substring(0,10-1))
				elem.value = "";
			var elem = document.getElementById("ext-hs-calculate-button");
			if (elem) Extension.Common.addClass(elem, "ext-show");
			Extension.FreightCalc.calcButtonValidate();
		},
		homeShippingInputKeyUp: function(elem){
			var valid = false;
			if (Extension.FreightCalc.settings.calculatebutton) {
				var elem = document.getElementById("ext-hs-calculate-button");
				if (elem) Extension.Common.addClass(elem, "ext-show");
				Extension.FreightCalc.calcButtonValidate();
				
				var elem = document.getElementById("ext-hs-input-lower-field");
				if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
					var state = document.getElementById("ext-hs-input-lower-field-state");
					if (state) {
						if (state.selectedIndex > 0) {
							if (elem.value.length == Extension.FreightCalc.settings.zipcodedigits) 
								valid = true;
						}
					}
				} else if (elem.value.length == Extension.FreightCalc.settings.zipcodedigits) valid = true;
			} else {
				if (elem.value.length == Extension.FreightCalc.settings.zipcodedigits) {
					var state = ""
					if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
						var elem = document.getElementById("ext-hs-input-lower-field-state");
						if (elem) {
							if (elem.selectedIndex > 0)
								state = elem.value + "|";
						}
					}
					var zipcode = document.getElementById("ext-hs-input-lower-field").value;
					var value = state + zipcode;
					Extension.FreightCalc.calculateShipping({
						zc: value,
						na: '',
						dt: 'hs',
						ex: Extension.FreightCalc.cookie.ex
					});
					valid = true;
				}
			}

			if(!valid){
				var elem = document.getElementById('ext-hs-result');
				if (elem) Extension.Common.removeClass(elem, 'ext-show');
				var elem = document.getElementById('ext-ex-result');
				if (elem) Extension.Common.removeClass(elem, 'ext-show');
				Extension.FreightCalc.setInfoCookie('{"zc":"","na":"","dt":"hs","ex":"' + Extension.FreightCalc.cookie.ex + '"}');
				Extension.FreightCalc.resultstore.hs = undefined;
				Extension.FreightCalc.revertPrices();
				if (Extension.FreightCalc.settings.forcezipcodeentry){
					this.deactivateContinueButtons();
					Extension.Common.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
					Extension.Common.addClass(document.getElementById("ext-ex-button-text-error"), "ext-show");
					Extension.Common.addClass(document.getElementById("ext-hs-button-text-error-klarna"), "ext-show");
					Extension.Common.addClass(document.getElementById("ext-ex-button-text-error-klarna"), "ext-show");
				}
			}
		},
		setInfoCookie: function(value) {
			try {
				this.cookie = JSON.parse(value);
				this.setSaved('freight_info', value);
			} catch (err) {}
		},
		getInfoCookie: function() {
			var c = Extension.Common;
			try {
				var save = this.getSaved("freight_info");
				this.cookie = JSON.parse(save);
			} catch (err) {}
		},
		setSaved: function(key, value) {
			var c = Extension.Common;
			try {
				if (this.mobileCheckout())
					c.setStorage(key, c.uriencode(value));
				else
					c.setCookie(key, c.uriencode(value));
			} catch (err) {}
		},
		getSaved: function(key) {
			var c = Extension.Common;
			var save;
			try {
				if (this.mobileCheckout())
					save = c.uridecode(c.getStorage(key));
				else
					save = c.uridecode(c.getCookie(key));
			} catch (err) {}
			return save;
		},
		getHashObjectUrl: function() {
			try {
				return JSON.parse(this.URIdecode(window.location.hash));
			} catch (err) {
				return false
			}
		},
		setHashObjectUrl: function() {
			var cp = document.getElementById("cookParam");
			if (cookParam) {
				cookParam.value = this.URIencode(JSON.stringify(this.cookie));
				cookParam.value = "test";
			} else {
				var cookParam = document.createElement("input");
				cookParam.type = "hidden";
				cookParam.name = "cookParam";
				cookParam.id = "cookParam";
				cookParam.value = this.URIencode(JSON.stringify(this.cookie));
				cookParam.value = "test";
				var form = document.getElementById("shopRowBottom");
				if (form) {
					form.insertBefore(cookParam, form.childNodes[0]);
					form.appendChild(cookParam);
				}
			}
		},
		URIencode: function(value) {
			return encodeURIComponent(value).replace(/'/g, "%27").replace(/"/g, "%22");
		},
		URIdecode: function(value) {
			return decodeURIComponent(value.replace(/\+/g, " "));
		},
		setZipCodeForTransfer: function(zc) {
			var hzip = document.querySelector("#shopRowBottom input[name=zipCode]");
			var s = zc.split("|");
			if (s.length == 2){
				var state = s[0];
				zc = s[1];
			}
				
			if (hzip)
				hzip.value = zc;
			else {
				var czi = document.createElement("input");
				czi.type = "hidden";
				czi.name = "zipCode";
				czi.value = zc;
				var elem = document.getElementById("shopRowBottom");
				if (elem)
					elem.appendChild(czi);
			}
			hzip = document.querySelector("#shopRowTop input[name=zipCode]");
			if (hzip)
				hzip.value = zc;
			else {
				var czi = document.createElement("input");
				czi.type = "hidden";
				czi.name = "zipCode";
				czi.value = zc;
				var elem = document.getElementById("shopRowTop");
				if (elem)
					elem.appendChild(czi);
			}
		},
		clearZipCodeForTransfer: function() {
			var hzip = document.querySelector("#shopRowBottom input[name=zipCode]");
			if (hzip)
				hzip.value = "";
			hzip = document.querySelector("#shopRowTop input[name=zipCode]");
			if (hzip)
				hzip.value = "";
		},
		setdeliveryAddressDifferentForTransfer: function() {
			var hdad = document.querySelector("#shopRowBottom input[name=deliveryAddressDifferent]");
			if (hdad)
				hdad.value = "1";
			else {
				var hdadi = document.createElement("input");
				hdadi.type = "hidden";
				hdadi.name = "deliveryAddressDifferent";
				hdadi.value = "1";
				var elem = document.getElementById("shopRowBottom");
				if (elem)
					elem.appendChild(hdadi);
			}
			var hdad = document.querySelector("#shopRowTop input[name=deliveryAddressDifferent]");
			if (hdad)
				hdad.value = "1";
			else {
				var hdadi = document.createElement("input");
				hdadi.type = "hidden";
				hdadi.name = "deliveryAddressDifferent";
				hdadi.value = "1";
				var elem = document.getElementById("shopRowTop");
				if (elem)
					elem.appendChild(hdadi);
			}
		},
		cleardeliveryAddressDifferentForTransfer: function() {
			var hdad = document.querySelector("#shopRowBottom input[name=deliveryAddressDifferent]");
			if (hdad)
				hdad.parentNode.removeChild(hdad);
			hdad = document.querySelector("#shopRowTop input[name=deliveryAddressDifferent]");
			if (hdad)
				hdad.parentNode.removeChild(hdad);
		},
		expandAccordion: function() {
			var c = Extension.Common;
			this.accordionList = "false";
			var eab = document.getElementById("expandAccordion");
			eab.innerHTML = "-";
			eab.style.setProperty("padding-right", "4px");
			eab.setAttribute("onClick", "Extension.FreightCalc.retractAccordion()");

			var deltype = ["hs", "pp", "cc"];
			for (var i=0; i<deltype.length; i++){
				c.addClass(document.getElementById("ext-cont-" + deltype[i]), "ext-show");
				c.addClass(document.getElementById(deltype[i] + "-calc-heading-lower"), "ext-show");
			}
		},
		retractAccordion: function() {
			var c = Extension.Common;
			this.accordionList = "true";
			var eab = document.getElementById("expandAccordion");
			eab.innerHTML = "+";
			eab.style.setProperty("padding-right", "0");
			eab.setAttribute("onClick", "Extension.FreightCalc.expandAccordion()");

			var deltype = ["hs", "pp", "cc"];
			for (var i=0; i<deltype.length; i++){
				if (!document.getElementById("ext-cont-" + deltype[i] + "-radio-heading-input").getAttribute("checked")) {
					c.removeClass(document.getElementById("ext-cont-" + deltype[i]), "ext-show");
					c.removeClass(document.getElementById(deltype[i] + "-calc-heading-lower"), "ext-show");
				}
			}
		},
		addPrices: function(a, b) {
			var result = ""
			  , c = Extension.Common;
			var type = "int"
			if (ExtensionSetting.Country.numeric.decimalsum)
				type = "float";
			try {
				if (type == "float")
					var a = c.toFloat({value: a, format: "price"})
					  , b = c.toFloat({value: b, format: "price"});
				else
					var a = c.toInt({value: a, format: "price"})
					  , b = c.toInt({value: b, format: "price"});
				result = a + b;
				if (result <= 0) {
					if (a >= 0)
						result = a;
					else if (b >= 0)
						result = b;
				}
			} catch (err) {}
			
			return c.formatNumber({value: result, type: type, format: "price"});
		},
		subtractPrices: function(a, b) {
			var result = ""
			  , c = Extension.Common;
			var type = "int"
			if (ExtensionSetting.Country.numeric.decimalsum)
				type = "float";
			try {
				if (type == "float")
					var a = c.toFloat({value: a, format: "price"})
					  , b = c.toFloat({value: b, format: "price"});
				else
					var a = c.toInt({value: a, format: "price"})
					  , b = c.toInt({value: b, format: "price"});
				result = a - b;
				if (result <= 0) {
					if (a >= 0)
						result = a;
					else if (b >= 0)
						result = b;
				}
			} catch (err) {}
			
			return c.formatNumber({value: result, type: type, format: "price"});
		},
		changePrices: function(input){
			var elem,
				c = Extension.Common,
				e = Extension.Element;
			var type = "int"
			if (ExtensionSetting.Country.numeric.decimalsum)
				type = "float";
			
			if(this.mobileCheckout()){

				//Freight and Goods
				var elemselectors = ["#txtNormaltotalTop", "#txtNormaltotalBottom"];
				for (var i=0; i<elemselectors.length; i++){
					elem = e.getChildNodes(document.querySelectorAll(elemselectors[i])[0])[0];
					if (elem) {elem.innerHTML = c.formatNumber({value: input.totalprice, type: type, format: "price"}); elem.textContent = c.formatNumber({value: input.totalprice, type: type, format: "price"});}
				}
				var elemselectors = ["#txtFamilyTotalTop", "#txtFamilyTotalBottom"];
				for (var i=0; i<elemselectors.length; i++){
					elem = e.getChildNodes(document.querySelectorAll(elemselectors[i])[0])[0];
					if (elem) {elem.innerHTML = c.formatNumber({value: input.totalfamilyprice, type: type, format: "price"}); elem.textContent = c.formatNumber({value: input.totalfamilyprice, type: type, format: "price"});}
				}

				//Freight
				var elemselectors = ["#txtTotalDeliveryTop span", "#txtTotalDeliveryBottom span", "#deliveryCalcResultTextBottom", "#deliveryCalcResultTextTop"];
				for (var i=0; i<elemselectors.length; i++){
					elem = document.querySelectorAll(elemselectors[i])[0];
					if (elem) elem.innerHTML = c.formatNumber({value: input.freightprice, type: type, format: "price"});
				}

			} else {
				if (this.checkPvatInput() == "true") {

					//Freight and Goods
					var elemselectors = ["#totalValueBottom span", "#totalValueTop span"];
					for (var i=0; i<elemselectors.length; i++){
						elem = document.querySelectorAll(elemselectors[i])[0];
						if (elem) elem.innerHTML = c.formatNumber({value: input.totalprice_exvat, type: type, format: "price"});
					}
					var elemselectors = ["#totalValueFamilyBottom", "#totalValueFamilyTop"];
					for (var i=0; i<elemselectors.length; i++){
						elem = document.querySelectorAll(elemselectors[i])[0];
						if (elem) elem.innerHTML = c.formatNumber({value: input.totalfamilyprice_exvat, type: type, format: "price"});
					}

					//Freight
					var elemselectors = ["#deliveryCalcResultTextBottom", "#deliveryCalcResultTextTop", "#txtTotalDeliveryBottom", "#txtTotalDeliveryTop"];
					for (var i=0; i<elemselectors.length; i++){
						elem = document.querySelectorAll(elemselectors[i])[0];
						if (elem) elem.innerHTML = c.formatNumber({value: input.freightprice_exvat, type: type, format: "price"});
					}

					//Price with VAT
					elem = document.getElementById("prodPriceWithVATInfo");
					if (elem) elem.innerHTML = c.formatNumber({value: input.totalprice, type: type, format: "price"});
					elem = document.getElementById("prodFamilyPriceWithVATInfo");
					if (elem) elem.innerHTML = c.formatNumber({value: input.totalfamilyprice, type: type, format: "price"});

				} else {

					//Freight and Goods
					var elemselectors = ["#totalValueBottom span", "#totalValueTop span"];
					for (var i=0; i<elemselectors.length; i++){
						elem = document.querySelectorAll(elemselectors[i])[0];
						if (elem) elem.innerHTML = c.formatNumber({value: input.totalprice, type: type, format: "price"});
					}
					var elemselectors = ["#totalValueFamilyBottom", "#totalValueFamilyTop"];
					for (var i=0; i<elemselectors.length; i++){
						elem = document.querySelectorAll(elemselectors[i])[0];
						if (elem) elem.innerHTML = c.formatNumber({value: input.totalfamilyprice, type: type, format: "price"});
					}

					//Freight
					var elemselectors = ["#deliveryCalcResultTextBottom", "#deliveryCalcResultTextTop", "#txtTotalDeliveryBottom", "#txtTotalDeliveryTop"];
					for (var i=0; i<elemselectors.length; i++){
						elem = document.querySelectorAll(elemselectors[i])[0];
						if (elem) elem.innerHTML = c.formatNumber({value: input.freightprice, type: type, format: "price"});
					}

					//Price with VAT
					elem = document.getElementById("prodPriceWithVATInfo");
					if (elem) elem.innerHTML = c.formatNumber({value: input.totalprice_exvat, type: type, format: "price"});
					elem = document.getElementById("prodFamilyPriceWithVATInfo");
					if (elem) elem.innerHTML = c.formatNumber({value: input.totalfamilyprice_exvat, type: type, format: "price"});

				}
			}
		},
		setPickingPrices: function() {
			this.revertPrices();
			var e = Extension.Element,
				topBottom = ["Top", "Bottom"];
			if(this.mobileCheckout()){
				for (var i=0; i<topBottom.length; i++){
					var txtTotalDelivery = document.querySelector('#txtTotalDelivery' + topBottom[i] + " span");
					if(txtTotalDelivery){
						txtTotalDelivery.innerHTML = Extension.Translation.data.freight.clickcollectprice;

						var elem;
						elem = document.getElementById('txtNormaltotal' + topBottom[i]);
						if(elem) elem.innerHTML = this.addPrices(elem.innerHTML, txtTotalDelivery.innerHTML);

						elem = document.getElementById('txtFamilyTotal' + topBottom[i]);
						if (elem) elem.innerHTML = this.addPrices(elem.innerHTML, txtTotalDelivery.innerHTML);
					}
				}
			} else {
				for (var i=0; i<topBottom.length; i++){
					var txtTotalDelivery = document.getElementById('txtTotalDelivery' + topBottom[i]);
					if(txtTotalDelivery){
						txtTotalDelivery.innerHTML = Extension.Translation.data.freight.clickcollectprice;

						var elem;
						elem = document.querySelector('#totalValue' + topBottom[i] + " span");
						if(elem){
							//elem = e.getChildNodes(elem)[0];
							//if (elem)
							elem.innerHTML = this.addPrices(elem.innerHTML, txtTotalDelivery.innerHTML);
						}
						elem = document.getElementById('totalValueFamily' + topBottom[i]);
						if (elem) elem.innerHTML = this.addPrices(elem.innerHTML, txtTotalDelivery.innerHTML);
					}
				}
			}
			var elem = document.querySelectorAll('.notYetCalc');
			for (var i=0; i<elem.length; i++){
				elem[i].style.setProperty("display", "none");
			}
		},
		revertPrices: function() {
			var e = Extension.Element,
				topBottom = ["Top", "Bottom"];
			if(this.mobileCheckout()){
				for (var i=0; i<topBottom.length; i++){
					var txtTotalDelivery = document.querySelector('#txtTotalDelivery' + topBottom[i] + " span");
					if (txtTotalDelivery){

						var elem;
						elem = document.getElementById('txtNormaltotal' + topBottom[i]);
						if(elem) elem.innerHTML = this.subtractPrices(elem.innerText, txtTotalDelivery.innerHTML);

						elem = document.getElementById('txtFamilyTotal' + topBottom[i]);
						if(elem) elem.innerHTML = this.subtractPrices(elem.innerHTML, txtTotalDelivery.innerHTML);

						txtTotalDelivery.innerHTML = "?";
					}
				}
			} else {
				if (this.activePage == "cart"){
					for (var i=0; i<topBottom.length; i++){
						var txtTotalDelivery = document.getElementById('txtTotalDelivery' + topBottom[i]);
						if(txtTotalDelivery){

							var elem;
							elem = document.querySelector('#totalValue' + topBottom[i] + " span");
							if(elem){
								//elem = e.getChildNodes(elem)[0];
								//if (elem)
								elem.innerHTML = this.subtractPrices(elem.innerHTML, txtTotalDelivery.innerHTML);
							}
							elem = document.getElementById('totalValueFamily' + topBottom[i]);
							if (elem) elem.innerHTML = this.subtractPrices(elem.innerHTML, txtTotalDelivery.innerHTML);

							txtTotalDelivery.innerHTML = "?";
						}
					}
				}
				if (this.activePage == "address"){
					var elemdel = document.querySelector("#txtTotalDelivery span");
					if (elemdel) {

						elem = document.querySelector("span#txtTotal") || document.querySelector("div#totalValue");
						if (elem) elem.innerHTML = this.subtractPrices(elem.innerHTML, elemdel.innerHTML);

						elem = document.querySelector("span#txtFamilyTotal") || document.querySelector("div#totalValueFamily");
						if (elem) elem.innerHTML = this.subtractPrices(elem.innerHTML, elemdel.innerHTML);

						elemdel.innerHTML = "?";
					}
				}
			}
			var elem = document.querySelectorAll('.notYetCalc');
			for (var i=0; i<elem.length; i++){
				elem[i].style.setProperty("display", "block");
			}
		},
		checkPvatInput: function() {
			var pvatInput = document.getElementById('pricevat');
			var result = "false";
			if ((pvatInput != null) && (pvatInput != undefined)) {
				if (pvatInput.checked) {
					result = "true";
				} else {
					result = "false";
				}
			} else {
				result = "false";
			}
			return result;
		},
		addingStates: function(callback) {
			var c = Extension.Common,
				data = this.data.states,
				statedropdown = document.getElementById("ext-hs-input-lower-field-state");
			for (var i=0; i<data.length; i++){
				var opt = document.createElement("option");
				if (c.varExist(data[i].code, true)) {
					opt.id = "ext-hs-option_" + data[i].code;
					opt.textContent = "\xA0\xA0\xA0" + data[i].name;
					opt.value = data[i].code;
					var statesplit = Extension.FreightCalc.cookie.zc.split("|");
					if (data[i].code == statesplit[0]){
						opt.selected = true;
					}
				}
				statedropdown.appendChild(opt);
			}
			callback(true);
		},
		addingPickupPoints: function(callback) {
			var c = Extension.Common,
				data = this.data.pickuppoints,
				pickuppointdropdown = document.getElementById("ext-pp-input-lower-field");
			for (var i=0; i<data.length; i++){
				var opt = document.createElement("option");
				if (c.varExist(data[i].zipcode, true)) {
					opt.id = "ext-pp-option_" + data[i].zipcode;
					opt.textContent = "\xA0\xA0\xA0" + data[i].name;
					opt.value = '{"zc":"' + data[i].zipcode + '",' +
						'"na":"' + data[i].name + '",' +
						'"dt":"pp"}';
					if (data[i].zipcode == Extension.FreightCalc.cookie.zc) {
						opt.selected = true;
						this.toggleDeliveryType("pp", "auto");
					}

				} else {
					opt.id = "ext-pp-option_cap_" + i;
					opt.textContent = data[i].caption;
					opt.disabled = true;
				}
				pickuppointdropdown.appendChild(opt);
			}
			callback(true);
		},
		addingClickCollects: function(callback) {
			var c = Extension.Common,
				clickcollectdropdown = document.getElementById("ext-cc-input-lower-field");

			Extension.IBES.getFetchLocations({
				success: function(data){
					var count = 1;
					for (var prop in data.responseJSON) {
						if (data.responseJSON[prop].indexOf(IBES.exclude_prefix) == -1){
							var opt = document.createElement("option");
							opt.id = "ext-cc-option_" + count;
							opt.textContent = "\xA0\xA0\xA0" + data.responseJSON[prop];
							opt.value = prop;
							if (Extension.FreightCalc.cookie.dt == "cc"){
								if (count == Extension.Common.toInt(Extension.FreightCalc.cookie.zc)) {
									opt.selected = true;
									Extension.FreightCalc.toggleDeliveryType("cc", "auto");
								}
							}
							clickcollectdropdown.appendChild(opt);
							count++;
						}
					}
					//sorting ikea stores in list
					var mobileCClist2 = document.getElementById("ext-cc-input-lower-field");
					for (i=1; i<mobileCClist2.children.length; i++) {
						for (c=i; c<mobileCClist2.children.length; c++) {
							if (mobileCClist2.children[i].textContent > mobileCClist2.children[c].textContent) {      
								mobileCClist2.insertBefore(mobileCClist2.children[c], mobileCClist2.children[i]);
							}
						}    
					}
				},
				failure: function(data){
					//Could not add click and collect locations to dropdown
				},
				complete: function(data){
					callback(true);
				}
			}, callback);
		},
		savedCookieImport: function(){
			if (!Extension.FreightCalc.imported){
				var c = Extension.Common,
					e = Extension.Element;

				if (this.cookie.dt == "" || this.cookie.dt == "pp" || this.cookie.dt == "cc") {
					if (Extension.FreightCalc.settings.expressdefault)
						this.cookie.ex = "true";
				}
				if (this.cookie.dt == "") {
					if (this.activePage == "cart"){
						this.cookie.dt = "hs";
					}
				}				
				if (this.cookie.dt == "hs") {
					if (this.activePage == "cart"){
						this.toggleDeliveryType("hs", "auto");
						if (c.varExist(this.cookie.zc, true)) {
							var zipcode = document.getElementById("ext-hs-input-lower-field");
							var state = document.getElementById("ext-hs-input-lower-field-state");
							if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
								if (state){
									var s = this.cookie.zc.split("|");
									if (s.length == 2){
										state = document.getElementById("ext-hs-option_" + s[0]);
										if (state) state.setAttribute("selected", true);
										zipcode.value  = s[1];
									}
									var elem = document.getElementById("ext-hs-input-lower-field-state");
									if (elem) {

									}
								} else {
									zipcode.value = this.cookie.zc;
								}
							} else {
								zipcode.value = this.cookie.zc;
							}

							this.calculateShipping({
								zc: this.cookie.zc,
								na:  this.cookie.na,
								dt: this.cookie.dt,
								ex: this.cookie.ex
							});

							var elem = document.getElementById("ext-hs-calculate-button");
							if (elem) Extension.Common.removeClass(elem, "ext-show");
						}
					}
				}
				if (this.cookie.dt == "pp") {
					this.toggleDeliveryType("pp", "auto");
					if (c.varExist(this.cookie.zc, true)) {
						var elem = document.getElementById("ext-pp-option_" + this.cookie.zc)
						if (elem) elem.setAttribute("selected", true);
						this.calculateShipping({
							zc: this.cookie.zc,
							na:  this.cookie.na,
							dt: this.cookie.dt,
							ex: this.cookie.ex,
							system: "irw"
						});
					}
				}
				if (this.cookie.dt == "cc") {
					this.toggleDeliveryType("cc", "auto");
					this.clickCollectAdjustments("cc");
					if (c.varExist(this.cookie.zc, true)) {

						Extension.Element.get("#ext-cc-option_" + this.cookie.zc, function(selector, elem){
							elem = elem[0];
							elem.setAttribute("selected", true);

							var system = "M2";
							if (!Extension.FreightCalc.mobileCheckout())
								system = "IRW"

							Extension.IBES.sendPayloadJsonp({
								system: system,
								service: "fetchlocation",
								selector: "#ext-cc-input-lower-field",
								loading: function(){
									//Clear resultstate
									Extension.FreightCalc.resultstore.cc = undefined;

									//Deactivate all input and continue buttons
									Extension.FreightCalc.deactivateAll();
									Extension.FreightCalc.deactivateContinueButtons();
									Extension.FreightCalc.freightCalcLoaders.show("#ext-cc-input-lower-div .ext-freightcalc-loader");
									Extension.Common.addClass(document.getElementById("ext-cc-result"), "ext-faded");
									Extension.Common.removeClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
									Extension.Common.removeClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
								},
								success: function(response){

									Extension.FreightCalc.resultstore.cc = {data: Extension.FreightCalc.cookie, response: response};

									Extension.FreightCalc.clickcollectcarturl = response.responseJSON.target;
									Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-faded");

									// Date and price
									document.getElementById("ext-calc-cc-result-delivery-date").innerHTML = "";
									document.getElementById("ext-calc-cc-result-price").innerHTML = Extension.Translation.data.freight.clickcollectprice;

									Extension.FreightCalc.setPickingPrices();

									setTimeout(function(){
										Extension.Common.addClass(document.getElementById("ext-cc-result"), "ext-show");
										Extension.Common.removeClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
										Extension.FreightCalc.activateContinueButtons();
									}, 600);
								},
								failure: function(response){
									Extension.FreightCalc.clickcollectcarturl = undefined;
									Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-show");
									if (response.responseJSON){
										setTimeout(function(){
											Extension.Common.addClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
											Extension.Common.addClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
										}, 600);
										var elem = document.getElementById("ext-calc-cc-result-error-span");
										var error = Extension.IBES.getErrorMessageByErrorCode(response.responseJSON.code);
										if (elem && error) elem.innerHTML = error.text;
									}
									Extension.FreightCalc.revertPrices();

								},
								complete: function(response){
									Extension.FreightCalc.activateAll();
									Extension.FreightCalc.freightCalcLoaders.hide();
								}
							});
						});
					}
				}
				if (this.cookie.dt == "oa") {
					if (this.activePage == "address")
						this.toggleDeliveryType("oa", "auto");
				}

				Extension.FreightCalc.imported = true;
			}
		},
		checkKlarnaDefault: function(){
			Extension.FreightCalc.settings.klarna.switches = {
				m2: {
					hs: window.MaxymiserKlarnaM2hs || Extension.FreightCalc.settings.klarna.defaults.m2.hs,
					ex: window.MaxymiserKlarnaM2ex || Extension.FreightCalc.settings.klarna.defaults.m2.ex,
					pp: window.MaxymiserKlarnaM2pp || Extension.FreightCalc.settings.klarna.defaults.m2.pp,
					cc: window.MaxymiserKlarnaM2cc || Extension.FreightCalc.settings.klarna.defaults.m2.cc
				},
				irw: {
					hs: window.MaxymiserKlarnaIRWhs || Extension.FreightCalc.settings.klarna.defaults.irw.hs,
					ex: window.MaxymiserKlarnaIRWex || Extension.FreightCalc.settings.klarna.defaults.irw.ex,
					pp: window.MaxymiserKlarnaIRWpp || Extension.FreightCalc.settings.klarna.defaults.irw.pp,
					cc: window.MaxymiserKlarnaIRWcc || Extension.FreightCalc.settings.klarna.defaults.irw.cc
				}
			}
			var s = Extension.FreightCalc.settings.klarna.switches;
			
			if(Extension.FreightCalc.mobileCheckout()){
				if (s.m2.hs || s.m2.ex || s.m2.pp || s.m2.cc){
					var elem = document.getElementById("ext-pay-with-other-card-wrapper");
					if (elem) elem.style.setProperty("display", "block");
				}
			} else {
				if (s.irw.hs || s.irw.ex || s.irw.pp ||s.irw.cc){
					var elem = document.getElementById("ext-pay-with-other-card-wrapper");
					if (elem) elem.style.setProperty("display", "block");
				}
			}

			var elem = document.getElementById("ext-pay-with-other-card-input");
			if ((elem && elem.checked) || window.iamabot) {
				Extension.FreightCalc.settings.klarna.switches = {
					m2: {hs: false,	ex: false, pp: false, cc: false},
					irw: {hs: false, ex: false, pp: false, cc: false}
				}
			}
		},
		toggleShownButton: function(dt){
			var elem, current,
				dts = ["hs", "ex", "pp", "cc"];
			
			var klarna = "";
			this.checkKlarnaDefault();
			if(this.mobileCheckout()){
				if (Extension.FreightCalc.settings.klarna.switches.m2[dt])
					klarna = "-klarna";
			} else {
				if (Extension.FreightCalc.settings.klarna.switches.irw[dt])
					klarna = "-klarna";
			}

			for (var i=0; i<dts.length; i++){
				elem = document.querySelector("#ext-" + dts[i] + "-wrapper");
				if (elem) elem.style.setProperty("display", "none");
				elem = document.querySelector("#ext-" + dts[i] + "-wrapper-klarna");
				if (elem) elem.style.setProperty("display", "none");
			}
			current = dt;
			if (current == "pp" && klarna === "") current = "hs";
			elem = document.querySelector("#ext-" + current + "-wrapper" + klarna);
			if (elem) elem.style.setProperty("display", "block");

			if(dt == "hs" && klarna === ""){
				elem = document.querySelector("#ext-hs-button-caption-value");
				if (elem) elem.value = Extension.Translation.data.freight.regulardeliverybuttoncaption;
				elem = document.querySelector("#ext-hs-button-caption");
				if (elem) elem.innerHTML = Extension.Translation.data.freight.regulardeliverybuttoncaption;
				elem = document.querySelector("#ext-hs-button-text");
				if (elem) elem.innerHTML = Extension.Translation.data.freight.regulardeliverybuttontext;
				elem = document.querySelector("#ext-hs-button-text-error");
				if (elem) elem.innerHTML = Extension.Translation.data.freight.regulardeliverybuttontexterror;
			}
			if(dt == "pp" && klarna === ""){
				elem = document.querySelector("#ext-hs-button-caption-value");
				if (elem) elem.value = Extension.Translation.data.freight.pickuppointbuttoncaption;
				elem = document.querySelector("#ext-hs-button-caption");
				if (elem) elem.innerHTML = Extension.Translation.data.freight.pickuppointbuttoncaption;
				elem = document.querySelector("#ext-hs-button-text");
				if (elem) elem.innerHTML = Extension.Translation.data.freight.pickuppointbuttontext;
				elem = document.querySelector("#ext-hs-button-text-error");
				if (elem) elem.innerHTML = Extension.Translation.data.freight.pickuppointbuttontexterror;
			}
		},
		clickCollectAdjustments: function(dt) {
			if(this.mobileCheckout()){
				var elem;
				if (dt == "cc") {

					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetypepickingservice;
					}
					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span.notYetCalc");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.notcalculatedpickingservice;
					}
					elem = document.querySelectorAll(".row.shoppingSubTotalExlDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetotalbeforepickingservice;
					}

				} else {

					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetypefreight;
					}
					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span.notYetCalc");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.notcalculatedfreight;
					}
					elem = document.querySelectorAll(".row.shoppingSubTotalExlDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetotalbeforefreight;
					}
				}
			} else {
				if (dt == "cc") {

					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetypepickingservice;
					}
					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span.notYetCalc");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.notcalculatedpickingservice;
					}
					elem = document.querySelectorAll(".row.shoppingSubTotalExlDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetotalbeforepickingservice;
					}

				} else {

					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetypefreight;
					}
					elem = document.querySelectorAll(".row.shoppingListDelivery .column-1 span.notYetCalc");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetotalbeforefreight;
					}
					elem = document.querySelectorAll(".row.shoppingSubTotalExlDelivery .column-1 span");
					for(var i=0; i<elem.length; i++) {
						elem[i].innerHTML = Extension.Translation.data.freight.pricetotalbeforefreight;
					}
				}

			}
		},
		otherAddressAdjustments: function(dt){
			var c = Extension.Common,
				elem, srcelem,
				customerType = this.checkCustomerType(),
				fields = ["organizationName", "firstName", "lastName", "address1", "address2", "zipCode", "city", "phone2", "phone1"];
			if (dt == "oa") {
				for (var i=0; i<fields.length; i++){
					elem = document.querySelector("#signup_checkout_" + customerType + "_ship_" + fields[i]);
					if (elem){
						if (this.oafields){
							if (c.varExist(this.oafields[fields[i]])) {
								elem.value = this.oafields[fields[i]];
								if (window.irwDoFieldValidation) window.irwDoFieldValidation({target: elem});
							}
						} else elem.value = "";
						this.validateRemoveError(elem);
					}
				}
			} else if (dt == "pp") {
				this.oafields = this.oafields || {};
				for (var i=0; i<fields.length; i++){
					elem = document.querySelector("#signup_checkout_" + customerType + "_ship_" + fields[i]);
					if (elem) {
						if (!c.varExist(this.oafields[fields[i]])) this.oafields[fields[i]] = "";
						else this.oafields[fields[i]] = elem.value;
						elem.value = "";
						this.validateRemoveError(elem);
					}
				}
				var fields = ["organizationName", "firstName", "lastName", "phone2", "phone1"]
				for (var i=0; i<fields.length; i++){
					elem = document.querySelector("#signup_checkout_" + customerType + "_ship_" + fields[i]);
					srcelem = document.querySelector("#signup_checkout_" + customerType + "_" + fields[i]);
					if (elem && srcelem) {
						elem.value = srcelem.value;
						if (window.irwDoFieldValidation) window.irwDoFieldValidation({target: elem});
						this.validateRemoveError(elem);
					}

				}
			}
		},
		deactivateAll: function(){
			var c = Extension.Common,
				elem;
			elem = document.querySelectorAll(".ext-radio-heading-label");
			for (var i=0; i<elem.length; i++){
				elem[i].setAttribute('disabled', 'disabled');
			}
			elem = document.getElementById("ext-cont-hs-radio-heading-input");
			if (elem) elem.setAttribute('disabled', 'disabled');
			elem = document.getElementById("ext-hs-input-lower-field-state");
			if (elem) elem.setAttribute('disabled', 'disabled');
			elem = document.getElementById("ext-hs-input-lower-field");
			if (elem) elem.setAttribute('disabled', 'disabled');
			elem = document.getElementById("ext-hs-calculate-button");
			if (elem) elem.setAttribute('disabled', 'disabled');

			elem = document.getElementById("ext-cont-pp-radio-heading-input");
			if (elem) elem.setAttribute('disabled', 'disabled');
			elem = document.getElementById("ext-pp-input-lower-field");
			if (elem) elem.setAttribute('disabled', 'disabled');

			elem = document.getElementById("ext-cont-cc-radio-heading-input");
			if (elem) elem.setAttribute('disabled', 'disabled');
			elem = document.getElementById("ext-cc-input-lower-field");
			if (elem) elem.setAttribute('disabled', 'disabled');

			elem = document.getElementById("ext-cont-oa-radio-heading-input");
			if (elem) elem.setAttribute('disabled', 'disabled');
			
			//Deactivating all continue to checkout buttons.
			this.deactivateContinueButtons();
			if (this.deactivatebuttontimer)
				clearTimeout(this.deactivatebuttontimer);
			this.deactivatebuttontimer = setTimeout(function(){
				Extension.FreightCalc.activateContinueButtons();
			},10000);
		},

		activateAll: function(){
			var c = Extension.Common,
				elem;
			elem = document.querySelectorAll(".ext-radio-heading-label");
			for (var i=0; i<elem.length; i++){
				elem[i].removeAttribute('disabled');
			}

			elem = document.getElementById("ext-cont-hs-radio-heading-input");
			if (elem) elem.removeAttribute('disabled');
			elem = document.getElementById("ext-hs-input-lower-field-state");
			if (elem) elem.removeAttribute('disabled');
			elem = document.getElementById("ext-hs-input-lower-field");
			if (elem) elem.removeAttribute('disabled');
			elem = document.getElementById("ext-hs-calculate-button");
			if (elem) elem.removeAttribute('disabled');

			elem = document.getElementById("ext-cont-pp-radio-heading-input");
			if (elem) elem.removeAttribute('disabled');
			elem = document.getElementById("ext-pp-input-lower-field");
			if (elem) elem.removeAttribute('disabled');

			elem = document.getElementById("ext-cont-cc-radio-heading-input");
			if (elem) elem.removeAttribute('disabled');
			elem = document.getElementById("ext-cc-input-lower-field");
			if (elem) elem.removeAttribute('disabled');

			elem = document.getElementById("ext-cont-oa-radio-heading-input");
			if (elem) elem.removeAttribute('disabled');
		},
		activateContinueButtons: function(){
			var c = Extension.Common,
				elem;
			//M2
			elem = document.querySelector("#checkoutButtonBoxTop .ui-submit");
			if (elem) c.removeClass(elem,"ui-disabled");
			elem = document.querySelectorAll("#checkoutButtonBoxBottom .ui-submit");
			for (var i=0; i<elem.length; i++) c.removeClass(elem[i],"ui-disabled");
			elem = document.querySelectorAll(".buttonContainer .ui-submit");
			for (var i=0; i<elem.length; i++) c.removeClass(elem[i],"ui-disabled");

			//IRW
			elem = document.querySelectorAll(".boxContent.saveNContinueButton .buttonContainer");
			for (var i=0; i<elem.length; i++){
				var inputelem = elem[i].querySelector("input")
				if (inputelem) {
					inputelem.removeAttribute('disabled');
					inputelem.style.setProperty('cursor', "pointer");
				}
				c.removeClass(elem[i],"disabledButton");
			}
			//IRW
			elem = document.querySelectorAll("#shopRowBottom .buttonContainer");
			for (var i=0; i<elem.length; i++){
				var inputelem = elem[i].querySelector("input")
				if (inputelem) {
					inputelem.removeAttribute('disabled');
					inputelem.style.setProperty('cursor', "pointer");
				}
				c.removeClass(elem[i],"disabledButton");
			}
		},
		deactivateContinueButtons: function(){
			var c = Extension.Common,
				elem;
			if (this.deactivatebuttontimer)
				clearTimeout(this.deactivatebuttontimer);
			//M2
			elem = document.querySelector("#checkoutButtonBoxTop .ui-submit");
			if (elem) c.addClass(elem,"ui-disabled");

			elem = document.querySelectorAll("#checkoutButtonBoxBottom .ui-submit");
			for (var i=0; i<elem.length; i++) c.addClass(elem[i],"ui-disabled");

			elem = document.querySelectorAll(".buttonContainer .ui-submit");
			for (var i=0; i<elem.length; i++) c.addClass(elem[i],"ui-disabled");

			//IRW
			elem = document.querySelectorAll(".boxContent.saveNContinueButton .buttonContainer");
			for (var i=0; i<elem.length; i++){
				var inputelem = elem[i].querySelector("input");
				if (inputelem) {
					inputelem.setAttribute('disabled', 'disabled');
					inputelem.style.setProperty('cursor', "default");
				}
				c.addClass(elem[i],"disabledButton");
			}

			//IRW
			elem = document.querySelectorAll("#shopRowBottom .buttonContainer");
			for (var i=0; i<elem.length; i++){
				var inputelem = elem[i].querySelector("input")
				if (inputelem) {
					inputelem.setAttribute('disabled', 'disabled');
					inputelem.style.setProperty('cursor', "default");
				}
				c.addClass(elem[i],"disabledButton");
			}
		},
		toggleDeliveryType: function(dt, sender) {
			var c = Extension.Common,
				elem,
				deltype,
				runToggle = true;
			if (this.cookie.dt == dt) {
				elem = document.getElementById("ext-cont-" + dt + "-radio-heading-input");
				if (elem) var checked = elem.checked;
				if (checked) runToggle = false;
			}

			if (runToggle) {
				
				if (this.activePage == "cart") deltype = ["hs", "pp", "cc"];
				if (this.activePage == "address") deltype = ["pp", "oa"];
				
				for (var i=0; i<deltype.length; i++){
					//Show all info if not Accordion
					if (this.accordionList == "false"){
						c.addClass(document.getElementById("ext-cont-" + deltype[i]), "ext-show");
						c.addClass(document.getElementById("ext-" + deltype[i] + "-calc-heading-lower"), "ext-show");
					}

					//If not current deliverytype and not deliverytype other address
					if (deltype[i] !== dt && deltype[i] !== "oa"){
						c.removeClass(document.getElementById("ext-" + deltype[i] + "-result"), "ext-show");
					}

					//If deliverytype is any other than current
					if (deltype[i] !== dt){
						var elem = document.getElementById("ext-cont-" + deltype[i] + "-radio-heading-input");
						if (elem){
							var checked = elem.checked;
							if (checked) {
								this.setInfoCookie('{"zc":"","na":"","dt":"' + dt + '","ex": "' + Extension.FreightCalc.cookie.ex + '"}');
								if (this.activePage == "cart"){
									this.clearZipCodeForTransfer ();
									this.cleardeliveryAddressDifferentForTransfer();
									this.clickCollectAdjustments(dt);
								}
								if (this.activePage == "address"){
									this.otherAddressAdjustments(dt);
								}
							}
						}

						//Fade text of inactive selections
						var elem = document.getElementById("ext-" + deltype[i] + "-calc-heading-lower");
						if (elem) elem.style.setProperty("color", "#ccc");
						var elem = document.getElementById("ext-" + deltype[i] + "-result-restriction-cont");
						if (elem) elem.style.setProperty("color", "#ccc");
						if (this.activePage == "address"){
							var elem = document.getElementById("ext-cont-oa");
							if (elem) c.removeClass(elem, "ext-show")
							if (checked) this.otherAddressAdjustments(dt);
						}

						if (this.accordionList == "true"){
							c.removeClass(document.getElementById("ext-cont-" + deltype[i]), "ext-show");
							c.removeClass(document.getElementById("ext-" + deltype[i] + "-calc-heading-lower"), "ext-show");
						}
					}
				} //For
				
				//Toggle on off calculate button
				if (Extension.FreightCalc.settings.calculatebutton){
					this.calcButtonValidate();
					var elem = document.getElementById("ext-hs-calculate-button");
					if (elem) Extension.Common.removeClass(elem, "ext-show");
				}

				var elem = document.getElementById("ext-" + dt + "-calc-heading-lower");
				if (elem) elem.style.setProperty("color", "black");
				var elem = document.getElementById("ext-" + dt + "-result-restriction-cont");
				if (elem) elem.style.setProperty("color", "black");
				if (this.activePage == "address" && dt == "oa"){
					var elem = document.getElementById("ext-cont-oa")
					if (elem) c.addClass(elem, "ext-show")
				}

				c.addClass(document.getElementById("ext-cont-" + dt), "ext-show");
				c.addClass(document.getElementById("ext-" + dt + "-calc-heading-lower"), "ext-show");

				if (sender == "manual") {
					var elem = document.getElementById("ext-cont-" + dt + "-radio-heading-input");
					if (elem) {
						var checked = elem.checked;
						if (checked) {
							this.setInfoCookie('{"zc":"","na":"","dt":"' + dt + '","ex":"' + Extension.FreightCalc.cookie.ex + '"}');
							if (this.activePage == "cart") {
								this.clearZipCodeForTransfer ();
								this.cleardeliveryAddressDifferentForTransfer();
								this.clickCollectAdjustments(dt);
							}
							if (this.activePage == "address") {
								var addressadjustment = dt;
							}
						}
					}
				}

				//Reset prices on change of delivery type
				this.revertPrices();

				if (this.activePage == "cart") {
					c.removeClass(document.getElementById("ext-ex-result"), "ext-show");
					c.removeClass(document.getElementById("ext-hs-result-restriction-cont"), "ext-show");

					//Deactivate continuebuttons for pickuppoints and click & collect locations until selection has been made
					if(dt == "cc" || dt == "pp")
						Extension.FreightCalc.deactivateContinueButtons();
					else {
						if (Extension.FreightCalc.settings.forcezipcodeentry)
							Extension.FreightCalc.deactivateContinueButtons();
						else
							Extension.FreightCalc.activateContinueButtons();
					}
					//Show red error text on deltype change
					if (dt == "pp"){
						Extension.Common.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
						Extension.Common.addClass(document.getElementById("ext-pp-button-text-error-klarna"), "ext-show");						
					}
					if (dt == "cc"){
						Extension.Common.addClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
						Extension.Common.addClass(document.getElementById("ext-cc-button-text-error-klarna"), "ext-show");
					}

					if (dt == "hs") {
						if (Extension.FreightCalc.settings.forcezipcodeentry){
							Extension.Common.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
							Extension.Common.addClass(document.getElementById("ext-ex-button-text-error"), "ext-show");
							Extension.Common.addClass(document.getElementById("ext-hs-button-text-error-klarna"), "ext-show");
							Extension.Common.addClass(document.getElementById("ext-ex-button-text-error-klarna"), "ext-show");
						}
					}

					//Show correct continue button
					this.toggleShownButton(dt);

					//Show stored result
					if (Extension.FreightCalc.resultstore[dt]) {
						Extension.FreightCalc.resultstore[dt].nodelay = true;
						if (dt == "hs" || dt == "pp"){
							//Reset prices before loading new prices
							Extension.FreightCalc.revertPrices();

							//Deactivate all input and continue buttons
							//Extension.FreightCalc.deactivateAll();

							if (Extension.FreightCalc.activePage == "cart"){
								//Setting up input to the address page
								Extension.FreightCalc.setZipCodeForTransfer(Extension.FreightCalc.resultstore[dt].data.zc);
								if (dt == "pp") Extension.FreightCalc.setdeliveryAddressDifferentForTransfer();
								else Extension.FreightCalc.cleardeliveryAddressDifferentForTransfer();
							}

							if (dt == "hs"){
								var delres = Extension.FreightCalc.checkDeliveryRestrictions(Extension.FreightCalc.resultstore[dt].data.zc);
								if (Extension.Common.varExist(delres)) {
									document.getElementById("ext-hs-result-restriction").innerHTML = delres.restriction;
									Extension.Common.addClass(document.getElementById("ext-hs-result-restriction-cont"), "ext-show");
								} else
									Extension.Common.removeClass(document.getElementById("ext-hs-result-restriction-cont"), "ext-show");
							}

							var elem = document.querySelectorAll(".ikea-product-pricetag-error");
							for (var i=elem.length-1; i>-1; i--)
								Extension.Element.remove(elem[i]);

							Extension.FreightCalc.loadDeliveryDetail(Extension.FreightCalc.resultstore[dt]);
						} else if (dt == "cc"){

							Extension.FreightCalc.clickcollectcarturl = Extension.FreightCalc.resultstore[dt].response.responseJSON.target;
							Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-faded");

							// Date and price
							var elem = document.getElementById("ext-calc-cc-result-delivery-date");
							if (elem) elem.innerHTML = "";
							var elem = document.getElementById("ext-calc-cc-result-price");
							if (elem) elem.innerHTML = Extension.Translation.data.freight.clickcollectprice;

							Extension.FreightCalc.setPickingPrices();
							Extension.Common.addClass(document.getElementById("ext-cc-result"), "ext-show");
							Extension.Common.removeClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
							Extension.FreightCalc.activateContinueButtons();
							var data = Extension.FreightCalc.resultstore[dt].data;
							Extension.FreightCalc.setInfoCookie('{"zc":"' + data.zc + '","na":"' + data.na + '","dt":"' + data.dt + '","ex":"' + Extension.FreightCalc.cookie.ex + '"}');
						}
					}
				}


				//Hide errors when delivery type changes
				if (this.activePage == "cart") {
					c.removeClass(document.getElementById("ext-calc-hs-result-error-div"), "ext-show");
					c.removeClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
				}
				c.removeClass(document.getElementById("ext-calc-pp-result-error-div"), "ext-show");


				var elem = document.getElementById("ext-cont-" + Extension.FreightCalc.cookie.dt + "-radio-heading-input");
				if (elem) elem.checked = true;
			}

			if (addressadjustment)
				this.otherAddressAdjustments(addressadjustment);
		},
		checkPickupPoints: function(data, callback) {
			if (Extension.FreightCalc.settings.pickuppoints){
				var c = Extension.Common;
				if (data.na.length > 0) {
					callback(true);
				} else {
					var pp = this.data.pickuppoints;
					for (var i=0; i<pp.length; i++){
						if (c.varExist(pp[i].zipcode, true)){
							if (pp[i].zipcode == data.zc) {
								//stopShippingCalc = "true";
								document.getElementById("ext-hs-input-lower-field").value = "";
								document.getElementById("ext-pp-input-lower-field").focus();
								document.getElementById("ext-pp-option_" + pp[i].zipcode).setAttribute("selected", "true");

								this.toggleDeliveryType("pp", "auto");
								this.calculateShipping({
									zc: pp[i].zipcode,
									na:  pp[i].name,
									dt: 'pp',
									ex: Extension.FreightCalc.cookie.ex,
									system: "irw"
								});
								return false;
							}
						}
					}
					callback(true);
				}
			} else callback(true);
		},
		checkDeliveryRestrictions: function(zc){
			if (Extension.FreightCalc.settings.deliveryrestrictions){
				var dr = Extension.FreightCalc.data.deliveryrestrictions;
				for (var i=0; i<dr.length; i++){
					if (zc == dr[i].zipcode) return dr[i];
				}
			}
		},
		checkParcelFreightCalcRestriction: function() {
			if (Extension.FreightCalc.settings.parcelcheck){
				Extension.FreightCalc.priceCheck({
					zipcode: Extension.FreightCalc.settings.parcelcheckzipcode,
					success: function(data){
						var parcel = false,
							pcw = Extension.FreightCalc.settings.parcelcheckwords,
							pdm = data.responseJSON[1][0].preDelMethod;
						for (var i=0; i<pcw.length; i++){
							if (pdm.indexOf(pcw[i]) > -1)
								parcel = true;
						}
						if (parcel) {
							c.addClass(document.getElementById("ext-pp-result-restriction-cont"), "ext-show");
						}
					}
				});
			}
		},
		freightCalcLoaders: {
			show: function(selector){
				if (!selector) selector = ".ext-freightcalc-loader";
				var elem = document.querySelectorAll(selector);
				for (var i=0; i<elem.length; i++){
					Extension.Common.addClass(elem[i], "ext-show");
				}
			},
			hide: function(selector){
				if (!selector) selector = ".ext-freightcalc-loader";
				var elem = document.querySelectorAll(selector);
				for (var i=0; i<elem.length; i++){
					Extension.Common.removeClass(elem[i], "ext-show");
				}
			}
		},
		calculateShipping: function(data) {

			//Check the zipcode, if it is a pickuppoint reload function as that pickuppoint
			Extension.FreightCalc.checkPickupPoints(data, function() {

				Extension.FreightCalc.getFreightPrices({
					zipcode: data.zc,
					system: data.system || "all",
					loading: function(response){
						//Add faded to result
						Extension.Common.addClass(document.getElementById("ext-" + data.dt + "-result"), "ext-faded");

						//Hide error
						Extension.Common.removeClass(document.getElementById("ext-calc-" + data.dt + "-result-error-div"), "ext-show");

						//Reset prices before loading new prices
						Extension.FreightCalc.revertPrices();

						//Hide express delivery result
						Extension.Common.removeClass(document.getElementById("ext-ex-result"), "ext-show");
						//Deactivate all input and continue buttons
						Extension.FreightCalc.deactivateAll();
						if (data.dt == "pp" || Extension.FreightCalc.settings.forcezipcodeentry){
							Extension.Common.removeClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
							Extension.Common.removeClass(document.getElementById("ext-ex-button-text-error"), "ext-show");
							Extension.Common.removeClass(document.getElementById("ext-pp-button-text-error-klarna"), "ext-show");
						}

						if (Extension.FreightCalc.activePage == "cart"){
							if (Extension.Common.varExist(document.updateAllForm))
								document.updateAllForm.calculateClicked.value = "yes";

							//Setting up input to the address page
							Extension.FreightCalc.setZipCodeForTransfer(data.zc);
							if (data.dt == "pp") Extension.FreightCalc.setdeliveryAddressDifferentForTransfer();
							else Extension.FreightCalc.cleardeliveryAddressDifferentForTransfer();
						}

						//Hide all loading animations
						Extension.FreightCalc.freightCalcLoaders.hide();
						//Show current loading animation
						Extension.FreightCalc.freightCalcLoaders.show("#ext-" + data.dt + "-input-lower-div .ext-freightcalc-loader");

						var delres = Extension.FreightCalc.checkDeliveryRestrictions(data.zc);
						if (Extension.Common.varExist(delres)) {
							document.getElementById("ext-hs-result-restriction").innerHTML = delres.restriction;
							Extension.Common.addClass(document.getElementById("ext-hs-result-restriction-cont"), "ext-show");
						} else
							Extension.Common.removeClass(document.getElementById("ext-hs-result-restriction-cont"), "ext-show");

						var elem = document.querySelectorAll(".ikea-product-pricetag-error");
						for (var i=elem.length-1; i>-1; i--)
							Extension.Element.remove(elem[i]);
						if (data.dt == "hs")
							Extension.FreightCalc.expressdeliverycarturl = undefined;

					},
					success: function(response){
						setTimeout(function() {
							var transfer = {
								data: data,
								response: response
							};
							Extension.FreightCalc.resultstore[data.dt] = transfer;
							if (response.ibes.success)
								Extension.FreightCalc.expressdeliverycarturl = response.ibes.responseJSON.target;
							Extension.FreightCalc.loadDeliveryDetail(transfer);
							Extension.FreightCalc.toggleShownButton(transfer.data.dt);
						}, 1000);
					},
					failure: function(response){
						var transfer = {
							data: data,
							response: response
						};
						Extension.FreightCalc.resultstore[data.dt] = undefined;
						Extension.FreightCalc.loadDeliveryError(transfer);
					},
					exception: function(response){
						Extension.FreightCalc.activateAll();
						if (input.data.dt !== "pp" && input.data.dt !== "cc")
							Extension.FreightCalc.activateContinueButtons();

						Extension.FreightCalc.freightCalcLoaders.hide();

						var operationCode = -1;
						if (response.irw) response.irw = response.irw.responseText || "no response text";

						var errMsgDiv = document.getElementById('ext-calc-' + data.dt + '-result-error-span');
						errMsgDiv.innerHTML = t.data.freight.generalerrortext;
						Extension.Common.removeClass(document.getElementById("ext-" + data.dt + "-result"), "ext-faded");
						Extension.Common.removeClass(document.getElementById("ext-" + data.dt + "-result"), "ext-show");
						setTimeout(function(){
							Extension.Common.addClass(document.getElementById("ext-calc-" + data.dt + "-result-error-div"), "ext-show");
						}, 600);
						// for statistics
						if (Extension.Common.varExist(document.updateAllForm)) {
							document.updateAllForm.errCodeForCalculateBtn.value = operationCode;

							if (Extension.Common.isFunction(irwstatSend))
								irwstatSend();
						}
					}
				}, data);

			});
		},

		getPickupPoint: function(zc){
			var c = Extension.Common,
				pp = this.data.pickuppoints;
			for (var i=0; i<pp.length; i++){
				if (c.varExist(pp[i].zipcode)){
					if (pp[i].zipcode == zc)
						return pp[i];
				}
			}
		},
		toggleExpress: function(dt) {
			//Force click checkbox to stay selected
			var elem = document.getElementById("ext-" + dt + "-result-checkbox-input");
			if (elem)
				elem.checked = true;

			var dt_other = "ex",
				express = false;
			if(dt == "ex"){
				var dt_other = "hs";
				express = true;
			}
			this.setInfoCookie('{"zc":"' + this.cookie.zc + '","na":"' + this.cookie.na + '","dt":"' + this.cookie.dt + '","ex":"' + express + '"}');

			var elem = document.getElementById("ext-" + dt_other + "-result-checkbox-input");
			if (elem)
				elem.checked = false;


			if(dt == "ex"){
				this.resultstore.hs.data.ex = "true";
				this.changePrices(this.pricesexpress);
			} else {
				this.resultstore.hs.data.ex = "false";
				this.changePrices(this.pricesregular);
			}
			this.toggleShownButton(dt);
		},
		expressdeliveryCheckout: function(){
			//Send customer to express delivery checkout
			if (Extension.FreightCalc.expressdeliverycarturl){
				window.location.href = Extension.FreightCalc.expressdeliverycarturl;
			} else {
				//errorhandler
			}
		},
		clickcollectCheckout: function(){
			//Send customer to click & collect checkout
			if (Extension.FreightCalc.clickcollectcarturl){
				window.location.href = Extension.FreightCalc.clickcollectcarturl;
			} else {
				//errorhandler
			}
		},
		Klarna: {
			checkout: function(deliverytype){
				var deviceType = "desktop";
				if (Extension.FreightCalc.mobileCheckout()) deviceType = "mobile";
				
				//Add familycard popup here 
				var transfer = {
					familyCardStatus: "ok"
				} //override
				
				var payload = {
					country: Extension.FreightCalc.settings.klarna.country,
					deviceType: deviceType,
					cart: [],
					zip: document.getElementById("ext-hs-input-lower-field").value,
					pickupZip: "",
					shipping_options: [{
						id: "1",
						name: "",
						description: "",
						price: 0,
						tax_amount: 0,
						tax_rate: 0
					}]
				}

				if (deliverytype == "hs" && Extension.FreightCalc.parcel)
					deliverytype = "hs-parcel";
				
				var all_good = false;
				if (deliverytype == "hs"){
					//HOME SHIPPING - Truck

					payload.shipping_options[0].name = "Levering innenfor dør"

					//Add questionnaire popup here 
					payload.shippingDetails = {
						inburen: {
							type: "enebolig",
							1: "KLARNA",
							2: {
								selection: true,
								comment: "KLARNA"
							}
						}
					}
					all_good = true;

				} else if (deliverytype == "hs-parcel"){
					//HOME SHIPPING - Parcel

					payload.shipping_options[0].name = "Postpakke"
					all_good = true;

				} else if (deliverytype == "ex"){
					//EXPRESS DELIVERY

				} else if (deliverytype == "pp"){
					//PICKUP POINT

					var elem = document.getElementById("ext-pp-input-lower-field");
					if (elem && elem.selectedIndex > 1){
						payload.pickupZip = JSON.parse(elem.options[elem.selectedIndex].value).zc;
						payload.shippingDetails = {
							Pickup: {
								location: elem.options[elem.selectedIndex].text
							}
						}
						payload.shipping_options[0].name = "Pick-up Point" + payload.shippingDetails.Pickup.location;
						all_good = true;
					}

				} else if (deliverytype == "cc"){
					//CLICK & COLLECT

				}

				if (all_good){
					payload = this.createJson(payload, transfer);
					if (payload) this.sendPayload(payload);
					//else this.klarnaError;
				} //else this.sendToNormalCheckout;
			},
			
			createJson: function(payload, transfer) {
				var productsInCart = document.querySelectorAll('#updateAllForm .productRow'); //#updateAllForm .productRow
				if (productsInCart.length > -1) {
					var jsonProducts = [];
					var isFamilyPrice = false;
					
					for (var i = 0; i < productsInCart.length; i++) {
						var product = productsInCart[i];
						var j = i + 1;
						var unitPrice, totalAmount, elem;
						
						if (payload.deviceType == "desktop"){

							var productNumber = document.querySelector('#prodId_' + j).value;
							var productName = product.querySelector('.prodName a').innerHTML.replace(/\s{2,}/g, "");
							var quantity = document.querySelector('#order_qty_' + j).value;
							
							
							elem = product.querySelector('.prodInfoContainer .colPrice .familyPrice');
							if (elem && transfer.familyCardStatus == 'ok') {
								isFamilyPrice = true;
								unitPrice = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							} else if (elem) {
								elem = product.querySelector('.prodInfoContainer .colPrice .regularPrice')
								if (elem) unitPrice = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							} else {
								elem = product.querySelector('.prodInfoContainer .colPrice');
								if (elem) unitPrice = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							}
							
							elem = product.querySelector('.colTotalPrice .familyPrice');
							if (elem && transfer.familyCardStatus == 'ok') 
								totalAmount = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							else if (elem) {
								elem = product.querySelector('.colTotalPrice .regularPrice')
								if (elem) totalAmount = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							} else {
								elem = product.querySelector('.colTotalPrice');
								if (elem) totalAmount = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							}
							
							var productUrl = 'http://www.ikea.com' + ExtensionSetting.Country.homePath + 'catalog/products/' + productNumber;

						} else if (payload.deviceType == "mobile"){

							var productNumber = document.querySelector('#prodId_' + j).value;
							var productName = product.querySelector('.productName').innerHTML.replace(/\s{2,}/g, "");
							var quantity = document.querySelector('#order_qty_' + j).value;
							
							
							elem = product.querySelector('.ikea-product-pricetag-price .familyPrice');
							if (elem && transfer.familyCardStatus == 'ok') {
								isFamilyPrice = true;
								unitPrice = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							} else if (elem) {
								elem = product.querySelector('.ikea-product-pricetag-normal .productPrice')
								if (elem) totalAmount = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							} else {
								elem = product.querySelector('.ikea-product-pricetag-price .productPrice');
								if (elem) unitPrice = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							}
							
							elem = product.querySelector('.totalPrice .ikea-product-pricetag-family');
							if (elem && transfer.familyCardStatus == 'ok') 
								totalAmount = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							else {
								elem = product.querySelector('.totalPrice .ikea-product-pricetag-normal');
								if (elem) totalAmount = Extension.Common.toInt({value: elem.innerHTML, format: "price"});
							}
							
							var productUrl = 'http://www.ikea.com' + ExtensionSetting.Country.homePath + 'catalog/products/' + productNumber;
						}

						jsonProducts.push({
							type: 'physical',
							reference: productNumber,
							name: productName,
							quantity: quantity,
							unit_price: this.adaptPriceForKlarna(unitPrice),
							tax_rate: 0,
							total_amount: this.adaptPriceForKlarna(totalAmount),
							total_discount_amount: 0,
							total_tax_amount: 0,
							product_url: productUrl
						});
					}
					payload.cart = jsonProducts;

					if (payload.deviceType == "desktop") var shippingPrice = Extension.Common.toInt({value: document.querySelector('#txtTotalDeliveryBottom').innerHTML, format: "price"});
					if (payload.deviceType == "mobile") var shippingPrice = Extension.Common.toInt({value: document.querySelector('#txtTotalDeliveryBottom span').innerHTML, format: "price"});
					payload.shipping_options[0].price = this.adaptPriceForKlarna(shippingPrice);
					
					return payload;
				}
			},
			sendPayload: function(payload){
				// Create form with JSON and send it to the payment page.
				var form = document.createElement('form');
				form.method = 'post';
				if (payload.deviceType == "desktop") form.action = Extension.FreightCalc.settings.klarna.submitUrlIRW;
				if (payload.deviceType == "mobile") form.action = Extension.FreightCalc.settings.klarna.submitUrl;
				
				// Encode JSON to be able to POST to the payment page.
				payload = JSON.stringify(payload);
				payload = encodeURIComponent(payload);

				var elempayload = document.createElement('input');
				elempayload.type = 'hidden';
				elempayload.value = payload;
				elempayload.name = 'klarna-json';
				
				form.appendChild(elempayload);
				document.body.appendChild(form);
				
				form.submit();
			},
			adaptPriceForKlarna: function(floatNr) {
				if (floatNr > 0) floatNr = floatNr * 100;
				return floatNr;
			}
		},
		priceCheck: function(input, context){
			input.state = input.state || "null";			

			var baseDeliveryDetail = location.protocol + "//" + document.location.host + "/webapp/wcs/stores/servlet/IrwWSDeliveryDetail?zipCode=" + input.zipcode + "&state=" + input.state + "&storeId=" + ExtensionSetting.Country.storeId + "&langId=" + ExtensionSetting.Country.langId + "&priceexclvat=";
			if (this.checkPvatInput() == "true") baseDeliveryDetail = baseDeliveryDetail + this.checkPvatInput();

			if (Extension.Common.isFunction(input.loading))
				input.loading(context);

			var response = new Extension.Common.xhr();
			var DONE = 4;
			var OK = 200;
			response.context = context;
			response.overrideMimeType("application/json");
			response.open('POST', baseDeliveryDetail, true);
			response.onreadystatechange = function() {
				if (response.readyState === DONE) {
					try{
						if (response.status === OK) {
							response.responseJSON = JSON.parse(response.responseText);
							var operationCode = parseInt(response.responseJSON[0][0].code);
							var operationSuccess = (operationCode == 0);
							if (operationSuccess) {
								if (Extension.Common.isFunction(input.success))
									input.success(response, context);
							} else {
								if (Extension.Common.isFunction(input.failure))
									input.failure(response, context);
							}
						} else {
							if (Extension.Common.isFunction(input.failure))
								input.failure(response, context);
						}
					} catch (err) {
						if (Extension.Common.isFunction(input.exception))
							input.exception(response, context);
					}

					if (Extension.Common.isFunction(input.complete))
						input.complete(response, context);
				}
			}
			response.send(null);
		},
		getFreightPrices: function(input, context) {
			var combinedResponse = {};

			if (Extension.Common.isFunction(input.loading))
				input.loading(context);
			
			if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
				var s = input.zipcode.split("|");
				if (s.length == 2){
					input.state = s[0];
					input.zipcode = s[1];
				}
			}
			input.system = input.system || "all"
			
			if (input.system == "irw" || input.system == "all"){
				Extension.FreightCalc.priceCheck({
					state: input.state,
					zipcode: input.zipcode,
					success: function(data){
						data.success = true;
						combinedResponse.irw = data;
					},
					failure: function(data){
						data.success = false;
						combinedResponse.irw = data;
					}
				});
			} else combinedResponse.irw = {success: false};

			if (input.system == "ibes" || input.system == "all"){
				Extension.IBES.sendPayloadJsonp({
					service: "express",
					selector: "#ext-hs-input-lower-field",
					success: function(data){
						data.success = true;
						combinedResponse.ibes = data;
					},
					failure: function(data){
						data.success = false;
						combinedResponse.ibes = data;
						//console.log(Extension.IBES.getErrorMessageByErrorCode(data.code));
					}
				});
			} else combinedResponse.ibes = {success: false};

			var toolate = false;
			var timeout = setTimeout(function(){
				Extension.FreightCalc.activateAll();
				//if (input.data.dt !== "pp" && input.data.dt !== "cc")
					Extension.FreightCalc.activateContinueButtons();

				Extension.FreightCalc.freightCalcLoaders.hide();

				clearInterval(checkvar);
				toolate = true;
			},10000);

			var checkvar = setInterval(function(){
				if (Extension.Common.varExist(combinedResponse.irw) && Extension.Common.varExist(combinedResponse.ibes)){
					clearTimeout(timeout);
					clearInterval(checkvar);
					if (!toolate){
						if (combinedResponse.irw.success || combinedResponse.ibes.success){
							if (Extension.Common.isFunction(input.success))
								input.success(combinedResponse, context);
						} else {
							if (Extension.Common.isFunction(input.failure))
								input.failure(combinedResponse, context);
						}
					} else {
						if (Extension.Common.isFunction(input.failure))
							input.failure(combinedResponse, context);
					}
					if (Extension.Common.isFunction(input.complete))
						input.complete(combinedResponse, context);
				}
			}, 20);


		},
		loadDeliveryDetail: function (input) {
			var c = Extension.Common,
				e = Extension.Element,
				p = Extension.FreightCalc,
				t = Extension.Translation;
			var elem;
			var type = "int"
			if (ExtensionSetting.Country.numeric.decimalsum)
				type = "float";
			
			p.pricedetails = input.response.irw.responseJSON[1][0];
			p.pricedetails.clickcollectprice = t.data.freight.clickcollectprice;
			p.pricedetails.clickcollecttotalPrice = p.addPrices(p.pricedetails.clickcollectprice, p.pricedetails.totalPrice);
			p.pricedetails.clickcollecttotalFamilyPrice = p.addPrices(p.pricedetails.clickcollectprice, p.pricedetails.totalFamilyPrice);

			p.activateAll();
			p.activateContinueButtons();
			c.removeClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
			c.removeClass(document.getElementById("ext-ex-button-text-error"), "ext-show");
			c.removeClass(document.getElementById("ext-hs-button-text-error-klarna"), "ext-show");
			c.removeClass(document.getElementById("ext-ex-button-text-error-klarna"), "ext-show");
			c.removeClass(document.getElementById("ext-pp-button-text-error-klarna"), "ext-show");

			if (this.activePage == "cart"){
				elem = document.querySelectorAll('.tblShoppingCart td');
				for (var i=0; i<elem.length; i++) {
					if (c.varExist(elem[i], true)) e.remove(elem[i]);
					if (elem[i].className && elem[i].className == 'colProduct outOfStockItem') elem[i].className = 'colProduct';
					if (elem[i].className && elem[i].className == 'colOutOfStockErr') e.remove(elem[i]);
					if (elem[i].className && (elem[i].className == 'colPrice' ||  elem[i].className == 'colQuantity' ||  elem[i].className == 'colTotalPrice')) elem[i].style.setProperty("display", "block");
				}

				var errorMsg = document.getElementById("errorMsg");
				if (errorMsg) errorMsg.style.setProperty("display", "none");

			}

			if (this.activePage == "address"){
				var customerType = this.checkCustomerType();
				var fields= ["zipCode", "city", "address1", "address2"];
				var pp = this.getPickupPoint(input.data.zc);
				if (pp) {
					var pupdata = [pp.zipcode, pp.name, pp.address, pp.addressaddon];
					for (var i=0; i<fields.length; i++) {
						elem = document.querySelector("#signup_checkout_" + customerType + "_ship_" + fields[i]);
						if (elem) {
							elem.value = pupdata[i];
							if (window.irwDoFieldValidation) window.irwDoFieldValidation({target: elem});
						}
					}
				}
			}

			//Hide the loader animation
			p.freightCalcLoaders.hide();

			Extension.FreightCalc.parcel = false;
			var preShippingCost = "";
			var preDelTimeSlotStart = "";
			if (input.response.irw.responseJSON[0][0].code == 0) {
				preDelTimeSlotStart = input.response.irw.responseJSON[1][0].preDelTimeSlotStart;

				//if (input.data.dt == "hs") document.getElementById("ext-calc-" + input.data.dt + "-result-zc").innerHTML = input.data.zc;
				//document.getElementById("ext-calc-" + input.data.dt + "-result-na").innerHTML = input.data.na;
				document.getElementById("ext-calc-" + input.data.dt + "-result-delivery-date").innerHTML = preDelTimeSlotStart;

				if (p.checkPvatInput() == "true") preShippingCost = input.response.irw.responseJSON[1][0].preShippingCostExclVAT;
				else preShippingCost = input.response.irw.responseJSON[1][0].preShippingCost;

				document.getElementById("ext-calc-" + input.data.dt + "-result-price").innerHTML = preShippingCost;

				//Check if delivery is parcel
				var parcel = false,
					pcw = Extension.FreightCalc.settings.parcelcheckwords,
					pdm = input.response.irw.responseJSON[1][0].preDelMethod;
				for (var i=0; i<pcw.length; i++){
					if (pdm.indexOf(pcw[i]) > -1)
						parcel = true;
				}
				Extension.FreightCalc.parcel = parcel;
				
				

				if (Extension.FreightCalc.activePage == "cart"){

					if (parcel) {
						document.getElementById("ext-hs-result-img").innerHTML = '<img class=\"ext-result-img\" src="' + t.data.freight.parceldeliveryresultimg + '" />';
						document.getElementById("ext-hs-result-text-1").innerHTML = t.data.freight.parceldeliveryresulttext1;
						document.getElementById("ext-hs-result-text-2").innerHTML = t.data.freight.parceldeliveryresulttext2;
						document.getElementById("ext-hs-result-text-3").innerHTML = t.data.freight.parceldeliveryresulttext3;
						document.getElementById("ext-hs-result-text-4").innerHTML = t.data.freight.parceldeliveryresulttext4;
					} else {
						document.getElementById("ext-hs-result-img").innerHTML = '<img class=\"ext-result-img\" src="' + t.data.freight.homeshippingresultimg + '" />';
						document.getElementById("ext-hs-result-text-1").innerHTML = t.data.freight.homeshippingresulttext1;
						document.getElementById("ext-hs-result-text-2").innerHTML = t.data.freight.homeshippingresulttext2;
						document.getElementById("ext-hs-result-text-3").innerHTML = t.data.freight.homeshippingresulttext3;
						document.getElementById("ext-hs-result-text-4").innerHTML = t.data.freight.homeshippingresulttext4;
					}
					this.pricesregular = {
						freightprice: input.response.irw.responseJSON[1][0].preShippingCost,
						totalprice: input.response.irw.responseJSON[1][0].totalPrice,
						totalfamilyprice: input.response.irw.responseJSON[1][0].totalFamilyPrice,
						freightprice_exvat: input.response.irw.responseJSON[1][0].preShippingCostExclVAT,
						totalprice_exvat: input.response.irw.responseJSON[1][0].totalPriceExclVAT,
						totalfamilyprice_exvat: input.response.irw.responseJSON[1][0].totalFamilyPriceExclVat,
					}
				}

				c.removeClass(document.getElementById("ext-" + input.data.dt + "-result"), "ext-faded");
				if (input.nodelay)
					c.addClass(document.getElementById("ext-" + input.data.dt + "-result"), "ext-show");
				else {
					setTimeout(function(){
						c.addClass(document.getElementById("ext-" + input.data.dt + "-result"), "ext-show");
					}, 600);
				}

				//Express delivery

				if (this.activePage == "cart" && input.data.dt == "hs"){
					var addexpress = false,
						freightprice;

					if (input.response.ibes.success && !parcel){

						//Zone pricing
						if (this.data.lcdprices){
							if (this.data.lcdprices.activepricing == "fixed"){
								var fixed = this.data.lcdprices.fixed;
								if (fixed){
									freightprice = c.toInt({value: fixed, format: "price"});
									addexpress = true;
								}
							}
							if (this.data.lcdprices.activepricing == "zipcode_fixed"){
								var zipcode_fixed = this.data.lcdprices.zipcode_fixed;
								if (zipcode_fixed){
									for (var i=0; i<zipcode_fixed.length; i++){
										if (c.varExist(zipcode_fixed[i].zipcode, true) && c.varExist(zipcode_fixed[i].price, true)){
											var zipcode = zipcode_fixed[i].zipcode.split(",");
											for (var j=0; j<zipcode.length; j++){
												if (zipcode[j] == input.data.zc){
													freightprice = c.toInt({value: zipcode_fixed[i].price, format: "price"});
													addexpress = true;
												}
											}
										}
									}
								}
							}
							if (this.data.lcdprices.activepricing == "mirror_ccd"){
								//Mirror CCD pricing
								var mirror_ccd = this.data.lcdprices.mirror_ccd;
								if (mirror_ccd){
									freightprice = c.toInt({value: this.pricesregular.freightprice, format: "price"}) + c.toInt({value: mirror_ccd, format: "price"});
									addexpress = true;
								}
							}
							if (this.data.lcdprices.activepricing == "order_value"){
								//Mirror CCD pricing
								var order_value = this.data.lcdprices.order_value;
								
								if (order_value){
									freightprice = 0;
									var goodsvalue = c.toInt({value: this.pricesregular.totalprice, format: "price"}) - c.toInt({value: this.pricesregular.freightprice, format: "price"}) ;
									for (var i=order_value.length-1; i>-1; i--){
										if (!order_value[i].value || goodsvalue <= order_value[i].value)
											freightprice = order_value[i].price;
									}										
									addexpress = true;
								}
							}
						}

					}

					if (addexpress){
						//if (!t.data.freight.expressdeliveryresulttext2staticprice == "")
						c.removeClass(document.getElementById("ext-ex-result"), "ext-faded");
						if (input.nodelay)
							c.addClass(document.getElementById("ext-ex-result"), "ext-show");
						else {
							setTimeout(function(){
								c.addClass(document.getElementById("ext-ex-result"), "ext-show");
							}, 600);
						}

						//Set express delivery freight


						var totalprice = freightprice,
							totalfamilyprice = freightprice;
						elem = document.querySelector("#beginCheckoutBottom .shoppingSubTotalExlDelivery .nonfamilyPrice");
						if (!elem) elem = document.querySelector(".shoppingListPriceRow .shoppingSubTotalExlDelivery .nonfamilyPrice");
						if (!elem) elem = document.querySelector("#beginCheckoutFamilyBottom .shoppingSubTotalExlDelivery .nonfamilyPrice");
						if (elem) totalprice = Extension.Common.toInt({value: elem.innerHTML, format: "price"}) + freightprice;
						elem = document.querySelector("#beginCheckoutBottom .shoppingSubTotalExlDelivery .familyPrice");
						if (!elem) elem = document.querySelector(".shoppingListPriceRow .shoppingSubTotalExlDelivery .familyPrice");
						if (!elem) elem = document.querySelector("#beginCheckoutFamilyBottom .shoppingSubTotalExlDelivery .familyPrice");
						if (elem) totalfamilyprice = Extension.Common.toInt({value: elem.innerHTML, format: "price"}) + freightprice;


						this.pricesexpress = {
							freightprice: freightprice,
							totalprice: totalprice,
							totalfamilyprice: totalfamilyprice,
							freightprice_exvat: freightprice / 1.25,
							totalprice_exvat: totalprice / 1.25,
							totalfamilyprice_exvat: totalfamilyprice / 1.25,
						}
						var currentfreightprice = this.pricesexpress.freightprice;
						if(!this.mobileCheckout()){
							if (this.checkPvatInput() == "true") {
								currentfreightprice = this.pricesexpress.freightprice_exvat;
							}
						}
						var elem = document.getElementById("ext-calc-ex-result-price")
						if (elem) elem.innerHTML = c.formatNumber({value: currentfreightprice, type: type, format: "price"});


						if (input.data.ex == "true")
							this.toggleExpress("ex");
						else
							this.toggleExpress("hs");


					} else {
						this.toggleExpress("hs");
						input.data.ex = "false";
					}
				}
			}



			if (input.data.dt == "pp") {
				var pp = this.getPickupPoint(input.data.zc);
				if (pp) {
					if (c.varExist(pp.mapurl, true)){
						document.getElementById('ext-calc-pp-map-url').href = pp.mapurl;
					}
				}
			} else {
				var selection = {
					address: "",
					addressaddon: "",
					mapurl: ""
				};
			}
			this.setInfoCookie('{"zc":"' + input.data.zc + '","na":"' + input.data.na + '","dt":"' + input.data.dt + '","ex":"' + input.data.ex + '"}');


			if (this.activePage == "cart"){
				var elem;

				if (input.data.dt == "pp")
					this.changePrices(this.pricesregular);

				elem = document.querySelectorAll(".notYetCalc");
				for (var i=0; i<elem.length; i++){
					elem[i].style.setProperty("display", "none");
				}

				//Enable Continue to checkout button
				//Extension.FreightCalc.activateContinueButtons();
				//elem = document.getElementById("ext-hs-button");
				//if (elem)
				//    c.removeClass(elem, "disabledButton");


				elem = document.querySelectorAll(".calcError");
				for (var i=0; i<elem.length; i++) {
					if (elem[i].style.display != "none") elem[i].style.display = "none";
				}

				// for statistics
				if (input.response.irw.responseJSON[1][0].milliSecDelTime != '') document.updateAllForm.milliSecDelTime.value = input.response.irw.responseJSON[1][0].milliSecDelTime;
				else document.updateAllForm.milliSecDelTime.value = "0";

				if (c.varExist(document.updateAllForm)){
					//document.updateAllForm.milliSecDelTime.value = input.response[1][0].milliSecDelTime;
					document.updateAllForm.unFormattedShippingCost.value = input.response.irw.responseJSON[1][0].unFormatedPreShippingCost;
					document.updateAllForm.errCodeForCalculateBtn.value = "0";
					// First time while calculating the freight using AJAX call, we should set the zipCode to form so that
					// stats script will pick up the value and send it.
					if (!document.updateAllForm.zipCode) {
						var zipCodeNode = document.createElement('input');
						zipCodeNode.setAttribute('name', 'zipCode');
						zipCodeNode.setAttribute('type', 'hidden');
						zipCodeNode.setAttribute('id', 'zipCode');
						zipCodeNode.setAttribute('value', input.data.zc);
						document.getElementById('updateAllForm').appendChild(zipCodeNode);
					}
					irwstatSend();
				}
			}

			if (this.activePage == "address"){
				var elem;
				if(!this.mobileCheckout()){
					var freightprice = input.response.irw.responseJSON[1][0].preShippingCost;
					if (this.checkPvatInput() == "true") freightprice = input.response.irw.responseJSON[1][0].preShippingCostExclVAT;

					var elem = document.querySelector("#txtTotalDelivery span");
					if (elem) elem.innerHTML = freightprice;

					elem = document.querySelector("span#txtTotal") || document.querySelector("div#totalValue");
					if (elem) elem.innerHTML = this.addPrices(freightprice, elem.innerHTML);

					elem = document.querySelector("span#txtFamilyTotal") || document.querySelector("div#totalValueFamily");
					if (elem) elem.innerHTML = this.addPrices(freightprice, elem.innerHTML);

				}
			}

			elem = document.querySelectorAll(".notYetCalc");
			for (var i=0; i<elem.length; i++){
				elem[i].style.setProperty("display", "none");
			}

		},

		loadDeliveryError: function(input) {
			var c = Extension.Common,
				p = Extension.FreightCalc;
			var elem;
			this.activateAll();
			if (input.data.dt == "pp" || input.data.dt == "cc"){
				this.deactivateContinueButtons();
				c.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
				c.addClass(document.getElementById("ext-pp-button-text-error-klarna"), "ext-show");
			} else {
				if (Extension.FreightCalc.settings.forcezipcodeentry){
					this.deactivateContinueButtons();
					c.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
					c.addClass(document.getElementById("ext-ex-button-text-error"), "ext-show");
					c.addClass(document.getElementById("ext-hs-button-text-error-klarna"), "ext-show");
					c.addClass(document.getElementById("ext-ex-button-text-error-klarna"), "ext-show");
				} else
					this.activateContinueButtons();
			}

			var calcResultErrorSpan = document.getElementById('ext-calc-' + input.data.dt + '-result-error-span');
			calcResultErrorSpan.innerHTML = input.response.irw.responseJSON[0][0].msg;
			setTimeout(function(){
				Extension.Common.addClass(document.getElementById("ext-calc-" + input.data.dt + "-result-error-div"), "ext-show");
			}, 600);
			//Hide result dropdowns
			c.removeClass(document.getElementById("ext-" + input.data.dt + "-result"), "ext-faded");
			c.removeClass(document.getElementById("ext-" + input.data.dt + "-result"), "ext-show");

			//Hide express delivery result dropdown
			c.removeClass(document.getElementById("ext-ex-result"), "ext-faded");
			c.removeClass(document.getElementById("ext-ex-result"), "ext-show");

			//Hide loader animation
			p.freightCalcLoaders.hide();

			var errorMsg = document.getElementById("errorMsg");
			if (errorMsg) errorMsg.style.setProperty("display", "none");

			if (this.activePage == "address"){
				var customerType = this.checkCustomerType();
				var fields= ["zipCode", "city", "address1", "address2"];
				for (var i=0; i<fields.length; i++) {
					elem = document.querySelector("#signup_checkout_" + customerType + "_ship_" + fields[i]);
					if (elem) elem.value = "";
				}
			}

			if (this.activePage == "cart"){

				this.clearZipCodeForTransfer();
				this.cleardeliveryAddressDifferentForTransfer();

				/* START ITEM LEVEL ERROR MESSAGE */
				// Populates the nonBuybaleArticle array
				if (this.mobileCheckout()){
					var nonBuyableArticleArr = new Array();
					var itemLevelErrorMessage = "";
					//for (var i=0; i<)
					input.response.irw.responseJSON.forEach(function(object) {
						object.forEach(function(inObj) {
							if (inObj.nonBuyableArticles != undefined) {
								console.debug(inObj.nonBuyableArticles);
								var articles = "" + inObj.nonBuyableArticles;
								console.debug("Articles inside" + articles);
								if (articles.indexOf("_") != -1) {
									articles.split("_").forEach(function(article) {
										nonBuyableArticleArr.push(article)
									})
								} else {
									nonBuyableArticleArr.push(articles)
								}
								console.debug(nonBuyableArticleArr)
							}
							if (inObj.itemLevelErrorMessage != undefined) {
								itemLevelErrorMessage = inObj.itemLevelErrorMessage
							}
						})
					});
					nonBuyableArticleArr.forEach(function(nonBuyableArticle) {
						var nonBuyableArticleSelector = "li.itemNo" + nonBuyableArticle + " .ikea-product-pricetag-price";
						document.querySelectorAll(nonBuyableArticleSelector).forEach(function(object, index) {
							if (object.innerHTML.trim() == "") {
								var elem = document.createElement("div");
								elem.className = "ikea-product-pricetag-error";
								elem.innerHTML = itemLevelErrorMessage;
								object.parentNode.insertBefore(elem, object.nextSibling);
							}
						})
					});

				} else {

					var nonBuyableArticleArr = new Array();
					var preliminaryFreighCalcFailureMsg = '';
					var itemLevelErrorMessage = '';

					for (var i=0; i<input.response.irw.responseJSON.length; i++){
						for (var j=0; j<input.response.irw.responseJSON[i].length; j++){
							if (input.response.irw.responseJSON[i][j]['nonBuyableArticles'] != undefined) {
								var articles = '' + input.response.irw.responseJSON[i][j]['nonBuyableArticles'];
								if (articles.indexOf('_') != -1) {
									var artsplit = articles.split('_');
									for (var k=0; k<artsplit.length; k++) {
										nonBuyableArticleArr.push(artsplit[k]);
									}
								} else {
									nonBuyableArticleArr.push(articles);
								}
							}
							if (input.response.irw.responseJSON[i][j]['itemLevelErrorMessage'] != undefined) {
								itemLevelErrorMessage = input.response.irw.responseJSON[i][j]['itemLevelErrorMessage'];
							} else if (input.response.irw.responseJSON[i][j]['msg'] != undefined) {
								preliminaryFreighCalcFailureMsg = input.response.irw.responseJSON[i][j]['msg'];
							}
						}
					}

					// Iteration of non buyable article and display item level error messsage
					var found = false;
					if (c.varExist(window.Hash)){
						var articlesChecked = new Hash();
						for (var i=0; i<nonBuyableArticleArr.length; i++){
							found = false;
							// Match the unavailable line item
							document.querySelectorAll('.outsideProductRow  input[type=hidden]').forEach(function(inputElement, index) {
								//console.debug(article);

								if (inputElement.id != "" && inputElement.id.indexOf("_") != -1 && nonBuyableArticleArr[i] != "" && articlesChecked.get(nonBuyableArticleArr[i]) == undefined) {
									var inputId = inputElement.id.substring(inputElement.id.indexOf("_") + 1, inputElement.length);
									if (nonBuyableArticleArr[i].indexOf(inputId) != -1) {
										if (inputElement.up(".outsideProductRow").select(".noError").size() > 0) {
											var tableColumn = inputElement.up(".outsideProductRow").select(".noError");
											tableColumn[0].removeClassName('noError').addClassName('productError');
											//add red border and show message
											var unavailableQtyColumn = '<div class=\'colOutOfStockErr\'>' + itemLevelErrorMessage + '</div><div></div><div></div>';
											tableColumn[0].insert(unavailableQtyColumn);
										}
										found = true;
										articlesChecked.set(nonBuyableArticleArr[i], nonBuyableArticleArr[i]);
									}
								}
							});
						}
					}
				}


				/* END ITEM LEVEL ERROR MESSAGE */

				//deliveryDetailEntryDiv.style.display = 'none';
				// for statistics
				if (c.varExist(document.updateAllForm)){
					document.updateAllForm.errCodeForCalculateBtn.value = parseInt(input.response.irw.responseJSON[0][0].code);
					document.updateAllForm.milliSecDelTime.value = "0";
					irwstatSend();
				}
			}
		},
		checkCustomerType: function() {
			var customerTypePrivateInput = document.getElementById("privateCustomer");
			if (customerTypePrivateInput) {
				if (customerTypePrivateInput.getAttribute("checked")) {
					return "private";
				} else {
					return "business";
				}
			} else {
				var customerTypePrivateZipcode = document.getElementById("signup_checkout_private_zipCode");
				if (customerTypePrivateZipcode) {
					return "private";
				} else {
					return "business";
				}
			}
		},
		addressLoadGeneralSettings: function(callback){
			var c = Extension.Common;
			var elem, zipcode, zipcode_oa;

			var ct = this.checkCustomerType();

			//Getting the saved zipcode and replacing the transferred zipcode,
			zipcode = Extension.FreightCalc.getSaved("freight_zipcode");

			elem = document.getElementById("signup_checkout_" + ct + "_zipCode");
			if (elem) {
				elem.setAttribute("size", "6");
				elem.setAttribute("maxlength", Extension.FreightCalc.settings.zipcodedigits);
				if (this.cookie.dt == "pp") elem.value = "";
				else elem.value = this.cookie.zc;
				if (c.varExist(zipcode)) elem.value = zipcode;
				if (this.cookie.dt == "hs") elem.value = this.cookie.zc;

				Extension.Common.addEvent(elem, "change", function(e){
					if (e.target.value.length == Extension.FreightCalc.settings.zipcodedigits){
						if (Extension.FreightCalc.cookie.dt == "hs"){
							Extension.FreightCalc.setInfoCookie('{"zc":"' + e.target.value + '","na":"","dt":"hs","ex":"false"}');
						}
						Extension.FreightCalc.setSaved("freight_zipcode", e.target.value);
					}
				});
			}

			//Setting fields as number for mobile
			var fields =["zipCode", "phone2", "userProfileField1", "phone1"];
			for (var i=0; i<fields.length; i++){
				elem = document.getElementById("signup_checkout_" + ct + "_" + fields[i]);
				if (elem) {
					elem.setAttribute("type", "number");
					elem.setAttribute("min", "0");
					elem.setAttribute("inputmode", "numeric");
					elem.setAttribute("pattern", "[0-9]*");
				}
			}


			//Changing the logout link
			elem = document.querySelector(".logoutWelcome a");
			if (elem) {
				elem.href = "#";
				if (this.mobileCheckout())
					elem.setAttribute("onclick", "Extension.User.logOut({redirecturl: 'm2cart'});");
				else
					elem.setAttribute("onclick", "Extension.User.logOut({redirecturl: 'irwcart', includecontentclass: 'ext-irw'});");
			}

			//Change the text of the delivery to other address
			elem = document.querySelector("div.contentAreaBox form div.accordionLink span.accordionText");
			if (elem) elem.innerHTML = Extension.Translation.data.checkout.deliveytootheraddressheading;

			callback();

		},
		addressLoadAdditionalSettings: function(callback){
			var c = Extension.Common;
			var elem, zipcode, zipcode_oa;

			var ct = this.checkCustomerType();

			//Getting the saved zipcode and replacing the transferred zipcode,
			zipcode_oa = Extension.FreightCalc.getSaved("freight_zipcode_oa");

			//Removing the errormessage at the bttom
			elem = document.querySelector("#errorMessageSubmit p");
			if (elem) elem.innerHTML = "";

			//Setting back the zipcode for shipping address
			elem = document.getElementById("signup_checkout_" + ct + "_ship_zipCode");
			if (elem) {
				elem.setAttribute("size", "6");
				elem.setAttribute("maxlength", Extension.FreightCalc.settings.zipcodedigits);
				if (this.cookie.dt == "pp") elem.value = "";
				else elem.value = this.cookie.zc;
				if (c.varExist(zipcode_oa)) elem.value = zipcode_oa;

				Extension.Common.addEvent(elem, "change", function(e){
					if (e.target.value.length == Extension.FreightCalc.settings.zipcodedigits){
					   Extension.FreightCalc.setSaved("freight_zipcode_oa", e.target.value);
					}
				});
			}

			//Setting fields as number for mobile
			var fields =["zipCode", "phone2", "phone1"];
			for (var i=0; i<fields.length; i++){
				elem = document.getElementById("signup_checkout_" + ct + "_ship_" + fields[i]);
				if (elem) {
					elem.setAttribute("type", "number");
					elem.setAttribute("min", "0");
					elem.setAttribute("inputmode", "numeric");
					elem.setAttribute("pattern", "[0-9]*");
				}
			}

			//Attaching change event to the input fields for transferring them to the delivery address fields if pickup point delivery option is selected
			var fields =["organizationName", "firstName", "lastName", "phone2", "phone1"];
			for (var i=0; i<fields.length; i++){
				elem = document.getElementById("signup_checkout_" + ct + "_" + fields[i]);
				if (elem) {
					elem.field = fields[i];
					Extension.Common.addEvent(elem, "blur", function(e){
						if (Extension.FreightCalc.cookie.dt == "pp"){
							var ct = Extension.FreightCalc.checkCustomerType()
							var elem = document.getElementById("signup_checkout_" + ct + "_ship_" + e.target.field);
							if (elem) {
								elem.value = e.target.value;
								if (window.irwDoFieldValidation) window.irwDoFieldValidation({target: elem});
							}
						}
					});
				}
			}

			//Hiding the savedaddress section
			elem = document.getElementById("signup_checkout_" + ct + "_savedaddress_field");
			if (elem) elem.style.setProperty("display", "none");
			elem = document.querySelector(".formField.formFieldTop");
			if (elem) elem.style.setProperty("display", "none");
			// IRW
			elem = document.getElementById("signup_checkout_" + ct + "_savedaddress");
			if (elem) elem.parentNode.style.setProperty("display", "none");

			//Checking for the savedaddress dropdown and selecting the first addres if it exists
			elem = document.getElementById("signup_checkout_" + ct + "_savedaddress");
			if (elem) elem = elem.options[1].value;
			if (elem) {
				var temp = elem.slice(elem.indexOf("addressIdDelivery"), elem.length);
				var value = temp.slice(18, temp.indexOf("&"));
				elem = document.getElementById("signup_checkout_" + ct);
				if (elem) {
					elem = elem.querySelector("input[name=addressIdDelivery]");
					if (elem) elem.value = value;
					else {
						elem = document.createElement("input");
						elem.type = "hidden";
						elem.name = "addressIdDelivery";
						elem.value = value;
						document.getElementById("signup_checkout_" + ct).appendChild(elem);
					}
				}
			}
			//Set deliveryAddressDifferent to 1
			elem = document.getElementById("orderItemDisplayForm");
			if (elem){
				elem = elem.querySelector("input[name=deliveryAddressDifferent]");
				if (elem) elem.value = "1";
				else {
					elem = document.createElement("input");
					elem.type = "hidden";
					elem.name = "deliveryAddressDifferent";
					elem.value = "1";
					document.getElementById("orderItemDisplayForm").appendChild(elem);
				}
			}
			elem = document.getElementsByName("login");
			if (elem) {
				if (elem[0]) {
					elem = elem[0].querySelector("input[name=deliveryAddressDifferent]");
					if (elem) elem.value = "1";
					else {
						elem = document.createElement("input");
						elem.type = "hidden";
						elem.name = "deliveryAddressDifferent";
						elem.value = "1";
						document.getElementsByName("login")[0].appendChild(elem);
					}
				}
			}

			//Setting back the other shipping fields
			var fields_ship = ["organizationName", "firstName", "lastName", "address1", "address2", "city", "phone2", "phone1"],
				jsonobj = {},
				freight_oafields = Extension.Common.getStorage("freight_oafields");
			if (c.varExist(freight_oafields)) {
				jsonobj = JSON.parse(freight_oafields);
				this.oafields = jsonobj;
			}
			for (var i=0; i<fields_ship.length; i++){
				elem = document.querySelector("#signup_checkout_" + ct + "_ship_" + fields_ship[i]);
				if (elem) {
					if (this.cookie.dt == "pp") elem.value = "";
					else if (c.varExist(jsonobj[fields_ship[i]])) elem.value = jsonobj[fields_ship[i]];

					Extension.Common.addEvent(elem, "change", function(e){
						var fields_ship = ["organizationName", "firstName", "lastName", "address1", "address2", "city", "phone2", "phone1"],
							jsonobj = {},
							elem,
							ct = Extension.FreightCalc.checkCustomerType();
						for (var j=0; j<fields_ship.length; j++){
							elem = document.querySelector("#signup_checkout_" + ct + "_ship_" + fields_ship[j]);
							if (elem) jsonobj[fields_ship[j]] = elem.value;
						}
						Extension.Common.setStorage("freight_oafields", JSON.stringify(jsonobj));
					});
				}
			}
		},

		validateRemoveError: function(elem){
			var c = Extension.Common;
			if (elem) {
				if (this.mobileCheckout()){
					c.removeClass(elem, "validateFormFail");
					elem = elem.parentNode.parentNode.querySelectorAll(".formError");
					if (elem)
						for (var i=0; i<elem.length; i++)
							elem[i].innerHTML = "";
				} else {
					c.removeClass(elem, "fieldError");
					//while (!c.hasClass("formField"))
					//  elem = elem.parentNode;
					elem = elem.parentNode.parentNode
					var elemtemp = elem.querySelectorAll(".formError .errorMessage");
					if (elemtemp.length>0){
						for (var i=0; i<elemtemp.length; i++)
							elemtemp[i].innerHTML = "";
					} else {
						elem = elem.parentNode;
						elemtemp = elem.querySelectorAll(".formError .errorMessage");
						if (elemtemp.length>0)
							for (var i=0; i<elemtemp.length; i++)
								elemtemp[i].innerHTML = "";
					}
				}
			}
		},
		validateAllAddressFields: function(){
			var c = Extension.Common,
				elem,
				customerType = this.checkCustomerType();

			var fields = ["organizationName", "firstName", "lastName", "address1", "address2", "zipCode", "city", "email1", "email1retype", "phone2", "userProfileField1", "phone1"];
			var fields_ship = ["organizationName", "firstName", "lastName", "address1", "address2", "zipCode", "city", "phone2", "phone1"];

			for (var i=0; i<fields.length; i++){
				elem = document.querySelector("#signup_checkout_" + customerType + "_" + fields[i]);
				if (elem) if (window.irwDoFieldValidation) window.irwDoFieldValidation({target: elem});
			}
			for (var i=0; i<fields_ship.length; i++){
				elem = document.querySelector("#signup_checkout_" + customerType + "_ship_" + fields_ship[i]);
				if (elem) if (window.irwDoFieldValidation) window.irwDoFieldValidation({target: elem});
			}
		},


		FreightCalcCart: function(callback) {
			var elem;
			elem = document.querySelectorAll(".titleHomeDelivery")
			for (var i=0; i<elem.length; i++) {
				elem[i].innerHTML = "<p><span>" + Extension.Translation.data.freight.topcalclinktext + "</span></p><br>";
			}


			if (!this.mobileCheckout()){
				//Top calculation adjustments on desktop
				/*

				var productsInCart = 0;
				elem = document.getElementsByClassName("outsideProductRow");
				if (elem) productsInCart = elem.length;
				if (productsInCart > 5){
					elem = document.querySelector("div.wrapDeliveryAndCostTop");
					if (elem) elem.style.setProperty("display", "block");

					var calculationTop = document.getElementById("deliveryAllWrapTop");
					if (calculationTop){
						elem = Extension.Element.getChildNodes(calculationTop);
						for (var i=0; i < elem.length;i++){
							if (elem[i].style) elem[i].style.setProperty("display", "none");
						}

						elem = document.createElement("style");
						elem.innerHTML = "#ext-top-calc-link img{position:absolute; height:70px}#ext-top-calc-link-text{position:absolute;left:150px;top:55px;font-size:16px}.ext-top-calc-link:hover{cursor:pointer; text-decoration: underline}div#deliveryAllWrapTop .ccWrapper{display: none !important;}";
						document.getElementsByTagName("head")[0].appendChild(elem);

						var elem = document.createElement("div");
						elem.innerHTML = '<a id="ext-top-calc-link" class="ext-top-calc-link" onclick="Extension.Anchor.go(\'#ext-pup-master-cont\', -100)">' +
							  '<img src="' + Extension.Translation.data.freight.homeshippingresultimg + '" style="left:40px; top:20px" />' +
							  '<span id="ext-top-calc-link-text" class="ext-top-calc-link">' + Extension.Translation.data.freight.topcalclinktext + '</span></a>';
						calculationTop.appendChild(elem);

						// Hide the top Continue button
						elem = document.getElementById("jsButton_beginCheckOut_01");
						if (elem) {
							elem = elem.parentNode;
							elem.style.setProperty("visibility", "hidden");
						}
					}
				}*/


				//Expand accordion link
				/*
				var elem = document.createElement("span");
				elem.id = "ext-expand-accordion";
				elem.setAttribute("style", "cursor: pointer; float: right; color: #ccc; font-size: 18px; font-weight: bold;");
				elem.innerHTML = "+";
				elem.setAttribute("onClick", "Extension.FreightCalc.expandAccordion()");
				document.querySelector("#deliveryCostCalculatorBottom .titleHomeDelivery p").appendChild(elem);
				*/
			}


			var htmlradiotemplate = function(){
				var display_pickuppoints = "";
				if (Extension.FreightCalc.settings.pickuppoints)
					display_pickuppoints = "" +
					"  <div id=\"ext-cont-pp-radio-heading\" class=\"ext-radio-heading-div\"><input id=\"ext-cont-pp-radio-heading-input\" class=\"ext-radio-heading-button\" type=\"radio\" name=\"shippingtype\" value=\"pp\" onclick=\"Extension.FreightCalc.toggleDeliveryType('pp', 'manual')\"><label class=\"ext-radio-heading-label\" for=\"ext-cont-pp-radio-heading-input\"><%this.pickuppoint%></label></div>" +
					"  <div id=\"ext-cont-pp\" class=\"ext-radio-heading ext-pup-viscon\">" +
					"    <%this.pickuppointHTML%>" +
					"  </div>";
				var display_clickcollect = "";
				if (Extension.FreightCalc.settings.clickcollect)
					display_clickcollect = "" +
					"  <div id=\"ext-cont-cc-radio-heading\" class=\"ext-radio-heading-div\"><input id=\"ext-cont-cc-radio-heading-input\" class=\"ext-radio-heading-button\" type=\"radio\" name=\"shippingtype\" value=\"cc\" onclick=\"Extension.FreightCalc.toggleDeliveryType('cc', 'manual')\"><label class=\"ext-radio-heading-label\" for=\"ext-cont-cc-radio-heading-input\"><%this.clickcollect%></label></div>" +
					"  <div id=\"ext-cont-cc\" class=\"ext-radio-heading ext-pup-viscon\">" +
					"    <%this.clickcollectHTML%>" +
					"  </div>";

				var html = "" +
					"<div id=\"ext-pup-master-cont\">" +
					"  <div class=\"ext-master-heading\"><%this.masterheading%></div>" +
					"  <div id=\"ext-cont-hs-radio-heading\" class=\"ext-radio-heading-div\"><input id=\"ext-cont-hs-radio-heading-input\" class=\"ext-radio-heading-button\" type=\"radio\" name=\"shippingtype\" value=\"hs\" onclick=\"Extension.FreightCalc.toggleDeliveryType('hs', 'manual')\"><label class=\"ext-radio-heading-label\" for=\"ext-cont-hs-radio-heading-input\"><%this.homeshipping%></label></div>" +
					"  <div id=\"ext-cont-hs\" class=\"ext-radio-heading ext-pup-viscon\">" +
					"    <%this.homeshippingHTML%>" +
					"  </div>" +
					display_pickuppoints + 
					display_clickcollect + 
					"  </div>" +
					"</div>";

				return html;	
			}

			var htmlstateselector = function(){
				if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12") {
					return "" +
					"	   <select id=\"ext-hs-input-lower-field-state\" class=\"ext-hs-input-field-state\">" +
					"	     <option id=\"ext-hs-option-default\" value=\"\"><%this.statedropdownfieldplaceholder%></option>" +
					"	   </select>" +
					"	   <div id=\"ext-state-spacer\" style=\"height:5px\"></div>";
				} else return "";
			}

			var htmlcalculatebutton = function(){
				if (Extension.FreightCalc.settings.calculatebutton) {
					if (Extension.FreightCalc.mobileCheckout()){
						return "" +
						"	<div id=\"ext-calculation-button-spacer\" style=\"height:5px\"></div>" +
						"	<div id=\"ext-hs-calculate-button\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn ui-disabled ext-pup-viscon ext-show\" aria-disabled=\"false\">" +
						"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
						"			<span id=\"ext-hs-calculate-button-caption\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.calculatebuttoncaption + "</span>" +
						"		</span>" +
						"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-hs-calculate-button-caption-value\" value=\"" + Extension.Translation.data.freight.calculatebuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.homeshippingButtonClick(); return false;\">" +
						"	</div>";
					} else {
						return "" +
						"	<div id=\"ext-calculation-button-spacer\" style=\"height:5px\"></div>" +
						"	<div class=\"buttonContainer disabledButton ext-pup-viscon ext-show\" id=\"ext-hs-calculate-button\" style=\"width: 200px;\">" +
						"		<a class=\"blueButton\" id=\"ext-hs-calculate-button-link\" href=\"#\" onclick=\"Extension.FreightCalc.homeshippingButtonClick(); return false;\">" +
						"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
						"			<div class=\"buttonCaption buttonCaptionBlue\">" +
						"				<input id=\"ext-hs-calculate-button-caption-value\" type=\"button\" value=\"" + Extension.Translation.data.freight.calculatebuttoncaption + "\" disabled=\"disabled\" style=\"cursor: default; width: 200px;\">" +
						"			</div>" +
						"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
						"		</a>" +
						"	</div>";
					}
				} else return "";
			}

			var input = {
				init: function() {
					this.htmloptions = this.htmloptionsfunction();
					return this;
				},

				htmloptionsfunction: function() {
					var options = {};

					options.homeshippingHTML = "" +
					"    <div id=\"ext-hs-calc-heading-lower\" class=\"ext-radio-heading ext-pup-viscon\"><%this.homeshippingtext%></div>" +
					"    <div id=\"ext-hs-result-restriction-cont\" class=\"ext-radio-heading ext-border-red ext-pup-viscon\">" +
					"       <span id=\"ext-hs-result-restriction-text\"><b><%this.deliveryrestrictiontext%></b></span>: <span id=\"ext-hs-result-restriction\"></span>" +
					"    </div>" +
					"    <div id=\"ext-hs-input-lower-div\" class=\"ext-hs-input-div\">" +
					
					htmlstateselector() +

					"      <input id=\"ext-hs-input-lower-field\" class=\"ext-hs-input-field\" placeholder=\"<%this.inputfieldplaceholder%>\" size=\"6\" maxlength=\"" + Extension.FreightCalc.settings.zipcodedigits +"\" type=\"number\" min=\"0\" inputmode=\"numeric\" pattern=\"[0-9]*\" onclick=\"Extension.FreightCalc.homeShippingInputClick(this);\" onkeyup=\"Extension.FreightCalc.homeShippingInputKeyUp(this);\">" +
					
					htmlcalculatebutton() +

					"      <%this.freightcalcloader%>" +
					//"      <span id=\"ext-hsGifLoadCalcBottom\" style=\"position: relative; left: 10px; top: 5px;\"></span>" +
					"    </div>" +
					"    <div id=\"ext-hs-result\" class=\"ext-calc-result-div ext-pup-viscon\"><div id=\"ext-hs-result-inner\" class=\"ext-calc-result-div-inner\">" +
					"      <table style=\"width: 100%\">" +
					"        <tbody>" +
					"          <tr>" +
					"            <td rowspan=\"4\" style=\"width: 90px; vertical-align: top; padding-right: 10px;\"><span id=\"ext-hs-result-img\"><img class=\"ext-result-img\" src=\"<%this.homeshippingresultimg%>\"></span></td>" +
					"            <td style=\"padding-bottom: 5px;\" valign=\"bottom\">" +
					"               <span id=\"ext-hs-result-text-1\"><%this.homeshippingresulttext1%></span>" +
					"            </td>" +
					"            <td rowspan=\"4\" style=\"vertical-align: center; width:25px; padding-right: 5px\"><input id=\"ext-hs-result-checkbox-input\" class=\"ext-result-checkbox\" style=\"height: 20px; width: 20px; display: block;\" type=\"checkbox\" onclick=\"Extension.FreightCalc.toggleExpress('hs', 'auto');\"></td>"+
					"          </tr>" +
					"          <tr>" +
					//"            <td><span id=\"ext-calc-hs-result-zc\"></span> <span id=\"ext-calc-hs-result-name\"></span>: <b><span id=\"ext-calc-hs-result-price\"></span></b></td>" +
					"            <td><span id=\"ext-hs-result-text-2\"><%this.homeshippingresulttext2%></span>: <b><span id=\"ext-calc-hs-result-price\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"padding-top: 5px\" valign=\"top\"><span id=\"ext-hs-result-text-3\"><%this.homeshippingresulttext3%></span> <b><span id=\"ext-calc-hs-result-delivery-date\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td colspan=\"2\" style=\"padding-top: 5px\" valign=\"bottom\"><span id=\"ext-hs-result-text-4\"><%this.homeshippingresulttext4%></span></td>" +
					"          </tr>" +
					"        </tbody>" +
					"      </table>" +
					"    </div></div>" +
					"    <div id=\"ext-ex-result\" class=\"ext-calc-result-div ext-pup-viscon\"><div id=\"ext-ex-result-inner\" class=\"ext-calc-result-div-inner\">" +
					"      <table style=\"width: 100%\">" +
					"        <tbody>" +
					"          <tr>" +
					"            <td rowspan=\"4\" style=\"width: 90px; vertical-align: top; padding-right: 10px;\"><span id=\"ext-ex-result-img\"><img class=\"ext-result-img\" src=\"<%this.expressdeliveryresultimg%>\"></span></td>" +
					"            <td style=\"padding-bottom: 5px;\" valign=\"bottom\">" +
					"               <span id=\"ext-ex-result-text-1\"><%this.expressdeliveryresulttext1%></span>" +
					"            </td>" +
					"            <td rowspan=\"4\" style=\"vertical-align: center; width:25px; padding-right: 5px\"><input id=\"ext-ex-result-checkbox-input\" class=\"ext-result-checkbox\" style=\"height: 20px; width: 20px; display: block;\" type=\"checkbox\" onclick=\"Extension.FreightCalc.toggleExpress('ex', 'auto');\"></td>"+
					"          </tr>" +
					"          <tr>" +
					"            <td><span id=\"ext-ex-result-text-2\"><%this.expressdeliveryresulttext2%></span>: <b><span id=\"ext-calc-ex-result-price\"><%this.expressdeliveryresulttext2staticprice%></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"padding-top: 5px\" valign=\"top\"><span id=\"ext-ex-result-text-3\"><%this.expressdeliveryresulttext3%></span> <b><span id=\"ext-calc-ex-result-delivery-date\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td colspan=\"2\" style=\"padding-top: 5px\" valign=\"bottom\"><span id=\"ext-ex-result-text-4\"><%this.expressdeliveryresulttext4%></span></td>" +
					"          </tr>" +
					"        </tbody>" +
					"      </table>" +
					"    </div></div>" +
					"    <div id=\"ext-calc-hs-result-error-div\" class=\"ext-calc-error ext-pup-viscon\"><span id=\"ext-calc-hs-result-error-span\"></span></div>" +
					"";

					options.pickuppointHTML = "" +
					"    <div id=\"ext-pp-calc-heading-lower\" class=\"ext-radio-heading ext-pup-viscon ext-show\"><%this.pickuppointtext%></div>" +
					"    <div id=\"ext-pp-result-restriction-cont\" class=\"ext-radio-heading ext-pup-viscon\">" +
					"       <span id=\"ext-pp-result-restriction-text\"><%this.noparceldeliverytopuptext%></span>" +
					"    </div>" +
					"    <div id=\"ext-pp-input-lower-div\" class=\"ext-pp-input-div\">" +
					"      <select id=\"ext-pp-input-lower-field\" class=\"ext-pp-input-field\">" +
					"        <option id=\"ext-pp-option-default\" value=\"\"><%this.dropdownfieldplaceholder%></option>" +
					"      </select>" +
					"      <%this.freightcalcloader%>" +
					"    </div>" +
					"    <div id=\"ext-pp-result\" class=\"ext-calc-result-div ext-pup-viscon\"><div id=\"ext-pp-result-inner\" class=\"ext-calc-result-div-inner\">" +
					"      <table style=\"width: 100%\">" +
					"        <tbody>" +
					"          <tr>" +
					"            <td rowspan=\"5\" style=\"width: 90px; vertical-align: top; padding-right: 10px;\"><img class=\"ext-result-img\" src=\"<%this.pickuppointresultimg%>\"></td>" +
					"            <td colspan=\"2\" style=\"padding-bottom: 5px;\" valign=\"bottom\"><%this.pickuppointresulttext1%></td>" +
					"          </tr>" + "          <tr>" +
					"            <td><span id=\"ext-pp-result-text-2\"><%this.pickuppointresulttext2%></span>: <b><span id=\"ext-calc-pp-result-price\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"padding-top: 5px\" valign=\"bottom\"><%this.pickuppointresulttext3%> <b><span id=\"ext-calc-pp-result-delivery-date\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"border-top: 1px solid #ccc;\"></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"text-align: right;padding-top: 5px;\"> <span id=\"ext-calc-pp-map-text\"><a id=\"ext-calc-pp-map-url\" class=\"ext-map-tool-tip\" href=\"\" target=\"_blank\"><%this.pickuppointresultmaptextlink%></a></span></td>" +
					"          </tr>" +
					"        </tbody>" +
					"      </table>" +
					"    </div></div>" +
					"    <div id=\"ext-calc-pp-result-error-div\" class=\"ext-calc-error ext-pup-viscon\"><span id=\"ext-calc-pp-result-error-span\"></span></div>" +
					"";
					options.clickcollectHTML = "" +
					"    <div id=\"ext-cc-calc-heading-lower\" class=\"ext-radio-heading ext-pup-viscon\"><%this.clickcollecttext%></div>" +
					"    <div id=\"ext-cc-input-lower-div\" class=\"ext-cc-input-div\">" +
					"      <select id=\"ext-cc-input-lower-field\" class=\"ext-cc-input-field\">" +
					"        <option id=\"ext-cc-option-default\" value=\"\"><%this.clickcollectdropdownfieldplaceholder%></option>" +
					"      </select>" +
					"      <%this.freightcalcloader%>" +
					"    </div>" +
					"    <div id=\"ext-cc-result\" class=\"ext-calc-result-div ext-pup-viscon\"><div id=\"ext-cc-result-inner\" class=\"ext-calc-result-div-inner\">" +
					"      <table style=\"width: 100%\">" +
					"        <tbody>" +
					"          <tr>" +
					"            <td rowspan=\"5\" style=\"width: 90px; vertical-align: top; padding-right: 10px;\"><img class=\"ext-result-img\" src=\"<%this.clickcollectresultimg%>\"></td>" +
					"            <td colspan=\"2\" style=\"padding-bottom: 5px;\" valign=\"bottom\"><%this.clickcollectresulttext1%></td>" +
					"          </tr>" + "          <tr>" +
					"            <td><span id=\"ext-cc-result-text-2\"><%this.clickcollectresulttext2%></span>: <b><span id=\"ext-calc-cc-result-price\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"padding-top: 5px\" valign=\"bottom\"><%this.clickcollectresulttext3%> <b><span id=\"ext-calc-cc-result-delivery-date\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"\"></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"text-align: right;padding-top: 5px;\"> <span id=\"ext-calc-cc-map-text\"><a id=\"ext-calc-cc-map-url\" class=\"ext-map-tool-tip\" href=\"\" target=\"_blank\"><%this.clickcollectmaptextlink%></a></span></td>" +
					"          </tr>" +
					"        </tbody>" +
					"      </table>" +
					"    </div></div>" +
					"    <div id=\"ext-calc-cc-result-error-div\" class=\"ext-calc-error ext-pup-viscon\"><span id=\"ext-calc-cc-result-error-span\"></span></div>" +
					"";

					Extension.Merge.merge(options, Extension.Translation.data.freight)

					return options;
				},
				htmlcontent: htmlradiotemplate()
			}

			var containerhtml = Extension.Template.load(input.init());

			if (this.mobileCheckout()){
				Extension.Element.get("input#zipCodeBottom", function(selector, targetelem) {

					targetelem = targetelem[0].parentNode.parentNode.parentNode.parentNode;
					targetelem.insertAdjacentHTML("beforebegin", containerhtml);
					if (Extension.FreightCalc.settings.expressontop){
						var hselem = document.getElementById("ext-hs-result");
						var exelem = document.getElementById("ext-ex-result");
						if (hselem && exelem) hselem.parentNode.insertBefore(exelem, hselem); 
					}

					callback(true);
				}, containerhtml);
			} else {

				Extension.Element.get("input#zipCodeBottom", function(selector, targetelem) {

					targetelem = targetelem[0].parentNode.parentNode.parentNode.parentNode;
					targetelem.insertAdjacentHTML("beforebegin", containerhtml);
					if (Extension.FreightCalc.settings.expressontop){
						var hselem = document.getElementById("ext-hs-result");
						var exelem = document.getElementById("ext-ex-result");
						if (hselem && exelem) hselem.parentNode.insertBefore(exelem, hselem); 
					}

					Extension.Element.showall("pup");
					callback(true);
				}, containerhtml);
				
			}
		},
		FreightCalcButtons: function(callback){
			//Adding buttoncontainer and hidden buttons for express delivery and click & collect
			if (this.mobileCheckout()){
				var buttons = document.createElement("div");
				buttons.id = "ext-checkout-button-cont";
				buttons.innerHTML =  "" +
					"<div id=\"ext-pay-with-other-card-wrapper\" style=\"display: none\"><input type=\"checkbox\" id=\"ext-pay-with-other-card-input\"><label for=\"ext-pay-with-other-card-input\"> Ønsker du å betale med gavekort eller et IKEA Bedriftskort, huk av her før du går videre.</label></div>" +
					"<div id=\"ext-ex-wrapper\" class=\"ext-checkout-button-wrapper\" style=\"display: none\">" +
					"	<div id=\"ext-ex-button-text\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.expressdeliverybuttontext + "</div>" +
					"	<div id=\"ext-ex-button-text-error\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.expressdeliverybuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"	<div id=\"ext-ex-button\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn\" aria-disabled=\"false\">" +
					"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
					"			<span id=\"ext-ex-button-caption\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.expressdeliverybuttoncaption + "</span>" +
					"		</span>" +
					"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-ex-button-caption-value\" value=\"" + Extension.Translation.data.freight.expressdeliverybuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.expressdeliveryCheckout(); return false;\">" +
					"	</div>" +
					"</div>" +
					"<div id=\"ext-cc-wrapper\" class=\"ext-checkout-button-wrapper\" style=\"display: none\">" +
					"	<div id=\"ext-cc-button-text\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.clickcollectbuttontext + "</div>" +
					"	<div id=\"ext-cc-button-text-error\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.clickcollectbuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"	<div id=\"ext-cc-button\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn\" aria-disabled=\"false\">" +
					"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
					"			<span id=\"ext-cc-button-caption\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.clickcollectbuttoncaption + "</span>" +
					"		</span>" +
					"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-cc-button-caption-value\" value=\"" + Extension.Translation.data.freight.clickcollectbuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.clickcollectCheckout(); return false;\">" +
					"	</div>" +
					"</div>" +
					"<div id=\"ext-hs-wrapper\" class=\"ext-checkout-button-wrapper\">" +
					"	<div id=\"ext-hs-button-text\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.regulardeliverybuttontext + "</div>" +
					"	<div id=\"ext-hs-button-text-error\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.regulardeliverybuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"</div>" +

					"<div id=\"ext-ex-wrapper-klarna\" class=\"ext-checkout-button-wrapper\" style=\"display: none\">" +
					"	<div id=\"ext-ex-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.expressdeliverybuttontext + "</div>" +
					"	<div id=\"ext-ex-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.expressdeliverybuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"	<div id=\"ext-ex-button-klarna\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn\" aria-disabled=\"false\">" +
					"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
					"			<span id=\"ext-ex-button-caption-klarna\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.expressdeliverybuttoncaption + "</span>" +
					"		</span>" +
					"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-ex-button-caption-value-klarna\" value=\"" + Extension.Translation.data.freight.expressdeliverybuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.Klarna.checkout('ex'); return false;\">" +
					"	</div>" +
					"</div>" +
					"<div id=\"ext-cc-wrapper-klarna\" class=\"ext-checkout-button-wrapper\" style=\"display: none\">" +
					"	<div id=\"ext-cc-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.clickcollectbuttontext + "</div>" +
					"	<div id=\"ext-cc-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.clickcollectbuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"	<div id=\"ext-cc-button-klarna\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn\" aria-disabled=\"false\">" +
					"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
					"			<span id=\"ext-cc-button-caption-klarna\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.clickcollectbuttoncaption + "</span>" +
					"		</span>" +
					"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-cc-button-caption-value-klarna\" value=\"" + Extension.Translation.data.freight.clickcollectbuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.Klarna.checkout('cc'); return false;\">" +
					"	</div>" +
					"</div>" +
					"<div id=\"ext-pp-wrapper-klarna\" class=\"ext-checkout-button-wrapper\" style=\"display: none\">" +					
					"	<div id=\"ext-pp-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.pickuppointbuttontext + "</div>" +
					"	<div id=\"ext-pp-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.pickuppointbuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"	<div id=\"ext-pp-button-klarna\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn\" aria-disabled=\"false\">" +
					"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
					"			<span id=\"ext-pp-button-caption-klarna\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.pickuppointbuttoncaption + "</span>" +
					"		</span>" +
					"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-pp-button-caption-value-klarna\" value=\"" + Extension.Translation.data.freight.pickuppointbuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.Klarna.checkout('pp'); return false;\">" +
					"	</div>" +
					"</div>" +
					"<div id=\"ext-hs-wrapper-klarna\" class=\"ext-checkout-button-wrapper\" style=\"display: none\">" +					
					"	<div id=\"ext-hs-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.regulardeliverybuttontext + "</div>" +
					"	<div id=\"ext-hs-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.regulardeliverybuttontexterror + "</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowdown + "\"></div>" +
					"	<div id=\"ext-hs-button-klarna\" data-corners=\"true\" data-shadow=\"true\" data-iconshadow=\"true\" data-wrapperels=\"span\" data-icon=\"null\" data-iconpos=\"null\" data-theme=\"blueBtn\" class=\"ui-btn ui-btn-up-purchase ui-shadow ui-btn-corner-all ui-submit ui-btn-up-blueBtn\" aria-disabled=\"false\">" +
					"		<span class=\"ui-btn-inner ui-btn-corner-all\">" +
					"			<span id=\"ext-hs-button-caption-klarna\" class=\"ui-btn-text\">" + Extension.Translation.data.freight.regulardeliverybuttoncaption + "</span>" +
					"		</span>" +
					"		<input type=\"button\" data-theme=\"blueBtn\" id=\"ext-hs-button-caption-value-klarna\" value=\"" + Extension.Translation.data.freight.regulardeliverybuttoncaption + "\" class=\"ui-btn-hidden\" aria-disabled=\"false\" onclick=\"Extension.FreightCalc.Klarna.checkout('hs'); return false;\">" +
					"	</div>" +
					"</div>" +

					"";
				Extension.Element.get("#checkoutButtonBoxBottom > div", function(selector, elem) {
					var elem = elem[0];
					elem.parentNode.insertBefore(buttons, elem);
					elem.id = "ext-hs-button";
					var inputelem = elem.querySelector(".ui-btn-text");
					if (inputelem) {
						inputelem.id = "ext-hs-button-caption";
						inputelem.innerHTML = Extension.Translation.data.freight.regulardeliverybuttoncaption;
					}
					var inputelem = elem.querySelector("input");
					if (inputelem) {
						inputelem.id = "ext-hs-button-caption-value";
						inputelem.value = Extension.Translation.data.freight.regulardeliverybuttoncaption;
					}
					var wrap = buttons.querySelector("#ext-hs-wrapper");
					wrap.appendChild(elem);

					//Deactivate continue button
					if (Extension.FreightCalc.settings.forcezipcodeentry)
						Extension.FreightCalc.deactivateContinueButtons();

					
					elem = document.getElementById("ext-pay-with-other-card-input");
					if (elem) {
						Extension.Common.addEvent(elem, "change", function(e){
							var dt = Extension.FreightCalc.cookie.dt;
							if (Extension.FreightCalc.cookie.dt == "hs" & Extension.FreightCalc.cookie.ex == "true") dt = "ex";
							Extension.FreightCalc.toggleShownButton(dt);
						});
						//*** Test ***
						//elem.parentNode.style.setProperty("display", "block");
						//************
					}

					callback(true);
				}, buttons);
			} else {
				var buttons = document.createElement("div");
				buttons.id = "ext-checkout-button-cont";
				buttons.innerHTML =  "" +
					"<div id=\"ext-pay-with-other-card-wrapper\" style=\"display: none\"><div id=\"ext-pay-with-other-card\"><input type=\"checkbox\" id=\"ext-pay-with-other-card-input\"><label for=\"ext-pay-with-other-card-input\"> Ønsker du å betale med gavekort eller et IKEA Bedriftskort, huk av her før du går videre.</label></div></div>" +
					"<div id=\"ext-ex-wrapper\" style=\"display: none\">" +
					"	<div class=\"buttonContainer\" id=\"ext-ex-button\" style=\"width: 200px;\">" +
					"		<a class=\"blueButton\" id=\"ext-ex-link\" href=\"#\" onclick=\"Extension.FreightCalc.expressdeliveryCheckout(); return false;\">" +
					"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
					"			<div class=\"buttonCaption buttonCaptionBlue\">" +
					"				<input id=\"ext-ex-button-caption-value\" type=\"button\" value=\"" + Extension.Translation.data.freight.expressdeliverybuttoncaption + "\" style=\"cursor: pointer; width: 200px;\">" +
					"			</div>" +
					"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
					"		</a>" +
					"	</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-ex-button-text\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.expressdeliverybuttontext + "</div>" +
					"	<div id=\"ext-ex-button-text-error\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.expressdeliverybuttontexterror + "</div>" +
					"</div>" +
					"<div id=\"ext-cc-wrapper\" style=\"display: none\">" +
					"	<div class=\"buttonContainer\" id=\"ext-cc-button\" style=\"width: 200px;\">" +
					"		<a class=\"blueButton\" id=\"ext-cc-link\" href=\"#\" onclick=\"Extension.FreightCalc.clickcollectCheckout(); return false;\">" +
					"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
					"			<div class=\"buttonCaption buttonCaptionBlue\">" +
					"				<input id=\"ext-cc-button-caption-value\" type=\"button\" value=\"" + Extension.Translation.data.freight.clickcollectbuttoncaption + "\" style=\"cursor: pointer; width: 200px;\">" +
					"			</div>" +
					"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
					"		</a>" +
					"	</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-cc-button-text\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.clickcollectbuttontext + "</div>" +
					"	<div id=\"ext-cc-button-text-error\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.clickcollectbuttontexterror + "</div>" +
					"</div>" +
					"<div id=\"ext-hs-wrapper\">" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-hs-button-text\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.regulardeliverybuttontext + "</div>" +
					"	<div id=\"ext-hs-button-text-error\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.regulardeliverybuttontexterror + "</div>" +
					"</div>" +

					"<div id=\"ext-ex-wrapper-klarna\" style=\"display: none\">" +
					"	<div class=\"buttonContainer\" id=\"ext-ex-button-klarna\" style=\"width: 200px;\">" +
					"		<a class=\"blueButton\" id=\"ext-ex-link-klarna\" href=\"#\" onclick=\"Extension.FreightCalc.Klarna.checkout('ex'); return false;\">" +
					"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
					"			<div class=\"buttonCaption buttonCaptionBlue\">" +
					"				<input id=\"ext-ex-button-caption-value-klarna\" type=\"button\" value=\"" + Extension.Translation.data.freight.expressdeliverybuttoncaption + "\" style=\"cursor: pointer; width: 200px;\">" +
					"			</div>" +
					"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
					"		</a>" +
					"	</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-ex-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.expressdeliverybuttontext + "</div>" +
					"	<div id=\"ext-ex-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.expressdeliverybuttontexterror + "</div>" +
					"</div>" +
					"<div id=\"ext-cc-wrapper-klarna\" style=\"display: none\">" +
					"	<div class=\"buttonContainer\" id=\"ext-cc-button-klarna\" style=\"width: 200px;\">" +
					"		<a class=\"blueButton\" id=\"ext-cc-link-klarna\" href=\"#\" onclick=\"Extension.FreightCalc.Klarna.checkout('cc'); return false;\">" +
					"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
					"			<div class=\"buttonCaption buttonCaptionBlue\">" +
					"				<input id=\"ext-cc-button-caption-value-klarna\" type=\"button\" value=\"" + Extension.Translation.data.freight.clickcollectbuttoncaption + "\" style=\"cursor: pointer; width: 200px;\">" +
					"			</div>" +
					"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
					"		</a>" +
					"	</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-cc-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.clickcollectbuttontext + "</div>" +
					"	<div id=\"ext-cc-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.clickcollectbuttontexterror + "</div>" +
					"</div>" +
					"<div id=\"ext-pp-wrapper-klarna\" style=\"display: none\">" +
					"	<div class=\"buttonContainer\" id=\"ext-pp-button-klarna\" style=\"width: 200px;\">" +
					"		<a class=\"blueButton\" id=\"ext-pp-link-klarna\" href=\"#\" onclick=\"Extension.FreightCalc.Klarna.checkout('pp'); return false;\">" +
					"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
					"			<div class=\"buttonCaption buttonCaptionBlue\">" +
					"				<input id=\"ext-pp-button-caption-value-klarna\" type=\"button\" value=\"" + Extension.Translation.data.freight.pickuppointbuttoncaption + "\" style=\"cursor: pointer; width: 200px;\">" +
					"			</div>" +
					"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
					"		</a>" +
					"	</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-pp-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.pickuppointbuttontext + "</div>" +
					"	<div id=\"ext-pp-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.pickuppointbuttontexterror + "</div>" +
					"</div>" +
					"<div id=\"ext-hs-wrapper-klarna\" style=\"display: none\">" +
					"	<div class=\"buttonContainer\" id=\"ext-hs-button-klarna\" style=\"width: 200px;\">" +
					"		<a class=\"blueButton\" id=\"ext-hs-link-klarna\" href=\"#\" onclick=\"Extension.FreightCalc.Klarna.checkout('hs'); return false;\">" +
					"			<div class=\"buttonLeft buttonLeftBlue\">&nbsp;</div>" +
					"			<div class=\"buttonCaption buttonCaptionBlue\">" +
					"				<input id=\"ext-hs-button-caption-value-klarna\" type=\"button\" value=\"" + Extension.Translation.data.freight.regulardeliverybuttoncaption + "\" style=\"cursor: pointer; width: 200px;\">" +
					"			</div>" +
					"			<div class=\"buttonRight buttonRightBlue\">&nbsp;</div>" +
					"		</a>" +
					"	</div>" +
					"   <div class=\"ext-checkout-button-img\"><img src=\"" + Extension.Translation.data.freight.continuebuttonarrowright + "\"></div>" +
					"	<div id=\"ext-hs-button-text-klarna\" class=\"ext-checkout-button-text\">" + Extension.Translation.data.freight.regulardeliverybuttontext + "</div>" +
					"	<div id=\"ext-hs-button-text-error-klarna\" class=\"ext-checkout-button-text ext-red-text ext-pup-viscon\">" + Extension.Translation.data.freight.regulardeliverybuttontexterror + "</div>" +
					"</div>" +

					"";
				Extension.Element.get("form#shopRowBottom .buttonContainer", function(selector, elem) {
					var elem = elem[0];
					var parent = elem.parentNode;
					if (parent.id.indexOf("noShippingCalcButtonBottom") > -1){
						// For Denmark where the continue button is disabled by default
						parent.style.setProperty("display", "none");
						Extension.Element.get("form#shopRowBottom #shippingCalcButtonBottom .buttonContainer", function(selector, elem) {
							var elem = elem[0];
							var parent = elem.parentNode;
							parent.style.setProperty("display", "block");
							elem.parentNode.insertBefore(buttons, elem);
							elem.id = "ext-hs-button";
							elem.setAttribute("style", "width: 200px");
							var inputelem = elem.querySelector("input")
							if (inputelem) {
								inputelem.id = "ext-hs-button-caption-value";
								inputelem.style.setProperty("width", "200px")
								inputelem.value = Extension.Translation.data.freight.regulardeliverybuttoncaption;
							}
							var wrap = buttons.querySelector("#ext-hs-wrapper");
							wrap.insertBefore(elem, wrap.firstChild);

							//Deactivate continue button
							if (Extension.FreightCalc.settings.forcezipcodeentry)
							Extension.FreightCalc.deactivateContinueButtons();

							
							elem = document.getElementById("ext-pay-with-other-card-input");
							if (elem) {
								Extension.Common.addEvent(elem, "change", function(e){
									var dt = Extension.FreightCalc.cookie.dt;
									if (Extension.FreightCalc.cookie.dt == "hs" & Extension.FreightCalc.cookie.ex == "true") dt = "ex";
									Extension.FreightCalc.toggleShownButton(dt);
								});
								//*** Test ***
								//elem.parentNode.style.setProperty("display", "block");
								//************
							}

							callback(true);
						});
					} else {
						elem.parentNode.insertBefore(buttons, elem);
						elem.id = "ext-hs-button";
						elem.setAttribute("style", "width: 200px");
						var inputelem = elem.querySelector("input")
						if (inputelem) {
							inputelem.id = "ext-hs-button-caption-value";
							inputelem.style.setProperty("width", "200px")
							inputelem.value = Extension.Translation.data.freight.regulardeliverybuttoncaption;
						}
						var wrap = buttons.querySelector("#ext-hs-wrapper");
						wrap.insertBefore(elem, wrap.firstChild);

						elem = document.getElementById("ext-pay-with-other-card-input");
						if (elem) {
							Extension.Common.addEvent(elem, "change", function(e){
								var dt = Extension.FreightCalc.cookie.dt;
								if (Extension.FreightCalc.cookie.dt == "hs" & Extension.FreightCalc.cookie.ex == "true") dt = "ex";
								Extension.FreightCalc.toggleShownButton(dt);
							});
							//*** Test ***
							//elem.parentNode.style.setProperty("display", "block");
							//************
						}

						callback(true);
					}
				}, buttons);

			}
		},
		FreightCalcAddress: function(callback) {
			var c = Extension.Common;
			var input = {
				init: function() {
					this.htmloptions = this.htmloptionsfunction();
					return this;
				},
				htmloptionsfunction: function() {
					var options = {};
					options.pickuppointHTML = "" +
					"    <div id=\"ext-pp-calc-heading-lower\" class=\"ext-radio-heading ext-pup-viscon ext-show\"><%this.pickuppointtext%></div>" +
					"    <div id=\"ext-pp-result-restriction-cont\" class=\"ext-radio-heading ext-pup-viscon\">" +
					"       <span id=\"ext-pp-result-restriction-text\"><%this.noparceldeliverytopuptext%></span>" +
					"    </div>" +
					"    <div id=\"ext-pp-input-lower-div\" class=\"ext-pp-input-div\">" +
					"      <select id=\"ext-pp-input-lower-field\" class=\"ext-pp-input-field\">" +
					"        <option id=\"ext-pp-option-default\" value=\"\"><%this.dropdownfieldplaceholder%></option>" +
					"      </select>" +
					"      <%this.freightcalcloader%>" +
					"    </div>" +
					"    <div id=\"ext-pp-result\" class=\"ext-calc-result-div ext-pup-viscon\">" +
					"      <table style=\"width: 100%\">" +
					"        <tbody>" +
					"          <tr>" +
					"            <td rowspan=\"5\" style=\"max-width: 70px; vertical-align: top\"><img class=\"ext-result-img\" src=\"<%this.pickuppointresultimg%>\"></td>" +
					"            <td colspan=\"2\" style=\"padding-bottom: 5px;\" valign=\"bottom\"><%this.pickuppointresulttext1%></td>" +
					"          </tr>" + "          <tr>" +
					"            <td><span id=\"ext-pp-result-text-2\"><%this.pickuppointresulttext2%></span>: <b><span id=\"ext-calc-pp-result-price\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"padding-top: 5px\" valign=\"bottom\"><%this.pickuppointresulttext3%> <b><span id=\"ext-calc-pp-result-delivery-date\"></span></b></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"border-top: 1px solid #ccc;\"></td>" +
					"          </tr>" +
					"          <tr>" +
					"            <td style=\"text-align: right;padding-top: 5px;\"> <span id=\"ext-calc-pp-map-text\"><a id=\"ext-calc-pp-map-url\" class=\"ext-map-tool-tip\" href=\"\" target=\"_blank\"><%this.pickuppointresultmaptextlink%></a></span></td>" +
					"          </tr>" +
					"        </tbody>" +
					"      </table>" +
					"    </div>" +
					"    <div id=\"ext-calc-pp-result-error-div\" class=\"ext-calc-error ext-pup-viscon\"><span id=\"ext-calc-pp-result-error-span\"></span></div>" +
					"";
					options.otheraddressHTML = "" +
					"    <div id=\"ext-oa-calc-heading-lower\" class=\"ext-radio-heading ext-pup-viscon\"><%this.otheraddresstext%></div>" +
					"    <div id=\"ext-oa-input-lower-div\" class=\"ext-oa-input-div\">" +

					"    </div>" +
					"";

					Extension.Merge.merge(options, Extension.Translation.data.freight)

					return options;
				},
				htmlcontent: "" +
				"<div id=\"ext-pup-master-cont\">" +
				//"  <div class=\"ext-master-heading\"><%this.masterheading%></div>" +
				"  <div class=\"ext-master-heading\"></div>" +
				"  <div id=\"ext-cont-pp-radio-heading\" class=\"ext-radio-heading-div\"><input id=\"ext-cont-pp-radio-heading-input\" class=\"ext-radio-heading-button\" type=\"radio\" name=\"shippingtype\" value=\"pp\" onclick=\"Extension.FreightCalc.toggleDeliveryType('pp', 'manual')\"><label class=\"ext-radio-heading-label\" for=\"ext-cont-pp-radio-heading-input\"><%this.pickuppoint%></label></div>" +
				"  <div id=\"ext-cont-pp\" class=\"ext-radio-heading ext-pup-viscon\">" +
				"    <%this.pickuppointHTML%>" +
				"  </div>" +
				"  <div id=\"ext-cont-oa-radio-heading\" class=\"ext-radio-heading-div\"><input id=\"ext-cont-oa-radio-heading-input\" class=\"ext-radio-heading-button\" type=\"radio\" name=\"shippingtype\" value=\"oa\" onclick=\"Extension.FreightCalc.toggleDeliveryType('oa', 'manual')\"><label class=\"ext-radio-heading-label\" for=\"ext-cont-oa-radio-heading-input\"><%this.otheraddress%></label></div>" +
				"  <div id=\"ext-cont-oa\" class=\"ext-radio-heading ext-pup-viscon\">" +
				"    <%this.otheraddressHTML%>" +
				"  </div>" +
				"</div>"
			}

			var containerhtml = Extension.Template.load(input.init());

			var elem = document.createElement("div");
			elem.id = "accordionContent_master";
			elem.innerHTML = containerhtml;
			Extension.Element.get({selector:["#accordionContent","#deliveryBox"], timeout: 2000}, function(selector, targetelem) {
				targetelem = targetelem[0];
				targetelem.parentNode.insertBefore(elem, targetelem);

				if (Extension.FreightCalc.mobileCheckout()){
					targetelem.className = "ext-radio-heading";
					var targetoaelem = document.getElementById("ext-oa-input-lower-div");
					targetoaelem.appendChild(targetelem);
				} else {
					var elempmc = document.querySelector("#ext-pup-master-cont");
					if (elempmc) Extension.Common.addClass(elempmc, "ext-irw");
					targetelem.className = "ext-radio-heading";
					var targetoaelem = document.getElementById("ext-oa-input-lower-div");
					targetoaelem.appendChild(targetelem);
					var heading = targetelem.querySelector(".billing_address_heading2");
					if (heading) heading.style.setProperty("display", "none");
				}
				callback();
			});

		},
		init: function(data) {
			var c = Extension.Common
			this.data = data;
			//if (document.URL.indexOf("/webapp/wcs/stores/servlet/OrderItemDisplay") > -1 || document.URL.indexOf("/webapp/wcs/stores/servlet/IrwOrderItemDisplay") > -1 || document.URL.indexOf("/webapp/wcs/stores/servlet/PromotionCodeManage") > -1 || document.URL.indexOf("/webapp/wcs/stores/servlet/OrderItemAddByPartNumber") > -1) {
			this.getInfoCookie();
			if (!this.cookie) {
				this.setInfoCookie('{"zc":"","na":"","dt":"","ex":"false"}');
				this.clearZipCodeForTransfer();
			}
			if (c.checkurl(["*/stores/servlet/*","*/mcommerce/shoppingcart*"])){
				if (c.checkurl(["*OrderItemDisplay|PromotionCodeManage*","*/mcommerce/shoppingcart*"]))
					this.activePage = "cart";
				if (c.checkurl("*CheckoutWelcome|CheckoutAddress|IrwProceedFromCheckoutAddressView*"))
					this.activePage = "address";
				if (c.checkurl("*DeliveryOptions*"))
					this.activePage = "delivery";
			}
			c.setStorage("freight_mobileplatform", this.mobileCheckout());

			if (this.activePage == "cart"){
				if (this.mobileCheckout()){
					//M2 hide to checkout button
					Extension.Element.get("#checkoutButtonBoxTop", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("visibility", "hidden");
						}
					});

					//M2 hide calculation
					Extension.Element.get(".calculate", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "none");
						}
					});

					//M2 hide click & collect
					Extension.Element.get(".clickCollectBody", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].parentNode.style.setProperty("display", "none");
						}
					});

					//M2 hide click & collect
					Extension.Element.get(".clickCollectHeader", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].parentNode.style.setProperty("display", "none");
						}
					});
					//M2 hide mandatoryErrorMsgBottom
					Extension.Element.get("#mandatoryErrorMsgBottom", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "none");
						}
					});
				} else {

					//cosmetic fix for freight IRW
					Extension.Element.get("#checkoutOptimization .beginCheckout .shoppingListDelivery", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("overflow", "hidden");
						}
					});

					//M2 hide mandatoryErrorMsgBottom
					Extension.Element.get("#shippingInfoBottom", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "none");
						}
					});

					//Hide bottom calculation
					Extension.Element.get("#deliveryAllWrapBottom", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "none");
						}
					});

					//Making sure elements are visible
					Extension.Element.get("#cartFooter", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "block");
						}
					});
					Extension.Element.get(".SummaryWrapper", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "block");
						}
					});
					Extension.Element.get(".shoppingSubTotalExlDelivery", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "block");
						}
					});
					Extension.Element.get(".shoppingListDelivery", function(selector, elem){
						for (var i=0; i<elem.length; i++){
							if (elem[i]) elem[i].style.setProperty("display", "block");
						}
					});

				}
				this.FreightCalcCart(function(){
					Extension.FreightCalc.FreightCalcButtons(function(){
						Extension.FreightCalc.checkParcelFreightCalcRestriction();
						
						if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
						
							Extension.FreightCalc.addingStates(function(){
								Extension.FreightCalc.savedCookieImport();
								
								var elem = document.getElementById("ext-hs-input-lower-field-state");
								if (Extension.FreightCalc.settings.calculatebutton){
									Extension.Common.addEvent(elem, "change", function (e) {
										Extension.FreightCalc.toggleDeliveryType('hs', 'auto');
										Extension.FreightCalc.calcButtonValidate();
										var elem = document.getElementById("ext-hs-calculate-button");
										if (elem) Extension.Common.addClass(elem, "ext-show");
										
										var valid = false;
										var elem = document.getElementById("ext-hs-input-lower-field");
										if (ExtensionSetting.Country.storeId == "3" || ExtensionSetting.Country.storeId == "12"){
											var state = document.getElementById("ext-hs-input-lower-field-state");
											if (state) {
												if (state.selectedIndex > 0) {
													if (elem.value.length == Extension.FreightCalc.settings.zipcodedigits) 
														valid = true;
												}
											}
										} else if (elem.value.length == Extension.FreightCalc.settings.zipcodedigits) valid = true;

										if(!valid){
											var elem = document.getElementById('ext-hs-result');
											if (elem) Extension.Common.removeClass(elem, 'ext-show');
											var elem = document.getElementById('ext-ex-result');
											if (elem) Extension.Common.removeClass(elem, 'ext-show');
											Extension.FreightCalc.setInfoCookie('{"zc":"","na":"","dt":"hs","ex":"' + Extension.FreightCalc.cookie.ex + '"}');
											Extension.FreightCalc.resultstore.hs = undefined;
											Extension.FreightCalc.revertPrices();
											if (Extension.FreightCalc.settings.forcezipcodeentry){
												Extension.FreightCalc.deactivateContinueButtons();
												Extension.Common.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
												Extension.Common.addClass(document.getElementById("ext-ex-button-text-error"), "ext-show");
												Extension.Common.addClass(document.getElementById("ext-hs-button-text-error-klarna"), "ext-show");
												Extension.Common.addClass(document.getElementById("ext-ex-button-text-error-klarna"), "ext-show");
											}
										}
									});

								} else {
									Extension.Common.addEvent(elem, "change", function (e) {
										Extension.FreightCalc.toggleDeliveryType('hs', 'auto');
										if (document.getElementById("ext-hs-option-default").selected !== true){
											var state = e.target.value + "|";
											var zipcode = document.getElementById("ext-hs-input-lower-field");
											if (zipcode) {
												if (zipcode.value.length == Extension.FreightCalc.settings.zipcodedigits) {
													var value = state + zipcode.value;
													Extension.FreightCalc.calculateShipping({
														zc: value,
														na: '',
														dt: 'hs',
														ex: Extension.FreightCalc.cookie.ex
													});
												}
											}

										} else {
											Extension.Common.removeClass(document.getElementById("ext-hs-result"), "ext-show");
											Extension.Common.removeClass(document.getElementById("ext-calc-hs-result-error-div"), "ext-show");
											//Extension.Common.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
											Extension.FreightCalc.deactivateContinueButtons();
										}
									});
								}
							});
						}
						if (Extension.FreightCalc.settings.pickuppoints){
							Extension.FreightCalc.addingPickupPoints(function(){
								Extension.FreightCalc.savedCookieImport();

								var elem = document.getElementById("ext-pp-input-lower-field");

								Extension.Common.addEvent(elem, "change", function (e) {
									Extension.FreightCalc.toggleDeliveryType('pp', 'auto');

									if(document.getElementById("ext-pp-option-default").selected !== true){
										var pupInfo = JSON.parse(this.value);
										Extension.FreightCalc.calculateShipping({
											zc: pupInfo.zc,
											na: pupInfo.na,
											dt: 'pp',
											ex: Extension.FreightCalc.cookie.ex,
											system: "irw"
										});
									} else {
										Extension.Common.removeClass(document.getElementById("ext-pp-result"), "ext-show");
										Extension.Common.removeClass(document.getElementById("ext-calc-pp-result-error-div"), "ext-show");
										Extension.Common.addClass(document.getElementById("ext-hs-button-text-error"), "ext-show");
										Extension.Common.addClass(document.getElementById("ext-pp-button-text-error-klarna"), "ext-show");
										Extension.FreightCalc.deactivateContinueButtons();
									}
								});
							});
						}
						if (Extension.FreightCalc.settings.clickcollect){
							Extension.FreightCalc.addingClickCollects(function(){
								Extension.FreightCalc.savedCookieImport();

								var elem = document.getElementById("ext-cc-input-lower-field");

								Extension.Common.addEvent(elem, "change", function (e) {
									Extension.FreightCalc.toggleDeliveryType('cc', 'auto');
									if(document.getElementById("ext-cc-option-default").selected !== true){
										var system = "M2";
										if (!Extension.FreightCalc.mobileCheckout())
											system = "IRW"
										
										Extension.IBES.sendPayloadJsonp({
											system: system,
											service: "fetchlocation",
											selector: "#ext-cc-input-lower-field",
											loading: function(){
												//Clear resultstate
												Extension.FreightCalc.resultstore.cc = undefined;
												
												//Deactivate all input and continue buttons
												Extension.FreightCalc.deactivateAll();
												Extension.FreightCalc.deactivateContinueButtons();
												Extension.FreightCalc.freightCalcLoaders.show("#ext-cc-input-lower-div .ext-freightcalc-loader");
												Extension.Common.addClass(document.getElementById("ext-cc-result"), "ext-faded");
												Extension.Common.removeClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
												Extension.Common.removeClass(document.getElementById("ext-cc-button-text-error"), "ext-show");

											},
											success: function(response){
												var data = {};
												var elem = e.target[e.target.selectedIndex];
												if (elem){
													var zc = elem.id.replace("ext-cc-option_", ""),
														na = elem.innerHTML.replace(/&nbsp;/g, "");
													data = {
														zc: zc,
														na: na,
														dt: "cc",
														ex: Extension.FreightCalc.cookie.ex
													}
													Extension.FreightCalc.setInfoCookie('{"zc":"' + data.zc + '","na":"' + data.na + '","dt":"' + data.dt + '","ex":"' + data.ex + '"}');
												}

												//Save result state

												Extension.FreightCalc.resultstore.cc = {data: data, response: response};

												Extension.FreightCalc.clickcollectcarturl = response.responseJSON.target;
												Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-faded");

												// Date and price
												document.getElementById("ext-calc-cc-result-delivery-date").innerHTML = "";
												document.getElementById("ext-calc-cc-result-price").innerHTML = Extension.Translation.data.freight.clickcollectprice;

												Extension.FreightCalc.setPickingPrices();

												setTimeout(function(){
													Extension.Common.addClass(document.getElementById("ext-cc-result"), "ext-show");
													Extension.Common.removeClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
													Extension.FreightCalc.activateContinueButtons();
												}, 600);
											},
											failure: function(response){
												Extension.FreightCalc.clickcollectcarturl = undefined;
												Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-show");
												if (response.responseJSON){
													setTimeout(function(){
														Extension.Common.addClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
														Extension.Common.addClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
													}, 600);
													var elem = document.getElementById("ext-calc-cc-result-error-span");
													var error = Extension.IBES.getErrorMessageByErrorCode(response.responseJSON.code);
													if (elem && error) elem.innerHTML = error.text;
												}
												Extension.FreightCalc.revertPrices();

											},
											exception: function(response){
												Extension.FreightCalc.clickcollectcarturl = undefined;
												Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-show");
												if (response.responseJSON){
													setTimeout(function(){
														Extension.Common.addClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
														Extension.Common.addClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
													}, 600);
													var elem = document.getElementById("ext-calc-cc-result-error-span");
													var error = Extension.IBES.getErrorMessageByErrorCode(response.responseJSON.code);
													if (elem && error) elem.innerHTML = error.text;
												}
												Extension.FreightCalc.revertPrices();

											},
											complete: function(response){
												Extension.FreightCalc.activateAll();
												Extension.FreightCalc.freightCalcLoaders.hide();
											}
										});
									} else {
										//Clear resultstate
										Extension.FreightCalc.resultstore.cc = undefined;

										Extension.Common.removeClass(document.getElementById("ext-cc-result"), "ext-show");
										Extension.Common.removeClass(document.getElementById("ext-calc-cc-result-error-div"), "ext-show");
										Extension.Common.addClass(document.getElementById("ext-cc-button-text-error"), "ext-show");
										
										Extension.FreightCalc.activateAll();
										Extension.FreightCalc.deactivateContinueButtons();
										Extension.FreightCalc.revertPrices();
									}
								});
							});
						}
						Extension.FreightCalc.savedCookieImport();
					});
				});
			}

			if (this.activePage == "address"){
				Extension.FreightCalc.addressLoadGeneralSettings(function(){

					if (Extension.FreightCalc.settings.pickuppoints){
						Extension.Element.get({selector:["#accordionContent div", "#deliveryBox"], timeout: 2000, returnstatus: true}, function(selector, elem){
							//  "#accordionContent div",
							if (elem.status == "success"){
								Extension.FreightCalc.FreightCalcAddress(function(){
									Extension.FreightCalc.toggleDeliveryType(Extension.FreightCalc.cookie.dt);

									Extension.FreightCalc.addingPickupPoints(function(){
										Extension.FreightCalc.savedCookieImport();

										var elem = document.getElementById("ext-pp-input-lower-field");
										Extension.Common.addEvent(elem, "change", function (e) {
											Extension.FreightCalc.toggleDeliveryType('pp', 'auto');

											if(document.getElementById("ext-pp-option-default").selected !== true){
												var pupInfo = JSON.parse(this.value);
												Extension.FreightCalc.calculateShipping({
													zc: pupInfo.zc,
													na: pupInfo.na,
													dt: 'pp',
													ex: Extension.FreightCalc.cookie.ex,
													system: "irw"
												});
											} else {
												Extension.Common.removeClass(document.getElementById("ext-pp-result"), "ext-show");
												Extension.Common.removeClass(document.getElementById("ext-calc-pp-result-error-div"), "ext-show");
												Extension.FreightCalc.deactivateContinueButtons();
											}
										});

										Extension.FreightCalc.addressLoadAdditionalSettings();
										Extension.FreightCalc.otherAddressAdjustments(Extension.FreightCalc.cookie.dt);
									});
								});

							} else {
								var ct = Extension.FreightCalc.checkCustomerType(),
									zc = "",
									elem;
								elem = document.getElementById("signup_checkout_" + ct + "_zipCode");
								if (elem) zc = elem.value;
								Extension.FreightCalc.setInfoCookie('{"zc":"' + zc + '","na":"","dt":"hs","ex":"false"}');
							}
						});
					}
				});
			}

			if (this.activePage == "delivery"){

				if (Extension.FreightCalc.settings.deliveryrestrictions){
					var dr = this.checkDeliveryRestrictions(this.cookie.zc);
					if (c.varExist(dr)) {
						Extension.Element.get({selector:["#deliveryOptionsBox .paymentAddressBox", ".infoContainer.nameAddress"], timeout: 2000}, function(selector, targetelem){
							var elem = document.createElement("div");
							elem.id = "ext-delivery-restriction";
							elem.innerHTML = "" +
							"<div id=\"ext-cont\" class=\"infoContainer ext-border-red\" style=\"padding-bottom: 15px\">" +
							"   <div class=\"deliveryCol1 headerAddress\">" + Extension.Translation.data.freight.deliveryrestrictiontext + "</div>" +
							"   <div class=\"addressContainer last deliveryCol2\">" + dr.restriction +  "</div>" +
							"</div>";
							targetelem[0].parentNode.insertBefore(elem, targetelem[0].nextSibling);
						});
					}
				}
				if (Extension.FreightCalc.settings.country == "no"){
					if (Extension.FreightCalc.settings.pickuppoints){
						if (this.cookie.dt == "pp"){
							
							Extension.Element.get("#questions", function(selector, q_elem) {
								q_elem[0].style.setProperty("display", "none");

								if (Extension.FreightCalc.mobileCheckout()){

									Extension.Element.get("#typeOfLivingBusiness", function(selector, elem) {
										elem[0].checked = true;
										//Global updatefunction
										update();

										Extension.Element.get("#question_DEL_ADDRESS_PART_TIME_ACCESSIBLE_no", function(selector, elem) {
											elem[0].checked = true;
											Extension.FreightCalc.questionsAnswered = true;
										});
									});
								} else {
									var elem = q_elem[0].querySelectorAll(".question .questionField .radioAnswer");
									if (elem.length > 2) {
										elem = elem[2].querySelector("input");
										if (elem) elem.click();
									}

									Extension.Element.get("#question_DEL_ADDRESS_PART_TIME_ACCESSIBLE_no", function(selector, elem) {
										elem[0].checked = true;
										Extension.FreightCalc.questionsAnswered = true;
									});
								}


								setTimeout(function(){
									if (!Extension.FreightCalc.questionsAnswered) q_elem[0].style.setProperty("display", "block");
								}, 2000);
							});

							if (Extension.FreightCalc.mobileCheckout()){
								Extension.Element.get("#deliveryMethod span.spanRight", function(selector, elem, cookie) {
									elem[0].innerHTML = "Pick-up Point " + cookie.na;
								}, this.cookie);
							} else {
								Extension.Element.get("#restrictions h3", function(selector, elem) {
									elem[0].style.setProperty("display", "none");
								});
								Extension.Element.get("#deliveryMethod .deliveryCol2", function(selector, elem, cookie) {
									elem[0].innerHTML = "Pick-up Point " + cookie.na;
								}, this.cookie);
							}
						} else {
							if (Extension.FreightCalc.mobileCheckout()){
								Extension.Element.get("#deliveryMethod span.spanRight", function(selector, elem) {
									var parcel = false,
										pcw = Extension.FreightCalc.settings.parcelcheckwords;
									for (var i=0; i<pcw.length; i++){
										if (elem[0].innerHTML.indexOf(pcw[i]) > -1)
											parcel = true;
									}
									if (!parcel) {
										elem[0].innerHTML = "Hjemlevering";
										Extension.Element.get("#typeOfLivingBusiness", function(selector, elem) {
											elem[0].parentNode.querySelector("label").innerHTML = "Bedrift";
										});
									}
								});
							} else {
								Extension.Element.get("#deliveryMethod .deliveryCol2", function(selector, elem) {
									var parcel = false,
										pcw = Extension.FreightCalc.settings.parcelcheckwords;
									for (var i=0; i<pcw.length; i++){
										if (elem[0].innerHTML.indexOf(pcw[i]) > -1)
											parcel = true;
									}
									if (!parcel) {
										elem[0].innerHTML = "Hjemlevering";
										Extension.Element.get("#typeOfLiving3", function(selector, elem) {
											elem[0].parentNode.querySelector("label").innerHTML = "Bedrift";
										});
									}
								});
							}
						}
					}
				}
			}
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-freightcalc");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "IBES", fn: IBES},
			{name: "CryptoJS", fn: CryptoJS},
			{name: "CryptoJSInit1", fn: CryptoJSInit1},
			{name: "CryptoJSInit2", fn: CryptoJSInit2},
			{name: "FreightCalc", fn: FreightCalc}
		],
		dependencies: ["User"],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup FreightCalc " + str);
			});
			//Initiate FreightCalc
			var mw = "";
			if (Extension.FreightCalc.mobileCheckout())
				mw = "mw_";
			var host = (location.hostname.indexOf("ikea.com") > -1) ? "secure.ikea.com" : location.hostname;
        	IBES.cnc_configuration_url = '//' + host + '/ms/' + ExtensionSetting.Country.locale + '/js/clickcollect_' + mw + 'cart_2b_' + ExtensionSetting.Country.locale + '.js';
			Extension.CryptoJSInit1();
			Extension.CryptoJSInit2();

			Extension.Version.load('extpup', true, function(e) {
				Extension.Source.load('Translation', Extension.Version.forcePreview || Extension.Version.preview, function(data) {
					Extension.Translation.data = data.translation;

					if (Extension.Common.checkurl(['*stores/servlet*', "*/mcommerce/shoppingcart*"])) {
						Extension.Source.load('Freight LCDPrices', Extension.Version.forcePreview || Extension.Version.preview, function(data) {
							Extension.FreightCalc.init(data);

							//Test setup for local testers
							Extension.Version.load("klarnatesting", false, function(){
								Settings.forcezipcodeentry = true;
								var elem = document.getElementById("ext-pay-with-other-card-wrapper");
								if (elem) elem.style.setProperty("display", "block");
								window.MaxymiserKlarnaIRWhs = true;
								window.MaxymiserKlarnaIRWpp = true;
								window.MaxymiserKlarnaM2hs = true;
								window.MaxymiserKlarnaM2pp = true;
							});
							//Klarna override
							Extension.Version.load("iamabot", false, function(){
								window.iamabot = true;
							});
							if (document.URL.match(/[?|&]klarna=disabled/g)){
								window.iamabot = true;
							}
						});
					}
				});
			});
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();
