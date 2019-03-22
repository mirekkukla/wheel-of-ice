/* global Winwheel, Audio, alert */
/* adopted from http://dougtesting.net/winwheel/examples/wheel_of_fortune*/
(function(){
    "use strict";

    const SRC_BASE = "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune";
    const SPIN_ON_SRC = SRC_BASE + "/spin_on.png";
    const SPIN_OFF_SRC = SRC_BASE + "/spin_off.png";
    const AUDIO_SRC = SRC_BASE + "/tick.mp3";

    let theWheel = new Winwheel({
        'outerRadius'     : 212,        // Set outer radius so wheel fits inside the background.
        'innerRadius'     : 75,         // Make wheel hollow so segments don't go all way to center.
        'textFontSize'    : 18,         // Set default font size for the segments.
        'textOrientation' : 'curved',   // Curved text allows longer words
        'textAlignment'   : 'outer',    // Align text to outside of wheel.
        'numSegments'     : 6,          // Specify number of segments.
        'segments'        :             // Define segments including colour and text.
        [                               // font size and test colour overridden on backrupt segments.
           {'fillStyle' : '#ad172b', 'text' : '\nSpin again'},
           {'fillStyle' : '#000000', 'text' : '\nICE, BITCH', 'textFontSize' : 25, 'textFillStyle' : '#ffffff'},
           {'fillStyle' : '#ad172b', 'text' : '\nGet slapped\nby Isaac'},
           {'fillStyle' : '#ffffff', 'text' : '\nEveryone owes\nyou $5'},
           {'fillStyle' : '#ad172b', 'text' : '\nYou owe\neveryone $3'},
           {'fillStyle' : '#ffffff', 'text' : '\nChug a beer and\nspin again'},
        ],
        'animation':
        {
            'type'     : 'spinToStop',
            'duration' : 10,    // Duration in seconds.
            'spins'    : 5,     // Default number of complete spins.
            'callbackFinished' : alertPrize,
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

    // Loads the tick audio sound in to an audio object.
    let audio = new Audio(AUDIO_SRC);
    
    function playSound() {
        // Stop and rewind the sound if it already happens to be playing.
        audio.pause();
        audio.currentTime = 0;
        audio.play();
    }

    // Used to ensure we can't re-spin the wheel while its spinning.
    let wheelSpinning = false;

    // -------------------------------------------------------
    // Click handler for spin button
    // -------------------------------------------------------
    window.startSpin = function() {
        // Can't start a spin if one is already while already running.
        if (wheelSpinning == false) {

            resetWheel();

            // Disable the spin button so can't click again while wheel is spinning.
            document.getElementById('spin_button').src = SPIN_OFF_SRC;
            document.getElementById('spin_button').className = "";
            
            // Begin the spin animation by calling startAnimation on the wheel object.
            theWheel.startAnimation();
            
            // Set to true so that power can't be changed and spin button re-enabled during
            // the current animation. The user will have to reset before spinning again.
            wheelSpinning = true;
        }
    };

    // -------------------------------------------------------
    // Get the wheel ready for another spin
    // -------------------------------------------------------
    let resetWheel = function() {
        theWheel.stopAnimation(false);

        // for the spin speed to work properly, the initial angle needs to be between 0 and 360
        // see http://dougtesting.net/winwheel/docs/tut20_making_it_responsive
        theWheel.rotationAngle = theWheel.rotationAngle % 360;
        theWheel.draw();

        // Make the button clickable again
        document.getElementById('spin_button').src = SPIN_ON_SRC;
        document.getElementById('spin_button').className = "clickable";
        wheelSpinning = false;
    };

    // -------------------------------------------------------
    // Called when the spin animation has finished
    // -------------------------------------------------------
    function alertPrize(indicatedSegment) {
        // TODO: use a nicer popup than alert
        if (indicatedSegment.text === "\nSpin again") {
            alert("LAAAAAAME. Try again.");
        } else if (indicatedSegment.text === "\nICE, BITCH") {
            alert("OOOOOOOOOOOH SNAP! CHUG IIIIIIIT!");
        } else {
            alert(indicatedSegment.text.replace(/\n/g, " "));
        }
        // TODO: wheelSpinning = false?

        // Light up the spin button by changing its source image and adding a clickable class to it.
        resetWheel();
    }
})();
