/**
 * @file Twitch chat handler
 * @author Patrick Godschalk <patrick@kernelpanics.nl>
 * @copyright Patrick Godschalk 2015-2018 - code reused from
 *            git@gist.github.com:742d8cb82e3e93ad4205.git and
 *            git@gist.github.com:6213ff17d3981c861adf copyright (c) 2015-2016
 *            AlcaDesign under MIT license
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

// Get username
var username = getUrlParameter('username');

// Twitch chat handler configuration
var channels = [username],
  fadeDelay = 5000,    //?
  showChannel = false, // Show channel name in message
  useColor = true,     // Use coloured usernames
  showBadges = true,   // Show badges before username
  showEmotes = true,   // Show Twitch emotes
  doTimeouts = true,   // Timeouts also affect LutraChat
  doChatClears = true, // Clear chats also affect LutraChat
  showHosting = false, // Show notice when hosting
  showConnectionNotices = false; // Show notice when user joins or leaves

// Emotes configuration
var twitchEmotes = {
    urlTemplate: 'https://static-cdn.jtvnw.net/emoticons/v1/{{id}}/{{image}}',
    scales: { 1: '1.0', 2: '2.0', 3: '3.0' }
  },
  bttvEmotes = {
    urlTemplate: 'https://cdn.betterttv.net/emote/{{id}}/{{image}}',
    scales: { 1: '1x', 2: '2x', 3: '3x' },
    bots: [],
    emoteCodeList: [],
    emotes: [],
    subEmotesCodeList: [],
    allowEmotesAnyChannel: false
  },
  emoteScale = 3;

// TMI.js configuration
var defaultColors = ['rgb(255, 0, 0)',
    'rgb(0, 0, 255)',
    'rgb(0, 128, 0)',
    'rgb(178, 34, 34)',
    'rgb(255, 127, 80)',
    'rgb(154, 205, 50)',
    'rgb(255, 69, 0)',
    'rgb(46, 139, 87)',
    'rgb(218, 165, 32)',
    'rgb(210, 105, 30)',
    'rgb(95, 158, 160)',
    'rgb(30, 144, 255)',
    'rgb(255, 105, 180)',
    'rgb(138, 43, 226)',
    'rgb(0, 255, 127)'],
  randomColorsChosen = {},
  clientOptions = {
    options: {
      debug: false
    },
    connection: {
      reconnect: true,
      secure: true
    },
    channels: channels
  },
  client = new tmi.client(clientOptions);



/**
 * Removes leading IRC channel pound symbol (#)
 *
 * @param {string} channel Channel name
 * @return {string} Channel name stripped of leading #
 */
function dehash(channel) {
  return channel.replace(/^#/, '');
}

/**
 * Changes first character of parameter n to uppercase.
 *
 * @param {string} n String to capitalize
 * @return {string} String with first character in uppercase
 */
function capitalize(n) {
  return n[0].toUpperCase() +  n.substr(1);
}

/**
 * Parsing special characters to HTML entities.
 *
 * @param {string} html Some HTML to process
 * @return {string} HTML with special characters escaped.
 */
function htmlEntities(html) {
  function it() {
    return html.map(function(n, i, arr) {
      if (n.length == 1) {
        return n.replace(/[\u00A0-\u9999<>&]/gim, function(i) {
          return '&#' + i.charCodeAt(0) + ';';
        });
      }
      return n;
    });
  }

  var isArray = Array.isArray(html);
  if (!isArray) {
    html = html.split('');
  }
  html = it(html);
  if (!isArray) html = html.join('');
  return html;
}

/**
 * Parse cleartext to corresponding Twitch emote.
 *
 * @param {string} text Some text to parse
 * @param {Object} emotes Part of the Twitch userstate object that contains the
 *                        emotes 'owned' by that user.
 * @param {string} channel
 * @return {string} Text with emotes parsed as image elements
 */
function formatEmotes(text, emotes, channel) {
  emotes = _.extend(emotes || {}, do_merge(bttvEmotes.emoteCodeList.map(function(n) {
    var indices = getIndicesOf(n, text, true),
      indMap = indices.map(function(m) {
        return [m, m + n.length - 1].join('-'); // Create indices
      });
    var obj = {};
    obj[n] = indMap;
    return indMap.lenth === 0 ? null : obj;
  })));

  var splitText = text.split(''); // Separate into characters

  for (var i in emotes) {
    var e = emotes[i]; // An emote

    for (var j in e) {
      var mote = e[j]; // Indices of this emote's instance

      // Make sure we're only getting the indices and not array methods, etc.
      if (typeof mote == 'string') {
        mote = mote.split('-'); // Split indices
        mote = [parseInt(mote[0]), parseInt(mote[1])]; // Parse to integers
        var length = mote[1] - mote[0], // Get emote length
          emote = text.substr(mote[0], length + 1), // Get emote text
          empty = Array.apply(null, new Array(length + 1)).map(function() {
            return '';
          });

        // If it's a BTTV emote that is allowed to be used, this will still be
        // true, otherwise true for Twitch emotes
        var permToReplace = true,
          options = { // Emote image options (Twitch by default)
            template: twitchEmotes.urlTemplate, // Use this URL template
            id: i, // Use this image ID
            image: twitchEmotes.scales[emoteScale] // Image scale
          };

        if (bttvEmotes.emoteCodeList.indexOf(emote) > -1) { // Set BTTV options
          var bttvEmote = _.findWhere(bttvEmotes.emotes, { code: emote });
          // Restricted to a channel, but not this oen
          if (bttvEmote.restrictions.channels.length > 0 && bttvEmote.restrictions.channels.indexOf(channel.replace(/^#/, '')) == -1) {
            permToReplace = false;
          }
          options.template = bttvEmotes.urlTemplate;
          options.id = bttvEmote.id;
          options.image = bttvEmotes.scales[emoteScale];
        }

        if (permToReplace || bttvEmotes.allowEmotesAnyChannel) {
          var html = '<img class=\'emoticon\' emote=\'' + emote + '\' src=\'' + options.template.replace('{{id}}', options.id).replace('{{image}}', options.image) + '\'>';

          // Replace emote indices with empty spaces.
          splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));

          // Insert emote HTML
          splitText.splice(mote[0], 1, html);
        }
      }
    }
  }
  return htmlEntities(splitText).join('');
}

/**
 *
 * @param {*} data
 * @param {*} channel
 */
function mergeBTTVEmotes(data, channel) {
  bttvEmotes.emotes = bttvEmotes.emotes.concat(data.emotes.map(function(n) {
    if (!_.has(n, 'restrictions')) {
      n.restrictions = {
        channels: [],
        games: []
      };
    }
    if (n.restrictions.channels.indexOf(channel) == -1) {
      n.restrictions.channels.push(channel);
    }
    return n;
  }));

  bttvEmotes.bots = bttvEmotes.bots.concat(data.bots.map(function(n) {
    return {
      name: n,
      channel: channel
    };
  }));
}

var asyncCalls = [get('https://api.betterttv.net/2/emotes', {}, { Accept: 'application/json' }, 'GET', function(data) {
  bttvEmotes.emotes = bttvEmotes.emotes.concat(data.emotes.map(function(n) {
    n.global = true;
    return n;
  }));
  bttvEmotes.subEmotesCodeList = _.chain(bttvEmotes.emotes).where({ global: true }).reject(function(n) {
    return _.isNull(n.channel);
  }).pluck('code').value();
}, false)];

/**
 *
 * @param {*} channel
 */
function addAsyncCall(channel) {
  asyncCalls.push(get('https://api.betterttv.net/2/channels/' + dehash(channel), {}, { Accept: 'application/json'}, 'GET', function(data) {
    mergeBTTVEmotes(data, channel);
  }), false);
}

/**
 * Checks the Twitch userstate object to determine badges to aassociate with
 * that user.
 *
 * @param {string} chan
 * @param {string} user
 * @param {boolean} isBot Whether username is registered with BTTV as a channel
 *                        bot.
 * @return {string} CSS classes with associated badge names.
 */
function badges(chan, user, isBot) {
  function createBadge(name) {
    var badge = document.createElement('div');
    badge.className = 'chat-badge-' + name;
    return badge;
  }

  var chatBadges = document.createElement('span');
  chatBadges.className = 'chat-badges';

  if (!isBot) {
    if (user.username == chan) {
      chatBadges.appendChild(createBadge('broadcaster'));
    }
    if (user['user-type']) {
      chatBadges.appendChild(createBadge(user['user-type']));
    }
    if (user.turbo) {
      chatBadges.appendChild(createBadge('turbo'));
    }
  } else {
    chatBadges.appendChild(createBadge('bot'));
  }

  return chatBadges;
}



/**
 * Application logic for chat messages (PRIVMSG, ACTION, etc.) Takes an IRC
 * message from TMI.js and prints to a HTML div object structure to document.
 *
 * @param {*} channel
 * @param {*} user
 * @param {*} message
 * @param {*} self
 */
function handleChat(channel, user, message, self) {
  var chan = dehash(channel),
    name = user.username,
    chatLine = document.createElement('div'),
    chatChannel = document.createElement('span'),
    chatName = document.createElement('span'),
    chatColon = document.createElement('span'),
    chatMessage = document.createElement('span');

  var color = useColor ? user.color : 'inherit';

  // Set a colour for the user.
  if (color === null) {
    if (!randomColorsChosen.hasOwnProperty(chan)) {
      randomColorsChosen[chan] = {};
    }
    if (randomColorsChosen[chan].hasOwnProperty(name)) {
      color = randomColorsChosen[chan][name];
    }
    else {
      color = defaultColors[Math.floor(Math.random() * defaultColors.length)];
      randomColorsChosen[chan][name] = color;
    }
  }

  chatLine.className = 'chat-line';
  chatLine.dataset.username = name;
  chatLine.dataset.channel = channel;

  // Handle ACTION messages, i.e. the /me command.
  if (user['message-type'] == 'action') {
    chatLine.className += ' chat-action';
  }

  chatChannel.className = 'chat-channel';
  chatChannel.innerHTML = chan;

  chatName.className = 'chat-name';
  chatName.style.color = color;
  chatName.innerHTML = user['display-name'] || name;

  chatColon.className = 'chat-colon';

  chatMessage.className = 'chat-message';

  chatMessage.style.color = color;
  chatMessage.innerHTML = linkify(showEmotes ? formatEmotes(message, user.emotes, channel)
    : htmlEntities(message));

  if (client.opts.channels.length > 1 && showChannel) {
    chatLine.appendChild(chatChannel);
  }
  if(showBadges) chatLine.appendChild(badges(chan, user, self));
  chatLine.appendChild(chatName);
  chatLine.appendChild(chatColon);
  chatLine.appendChild(chatMessage);

  // This really needs to be done in a better way but for now this is how the
  // relay bot is ignored.
  if (user.username == 'lutrabot') {
    return;
  } else {
    if (timeToShowChat === '0') {
      $('<div class=\'chatmessage twitch ' +  user.username + '\'>'
        + chatLine.outerHTML +
        '</div>').appendTo('.chat');
    } else {
      $('<div class=\'chatmessage twitch ' +  user.username + '\'>'
        + chatLine.outerHTML +
        '</div>').appendTo('.chat').hide().fadeIn('fast').delay(timeToShowChat)
        .fadeOut('fast', function() {
          $(this).remove();
        });
    }
  }

  if (typeof fadeDelay == 'number') {
    setTimeout(function() { //DevSkim: reviewed DS172411
      chatLine.dataset.faded = '';
    }, fadeDelay);
  }
}

/**
 * Application logic for server notices.
 *
 * @param {string} information
 * @param {string} noticeFadeDelay
 * @param {string} level
 * @param {string} additionalClasses
 * @return {string} HTML div element containing server notice
 */
function chatNotice(information, noticeFadeDelay, level, additionalClasses) {
  var ele = document.createElement('div');

  ele.className = 'chat-line chat-notice';
  ele.innerHTML = information;

  if (additionalClasses !== undefined) {
    if (Array.isArray(additionalClasses)) {
      additionalClasses = additionalClasses.join(' ');
    }
    ele.className += ' ' + additionalClasses;
  }

  if (typeof level == 'number' && level != 0) {
    ele.dataset.level = level;
  }

  $('<div class=\'chatmessage\'>'
      + ele.outerHTML +
    '</div>').appendTo('.chat').hide().fadeIn('fast').delay(5000)
    .fadeOut('fast', function() {
      $(this).remove();
    });

  if (typeof noticeFadeDelay == 'number') {
    setTimeout(function() { //DevSkim: reviewed DS172411
      ele.dataset.faded = '';
    }, noticeFadeDelay || 500);
  }

  return ele;
}

var recentTimeouts = {};

/**
 * Application logic for timeout events, purges all messages from that user
 * from the document.
 *
 * @param {string} channel
 * @param {string} username
 */
function timeout(channel, username) {
  if(!doTimeouts) return false;

  if (!recentTimeouts.hasOwnProperty(channel)) {
    recentTimeouts[channel] = {};
  }
  if (!recentTimeouts[channel].hasOwnProperty(username) || recentTimeouts[channel][username] + 1000*10 < +new Date) {
    recentTimeouts[channel][username] = +new Date;
    chatNotice(capitalize(username) + ' was timed-out in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-timeout');
  }

  $('.' + username).remove();
}

/**
 * Application logic for a CLEARCHAT event.
 *
 * @param {*} channel
 * @param {*} username
 */
function clearChat(channel, username) {
  if (!doChatClears) return false;

  $('.chatmessage').remove();
  chatNotice('Chat was cleared in ' + capitalize(dehash(channel)), 1000, 1, 'chat-delete-clear');
}

/**
 * Application logic for host and unhost events.
 *
 * @param {*} channel
 * @param {*} target
 * @param {*} viewers
 * @param {*} unhost
 */
function hosting(channel, target, viewers, unhost) {
  if(!showHosting) return false;
  if(viewers == '-') viewers = 0;
  var chan = dehash(channel);
  chan = capitalize(chan);

  if (!unhost) {
    var targ = capitalize(target);
    chatNotice(chan + ' is now hosting ' + targ + ' for ' + viewers + ' viewer' + (viewers !== 1 ? 's' : '') + '.', null, null, 'chat-hosting-yes');
  } else {
    chatNotice(chan + ' is no longer hosting.', null, null, 'chat-hosting-no');
  }
}

client.addListener('message', handleChat);
client.addListener('timeout', timeout);
client.addListener('clearchat', clearChat);
client.addListener('hosting', hosting);
client.addListener('unhost', function(channel, viewers) {
  hosting(channel, null, viewers, true);
});
client.addListener('connecting', function(address, port) {
  if(showConnectionNotices) chatNotice('Connecting', 1000, -4, 'chat-connection-good-connecting');
});
client.addListener('logon', function() {
  if(showConnectionNotices) chatNotice('Authenticating', 1000, -3, 'chat-connection-good-logon');
});
client.addListener('connectfail', function() {
  if(showConnectionNotices) chatNotice('Connection failed', 1000, 3, 'chat-connection-bad-fail');
});
client.addListener('connected', function(address, port) {
  if(showConnectionNotices) chatNotice('Connected', 1000, -2, 'chat-connection-good-connected');
  joinAccounced = [];
});
client.addListener('disconnected', function(reason) {
  if(showConnectionNotices) chatNotice('Disconnected: ' + (reason || ''), 3000, 2, 'chat-connection-bad-disconnected');
});
client.addListener('reconnect', function() {
  if(showConnectionNotices) chatNotice('Reconnected', 1000, 'chat-connection-good-reconnect');
});
client.addListener('join', function(channel, username) {
  if (username == client.getUsername()) {
    if(showConnectionNotices) chatNotice('Joined ' + capitalize(dehash(channel)), 1000, -1, 'chat-room-join');
    joinAccounced.push(channel);
  }
});
client.addListener('part', function(channel, username) {
  var index = joinAccounced.indexOf(channel);
  if (index > -1) {
    if(showConnectionNotices) chatNotice('Parted ' + capitalize(dehash(channel)), 1000, -1, 'chat-room-part');
    joinAccounced.splice(joinAccounced.indexOf(channel), 1);
  }
});
client.addListener('crash', function() {
  chatNotice('Crashed', 10000, 4, 'chat-crash');
});

$(document).ready(function(e) {
  for (var i in channels) {
    addAsyncCall(channels[i]);
  }

  $.when.apply({}, asyncCalls).always(function() {
    bttvEmotes.emoteCodeList = _.pluck(bttvEmotes.emotes, 'code');
    client.connect();
  });
});
