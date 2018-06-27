//////////////////////////////
/* Functional Videos script */
/*     Updated 26/04/2018   */
/*  jelmer.timmer@ikea.com  */
//////////////////////////////

//For use with Iplugins
(function () {
    "use strict";
    //Check ready state
    function ready(fn) {
        if (document.attachEvent ? document.readyState == 'complete' : document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }
    // This is the function which will load our videos onto the page
    function insertThumb() {
        // Loads play icon overlay for thumbnails
        var playIcon = "https://mmapi.ikea.com/player/ikea/img-btn/play_60px_2x.png";
        // Open video list
        var request = new XMLHttpRequest();
        request.open("GET", "https://mmapi.ikea.com/retail/motionmedia/v1/item", true);
        request.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                var videoList = JSON.parse(this.response);
                var productImage = document.getElementById("productImg");
                // Extract video list from array
                videoList.forEach(function (index, i) {
                    // Match meta data to video list and prevent function rom running if not on a PIP
                    if ((!document.head.querySelector("[name=partnumber]") == false) && (document.head.querySelector("[name=partnumber]").content.indexOf(index.item_number) > -1)) {
                        // Set variable containing the videos
                        var sourceUrl = "https://mmapi.ikea.com/embed/?item_number=" + index.item_number + "&jsapi=1";
                        // Set variables to get the images
                        var imgSrc = "https://mmapi.ikea.com/retail/motionmedia/v1/item/" + index.item_number + "?dataset=images";
                        var imgRequest = new XMLHttpRequest();
                        imgRequest.open("GET", imgSrc, true);

                        imgRequest.onload = function () {
                            if (this.status >= 200 && this.status < 400) {
                                var imageSource = JSON.parse(this.response);
                                // s3 selects the size for the thumbnail
                                var imgURL = imageSource.s3;
                                // Create a container for the thumbnail and import a play icon for the video
                                var imageThumb = document.getElementById("imageThumb_0");
                                var videoContainer = '<div class="imageThumb videoDiv_1" id="videoDiv_1">' +
                                '<a href="javascript:void(0);" id="videoThumb_1">' +
                                '<img class="videoThumb" src="' + playIcon + '" onclick="irwStatThumbImgClickedFromPIP();" onmouseover="addOpacityEffect(this.id);" onmouseout="rmvOpacityEffect(this.id);" id="videoThumb_1">' +
                                    "</a>" +
                                    "</div>";
                                if (imageThumb == undefined) {
                                    var thumbContainer = document.getElementById("imgThumbContainer");
                                    var thumbnailImage = productImage.src.replace("S4", "S3");
                                    var firstThumbnail = '<div class="imageThumb firstThumbnail active" id="imageThumb_0">' +
                                    '<a href="javascript:void(0);" id="imageThumbLink_0">' +
                                    '<img class="firstThumb active" src="' + thumbnailImage + '"  onclick="irwStatThumbImgClickedFromPIP();" onmouseover="addOpacityEffect(this.id);" onmouseout="rmvOpacityEffect(this.id);" id="imgID_0" style="opacity: 10; height:110px; width:110px;">' +
                                    '</a>' +
                                    '</div>';
                                    thumbContainer.innerHTML = firstThumbnail  + videoContainer;
                                    document.getElementById("imgThumbContainer").style.height = "119px";
                                    document.getElementsByClassName("buttonBar")[0].style.visibility = "visible";
                                } else if (imageThumb != undefined) {
                                    imageThumb.insertAdjacentHTML("afterend", videoContainer);
                                }
                                // This uses the first product thumb as a background for our video thumbnail, the result: the first product thumbnail with a play icon overlay
                                var videoDiv = document.getElementById("videoDiv_1");
                                var videoThumbnail = document.getElementById("videoThumb_1");
                                document.getElementById("videoDiv_1").style.backgroundImage = "url(" + imgURL + "?imPolicy=thumbnail)";
                                videoDiv.style.backgroundSize = "90%";
                                videoDiv.style.backgroundPosition = "center center";
                                videoDiv.style.backgroundRepeat = "no-repeat";

                                // Some specific rules to center the icon for IE and EDGE
                                var videoThumb = document.getElementsByClassName("videoThumb")[0];
                                if (navigator.userAgent.indexOf("MSIE") > -1 || navigator.userAgent.indexOf("Trident") > -1) {
                                    videoThumb.style.height = "50%";
                                    videoThumb.style.paddingTop = "30px";
                                    videoThumb.style.width = "50%";
                                } else {
                                    // If we're using any other browser we can just use the object fit CSS function to center the object
                                    videoThumb.style.objectFit = "contain";
                                }
                                // Add a container with an iframe for the selected video, hidden by default until the thumb is clicked.
                                productImage.insertAdjacentHTML("afterend", '<iframe id="productVideo" frameborder="0"  width="560px" height="315px" allowfullscreen="" src="' + sourceUrl + '"></iframe>');
                                // Make the product image invisible and the video visible if the video thumbnail is clicked
                                var productVideo = document.getElementById("productVideo");
                                videoThumbnail.addEventListener("click", function () {
                                    productVideo.style.display = "inline";
                                    videoDiv.style.borderColor = "#3399fb";
                                    productImage.style.display = "none";
                                    var frameWindow = document.getElementById("productVideo").contentWindow;
                                    frameWindow.postMessage("play", "*");
                                    if (document.getElementsByClassName('firstThumb')[0] != undefined) {
                                        var thumbNode = document.getElementsByClassName('firstThumb')[0];
                                        thumbNode.classList.remove("active");
                                    } else {
                                        var activeClass = document.querySelector("a.active");
                                        activeClass.classList.remove("active");
                                    }
                                });
                                // Hide the video again and re-show the image after any other thumbnail is clicked
                                var imageThumbnails = document.querySelectorAll("[id^='imageThumb_']");
                                imageThumbnails.forEach( function (arrayItem) {
                                    arrayItem.addEventListener("click", function () {
                                        productVideo.style.display = "none";
                                        videoDiv.style.borderColor = "#eee";
                                        productImage.style.display = "inline";
                                        var frameWindow = document.getElementById("productVideo").contentWindow;
                                        frameWindow.postMessage("pause", "*");
                                        if (document.getElementsByClassName('firstThumb')[0] != undefined) {
                                            var thumbNode = document.getElementsByClassName('firstThumb')[0];
                                            thumbNode.classList.add("active");
                                        }
                                    });

                                    var active = document.getElementsByClassName("link-title");
                                    for (var i = 0; i < active.length; i++) {
                                        active[i].addEventListener('click', updateThumbLocation);
                                    }
                                });
                            } else {
                                console.log("Something went wrong:", this.status);
                            }

                            imgRequest.onerror = function () {
                                console.log(imgRequest.status);
                            };
                        };
                        imgRequest.send();
                    }
                });
            }
        };
        request.send();
    }

    var remove = function (element) {
            element.parentNode.removeChild(element) || element.srcElement.removeChild(element);
    };

    var updateThumbLocation = function () {
        remove(document.getElementById("videoDiv_1"));
        remove(document.getElementById("productVideo"));
        insertThumb();
        var productImage = document.getElementById("productImg");
        productImage.style.display = 'inline';
    };

    ready(insertThumb);
    window.addEventListener('hashchange', updateThumbLocation);

})();