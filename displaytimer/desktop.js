/*

  _                   ___
 | \ o  _ ._  |  _.    | o ._ _   _  ._
 |_/ | _> |_) | (_| \/ | | | | | (/_ |
		  |         /

*/

(function(){
	var DisplayTimerOld = {
		settings: {
			carruselarrow: 363,
			testcookieset: false,
			override: false,
			TimeNow: "",
			TimeSet: "",
			ids: ["main", "mainPadding", "allContent"],
			nodeTypes: ["body", "html"],
		},
		first: function() {
			var c = Extension.Common
			  , t = Extension.Time;
			t.checkDateType();
			if (!c.varExist(Extension.DisplayTimerSettings))
				Extension.DisplayTimerSettings = this.settings;
			//this.PreviewMenu.init();
		},
		injectToPage: function(data) {
			var c = Extension.Common,
				e = Extension.Element,
				elemarr = [];

			//Turn target element array into an array, in case it is a nodelist
			elemarr = c.toArray(data.targetElemArr);
			for (var i=0; i<elemarr.length; i++){
				var elem = data.elem.cloneNode(data.elem);
				e.inject(elem, elemarr[i], data.placing);
			}

			//Adding styling to the head section of the page
			if (c.varExist(data.module.style, true)) {
				var style = {};
				if (c.isObject(data.module.style)) style = data.module.style;
				else style.default = data.module.style;

				if (c.varExist(style.pages)){
					if (c.isArray(style.pages)){
						for(var i=0; i<style.pages.length; i++){
							if (c.varExist(style.pages[i].url)){
								if (c.checkurl(style.pages[i].url)){
									if (c.varExist(style.pages[i].style, true)){
										var css = document.createElement("style");
										css.innerHTML = style.pages[i].style;
										document.head.appendChild(css);
									}
								}
							}
						}
					}
				}
				if (c.varExist(style.default, true)){
					var css = document.createElement("style");
					css.innerHTML = style.default;
					document.head.appendChild(css);
				}
			}

			//Adding scripts throu eval function
			if (c.varExist(data.module.script, true)) {
				var script = {};
				if (c.isObject(data.module.script)) script = data.module.script;
				else script.default = data.module.script;

				if (c.varExist(script.pages)){
					if (c.isArray(script.pages)){
						for(var i=0; i<script.pages.length; i++){
							if (c.varExist(script.pages[i].url)){
								if (c.checkurl(script.pages[i].url)){
									if (c.varExist(script.pages[i].script, true)){
										try {
											var foundpageindex = data.module.foundpageindex
											  	, foundurlindex = data.module.pages[foundpageindex]['foundurlindex'];
											var source = "var foundpageindex = " + foundpageindex + ", foundurlindex = " + foundurlindex + ", htmloptions = Extension.Template.alloptions;";
											eval(source + script.pages[i].script);
										} catch (err) {
											console.log("Extension.DisplayTimerOld.injectToPage: ScriptError: Err: " + err);
										}
									}
								}
							}
						}
					}
				}
				if (c.varExist(script.default, true)){
					try {
						var foundpageindex = data.module.foundpageindex
						  	, foundurlindex = data.module.pages[foundpageindex]['foundurlindex'];
						var source = "var foundpageindex = " + foundpageindex + ", foundurlindex = " + foundurlindex + ", htmloptions = Extension.Template.alloptions;";
						eval(source + script.default);
					} catch (err) {
						console.log("Extension.DisplayTimerOld.injectToPage: ScriptError: Err: " + err);
					}
				}
			}

			//Including .js or .ccs files to page  
			if (c.varExist(data.module.file, true)) {
				var includefile = {};
				if (c.isObject(data.module.file)) includefile = data.module.file;
				else includefile.default = data.module.file;

				if (c.varExist(includefile.pages)){
					if (c.isArray(includefile.pages)){
						for(var i=0; i<includefile.pages.length; i++){
							if (c.varExist(includefile.pages[i].url)){
								if (c.checkurl(includefile.pages[i].url)){
									if (c.varExist(includefile.pages[i].file, true)){
										Extension.IncludeScript.load(includefile.pages[i].file);
									}
								}
							}
						}
					}
				}
				if (c.varExist(includefile.default, true))  Extension.IncludeScript.load(data.module.file);
			}

			//Unhiding the current injected element
			this.showInjectedContent();

		},
		showInjectedContent: function(){
			setTimeout(function() {
				var elem;
				elem = document.querySelectorAll(".dt-injected-appear, .dt-injected-drop, .dt-injected-fade");
				for (var i=0;i<elem.length; i++){
					if (elem[i].parentNode.nodeName !== "SPAN") elem[i].style.setProperty("display", "block")
					Extension.Common.addClass(elem[i], "ext-show");
				}
			}, 1);
		},
		injectElementsTimeout: function(timeouts, data){
			var c = Extension.Common;
			var to = c.toArray(timeouts);
			for (var i=0; i<to.length; i++){
				//var data = JSON.parse(JSON.stringify(data));
				var activepage = data.module.activepage,
					locationnr = data.locationnr;
				setTimeout(function(){
					data.module.activepage = activepage;
					data.locationnr = locationnr;
					Extension.DisplayTimerOld.injectElements(data);
				}, c.toInt(to[i]));
			}
		},
		injectElements: function (data) {

			var selector = data.module.pages[data.module.activepage].locations[data.locationnr].selector;

			Extension.Element.get(selector, function(selector, targetElems, data) {
				var c = Extension.Common
				  , allmodules = data.allmodules
				  , module = data.module
				  , modulenr = data.modulenr
				  , locationnr = data.locationnr
				  , elemList = data.elemList,
				  targetElemArr = [];


				if (targetElems.length > 1) {
					var qp = module.pages[module.activepage].locations[locationnr].queryPos;
					if (!c.varExist(qp))
						qp = module.pages[module.activepage].locations[locationnr].elementNumber;


					if (c.varExist(qp)) {
						if (c.isArray(qp)){
							for (var i=0; i<qp.length; i++){
								if (qp[i] < targetElems.length) {
									targetElemArr.push(targetElems[qp[i]]);
								}
							}
						} else {
							if (qp < targetElems.length) {
								targetElemArr.push(targetElems[qp]);
							}
						}
					} else {
						targetElemArr = c.toArray(targetElems);
					}
				} else
					targetElemArr.push(targetElems[0]);

				data.targetElemArr = targetElemArr;

				var el = elemList.length;
				elemList[el] = document.createElement("span");
				if (c.varExist(module.pages[module.activepage].locations[locationnr].transition)) {
					if (module.pages[module.activepage].locations[locationnr].transition == "drop")
						elemList[el].className = "dt-injected-drop";
					else if (module.pages[module.activepage].locations[locationnr].transition == "appear")
						elemList[el].className = "dt-injected-appear";
					else
						elemList[el].className = "dt-injected-fade";
				} else
					elemList[el].className = "dt-injected-fade";
				data.elem = elemList[el];

				var dateDiv = document.createElement('div');
				if (Extension.DisplayTimerSettings.testcookieset) {
					var getContent = Extension.DisplayTimerOld.PreviewMenu.getContent(module);
					dateDiv.setAttribute('class', 'testDisplay');
					dateDiv.setAttribute('style', "position:absolute;background-color: #eee;right: 10px;z-index: 1000;font-size: 14px;padding: 5px;border: solid 2px #ccc;border-radius : 5px;moz-border-radius : 5px;");
					dateDiv.innerHTML = getContent;

					if (!Extension.Common.varExist(document.getElementById("borderCSS"))) {
						var borderCSS = document.createElement('style');
						borderCSS.id = "borderCSS";
						borderCSS.innerHTML = ".dt-injected-fade > div { border: solid 2px #ff0a0a !important; clear: both;} .dt-injected-drop > div { border: solid 2px #ff0a0a !important; clear: both;}.dt-injected-fade > span { border: solid 2px #ff0a0a !important;} .dt-injected-drop > span { border: solid 2px #ff0a0a !important;}";
						document.head.appendChild(borderCSS);
					}

				}
				var content = "";
				if (c.varExist(module.htmlcontent, true))
					content = module.htmlcontent;
				if (c.varExist(module.htmloptions))
					content = Extension.Template.load(module);
				elemList[el].innerHTML = content;
				var firstElem = elemList[el].querySelector("div") || elemList[el].querySelector("span");
				if (c.varExist(firstElem))
					firstElem.insertBefore(dateDiv, firstElem.firstChild);

				data.placing = module.pages[module.activepage].locations[locationnr].placing || "before";

				if (c.varExist(allmodules[modulenr].abtest, true)) {
					if (c.varExist(module.pages[module.activepage].abcountdown, true)) {
						Extension.DisplayTimerOld.abcountdown = module.pages[module.activepage].abcountdown;
					} else
						Extension.DisplayTimerOld.abcountdown = 1;
					if (c.isObject(data.context)) {
						data.context = {}
						data.context.abtest = true;
					} else
						data.context.abtest = true;

					ExtensionMaxymiser = ExtensionMaxymiser || {};
					if (c.varExist(ExtensionMaxymiser.override, true)) {
						if (ExtensionMaxymiser.override == allmodules[modulenr].abtest) {
							Extension.DisplayTimerOld.injectToPage(data);
							callback(data.context);
						}
					} else {
						data.targetElemArr = targetElemArr;
						c.waitVarExist({
							globalvarname: "ExtensionMaxymiser.abtest",
							timeout: 1000,
							interval: 20
						}, function(response, data) {
							if (response.status == "success") {
								var c = Extension.Common;
								if (c.varExist(ExtensionMaxymiser.abtest, true)) {
									if (ExtensionMaxymiser.abtest == data.allmodules[data.modulenr].abtest) {
										Extension.DisplayTimerOld.injectToPage(data);
										if (!c.isObject(data.context)) {
											data.context = {};
											data.context.testadded = true;
										} else
											data.context.testadded = true;
										Extension.DisplayTimerOld.abcountdown--;
										if (Extension.DisplayTimerOld.abcountdown < 1)
											Extension.DisplayTimerOld.abstatus = "filled";
										else
											Extension.DisplayTimerOld.abstatus = "working";
										if (c.isFunction(data.callback))
											data.callback(data.context);

									}
								}
							}
						}, data);
					}
				} else {

					Extension.DisplayTimerOld.injectToPage(data);
					data.callback(data.context);
				}

				//special for main page www.ikea
				if (data.placing == "before" && data.module.pages[data.module.activepage].locations[locationnr].selector == "#whatsection") {
					Extension.DisplayTimerSettings.carruselarrow += data.module.height + 20;
					var arrowcss = '.corrosilnavigatingarrow{top:' + Extension.DisplayTimerSettings.carruselarrow + 'px !important}';
					csselem.innerHTML = csselem.innerHTML + arrowcss;
				}

			}, data);
		},
		load: function(allmodules, callback, context) {
			var c = Extension.Common
			  , t = Extension.Time;
			
				var data = {
					context: context,
					allmodules: allmodules,
					callback: callback
				}
				t.get(function(time, context) {
					var c = Extension.Common
					  , t = Extension.Time
					  , dt = Extension.DisplayTimerOld;
					dt.settings.TimeNow = time;
					dt.settings.TimeSet = true;
					dt.first();
					var elemList = [];
					for (var modulenr = 0; modulenr < context.allmodules.length; modulenr++) {

						if (c.varExist(context.allmodules[modulenr].pages)) {
							for (var p = 0; p < context.allmodules[modulenr].pages.length; p++) {
								var activepage = -1;
								var checkreturn = c.checkurl(context.allmodules[modulenr].pages[p].url, true);
								if (checkreturn > -1) {
									activepage = p;
									context.allmodules[modulenr]["foundpageindex"] = p;
									context.allmodules[modulenr].pages[p]['foundurlindex'] = checkreturn;
								}

								if (activepage > -1 && c.varExist(context.allmodules[modulenr].htmlcontent)) {
									context.allmodules[modulenr].modulenr = modulenr;
									context.allmodules[modulenr].activepage = activepage;

									var module = context.allmodules[modulenr]
									  , dt = Extension.DisplayTimerOld;
									if (dt.dateValidation(module)) {
										if (c.varExist(module.pages[module.activepage].locations)) {
											for (var locationnr = 0; locationnr < module.pages[module.activepage].locations.length; locationnr++) {

												var data = {
													context: context.context,
													allmodules: context.allmodules,
													callback: context.callback,
													module: module,
													modulenr: modulenr,
													locationnr: locationnr,
													elemList: elemList,
												}

												var timeouts = module.pages[module.activepage].locations[locationnr].timeouts;
												if (c.varExist(timeouts))
													Extension.DisplayTimerOld.injectElementsTimeout(timeouts, data);
												else
													Extension.DisplayTimerOld.injectElements(data);
											}
										}
									}
								}
							}
						}
					}

				}, data);
				// Time.Get
			
		},
		validateElement: function(elem) {
			var c = Extension.Common;
			if (c.varExist(elem.id))
				for (var i = 0; i < this.settings.ids.length; i++)
					if (elem.id == this.settings.ids[i])
						return false;
			for (var i = 0; i < this.settings.nodeTypes.length; i++)
				if (elem.tagName.toLowerCase() == this.settings.nodeTypes[i])
					return false;
			return true;
		},
		checkParents: function(elem, search) {
			var c = Extension.Common;
			if (c.varExist(elem.id))
				if (elem.id.indexOf(search) > -1)
					return true;
			if (c.varExist(elem.className))
				if (elem.className.indexOf(search) > -1)
					return true;
			return false;
		},

		//Validate date and time within timeframe. Format iso:  YYYY-MM-DDThh:mm:ss.000Z
		dateValidation: function(module) {
			try {
				if (Extension.DisplayTimerSettings.override)
					return true;
				var found = false;
				var times = module.times;
				for (var i = 0; i < times.length; i++) {
					var From = new Date(times[i].date_from)
					  , To = new Date(times[i].date_to)
					  , server = new Date(Extension.DisplayTimerSettings.TimeNow);
					if (server.getTime() > From.getTime() && server.getTime() < To.getTime())
						found = true;
				}
				return found;

			} catch (err) {
				return false;
			}
		},
		PreviewMenu: {
			init: function() {
				var c = Extension.Common;
				if (document.URL.indexOf('?extdtshow') > -1 || document.URL.indexOf('&extdtshow') > -1) {
					c.setCookie("ext_st", "on");
				}
				var timeCookie = c.getCookie('ext_time');
				if (c.varExist(timeCookie)) {
					Extension.DisplayTimerSettings.testcookieset = true;
					if (timeCookie == "all") {
						Extension.DisplayTimerSettings.override = true;
					} else {
						Extension.DisplayTimerSettings.TimeNow = timeCookie;
						Extension.DisplayTimerSettings.TimeSet = "true";
					}
					//this.tool();
				} else if (c.varExist(c.getCookie('ext_st'))) {
					Extension.DisplayTimerSettings.testcookieset = true;
					Extension.DisplayTimerSettings.override = true;
					c.setCookie("ext_time", "all");
					//this.tool();
				}
			},
			tool: function() {
				var t = document.getElementById('ext-dt-tool');
				if (!t) {
					var dateTime = new Date(Extension.DisplayTimerSettings.TimeNow);
					var settings = {
						year: dateTime.getFullYear(),
						month: dateTime.getMonth() + 1,
						day: dateTime.getDate(),
						hour: dateTime.getHours(),
						minute: dateTime.getMinutes(),
					};
					var checked = "";
					if (Extension.DisplayTimerSettings.override)
						checked = " checked";
					var timeframe = document.createElement('div');
					timeframe.id = "ext-dt-tool";
					timeframe.setAttribute('style', 'position:fixed; left:10px; bottom: 20px; border: solid 2px #ccc;border-radius : 5px;moz-border-radius : 5px; background-color: #eee; padding: 5px; z-index:1000;');
					timeframe.innerHTML = '<style>.tg-yw40 input{padding: 3px;border-radius : 5px;moz-border-radius : 5px;}.tg-yw4l input{padding: 3px;border-radius : 5px;moz-border-radius : 5px;width: 60px;}.tg-yw4l .btn-style{display: block; width: 100%; background-color: rgb(0, 153, 255); text-align: center; padding: 5px 10px; margin-top: 10px; color: white; border-radius: 4px; text-decoration: none; transition: background-color 0.2s;} .btn-style:hover{background-color:#4db8ff}</style><table><tr><td class="tg-yw4l"><input class="btn-style" type="button" onclick="Extension.DisplayTimerOld.PreviewMenu.close()" value="Close"></td><td class="tg-yw40" colspan="3"><input type="checkbox" id="dttf_all" name="all"' + checked + '> Show all modules</td></tr><tr><td class="tg-yw4l"></td><td class="tg-yw4l">Year</td><td class="tg-yw4l">Month</td><td class="tg-yw4l">Day</td></tr><tr><td class="tg-yw4l">Date:</td><td class="tg-yw4l"><input type="number" id="dttf_year" name="year" min="2012" max="2030" step="1" value="' + settings.year + '"></td><td class="tg-yw4l"><input type="number" id="dttf_month" name="month" min="1" max="12" step="1" value="' + Extension.DisplayTimerOld.PreviewMenu.setTwoDigits(settings.month) + '" onchange="Extension.DisplayTimerOld.PreviewMenu.setElemDigits(this, 2)"></td><td class="tg-yw4l"><input type="number" id="dttf_day" name="day" min="1" max="31" step="1" value="' + Extension.DisplayTimerOld.PreviewMenu.setTwoDigits(settings.day) + '" onchange="Extension.DisplayTimerOld.PreviewMenu.setElemDigits(this, 2)"></td></tr><tr><td class="tg-yw4l"></td><td class="tg-yw4l">Hour</td><td class="tg-yw4l">Minute</td><td class="tg-yw4l"></td></tr><tr><td class="tg-yw4l">Time:</td><td class="tg-yw4l"><input type="number" id="dttf_hour" name="hour" min="00" max="23" step="1" value="' + Extension.DisplayTimer.PreviewMenu.setTwoDigits(settings.hour) + '" onchange="Extension.DisplayTimer.PreviewMenu.setElemDigits(this, 2)"></td><td class="tg-yw4l"><input type="number" id="dttf_minute" name="minute" min="00" max="59" step="1" value="' + Extension.DisplayTimer.PreviewMenu.setTwoDigits(settings.minute) + '" onchange="Extension.DisplayTimer.PreviewMenu.setElemDigits(this, 2)"></td><td class="tg-yw4l"><input class="btn-style" type="button" onclick="Extension.DisplayTimer.PreviewMenu.submit()" value="Reload"></td></tr></table>';
					document.getElementsByTagName('body')[0].appendChild(timeframe);
				}

			},
			getContent: function(setup) {
				var c = Extension.Common;
				var getContent = "";
				try {
					if (c.varExist(setup.name))
						getContent = setup.name + '<br>';
					for (var t = 0; t < setup.times.length; t++) {
						var datefrom = new Date(setup.times[t].date_from);
						var formatteddatefromsettings = 'F:' + datefrom.getFullYear() + '.' + this.setTwoDigits(datefrom.getMonth() + 1) + '.' + this.setTwoDigits(datefrom.getDate()) + ' - ' + this.setTwoDigits(datefrom.getHours()) + ':' + this.setTwoDigits(datefrom.getMinutes());
						var dateto = new Date(setup.times[t].date_to);
						var formatteddatetosettings = 'T:' + dateto.getFullYear() + '.' + this.setTwoDigits(dateto.getMonth() + 1) + '.' + this.setTwoDigits(dateto.getDate()) + ' - ' + this.setTwoDigits(dateto.getHours()) + ':' + this.setTwoDigits(dateto.getMinutes());
						var color = "green"
						  , timetext = "Active";
						var From = new Date(setup.times[t].date_from)
						  , To = new Date(setup.times[t].date_to)
						  , server = new Date(Extension.DisplayTimerSettings.TimeNow);
						if (server.getTime() > To.getTime()) {
							color = "grey";
							timetext = "Passed";
						} else if (server.getTime() < From.getTime()) {
							color = "blue";
							timetext = "Future";
						}
						getContent += '<span style="color: ' + color + '">' + formatteddatefromsettings + '<br>' + formatteddatetosettings + ' - ' + timetext + '<span><br><br>';
					}
					return getContent;
				} catch (err) {
					console.log("Extension.DisplayTimerOld.getContent: Err: " + err);
					return getContent;
				}
			},
			submit: function() {
				var c = Extension.Common;
				var elem = document.querySelector("#ext-dt-tool");
				if (elem) {
					if (elem.querySelector("#dttf_all").checked) {
						c.setCookie("ext_time", "all");
					} else {
						var settings = {
							year: elem.querySelector("#dttf_year").value,
							month: parseInt(elem.querySelector("#dttf_month").value.replace(/\D+/g, '')) - 1,
							day: elem.querySelector("#dttf_day").value,
							hour: elem.querySelector("#dttf_hour").value,
							minute: elem.querySelector("#dttf_minute").value,
						};
						var dateTime = new Date(settings.year,settings.month,settings.day,settings.hour,settings.minute,0,0);
						c.setCookie("ext_time", dateTime.toISOString());
					}
					location.reload();
				}
			},
			close: function() {
				var c = Extension.Common;
				c.clearCookie("ext_time");
				c.clearCookie("ext_st");
				var url = window.location.href;
				url = url.replace(/[?|&]extdtshow/g, "");
				window.location.href = url;
			},
			setDecimal: function(el, digits) {
				el.value = parseFloat(el.value).toFixed(digits);
			},
			setTwoDigits: function(val) {
				var c = Extension.Common;
				if (c.varExist(val)) {
					if (val < 10)
						return '0' + val;
				}
				return val;
			},
			setElemDigits: function(el, digits) {
				var c = Extension.Common;
				if (c.varExist(el.value)) {
					if (el.value.length < digits)
						el.value = '0' + el.value;
					if (el.value.length > digits)
						el.value = el.value.slice(1, el.value.length - 1);
				}
			},
		}
	}



















	var DisplayTimerSettings,
		DisplayTimerInjected,
		DisplayTimer = {
		settings: {
			uselocation: true,
			carruselarrow: 363,
			testcookieset: false,
			override: false,
			TimeNow: "",
			TimeSet: "",
			ids: ["main", "mainPadding", "allContent"],
			nodeTypes: ["body", "html"],
			predefined:{}
		},
		setPredefinedUrls: function(){
			var predef = this.settings.predefined;
			predef.irw = [ "*www.|preview.*" ];
			predef.m2 = [ "*m2.*" ];
			
			if (Extension.Common.checkMobile()){
				predef.pip = [ "*" + ExtensionSetting.Country.homePath + "p/*" ];
				predef.plp = [ "*" + ExtensionSetting.Country.homePath + "cat/*" ];
				predef.search = [ "*/search/*" ];	
				predef.wishlist = [ "*/shop/wishlist/*" ];
				predef.availability = [];

				predef.all = [ "*" + ExtensionSetting.Country.homePath + "*" ];
			} else {
				predef.pip = [ "*/catalog/products/*" ];
				predef.plp = [ "*/catalog/categories/*" ];
				predef.search = [ "*/search/*" ];	
				predef.wishlist = [ "*/InterestItemDisplay" ];
				predef.availability = [ "*/catalog/availability/*" ];
				
				predef.all = [ "*" + ExtensionSetting.Country.homePath + "*" ];
			}
		},
		getPredefinedUrls: function(settings){
			var c = Extension.Common;
			var predef = this.settings.predefined;
			var urls = [];
			var platform = [];
			if (settings.irw && settings.m2){
				predef.irw = c.toArray(predef.irw);
				predef.m2 = c.toArray(predef.m2);
				
				for (var i=0; i<predef.irw.length; i++){
					for (var j=0; j<predef.m2.length; j++){
						platform.push((predef.irw[i] + predef.m2[j]).replace("**", "|"));
					}
				}
			} else if (settings.irw){
				predef.irw = c.toArray(predef.irw);
				platform = predef.irw;
			} else if (settings.m2){
				predef.m2 = c.toArray(predef.m2);
				platform = predef.m2;
			}

			for (var prop in settings){
				if (prop !== "irw" && prop !== "m2"){
					if (settings[prop] && predef[prop]){
						predef[prop] = c.toArray(predef[prop]);
						if (platform.length > 0){
							for (var i=0; i<platform.length; i++){
								for (var j=0; j<predef[prop].length; j++){
									urls.push((platform[i] + predef[prop][j]).replace("**", "*"));
								}
							}
						} else 
							urls = urls.concat(predef[prop]);
					}
				}
			}
			if (urls.length == 0)
				urls = platform;
			return urls;
		},
		preparation: function(callback) {
			var c = Extension.Common
			  , t = Extension.Time;
			this.setPredefinedUrls();
			t.checkDateType();
			if (!c.varExist(Extension.DisplayTimerSettings))
				Extension.DisplayTimerSettings = this.settings;
			this.PreviewMenu.init();
			callback();
		},
		
		injectStyleToPage: function(module) {
			var c = Extension.Common;

			//Adding styling to the head section of the page
			if (c.varExist(module.what.style, true)) {
				var style = {};
				if (c.isObject(module.what.style)) style = module.what.style;
				else style.content = module.what.style;

				if (c.varExist(style.inline)) module.inline = style.inline;
				if (c.varExist(style.clear)) module.clear = style.clear;

				
				if (c.varExist(style.content, true)){
					if (!style.options) style.options = {}
					style.options.modulenr = module.modulenr;
					style.content = Extension.Template.load({htmlcontent: style.content, htmloptions: style.options});
					if (!document.getElementById("ext-style-" + module.modulenr)){
						var css = document.createElement("style");
						css.id = "ext-style-" + module.modulenr;
						css.innerHTML = style.content;
						document.head.appendChild(css);
					}
				}
				if (style.pages){
					style.pages = c.toArray(style.pages);
					for (var i=0; i<style.pages.length; i++){
						if (style.pages[i].predefined){
							var predefurls = this.getPredefinedUrls(style.pages[i].predefined);
							if (style.pages[i].urls) {
								style.pages[i].urls = c.toArray(style.pages[i].urls);
								style.pages[i].urls = predefurls.concat(style.pages[i].urls);
							} else style.pages[i].urls = predefurls;
						}
						if (style.pages[i].urls){
							style.pages[i].urls = c.toArray(style.pages[i].urls);
							if (c.checkurl(style.pages[i].urls)){
								if (c.varExist(style.pages[i].content, true)){
									if (!style.pages[i].options) style.pages[i].options = {}
									style.pages[i].options.modulenr = module.modulenr;
									style.pages[i].content = Extension.Template.load({htmlcontent: style.pages[i].content, htmloptions: style.pages[i].options});
									if (!document.getElementById("ext-style-" + module.modulenr + "-" + i)){
										var css = document.createElement("style");
										css.id = "ext-style-" + module.modulenr + "-" + i;
										css.innerHTML = style.pages[i].content;
										document.head.appendChild(css);
									}
								}
							}
						}
					}
					
				}
				
			}
			module.what.style = style;
			return module;
		},
		injectScriptToPage: function(module) {
			var c = Extension.Common;

			//Adding scripts throu eval function
			if (c.varExist(module.what.script, true)) {
				var script = {};
				if (c.isObject(module.what.script)) script = module.what.script;
				else script.content = module.what.script;
				
				if (c.varExist(script.content, true)){
					if (!script.options) script.options = {}
					script.options.modulenr = module.modulenr;
					script.content = Extension.Template.load({htmlcontent: script.content, htmloptions: script.options});
					try {
						var source = "var foundmodulenr = " + module.modulenr + ", foundpageindex = " + module.foundpageindex + ", foundurlindex = " + module.foundurlindex + ", htmloptions = Extension.Template.alloptions;";
						eval(source + script.content);
					} catch (err) {
						console.log("Extension.DisplayTimer.injectToPage: ScriptError: Err: " + err);
					}
				}
				if (script.pages){
					script.pages = c.toArray(script.pages);				
					if (c.isArray(script.pages)){
						for (var i=0; i<script.pages.length; i++){
							if (script.pages[i].predefined){
								var predefurls = this.getPredefinedUrls(script.pages[i].predefined);
								if (script.pages[i].urls) {
									script.pages[i].urls = c.toArray(script.pages[i].urls);
									script.pages[i].urls = predefurls.concat(script.pages[i].urls);
								} else script.pages[i].urls = predefurls;
							}
							if (script.pages[i].urls){
								script.pages[i].urls = c.toArray(script.pages[i].urls);
								if (c.checkurl(script.pages[i].urls)){
									if (c.varExist(script.pages[i].content, true)){
										if (script.pages[i].options)
											script.pages[i].content = Extension.Template.load({htmlcontent: script.pages[i].content, htmloptions: script.pages[i].options});
										try {
											var source = "var foundmodulenr = " + module.modulenr + ", foundpageindex = " + module.foundpageindex + ", foundurlindex = " + module.foundurlindex + ", htmloptions = Extension.Template.alloptions;";
											eval(source + script.pages[i].content);
										} catch (err) {
											console.log("Extension.DisplayTimer.injectToPage: ScriptError: Err: " + err);
										}
									}
								}
							}
						}
					}
				}
			}
		},
		injectFileToPage: function(module) {
			var c = Extension.Common;

			//Including .js or .ccs files to page  
			if (module.what.file) {
				var file = {};
				if (c.isObject(module.what.file)) file = module.what.file;
				else file.content = module.what.file;

				if (file.pages){
					file.pages = c.toArray(file.pages)
					for (var i=0; i<file.pages.length; i++){
						if (file.pages[i].predefined){
							var predefurls = this.getPredefinedUrls(file.pages[i].predefined);
							if (file.pages[i].urls) {
								file.pages[i].urls = c.toArray(file.pages[i].urls);
								file.pages[i].urls = predefurls.concat(file.pages[i].urls);
							} else file.pages[i].urls = predefurls;
						}
						if (file.pages[i].urls){
							file.pages[i].urls = c.toArray(file.pages[i].urls)
							if (c.checkurl(file.pages[i].urls)){
								if (c.varExist(file.pages[i].content, true)){
									Extension.IncludeScript.load(file.pages[i].content);
								}
							}
						}
					}
				}
				if (c.varExist(file.content, true))  Extension.IncludeScript.load(file.content);
			}
		},
		injectElementsTimeout: function(timeouts, data){
			var c = Extension.Common;
			var to = c.toArray(timeouts);
			for (var i=0; i<to.length; i++){
				//var data = JSON.parse(JSON.stringify(data));
				var activepage = data.module.activepage,
					locationnr = data.locationnr;
				setTimeout(function(){
					data.module.activepage = activepage;
					data.locationnr = locationnr;
					Extension.DisplayTimer.injectElements(data);
				}, c.toInt(to[i]));
			}
		},
		injectElements: function (module) {
			
			if (module.what){
				if (module.what.style)
					module = Extension.DisplayTimer.injectStyleToPage(module);
			}
			
			var displayblock = "ext-display-block ";
			if (module.inline) displayblock = "";
			
			var clear = "";
			if (module.clear) clear = "ext-clear ";
			
			module.elem = document.createElement("span");
			module.elem.className = "ext-dt-injected " + displayblock + clear + "ext-hidden ext-module-" + module.modulenr;
			
			var hascontent = false;
			if (module.what){
				if (module.what.html){
					if (module.what.html.content && module.what.html.options)
						module.what.html.content = Extension.Template.load({htmlcontent: module.what.html.content, htmloptions: module.what.html.options});
					if (Extension.Common.varExist(module.what.html.content, true)){
						hascontent = true;
						module.elem.innerHTML = module.what.html.content;
					}
				}
			}
			if (hascontent){
				if (module.products.hascrit){
					if (module.products.pagetype){
						switch(module.products.pagetype) {
							case "pip":
								Extension.DisplayTimer.pip(module);
								break;
							case "plp":
								Extension.DisplayTimer.plp(module);
								break;
							case "search":
								Extension.DisplayTimer.search(module);
								break;
							case "availability":
								Extension.DisplayTimer.availability(module);
								break;
							case "wishlist":
								Extension.DisplayTimer.wishlist(module);
								break;
						}
					}
				} else {
					if (!module.locations){
				        module.locations = [{
				            selector: "body",
				            elementnr: 0,
						    placing: "append",
						    effect: "fade"
				        }];
				    }
					for (var i=0; i<module.locations.length; i++){
						module.locations[i].elementnr = module.locations[i].elementnr || 0;
						module.locations[i].placing = module.locations[i].placing || "after";
						module.locations[i].effect = module.locations[i].effect || "fade";
						module.currentlocation = i;

						Extension.Element.get(module.locations[i].selector, function(selector, targetelems, module) {

							var c = Extension.Common,
								targetelemarr = [],
								temptargetelemarr = [],
								elementnr = [],
								tempelementnr = [];

							targetelemarr = c.toArray(targetelems);
							elementnr = c.toArray(module.locations[module.currentlocation].elementnr.toString());

							for (var i=0; i<elementnr.length; i++){
								elementnr[i] = elementnr[i].replace(/[^0-9,]/g,"");
								var split_arr = elementnr[i].toString().split(",");
								for (var j=0; j<split_arr.length; j++){
									tempelementnr.push(c.toInt(split_arr[j]));
								}
							}
							var arrlength = targetelemarr.length;
							for (var i=0; i<tempelementnr.length; i++){
								if (tempelementnr[i] > -1 && tempelementnr[i] < arrlength)
									temptargetelemarr.push(targetelemarr[tempelementnr[i]]);
							}
							module.targetelemarr = temptargetelemarr;

							//special for main page www.ikea
							if (module.locations[module.currentlocation].placing == "before" && module.locations[module.currentlocation].selector == "#whatsection") {
								Extension.DisplayTimerSettings.carruselarrow += 170;
								var arrowcss = '.corrosilnavigatingarrow{top:' + Extension.DisplayTimerSettings.carruselarrow + 'px !important}';
								var csselem = document.createElement("style");
								csselem.innerHTML = csselem.innerHTML + arrowcss;
								document.head.appendChild(csselem);
							}
							
							//Inject element to page
							if (module.elem) {
								for (var i=0; i<module.targetelemarr.length; i++){
									var elem = module.elem.cloneNode(module.elem);
									module.elem = elem;
									Extension.Element.inject(elem, module.targetelemarr[i], module.locations[module.currentlocation].placing);
									if (Extension.DisplayTimerSettings.testcookieset){
										setTimeout(function(){
											Extension.DisplayTimer.PreviewMenu.getContent(module);
										},300);
									}
									Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.locations[module.currentlocation].effect + " ext-effect-animated", 1000);
									
									//Callback
									if (Extension.Common.isFunction(module.complete))
										module.complete(module);
								}
							}
						}, module);
					}
				}
			}
			if (module.what){
				if (module.what.script)
					Extension.DisplayTimer.injectScriptToPage(module);
				if (module.what.file)
					Extension.DisplayTimer.injectFileToPage(module);
			}

		},
		mergetemplates: function(){
			var templates = Extension.Template.displaytimertemplates;
			if (templates){
				for (var i=0; i<templates.length; i++){
					templates[i] = this.gettemplate(templates[i]);
				}
			}
		},
		gettemplate: function(module){
			var c = Extension.Common;
			if (c.varExist(module.template, true)){
				module.run = false;
				var templates = Extension.Template.displaytimertemplates;
				if (templates){
					for (var j=0; j<templates.length; j++){
						if (templates[j].name == module.template){
						    var template_clone = JSON.parse(JSON.stringify(templates[j]));
							module = Extension.Merge.deepmerge(template_clone, module, [], false); 
							module.run = true;
							break;
						}
					}
				}
			}
			return module;
		},
		load: function(input) {
			
			var c = Extension.Common;
			if (!c.varExist(Extension.DisplayTimerInjected)) {
				Extension.DisplayTimerInjected = true;
				
				Extension.Time.get(function(time, input) {
					Extension.DisplayTimer.settings.TimeNow = time;
					Extension.DisplayTimer.settings.TimeSet = true;

					var c = Extension.Common;
					
					//Set product placement targets 
					Extension.DisplayTimer.preparation(function(){
						
						// Merge templates referencing eachother
						Extension.DisplayTimer.mergetemplates();

						// Loop through all modules in displaytimer
						var oldmodules = [];
						var elemList = [];
						var inactivechecked = false;
						if (Extension.Common.getCookie("ext_inactive") == "true")
							inactivechecked = true;
						for (var i = 0; i < input.modules.length; i++) {

							input.modules[i].modulenr = i;
							var module = input.modules[i];

							//Checking if new setup is used and if the module is active
							if (module.active || (inactivechecked && Extension.DisplayTimerSettings.override)){
								module.run = true;
								module = Extension.DisplayTimer.gettemplate(module);
								if (Extension.Common.isFunction(input.complete))
									module.complete = input.complete;
								
								if (module){
									if (module.run){
										
										//WHEN - checking if it is with the timesettings				
										Extension.DisplayTimer.dateValidation(module, function(module){

											//WHERE - checking if the page is valid, and if so call validateCustomer and check customer location as well
											Extension.DisplayTimer.validatePage(module, function(module){

												//Check targeting and add product elements to module
												module.products = {};
												if (module.where){
													if (module.where.products){
														Extension.Targeting.products(module.where.products, function(prod){
															module.products = prod;						
															
															//WHAT - Inject module content to page
															Extension.DisplayTimer.injectElements(module);
														});
													} else {
														//WHAT - Inject module content to page
														Extension.DisplayTimer.injectElements(module);
													}
												} else {
													//WHAT - Inject module content to page
													Extension.DisplayTimer.injectElements(module);
												}
											});
										});
									}
								}
							}else {
								oldmodules.push(module);
							}
						}
						if (oldmodules.length > 0) {
							Extension.DisplayTimerOld.load(oldmodules, function(input) {
								var c = Extension.Common;

								//Initiate Simpletabs
								if (c.varExist(Extension.SimpleTabs)) {
									Extension.SimpleTabs.init();
								}
								//Initiate ProductList
								if (c.varExist(Extension.ProductList)) {
									Extension.ProductList.init(input.data.productlists, function(input, status) {

										//Initiate ProductFilter
										if (c.varExist(Extension.ProductFilter)) {
											//if (status == "started"){
											//    Extension.ProductFilter.init({status: status, productInfo: data.productInfo, productFilters: data.productFilters});
											//}
											if (status == "filled") {
												//Extension.ProductFilter.init({status: status});
												Extension.ProductFilter.init({
													productInfo: input.context.data.productInfo,
													productFilters: input.context.data.productFilters
												});

											}
										}

									}, input);
								}

							},input);
						}
					});

				}, input);
				// Time.Get
			}
		},
		validateElement: function(elem) {
			var c = Extension.Common;
			if (c.varExist(elem.id))
				for (var i = 0; i < this.settings.ids.length; i++)
					if (elem.id == this.settings.ids[i])
						return false;
			for (var i = 0; i < this.settings.nodeTypes.length; i++)
				if (elem.tagName.toLowerCase() == this.settings.nodeTypes[i])
					return false;
			return true;
		},
		checkParents: function(elem, search) {
			var c = Extension.Common;
			if (c.varExist(elem.id))
				if (elem.id.indexOf(search) > -1)
					return true;
			if (c.varExist(elem.className))
				if (elem.className.indexOf(search) > -1)
					return true;
			return false;
		},
		
		//Validate date and time within timeframe. Format iso:  YYYY-MM-DDThh:mm:ss.000Z
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
													console.log("Extension.DisplayTimer.dateValidation: From: Date format must be YYYYMMDD or YYYY-MM-DD");
												}
											} else 
												dates[i].from = new Date(-1000000000000000);
										}
									}
								} else 
									dates[i].from = new Date(-1000000000000000);

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
													console.log("Extension.DisplayTimer.dateValidation: To: Date format must be YYYYMMDD or YYYY-MM-DD");
												}
											} else 
												dates[i].to = new Date(1000000000000000);
										}
									}
								} else 
									dates[i].to = new Date(1000000000000000);

								if (!c.varExist(dates[i].from, true))
									dates[i].from = new Date(-1000000000000000);
								if (!c.varExist(dates[i].to, true))
									dates[i].to = new Date(1000000000000000);  
								var From = new Date(dates[i].from)
								  , To = new Date(dates[i].to)
								  , server = new Date(Extension.DisplayTimerSettings.TimeNow);
								
								module.validation.dates[i] = Extension.DisplayTimer.PreviewMenu.formatDate({from: From.toISOString(), to: To.toISOString()});

								if (server.getTime() > From.getTime() && server.getTime() < To.getTime()){
									module.validation.dates[i].status = "now";	
									within_dates = true;
								} else if (server.getTime() > To.getTime())
									module.validation.dates[i].status = "past";
								else if (server.getTime() < From.getTime())
									module.validation.dates[i].status = "future";
								
								if (Extension.DisplayTimerSettings.override)
									within_dates = true;
								
							}
						} else within_dates = true;

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
					} else callback(module);
				} else callback(module);
			} catch (err) {
				console.log("Extension.DisplayTimer.dateValidation: Err: " + err);
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
									var server = new Date(Extension.DisplayTimerSettings.TimeNow);
									time.relevant_dates = {
										from: new Date(server.getFullYear(),server.getMonth(),server.getDate(),time.split.from[0],time.split.from[1],0,0)
										, to: new Date(server.getFullYear(),server.getMonth(),server.getDate(),time.split.to[0],time.split.to[1],0,0)
									}

									if (server.getTime() > time.relevant_dates.from.getTime() && server.getTime() < time.relevant_dates.to.getTime()){
										module.validation.intervals[v].times[i].status = "now";
										within_times = true;
									} else if (server.getTime() > time.relevant_dates.to.getTime())
										module.validation.intervals[v].times[i].status = "past";
									else if (server.getTime() < time.relevant_dates.from.getTime())
										module.validation.intervals[v].times[i].status = "future";
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
									var server = new Date(Extension.DisplayTimerSettings.TimeNow);
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
				 
				if ((within_times && within_days) || Extension.DisplayTimerSettings.override){
					callback(module);
				}

			} catch (err) {
				console.log("Extension.DisplayTimer.timeValidation: Err: " + err);
			}
		},

		validatePage: function(module, callback){
			//var module = module;
			if (module.where){
				if (module.where.pages) {
					module.where.pages = Extension.Common.toArray(module.where.pages);
					var all_empty = true;
					for (var p = 0; p < module.where.pages.length; p++) {
						if (module.where.pages[p].predefined){
							var predefurls = this.getPredefinedUrls(module.where.pages[p].predefined);
							if (module.where.pages[p].urls) {
								module.where.pages[p].urls = Extension.Common.toArray(module.where.pages[p].urls);
								module.where.pages[p].urls = predefurls.concat(module.where.pages[p].urls);
							} else module.where.pages[p].urls = predefurls;
						}
						if (module.where.pages[p].urls) {
							module.where.pages[p].urls = Extension.Common.toArray(module.where.pages[p].urls);
							if (module.where.pages[p].urls.length > 0) {
								for (var u=0; u<module.where.pages[p].urls.length; u++) {
									if (module.where.pages[p].urls[u] !== "")
										all_empty = false;
								}
							}
							var checkreturn = Extension.Common.checkurl(module.where.pages[p].urls, true);
							if (checkreturn > -1) {
								module.foundpageindex = p;
								module.foundurlindex = checkreturn;
								module.locations = Extension.Common.toArray(module.where.pages[p].locations);
								
								if (module.where.customers){
									this.validateCustomer(module, function(module){
										callback(module);
									});
								} else callback(module);
							}
						}
					}
					if (all_empty) callback(module);
				} else callback(module);
			} else callback(module);

		},
		validateCustomer: function(module, callback){
			if (module.where.customers) {
				var all_cities_include = [], all_regions_include = [], all_countries_include = []
				var all_cities_exclude = [], all_regions_exclude = [], all_countries_exclude = [];
				var within_cities = false, within_regions = false, within_countries = false;
				var all_empty = true;
				module.where.customers = Extension.Common.toArray(module.where.customers);
				if (module.where.customers.length > 0){
					for (var c = 0; c < module.where.customers.length; c++) {
						if (module.where.customers[c].places){
							module.where.customers[c].places = Extension.Common.toArray(module.where.customers[c].places);
							if (module.where.customers[c].places.length > 0){
								all_empty = false;
								for (var p = 0; p < module.where.customers[c].places.length; p++) {
									//Cities
									if (module.where.customers[c].places[p].cities){
										if (module.where.customers[c].places[p].cities.incl){
											module.where.customers[c].places[p].cities.incl = Extension.Common.toArray(module.where.customers[c].places[p].cities.incl);
											if (module.where.customers[c].places[p].cities.incl.length > 0){
												for (var ci = 0; ci < module.where.customers[c].places[p].cities.incl.length; ci++){
													var cities = module.where.customers[c].places[p].cities.incl[ci].toString().split("|");
													for (var j = 0; j < cities.length; j++){	
														if (Extension.Common.varExist(cities[j], true))
															all_cities_include.push(cities[j]);
													}
												}
											}
										}
										if (module.where.customers[c].places[p].cities.excl){
											module.where.customers[c].places[p].cities.excl = Extension.Common.toArray(module.where.customers[c].places[p].cities.excl);
											if (module.where.customers[c].places[p].cities.excl.length > 0){
												for (var ci = 0; ci < module.where.customers[c].places[p].cities.excl.length; ci++){
													var cities = module.where.customers[c].places[p].cities.excl[ci].toString().split("|");
													for (var j = 0; j < cities.length; j++){	
														if (Extension.Common.varExist(cities[j], true))
															all_cities_exclude.push(cities[j]);
													}
												}
											}
										}
										if (!module.where.customers[c].places[p].cities.incl && !module.where.customers[c].places[p].cities.excl)
											within_cities = true;
									} else within_cities = true;
									//Regions
									if (module.where.customers[c].places[p].regions){
										if (module.where.customers[c].places[p].regions.incl){
											module.where.customers[c].places[p].regions.incl = Extension.Common.toArray(module.where.customers[c].places[p].regions.incl);
											if (module.where.customers[c].places[p].regions.incl.length > 0){
												for (var ci = 0; ci < module.where.customers[c].places[p].regions.incl.length; ci++){
													var regions = module.where.customers[c].places[p].regions.incl[ci].toString().split("|");
													for (var j = 0; j < regions.length; j++){	
														if (Extension.Common.varExist(regions[j], true))
															all_regions_include.push(regions[j]);
													}
												}
											}
										}
										if (module.where.customers[c].places[p].regions.excl){
											module.where.customers[c].places[p].regions.excl = Extension.Common.toArray(module.where.customers[c].places[p].regions.excl);
											if (module.where.customers[c].places[p].regions.excl.length > 0){
												for (var ci = 0; ci < module.where.customers[c].places[p].regions.excl.length; ci++){
													var regions = module.where.customers[c].places[p].regions.excl[ci].toString().split("|");
													for (var j = 0; j < regions.length; j++){	
														if (Extension.Common.varExist(regions[j], true))
															all_regions_exclude.push(regions[j]);
													}
												}
											}
										}
										if (!module.where.customers[c].places[p].regions.incl && !module.where.customers[c].places[p].regions.excl)
											within_regions = true;
									} else within_regions = true;
									//Countries
									if (module.where.customers[c].places[p].countries){
										if (module.where.customers[c].places[p].countries.incl){
											module.where.customers[c].places[p].countries.incl = Extension.Common.toArray(module.where.customers[c].places[p].countries.incl);
											if (module.where.customers[c].places[p].countries.incl.length > 0){
												for (var ci = 0; ci < module.where.customers[c].places[p].countries.incl.length; ci++){
													var countries = module.where.customers[c].places[p].countries.incl[ci].toString().split("|");
													for (var j = 0; j < countries.length; j++){	
														if (Extension.Common.varExist(countries[j], true))
															all_countries_include.push(countries[j]);
													}
												}
											}
										}
										if (module.where.customers[c].places[p].regions.excl){
											module.where.customers[c].places[p].regions.excl = Extension.Common.toArray(module.where.customers[c].places[p].regions.excl);
											if (module.where.customers[c].places[p].regions.excl.length > 0){
												for (var ci = 0; ci < module.where.customers[c].places[p].regions.excl.length; ci++){
													var regions = module.where.customers[c].places[p].regions.excl[ci].toString().split("|");
													for (var j = 0; j < regions.length; j++){	
														if (Extension.Common.varExist(regions[j], true))
															all_countries_exclude.push(regions[j]);
													}
												}
											}
										}
										if (!module.where.customers[c].places[p].countries.incl && !module.where.customers[c].places[p].countries.excl)
											within_countries = true;
									} else within_countries = true;

									if (all_cities_include.length + all_regions_include.length + all_countries_include.length + 
										all_cities_exclude.length + all_regions_exclude.length + all_countries_exclude.length > 0){
										
										if (DisplayTimer.settings.uselocation){
											Extension.Customer.getlocation(function(data){
												//Cities
												if (data.city){
													var both_empty = true;
													if (all_cities_include.length > 0){
														module.validation.cities = all_cities_include;
														both_empty = false;
														for (var i = 0; i < all_cities_include.length; i++){	
															if (data.city.toLowerCase() == all_cities_include[i].toLowerCase()){
																module.validation.cities[i] = {city: all_cities_include[i], status: true};
																within_cities = true;
															} else
																module.validation.cities[i] = {city: all_cities_include[i], status: false};
														}
													}
													if (all_cities_exclude.length > 0){
														module.validation.cities_excl = all_cities_exclude;
														both_empty = false;
														for (var i = 0; i < all_cities_exclude.length; i++){	
															if (data.city.toLowerCase() == all_cities_exclude[i].toLowerCase()){
																module.validation.cities_excl[i] = {city: all_cities_exclude[i], status: true};
																within_cities = false; 
															} else
																module.validation.cities_excl[i] = {city: all_cities_exclude[i], status: false};
														}
													}
													if (both_empty) within_cities = true;
												}
												//Regions
												if (data.region){
													var both_empty = true;
													if (all_regions_include.length > 0){
														both_empty = false;
														for (var i = 0; i < all_regions_include.length; i++){	
															if (data.region.toLowerCase() == all_regions_include[i].toLowerCase()){
																module.validation.regions[i] = {city: all_regions_include[i], status: true};
																within_regions = true; 
															} else
																module.validation.regions[i] = {city: all_regions_include[i], status: false};
														}
													}
													if (all_regions_exclude.length > 0){
														both_empty = false;
														for (var i = 0; i < all_regions_exclude.length; i++){	
															if (data.region.toLowerCase() == all_regions_exclude[i].toLowerCase()){
																module.validation.regions_excl[i] = {city: all_regions_exclude[i], status: true};
																within_regions = false; 
															} else
																module.validation.regions_excl[i] = {city: all_regions_exclude[i], status: false};
														}
													}
													if (both_empty) within_regions = true;
												}
												//Countries
												if (data.country){
													var both_empty = true;
													if (all_countries_include.length > 0){
														both_empty = false;
														for (var i = 0; i < all_countries_include.length; i++){	
															if (data.country.toLowerCase() == all_countries_include[i].toLowerCase()){
																module.validation.countries[i] = {city: all_countries_include[i], status: true};
																within_countries = true; 
															} else
																module.validation.countries[i] = {city: all_countries_include[i], status: false};
														}
													}
													if (all_countries_exclude.length > 0){
														both_empty = false;
														for (var i = 0; i < all_countries_exclude.length; i++){	
															if (data.country.toLowerCase() == all_countries_exclude[i]){
																module.validation.countries_excl[i] = {city: all_countries_exclude[i], status: true};
																within_countries = false; 
															} else
																module.validation.countries_excl[i] = {city: all_countries_exclude[i], status: false};
														}
													}
													if (both_empty) within_countries = true;
												}

												if ((within_cities && within_regions && within_countries) || Extension.DisplayTimerSettings.override)
													callback(module);

											});

										} else callback(module);
									} else callback(module);
								}
							}
						}
					}
					if (all_empty)
						callback(module);
				} else callback(module);
			} else callback(module);

		},
		getProductLocation: function(module){
			if (module.where.products.locations){
				module.productlocnr = module.where.products.locations.pip || 0;
			} else module.productlocnr = 0;
			if (module.productlocnr >= module.products.dom.main.loc.length)
				module.productlocnr = module.products.dom.main.loc.length - 1;
			module.productloc = module.products.dom.main.loc[module.productlocnr];
			module.productloc.placing = module.productloc.placing || "after";
			module.productloc.effect = module.productloc.effect || "fade";	
			if (module.where.products.locations){
				if (module.where.products.locations.custom){
					if (Extension.Common.varExist(module.where.products.locations.custom.selector, true))
						module.productloc.selector = module.where.products.locations.custom.selector;
					if (Extension.Common.varExist(module.where.products.locations.custom.placing, true))
						module.productloc.placing = module.where.products.locations.custom.placing;
					if (Extension.Common.varExist(module.where.products.locations.custom.effect, true))
						module.productloc.effect = module.where.products.locations.custom.effect;	
				}
			}
			return module;
				
		},
		pip: function(module){
			module = this.getProductLocation(module);

			if (Extension.Common.checkMobile()){
				for (var i=0; i<module.products.dom.main.elems.length; i++){
					Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[i]}, function(selector, targetelem){
						var elem = module.elem.cloneNode(module.elem);
						Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
						if (Extension.DisplayTimerSettings.testcookieset){
							setTimeout(function(){
								Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
							},300);
						}
						Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.productloc.effect + " ext-effect-animated", 1000);

						//Callback
						if (Extension.Common.isFunction(module.complete))
							module.complete(module);
					});
				}
			} else {
				//if (!Extension.DisplayTimer.repeat){
				//	Extension.DisplayTimer.repeat = true;
					Extension.Common.monitorUrlChange({
						module: module,
						onchange: function(input){
							
							Extension.Element.remove(document.querySelectorAll(".ext-module-" + input.module.modulenr));
							if (Extension.DisplayTimerSettings.testcookieset){
								Extension.DisplayTimer.PreviewMenu.clearBorders([input.module]);
							}

							Extension.Targeting.products(input.module.where.products, function(prod){
								input.module.products = prod;
								for (var i=0; i<input.module.products.dom.main.elems.length; i++){
									Extension.Element.get({selector: input.module.productloc.selector, baseelem: input.module.products.dom.main.elems[i]}, function(selector, targetelem){
										var elem = module.elem.cloneNode(input.module.elem);
										Extension.Element.inject(elem, targetelem[0], input.module.productloc.placing);
										if (Extension.DisplayTimerSettings.testcookieset){
											setTimeout(function(){
												Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
											},300);
										}
										Extension.Common.addTimeoutClass(elem, "ext-effect-" + input.module.productloc.effect + " ext-effect-animated", 1000);

										//Callback
										if (Extension.Common.isFunction(module.complete))
											module.complete(module);
									});
								}
							});
						}
					});
				//}
			}


		},
		plp: function(module){
			module = this.getProductLocation(module);
			this.activepagemodules = this.activepagemodules || [];
			this.activepagemodules.push(module);

			Extension.DisplayTimer.productinjectagainirw = function (){
				var c = Extension.Common;

				var activepagemodules = Extension.DisplayTimer.activepagemodules;
				if (Extension.DisplayTimerSettings.testcookieset){
					Extension.DisplayTimer.PreviewMenu.clearBorders(activepagemodules);
				}

				for (var i=0; i<activepagemodules.length; i++){
					Extension.Element.remove(document.querySelectorAll(".ext-module-" + activepagemodules[i].modulenr));
					Extension.Targeting.products(activepagemodules[i].where.products, function(prod, module){
						module.products = prod;
						var landingpopups = [];
						for (var j=0; j<module.products.dom.main.elems.length; j++){
							if (module.products.dom.main.elems[j].id || module.products.dom.main.elems[j].parentNode.id == "landingPopup"){
								Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[j]}, function(selector, targetelem, module){
									var elem = module.elem.cloneNode(module.elem);
									Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
									if (Extension.DisplayTimerSettings.testcookieset && module.products.dom.main.elems[j].parentNode.id !== "landingPopup"){
										setTimeout(function(){
											Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
										},300);
									}
									Extension.Common.addTimeoutClass(elem, "ext-effect-appear ext-effect-animated", 1000);

									//Callback
									if (Extension.Common.isFunction(module.complete))
										module.complete(module);

								}, activepagemodules[i]);
							}
						}
					}, activepagemodules[i]);
				}
			}
			Extension.DisplayTimer.productinjectagain = function (){
				var c = Extension.Common;

				var activepagemodules = Extension.DisplayTimer.activepagemodules;
				if (Extension.DisplayTimerSettings.testcookieset){
					Extension.DisplayTimer.PreviewMenu.clearBorders(activepagemodules);
				}

				for (var i=0; i<activepagemodules.length; i++){
					Extension.Element.remove(document.querySelectorAll(".ext-module-" + activepagemodules[i].modulenr));
					Extension.Targeting.products(activepagemodules[i].where.products, function(prod, module){
						module.products = prod;
						for (var j=0; j<module.products.dom.main.elems.length; j++){
							Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[j]}, function(selector, targetelem, module){
								var elem = module.elem.cloneNode(module.elem);
								Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
								if (Extension.DisplayTimerSettings.testcookieset){
									setTimeout(function(){
										Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
									},300);
								}
								Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.productloc.effect + " ext-effect-animated", 1000);

								//Callback
								if (Extension.Common.isFunction(module.complete))
									module.complete(module);

							}, activepagemodules[i]);
						}
					}, activepagemodules[i]);
				}
			}

			if (Extension.Common.checkMobile()){
				
				for (var i=0; i<module.products.dom.main.elems.length; i++){
					Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[i]}, function(selector, targetelem){
						var elem = module.elem.cloneNode(module.elem);
						Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
						if (Extension.DisplayTimerSettings.testcookieset){
							setTimeout(function(){
								Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
							},300);
						}
						Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.productloc.effect + " ext-effect-animated", 1000);

						//Callback
						if (Extension.Common.isFunction(module.complete))
							module.complete(module);
					});
				}
			} else {

				for (var i=0; i<module.products.dom.main.elems.length; i++){
					Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[i]}, function(selector, targetelem){
						var elem = module.elem.cloneNode(module.elem);
						Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
						if (Extension.DisplayTimerSettings.testcookieset){
							setTimeout(function(){
								Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
							}, 300);
						}
						Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.productloc.effect + " ext-effect-animated", 1000);

						//Callback
						if (Extension.Common.isFunction(module.complete))
							module.complete(module);
					});
				}
				if (!Extension.DisplayTimer.repeat){
					Extension.DisplayTimer.repeat = true;
					//Extension.Common.addEvent(document, "click", function(evt){
					Extension.DisplayTimer.monitorElementChange({
						selector: ".productLists .product",
						innerselector: ".image a",
						prop: "href",
						onchange: function(){
							Extension.Targeting.reload = true;
							Extension.DisplayTimer.productinjectagainirw();
						}
					});

				}
			}

		},
		search: function(module){
			if (Extension.Common.checkMobile()){
				module = this.getProductLocation(module);
			
				this.activepagemodules = this.activepagemodules || [];
				this.activepagemodules.push(module);

				for (var i=0; i<module.products.dom.main.elems.length; i++){
					Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[i]}, function(selector, targetelem){
						var elem = module.elem.cloneNode(module.elem);
						Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
						if (Extension.DisplayTimerSettings.testcookieset){
							setTimeout(function(){
								Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
							},300);
						}
						Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.productloc.effect + " ext-effect-animated", 1000);

						//Callback
						if (Extension.Common.isFunction(module.complete))
							module.complete(module);
					});
				}
				Extension.DisplayTimer.changeidle = false;
				setTimeout(function(){
					Extension.DisplayTimer.changeidle = true;
				}, 500);
				if (!Extension.DisplayTimer.repeat){
					Extension.DisplayTimer.repeat = true;
					//Extension.Common.addEvent(document, "click", function(evt){
					Extension.Common.monitorDomChange({
						onchange: function(){
							if (Extension.DisplayTimer.changeidle){
								Extension.DisplayTimer.changeidle = false;
								setTimeout(function(){
									Extension.DisplayTimer.changeidle = true;
								}, 500);

								var c = Extension.Common;
								Extension.Targeting.reload = true;

								var activepagemodules = Extension.DisplayTimer.activepagemodules;
								if (Extension.DisplayTimerSettings.testcookieset){
									Extension.DisplayTimer.PreviewMenu.clearBorders(activepagemodules);
								}
								setTimeout(function(){
									for (var i=0; i<activepagemodules.length; i++){
										Extension.Element.remove(document.querySelectorAll(".ext-module-" + activepagemodules[i].modulenr));
										Extension.Targeting.products(activepagemodules[i].where.products, function(prod, module){
											module.products = prod;
											var landingpopups = [];
											for (var j=0; j<module.products.dom.main.elems.length; j++){
												Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[j]}, function(selector, targetelem, module){
													var elem = module.elem.cloneNode(module.elem);
													Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
													if (Extension.DisplayTimerSettings.testcookieset){
														setTimeout(function(){
															Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
														},300);
													}
													Extension.Common.addTimeoutClass(elem, "ext-effect-appear ext-effect-animated", 1000);

													//Callback
													if (Extension.Common.isFunction(module.complete))
														module.complete(module);

												}, activepagemodules[i]);
											}
										}, activepagemodules[i]);
									}
								}, 100);
							}
						}
					});

				}
			} else {
				module = this.getProductLocation(module);
			
				for (var i=0; i<module.products.dom.main.elems.length; i++){
					Extension.Element.get({selector: module.productloc.selector, baseelem: module.products.dom.main.elems[i]}, function(selector, targetelem){
						var elem = module.elem.cloneNode(module.elem);
						Extension.Element.inject(elem, targetelem[0], module.productloc.placing);
						if (Extension.DisplayTimerSettings.testcookieset){
							setTimeout(function(){
								Extension.DisplayTimer.PreviewMenu.getContent(module, elem);
							},300);
						}
						Extension.Common.addTimeoutClass(elem, "ext-effect-" + module.productloc.effect + " ext-effect-animated", 1000);

						//Callback
						if (Extension.Common.isFunction(module.complete))
							module.complete(module);
					});
				}
			}

		},
		/*
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
						if (buyability.currentbuyability.actions.removeAddToCartButton){
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

						if (buyability.currentbuyability.actions.removeAddToCartButton && buyability.currentbuyability.actions.removeAddToListButton){
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
								if (Extension.Time.dateValidationTimes(data.buyability[n].times)){
									Extension.Targeting.reload = true;
									Extension.Targeting.products(data.buyability[n].targeting, function(products, buyability){
										var c = Extension.Common,
											e = Extension.Element,
											elems = products.dom.main.elems,
											found = false;
										for (var i=0; i<elems.length; i++){
											if (c.varExist(buyability.actions)){
												found = true;
												// Remove "add to cart" button.
												if (buyability.actions.removeAddToCartButton){
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
								}
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
						if (buyability.currentbuyability.actions.removeAddToCartButton){
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

		},
		*/
		monitorElementChange: function(input){
			var c = Extension.Common;
			if (c.isObject(input)){
				if (c.isFunction(input.onchange)){
					Extension.DisplayTimer.elementonchange = input.onchange;
					if (input.selector && input.innerselector){
						var checkarr = [];
						input.prop = input.prop || "outerHTML";
						var elems = document.querySelectorAll(input.selector);
						for (var i=0; i<elems.length; i++){
							if (c.varExist(elems[i].id, true)){
								var item = {}
								item.id = elems[i].id || ""
								item.class = elems[i].className || "";
								var innerelem = elems[i].querySelector(input.innerselector);
								item.prop = "";
								if (innerelem)
									item.prop = innerelem[input.prop].toString();
								checkarr.push(item);
							}
						} 
						var changed = false;
						input.checkarr = input.checkarr || [];
						if (input.checkarr.length > 0 || checkarr.length > 0){
							for (var i=0; i<checkarr.length; i++){
								if (i < input.checkarr.length){
									if (checkarr[i].prop !== input.checkarr[i].prop){
										var returnitem = input.checkarr[i];
										changed = true;
									}
								} else {
									var returnitem = input.checkarr[i];	
									changed = true;
								}
							}
							if (input.checkarr.length > checkarr.length){
								var returnitem = input.checkarr[i];	
								changed = true;
							}
						}
								
						
						input.time = input.time || 100;

						if (changed) {
							input.onchange(input.checkarr[i]);
							input.checkarr = checkarr;
						}
						setTimeout(function() {
							Extension.DisplayTimer.monitorElementChange(input);
						}, input.time);
					}
				}
			}
		},
		PreviewMenu: {
			init: function() {
				var c = Extension.Common;
				if (document.URL.indexOf('?extdtshow') > -1 || document.URL.indexOf('&extdtshow') > -1) {
					c.setCookie("ext_st", "on");
				}
				var timeCookie = c.getCookie('ext_time');
				if (c.varExist(timeCookie)) {
					Extension.DisplayTimerSettings.testcookieset = true;
					if (timeCookie == "all") {
						Extension.DisplayTimerSettings.override = true;
					} else {
						Extension.DisplayTimerSettings.TimeNow = timeCookie;
						Extension.DisplayTimerSettings.TimeSet = "true";
					}
					this.tool();
				} else if (c.varExist(c.getCookie('ext_st'))) {
					Extension.DisplayTimerSettings.testcookieset = true;
					Extension.DisplayTimerSettings.override = true;
					c.setCookie("ext_time", "all");
					this.tool();
				}
			},
			tool: function() {
				var t = document.getElementById('ext-dt-tool');
				if (!t) {
					var dateTime = new Date(Extension.DisplayTimerSettings.TimeNow);
					var settings = {
						year: dateTime.getFullYear(),
						month: dateTime.getMonth() + 1,
						day: dateTime.getDate(),
						hour: dateTime.getHours(),
						minute: dateTime.getMinutes(),
					};
					Extension.Element.get("body", function(){
						
						var createtool = function(loc){
							var c = Extension.Common;
							var checked_all = "";
							if (Extension.DisplayTimerSettings.override)
								checked_all = " checked";
							var checked_inactive = "";
							if (c.getCookie("ext_inactive") == "true")
								checked_inactive = " checked";

								
							var toolelem = document.createElement('div');
							toolelem.id = "ext-dt-tool";
							var previewcookie = c.getCookie("ext");
							var previewselected = "";
							var liveselected = "";
							if (previewcookie){
								if (previewcookie == "preview")
									previewselected = "border: 3px dashed rgb(80, 80, 80);";
								else 
									liveselected = "border: 3px dashed rgb(80, 80, 80);";
							} else liveselected = "border: 3px dashed rgb(80, 80, 80);";
							
							var innerhtml = '' +
								'<style>#ext-dt-tool *, #ext-dt-tool-tab *{box-sizing: border-box;} #ext-dt-tool{position:fixed; box-sizing: border-box; left:-270px; width: 270px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; bottom: 20px; border: solid 1px #ccc;border-radius: 5px;moz-border-radius: 5px; background-color: #eee; padding: 5px; margin: 0; z-index:10500;-webkit-transition: all 0.5s; transition: all 0.5s;}#ext-dt-tool.ext-dt-tool-hover{left: 10px; z-index: 11000;}' +
								'#ext-dt-tool-tab{position:fixed; box-sizing: border-box; left:0px; bottom: 25px; border: solid 1px #ccc; border-left: 0px; border-radius: 0 5px 5px 0;moz-border-radius: 0 5px 5px 0; background-color: #eee; color: black; padding: 30px 10px; font-size: 16px; z-index:10500;-webkit-transition: all 0.5s; transition: all 0.5s;}#ext-dt-tool-tab.ext-dt-tool-tab-hover{left: 200px;}' +
								'.tg-yw40 input{padding: 3px;border-radius : 5px;moz-border-radius : 5px;}.tg-yw4l input{padding: 3px;border-radius : 5px;moz-border-radius : 5px;width: 60px;	font-size: 10px;}.tg-yw4l .btn-style{display: block; width: 100%; background-color: rgb(0, 153, 255); text-align: center; padding: 5px 10px; margin-top: 10px; color: white; border-radius: 4px; text-decoration: none; transition: background-color 0.2s;} .btn-style:hover{background-color:#4db8ff}</style>' +
								'<table>' +
								'<tr><td class="tg-yw4l"><input style="margin: 0" class="btn-style" type="button" onclick="Extension.DisplayTimer.PreviewMenu.close()" value="Close"></td><td class="tg-yw4l" colspan="3"><input style="width: 70px; display: inline-block; margin-bottom: 10px;' + liveselected + '" class="btn-style" type="button" onclick="Extension.DisplayTimer.PreviewMenu.setLive();" value="Live"><input style="width: 70px; display: inline-block; margin-bottom: 10px;' + previewselected + '" class="btn-style" type="button" onclick="Extension.DisplayTimer.PreviewMenu.setPreview();" value="Preview"></td></tr>' +
								'<tr><td class="tg-yw4l"></td><td style="padding: 0 0 10px 10px; text-align:left" class="tg-yw40" colspan="3"><input type="checkbox" id="dttf_all" name="all"' + checked_all + '> Show all modules<br><input type="checkbox" id="dttf_inactive" name="all"' + checked_inactive + '> Show inactive modules</td></tr>';
							if (DisplayTimer.settings.uselocation){
								innerhtml += '' +
								'<tr><td class="tg-yw4l"></td><td class="tg-yw4l">Country</td><td class="tg-yw4l">Region</td><td class="tg-yw4l">City</td></tr>' +
								'<tr><td class="tg-yw4l">Location:</td><td class="tg-yw4l"><input type="text" id="dttf_country" name="country" value="' + loc.country + '"></td><td class="tg-yw4l"><input type="text" id="dttf_region" name="month" value="' + loc.region + '"></td><td class="tg-yw4l"><input type="text" id="dttf_city" name="day" value="' + loc.city + '"></td></tr>' +
								'<tr><td class="tg-yw4l" height="5"></td></tr>';
							}
								innerhtml += '' +
								'<tr><td class="tg-yw4l"></td><td class="tg-yw4l">Year</td><td class="tg-yw4l">Month</td><td class="tg-yw4l">Day</td></tr>' +
								'<tr><td class="tg-yw4l">Date:</td><td class="tg-yw4l"><input type="number" id="dttf_year" name="year" min="2012" max="2030" step="1" value="' + settings.year + '"></td><td class="tg-yw4l"><input type="number" id="dttf_month" name="month" min="1" max="12" step="1" value="' + Extension.DisplayTimer.PreviewMenu.setTwoDigits(settings.month) + '" onchange="Extension.DisplayTimer.PreviewMenu.setElemDigits(this, 2)"></td><td class="tg-yw4l"><input type="number" id="dttf_day" name="day" min="1" max="31" step="1" value="' + Extension.DisplayTimer.PreviewMenu.setTwoDigits(settings.day) + '" onchange="Extension.DisplayTimer.PreviewMenu.setElemDigits(this, 2)"></td></tr>' +
								'<tr><td class="tg-yw4l"></td><td class="tg-yw4l">Hour</td><td class="tg-yw4l">Minute</td><td class="tg-yw4l"></td></tr>' +
								'<tr><td class="tg-yw4l">Time:</td><td class="tg-yw4l"><input type="number" id="dttf_hour" name="hour" min="00" max="23" step="1" value="' + Extension.DisplayTimer.PreviewMenu.setTwoDigits(settings.hour) + '" onchange="Extension.DisplayTimer.PreviewMenu.setElemDigits(this, 2)"></td><td class="tg-yw4l"><input type="number" id="dttf_minute" name="minute" min="00" max="59" step="1" value="' + Extension.DisplayTimer.PreviewMenu.setTwoDigits(settings.minute) + '" onchange="Extension.DisplayTimer.PreviewMenu.setElemDigits(this, 2)"></td><td class="tg-yw4l"><input class="btn-style" type="button" onclick="Extension.DisplayTimer.PreviewMenu.submit()" value="Save"></td></tr>' +
								'</table>';
								toolelem.innerHTML = innerhtml;
							
							var tooltabelem = document.createElement('div');
							tooltabelem.id = "ext-dt-tool-tab";
							tooltabelem.innerHTML = ">>";
							
							var toolelemover = function(e){
								Extension.Common.addClass(e.currentTarget, "ext-dt-tool-hover");
								Extension.Common.addClass(e.currentTarget.ext_tooltabelem, "ext-dt-tool-tab-hover");
							};						
							var toolelemout = function(e){
								Extension.Common.removeClass(e.currentTarget, "ext-dt-tool-hover");
								Extension.Common.removeClass(e.currentTarget.ext_tooltabelem, "ext-dt-tool-tab-hover");
							};
							
							var tooltabelemover = function(e){
								Extension.Common.addClass(e.currentTarget, "ext-dt-tool-tab-hover");
								Extension.Common.addClass(e.currentTarget.ext_toolelem, "ext-dt-tool-hover");
							};
							var tooltabelemout = function(e){
								Extension.Common.removeClass(e.currentTarget, "ext-dt-tool-tab-hover");
								Extension.Common.removeClass(e.currentTarget.ext_toolelem, "ext-dt-tool-hover");
							};
							c.addEvent(toolelem,"mouseover", toolelemover);
							c.addEvent(toolelem,"mouseout", toolelemout);
							c.addEvent(tooltabelem,"mouseover", tooltabelemover);
							c.addEvent(tooltabelem,"mouseout", tooltabelemout);
							c.addEvent(toolelem,"click", function(e){
								if (Extension.Common.hasClass(e.currentTarget, "ext-dt-tool-hover"))
									toolelemover(e);
								else
									toolelemout(e);
							});

							document.body.appendChild(toolelem);
							document.body.appendChild(tooltabelem);
							toolelem.ext_tooltabelem = tooltabelem;
							tooltabelem.ext_toolelem = toolelem;
						};
						if (DisplayTimer.settings.uselocation){
							Extension.Customer.getlocation(function(loc){
								createtool(loc);
							});
						} else createtool();
					});
				}

			},
			getProperties: function(elem) {
				var res = {};
				var rect = elem.getBoundingClientRect(),
					top = window.pageYOffset || document.documentElement.scrollTop,
					left = window.pageXOffset || document.documentElement.scrollLeft;
				
				res.posy = parseInt(rect.top + top) - 0;
				res.posx = parseInt(rect.left + left - 8);
				
				var widthdiff = 0;
				if (res.posx < 0){
					widthdiff = res.posx;
					res.posx = 0;
				}
				
				res.height = elem.scrollHeight + 2;
				res.width = elem.scrollWidth + widthdiff + 16;
				
				var winw = window.innerWidth;
				var winh = window.innerHeight;

				if (Extension.Common.isMobile.any()){
					if (res.width + res.posx > winw)
						res.width = winw - res.posx - 10;
				} else {
					if (res.width + res.posx > winw - 10)
						res.width = winw - res.posx - 17;
				}
				
				res.infodiff = 0;
				//if ((res.width + 35) > winw)
				//	res.infodiff = winw - res.width + 35;

				res.visible = true;
				if ((elem.scrollHeight == 0 || elem.scrollWidth == 0) && parseInt(rect.left) == 0)
					res.visible = false;
				
				return res
			},
			formatDate: function(date){
				if (date.from.date){
					date.from.time = date.from.time || "00:00";
					date.from.formatted = date.from.date + " - " + date.from.time; 
				} else {
					var datefrom = new Date(date.from);
					var tempdate = tempdate  || {};
					tempdate.from = {};
					tempdate.from.date = datefrom.getFullYear() + '.' + this.setTwoDigits(datefrom.getMonth() + 1) + '.' + this.setTwoDigits(datefrom.getDate());
					tempdate.from.time = this.setTwoDigits(datefrom.getHours()) + ':' + this.setTwoDigits(datefrom.getMinutes());
					tempdate.from.formatted = tempdate.from.date + " - " + tempdate.from.time;
				}
				if (date.to.date){
					date.to.time = date.from.time || "00:00";
					date.to.formatted = date.from.date + " - " + date.from.time; 
				} else {
					var dateto = new Date(date.to);
					var tempdate = tempdate  || {};
					tempdate.to = {};
					tempdate.to.date = dateto.getFullYear() + '.' + this.setTwoDigits(dateto.getMonth() + 1) + '.' + this.setTwoDigits(dateto.getDate());
					tempdate.to.time = this.setTwoDigits(dateto.getHours()) + ':' + this.setTwoDigits(dateto.getMinutes());
					tempdate.to.formatted = tempdate.to.date + " - " + tempdate.to.time;
				}
				if (tempdate)
					date = tempdate;
				return date;
			},
			formatDays: function(daynumber){
				switch(daynumber) {
					case 0:
						return "Sun";
						break;
					case 1:
						return "Mon";
						break;
					case 2:
						return "Tue";
						break;
					case 3:
						return "Wed";
						break;
					case 4:
						return "Thu";
						break;
					case 5:
						return "Fri";
						break;
					case 6:
						return "Sat";
						break;
				}
			},
			moveBorders: function(){
				var elemarr = Extension.DisplayTimer.PreviewMenu.elemarr;
				for (var i=elemarr.length-1; i>=0; i--){
					var prop = Extension.DisplayTimer.PreviewMenu.getProperties(elemarr[i]);
					if (prop.visible){
						elemarr[i].ext_borderelem.setAttribute("style", "top: " + prop.posy + "px; left: " + prop.posx + "px; height: " + prop.height + "px; width: " + prop.width + "px;");
						elemarr[i].ext_infoelem.setAttribute("style", "top: " + (prop.posy - 40) + "px; left: " + (prop.posx + prop.width - 150 - prop.infodiff) + "px; height: 40px; width: 130px;");
						elemarr[i].ext_timeiconelem.setAttribute("style", "top: " + (prop.posy - 40) + "px; left: " + (prop.posx + prop.width - 19 - prop.infodiff) + "px; height: 20px; width: 20px;");
						elemarr[i].ext_activeiconelem.setAttribute("style", "top: " + (prop.posy - 20) + "px; left: " + (prop.posx + prop.width - 19 - prop.infodiff) + "px; height: 20px; width: 20px;");
						elemarr[i].ext_borderelem.ext_prop = prop;
					} else {
						var parent = elemarr[i].parentNode;
						if (parent) 
							parent.removeChild(elemarr[i]);
						else
							elemarr.splice(i, 1);
					}
				}
			},
			clearBorders: function(activemodules){
				var selectors = [".ext-testborder",".ext-testinfo",".ext-testtimeicon",".ext-testactiveicon"];
				if (activemodules){
					for (var i=0; i<activemodules.length; i++){
						selectors = [];
						selectors.push(".ext-test-module-" + activemodules[i].modulenr);
					}
				}	
				var elems;
				for (var s=0; s<selectors.length; s++){
					elems = document.querySelectorAll(selectors[s]);
					for (var i=elems.length-1; i>=0; i--){
						var parent = elems[i].parentNode;
						if (parent) 
							parent.removeChild(elems[i]);
					}
				}
			},
			getContent: function(module, elem) {
				Extension.Element.get("body", function(){
					var c = Extension.Common;
					try {
						elem = elem || module.elem;
						if (elem){
							Extension.DisplayTimer.PreviewMenu.elemarr = Extension.DisplayTimer.PreviewMenu.elemarr || [];
							var prop = Extension.DisplayTimer.PreviewMenu.getProperties(elem);
							if (prop.visible){
								var bordercss = document.getElementById("ext-testborder-style");
								if (!bordercss){
									var bordercss = document.createElement("style");
									bordercss.id = "ext-testborder-style";
									bordercss.innerHTML = "" +
										".ext-testinfo * {box-sizing: border-box;}" +
										".ext-testborder{position: absolute; box-sizing: border-box; border: 2px dashed #4db8ff; border-radius: 5px; pointer-events:none; z-index:9000; -webkit-transition: all 0.5s; transition: all 0.5s;}" +
										".ext-testinfo{position: absolute; box-sizing: border-box;  text-align: center; background-color: #eee;font-family: Arial, Helvetica, sans-serif; font-size: 12px;padding: 2px 5px;border: solid 1px #ccc; border-radius: 5px; overflow: hidden; z-index:10000; -webkit-transition: all 0.5s; transition: all 0.5s;}" +
										".ext-testinfo-inner{text-align: left; height: 155px; -webkit-transition: all 0.5s; transition: all 0.5s; padding: 10px; display: none; overflow: auto;}" +
										".ext-testborder-hover{border-style: solid;} .ext-testinfo-hover{z-index: 11000;} .ext-testinfo-hover .ext-testinfo-inner.ext-show{display: block;}" +
										".ext-testtimeicon{position: absolute; box-sizing: border-box; text-align: center; background-color: #4db8ff; color: white; font-family: Arial, Helvetica, sans-serif; font-size: 14px; border: solid 1px #888; border-radius: 5px; z-index:10000; -webkit-transition: all 0.5s; transition: all 0.5s;}" +
										".ext-testactiveicon{position: absolute; box-sizing: border-box; text-align: center; background-color: #70ec95; color: white; font-family: Arial, Helvetica, sans-serif; font-size: 14px; border: solid 1px #888; border-radius: 5px; z-index:10000; -webkit-transition: all 0.5s; transition: all 0.5s;}" +
										".ext-test-grey-back{background-color: rgb(181, 181, 181)}.ext-test-blue-back{background-color: rgb(0, 153, 255)} .ext-test-green-back{background-color: rgb(0, 204, 89)} .ext-test-red-back{background-color: rgb(236, 0, 25)}" +							
										".ext-test-grey-text{color: rgb(181, 181, 181)}.ext-test-blue-text{color: rgb(0, 153, 255)} .ext-test-green-text{color: rgb(0, 204, 89)} .ext-test-red-text{color: rgb(236, 0, 25)}";
										document.head.appendChild(bordercss);
									c.addEvent(window, "resize", function(e){
										Extension.DisplayTimer.PreviewMenu.moveBorders();
									});
									window.moveborderinterval = setInterval(function(){
										Extension.DisplayTimer.PreviewMenu.moveBorders();
									}, 100);
								}

								var borderelem = document.createElement("div");
								borderelem.className = "ext-testborder ext-test-module-" + module.modulenr;
								borderelem.setAttribute("style", "top: " + prop.posy + "px; left: " + prop.posx + "px; height: " + prop.height + "px; width: " + prop.width + "px;");
								
								var infoelem = document.createElement("div");
								infoelem.className = "ext-testinfo ext-test-module-" + module.modulenr;
								infoelem.setAttribute("style", "top: " + (prop.posy - 40) + "px; left: " + (prop.posx + prop.width - 150 - prop.infodiff) + "px; height: 40px; width: 130px");
								
								var innerhtml = "";
								if (module.name){
									innerhtml += module.name;
								}
								
								var color = "";
								if (module.validation){
									var htmldates = "";
									var datelevel = "na";
									color = "ext-test-grey-text";
									if (module.validation.dates){
										module.validation.dates = c.toArray(module.validation.dates);
										for (var t = 0; t < module.validation.dates.length; t++) {
											switch(module.validation.dates[t].status) {
												case "now":
													color = "ext-test-green-text";
													datelevel = "now";
													break;
												case "future":
													color = "ext-test-blue-text";
													if (datelevel == "future" || datelevel == "na")
													datelevel = "future";
													break;
												case "past":
													color = "ext-test-grey-text";
													if (datelevel == "na")
													datelevel = "past";
													break;
											}
											htmldates += "<div class=\"" + color + "\">F: " + module.validation.dates[t].from.formatted + "<br>T: " + module.validation.dates[t].to.formatted + "</div>";
										}
									}
									var htmltimes = "";
									var htmldays = "";
									var timelevel = "na";
									var dayfound = false;
									color = "ext-test-grey-text";
									
									if (module.validation.intervals){
										module.validation.intervals = c.toArray(module.validation.intervals);
										for (var v = 0; v < module.validation.intervals.length; v++) {
											if (module.validation.intervals[v].times){
												module.validation.intervals[v].times = c.toArray(module.validation.intervals[v].times);
												for (var t = 0; t < module.validation.intervals[v].times.length; t++) {
													switch(module.validation.intervals[v].times[t].status) {
														case "now":
														color = "ext-test-green-text";
														timelevel = "now";
														break;
													case "future":
														color = "ext-test-blue-text";
														if (timelevel == "future" || timelevel == "na")
														timelevel = "future";
														break;
													case "past":
														color = "ext-test-grey-text";
														if (timelevel == "na")
														timelevel = "past";
														break;
													}
													htmltimes += "<div class=\"" + color + "\">F: " + module.validation.intervals[v].times[t].time.from + "<br>T: " + module.validation.intervals[v].times[t].time.to + "</div>";
												}
											}
											if (module.validation.intervals[v].days){
												module.validation.intervals[v].days = c.toArray(module.validation.intervals[v].days);
												for (var t = 0; t < module.validation.intervals[v].days.length; t++) {
													switch(module.validation.intervals[v].days[t].status) {
														case true:
															dayfound = true;
															color = "ext-test-green-text";
															break;
														case false:
															color = "ext-test-red-text";
															break;
													}
													htmldays += "<span class=\"" + color + "\">" + module.validation.intervals[v].days[t].day + "</span>&nbsp;&nbsp;";
												}
											}
										}
									}
									var htmlcountries = "";
									var countryfound = false;
									if (module.validation.countries){
										for (var i = 0; i < module.validation.countries.length; i++) {
											switch(module.validation.countries[i].status) {
												case true:
													countryfound = true;
													color = "ext-test-green-text";
													break;
												case false:
													color = "ext-test-red-text";
													break;
											}
											htmlcountries += "<span class=\"" + color + "\">" + module.validation.countries[i].country + "</span>, ";
										}
									}
									var htmlregions = "";
									var regionfound = false;
									if (module.validation.regions){
										for (var i = 0; i < module.validation.regions.length; i++) {
											switch(module.validation.regions[i].status) {
												case true:
													regionfound = true;
													color = "ext-test-green-text";
													break;
												case false:
													color = "ext-test-red-text";
													break;
											}
											htmlregions += "<span class=\"" + color + "\">" + module.validation.regions[i].region + "</span>, ";
										}
									}
									var htmlcities = "";
									var cityfound = false;
									if (module.validation.cities){
										for (var i = 0; i < module.validation.cities.length; i++) {
											switch(module.validation.cities[i].status) {
												case true:
													cityfound = true;
													color = "ext-test-green-text";
													break;
												case false:
													color = "ext-test-red-text";
													break;
											}
											htmlcities += "<span class=\"" + color + "\">" + module.validation.cities[i].city + "</span>, ";
										}
									}


									innerhtml += "<div class=\"ext-testinfo-inner\">";
									
									if (module.filepath && module.filepath.indexOf("m2.ikea.com") > -1){
										var data_source;
										data_source = module.filepath;
										var match = module.filepath.match(new RegExp('\/data-sources\/(.*)\.json'));
										if (match){
											if (match.length >= 1)
												data_source = "Extension.Common.goto('https://prod-eu.m2.blue.cdtapps.com/no/no/app/#/data-sources/" + match[1] + "?type=tree&search=" + encodeURIComponent(module.name) + "', '_blank'); return false;";
										}
										if (data_source)
											innerhtml += "<div class=\"ext-link\" style=\"padding-bottom: 10px\"><a href=\"#\" onclick=\"" + data_source + "\">Link to the data-source</a></div>";
									}

									if (module.active)
										innerhtml += "<div class=\"ext-dates\">Active: <span style=\"color: rgb(0, 204, 89)\">YES</span></div>";
									else
										innerhtml += "<div class=\"ext-dates\">Active: <span style=\"color: rgb(236, 0, 25)\">NO</span></div>";
									
									if (c.varExist(htmldates, true))
										innerhtml += "<div class=\"ext-dates\">Dates: " + htmldates + "</div>";
									if (c.varExist(htmltimes, true))
										innerhtml += "<div class=\"ext-times\">Times: " + htmltimes + "</div>";
									if (c.varExist(htmldays, true))
										innerhtml += "<div class=\"ext-days\">Days: " + htmldays + "</div>";
									if (c.varExist(htmlcountries, true))
										innerhtml += "<div class=\"ext-countries\">Countries: " + htmlcountries + "</div>";
									if (c.varExist(htmlregions, true))
										innerhtml += "<div class=\"ext-regions\">Regions: " + htmlregions + "</div>";
									if (c.varExist(htmlcities, true))
										innerhtml += "<div class=\"ext-cities\">Cities: " + htmlcities + "</div>";
									innerhtml += "</div>";
									infoelem.innerHTML = innerhtml;

									//Create time icon
									var timeiconelem = document.createElement("div");
									timeiconelem.className = "ext-testtimeicon ext-test-module-" + module.modulenr;;
									if (datelevel == "past" || timelevel == "past"){
										color = "ext-test-grey-back";
										timeiconelem.innerHTML = "P";
									} else if (datelevel == "future" || timelevel == "future"){
										color = "ext-test-blue-back";
										timeiconelem.innerHTML = "F";
									} else if (datelevel == "now" || timelevel == "now"){
										color = "ext-test-green-back";
										timeiconelem.innerHTML = "N";
									}
									c.addClass(timeiconelem, color);
									timeiconelem.setAttribute("style", "top: " + (prop.posy - 40) + "px; left: " + (prop.posx + prop.width - 19 - prop.infodiff) + "px; height: 20px; width: 20px");
									
									//Create active icon
									var checkfound = true;
									if(c.varExist(htmldays, true)){
										if (!dayfound) checkfound = false;
									}
									if(c.varExist(htmlcountries, true)){
										if (!countryfound) checkfound = false;
									}
									if(c.varExist(htmlregions, true)){
										if (!regionfound) checkfound = false;
									}
									if(c.varExist(htmlcities, true)){
										if (!cityfound) checkfound = false;
									}
									
									var activeiconelem = document.createElement("div");
									activeiconelem.className = "ext-testactiveicon ext-test-module-" + module.modulenr;;
									if (module.active && (datelevel == "now" || datelevel == "na") && (timelevel == "now" || timelevel == "na")){
										if (checkfound){
											color = "ext-test-green-back";
											activeiconelem.innerHTML = "V";
										} else {
											color = "ext-test-red-back";
											activeiconelem.innerHTML = "H";
										}
									} else if (module.active && ((datelevel == "future" && !timelevel !== "past") || (timelevel == "future" && datelevel !== "past"))){
										if (checkfound){
											color = "ext-test-blue-back";
											activeiconelem.innerHTML = "F";
										} else {
											color = "ext-test-red-back";
											activeiconelem.innerHTML = "H";
										}
									} else {
										color = "ext-test-red-back";
										activeiconelem.innerHTML = "H";
									}
									c.addClass(activeiconelem, color);
									activeiconelem.setAttribute("style", "top: " + (prop.posy - 20) + "px; left: " + (prop.posx + prop.width - 19 - prop.infodiff) + "px; height: 20px; width: 20px");
								
								
									borderelem.ext_prop = prop;
									infoelem.ext_borderelem = borderelem;
									elem.ext_infoelem = infoelem;
									elem.ext_borderelem = borderelem;
									elem.ext_timeiconelem = timeiconelem;
									elem.ext_activeiconelem = activeiconelem;
									Extension.DisplayTimer.PreviewMenu.elemarr.push(elem);
									
									
									document.body.appendChild(borderelem);
									document.body.appendChild(infoelem);
									document.body.appendChild(timeiconelem);
									document.body.appendChild(activeiconelem);
								
									
									var elemover = function(e){
										Extension.Common.addClass(e.currentTarget.ext_borderelem,"ext-testborder-hover");
									};
									var elemout = function(e){
										Extension.Common.removeClass(e.currentTarget.ext_borderelem, "ext-testborder-hover");
									};
									var infoelemover = function(e){
										clearInterval(moveborderinterval);
										Extension.Common.addClass(e.currentTarget, "ext-testinfo-hover");
										Extension.Common.addClass(e.currentTarget.ext_borderelem, "ext-testborder-hover");
										var prop = e.currentTarget.ext_borderelem.ext_prop;
										e.currentTarget.setAttribute("style", "top: " + (prop.posy -40) + "px; left: " + (prop.posx + prop.width - 320 - prop.infodiff) + "px; height: 200px; width: 300px;");
										var inner = e.currentTarget.querySelector(".ext-testinfo-inner");
										if (inner) Extension.Common.addClass(inner, "ext-show");
									};
									var infoelemout = function(e){
										window.moveborderinterval = setInterval(function(){
											Extension.DisplayTimer.PreviewMenu.moveBorders();
										}, 100);
										var inner = e.currentTarget.querySelector(".ext-testinfo-inner");
										if (inner) Extension.Common.removeClass(inner, "ext-show");
										Extension.Common.removeClass(e.currentTarget, "ext-testinfo-hover");
										Extension.Common.removeClass(e.currentTarget.ext_borderelem, "ext-testborder-hover");
										var prop = e.currentTarget.ext_borderelem.ext_prop;
										e.currentTarget.setAttribute("style", "top: " + (prop.posy -40) + "px; left: " + (prop.posx + prop.width - 150 - prop.infodiff) + "px; height: 40px; width: 130px;");
									};
									c.addEvent(elem,"mouseover", elemover);
									c.addEvent(elem,"mouseout", elemout);
									c.addEvent(infoelem,"mouseover", infoelemover);
									c.addEvent(infoelem,"mouseout", infoelemout);
									c.addEvent(infoelem,"click", function(e){
										if (Extension.Common.hasClass(e.currentTarget, "ext-testinfo-hover"))
											infoelemover(e);
										else
											infoelemout(e);
									});
								
								}
							}
						}
					
					} catch (err) {
						console.log("Extension.DisplayTimer.getContent: Err: " + err);
					}
				});
			},
			setLive: function(){
				Extension.Common.setCookie("ext", "on");
				this.submit();
			},
			setPreview: function(){
				Extension.Common.setCookie("ext", "preview");
				this.submit();
			},			
			submit: function() {
				var c = Extension.Common;
				var elem = document.querySelector("#ext-dt-tool");
				if (elem) {
					if (elem.querySelector("#dttf_all").checked) {
						c.setCookie("ext_time", "all");
					} else {
						var settings = {
							year: elem.querySelector("#dttf_year").value,
							month: parseInt(elem.querySelector("#dttf_month").value.replace(/\D+/g, '')) - 1,
							day: elem.querySelector("#dttf_day").value,
							hour: elem.querySelector("#dttf_hour").value,
							minute: elem.querySelector("#dttf_minute").value,
						};
						var dateTime = new Date(settings.year,settings.month,settings.day,settings.hour,settings.minute,0,0);
						c.setCookie("ext_time", dateTime.toISOString());
					}
					if (elem.querySelector("#dttf_inactive").checked) {
						c.setCookie("ext_inactive", "true");
					} else {
						c.setCookie("ext_inactive", "false");
					}
					var loc = {
						country: elem.querySelector("#dttf_country").value,
						region: elem.querySelector("#dttf_region").value,
						city: elem.querySelector("#dttf_city").value
					};
					c.setStorage("ext_location", JSON.stringify(loc));
					location.reload();
				}
			},
			close: function() {
				var c = Extension.Common;
				c.clearCookie("ext_time");
				c.clearCookie("ext_st");
				var url = window.location.href;
				url = url.replace(/[?|&]extdtshow/g, "");
				window.location.href = url;
			},
			setDecimal: function(el, digits) {
				el.value = parseFloat(el.value).toFixed(digits);
			},
			setTwoDigits: function(val) {
				var c = Extension.Common;
				if (c.varExist(val)) {
					if (val < 10)
						return '0' + val;
				}
				return val;
			},
			setElemDigits: function(el, digits) {
				var c = Extension.Common;
				if (c.varExist(el.value)) {
					if (el.value.length < digits)
						el.value = '0' + el.value;
					if (el.value.length > digits)
						el.value = el.value.slice(1, el.value.length - 1);
				}
			},
		}
	}
	
	//*******************************************************************
	var preview = false, js = document.currentScript;
	if (!js) js = document.querySelector("script#ext-preview-script-displaytimer");
	if (js){ if (js.getAttribute("data-preview") == "true") preview = true;} 

	var transfer = {
		objects: [
			{name: "DisplayTimerOld", fn: DisplayTimerOld},
			{name: "DisplayTimerSettings", fn: DisplayTimerSettings},
			{name: "DisplayTimerInjected", fn: DisplayTimerInjected},
			{name: "DisplayTimer", fn: DisplayTimer}
		],
		dependencies: [
			"Product", 
			"ProductList", 
			"ProductFilter", 
			"SimpleTabs", 
			"Swiper"
		],
		bootup: function(){
			Extension.Version.load('extlogs', false, function() {
				var str = ""; if (preview) str = "Preview";
				console.log("Bootup Displaytimer " + str);
			});

			//Set DisplayTimer status
			Extension.DisplayTimer.status = "started";

			//Initiate DisplayTimer
			Extension.Source.load('DisplayTimer DisplayTimerTemplates ~Templates ProductList ProductFilter ProductInfo ExternalLibraries', Extension.Version.forcePreview || Extension.Version.preview, function(data) {

				var c = Extension.Common;
				if (c.varExist(data.texttemplates)) {
					Extension.Template.texttemplates = data.texttemplates;
				}
				Extension.Template.displaytimertemplates = data.displaytimertemplates;
				
				Extension.DisplayTimer.load({
					data: data,
					modules: data.displaytimerdata, 
					
					complete: function(context) {
						var c = Extension.Common;

						//Initiate Simpletabs
						if (c.varExist(Extension.SimpleTabs)) {
							Extension.SimpleTabs.init();
						}
						//Initiate ProductList
						if (c.varExist(Extension.ProductList)) {
							Extension.ProductList.init(data.productlists, function(context, status) {

								//Initiate ProductFilter
								if (c.varExist(Extension.ProductFilter)) {
									//if (status == "started"){
									//    Extension.ProductFilter.init({status: status, productInfo: data.productInfo, productFilters: data.productFilters});
									//}
									if (status == "filled") {
										//Extension.ProductFilter.init({status: status});
										Extension.ProductFilter.init({
											productInfo: data.productInfo,
											productFilters: data.productFilters
										});
									}
								}
								if (status == "filled") {
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


								if (Extension.DisplayTimer.abstatus == "filled")
									Extension.DisplayTimer.abstatus = "completed";

							},context);
						}
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