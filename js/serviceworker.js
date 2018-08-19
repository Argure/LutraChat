/**
 * @file Dead simple LutraChat service worker
 * @author Patrick Godschalk <patrick@kernelpanics.nl>
 * @copyright Patrick Godschalk 2015-2018 - code reused from
 *            git@github.com:crowbartools/Mixer-Chat-Overlay copyright (c) 2016
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceworker.js');
}

var version = 'v1::';
var cachedRequests = [
  './',
  './browserconfig.xml',
  './crossdomain.xml',
  './humans.txt',
  './index.html',
  './robots.txt',
  './site.webmanifest',
  './sitemap.xml',
  './assets/mixer.png',
  './assets/twitch.svg',
  './css/lutrachat.min.css',
  './js/helpers.min.js',
  './js/jquery.min.js',
  './js/jquery.min.map',
  './js/mixer.min.js',
  './js/reconnecting-websocket.min.js',
  './js/tmi.js.map',
  './js/tmi.min.js',
  './js/twitch.min.js',
  './assets/apple-touch-icon.png',
  './assets/icon-16x16.png',
  './assets/icon-32x32.png',
  './assets/icon-96x96.png',
  './assets/icon-192x192.png',
  './assets/icon.png',
  './assets/tile.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(version + 'fundamentals').then(function(cache) {
    return cache.addAll(cachedRequests);
  }));
});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    if (response) {
      return response;
    }

    var fetchRequest = event.request.clone();

    return fetch(fetchRequest).then(function(response) {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      var responseToCache = response.clone();

      caches.open(version + 'pages').then(function(cache) {
        cache.put(event.request, responseToCache);
      });

      return response;
    });
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.map(function(cacheName) {
      return caches.delete(cacheName);
    }));
  }));
});
