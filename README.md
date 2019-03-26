# Wheel of ICE
A static-page app that let's you spin the Wheel of ICE. Image of resulting page as of 45f077a:

<img src="https://i.ibb.co/D5XqZzM/wheel-img.jpg" alt="Wheel of ICE image" width="434"/>


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
    - You'll need a backing SMTP server to actually send the emails, I use https://sendgrid.com/ (free for basic usage)
    - You'll need to create the template email you'll be triggering (see "about emailjs" for more)
- Setup your API keys
    - If wanting to test reporting locally, create a file called "localConfig.js" in the same directory as the other front-end files and add these two lines:
    ```
    window.GEO_KEY = "your_geo_key";
    window.EMAILJS_KEY = "your_emailjs_key";
    ```
    - If setting up reporting on your internet-facing site, just hard-code your API keys (as above) into your header or into iceWheel.js directly. Yes, anyone visiting your site will be able to see your API keys, but there's nothing malicious they can do with these two locked-down services. And presumably you're just setting this up to dick around anyway.

### About emailJS
Sending an email from a static front-end only webpage is only possible if you use an intermediary SMTP server. If you were to call this server _directly_ from your static front-end page, you'd be exposing your SMTP credentials (encrypted or otherwise) to the internet at large, which would allow anybody to go on a spam email frenzy using your account (\*cough\* smtpjs \*cough\*).

EmailJS is a bit of a compromise. Anyone can still "trigger" an email whenever they want, but they can't send "anything" to "anyone." EmailJS explains it nicely:

> A better way to think of EmailJS in terms of security is not as a service that allows you to send email from Javascript, but rather as a service that allows you to create predefined set of emails via the dashboard, and then just trigger the emails from the Javascript" (from the (FAQ)[http://www.emailjs.com/faq/)

Note that by default, reporting is disabled when running locally (see the `reportingDisabled()` function)

### Setting up an emailJS email template
The emailJS [documentation](https://www.emailjs.com/docs) is pretty straightforward:
- Add an [email service](https://www.emailjs.com/docs/tutorial/adding-email-service) (I use SendGrid)
- Create an [email template](https://www.emailjs.com/docs/tutorial/creating-email-template) called "wheel\_of\_ice"
    - You can use tempalte paratemetrs in the body of the email, the recipeint line, etc
    - Below the recipient is hard-coded as "XYZ@gmail.com"
      <img src="https://i.ibb.co/nkCyVXy/emailjs-wheel.jpg" alt="Email Template" width="434"/>
    - Note the template parameters (such as `{{outcome}}`) above, and compare them to the parameters passed via the triggering API call

There's a good chance the resulting email will get categorized as spam. If using gmail, just set up a filter to whitelist them.
