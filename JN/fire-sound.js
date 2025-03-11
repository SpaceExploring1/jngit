let cometTone, cometCrackle;
let playing = false;
let cometInterval;
let mouseTimeout;

function setup() {
  noCanvas(); // No need for a visual canvas

  // Create a smooth oscillator for comet sound (sine wave)
  cometTone = new p5.Oscillator('sine');  // Sine wave for a smooth, soft tone
  cometTone.freq(220);  // Lower frequency for a deep, ethereal tone (A3 note)
  cometTone.amp(0);     // Start silent
  cometTone.start();

  // Create a second oscillator for subtle comet tail sounds (lower frequency)
  cometCrackle = new p5.Oscillator('sine');
  cometCrackle.freq(1500); // Lower frequency for a softer, trailing sound
  cometCrackle.amp(0);     // Start silent
  cometCrackle.start();
}

function playCometSound() {
  if (!playing) {
    userStartAudio().then(() => {
      console.log("✨ Comet sound playing...");
      cometTone.amp(0.03, 1); // Gently fade in the comet tone
      playing = true;
      startCometTrail();
    }).catch(err => console.error("Audio start failed:", err));
  }
}

function stopCometSound() {
  if (playing) {
    console.log("✨ Stopping comet sound...");
    cometTone.amp(0, 2); // Fade out the comet tone gradually
    cometCrackle.amp(0, 2); // Fade out the comet tail sound gradually
    playing = false;
    clearInterval(cometInterval);
  }
}

function startCometTrail() {
  cometInterval = setInterval(() => {
    if (playing) {
      let volume = random(0.01, 0.03);  // Very soft crackle volume
      cometCrackle.amp(volume, 0.2); // Quick fade-in for the comet trail
      setTimeout(() => cometCrackle.amp(0, 0.5), random(100, 250)); // Gradual fade-out for the tail sound
    }
  }, random(1500, 3000)); // Longer, more majestic intervals for comet trail sounds
}
document.addEventListener("click", () => {
    userStartAudio();
  });
  
// Start comet sound when moving mouse
document.addEventListener('mousemove', () => {
  playCometSound();
  // Reset the mouse stop timer when the mouse is moving
  clearTimeout(mouseTimeout);
  mouseTimeout = setTimeout(stopCometSound, 500); // Stop the sound 500ms after mouse stops moving
});

// Stop the sound when the mouse leaves the page
document.addEventListener('mouseleave', () => {
  stopCometSound();
});
