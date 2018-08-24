/**
 * @file Common helper functions
 * @author Patrick Godschalk <patrick@kernelpanics.nl>
 * @copyright Patrick Godschalk 2015-2018 - code reused from
 *            git@github.com:crowbartools/Mixer-Chat-Overlay copyright (c) 2016
 *            Firebottle under MIT license
 * @license MIT
 */

/*
 * Copyright (c) 2018 Patrick Godschalk
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)), sURLVariables = sPageURL.split('&'), sParameterName, i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
};

/**
 * Sets a Client-ID request header with the OAuth key.
 *
 * @param {*} xhr
 */
function setHeader(xhr) {
  xhr.setRequestHeader('Client-ID', 'gdswj1g5j9qq52avv4dvm27gf4t3mc'); //DevSkim: ignore DS173237
}

// Timer for removing chat messages
var chatTime = getUrlParameter('timer');
if (chatTime) {
  timeToShowChat = chatTime; // in milliseconds
} else {
  timeToShowChat = '0';
}

// Set a background colour to a CSS colour string if defined.
$('body').css({ 'background-color': getUrlParameter('bgcolor') });
