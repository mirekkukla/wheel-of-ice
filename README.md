# Wheel of ICE
A static-page app that let's you spin the Wheel of ICE.

### Running locally
It's a static webpage, so simply open `index.html` in your browser of choice.

### Hosting
For the quickest scrappy setup I like "hosting" static webpages with [https://codepen.io](codepen.io) (no account needed):
- Create a new "anonymous" pen
- Copy each of the included html, css, javascript files over
- Check out the 'live view' (or replace "pen" in the url with "full")

### Setup reporting (optional)
Get an email with IP-determined geographic info whenever someone rolls the wheel (catch that sneaky cheater):
- Create a free account with [geo.ipify](https://geo.ipify.org) and get an API key
- Create a free account with [emailjs.com](https://www.emailjs.com) and get an API key
    - You'll need a backing SMTP server to send emails with emailjs, I use https://sendgrid.com/ (free for basic usage)
    - You'll need to create a template email to trigger (see "about emailjs" for more)
- Setup your API keys
    - If wanting to test reporting locally, create a file called "localConfig.js" in the same directory and add these two lines:
    ```
    window.GEO_KEY = "your_geo_key";
    window.EMAILJS_KEY = "your_emailjs_key";
    ```
- If setting up reporting on your internet-facing site, just hard-code your API keys (as above) into your header / within a script tag at the top of your <body>. Yes, anyone loading your site will be able to see your API keys, but there's nothing malicious they can do with these two locked-down services.



blash


1. EMAILJS_KEY


Running locally: just 

Host as you would any simple one-page app.

Hack "hosting" with codepen.io:
- make a new pen
- copy each of the include html, css, javascript files over
- check out the 'live view' (or replace "pen" in the url with "full")
- share URL with others

Image of resulting page as of 45f077a:

<img src="https://i.ibb.co/D5XqZzM/wheel-img.jpg" alt="Wheel of ICE image" width="434"/>
