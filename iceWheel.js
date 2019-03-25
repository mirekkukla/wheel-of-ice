/* global Winwheel, Audio, alert, gtag, fetch, emailjs */
/* adopted from http://dougtesting.net/winwheel/examples/wheel_of_fortune*/
(function(){
    "use strict";

    // external files
    const SRC_BASE = "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune";
    const SPIN_ON_SRC = SRC_BASE + "/spin_on.png";
    const SPIN_OFF_SRC = SRC_BASE + "/spin_off.png";
    const AUDIO_SRC = SRC_BASE + "/tick.mp3";

    // wheel constants
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
           {'fillStyle' : '#ffffff', 'text' : '\nChug a beer and\nspin again'}];

    // setup emailjs client
    emailjs.init("user_8JLOO0Mj5SQ4um0RmAmTP");

    // think of these as instance variables
    let audio = new Audio(AUDIO_SRC); // the ticking sound
    let theWheel = getNewWheel(normalSlices);
    let wheelSpinning = false;
    let ipDetails = null;

    function setIPDetails() {
        fetch("https://api.ipify.org?format=json") // get IP
            .then(handleErrors)
            .then(response =>  response.json())
            // chained call: now get geo info
            .then(json => fetch("https://geo.ipify.org/api/v1?apiKey=at_IUxTwRiCCI0kwGkZSDm3VGaWxF4LY&ipAddress=" + json.ip))
            .then(handleErrors)
            .then(response =>  response.json())
            .then(json => ipDetails = json)
            .catch(error => console.log(error));
    }

    function getNewWheel(segments) {
        return new Winwheel({
            'outerRadius'     : 212,          // Set outer radius so wheel fits inside the background.
            'innerRadius'     : 75,           // Make wheel hollow so segments don't go all way to center.
            'textFontSize'    : 18,           // Set default font size for the segments.
            'textOrientation' : 'curved',     // Curved text allows longer words
            'textAlignment'   : 'outer',      // Align text to outside of wheel.
            'numSegments'     : NUM_SEGMENTS, // Specify number of segments.
            'segments'        : segments,     // Define segments including colour and text.
            'animation':
            {
                'type'     : 'spinToStop',
                'duration' : SPIN_DURATION, // Duration in seconds.
                'spins'    : NUM_SPINS,     // Default number of complete spins.
                'callbackFinished' : alertAndLog,
                'callbackSound'    : playSound,   // Function to call when the tick sound is to be triggered.
                'soundTrigger'     : 'pin'        // Specify pins are to trigger the sound, the other option is 'segment'.
            },
            'pins':
            {
                'number'     : 24,
                'fillStyle'  : 'silver',
                'outerRadius': 4,
            }
        });
    }
    
    function playSound() {
        // Stop and rewind the sound if it already happens to be playing.
        audio.pause();
        audio.currentTime = 0;
        audio.play();
    }

    // -------------------------------------------------------
    // Click handler for spin button
    // -------------------------------------------------------
    window.startSpin = function() {
        // Can't start a spin if one is already while already running.
        if (wheelSpinning) {
            return;
        }
        
        resetWheel();

        // Disable the spin button so can't click again while wheel is spinning.
        document.getElementById('spin_button').src = SPIN_OFF_SRC;
        document.getElementById('spin_button').className = "";
        
        if (isJandroMode()) {
            // Always land in the first slice, but make it "look" random.
            // EX: for slice size = 60 we want an angle somewhere in [61, 119]
            const SLICE_SIZE = 360 / NUM_SEGMENTS;
            theWheel.animation.stopAngle = (SLICE_SIZE + 1) + Math.floor(Math.random() * (SLICE_SIZE - 1));
        } else {
            theWheel.animation.stopAngle = null;
        }

        theWheel.startAnimation();

        // Spin the inner bottle
        document.getElementById("test_img").className = "rotating_img";

        // Set to true so that power can't be changed and spin button re-enabled during.
        // the current animation. The user will have to reset before spinning again.
        wheelSpinning = true;
    };

    // -------------------------------------------------------
    // Get the wheel ready for another spin (potentially switch wheel type)
    // -------------------------------------------------------
    let resetWheel = function() {

        let oldRotationAngle = theWheel.rotationAngle;
        theWheel = getNewWheel(isJandroMode() ? jandroSlices : normalSlices);

        // For the spin speed to work properly, the initial angle needs to be between 0 and 360.
        // See http://dougtesting.net/winwheel/docs/tut20_making_it_responsive
        theWheel.rotationAngle = oldRotationAngle % 360;
        theWheel.draw();

        // Make the button clickable again.
        document.getElementById('spin_button').src = SPIN_ON_SRC;
        document.getElementById('spin_button').className = "clickable";
        wheelSpinning = false;

        // Revert back to a non-spinning image.
        document.getElementById("test_img").className = "";
    };

    // -------------------------------------------------------
    // Called when the spin animation has finished
    // -------------------------------------------------------
    function alertAndLog(indicatedSegment) {
        // TODO: use a nicer popup than alert

        let cleanText = indicatedSegment.text.trim("\n").replace(/\n/g, " ");
        let outcome = isJandroMode() ? cleanText + " (Jandro mode)" : cleanText;

        // Log / email before showing popup
        if ("gtag" in window) {
            console.log(`Sending event with label '${outcome}' to analytics`);
            gtag('event', 'spin', {event_label: outcome});
        }

        sendEmail(outcome);

        if (cleanText === "Spin again") {
            alert("LAAAAAAME. Try again.");
        } else if (cleanText === "ICE, BITCH") {
            alert("OOOOOOOOOOOH SNAP! CHUG IIIIIIIT!");
        } else {
            alert(cleanText);
        }

        // Light up the spin button by changing its source image and adding a clickable class to it.
        resetWheel();
    }


    function sendEmail(outcome) {
        let loc = ipDetails.location;
        let location = ipDetails ? `${loc.city}, ${loc.region}, ${loc.country} (from ${ipDetails.ip})` : null;
        // TODO: gmail link
        let templateParams = {
            location: location,
            outcome: outcome
        };
        console.log (`Sending email with params '${JSON.stringify(templateParams)}' to EmailJS`);
        // TODO: look into cross origin block
        emailjs.send('sendgrid', 'wheel_of_ice', templateParams)
            .then((response) => console.log('SUCCESS!', response.status, response.text))
            .catch((error) => console.log('FAILED...', error)); // TODO: test catch
    }

    // HELPERS

    function isJandroMode() {
        return document.getElementById('jandro_checkbox').checked;
    }

    // since `fetch()` doesn't "catch" HTTP errors
    // make sure to call this BEFORE you process the HTTP response
    function handleErrors(response) {
        if (!response.ok) {
            throw Error(response.statusText);
        }
        return response;
    }


})();
