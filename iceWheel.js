/* global Winwheel, Audio, alert */
/* adopted from http://dougtesting.net/winwheel/examples/wheel_of_fortune*/
(function(){
    "use strict";

    // external files
    const SRC_BASE = "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune";
    const SPIN_ON_SRC = SRC_BASE + "/spin_on.png";
    const SPIN_OFF_SRC = SRC_BASE + "/spin_off.png";
    const AUDIO_SRC = SRC_BASE + "/tick.mp3";

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

    
    let audio = new Audio(AUDIO_SRC); // Loads the tick audio sound in to an audio object.
    let theWheel = getNewWheel(normalSlices); // Initial to a normal wheel
    let wheelSpinning = false;

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
    function alertPrize(indicatedSegment) {
        // TODO: use a nicer popup than alert
        if (indicatedSegment.text === "\nSpin again") {
            alert("LAAAAAAME. Try again.");
        } else if (indicatedSegment.text === "\nICE, BITCH") {
            alert("OOOOOOOOOOOH SNAP! CHUG IIIIIIIT!");
        } else {
            alert(indicatedSegment.text.replace(/\n/g, " "));
        }

        // Light up the spin button by changing its source image and adding a clickable class to it.
        resetWheel();
    }

    // HELPERS
    
    function isJandroMode() {
        return document.getElementById('jandro_checkbox').checked;
    }

})();
