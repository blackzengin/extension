/*

  _                      _
 /  |_   _. ._   _   _  | \  _. _|_  _   _
 \_ | | (_| | | (_| (/_ |_/ (_|  |_ (/_ _>
				 _|

*/
(function(){
	
	var ChangeDates = {
		init: function(data) {
			for (var i = 0; i < data.length; i++) {
				data[i] = this.formatDate(data[i]);

				//Initiate IRW
				if (document.URL.toLowerCase().indexOf("www.ikea.com") > -1) {
					if (document.URL.toLowerCase().indexOf("/catalog/products/") > -1) {
						this.changePIP(data[i]);
						this.changePIP_other(data[i]);
					} else if (document.URL.toLowerCase().indexOf("/search/") > -1) {
						this.changeSearch(data[i]);
					} else if (document.URL.toLowerCase().indexOf("/catalog/") > -1) {
						this.changePLP(data[i]);
					} else if (document.URL.toLowerCase().indexOf("/webapp/wcs/stores/servlet") > -1) {
						this.changeCheckout(data[i]);
					}
				}

				//Initiate M2
				if (document.URL.indexOf("m2.ikea.com") > -1 || document.URL.indexOf("m2.ppe.ikeadt.com") > -1) {
					if (document.URL.toLowerCase().indexOf("/products/") > -1 || document.URL.toLowerCase().indexOf("/p/") > -1) {
						this.changePIP_M2(data[i]);
					} else if (document.URL.toLowerCase().indexOf("/search/") > -1) {
						this.changeSearch_M2(data[i]);
					} else if (document.URL.toLowerCase().indexOf("/cat/") > -1) {
						this.changePLP_M2(data[i]);
					}
				}
			}

			Extension.Element.showall("changdates");

		},

		//Change on PIP pages
		changePIP: function(data) {
			if (data.lower) {
				for (var i = 0; i < data.products.length; i++) {
					var page = "/catalog/products/" + data.products[i].toLowerCase() + "/";
					if (document.URL.toLowerCase().indexOf(page) > -1) {
						try {
							document.getElementById("troPrice").innerHTML = data.fromDateText + " - " + data.toDateText + " <span> så langt lageret rekker</span>";
						} catch (e) {}
					}
				}
			}
			if (data.family) {
				for (var i = 0; i < data.products.length; i++) {
					var page = "/catalog/products/" + data.products[i].toLowerCase() + "/";
					if (document.URL.toLowerCase().indexOf(page) > -1) {
						try {
							document.getElementById("familyDate").innerHTML = data.fromDateText + " - " + data.toDateText + " <span> så langt lageret rekker</span>";
						} catch (e) {}
					}
				}
			}
		},

		//Change other products on PIP
		changePIP_other: function(data) {
			if (data.lower) {
				var elems = document.querySelectorAll(".priceNote");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.getAttribute("id");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "<div class='date'>" + data.fromDateText + " -" + data.toDateText + "</div><div class='detail'>så langt lageret rekker</div>";
							}
						}
					} catch (e) {}
				}
			}
			if (data.family) {
				var elems = document.querySelectorAll("#familyOfferDateMini");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.parentNode.parentNode.getAttribute("id");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "<div class='date'>" + data.fromDateText + " -" + data.toDateText + "</div><span>så langt lageret rekker</span";
							}
						}
					} catch (e) {}
				}
			}
		},

		//Change on search pages
		changeSearch: function(data) {
			if (data.lower) {
				var elems = document.querySelectorAll("#troPrice");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.parentNode.getAttribute("id");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "<br>" + data.fromDateText + " -<div class='troDateWidth'>" + data.toDateText + "<span><br>så langt lageret rekker</span></div>";
							}
						}
					} catch (e) {}
				}
			}
			if (data.family) {
				var elems = document.querySelectorAll("#familyOfferDateSearch");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.parentNode.getAttribute("id");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "<br>" + data.fromDateText + " -<div class='troDateWidth'>" + data.toDateText + "<span><br>så langt lageret rekker</span></div>";
							}
						}
					} catch (e) {}
				}
			}
		},

		//Change on PLP pages
		changePLP: function(data) {
			if (data.lower) {
				var elems = document.querySelectorAll(".priceNote");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.parentNode.getAttribute("id");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "<div class='date'>" + data.fromDateText + " -" + data.toDateText + "</div><div class='detail'>så langt lageret rekker</div>";
							}
						}
					} catch (e) {}
				}
			}
			if (data.family) {
				var elems = document.querySelectorAll("#familyOfferDate");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.parentNode.parentNode.getAttribute("id");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "<div class='date'>" + data.fromDateText + " -" + data.toDateText + "</div><span>så langt lageret rekker</span";
							}
						}
					} catch (e) {}
				}
			}
		},

		//Change valid to date in checkout
		changeCheckout: function(data) {
			if (data.lower) {
				var elems = document.querySelectorAll(".colPrice .regular");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parentId = elems[i].parentNode.parentNode.getAttribute("class");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "Gyldig til " + data.toDateNumber;
							}
						}
					} catch (e) {}
				}
			}
		},

		//Change on PIP for M2
		changePIP_M2: function(data) {
			if (data.lower) {
				for (var i = 0; i < data.products.length; i++) {
					if (document.URL.toLowerCase().indexOf(data.products[i].toLowerCase()) > -1) {
						try {
							var elems = document.querySelectorAll(".product-pip__price-package .price-package .no-margin");
							for (var j = 0; j < elems.length; j++) {
								if (elems[j].innerHTML.indexOf("så langt lageret rekker") > -1) {
									elems[j].innerHTML = "(" + data.fromDateTextM2 + " - " + data.toDateTextM2 + " så langt lageret rekker)";
								}
							}
						} catch (e) {}
					}
				}
			}
		},

		//Change on Search pages on M2
		changeSearch_M2: function(data) {
			if (data.lower) {
				var interval = 25
				  , milliseconds = 3000
				  , timeout = milliseconds / interval;
				var repeatedlyReplace = setInterval(function() {
					var elems = document.querySelectorAll(".product-compact__valid-dates");
					for (var i = 0; i < elems.length; i++) {
						try {
							var parent = elems[i].parentNode;
							var parentId = parent.querySelector("a").getAttribute("href");
							for (var j = 0; j < data.products.length; j++) {
								if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
									if (elems[i].innerHTML !== "(" + data.fromDateTextM2 + " - " + data.toDateTextM2 + " så langt lageret rekker)") {
										elems[i].innerHTML = "(" + data.fromDateTextM2 + " - " + data.toDateTextM2 + " så langt lageret rekker)";
									}
								}
							}
						} catch (e) {}
					}
					if (timeout > 0)
						timeout--;
					else
						clearInterval(repeatedlyReplace);
				}, interval);
			}
		},

		//Change on PLP pages on M2
		changePLP_M2: function(data) {
			if (data.lower) {
				var elems = document.querySelectorAll(".product-compact__valid-dates");

				for (var i = 0; i < elems.length; i++) {
					try {
						var parent = elems[i].parentNode;
						var parentId = parent.querySelector("a").getAttribute("href");
						for (var j = 0; j < data.products.length; j++) {
							if (parentId.toLowerCase().indexOf(data.products[j].toLowerCase()) > -1) {
								elems[i].innerHTML = "(" + data.fromDateTextM2 + " - " + data.toDateTextM2 + " så langt lageret rekker)";
							}
						}
					} catch (e) {}
				}
			}
		},

		formatDate: function(data) {
			try {
				var fromDateSplit = data.fromDate.split(".");
				var toDateSplit = data.toDate.split(".");
				data.fromDateNumber = fromDateSplit[2] + "-" + fromDateSplit[1] + "-" + fromDateSplit[0];
				data.toDateNumber = toDateSplit[2] + "-" + toDateSplit[1] + "-" + toDateSplit[0];
				data.fromDateText = parseInt(fromDateSplit[0]) + " " + this.getMonthText(fromDateSplit[1]) + ", " + fromDateSplit[2];
				data.toDateText = parseInt(toDateSplit[0]) + " " + this.getMonthText(toDateSplit[1]) + ", " + toDateSplit[2];
				data.fromDateTextM2 = parseInt(fromDateSplit[0]) + ". " + this.getMonthText(fromDateSplit[1]) + ". " + fromDateSplit[2];
				data.toDateTextM2 = parseInt(toDateSplit[0]) + ". " + this.getMonthText(toDateSplit[1]) + ". " + toDateSplit[2];

			} catch (e) {}
			return data;
		},

		getMonthText: function(monthNumber) {
			var m = parseInt(monthNumber);
			switch (m) {
			case 1:
				return "jan";
			case 2:
				return "feb";
			case 3:
				return "mar";
			case 4:
				return "apr";
			case 5:
				return "mai";
			case 6:
				return "jun";
			case 7:
				return "jul";
			case 8:
				return "aug";
			case 9:
				return "sep";
			case 10:
				return "okt";
			case 11:
				return "nov";
			case 12:
				return "des";
			default:
				return "";
			}
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-changedates");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "ChangeDates", fn: ChangeDates}
		],
		dependencies: [],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup ChangeDates " + str);
			});
			//Initiate ChangeDates
			Extension.Source.load('ChangeDates', Extension.Version.forcePreview || Extension.Version.preview, function(data) {
				Extension.ChangeDates.init(data.changedates);
			});
		}
	}
	
	if (window.Extension){
		if (preview){ window.ExtensionQueuePreview = window.ExtensionQueuePreview || []; window.ExtensionQueuePreview.push(transfer);if (Extension.Queue) Extension.Queue.dump("ExtensionQueuePreview");
		} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer); if (Extension.Queue) Extension.Queue.dump("ExtensionQueue");}
	} else { window.ExtensionQueue = window.ExtensionQueue || []; window.ExtensionQueue.push(transfer);}

})();