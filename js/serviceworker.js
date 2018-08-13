/**
 * @file Dead simple LutraChat service worker
 * @author Patrick Godschalk <patrick@kernelpanics.nl>
 * @copyright Patrick Godschalk 2015-2018
 * @license BSD-2-Clause
 */

/*
 * Copyright (c) 2015-2018 Patrick Godschalk All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/serviceworker.js');
  });
}

var version = 'v1::';
var cachedRequests = [
  '/',
  '/browserconfig.xml',
  '/crossdomain.xml',
  '/humans.txt',
  '/index.html',
  '/robots.txt',
  '/site.webmanifest',
  '/sitemap.xml',
  '/assets/mixer.png',
  '/assets/twitch.svg',
  '/css/lutrachat.min.css',
  '/js/helpers.min.js',
  '/js/jquery.min.js',
  '/js/jquery.min.map',
  '/js/mixer.min.js',
  '/js/reconnecting-websocket.min.js',
  '/js/tmi.js.map',
  '/js/tmi.min.js',
  '/js/twitch.min.js',
  '/images/icon/favicon-16x16.png',
  '/images/icon/favicon-32x32.png',
  '/images/icon/favicon-96x96.png',
  '/images/icon/icon-512.png',
  '/images/icon/icon.png',
  '/images/icon/tile.png',
  '/images/icon/tile-wide.png'
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
