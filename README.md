LutraChat
=========

Converged chat webpage for Mixer and Twitch.

Call URL with two parameters:

| Value    | Description                                                                                                                                                                                                     |
|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| username | Your username on Mixer and Twitch. Must be equal.                                                                                                                                                               |
| timer    | Time in millseconds until a message disappears. 0 disables messages fading.                                                                                                                                     |
| bgcolor  | Change the colour of the background. Not recommended for OBS overlay, but useful when running standalone. Accepts any CSS colour string, e.g. `gray`. This parameter is optional and defaults to `transparent`. |

Ex.: <https://superlisa.nl/chat?username=SuperLisa&timer=0>

Running from a file
-------------------

Simply open `app/index.html` to run as a standalone webpage. Useful for
watching chat, but cannot be embedded in OBS. Remember to add URL parameters as
required.

Running from a webserver
------------------------

Serve the entire `app/` directory from either your documentroot or as a
subdirectory.

Running as a standalone service
-------------------------------

Install dependencies with `npm install` and start the webserver at port 3000
with `npm start`. A working Node.js environment is required.

Username-specific changes when self-hosting
===========================================

Since this is pretty much custom built there are some references that you might
want to change. Particularly, the username in the following files:

 * app/index.html
 * app/sitemap.xml

This is not done automatically with the username parameter since these values
cannot be dynamically updated without a proper backend logic (which would break
running from file).
