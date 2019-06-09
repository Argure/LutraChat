/**
 * @file Mixer chat handler
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

// Get User ID
var username = getUrlParameter('username');
var ascensionLevels;

$.ajax({
  url: 'https://mixer.com/api/v1/ascension/levels',
  type: 'GET',
  dataType: 'json',
  beforeSend: setHeader,
  success: function(data) {
    ascensionLevels = data.levels;
  }
});

$.ajax({
  url: 'https://Mixer.com/api/v1/channels/' + username,
  type: 'GET',
  dataType: 'json',
  beforeSend: setHeader,
  success: function(data) {
    userID = data.id;
    userPartner = data.partnered;
    if (userPartner === true) {
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

/**
 * Connect to Mixer websocket
 *
 * @param {*} endpoints
 */
function mixerSocketConnect(endpoints) {
  if ('WebSocket' in window) {
    // Open a websocket
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
      console.log('Connection opened...');

      if (timeToShowChat === '0') {
        $('<div class=\'chat__message chat__message--mixer\' id=\'1\'>Mixer chat connection established to ' + username + '.</div>').appendTo('.chat');
      } else {
        $('<div class=\'chat__message chat__message--mixer\' id=\'1\'>Mixer chat connection established to ' + username + '.</div>').appendTo('.chat').hide().fadeIn('fast').delay(timeToShowChat).fadeOut('fast', function() {
          $(this).remove();
        });
      }

      // Error handling and keepalive
      setInterval(function() {
        errorHandle(ws);
      }, 10000);
    };

    ws.onmessage = function(evt) {
      chat(evt);
      // Debug - Log all chat events.
      console.log(evt);
    };

    ws.onclose = function() {
      // Websocket is closed
      console.log('Connection is closed...');
    };

  } else {
    // The browser doesn't support websockets
    console.error('Woah, something broke. Abandon ship!');
  }
}

/**
 * Application logic for all Mixer events. Called chat for brevity, but also
 * handles chat mutations e.g. moderation events.
 *
 * @param {Object} evt JSON object from Mixer websocket
 */
function chat(evt) {
  var evtString = $.parseJSON(evt.data);
  var eventType = evtString.event;
  var eventMessage = evtString.data;

  if (eventType == 'ChatMessage') {
    var username = eventMessage.user_name;
    var userlevel = eventMessage.user_ascension_level;
    var userlevelColor = ascensionLevels[eventMessage.user_ascension_level].color;
    var userlevelImage = ascensionLevels[eventMessage.user_ascension_level].assetsUrl.replace('{variant}', 'cutout.png');

    var userrolesSrc = eventMessage.user_roles;
    var userroles = userrolesSrc.toString().replace(/,/g, ' ');
    var usermessage = eventMessage.message.message;
    var messageID = eventMessage.id;
    var completeMessage = '';
    var action = '';
    if(eventMessage.message.meta.me) action = 'chat__message--action';
    if(eventMessage.message.meta.is_skill) action = 'chat__message--sticker';

    $.each(usermessage, function() {
      var type = this.type;

      if (type == 'text') {
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
        if (emoticonSource == 'builtin') {
          completeMessage += '<div class="emoticon emoticon--mixer" style="background-image: url(https://Mixer.com/_latest/emoticons/' + emoticonPack + '.png); background-position: -' + emoticonCoordX + 'px -' + emoticonCoordY + 'px; height: 24px; width: 24px; display: inline-block;"></div>';
        } else if (emoticonSource == 'external') {
          completeMessage += '<div class="emoticon emoticon--mixer" style="background-image: url(' + emoticonPack + '); background-position: -' + emoticonCoordX + 'px -' + emoticonCoordY+'px; height: 24px; width: 24px; display: inline-block;"></div>';
        }
      } else if (type == 'link') {
        var chatLinkOrig = this.text;
        var chatLink = chatLinkOrig.replace(/(<([^>]+)>)/ig, '');
        completeMessage += chatLink;
      } else if (type == 'tag') {
        var userTag = this.text;
        completeMessage += userTag;
      } else if (type == 'image') {
        var stickerName = this.text;
        var stickerSource = this.url;
        var stickerCost = eventMessage.message.meta.skill.cost;
        var stickerCurrency;
        if (eventMessage.message.meta.skill.currency == 'Sparks') {
          stickerCurrency = '<img class="currency currency--sparks" src="assets/sparks.png" alt="Sparks">';
        } else {
          stickerCurrency = '<img class="currency currency--embers" src="https://mixer.com/_static/img/design/ui/embers/ember_20.png" alt="Embers">';
        }
        completeMessage += 'used sticker: <strong>' + stickerName + '</strong> (' + stickerCurrency + ' ' + stickerCost + ')<br><img src="' + stickerSource + '" alt="' + stickerName + '">';
      }
    });

    // Place the completed chat message into the chat area.
    // Fade message in, wait X time, fade out, then remove.
    if (completeMessage.endsWith('[T]')) {
      return;
    } else {
      if (timeToShowChat === '0') {
        $('<div class=\'chat__message chat__message--mixer ' + eventMessage.user_id + ' ' + action + '\' id=\'' + messageID + '\'><div class=\'chat__message__username chat__message__username--' + userroles + '\'>' + username + ' <div class=\'badges\'><img class=\'badges__badge--mixer\' src=' + subIcon + '></div><div class="badges__ascensionlevel" style="background-color: ' + userlevelColor + ';"><img src="' + userlevelImage + '" alt="">' + userlevel + '</div></div> ' + completeMessage + '</div>').appendTo('.chat');
      } else {
        $('<div class=\'chat__message chat__message--mixer ' + eventMessage.user_id + ' ' + action + '\' id=\'' + messageID + '\'><div class=\'chat__message__username chat__message__username--' + userroles + '\'>' + username + ' <div class=\'badges\'><img class=\'badges__badge--mixer\' src=' + subIcon + '></div><div class="badges__ascensionlevel" style="background-color: ' + userlevelColor + ';"><img src="' + userlevelImage + '" alt="">' + userlevel + '</div></div> ' + completeMessage + '</div>').appendTo('.chat').hide().fadeIn('fast').delay(timeToShowChat).fadeOut('fast', function() {
          $(this).remove();
        });
      }
    }

  } else if (eventType == 'SkillAttribution') {
    var username = eventMessage.user_name;
    var userrolesSrc = eventMessage.user_roles;
    var userroles = userrolesSrc.toString().replace(/,/g, ' ');
    var messageID = eventMessage.id;
    var eventSource = eventMessage.skill.icon_url;
    var eventName = eventMessage.skill.skill_name;
    var eventCost = eventMessage.skill.cost;
    var eventCurrency;
    if (eventMessage.skill.currency == 'Sparks') {
      eventCurrency = '<img class="currency currency--sparks" src="assets/sparks.png" alt="Sparks">';
    } else {
      eventCurrency = '<img class="currency currency--embers" src="https://mixer.com/_static/img/design/ui/embers/ember_20.png" alt="Embers">';
    }
    var completeMessage = 'used skill: <strong>' + eventName + '</strong> (' + eventCurrency + ' ' + eventCost + ')<br><img src="' + eventSource + '" alt="' + eventName + '">';

    if (timeToShowChat === '0') {
      $('<div class=\'chat__message chat__message--mixer chat__message--skill ' + eventMessage.user_id + '\' id=\'' + messageID + '\'><div class=\'chat__message__username chat__message__username--' + userroles + '\'>' + username + ' <div class=\'badges\'><img class=\'badges__badge--mixer\' src=' + subIcon + '></div></div> ' + completeMessage + '</div>').appendTo('.chat');
    } else {
      $('<div class=\'chat__message chat__message--mixer chat__message--skill ' + eventMessage.user_id + '\' id=\'' + messageID + '\'><div class=\'chat__message__username chat__message__username--' + userroles + '\'>' + username + ' <div class=\'badges\'><img class=\'badges__badge--mixer\' src=' + subIcon + '></div></div> ' + completeMessage + '</div>').appendTo('.chat').hide().fadeIn('fast').delay(timeToShowChat).fadeOut('fast', function() {
        $(this).remove();
      });
    }

  } else if (eventType == 'ClearMessages') {
    // If someone clears chat, then clear all messages on screen.
    $('.chat__message').remove();
  } else if (eventType == 'DeleteMessage') {
    // If someone deletes a message, delete it from screen.
    $('#' + eventMessage.id).remove();
  } else if (eventType == 'PurgeMessage') {
    $('.' + eventMessage.user_id).remove();
  }
}

/**
 * Error handling and keepalive
 *
 * @param {Object} ws
 */
function errorHandle(ws) {
  var wsState = ws.readyState;

  if (wsState !== 1) {
    // Connection not open
    console.log('Ready state is ' + wsState);
  } else {
    // Connection open, send keepalive.
    ws.send('{"type": "method", "method": "ping", "arguments": [], "id": 12}');
  }
}
