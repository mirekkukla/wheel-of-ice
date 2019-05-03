/* global Winwheel, Audio, gtag, fetch, $ */
/* Adopted from http://dougtesting.net/winwheel/examples/wheel_of_fortune */
(function(){
    "use strict";

    // Audio
    const TICK_SOUND = new Audio("resources/tick.mp3");
    const CRYING_SOUND = new Audio("resources/crying.mp3");

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

    const phlippySlices = [
       {'fillStyle' : '#ad172b', 'text' : '\nNap time'},
       {'fillStyle' : '#000000', 'text' : '\nSIPPY CUP,\nBITCH!', 'textFontSize' : 25, 'textFillStyle' : '#ffffff'},
       {'fillStyle' : '#ad172b', 'text' : '\nYou made a poopy'},
       {'fillStyle' : '#ffffff', 'text' : '\nWAAAAAAA'},
       {'fillStyle' : '#ad172b', 'text' : '\nHere\'s your\npacifier'},
       {'fillStyle' : '#ffffff', 'text' : '\nYou wetted\nthe bed'}];

    const normalSlices = [
       {'fillStyle' : '#ad172b', 'text' : '\nSpin again'},
       {'fillStyle' : '#000000', 'text' : '\nICE, BITCH!', 'textFontSize' : 25, 'textFillStyle' : '#ffffff'},
       {'fillStyle' : '#ad172b', 'text' : '\nGet slapped\nby Isaac'},
       {'fillStyle' : '#ffffff', 'text' : '\nEveryone owes\nyou $5'},
       {'fillStyle' : '#ad172b', 'text' : '\nYou owe\neveryone $3'},
       {'fillStyle' : '#ffffff', 'text' : '\nChug a beer'}];

    // Think of these as instance variables
    let theWheel = getNewWheel(normalSlices);
    let wheelSpinning = false;
    let ipDetails = null;
    setIPDetails();

    // Add listeners to checkboxes
    let jandroCheckbox = document.querySelector("#jandro_checkbox");
    jandroCheckbox.addEventListener('change', function() {
        resetWheel();
    });

    let phlippyCheckbox = document.querySelector("#phlippy_checkbox");
    phlippyCheckbox.addEventListener('change', function() {
        resetWheel();
    });


    // Get the users' geo info based on IP and set the `ipDetails` instance var
    // Format is as given for https://geo.ipify.org/api/v1
    function setIPDetails() {
        fetch("/geo_info")
            .then(handleFetchErrors)
            .then(response => response.json())
            .then(json => {
                console.log("IP details set to: " + JSON.stringify(json));
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
                'callbackSound'    : playTick,   // function to call when the tick sound is to be triggered
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
        if (isPhlippyMode) {
            outcome += " (Phlippy mode)";
        }

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

        triggerPopup(cleanText);

        // Reseting makes the "spin" button clickable again
        resetWheel();
    }

    // Send an email indicating the spin outcome
    function sendEmail(outcome) {
        let payload = {outcome: outcome};
        fetch("/send_email", {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {'Content-Type': 'application/json'}
        })
            .then(handleFetchErrors)
            .then(response => response.json())
            .then(json => console.log(JSON.stringify(json)))
            .catch(error => console.log(error));
    }


    // Display the results modal with the given text
    function triggerPopup(text) {
        $("#crying_baby")[0].style.display = isPhlippyMode() ? "" : "none";
        $('#modal_text')[0].innerText = text;
        $('#result_modal').modal();
        if (isPhlippyMode()) {
            CRYING_SOUND.play();
        }
    }


    // Play a single "click"
    function playTick() {
        TICK_SOUND.pause(); // reset sound in case it's already playing
        TICK_SOUND.currentTime = 0;
        TICK_SOUND.play();
    }


    // Change the src attribute of all bottle images to the given string
    function changeBottlesSrc(newSourceStr) {
        let bottles = document.querySelectorAll(".bottle_img");
        for (let bottle of bottles) {
            bottle.src = newSourceStr;
        }
    }


    // Click handler for spin button
    window.startSpin = function() {
        if (wheelSpinning) {
            return;
        }
        resetWheel();

        // Disable the spin button
        document.getElementById('spin_button').src = "resources/spin_off.png";
        document.getElementById('spin_button').classList.remove("clickable");

        if (isJandroMode()) {
            // Always land in the first slice, but make it "look" random
            // EX: for slice size = 60 we want an angle somewhere in [61, 119]
            const SLICE_SIZE = 360 / NUM_SEGMENTS;
            theWheel.animation.stopAngle = (SLICE_SIZE + 1) + Math.floor(Math.random() * (SLICE_SIZE - 1));
        } else {
            theWheel.animation.stopAngle = null;
        }

        theWheel.startAnimation(); // spin the wheel
        document.getElementById("center_bottle").classList.add("fading_spin"); // spin the center bottle
        wheelSpinning = true;
    };


    // Get the wheel ready for another spin (potentially switch wheel type)
    function resetWheel() {
        // Re-initialize wheel object, but keep old rotation angle so it looks unchanged
        let oldRotationAngle = theWheel.rotationAngle;
        if (isPhlippyMode()) { // phlippy mode slices take precedence over jandro mode
            theWheel = getNewWheel(phlippySlices);
        } else if (isJandroMode()) {
            theWheel = getNewWheel(jandroSlices);
        } else {
            theWheel = getNewWheel(normalSlices);
        }

        // Set the desired bottle image
        if (isPhlippyMode()) {
            changeBottlesSrc("resources/baby_bottle.jpg");
        } else {
            changeBottlesSrc("resources/ice_bottle.jpg");
        }

        // For the spin speed to work properly, the initial angle needs to be between 0 and 360
        // See http://dougtesting.net/winwheel/docs/tut20_making_it_responsive
        theWheel.rotationAngle = oldRotationAngle % 360;
        theWheel.draw();

        // Make the button clickable again
        document.getElementById('spin_button').src = "resources/spin_on.png";
        document.getElementById('spin_button').classList.add("clickable");

        // Revert back to a non-spinning image for bottle
        document.getElementById("center_bottle").classList.remove("fading_spin");

        // Re-load IP address info (IP might have changed since we last loaded the page)
        setIPDetails();
        wheelSpinning = false;
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

    // "Phlppy mode" checkbox is checked
    function isPhlippyMode() {
        return document.getElementById('phlippy_checkbox').checked;
    }

    // Since `fetch()` doesn't "catch" HTTP errors, we need to handle them ourselves
    // GOTCHA: make sure to call this BEFORE you process the HTTP response
    // GOTCHA: don't use this with the emailjs.send() promise, which doesn't use `fetch()`
    function handleFetchErrors(response) {
      // 'clone' so we can still read the original `response` downstream)
      return response.clone().text()
        .then(bodyTxt => {
          if (!response.ok) {
            throw new Error(`status: '${response.status}', body: '${bodyTxt}'`);
          }
          return response;
        });
}

})();
