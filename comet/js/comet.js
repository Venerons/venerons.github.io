// Copyright (c) 2014 Daniele Veneroni.
// Released under GPLv3 License. See LICENSE.md for further information.
'use strict';

// ##############################################
// # FEATURES                                   #
// ##############################################
/*

CONTROLS

* Multitouch
* Mouse click-and-drag
* Computer Keyboard
* Preset save and load

SYNTH

* Poliphonic Oscillator
* 1 Sub-Oscillator
* 4 Waveforms (Sine, Sawtooth, Square, Triangle)
* Oscillator Detune
* 1 Biquad Filter
* 4 Effects (Noise Convolver, Pinking Filter, Moog Filter, BitCrusher)

ANIMATION

* Classic Linear Spectrum
* Circular Spectrum
* Inset Circular Spectrum
* Blackboard

*/
// ##############################################
// # CONTROLS                                   #
// ##############################################
/*

MOUSE

mousedown	-> start osc
mousemove	-> change pitch/filter frequency
mouseup		-> stop osc
wheel		-> pitch bend
right click	-> ???

pressure	-> velocity

---

TOUCH

touchstart	-> start osc
touchmove	-> change pitch/filter frequency
touchend	-> stop osc

pressure	-> velocity
width		-> graphic effect
height		-> graphic effect
tiltX		-> graphic effect / pitch bend
tiltY		-> graphic effect / pitch bend

---

KEYBOARD

keydown		-> start osc
keyup		-> stop osc
Z			-> octave down
X			-> octave up

???			-> velocity

---

MIDI

???

---

PROPOSALS

Proximity API			-> change pitch theremin-like
Device Orientation API	-> change pitch/filter frequency

*/
// ##############################################
// # TODO                                       #
// ##############################################
/*

* More Presets (e ricordati di aggiungere i settings degli effetti nei presets!)
* Oscillators Range (2, 4, 8, 16, 32, 64)
* Oscillators Volume (Mix)
* Noise Generators
* New Oscillator: Supersaw
* Velocity (apply volume to oscillators - use pointer pressure)
* LFO
* Filter Envelope (Attack, Decay, Sustain, Release)
* Volume Envelope (Attack, Decay, Sustain, Release)
* Custom Master Volume
* Modulation - modify filter frequency using pointer pageY OR Device Orientation API
* Pitch control with Device Orientation API
* Effects Customizable Parameters
* Effect: Delay
* Pointer visual effects (using width, height, tiltx, tilty, pressure)
* Fullscreen API
* Typed Arrays
* Ambient Light API
* Page Visibility API
* Screen Orientation API
* Speech Syntesis API - Web Speech API
* Proximity API
* Glide

*/
// ##############################################
// # SPLASH SCREEN                              #
// ##############################################

$('#splash-screen').hide().fadeIn();
setTimeout(function () {
	$('#splash-screen').fadeOut();
}, 1000);

// ##############################################
// # SYNTH                                      #
// ##############################################

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var SYNTH = {};
SYNTH.context = new AudioContext();
SYNTH.master = SYNTH.context.createGain();
SYNTH.master.gain.value = 0.5;
SYNTH.master.connect(SYNTH.context.destination);

var SOUNDSMAP = new Map();

SYNTH.addSound = function (id, frequency, velocity, filterFrequency) {

	// OSCILLATOR 1

	var osc1 = SYNTH.context.createOscillator();
	osc1.type = $('#osc1-type').val(); // todo settings
	osc1.frequency.value = frequency;
	osc1.detune.value = parseFloat($('#osc1-detune').val()); // todo settings
	osc1.start(0);
	var mix1 = SYNTH.context.createGain();
	mix1.gain.value = parseFloat($('#osc1-mix').val()); // todo settings

	// OSCILLATOR 2

	if ($('#osc2-type').val() !== 'none') {
		var osc2 = SYNTH.context.createOscillator();
		osc2.type = $('#osc2-type').val(); // todo settings
		osc2.frequency.value = frequency;
		osc2.detune.value = parseFloat($('#osc2-detune').val()); // todo settings
		osc2.start(0);

		var mix2 = SYNTH.context.createGain();
		mix2.gain.value = parseFloat($('#osc2-mix').val()); // todo settings
	}

	// VELOCITY GAIN

	var velocityGain = SYNTH.context.createGain();
	velocityGain.gain.value = velocity;

	// BIQUAD FILTER

	var filter = SYNTH.context.createBiquadFilter();
	filter.type = $('#filter-type').val(); // todo settings
	filterFrequency = filterFrequency || parseFloat($('#filter-frequency').val());
	filter.frequency.value = Math.min(filterFrequency, SYNTH.context.sampleRate / 2); // todo settings
	filter.detune.value = 0; // todo settings
	filter.Q.value = parseFloat($('#filter-quality').val()); // todo settings
	filter.gain.value = parseFloat($('#filter-gain').val()); // todo settings

	// CONNECTIONS

	osc1.connect(mix1);
	mix1.connect(velocityGain);

	if ($('#osc2-type').val() !== 'none') {
		osc2.connect(mix2);
		mix2.connect(velocityGain);
	}

	velocityGain.connect(filter);
	filter.connect(SYNTH.master);

	if (SOUNDSMAP.has(id)) {
		SYNTH.removeSound(id);
	}
	SOUNDSMAP.set(id, {
		id: id,
		osc1: { osc: osc1, mix: mix1 },
		osc2: $('#osc2-type').val() !== 'none' ? { osc: osc2, mix: mix2 } : null,
		velocity: velocityGain,
		filter: filter
	});
};

SYNTH.updateSound = function (id, frequency, velocity, filterFrequency) {
	if (SOUNDSMAP.has(id)) {
		var sound = SOUNDSMAP.get(id);
		sound.osc1.osc.frequency.value = frequency;
		if (sound.osc2 !== null) {
			sound.osc2.osc.frequency.value = frequency;
		}
		if (velocity !== null) {
			sound.velocity.gain.value = velocity;
		}
		if (filterFrequency !== null) {
			sound.filter.frequency.value = filterFrequency;
		}
	}
};

SYNTH.removeSound = function (id) {
	if (SOUNDSMAP.has(id)) {
		var sound = SOUNDSMAP.get(id);
		sound.osc1.osc.stop(0);
		sound.osc1.osc.disconnect();
		sound.osc1.mix.disconnect();
		if (sound.osc2 !== null) {
			sound.osc2.osc.stop(0);
			sound.osc2.osc.disconnect();
			sound.osc2.mix.disconnect();
		}
		sound.velocity.disconnect();
		sound.filter.disconnect();
		SOUNDSMAP.delete(id);
	}
};

// ##############################################
// # MENU                                       #
// ##############################################

$('#lfo-detune, #delay-time, #delay-feedback').knob();

$('#menu-button').on('click', function () {
	$('#menu').show();
});

$('#surface, #menu-close').on('click', function () {
	$('#menu').hide();
});

// ##############################################
// # OSCILLATORS CONTROLS                       #
// ##############################################

/*

// WHITE NOISE (PURE GENERATOR)

var bufferSize = 4096;
var whiteNoise = audioContext.createScriptProcessor(bufferSize, 1, 1);
whiteNoise.onaudioprocess = function(e) {
	var output = e.outputBuffer.getChannelData(0);
	for (var i = 0; i < bufferSize; i++) {
		output[i] = Math.random() * 2 - 1;
	}
}

// WHITE NOISE (BUFFER LOOPED - MORE EFFICIENT)

var bufferSize = 2 * audioContext.sampleRate,
	noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
	output = noiseBuffer.getChannelData(0);
for (var i = 0; i < bufferSize; i++) {
	output[i] = Math.random() * 2 - 1;
}

var whiteNoise = audioContext.createBufferSource();
whiteNoise.buffer = noiseBuffer;
whiteNoise.loop = true;
whiteNoise.start(0);

// PINK NOISE by Paul Kellet’s

var bufferSize = 4096;
var pinkNoise = (function() {
	var b0, b1, b2, b3, b4, b5, b6;
	b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
	var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
	node.onaudioprocess = function(e) {
		var output = e.outputBuffer.getChannelData(0);
		for (var i = 0; i < bufferSize; i++) {
			var white = Math.random() * 2 - 1;
			b0 = 0.99886 * b0 + white * 0.0555179;
			b1 = 0.99332 * b1 + white * 0.0750759;
			b2 = 0.96900 * b2 + white * 0.1538520;
			b3 = 0.86650 * b3 + white * 0.3104856;
			b4 = 0.55000 * b4 + white * 0.5329522;
			b5 = -0.7616 * b5 - white * 0.0168980;
			output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
			output[i] *= 0.11; // (roughly) compensate for gain
			b6 = white * 0.115926;
		}
	}
	return node;
})();

// BROWNIAN NOISE (brown noise, red noise)

var bufferSize = 4096;
var brownNoise = (function() {
	var lastOut = 0.0;
	var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
	node.onaudioprocess = function(e) {
		var output = e.outputBuffer.getChannelData(0);
		for (var i = 0; i < bufferSize; i++) {
			var white = Math.random() * 2 - 1;
			output[i] = (lastOut + (0.02 * white)) / 1.02;
			lastOut = output[i];
			output[i] *= 3.5; // (roughly) compensate for gain
		}
	}
	return node;
})();

*/

$('#osc1-detune').val(0).knob({
	min: -1200,
	max: 1200,
	step: 1,
	width: 50,
	height: 50,
	fgColor: '#FF9900',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			sound.osc1.osc.detune.value = value;
		});
	}
}).trigger('change');

$('#osc1-mix').val(1).knob({
	min: 0,
	max: 1,
	step: 0.1,
	width: 50,
	height: 50,
	fgColor: '#FF9900',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			sound.osc1.mix.gain.value = value;
		});
	}
}).trigger('change');

$('#osc2-detune').val(0).knob({
	min: -1200,
	max: 1200,
	step: 1,
	width: 50,
	height: 50,
	fgColor: '#FF9900',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			if (sound.osc2 !== null) {
				sound.osc2.osc.detune.value = value;
			}
		});
	}
}).trigger('change');

$('#osc2-mix').val(1).knob({
	min: 0,
	max: 1,
	step: 0.1,
	width: 50,
	height: 50,
	fgColor: '#FF9900',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			if (sound.osc2 !== null) {
				sound.osc2.mix.gain.value = value;
			}
		});
	}
}).trigger('change');

// ##############################################
// # BIQUAD FILTER CONTROLS                     #
// ##############################################

$('#filter-type').on('change', function () {
	SOUNDSMAP.forEach(function (sound, id) {
		sound.filter.type = $(this).val();
	});
}).trigger('change');

$('#filter-frequency').val(SYNTH.context.sampleRate / 2).knob({
	min: 40,
	max: SYNTH.context.sampleRate / 2,
	step: 1,
	width: 100,
	height: 100,
	fgColor: '#3DC186',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			sound.filter.frequency.value = value;
		});
	},
	format: function (value) {
		return value + ' Hz'
	}
}).trigger('change');

$('#filter-quality').val(0).knob({
	min: 0, // 0.0001
	max: 30, // 1000
	step: 0.03, // 0.0001
	width: 75,
	height: 75,
	fgColor: '#3DC186',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			sound.filter.Q.value = value;
		});
	}
}).trigger('change');

$('#filter-gain').val(0).knob({
	min: -40,
	max: 40,
	step: 1,
	width: 50,
	height: 50,
	fgColor: '#3DC186',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SOUNDSMAP.forEach(function (sound, id) {
			sound.filter.gain.value = value;
		});
	}
}).trigger('change');

// ##############################################
// # EFFECT CONTROLS                            #
// ##############################################

/* SIMPLE LOWPASS

var bufferSize = parseInt($('#settings-buffer').val(), 10);
var effect = (function() {
	var lastOut = 0.0;
	var node = context.createScriptProcessor(bufferSize, 1, 1);
	node.onaudioprocess = function(e) {
		var input = e.inputBuffer.getChannelData(0);
		var output = e.outputBuffer.getChannelData(0);
		for (var i = 0; i < bufferSize; i++) {
			output[i] = (input[i] + lastOut) / 2.0;
			lastOut = output[i];
		}
	}
	return node;
})();

//*/

/*

$('#effect-type').on('change', function () {
	$('#delay-settings, #moogfilter-settings, #bitcrusher-settings').hide();
	if (SYNTH.effect) {
		SYNTH.effect.disconnect();
		delete SYNTH.effect;
	}
	SYNTH.filter.disconnect();

	if ($(this).val() === 'noiseconvolver') {
		// ##############################################
		// # NOISE CONVOLVER                            #
		// ##############################################
		SYNTH.effect = (function () {
			var convolver = SYNTH.context.createConvolver(),
				noiseBuffer = SYNTH.context.createBuffer(2, 0.5 * SYNTH.context.sampleRate, SYNTH.context.sampleRate),
				left = noiseBuffer.getChannelData(0),
				right = noiseBuffer.getChannelData(1);
			for (var i = 0; i < noiseBuffer.length; i++) {
				left[i] = Math.random() * 2 - 1;
				right[i] = Math.random() * 2 - 1;
			}
			convolver.buffer = noiseBuffer;
			return convolver;
		})();
	} else if ($(this).val() === 'pinkingfilter') {
		// ##############################################
		// # PINKING FILTER                             #
		// ##############################################
		var bufferSize = parseInt($('#settings-buffer').val(), 10);
		SYNTH.effect = (function () {
			var b0, b1, b2, b3, b4, b5, b6;
			b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0);
				var output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < bufferSize; i++) {
					b0 = 0.99886 * b0 + input[i] * 0.0555179;
					b1 = 0.99332 * b1 + input[i] * 0.0750759;
					b2 = 0.96900 * b2 + input[i] * 0.1538520;
					b3 = 0.86650 * b3 + input[i] * 0.3104856;
					b4 = 0.55000 * b4 + input[i] * 0.5329522;
					b5 = -0.7616 * b5 - input[i] * 0.0168980;
					output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + input[i] * 0.5362;
					output[i] *= 0.11; // (roughly) compensate for gain
					b6 = input[i] * 0.115926;
				}
			}
			return node;
		})();
	} else if ($(this).val() === 'moogfilter') {
		// ##############################################
		// # MOOG FILTER                                #
		// ##############################################
		$('#moogfilter-settings').fadeIn();
		var bufferSize = parseInt($('#settings-buffer').val(), 10);
		SYNTH.effect = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			var in1, in2, in3, in4, out1, out2, out3, out4;
			in1 = in2 = in3 = in4 = out1 = out2 = out3 = out4 = 0.0;
			node.cutoff = 0.065; // between 0.0 and 1.0
			node.resonance = 3.99; // between 0.0 and 4.0
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0);
				var output = e.outputBuffer.getChannelData(0);
				var f = node.cutoff * 1.16;
				var fb = node.resonance * (1.0 - 0.15 * f * f);
				for (var i = 0; i < bufferSize; i++) {
					input[i] -= out4 * fb;
					input[i] *= 0.35013 * (f*f)*(f*f);
					out1 = input[i] + 0.3 * in1 + (1 - f) * out1; // Pole 1
					in1 = input[i];
					out2 = out1 + 0.3 * in2 + (1 - f) * out2; // Pole 2
					in2 = out1;
					out3 = out2 + 0.3 * in3 + (1 - f) * out3; // Pole 3
					in3 = out2;
					out4 = out3 + 0.3 * in4 + (1 - f) * out4; // Pole 4
					in4 = out3;
					output[i] = out4;
				}
			}
			return node;
		})();
	} else if ($(this).val() === 'bitcrusher') {
		// ##############################################
		// # BITCRUSHER                                 #
		// ##############################################
		$('#bitcrusher-settings').fadeIn();
		var bufferSize = parseInt($('#settings-buffer').val(), 10);
		SYNTH.effect = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.bits = 4; // between 1 and 16
			node.normfreq = 0.1; // between 0.0 and 1.0
			var step = Math.pow(1/2, node.bits);
			var phaser = 0;
			var last = 0;
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0);
				var output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < bufferSize; i++) {
					phaser += node.normfreq;
					if (phaser >= 1.0) {
						phaser -= 1.0;
						last = step * Math.floor(input[i] / step + 0.5);
					}
					output[i] = last;
				}
			};
			return node;
		})();
	}/* else if ($(this).val() === 'delay') {
		// ##############################################
		// # DELAY                                      #
		// ##############################################
		$('#delay-settings').show();
		SYNTH.effect = (function () {
			var delay = SYNTH.context.createDelay(),
				feedback = SYNTH.context.createGain();

			delay.delayTime.value = 0; // between 0 and 1 (or delay.maxDelayTime) -> 1 = 1 second/1000ms
			feedback.gain.value = 0; // beetween 0.0 and 1.0

			filter.connect(nodes.delay);
			delay.connect(nodes.feedback);
			feedback.connect(nodes.delay);
			feedback.connect(nodes.volume);

			return node;
		})();
	}
	*/
	/*

	if (SYNTH.effect) {
		SYNTH.filter.connect(SYNTH.effect);
		SYNTH.effect.connect(SYNTH.master);
	} else {
		SYNTH.filter.connect(SYNTH.master);
	}

}).trigger('change');

$('#moogfilter-cutoff').val(0.065).knob({
	min: 0,
	max: 1,
	step: 0.01,
	width: 50,
	height: 50,
	fgColor: '#37BBBA',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SYNTH.effect.cutoff = value;
	}
}).trigger('change');

$('#moogfilter-resonance').val(3.99).knob({
	min: 0,
	max: 4,
	step: 0.01,
	width: 50,
	height: 50,
	fgColor: '#37BBBA',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SYNTH.effect.resonance = value;
	}
}).trigger('change');

$('#bitcrusher-bits').val(4).knob({
	min: 1,
	max: 16,
	step: 1,
	width: 50,
	height: 50,
	fgColor: '#37BBBA',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SYNTH.effect.bits = value;
	}
}).trigger('change');

$('#bitcrusher-normfreq').val(0.1).knob({
	min: 0,
	max: 1,
	step: 0.1,
	width: 50,
	height: 50,
	fgColor: '#37BBBA',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {
		SYNTH.effect.normfreq = value;
	}
}).trigger('change');

/*
$('#delay-time').val(0).knob({
	min: 0,
	max: 1,
	step: 0.01,
	width: 50,
	height: 50,
	fgColor: '#37BBBA',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {}
}).trigger('change');

$('#delay-feedback').val(0).knob({
	min: 0,
	max: 1,
	step: 0.01,
	width: 50,
	height: 50,
	fgColor: '#37BBBA',
	angleOffset: 180,
	thickness: 0.2,
	font: 'Audiowide',
	change: function (value) {}
}).trigger('change');
*/

// ##############################################
// # GRAPHICS CONTROLS                          #
// ##############################################

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

var paper = new Palette('surface');

function adaptScreen() {
	paper.height = Math.max(document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
	paper.width = Math.max(document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth);
	paper.maxSpectrumHeight = paper.height / 4 * 3;
	paper.size(paper.width, paper.height);
}

$(window).on('resize', adaptScreen).trigger('resize');

$('#graphics-type').on('change', function () {
	var bufferSize = parseInt($('#settings-buffer').val(), 10);

	if (!SYNTH.analyser) {
		SYNTH.analyser = SYNTH.context.createAnalyser();
		SYNTH.analyser.smoothingTimeConstant = 0.3;
		SYNTH.analyser.fftSize = 512; // customizable (note: show the fftSize / 2 -> i.e. 1024 -> 512)
	} else {
		SYNTH.analyser.disconnect();
	}
	if (SYNTH.script) {
		SYNTH.script.disconnect();
		delete SYNTH.script;
	}
	if (SYNTH.animation) {
		cancelAnimationFrame(SYNTH.animation);
	}

	if ($(this).val() === 'classicspectrum') {
		// ##############################################
		// # CLASSIC SPECTRUM                           #
		// ##############################################
		SYNTH.script = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			var maxSpectrumHeight = paper.height / 4 * 3;
			node.onaudioprocess = function (e) {
				var array = new Uint8Array(SYNTH.analyser.frequencyBinCount);
				SYNTH.analyser.getByteFrequencyData(array);
				paper.clear();
				var gap = paper.width / (array.length * 2);
				for (var i = 0; i < array.length; ++i){
					var newy = paper.height - (maxSpectrumHeight * array[i] / 256);
					paper.rect({
						x: i * (gap * 2),
						y: newy,
						width: gap,
						height: paper.height,
						fill: 'hsl(' + (i * 360 / array.length) + ', 100%, 50%)'
					});
				}
			};
			return node;
		})();
	} else if ($(this).val() === 'circularspectrum') {
		// ##############################################
		// # CIRCULAR SPECTRUM                          #
		// ##############################################
		SYNTH.script = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.onaudioprocess = function () {
				var array = new Uint8Array(SYNTH.analyser.frequencyBinCount);
				SYNTH.analyser.getByteFrequencyData(array);

				var degIncrement = 360 / array.length,
					centerX = window.innerWidth / 2,
					centerY = window.innerHeight / 2,
					circleR = 80,
					maxLength = circleR * 3; //window.innerWidth < window.innerHeight ? window.innerWidth / 2 - circleR * 2: window.innerHeight / 2 - circleR * 2;

				paper.clear();

				for (var i = 0; i < array.length; ++i) {
					var angle = ((i * degIncrement) * Math.PI) / 180,
						preX = Math.cos(angle),
						preY = Math.sin(angle),
						x = centerX + preX * circleR,
						y = centerY + preY * circleR,
						barValue = (array[i] * maxLength / 512) + circleR,
						dx = centerX + preX * barValue,
						dy = centerY + preY * barValue;
					paper.line({
						x1: x,
						y1: y,
						x2: dx,
						y2: dy,
						stroke: 'hsl(' + (i * 360 / array.length) + ', 100%, 50%)',
						join: 'miter',
						thickness: 1
					});
				}
			};
			return node;
		})();
	} else if ($(this).val() === 'insetcircularspectrum') {
		// ##############################################
		// # INSET CIRCULAR SPECTRUM                    #
		// ##############################################
		SYNTH.script = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.onaudioprocess = function () {
				var array = new Uint8Array(SYNTH.analyser.frequencyBinCount);
				SYNTH.analyser.getByteFrequencyData(array);

				var degIncrement = 360 / array.length,
					centerX = window.innerWidth / 2,
					centerY = window.innerHeight / 2,
					circleR = 240,
					maxLength = circleR;

				paper.clear();

				for (var i = 0; i < array.length; ++i) {
					var angle = ((i * degIncrement) * Math.PI) / 180,
						preX = Math.cos(angle),
						preY = Math.sin(angle),
						x = centerX + preX * circleR,
						y = centerY + preY * circleR,
						barValue = -(array[i] * maxLength / 512) + circleR,
						dx = centerX + preX * barValue,
						dy = centerY + preY * barValue;
					paper.line({
						x1: x,
						y1: y,
						x2: dx,
						y2: dy,
						stroke: 'hsl(' + (i * 360 / array.length) + ', 100%, 50%)',
						join: 'miter',
						thickness: 1
					});
				}
			};
			return node;
		})();
	} else if ($(this).val() === 'blackboard') {
		// ##############################################
		// # BLACKBOARD                                 #
		// ##############################################
		var draw = function () {
			/*
			paper.context.globalAlpha = 0.5;
			paper.rect({
				x: 0,
				y: 0,
				width: paper.width,
				height: paper.height,
				fill: '#333'
			});
			paper.context.globalAlpha = 1;
			*/
			paper.clear();
			points.forEach(function (point, key) {
				paper.circle({
					x: point.x,
					y: point.y,
					r: 50,
					fill: point.color,
					shadow: '0 0 20 ' + point.color
				});
			});
			SYNTH.animation = requestAnimationFrame(draw);
		};
		SYNTH.animation = requestAnimationFrame(draw);
	}

	if (SYNTH.script) {
		SYNTH.master.connect(SYNTH.analyser);
		SYNTH.analyser.connect(SYNTH.script);
		SYNTH.script.connect(SYNTH.context.destination); // only needed by Safari, useless otherwise
	}

}).trigger('change');

// ##############################################
// # KEYBOARD                                   #
// ##############################################

function connectKeyboard(startNote) {
	var keyboard = qwertyHancock({
		id: 'keyboard',
		width: window.innerWidth,
		height: window.innerHeight / 2,
		octaves: 2,
		startNote: startNote,
		whiteNotesColour: 'white',
		blackNotesColour: 'black',
		hoverColour: '#f3e939',
		keyboardLayout: 'en'
	});

	keyboard.keyDown(function (note, frequency) {
		SYNTH.addSound('keyboard-' + note, frequency, 0.5);
	});

	keyboard.keyUp(function (note, frequency) {
		SYNTH.removeSound('keyboard-' + note);
	});

	return keyboard;
}

connectKeyboard('C4');
var keyboardFirstNote = 4;
$(window).on('keydown', function (event) {
	if (event.keyCode === 90) {
		// PRESSED Z
		keyboardFirstNote--;
		if (keyboardFirstNote < 0) {
			keyboardFirstNote = 0;
		}
		connectKeyboard('C' + keyboardFirstNote);
	} else if (event.keyCode === 88) {
		// PRESSED X
		keyboardFirstNote++;
		if (keyboardFirstNote > 9) {
			keyboardFirstNote = 9;
		}
		connectKeyboard('C' + keyboardFirstNote);
	}
});

// ##############################################
// # POINTER                                    #
// ##############################################

/*
function logPointer(e) {
	console.log(e);
	if (e.originalEvent) {
		e = e.originalEvent;
	}
	console.log(
		'TYPE: ' + e.type +
		' | pointerType: ' + e.pointerType +
		' | pointerId: ' + e.pointerId +
		' | isPrimary: ' + e.isPrimary +
		' | width: ' + e.width +
		' | height: ' + e.height +
		' | pressure: ' + e.pressure +
		' | tiltX: ' + e.tiltX +
		' | tiltY: ' + e.tiltY +
		' | button: ' + e.button +
		' | buttons: ' + e.buttons +
		' | clientX: ' + e.clientX +
		' | clientY: ' + e.clientY +
		' | pageX: ' + e.pageX +
		' | pageY: ' + e.pageY);
}
*/

var points = new Map();

$('#surface')
	.on('pointerenter pointerover', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}
	})
	.on('pointerdown', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}
		var minValue = 27.5,
			maxValue = SYNTH.context.sampleRate / 2,
			range = 1.0 - (e.pageY * 1.0 / paper.height),
			numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2,
			multiplier = Math.pow(2, numberOfOctaves * (range - 1.0)),
			filterFrequency = maxValue * multiplier;

		var minValue = 27.5,
			maxValue = 4186.01,
			range = e.pageX * 1.0 / paper.width,
			numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2,
			multiplier = Math.pow(2, numberOfOctaves * (range - 1.0)),
			frequency = maxValue * multiplier;

		SYNTH.addSound('pointer-' + e.pointerId, frequency, e.pressure, filterFrequency);

		if (!points.has(e.pointerId)) {
			var colors = [
				'#288edf', 'darkred', 'crimson', 'salmon', 'coral',
				'darkorange', 'orange', 'gold', 'palegoldenrod', 'darkolivegreen',
				'forestgreen', 'limegreen', 'lightgreen', 'mediumaquamarine', 'turquoise',
				'mediumturquoise', 'deepskyblue', 'dodgerblue', 'mediumpurple', 'blueviolet',
				'mediumvioletred'
			];
			points.set(e.pointerId, {
				id: e.pointerId,
				x: e.pageX,
				y: e.pageY,
				color: colors[Math.floor(Math.random() * colors.length)]
			});
		}
	})
	.on('pointermove', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}
		if (SOUNDSMAP.has('pointer-' + e.pointerId)) {
			var minValue = 27.5,
				maxValue = SYNTH.context.sampleRate / 2,
				range = 1.0 - (e.pageY * 1.0 / paper.height),
				numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2,
				multiplier = Math.pow(2, numberOfOctaves * (range - 1.0)),
				filterFrequency = maxValue * multiplier;

			var minValue = 27.5,
				maxValue = 4186.01,
				range = e.pageX * 1.0 / paper.width,
				numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2,
				multiplier = Math.pow(2, numberOfOctaves * (range - 1.0)),
				frequency = maxValue * multiplier;

			SYNTH.updateSound('pointer-' + e.pointerId, frequency, null, filterFrequency);

			if (points.has(e.pointerId)) {
				var point = points.get(e.pointerId);
				point.x = e.pageX;
				point.y = e.pageY;
			}
		}
	})
	.on('pointerup pointercancel pointerout pointerleave', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}

		SYNTH.removeSound('pointer-' + e.pointerId);

		if (points.has(e.pointerId)) {
			points.delete(e.pointerId);
		}
	});

// ##############################################
// # PRESET CONTROLS                            #
// ##############################################

var presets = [
	{"id":1414262050014,"name":"Default","osc1":{"type":"sine","detune":"0"},"osc2":{"type":"none","detune":"0"},"lfo":{"type":"sine","detune":"0"},"filter":{"type":"lowpass","frequency":"22050 Hz","quality":"0","gain":"0"},"effect":{"type":"none"},"graphics":{"type":"circularspectrum"},"settings":{"buffer":"2048"}},
	{"id":1414260332840,"name":"Classic Electric Bass","osc1":{"type":"sine","detune":"0"},"osc2":{"type":"sine","detune":"1200"},"lfo":{"type":"sine","detune":"0"},"filter":{"type":"lowpass","frequency":"22050 Hz","quality":"0","gain":"0"},"effect":{"type":"pinkingfilter"},"graphics":{"type":"circularspectrum"},"settings":{"buffer":"2048"}}
];

$('#preset-id').on('change', function () {
	var presetID = parseInt($(this).val(), 10),
		preset;
	for (var i = 0; i < presets.length; ++i) {
		if (presetID === presets[i].id) {
			preset = presets[i];
		}
	}
	if (preset) {
		$('#osc1-type').val(preset.osc1.type).trigger('change');
		$('#osc1-detune').val(preset.osc1.detune).trigger('change');
		$('#osc2-type').val(preset.osc2.type).trigger('change');
		$('#osc2-detune').val(preset.osc2.detune).trigger('change');
		$('#lfo-type').val(preset.lfo.type).trigger('change');
		$('#lfo-detune').val(preset.lfo.detune).trigger('change');
		$('#filter-type').val(preset.filter.type).trigger('change');
		$('#filter-frequency').val(preset.filter.frequency).trigger('change');
		$('#filter-quality').val(preset.filter.quality).trigger('change');
		$('#filter-gain').val(preset.filter.gain).trigger('change');
		$('#effect-type').val(preset.effect.type).trigger('change');
		$('#graphics-type').val(preset.graphics.type).trigger('change');
		$('#settings-buffer').val(preset.settings.buffer);
	}
}).on('update', function () {
	$(this).empty();
	for (var i = 0; i < presets.length; ++i) {
		$(this).append('<option value="' + presets[i].id + '">' + presets[i].name + '</option>');
	}
});

$('#preset-save').on('click', function () {
	var name = prompt('Preset name');
	if (name) {
		var preset = {
			id: Date.now(),
			name: name,
			osc1: {
				type: $('#osc1-type').val(),
				detune: $('#osc1-detune').val()
			},
			osc2: {
				type: $('#osc2-type').val(),
				detune: $('#osc2-detune').val()
			},
			lfo: {
				type: $('#lfo-type').val(),
				detune: $('#lfo-detune').val()
			},
			filter:  {
				type: $('#filter-type').val(),
				frequency: $('#filter-frequency').val(),
				quality: $('#filter-quality').val(),
				gain: $('#filter-gain').val()
			},
			effect: {
				type: $('#effect-type').val()
			},
			graphics: {
				type: $('#graphics-type').val()
			},
			settings: {
				buffer: $('#settings-buffer').val()
			}
		};

		presets.push(preset);
		localforage.setItem('presets', presets, function (error, value) {
			if (error) {
				console.error(error);
			} else {
				console.log('Presets saved.');
				$('#preset-id').trigger('update');
			}
		});
	}
});

$('#preset-export').on('click', function () {
	var presetID = parseInt($('#preset-id').val(), 10);
	for (var i = 0; i < presets.length; ++i) {
		if (presetID === presets[i].id) {
			alert(JSON.stringify(presets[i]));
		}
	}
});

localforage.getItem('presets', function (error, value) {
	if (error) {
		console.error(error);
	}
	if (value) {
		window.presets = value;
		$('#preset-id').trigger('update');
	}
	if (!error && !value) {
		localforage.setItem('presets', window.presets, function (error, value) {
			if (error) {
				console.error(error);
			} else {
				$('#preset-id').trigger('update');
				console.log('Presets saved.');
			}
		});
	}
});

// ##############################################
// # FIXS & UTILITIES                           #
// ##############################################

// DISABLE iOS BOUNCE
$(document).on('touchmove', function (e) {
	e.preventDefault();
});


/*

// MICROPHONE ##########

document.getElementById('microphone').addEventListener('click', function () {
	MICROPHONE_ENABLED = !MICROPHONE_ENABLED;
	if (MICROPHONE_ENABLED) {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		navigator.getUserMedia({ audio: true }, function (stream) {
			synth.microphone = synth.context.createMediaStreamSource(stream);
			synth.microphone.connect(synth.volume);
			document.getElementById('microphone').classList.remove('red');
			document.getElementById('microphone').classList.add('green');
		}, function (error) {
			MICROPHONE_ENABLED = false;
			alert('Error on getUserMedia [ERROR CODE: ' + error.code);
			throw new Error('Error on getUserMedia [ERROR CODE: ', error.code);
		});
	} else {
		synth.microphone.disconnect();
		synth.microphone = null;
		document.getElementById('microphone').classList.remove('green');
		document.getElementById('microphone').classList.add('red');
	}
}, false);

// LOOP ##########

document.getElementById('loop').addEventListener('click', function () {
	LOOP_ENABLED = !LOOP_ENABLED;
	if (LOOP_ENABLED) {
		var url = prompt('Insert Resource URL', 'http://');
		if (url) {
			document.getElementById('loop').textContent = 'Loading...';
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';
			request.onload = function() {
				synth.context.decodeAudioData(request.response, function (buffer) {
					if (synth.loop !== null) {
						synth.loop.stop(0);
						synth.loop.disconnect();
						synth.loop = null;
					}
					synth.loop = synth.context.createBufferSource();
					synth.loop.buffer = buffer;
					synth.loop.loop = true;
					synth.loop.connect(synth.volume);
					synth.loop.start(synth.context.currentTime);
					document.getElementById('loop').classList.remove('red');
					document.getElementById('loop').classList.add('green');
					document.getElementById('loop').innerHTML = '<i class="fa fa-file-audio-o">';
				}, function () {
					document.getElementById('loop').innerHTML = '<i class="fa fa-file-audio-o">';
					alert('Error on "' + url + '" decodeAudioData: decoding failed.');
				});
			};
			request.onerror = function() {
				document.getElementById('loop').innerHTML = '<i class="fa fa-file-audio-o">';
				alert('Error retrieving "' + url + '" XMLHttpRequest: request failed.');
			};
			request.send();
		}
	} else {
		synth.loop.disconnect();
		synth.loop = null;
		document.getElementById('loop').classList.remove('green');
		document.getElementById('loop').classList.add('red');
	}
}, false);

*/