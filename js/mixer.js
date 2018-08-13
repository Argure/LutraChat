/**
 * @file Mixer chat handler
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

// Get User ID
var username = getUrlParameter('username');

$.ajax({
  url: 'https://Mixer.com/api/v1/channels/' + username,
  type: 'GET',
  dataType: 'json',
  beforeSend: setHeader,
  success: function(data) {
    userID = data.id;
    userPartner = data.partnered;
    if (userPartner === true){
      subIcon = data.badge.url;
    } else {
      subIcon = '';
    }

    // Get our chat endpoints and connect to one.
    $.ajax({
      url: 'https://Mixer.com/api/v1/chats/' + userID,
      type: 'GET',
      dataType: 'json',
      beforeSend: setHeader,
      success: function(data) {
        var endpoints = data.endpoints;
        mixerSocketConnect(endpoints);
      }
    });
  }
});

// General settings
var chatTime = getUrlParameter('timer');
timeToShowChat = chatTime; // in Milliseconds

// Connect to Mixer websocket
function mixerSocketConnect(endpoints) {

  if ('WebSocket' in window) {
    // Open a web socket
    var randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    var ws = new ReconnectingWebSocket(randomEndpoint);
    console.log('Connected to ' + randomEndpoint);

    ws.onopen = function() {
      // Websocket is connected, send data using send()
      var connector = JSON.stringify({
        type: 'method',
        method: 'auth',
        arguments: [userID],
        id: 1
      });
      ws.send(connector);
      console.log('Connection Opened...');

      $('<div class=\'chatmessage\' id=\'1\'>Mixer chat connection established to ' + username + '.</div>').appendTo('.chat').hide().fadeIn('fast').delay(5000).fadeOut('fast', function() {
        $(this).remove();
      });

      // Error handling and keepalive
      setInterval(function() {
        errorHandle(ws);
      }, 10000);
    };

    ws.onmessage = function (evt) {
      chat(evt);
      // Debug - Log all chat events.
      //console.log(evt);
    };

    ws.onclose = function(){
      // Websocket is closed
      console.log('Connection is closed...');
    };

  } else {
    // The browser doesn't support Websockets
    console.error('Woah, something broke. Abandon ship!');
  }
}

// Chat messages
function chat(evt){
  var evtString = $.parseJSON(evt.data);
  var eventType = evtString.event;
  var eventMessage = evtString.data;

  if (eventType == 'ChatMessage') {
    var username = eventMessage.user_name;
    var userrolesSrc = eventMessage.user_roles;
    var userroles = userrolesSrc.toString().replace(/,/g, ' ');
    var usermessage = eventMessage.message.message;
    var messageID = eventMessage.id;
    var completeMessage = '';

    $.each(usermessage, function() {
      var type = this.type;

      if (type == 'text'){
        var messageTextOrig = this.data;
        var messageText = messageTextOrig.replace(/([<>&])/g, function(chr) {
          return chr === '<' ? '&lt;' : chr === '>' ? '&gt;' : '&amp;';
        });
        completeMessage += messageText;
      } else if (type == 'emoticon') {
        var emoticonSource = this.source;
        var emoticonPack = this.pack;
        var emoticonCoordX = this.coords.x;
        var emoticonCoordY = this.coords.y;
        if (emoticonSource == 'builtin'){
          completeMessage += '<div class="emoticon" style="background-image: url(https://Mixer.com/_latest/emoticons/' + emoticonPack + '.png); background-position: -' + emoticonCoordX + 'px -' + emoticonCoordY + 'px; height: 24px; width: 24px; display: inline-block;"></div>';
        } else if (emoticonSource == 'external'){
          completeMessage += '<div class="emoticon" style="background-image: url(' + emoticonPack + '); background-position: -' + emoticonCoordX + 'px -' + emoticonCoordY+'px; height: 24px; width: 24px; display: inline-block;"></div>';
        }
      } else if (type == 'link') {
        var chatLinkOrig = this.text;
        var chatLink = chatLinkOrig.replace(/(<([^>]+)>)/ig, '');
        completeMessage += chatLink;
      } else if (type == 'tag') {
        var userTag = this.text;
        completeMessage += userTag;
      }
    });

    // Place the completed chat message into the chat area.
    // Fade message in, wait X time, fade out, then remove.

    // Ignore self for temporary LutraBot workaround
    if (username == 'superlisa') {
      return;
    } else {
      if (timeToShowChat === '0'){
        $('<div class=\'chatmessage mixer\' id=\'' + messageID + '\'><div class=\'chatusername ' + userroles + '\'>' + username + ' <div class=\'badge\'><img src=' + subIcon + '></div></div> ' + completeMessage+'</div>').appendTo('.chat');
      } else {
        $('<div class=\'chatmessage mixer\' id=\'' + messageID + '\'><div class=\'chatusername ' + userroles + '\'>' + username + ' <div class=\'badge\'><img src=' + subIcon + '></div></div> ' + completeMessage+'</div>').appendTo('.chat').hide().fadeIn('fast').delay(timeToShowChat).fadeOut('fast', function() {
          $(this).remove();
        });
      }
    }

  } else if (eventType == 'ClearMessages') {
    // If someone clears chat, then clear all messages on screen.
    $('.chatmessage').remove();
  } else if (eventType == 'DeleteMessage') {
    // If someone deletes a message, delete it from screen.
    $('#' + eventMessage.id).remove();
  }
}

// Error handling and keepalive
function errorHandle(ws) {
  var wsState = ws.readyState;

  if (wsState !== 1) {
    // Connection not open
    console.log('Ready state is '+wsState);
  } else {
    // Connection open, send keepalive.
    ws.send('{"type": "method", "method": "ping", "arguments": [], "id": 12}');
  }
}
