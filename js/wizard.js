/**
 * @file LutraChat wizard application logic
 * @author Patrick Godschalk <patrick@kernelpanics.nl>
 * @copyright Patrick Godschalk 2015-2018 - code reused from
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

var submit = document.getElementById('finish');

/**
 * Parses user input and returns LutraChat links. No error handling or
 * validation here since we sort of validate it with HTML5 forms. There's no
 * backend so if the client submit malformed data it only affects that same
 * client.
 */
function submitHandler() {
  var mixer = document.getElementById('mixer').value;
  var twitch = document.getElementById('twitch').value;
  var timer = document.getElementById('timer').value;

  document.getElementById('obs-link').innerHTML = 'https://superlisa.nl/chat?mixer=' + mixer + '?twitch=' + twitch + '&timer=' + timer;
  document.getElementById('browser-link').setAttribute('href', 'https://superlisa.nl/chat?mixer=' + mixer + '?twitch=' + twitch + '&timer=0&bgcolor=gray');
}

finish.addEventListener('click', submitHandler);
