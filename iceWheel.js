/* global Winwheel, Audio, alert */
/* adopted from http://dougtesting.net/winwheel/examples/wheel_of_fortune*/
(function(){
    "use strict";

    const SPIN_ON_SRC = "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune/spin_on.png";
    const SPIN_OFF_SRC = "https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune/spin_off.png";

    // Create new wheel object specifying the parameters at creation time.
    let theWheel = new Winwheel({
        'outerRadius'     : 212,        // Set outer radius so wheel fits inside the background.
        'innerRadius'     : 75,         // Make wheel hollow so segments don't go all way to center.
        'textFontSize'    : 18,         // Set default font size for the segments.
        'textOrientation' : 'curved', // Curved text allows longer words
        'textAlignment'   : 'outer',    // Align text to outside of wheel.
        'numSegments'     : 6,         // Specify number of segments.
        'segments'        :             // Define segments including colour and text.
        [                               // font size and test colour overridden on backrupt segments.
           {'fillStyle' : '#f26522', 'text' : '\nSpin again'},
           {'fillStyle' : '#000000', 'text' : '\nICE, BITCH', 'textFontSize' : 25, 'textFillStyle' : '#ffffff'},
           {'fillStyle' : '#e70697', 'text' : '\nGet slapped\nby Isaac'},
           {'fillStyle' : '#fff200', 'text' : '\nEveryone owes\nyou $5'},
           {'fillStyle' : '#f6989d', 'text' : '\nYou owe\neveryone $3'},
           {'fillStyle' : '#ee1c24', 'text' : '\nChug a beer and\nspin again'},
        ],
        'animation' :           // Specify the animation to use.
        {
            'type'     : 'spinToStop',
            'duration' : 10,    // Duration in seconds.
            'spins'    : 3,     // Default number of complete spins.
            'callbackFinished' : alertPrize,
            'callbackSound'    : playSound,   // Function to call when the tick sound is to be triggered.
            'soundTrigger'     : 'pin'        // Specify pins are to trigger the sound, the other option is 'segment'.
        },
        'pins' :        // Turn pins on.
        {
            'number'     : 24,
            'fillStyle'  : 'silver',
            'outerRadius': 4,
        }
    });

    // Loads the tick audio sound in to an audio object.
    let audio = new Audio('https://raw.githubusercontent.com/zarocknz/javascript-winwheel/master/examples/wheel_of_fortune/tick.mp3');
    
    function playSound() {
        // Stop and rewind the sound if it already happens to be playing.
        audio.pause();
        audio.currentTime = 0;
        audio.play();
    }

    // Vars used by the code in this page to do power controls.
    let wheelSpinning = false;

    // -------------------------------------------------------
    // Function to handle the onClick on the power buttons
    // -------------------------------------------------------
    window.powerSelected = function(powerLevel) {
        // Ensure that power can't be changed while wheel is spinning.
        if (wheelSpinning == false) {
            // Light up the spin button by changing its source image and adding a clickable class to it.
            document.getElementById('spin_button').src = SPIN_ON_SRC;
            document.getElementById('spin_button').className = "clickable";
        }
    };

    // -------------------------------------------------------
    // Click handler for spin button.
    // -------------------------------------------------------
    window.startSpin = function() {
        // Ensure that spinning can't be clicked again while already running.
        if (wheelSpinning == false) {
            // Based on the power level selected adjust the number of spins for the wheel, the more times is has
            // to rotate with the duration of the animation the quicker the wheel spins.
            theWheel.animation.spins = 3;

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
    // Function for reset button.
    // -------------------------------------------------------
    window.resetWheel = function() {
        theWheel.stopAnimation(false);  // Stop the animation, false as param so does not call callback function.
        theWheel.rotationAngle = 0;     // Re-set the wheel angle to 0 degrees.
        theWheel.draw();                // Call draw to render changes to the wheel.

        wheelSpinning = false;          // Reset to false to power buttons and spin can be clicked again.
        document.getElementById('spin_button').src = SPIN_ON_SRC;
        document.getElementById('spin_button').className = "clickable";
    };

    // -------------------------------------------------------
    // Called when the spin animation has finished by the callback feature of the wheel because I specified callback in the parameters.
    // -------------------------------------------------------
    function alertPrize(indicatedSegment) {
        // Just alert to the user what happened.
        // In a real project probably want to do something more interesting than this with the result.
        if (indicatedSegment.text === "Spin again") {
            alert("Well that was lame");
        } else if (indicatedSegment.text === "ICE, BITCH") {
            alert("OOOOOOOOOOOH SNAP! CHUG IIIIIIIT!");
        } else {
            alert(indicatedSegment.text.replace(/\n/g, " "));
        }
        // TODO: wheelSpinning = false?
    }
})();
