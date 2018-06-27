/*

  _
 |_)         _. |_  o | o _|_
 |_) |_| \/ (_| |_) | | |  |_ \/
		 /                    /

*/
(function(){
	
	var Hidebuttons = function(){
		var c = Extension.Common,
			e = Extension.Element;
		if (c.checkMobile()){
			if (c.checkurl("*/p/*")){
				e.hidestyle({
					selector: ".product-pip__purchase, #stock-check",
					id: "buyability"
				});
			}
		} else {
			if (c.checkurl("*/catalog/products/*")){
				e.hidestyle({
					selector: "#rightNavContainer .rightNavSubContainer.marginForCartConatiner, #stockResultHolder, #sticky-product .svgCartButtonContainer.sticky-cart button",
					id: "buyability"
				});
			} else if (c.checkurl("*/catalog/availability/*")){
				e.hidestyle({
					selector: ".actionBlock, form#product",
					id: "buyability"
				});
			} else if (c.checkurl("*/wishlistItemDisplay")) {
				e.hidestyle({
					selector: "td.colBuyable .buttonContainer, tr#addAllToCartButton",
					id: "buyability"
				});
			}
		}
	}
	/*
	Extension.Version.load('extbuy', false, function(e) {
		Extension.Version.load('extbuyhideearly', false, function(e) {
			Extension.Hidebuttons();
		});
	});
	*/

	var Buyability = {
		init: function(data){

			Extension.Buyability.repeat = false;
			Extension.Time.get(function(time, data){
				for (var i=0; i<data.buyability.length; i++){
					if (data.buyability[i].active){
						Extension.Buyability.dateValidation(data.buyability[i], function(module){
							Extension.Targeting.products(module.targeting, function(products, buyability){
								var c = Extension.Common;
								if (c.varExist(products.pagetype)){
									switch(products.pagetype) {
										case "pip":
											Extension.Buyability.pip(products, buyability);
											break;
										case "plp":
											Extension.Buyability.plp(products, buyability);
											break;
										case "search":
											Extension.Buyability.search(products, buyability);
											break;
										case "availability":
											Extension.Buyability.availability(products, buyability);
											break;
										case "wishlist":
											Extension.Buyability.wishlist(products, buyability);
											break;
									}
								}
							}, {buyability: data.buyability, currentbuyability: data.buyability[i]});
						});
					}
				}
			}, data);
		},

		dateValidation: function(module, callback) {
			var c = Extension.Common;
			module.validation = module.validation || {};
							
			try {
				if (module.when){
					var within_dates = false;
					if (module.when.dates){
						module.when.dates = c.toArray(module.when.dates);
						if (module.when.dates.length > 0){
							module.validation.dates = module.when.dates || {};
							var dates = module.when.dates;
							for (var i = 0; i < dates.length; i++) {
								if (dates[i].from){
									if (c.isObject(dates[i].from)){
										if (dates[i].from.date){
											if (c.varExist(dates[i].from.date, true)){
												var da = dates[i].from.date.replace(/[^0-9]/g, "");
												if (da.length == 8){
													da = da.slice(0,4) + "-" + da.slice(4,6) + "-" + da.slice(6,8);
													var ti = "00:00";
													if (c.varExist(dates[i].from.time, true)){												
														var ti_temp = dates[i].from.time.replace(/[^0-9]/g, "");
														if (ti_temp.length == 4)
															ti = ti_temp.slice(0,2) + ":" + ti_temp.slice(2,4);
													}
													dates[i].from = new Date(da + "T" + ti + ":00.000Z")
												} else {
													dates[i].from = new Date(1000000000000000);
													console.log("Extension.Buyability.dateValidation: From: Date format must be YYYYMMDD or YYYY-MM-DD");
												}
											} else 
												dates[i].from = new Date(-1000000000000000);
										}
									}
								}
								if (dates[i].to){
									if (c.isObject(dates[i].to)){
										if (dates[i].to.date){
											if (c.varExist(dates[i].to.date, true)){
												var da = dates[i].to.date.replace(/[^0-9]/g, "");
												if (da.length == 8){
													da = da.slice(0,4) + "-" + da.slice(4,6) + "-" + da.slice(6,8);
													var ti = "00:00";
													if (c.varExist(dates[i].to.time, true)){												
														var ti_temp = dates[i].to.time.replace(/[^0-9]/g, "");
														if (ti_temp.length == 4)
															ti = ti_temp.slice(0,2) + ":" + ti_temp.slice(2,4);
													}
													dates[i].to = new Date(da + "T" + ti + ":00.000Z")
												} else {
													dates[i].to = new Date(-1000000000000000);
													console.log("Extension.Buyability.dateValidation: To: Date format must be YYYYMMDD or YYYY-MM-DD");
												}
											} else 
												dates[i].to = new Date(1000000000000000);
										}
									}
								}
								if (!c.varExist(dates[i].from, true))
									dates[i].from = new Date(-1000000000000000);
								if (!c.varExist(dates[i].to, true))
									dates[i].to = new Date(1000000000000000);  
								
								if (Extension.Time.dateValidation(dates[i].from, dates[i].to))
									within_dates = true;
																
							}
						} //else within_dates = true;

						if (within_dates) {
							if (module.when.intervals){
								this.timeValidation(module, function(module){
									callback(module);
								});
							} else callback(module);
						} 

					} else if (module.when.intervals){
						this.timeValidation(module, function(module){
							callback(module);
						});
					} // else callback(module);
				} // else callback(module);
			} catch (err) {
				console.log("Extension.Buyability.dateValidation: Err: " + err);
			}

		},
		timeValidation: function(module, callback) {
			try {
				var within_times = false;
				for (var v=0; v<module.when.intervals.length; v++){
					module.validation.intervals = module.when.intervals || [];
					if (module.when.intervals[v].times){
						if (module.when.intervals[v].times.length > 0){
							var times = module.when.intervals[v].times;
							for (var i = 0; i < times.length; i++) {
								var time = times[i];
								time.split = {
									from: time.from.split(":")
									, to: time.to.split(":")
								}
								if (time.split.from.length > 1 && time.split.to.length > 1){
									var server = new Date(Extension.TimeNow);
									time.relevant_dates = {
										from: new Date(server.getFullYear(),server.getMonth(),server.getDate(),time.split.from[0],time.split.from[1],0,0)
										, to: new Date(server.getFullYear(),server.getMonth(),server.getDate(),time.split.to[0],time.split.to[1],0,0)
									}

									if (server.getTime() > time.relevant_dates.from.getTime() && server.getTime() < time.relevant_dates.to.getTime()){
										module.validation.intervals[v].times[i].status = "now";
										within_times = true;
									} else if (server.getTime() > time.relevant_dates.to.getTime())
										module.validation.intervals[v].times[i].status = "future";
									else if (server.getTime() < time.relevant_dates.from.getTime())
										module.validation.intervals[v].times[i].status = "past";
								}
							}
						} else within_times = true;
					} else within_times = true;

					var within_days = false;
					if (module.when.intervals[v].days){
						module.validation.intervals[v].days = [];
						module.when.intervals[v].days = Extension.Common.toArray(module.when.intervals[v].days);
						if (module.when.intervals[v].days.length > 0){
							for (var i = 0; i < module.when.intervals[v].days.length; i++){
								var days = module.when.intervals[v].days[i].toString().replace(/[^0-9,]/g,"");
								days = days.split(",");
								for (var j = 0; j < days.length; j++){
									var server = new Date(Extension.TimeNow);
									if (server.getDay().toString() == days[j]){
										module.validation.intervals[v].days.push({day: days[j], status: true});
										within_days = true;
									} else 
										module.validation.intervals[v].days.push({day: days[j], status: false});
								}
							}
						} else within_days = true;
					} else within_days = true;
				}
				 
				if ((within_times && within_days)){
					callback(module);
				}

			} catch (err) {
				console.log("Extension.Buyability.timeValidation: Err: " + err);
			}
		},
		injectInfo: function(buyability, loc, page_platform){
			var c = Extension.Common,
				e = Extension.Element;
			if (c.varExist(buyability.info)){
				if (c.varExist(buyability.info.content) && c.varExist(buyability.info.setting)){
					if (buyability.info.setting.pip){
						e.get({selector: loc.selector,baseelem: document}, function(selector, targetelem, context){
							var c = Extension.Common,
								infotypes = ["text", "html"];
							for (var j=0; j<infotypes.length; j++){
								if (c.varExist(context.buyability.info.content[infotypes[j]], true)){
									var elem = document.getElementById("ext-buyability-info-" + page_platform + "-" + infotypes[j]);
									if (!elem){
										elem = document.createElement("div");
										elem.id = "ext-buyability-info-" + page_platform + "-" + infotypes[j];
										elem.innerHTML = context.buyability.info.content[infotypes[j]];
										Extension.Element.inject(elem, targetelem[0], context.placing);
									} else {
										elem.innerHTML = context.buyability.info.content[infotypes[j]];
									}
								}
							}
						}, {
							buyability: buyability,
							placing: loc.placing
						});
					}
				}
			}
		},
		pip: function(products, buyability){
			if (Extension.Common.checkMobile()){
				var c = Extension.Common,
					e = Extension.Element,
					elems = products.dom.main.elems;

				for (var i=0; i<elems.length; i++){

					Extension.Buyability.injectInfo(buyability.currentbuyability, products.dom.main.loc[2], "pip-m2");

					if (c.varExist(buyability.currentbuyability.actions)){
						// Disable "add to cart" button.
						if (buyability.currentbuyability.actions.disableAddToCartButton){
							e.get({selector: 'button.js-purchase-add-to-cart',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem){
									elem.setAttribute("disabled", "disabled");
									e.get({selector: 'span.icon',baseelem: elem}, function(selector, elem){
										elem = elem[0];
										if (elem){
											Extension.Common.removeClass(elem, "icon__shoppingbag");
											Extension.Common.addClass(elem, "icon__shoppingbag-disabled");
										}
									});
								}
							});
							e.get({selector: 'button.gl_sticky-buy__btn',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem){
									elem.setAttribute("disabled", "disabled");
									e.get({selector: 'span.icon',baseelem: elem}, function(selector, elem){
										elem = elem[0];
										if (elem){
											Extension.Common.removeClass(elem, "icon__shoppingbag");
											Extension.Common.addClass(elem, "icon__shoppingbag-disabled");
										}
									});
								}

							});
						}
						
						// Remove "add to cart" button.
						if (buyability.currentbuyability.actions.removeAddToCartButton){
							e.get({selector: 'button.js-purchase-add-to-cart',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});
						}

						// Remove "add to list" button.
						if (buyability.currentbuyability.actions.removeAddToListButton){
							e.get({selector: 'button.js-purchase-add-to-list',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});
						}

						// Remove quantity box.
						if ((buyability.currentbuyability.actions.disableAddToCartButton || buyability.currentbuyability.actions.removeAddToCartButton) && buyability.currentbuyability.actions.removeAddToListButton){
							e.get({selector: 'form.purchase.js-purchase div.purchase-amount',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0].parentNode;
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});
						}

						// Remove "stock check".
						if (buyability.currentbuyability.actions.removeStockCheck){
							e.get({selector: '#stock-check',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});
							e.get({selector: '.product-pip__find_product.js-find-product',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});

						}

						// Remove "not shoppable online" text.
						if (buyability.currentbuyability.actions.removeShopableOnlineText){
							e.get({selector: 'p.js-purchase-disclaimer',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									elem.setAttribute("aria-hidden", "true");
							});
						} else {
							e.get({selector: 'p.js-purchase-disclaimer',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									elem.setAttribute("aria-hidden", "false");
							});
						}
					}

				}

			} else {
				if (!Extension.Buyability.repeat){
					Extension.Buyability.repeat = true;
					Extension.Common.monitorUrlChange({
						products: products,
						buyability: buyability.buyability,
						onchange: function(data){
							var c = Extension.Common,
								e = Extension.Element;
							if (c.varExist(Extension.Buyability.save)){

								e.remove(document.getElementById("ext-buyability-info-pip-irw-text"));
								e.remove(document.getElementById("ext-buyability-info-pip-irw-html"));

								if (c.varExist(Extension.Buyability.save.actions)){
									// Enable "add to cart" button.
									if (Extension.Buyability.save.actions.disableAddToCartButton){
										e.get({selector: '#buttonBorder2 button#jsButton_buyOnline_lnk',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem){
												Extension.Common.removeClass(elem, "ext-disabled");
												elem.removeAttribute("disabled");
												e.get({selector: 'svg',baseelem: elem}, function(selector, elem){
													elem = elem[0];
													if (elem)
														elem.innerHTML = '<path class="cxcls-1" d="M6 15H5v2H3v1h2v2h1v-2h2v-1H6v-2zm1.09-6a5 5 0 0 1 9.81 0H7.09zm10.83 0A6 6 0 0 0 6.08 9H2l1.4 5h1l-1.08-4h17.36l-2.52 9H9v1h9.92L22 9h-4.08z"></path>';
												});
											}
										});
										e.get({selector: '#sticky-product .svgCartButtonContainer.sticky-cart button',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem){
												Extension.Common.removeClass(elem, "ext-disabled");
												elem.removeAttribute("disabled");
												e.get({selector: 'svg',baseelem: elem}, function(selector, elem){
													elem = elem[0];
													if (elem)
														elem.innerHTML = '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#shopping-bag-add"><svg viewBox="0 0 24 24" id="shopping-bag-add" width="100%" height="100%"><path class="cxcls-1" d="M6 15H5v2H3v1h2v2h1v-2h2v-1H6v-2zm1.09-6a5 5 0 0 1 9.81 0H7.09zm10.83 0A6 6 0 0 0 6.08 9H2l1.4 5h1l-1.08-4h17.36l-2.52 9H9v1h9.92L22 9h-4.08z"></path></svg></use>';
												});
											}
										});
									}
									// Show "add to cart" button.
									if (Extension.Buyability.save.actions.removeAddToCartButton){
										e.get({selector: '#buttonBorder2',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
										e.get({selector: '#sticky-product .svgCartButtonContainer.sticky-cart button',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
									}
									// Show "add to list" button.
									if (Extension.Buyability.save.actions.removeAddToListButton){
										e.get({selector: '#buttonBorder3',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
										e.get({selector: '#sticky-product .svgListButtonContainer.sticky-list button',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
									}
									// Show quantity box.
									if ((Extension.Buyability.save.actions.disableAddToCartButton || Extension.Buyability.save.actions.removeAddToCartButton) && Extension.Buyability.save.actions.removeAddToListButton){
										e.get({selector: '#quantity',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
											elem = document.querySelector(".quantityLabel");
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
											elem = document.querySelector(".rightNavSubContainer");
											if (elem)
												elem.style.setProperty("border-bottom", ".104em solid #ccc;");
										});
									}

									// Show "stock check".
									if (Extension.Buyability.save.actions.removeStockCheck){
										e.get({selector: '#stockResultHolder',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
									}

									// Show "not shoppable online" text.
									if (Extension.Buyability.save.actions.removeShopableOnlineText){
										e.get({selector: '#availableOnline',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
										e.get({selector: '#notAvailableOnline',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-inline-block");
										});
									} else {
										e.get({selector: '#availableOnline',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-inline-block");
										});
										e.get({selector: '#notAvailableOnline',baseelem: document}, function(selector, elem){
											elem = elem[0];
											if (elem)
												Extension.Common.removeClass(elem, "ext-display-none");
										});
									}
								}

								delete Extension.Buyability.save;
							}
							for (var n=0; n<data.buyability.length; n++){
								Extension.Buyability.dateValidation(data.buyability[n], function(module){
									Extension.Targeting.products(module.targeting, function(products, buyability){
										var c = Extension.Common,
											e = Extension.Element,
											elems = products.dom.main.elems;

										for (var i=0; i<elems.length; i++){

											Extension.Buyability.injectInfo(buyability, products.dom.main.loc[2], "pip-irw");

											if (c.varExist(buyability.actions)){
												// Disable "add to cart" button.
												if (buyability.actions.disableAddToCartButton){
													e.get({selector: '#buttonBorder2 button#jsButton_buyOnline_lnk',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem){
															Extension.Common.addClass(elem, "ext-disabled");
															elem.setAttribute("disabled", "disabled");
															e.get({selector: 'svg',baseelem: elem}, function(selector, elem){
																elem = elem[0];
																if (elem)
																	elem.innerHTML = '<defs><polygon id="path-1" points="0.8549 19 19.9369 19 19.9369 0.231 0.8549 0.231 0.8549 19"></polygon></defs><path d="M1.3181,7.1663 L3.9951,7.1663 L10.7381,7.1663 L11.7551,6.1663 L5.0951,6.1663 C5.5581,3.8823 7.5811,2.1573 10.0001,2.1573 C11.5821,2.1573 12.9851,2.9033 13.9031,4.0533 L14.6301,3.3383 C13.5291,2.0063 11.8641,1.1573 10.0001,1.1573 C7.0231,1.1573 4.5591,3.3243 4.0841,6.1663 L9.99999975e-05,6.1663 L2.5361,15.2343 L3.3501,14.4333 L1.3181,7.1663 Z" id="Fill-2" fill="#FFFFFF"></path><polygon id="Fill-8" fill="#FFFFFF" points="15.0327 7.1663 16.0047 7.1663 18.6817 7.1663 16.1647 16.1663 5.8827 16.1663 4.8657 17.1663 16.9227 17.1663 19.9997 6.1663 16.0497 6.1663"></polygon><polygon id="Fill-10" fill="#FFFFFF" mask="url(#mask-2)" points="14.4519 4.9162 13.1809 6.1662 12.1639 7.1662 3.6579 15.5332 2.8439 16.3342 0.8549 18.2902 1.5759 19.0002 19.9369 0.9402 19.2159 0.2302 15.2049 4.1762"></polygon>';
															});
														}
													});


													e.get({selector: '#sticky-product .svgCartButtonContainer.sticky-cart button',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem){
															Extension.Common.addClass(elem, "ext-disabled");
															elem.setAttribute("disabled", "disabled");
															e.get({selector: 'svg',baseelem: elem}, function(selector, elem){
																elem = elem[0];
																if (elem)
																	elem.innerHTML = '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#shopping-bag-not-available"><svg id="shopping-bag-not-available" viewBox="0 0 24 24" width="100%" height="100%"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="PIP-VER_1_1--Copy-11" transform="translate(-962.000000, -636.000000)"><g id="Page-1" transform="translate(962.000000, 635.000000)"><path d="M2.844,17.1037 L3.658,16.3027 L2.844,17.1037 Z" id="Fill-1" fill="#FFFFFF"></path><g id="Group-13" transform="translate(0.000000, 0.769500)"><path d="M1.3181,7.1663 L3.9951,7.1663 L10.7381,7.1663 L11.7551,6.1663 L5.0951,6.1663 C5.5581,3.8823 7.5811,2.1573 10.0001,2.1573 C11.5821,2.1573 12.9851,2.9033 13.9031,4.0533 L14.6301,3.3383 C13.5291,2.0063 11.8641,1.1573 10.0001,1.1573 C7.0231,1.1573 4.5591,3.3243 4.0841,6.1663 L9.99999975e-05,6.1663 L2.5361,15.2343 L3.3501,14.4333 L1.3181,7.1663 Z" id="Fill-2" fill="#FFFFFF"></path><polygon id="Fill-4" fill="#FFFFFF" points="15.2048 4.1757 15.2048 4.1757 14.4518 4.9157 14.4518 4.9157"></polygon><polygon id="Fill-6" fill="#FFFFFF" points="13.1812 6.1663 13.1812 6.1663 12.1642 7.1663"></polygon><polygon id="Fill-8" fill="#FFFFFF" points="15.0327 7.1663 16.0047 7.1663 18.6817 7.1663 16.1647 16.1663 5.8827 16.1663 4.8657 17.1663 16.9227 17.1663 19.9997 6.1663 16.0497 6.1663"></polygon><g id="Group-12"><g id="Clip-11"></g><polygon id="Fill-10" fill="#FFFFFF" mask="url(#mask-2)" points="14.4519 4.9162 13.1809 6.1662 12.1639 7.1662 3.6579 15.5332 2.8439 16.3342 0.8549 18.2902 1.5759 19.0002 19.9369 0.9402 19.2159 0.2302 15.2049 4.1762"></polygon></g></g></g></g></g></svg></use>';
															});
														}
													});
												}
												
												// Remove "add to cart" button.
												if (buyability.actions.removeAddToCartButton){
													e.get({selector: '#buttonBorder2',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
													e.get({selector: '#sticky-product .svgCartButtonContainer.sticky-cart button',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
												}

												// Remove "add to list" button.
												if (buyability.actions.removeAddToListButton){
													e.get({selector: '#buttonBorder3',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
													e.get({selector: '#sticky-product .svgListButtonContainer.sticky-list button',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
												}

												// Remove quantity box.
												if ((buyability.actions.disableAddToCartButton || buyability.actions.removeAddToCartButton) && buyability.actions.removeAddToListButton){
													e.get({selector: '#quantity',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
														elem = document.querySelector(".quantityLabel");
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
														elem = document.querySelector(".rightNavSubContainer");
														if (elem)
															elem.style.setProperty("border-bottom", "0");

													});
												}

												// Remove "stock check".
												if (buyability.actions.removeStockCheck){
													e.get({selector: '#stockResultHolder',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
												}

												// Remove "not shoppable online" text.
												if (buyability.actions.removeShopableOnlineText){
													e.get({selector: '#availableOnline',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
													e.get({selector: '#notAvailableOnline',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-inline-block");
													});
												} else {
													e.get({selector: '#availableOnline',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-inline-block");
													});
													e.get({selector: '#notAvailableOnline',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
												}
											}
											Extension.Buyability.save = buyability;
										}
									}, data.buyability[n]);
								});
							}
						}
					});
				}
			}

			Extension.Element.get("#complementaryProductContainer li.prodClass", function(selector, elem){
				for (var n=0; n<buyability.buyability.length; n++){
					Extension.Buyability.dateValidation(buyability.buyability[n], function(module){
						Extension.Targeting.reload = true;
						Extension.Targeting.products(module.targeting, function(products, buyability){
							if (products.dom.other.compl.elems.length > 0){
								var c = Extension.Common,
									e = Extension.Element,
									elems = products.dom.other.compl.elems;

								for (var i=0; i<elems.length; i++){

									if (c.varExist(buyability.actions)){
										// Disable "add to cart" button.
										if (buyability.actions.disableAddToCartButton){
											e.get({selector: '.svgCartButtonContainer button',baseelem: elems[i]}, function(selector, elem){
												elem = elem[0];
												if (elem){
													Extension.Common.addClass(elem, "ext-disabled");
													elem.setAttribute("disabled", "disabled");
													e.get({selector: 'svg',baseelem: elem}, function(selector, elem){
														elem = elem[0];
														if (elem)
															elem.innerHTML = '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#shopping-bag-not-available"><svg id="shopping-bag-not-available" viewBox="0 0 24 24" width="100%" height="100%"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="PIP-VER_1_1--Copy-11" transform="translate(-962.000000, -636.000000)"><g id="Page-1" transform="translate(962.000000, 635.000000)"><path d="M2.844,17.1037 L3.658,16.3027 L2.844,17.1037 Z" id="Fill-1" fill="#FFFFFF"></path><g id="Group-13" transform="translate(0.000000, 0.769500)"><path d="M1.3181,7.1663 L3.9951,7.1663 L10.7381,7.1663 L11.7551,6.1663 L5.0951,6.1663 C5.5581,3.8823 7.5811,2.1573 10.0001,2.1573 C11.5821,2.1573 12.9851,2.9033 13.9031,4.0533 L14.6301,3.3383 C13.5291,2.0063 11.8641,1.1573 10.0001,1.1573 C7.0231,1.1573 4.5591,3.3243 4.0841,6.1663 L9.99999975e-05,6.1663 L2.5361,15.2343 L3.3501,14.4333 L1.3181,7.1663 Z" id="Fill-2" fill="#FFFFFF"></path><polygon id="Fill-4" fill="#FFFFFF" points="15.2048 4.1757 15.2048 4.1757 14.4518 4.9157 14.4518 4.9157"></polygon><polygon id="Fill-6" fill="#FFFFFF" points="13.1812 6.1663 13.1812 6.1663 12.1642 7.1663"></polygon><polygon id="Fill-8" fill="#FFFFFF" points="15.0327 7.1663 16.0047 7.1663 18.6817 7.1663 16.1647 16.1663 5.8827 16.1663 4.8657 17.1663 16.9227 17.1663 19.9997 6.1663 16.0497 6.1663"></polygon><g id="Group-12"><g id="Clip-11"></g><polygon id="Fill-10" fill="#FFFFFF" mask="url(#mask-2)" points="14.4519 4.9162 13.1809 6.1662 12.1639 7.1662 3.6579 15.5332 2.8439 16.3342 0.8549 18.2902 1.5759 19.0002 19.9369 0.9402 19.2159 0.2302 15.2049 4.1762"></polygon></g></g></g></g></g></svg></use>';
													});
												}
											});
										}
										// Remove "add to cart" button.
										if (buyability.actions.removeAddToCartButton){
											e.get({selector: '.svgCartButtonContainer button',baseelem: elems[i]}, function(selector, elem){
												elem = elem[0];
												if (elem)
													Extension.Common.addClass(elem, "ext-display-none");
											});
										}
										// Remove "add to list" button.
										if (buyability.actions.removeAddToListButton){
											e.get({selector: '.svgListButtonContainer button',baseelem: elems[i]}, function(selector, elem){
												elem = elem[0];
												if (elem)
													Extension.Common.addClass(elem, "ext-display-none");
											});
										}
									}
								}

							}

						}, buyability.buyability[n]);
					});
				}
			});

			Extension.Element.showall("buyability");

		},
		plp: function(products, buyability){
			var c = Extension.Common,
				e = Extension.Element,
				elems = products.dom.main.elems;
			for (var i=0; i<elems.length; i++){

				if (c.varExist(buyability.currentbuyability.actions)){
					// Remove "add to cart" button.
					if (buyability.currentbuyability.actions.disableAddToCartButton || buyability.currentbuyability.actions.removeAddToCartButton){
						e.get({selector: '.moreInfo .buttonsContainer .blueBtn',baseelem: elems[i]}, function(selector, elem){
							elem = elem[0];
							if (elem){
								Extension.Common.addClass(elem, "ext-display-none");
							}
						});
					}

					// Remove "add to list" button.
					if (buyability.currentbuyability.actions.removeAddToListButton){
						e.get({selector: '.moreInfo .buttonsContainer .orangeBtn',baseelem: elems[i]}, function(selector, elem){
							elem = elem[0];
							if (elem)
								Extension.Common.addClass(elem, "ext-display-none");
						});
					}
				}
			}
			if (!Extension.Buyability.repeat){
				Extension.Buyability.repeat = true;
				Extension.Common.addEvent(document, "click", function(evt){
					var c = Extension.Common;

					if (c.hasClass(evt.target.parentNode, "moreProduct")){
						setTimeout(function(){
							for (var n=0; n<buyability.buyability.length; n++){
								Extension.Buyability.dateValidation(buyability.buyability[n], function(module){
									Extension.Targeting.reload = true;
									Extension.Targeting.products(module.targeting, function(products, buyability){
										var c = Extension.Common,
											e = Extension.Element,
											elems = products.dom.main.elems;

										for (var i=0; i<elems.length; i++){

											if (c.varExist(buyability.actions)){
												// Remove "add to cart" button.
												if (buyability.actions.disableAddToCartButton || buyability.actions.removeAddToCartButton){
													e.get({selector: '.moreInfo .buttonsContainer .blueBtn',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem){
															Extension.Common.addClass(elem, "ext-display-none");
														}
													});
													e.get({selector: '#landingPopup .moreInfo .buttonsContainer .blueBtn',baseelem: document}, function(selector, elem){
														elem = elem[0];
														if (elem){
															Extension.Common.addClass(elem, "ext-display-none");
														}
													});

												}

												// Remove "add to list" button.
												if (buyability.actions.removeAddToListButton){
													e.get({selector: '.moreInfo .buttonsContainer .orangeBtn',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
													e.get({selector: '#landingPopup .moreInfo .buttonsContainer .orangeBtn',baseelem: document}, function(selector, elem){
														elem = elem[0];
														if (elem)
															Extension.Common.addClass(elem, "ext-display-none");
													});
												}
											}
										}
									}, buyability.buyability[n]);
								});
							}
						}, 50);
					}

				});

			}
			Extension.Element.showall("buyability");

		},
		search: function(products, buyability){
			if (!Extension.Common.checkMobile()){
				var c = Extension.Common,
					e = Extension.Element,
					elems = products.dom.main.elems;
				for (var i=0; i<elems.length; i++){

					if (c.varExist(buyability.currentbuyability.actions)){
						// Remove "add to cart" button.
						if (buyability.currentbuyability.actions.disableAddToCartButton || buyability.currentbuyability.actions.removeAddToCartButton){
							e.get({selector: '.buttonsContainer .button',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0].parentNode;
								if (elem){
									Extension.Common.addClass(elem, "ext-display-none");
								}
							});
						}

						// Remove "add to list" button.
						if (buyability.currentbuyability.actions.removeAddToListButton){
							e.get({selector: '.buttonsContainer .listLink',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});
						}
					}
				}
			}
			Extension.Element.showall("buyability");

		},
		availability: function(products, buyability){
			if (!Extension.Common.checkMobile()){
				var c = Extension.Common,
					e = Extension.Element,
					elems = products.dom.main.elems;
				e.get({selector: 'form#product',baseelem: document}, function(selector, elem){
					elem = elem[0];
					if (elem){
						Extension.Common.addClass(elem, "ext-display-none");
					}
				});
				for (var i=0; i<elems.length; i++){

					if (c.varExist(buyability.currentbuyability.actions)){
						// Remove "add to cart" button.
						if (buyability.currentbuyability.actions.disableAddToCartButton || buyability.currentbuyability.actions.removeAddToCartButton){
							e.get({selector: '.actionBlock #shoppingCartButton',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem){
									Extension.Common.addClass(elem, "ext-display-none");
								}
							});
						}

						// Remove "add to list" button.
						if (buyability.currentbuyability.actions.removeAddToListButton){
							e.get({selector: '.actionBlock #buttonBorder3',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									Extension.Common.addClass(elem, "ext-display-none");
							});
						}

						if ((buyability.currentbuyability.actions.disableAddToCartButton || buyability.currentbuyability.actions.removeAddToCartButton) && buyability.currentbuyability.actions.removeAddToListButton){
							e.get({selector: '.actionBlock',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem)
									elem.style.setProperty("border-bottom", "0");
							});
						}
					}
				}
			}
			Extension.Element.showall("buyability");

		},
		wishlist: function(products, buyability){

			if (Extension.Common.checkMobile()){
				if (!Extension.Buyability.repeat){
					Extension.Buyability.repeat = true;
					Extension.Common.monitorDomChange({
						products: products,
						buyability: buyability.buyability,
						onchange: function(data){
							for (var n=0; n<data.buyability.length; n++){
								Extension.Buyability.dateValidation(data.buyability[n], function(module){
									Extension.Targeting.reload = true;
									Extension.Targeting.products(module.targeting, function(products, buyability){
										var c = Extension.Common,
											e = Extension.Element,
											elems = products.dom.main.elems,
											found = false;
										for (var i=0; i<elems.length; i++){
											if (c.varExist(buyability.actions)){
												found = true;
												// Remove "add to cart" button.
												if (buyability.actions.disableAddToCartButton || buyability.actions.removeAddToCartButton){
													e.get({selector: '._Rfxb_._Rfxd_ button',baseelem: elems[i]}, function(selector, elem){
														elem = elem[0];
														if (elem){
															Extension.Common.addClass(elem, "ext-display-none");
														}
													});
												}
											}
										}
										if (found){
											e.get({selector: '.addalltobag._Rfxg_',baseelem: elems[i]}, function(selector, elem){
												elem = elem[0];
												if (elem){
													Extension.Common.addClass(elem, "ext-display-none");
												}
											});
										}
									}, buyability.buyability[n]);
								});
							}
						}
					});
				}
			} else {
				var c = Extension.Common,
					e = Extension.Element,
					elems = products.dom.main.elems,
					found = false;
				for (var i=0; i<elems.length; i++){

					if (c.varExist(buyability.currentbuyability.actions)){
						found = true;
						// Remove "add to cart" button.
						if (buyability.currentbuyability.actions.disableAddToCartButton || buyability.currentbuyability.actions.removeAddToCartButton){
							e.get({selector: 'td.colBuyable .buttonContainer',baseelem: elems[i]}, function(selector, elem){
								elem = elem[0];
								if (elem){
									Extension.Common.addClass(elem, "ext-display-none");
								}
							});
						}
					}
				}
				if (found){
					e.get({selector: 'tr#addAllToCartButton',baseelem: elems[i]}, function(selector, elem){
						elem = elem[0];
						if (elem){
							Extension.Common.addClass(elem, "ext-display-none");
						}
					});
				}
			}
			Extension.Element.showall("buyability");

		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-buyability");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "Hidebuttons", fn: Hidebuttons},
			{name: "Buyability", fn: Buyability}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup Buyability " + str);
			});
			//Initiate Buyability
			Extension.Version.load('extbuy', true, function(e) {
				Extension.Version.load('extbuyhide', false, function(e) {
					Extension.Hidebuttons();
				});
				Extension.Source.load('Buyability', Extension.Version.forcePreview || Extension.Version.preview, function(data) {
					Extension.Buyability.init(data);
				});
			});
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();