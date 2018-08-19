/**
 * @file Common helper functions
 * @author Patrick Godschalk <patrick@kernelpanics.nl>
 * @copyright Patrick Godschalk 2015-2018 - code reused from
 *            git@github.com:crowbartools/Mixer-Chat-Overlay copyright (c) 2016
 *            Firebottle under MIT license, code reused from
 *            git@gist.github.com:6213ff17d3981c861adf copyright (c) 2015
 *            AlcaDesign under MIT license, code reused from
 *            http://stackoverflow.com/a/3410557 copyright (c) 2010 Tim Down
 *            under CC-BY-SA 3.0 license, code reused from
 *            http://stackoverflow.com/a/21196265 copyright (c) 2014 adamesque
 *            under CC-BY-SA 3.0 license, code reused from
 *            git@github.com:component/regexps copyright (c) 2012 tj under MIT
 *            license
 *
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

/**
 * Simplification of jQuery Ajax
 *
 * @param {*} uri
 * @param {*} data
 * @param {*} headers
 * @param {*} method
 * @param {*} cb
 * @param {*} json
 */
function get(uri, data, headers, method, cb, json) {
  return $.ajax({
    url: uri || '',
    data: data || {},
    headers: headers || {},
    type: method || 'GET',
    dataType: json !== true ? json : 'jsonp', // Prefer jsonp
    success: cb || function() {
      console.log('success', arguments);
    },
    error: cb || function() {
      console.log('error', uri, arguments);
    }
  });
}

/**
 * Find occurences of a string
 *
 * @copyright 2010 Tim Down http://stackoverflow.com/a/3410557
 * @license CC-BY-SA-3.0
 * @param {string} searchStr
 * @param {string} str
 * @param {boolean} caseSensitive
 */
function getIndicesOf(searchStr, str, caseSensitive) {
  var startIndex = 0, searchStrLen = searchStr.length;
  var index, indices = [];

  if (!caseSensitive) {
    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }
  return indices;
}

/**
 * Merge array of objects
 *
 * @copyright 2014 adamesque http://stackoverflow.com/a/21196265
 * @license CC-BY-SA-3.0
 * @param {*} roles
 */
function do_merge(roles) {
  var merger = function(a, b) {
    if (_.isObject(a)) {
      return _.extend({}, a, b, merger);
    } else {
      return a || b;
    }
  };
  var args = _.flatten([{}, roles, merger]);
  return _.extend.apply(_, args);
}

/**
 * Detects and converts links into HTML anchor elements. Will always return
 * HTTPS since plain text HTTP is deprecated.
 *
 * @copyright 2012 tj https://github.com/component/regexps/blob/master/index.js
 * @license MIT
 * @param {string} text
 */
function linkify(text) {
  var exp = /^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/i;
  return text.replace(exp, '<a type=\'text/html\' href=\'https://$1\' rel=\'external noopener\' target=\'_blank\'>$1</a>');
}

// Set a background colour to a CSS colour string if defined.
$('body').css({ 'background-color': getUrlParameter('bgcolor') });
