/* global Winwheel, Audio, alert, gtag, fetch, emailjs */
/* Adopted from http://dougtesting.net/winwheel/examples/wheel_of_fortune */
(function(){
    "use strict";

    // TEMP: find a way to load these from localConf on the REMOTE server
    window.GEO_KEY = "at_IUxTwRiCCI0kwGkZSDm3VGaWxF4LY";
    window.EMAILJS_KEY = "user_8JLOO0Mj5SQ4um0RmAmTP";

    // External files
    const SRC_BASE = "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune";
    const SPIN_ON_SRC = SRC_BASE + "/spin_on.png";
    const SPIN_OFF_SRC = SRC_BASE + "/spin_off.png";
    const AUDIO_SRC = SRC_BASE + "/tick.mp3";

    // API keys (either hard code them here or load them in the header of your index.html file)
    const GEO_KEY = window.GEO_KEY;
    const EMAILJS_KEY = window.EMAILJS_KEY;
    const EMAIL_JS_TEMPATE = "wheel_of_ice";

    // Wheel constants
    const NUM_SEGMENTS = 6;
    const NUM_SPINS = 5;
    const SPIN_DURATION = 10;

    const jandroSlices = [
       {'fillStyle' : '#ad172b', 'text' : '\nYou win!'},
       {'fillStyle' : '#000000', 'text' : '\nICE, BITCH!', 'textFontSize' : 25, 'textFillStyle' : '#ffffff'},
       {'fillStyle' : '#ad172b', 'text' : '\nYou win!'},
       {'fillStyle' : '#ffffff', 'text' : '\nYou win!'},
       {'fillStyle' : '#ad172b', 'text' : '\nYou win!'},
       {'fillStyle' : '#ffffff', 'text' : '\nYou win!'}];

    const normalSlices = [
       {'fillStyle' : '#ad172b', 'text' : '\nSpin again'},
       {'fillStyle' : '#000000', 'text' : '\nICE, BITCH!', 'textFontSize' : 25, 'textFillStyle' : '#ffffff'},
       {'fillStyle' : '#ad172b', 'text' : '\nGet slapped\nby Isaac'},
       {'fillStyle' : '#ffffff', 'text' : '\nEveryone owes\nyou $5'},
       {'fillStyle' : '#ad172b', 'text' : '\nYou owe\neveryone $3'},
       {'fillStyle' : '#ffffff', 'text' : '\nChug a beer'}];

    // Setup emailjs client
    if (!reportingDisabled()) {
        emailjs.init(EMAILJS_KEY);
    }

    // Think of these as instance variables
    let audio = new Audio(AUDIO_SRC); // the ticking sound
    let theWheel = getNewWheel(normalSlices);
    let wheelSpinning = false;
    let ipDetails = null;
    setIPDetails();


    // Get the IP, use it to get geo info, and set the `ipDetails` instance var
    function setIPDetails() {
        fetch("https://api.ipify.org?format=json")
            .then(handleFetchErrors)
            .then(response => response.json())
            .then(json => fetch(`https://geo.ipify.org/api/v1?apiKey=${GEO_KEY}&ipAddress=${json.ip}`))
            .then(handleFetchErrors)
            .then(response => response.json())
            .then(json => {
                console.log("IP details: " + JSON.stringify(json));
                ipDetails = json;
            }).catch(error => console.log(error));
    }


    // Get a new Winwheel object
    function getNewWheel(segments) {
        return new Winwheel({
            'outerRadius'     : 212,          // set outer radius so wheel fits inside the background
            'innerRadius'     : 75,           // make wheel hollow so segments don't go all way to center
            'textFontSize'    : 18,           // set default font size for the segments
            'textOrientation' : 'curved',     // curved text allows longer words
            'textAlignment'   : 'outer',      // align text to outside of wheel
            'numSegments'     : NUM_SEGMENTS, // specify number of segments
            'segments'        : segments,     // define segments including colour and text
            'animation': {
                'type'     : 'spinToStop',
                'duration' : SPIN_DURATION,   // duration in seconds
                'spins'    : NUM_SPINS,       // default number of complete spins
                'callbackFinished' : alertAndLog, // function to call when wheel has finished spinning
                'callbackSound'    : playSound,   // function to call when the tick sound is to be triggered
                'soundTrigger'     : 'pin'        // specify pins are to trigger the sound, the other option is 'segment'
            },
            'pins': {
                'number'     : 24,
                'fillStyle'  : 'silver',
                'outerRadius': 4,
            }
        });
    }
    

    // Called when the spin animation has finished
    function alertAndLog(indicatedSegment) {
        let cleanText = indicatedSegment.text.trim("\n").replace(/\n/g, " ");
        let outcome = isJandroMode() ? cleanText + " (Jandro mode)" : cleanText;

        // Google analytics
        if (reportingDisabled()) {
            console.log("Reporting disabled, not sending data to analytics");
        } else if (!("gtag" in window)) {
            console.warn("Analytics not setup");
        } else {
            console.log(`Sending event with label '${outcome}' to analytics`);
            gtag('event', 'spin', {event_label: outcome});
        }

        // Email notifications
        if (reportingDisabled()) {
            console.log("Reporting disabled, not sending email");
        } else {
            sendEmail(outcome);
        }

        // TODO: use a nicer popup than alert
        if (cleanText === "Spin again") {
            alert("LAAAAAAME. Try again.");
        } else if (cleanText === "ICE, BITCH") {
            alert("OOOOOOOOOOOH SNAP! CHUG IIIIIIIT!");
        } else {
            alert(cleanText);
        }

        // Reseting makes the "spin" button clickable again
        resetWheel();
    }


    // Play a single "click"
    function playSound() {
        audio.pause(); // reset sound in case it's already playing
        audio.currentTime = 0;
        audio.play();
    }


    // Click handler for spin button
    window.startSpin = function() {
        if (wheelSpinning) {
            return;
        }
        resetWheel();

        // Disable the spin button
        document.getElementById('spin_button').src = SPIN_OFF_SRC;
        document.getElementById('spin_button').className = "";
        
        if (isJandroMode()) {
            // Always land in the first slice, but make it "look" random
            // EX: for slice size = 60 we want an angle somewhere in [61, 119]
            const SLICE_SIZE = 360 / NUM_SEGMENTS;
            theWheel.animation.stopAngle = (SLICE_SIZE + 1) + Math.floor(Math.random() * (SLICE_SIZE - 1));
        } else {
            theWheel.animation.stopAngle = null;
        }

        theWheel.startAnimation(); // spin the wheel
        document.getElementById("bottle_img").className = "rotating_img"; // spin the inner bottle
        wheelSpinning = true;
    };


    // Get the wheel ready for another spin (potentially switch wheel type)
    function resetWheel() {
        // Re-initialize wheel object, but keep old rotation angle so it looks unchanged
        let oldRotationAngle = theWheel.rotationAngle;
        theWheel = getNewWheel(isJandroMode() ? jandroSlices : normalSlices);

        // For the spin speed to work properly, the initial angle needs to be between 0 and 360
        // See http://dougtesting.net/winwheel/docs/tut20_making_it_responsive
        theWheel.rotationAngle = oldRotationAngle % 360;
        theWheel.draw();

        // Make the button clickable again
        document.getElementById('spin_button').src = SPIN_ON_SRC;
        document.getElementById('spin_button').className = "clickable";

        // Revert back to a non-spinning image
        document.getElementById("bottle_img").className = "";

        // Re-load IP address info (IP might have changed since we last loaded the page)
        setIPDetails();
        wheelSpinning = false;
    }


    // Send email using EmailJS (note that gmail might categorize the email as spam)
    function sendEmail(outcome) {
        let locationStr = null;
        let mapsLink = null;
        if (ipDetails === null) {
            console.warn("IP details haven't been set yet, investigate");
            locationStr = "Error finding IP address";
        } else {
            let loc = ipDetails.location;
            locationStr = `${loc.city}, ${loc.region}, ${loc.country} (from ${ipDetails.ip})`;
            mapsLink = `https://www.google.com/maps/@${loc.lat},${loc.lng},12z`
        }

        let templateParams = {
            location: locationStr,
            outcome: outcome,
            maps_link: mapsLink
        };

        console.log (`Sending email with params '${JSON.stringify(templateParams)}' to EmailJS`);
        emailjs.send('sendgrid', EMAIL_JS_TEMPATE, templateParams)
            .then((response) => console.log('SUCCESS!', response.status, response.text))
            .catch((error) => console.error('FAILED...', error));
    }


    // HELPERS


    // Disable reporting if running locally (if running as static html, hostname is "")
    function reportingDisabled() {
        return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    }


    // "Jandro mode" checkbox is checked
    function isJandroMode() {
        return document.getElementById('jandro_checkbox').checked;
    }


    // Since `fetch()` doesn't "catch" HTTP errors, we need to handle them ourselves
    // GOTCHA: make sure to call this BEFORE you process the HTTP response
    // GOTCHA: don't use this with the emailjs.send() promise, which doesn't use `fetch()`
    function handleFetchErrors(response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response;
    }

})();
