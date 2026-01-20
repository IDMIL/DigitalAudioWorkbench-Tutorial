/*
<!-- note to maintainers:

This document serves as both the README for the project and as the source
code for the heart of the simulation. This is done since certain aspects of the
documentation of the project can only be adequately precise by including source
code inline; rather than duplicate the code across the documentation page and
the source document, they are kept together in one place. As such, the prose
block at the beginning and the code block at the end are carefully enclosed in
interlocking delimiters so that javascript ignores the README text and the
README pretty-prints the javascript source. Take care not to disturb these
block delimeters.

Futhermore, take care to limit the scope of the source code in this document
to only that which is essential for understanding the core of the simulation.

-->

# The Digital Audio Workbench

https://idmil.gitlab.io/course-materials/mumt203/interactive-demos 

## Introduction

The purpose of the digital audio workbench is to illustrate key concepts in
digital audio theory with interactive visualizations of each stage of the
analog-to-digial conversion (ADC) and digital-to-analog conversion (DAC)
processes.  These visualizations are inspired by demonstrations using
oscilloscopes and spectrum analyzers to compare the analog signal input into
the ADC process with the analog signal output by the DAC process, e.g.
https://youtu.be/cIQ9IXSUzuM

By experimenting with the settings of the simulation, numerous key concepts in
digital signal theory can be nicely illustrated, such as aliasing, quantization
error, critical sampling, under and oversampling, and many others.  The
interactive interface allows the simulation to be explored freely; users can
examine the signals both visually through numerous graphs, or by listening to
the test signals directly.

## Implementation

Since our demonstration takes place purely in the digital domain, we
unfortunately cannot use real continuous time analog inputs and outputs.
Instead, we simulate the ADC-DAC processes in the discrete time domain.  The
analog input and output are represented as discrete time signals with a high
sampling rate; at the time of writing, the maximum sampling rate supported
by WebAudio is 96 kHz. 

The ADC process consists of several steps, including antialiasing, sampling,
and quantization. All of these are simulated in our model: antialiasing is
achieved with a windowed sinc FIR lowpass filter of order specified by the
user; sampling is approximated by downsampling the input signal by an
integer factor; and quantization is achieved by multiplying the sampled
signal (which ranges from -1.0 to 1.0) by the maximum integer value possible
given the requested bit depth (e.g. 255 for a bit depth of 8 bits), and then
rounding every sample to the nearest integer.  The DAC process is simulated
in turn by zero stuffing and lowpass filtering the sampled and quantized
output of the ADC simultion.  

In summary, the continuous time input is simulated by a 96 kHz discrete time
signal, the sampled output of the ADC process is simulated by a downsampled
and quantized signal, and the continuous time reconstruction output by the
DAC is simulated by upsampling the "sampled" signal back to 96 kHz.  In our
tests we have found this model to be reasonable; many key concepts, such as
critical sampling, aliasing, and quantization noise are well represented in
our simulation.

For more details, the reader is encouraged to peruse the rest of the source
code in this document.  Many comments have been included to aid readers who
are unfamiliar with javascript.  Any questions you may have about the
implementation of the simulation can only be definitively answered by
understanding the source code, but please feel free to contact the project
maintainers if you have any questions.

```javascript
*/

// `renderWavesImpl` returns an anonymous function that is bound in the widget
// constructor. This is done in order to seperate the implementation of the
// simulation from the other implementation details so that this documentation
// can be more easily accessed. 

const soundTimeSeconds = 1.5;
const fadeTimeSeconds = 0.125;

let audioSources = {}

async function loadAudioSources() {
  let audioCtx = new AudioContext({sampleRate: 96000});
  sourceFiles = [
    ["/wav-samples/bach_cello.wav", "cello"],
    ["/wav-samples/drums.wav", "drums"],
    ["/wav-samples/sweep_20_4000hz.wav", "sweep"]
  ]

  for (let i = 0; i < sourceFiles.length; i++) {
    try {
      const response = await fetch(sourceFiles[i][0]);
      audioSources[sourceFiles[i][1]] = await audioCtx.decodeAudioData(await response.arrayBuffer());
    } catch (e) {
      console.error("tried to fetch " + sourceFiles[i][0], e);
    }
  }
}

function formantFrequencyStrength(freq, formant1, formant2, decayPerOctave) {
  if (freq < 1) {
    return 0;
  }

  f1Decay = (formant1 > 1) ? Math.pow(decayPerOctave, Math.abs(Math.log2(formant1) - Math.log2(freq))) : 0;
  f2Decay = (formant2 > 1) ? Math.pow(decayPerOctave, Math.abs(Math.log2(formant2) - Math.log2(freq))) : 0;

  return Math.max(f1Decay, f2Decay);
}

function calculateHarmonics(settings) {
  let harmonic_number = 1;
  let harmonic_amplitude = 1;
  let invert = 1;
  let harmInc = (settings.harmType === "Odd" || settings.harmType === "Even") ? 2 : 1;


  // data from SHARC dataset: https://web.archive.org/web/20090226034059/http://www.timbre.ws/sharc/
  const clarinetHarmonics = [
    1.0, 0.020330578512396693, 0.5368506493506493, 0.045386658795749706,
    0.39042207792207795, 0.13839728453364816, 0.49614521841794573, 0.038146399055489964,
    0.10071428571428573, 0.05957201889020071, 0.0363370720188902, 0.08095926800472256,
    0.03358028335301062, 0.046177685950413216, 0.008293978748524203, 0.026933293978748524,
    0.011124557260920896, 0.008400236127508854, 0.0048524203069657615, 0.011481700118063754,
    0.008500590318772138, 0.008288075560802834, 0.0031316410861865407, 0.0030991735537190084,
    0.0025974025974025974, 0.004126328217237308, 0.000655253837072019, 0.00017709563164108617,
    0.00012101534828807555, 0.0004309327036599764, 0.000678866587957497, 0.0006434474616292798,
    0.0004929161747343566, 0.0006463990554899646, 0.00035419126328217233, 0.00037190082644628097,
    0.0001180637544273908, 0.0005814639905548997
  ]

  const frenchHornHarmonics = [
    0.23043554773427188, 0.6242410910690718, 1.0, 0.8554861416630004,
    0.6396172459304883, 0.5116344038715354, 0.4244610646722393, 0.29865816102067755,
    0.19071271447426308, 0.1496480422349318, 0.12175758908930928, 0.07521997360316762,
    0.04647162340519138, 0.03197096348438187, 0.015767707875054996, 0.01661020677518698,
    0.009472063352397713, 0.00906291245050594, 0.009069511658600968, 0.005954685437747471,
    0.004100307963044435, 0.004392872855257369, 0.004025516937967444, 0.003570171579410471,
    0.00291684997800264, 0.0012736471623405192, 0.0020875494940607127, 0.0014672239331280246,
    0.0008205015398152222, 0.00031896172459304885, 0.00042894852617685877, 0.00042454905411350635,
    0.0002001759788825341, 0.00022657281126264847, 0.00020897492300923887, 0.00010558732952045754,
    7.259128904531456e-05, 0.0002067751869775627, 0.00014078310602727673, 6.379234491860976e-05,
    5.9392872855257375e-05, 0.00010118785745710515, 2.419709634843819e-05, 0.00011218653761548615,
    8.798944126704795e-05, 9.458864936207654e-05, 0.00012758468983721952, 4.6194456665200174e-05,
    9.238891333040035e-05, 8.139023317201936e-05, 0.0001847778266608007, 0.00015618125824901012,
    0.0001913770347558293, 0.00015618125824901012, 0.00017817861856577212, 0.0002441706995160581,
    3.7395512538495386e-05, 2.8596568411790586e-05, 0.00014738231412230534, 0.00011658600967883854,
    0.00022657281126264847, 0.00012098548174219095, 0.0001253849538055433, 0.00011218653761548615,
    5.719313682358117e-05, 5.0593928728552574e-05, 8.798944126704795e-05, 0.0001539815222173339,
    9.678838539375275e-05, 0.00016058073031236252, 0.00014518257809062912, 5.279366476022877e-05
  ];

  fluteHarmonics = [
    1.0, 0.7543711967545639, 0.1576450304259635, 0.1966977687626775,
    0.1143265720081136, 0.0762657200811359, 0.012525354969574036, 0.009004056795131846,
    0.0065091277890466535, 0.003862068965517241, 0.002328600405679513, 0.002464503042596349,
    0.002342799188640974, 0.001308316430020284, 0.0006450304259634889, 0.0001338742393509128,
    0.0010304259634888438, 0.0005436105476673428, 0.00010750507099391482, 0.0009574036511156186,
    0.000744421906693712, 0.0005578093306288032, 0.0006754563894523326, 0.00043002028397565926,
    0.0003387423935091278
  ];

  violinHarmonics = [
    0.46135830072666295, 1.0, 0.8625675423886714, 0.29511645239426126,
    0.9508216880939073, 0.2635252468790758, 0.06555617663499161, 0.03791503633314701,
    0.0403204769890069, 0.06457611328488913, 0.006828768399478293, 0.006172908514999069,
    0.0010508664058133034, 0.0038755356810136017, 0.00038382709148500094, 0.0020029811812930873,
    0.004158747903856903, 0.002397987702627166, 0.0010527296441214832, 0.0009782001117942985,
    0.0007080305571082541, 0.0008999441028507547, 0.000456493385504006, 0.0008347307620644682
  ]

  for (let i = 0; i < settings.numHarm; i++) {

    // the amplitude of each harmonic depends on the harmonic slope setting
    if (settings.harmSlope === "lin") harmonic_amplitude = 1 - i / settings.numHarm;
    else if (settings.harmSlope === "1/x") harmonic_amplitude = 1 / harmonic_number;
    else if (settings.harmSlope === "1/x2") harmonic_amplitude = 1 / harmonic_number / harmonic_number;
    else if (settings.harmSlope === "flat") harmonic_amplitude = 1;
    else if (settings.harmSlope === "log") {
      harmonic_amplitude = Math.exp(-0.1 * (harmonic_number - 1));
    } else if (settings.harmSlope === "clarinet") {
      harmonic_amplitude = i < clarinetHarmonics.length ? clarinetHarmonics[i] : 0;
    } else if (settings.harmSlope === "french horn") {
      harmonic_amplitude = i < frenchHornHarmonics.length ? frenchHornHarmonics[i] : 0;
    } else if (settings.harmSlope === "flute") {
      harmonic_amplitude = i < fluteHarmonics.length ? fluteHarmonics[i] : 0;
    } else if (settings.harmSlope === "violin") {
      harmonic_amplitude = i < violinHarmonics.length ? violinHarmonics[i] : 0;
    } else if (settings.harmSlope === "vowel a") {
      harmonic_amplitude = formantFrequencyStrength(harmonic_number * settings.fundFreq,
        850, 1610, 0.2);
    } else if (settings.harmSlope === "vowel e") {
      harmonic_amplitude = formantFrequencyStrength(harmonic_number * settings.fundFreq,
        390, 2300, 0.2);
    } else if (settings.harmSlope === "vowel i") {
      harmonic_amplitude = formantFrequencyStrength(harmonic_number * settings.fundFreq,
        240, 2400, 0.2);
    } else if (settings.harmSlope === "vowel o") {
      harmonic_amplitude = formantFrequencyStrength(harmonic_number * settings.fundFreq,
        360, 640, 0.2);
    } else if (settings.harmSlope === "vowel u") {
      harmonic_amplitude = formantFrequencyStrength(harmonic_number * settings.fundFreq,
        250, 595, 0.2);
    }

    // In case the harmonic slope is 1/x^2 and the harmonic type is "odd",
    // by inverting every other harmonic we generate a nice triangle wave.
    if (settings.harmSlope === "1/x2" && settings.harmType === "Odd") {
      harmonic_amplitude = harmonic_amplitude * invert;
      invert *= -1;
    }

    // the frequency of each partial is a multiple of the fundamental frequency
    settings.harmonicFreqs[i] = harmonic_number * settings.fundFreq;

    // The harmonic amplitude is calculated above according to the harmonic
    // slope setting, taking into account the special case for generating a
    // triangle.
    settings.harmonicAmps[i] = harmonic_amplitude;

    // With harmonic type set to "even" we want the fundamental and even
    // harmonics. To achieve this, we increment the harmonic number by 1 after
    // the fundamental and by 2 after every other partial.
    if (i === 0 && settings.harmType === "Even") harmonic_number += 1;
    else harmonic_number += harmInc;
  }
}

function getAdditiveSynthSample(settings, n) {
  sample = 0;
  for (let harmonic = 0; harmonic < settings.numHarm; harmonic++) {
    if (settings.harmonicFreqs[harmonic] >= 96000 / 2) {
      // our input signal is not truly analog, but it sampled at 96k, the maximum samplerate supported in webaudio.
      // If we generate inputs at higher frequencies than that nyquist, it will create aliasing on the input.
      return sample;
    }
    let fundamental_frequency = settings.harmonicFreqs[0];
    let frequency = settings.harmonicFreqs[harmonic];
    let amplitude = settings.harmonicAmps[harmonic];

    // convert phase offset specified in degrees to radians
    let phase_offset = Math.PI / 180 * settings.phase;

    // adjust phase offset so that harmonics are shifted appropriately
    let phase_offset_adjusted = phase_offset * frequency / fundamental_frequency;

    let radian_frequency = 2 * Math.PI * frequency;
    let phase_increment = radian_frequency / WEBAUDIO_MAX_SAMPLERATE;
    let phase = phase_increment * n + phase_offset_adjusted;

    // accumulate the amplitude contribution from the current harmonic
    sample += amplitude * Math.sin(phase);
  }
  return sample;
}

function getSamples(settings, destination) {
  let sample = 0;
  if (settings.inputType === "Additive Synth") {
    destination.forEach((_, n, arr) => {
      arr[n] = getAdditiveSynthSample(settings, n);
    });
  } else {
    for (const [name, buffer] of Object.entries(audioSources)) {
      if (settings.inputType === name) {
        buffer.copyFromChannel(destination, 0, 0);
      }
    }
  }
}

function normalize(arr, targetAmplitude) {
  const amp = Math.max(Math.max(...arr), -Math.min(...arr));

  // normlize and apply amplitude scaling
  arr.forEach((x, n, y) => y[n] = targetAmplitude * x / amp);
}

function filterSignal(signal, frequency, order, mode, filterKernel) {
  // specify the filter parameters; Fs = sampling rate, Fc = cutoff frequency

  // The cutoff for the antialiasing filter is set to the Nyquist frequency
  // of the simulated sampling process. The sampling rate of the "sampled"
  // signal is WEBAUDIO_MAX_SAMPLERATE / the downsampling factor. This is
  // divided by 2 to get the Nyquist frequency.

  if (mode === "FIR") {
    let firCalculator = new Fili.FirCoeffs();

    let filterCoeffs = firCalculator.lowpass(
      {
        order: order
        , Fs: WEBAUDIO_MAX_SAMPLERATE
        , Fc: frequency
      });

    // generate the filter
    let filter = new Fili.FirFilter(filterCoeffs);

    // apply the filter
    // filter.multiStep(signal);
    signal.forEach((x, n, y) => y[n] = filter.singleStep(x));

    // time shift the signal by half the filter order to compensate for the
    // delay introduced by the FIR filter
    const shift = order / 2;
    for (let i = 0; i < signal.length - shift; i++) {
      signal[i] = signal[i + shift];
    }
    for (let i = signal.length - shift; i < signal.length; i++) {
      signal[i] = 0;
    }

    if (filterKernel) {
      for (let i = 0; i < filterCoeffs.length; i++) {
        filterKernel[i] = filterCoeffs[i];
      }
    }
  } else if (mode === "Butterworth" || mode === "Chebyshev") {
    let iirCalculator = new Fili.CalcCascades();

    let characteristic = mode === "Butterworth" ? "butterworth" : "tschebyscheff05";

    order = mode === "Butterworth" ? Math.min(order, 12) : Math.min(order, 4);

    let filterCoeffs = iirCalculator.lowpass({
      order: order, // cascade 3 biquad filters (max: 12)
      characteristic: characteristic,
      transform: characteristic === "tschebyscheff05" ? 'matchedZ' : undefined,
      Fs: WEBAUDIO_MAX_SAMPLERATE, // sampling frequency
      Fc: frequency, // cutoff frequency / center frequency for bandpass, bandstop, peak
      preGain: false // adds one constant multiplication for highpass and lowpass
      // k = (1 + cos(omega)) * 0.5 / k = 1 with preGain == false
    });

    let filter = new Fili.IirFilter(filterCoeffs);

    signal.forEach((x, n, y) => y[n] = filter.singleStep(x));

    if (filterKernel) {
      filterKernel[0] = 1;
      let filter = new Fili.IirFilter(filterCoeffs);
      filterKernel.forEach((x, n, y) => y[n] = filter.singleStep(x));
    }
  }

  // return filterCoeffs;
}

function getDither(ditherType) {
  switch (ditherType) {
    case "Rectangular" :
      return (2 * Math.random() - 1);
    case "Triangular" :
      return (Math.random() - Math.random());
    case "Gaussian" :
      // box muller transform, mean=0 std=0.5
      return 0.5 * Math.sqrt(-2.0 * Math.log(1 - Math.random())) * Math.cos(2.0 * Math.PI * Math.random())
  }
}

function addDitherToHistogram(settings, dither) {
  const bin = Math.floor(dither / settings.ditherHistogramBinSize) * settings.ditherHistogramBinSize;
  if (bin in settings.ditherHistogram) {
    settings.ditherHistogram[bin]++;
  } else {
    settings.ditherHistogram[bin] = 1;
  }
}

function quantize(y, quantizationType, stepSize) {
  switch (quantizationType) {
    case "midTread" :
      return stepSize * Math.floor(Math.min(Math.max(-1, y, -0.99)) / stepSize + 0.5);
    case "midRise" :
      return stepSize * (Math.floor(Math.min(Math.max(-1, y, -0.99)) / stepSize) + 0.5);
  }

}

function applyFade(arr, normalize) {
  let fade = (_, n, arr) => {
    let fadeTimeSamps = Math.min(fadeTimeSeconds * WEBAUDIO_MAX_SAMPLERATE, arr.length / 2);
    // The conditional ensures there is a fade even if the fade time is longer than the signal
    if (n < fadeTimeSamps)
      arr[n] = (n / fadeTimeSamps) * arr[n] / normalize;
    else if (n > arr.length - fadeTimeSamps)
      arr[n] = ((arr.length - n) / fadeTimeSamps) * arr[n] / normalize;
    else arr[n] = arr[n] / normalize;
  };
  arr.forEach(fade);
}

// Rendering steps ----------------------------------------------------------

function renderOriginal(settings, fft, playback) {
  let original = playback ? settings.buffers.originalUnfiltered.playback : settings.buffers.originalUnfiltered.display;

  // calculate harmonics ------------------------------------------------------

  // The signal is generated using simple additive synthesis. Because of this,
  // the exact frequency content of the signal can be determined a priori based
  // on the settings. We generate this information here so that it can be used
  // not only by the synthesis process below, but also by several of the graphs
  // used to illustrate the frequency domain content of the signal.

  // We only calculate the harmonics for the simulation; it is assumed they will
  // already have been calculated earlier when rendering for playback

  if (!playback) {
    calculateHarmonics(settings);
  }

  // render original wave -----------------------------------------------------

  // initialize the signal buffer with all zeros (silence)
  original.fill(0);

  // For the sample at time `n` in the signal buffer `original`,
  // generate the sum of all the partials based on the previously calculated
  // frequency and amplitude values.
  getSamples(settings, original);

  normalize(original, settings.amplitude);
}

function renderDeltaSigma(settings, fft, playback) {
  let originalUnfiltered = playback ? settings.buffers.originalUnfiltered.playback : settings.buffers.originalUnfiltered.display;
  let deltaSigma = playback ? settings.buffers.deltaSigma.playback : settings.buffers.deltaSigma.display;
  let reconstructed = playback ? settings.buffers.reconstructed.playback : settings.buffers.reconstructed.display;

  let samplePeriod = Math.floor(settings.downsamplingFactor);
  let step = settings.deltaSigmaStep;
  let ds_state = 0;
  for (let i = 0; i < originalUnfiltered.length; i += samplePeriod) {
    if (ds_state > originalUnfiltered[i]) {
      ds_state -= step;
    } else {
      ds_state += step;
    }
    for (let j = 0; j < samplePeriod; j += 1) {
      deltaSigma[i+j] = ds_state;
      reconstructed[i+j] = ds_state;
    }
  }
}

function applyAntialiasingFilter(settings, fft, playback) {
  let originalUnfiltered = playback ? settings.buffers.originalUnfiltered.playback : settings.buffers.originalUnfiltered.display;
  let original = playback ? settings.buffers.original.playback : settings.buffers.original.display;
  let filterKernel = playback ? settings.buffers.filterKernel.playback : settings.buffers.filterKernel.display;

  // apply antialiasing filter if applicable ----------------------------------

  // The antialiasing and reconstruction filters are generated using Fili.js.
  // (https://github.com/markert/fili.js/)
  // Fili uses the windowed sinc method to generate FIR lowpass filters.
  // Like real antialiasing and reconstruction filters, the filters used in the
  // simulation are not ideal brick wall filters, but approximations.

  // apply antialiasing only if the filter order is set

  for (let i = 0; i < originalUnfiltered.length; i++) {
    original[i] = originalUnfiltered[i];
  }

  {
    let firCalculator = new Fili.FirCoeffs();

    let filterCoeffs = firCalculator.lowpass(
      {
        order: settings.antialiasing
        , Fs: WEBAUDIO_MAX_SAMPLERATE
        , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
      });
  }

  filterKernel.fill(0);

  if (settings.antialiasing > 1) {
    let cutoff = (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2;
    let order = settings.antialiasing;

    let firCalculator = new Fili.FirCoeffs();

    let filterCoeffs = firCalculator.lowpass(
      {
        order: order
        , Fs: WEBAUDIO_MAX_SAMPLERATE
        , Fc: cutoff
      });



    filterSignal(original, cutoff, order, settings.filterType, filterKernel);
  } else {
    filterKernel[0] = 1;
  }
}

function downsampleWithQuantization(settings, fft, playback) {
  // generate new signal buffers for the downsampled signal and quantization
  // noise whose sizes are initialized according to the currently set
  // downsampling factor
  let original = playback ? settings.buffers.original.playback : settings.buffers.original.display;

  if (playback) {
    settings.buffers.downsampled.playback = new Float32Array(Math.round(original.length / settings.downsamplingFactor));
    settings.buffers.quantNoise.playback = new Float32Array(Math.round(original.length / settings.downsamplingFactor));
  } else {
    settings.buffers.downsampled.display = new Float32Array(Math.round(original.length / settings.downsamplingFactor));
    settings.buffers.quantNoise.display = new Float32Array(Math.round(original.length / settings.downsamplingFactor));
  }

  let reconstructed = playback ? settings.buffers.reconstructed.playback : settings.buffers.reconstructed.display;
  let stuffed = playback ? settings.buffers.stuffed.playback : settings.buffers.stuffed.display;
  let downsampled = playback ? settings.buffers.downsampled.playback : settings.buffers.downsampled.display;
  let quantNoise = playback ? settings.buffers.quantNoise.playback : settings.buffers.quantNoise.display;
  let quantNoiseStuffed = playback ? settings.buffers.quantNoiseStuffed.playback : settings.buffers.quantNoise.display;


  // downsample original wave -------------------------------------------------

  // zero initialize the reconstruction, and zero stuffed buffers
  reconstructed.fill(0);
  stuffed.fill(0);


  quantNoiseStuffed.fill(0);

  // calculate the maximum integer value representable with the given bit depth
  let maxInt = Math.pow(2, settings.bitDepth) - 1;

  let stepSize = (settings.quantType === "midTread") ? 2 / (maxInt - 1) : 2 / (maxInt);

  // generate the output of the simulated ADC process by "sampling" (actually
  // just downsampling), and quantizing with dither. During this process, we
  // also load the buffer for the reconstructed signal with the sampled values;
  // this allows us to skip an explicit zero-stuffing step later

  if (!playback) {
    settings.ditherHistogram = {};
  }

  downsampled.forEach((_, n, arr) => {

    // keep only every kth sample where k is the integer downsampling factor
    let y = Math.min(Math.max(-1, original[n * settings.downsamplingFactor]), 1);

    let quantized;

    if (settings.bitDepth === BIT_DEPTH_MAX) {
      quantized = y;
    } else {
      let dither = getDither(settings.ditherType) * settings.dither;
      if (!playback) {
        addDitherToHistogram(settings, dither);
      }
      quantized = quantize(y + dither, settings.quantType, stepSize);
    }

    // sparsely fill the reconstruction buffer to avoid having to zero-stuff
    reconstructed[n * settings.downsamplingFactor] = quantized;
    arr[n] = y;
    stuffed[n * settings.downsamplingFactor] = quantized * settings.downsamplingFactor;

    // record the quantization error
    quantNoise[n] = quantized - y;
    quantNoiseStuffed[n * settings.downsamplingFactor] = quantNoise[n];
  });

  // To retain the correct amplitude, we must multiply the output of the
  // filter by the downsampling factor.
  reconstructed.forEach((x, n, arr) => arr[n] = x * settings.downsamplingFactor);

}

function antiImagingFilter(settings, fft, playback) {
  let reconstructed = playback ? settings.buffers.reconstructed.playback : settings.buffers.reconstructed.display;

  // render reconstructed wave by low pass filtering the zero stuffed array----
  const freq = (settings.reconstructionFilterFrequency >= 0)
    ? settings.reconstructionFilterFrequency
    : (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2;

  filterSignal(reconstructed, freq, settings.reconstructionFilterOrder, 'FIR'); // TODO: slider for order, start at 200
}

function renderWavesImpl(
  settings, fft) {
  return (playback = false) => {

    for (const stage of settings.renderStages) {
      stage(settings, fft, playback);
    }

    // render FFTs --------------------------------------------------------------

    // The FFTs of the signals at the various stages of the process are generated
    // using fft.js (https://github.com/indutny/fft.js). The call to
    // `realTransform()` performs the FFT, and the call to `completeSpectrum`
    // fills the upper half of the spectrum, which is otherwise not calculated
    // since it is a redundant reflection of the lower half of the spectrum.

    if (!playback) {
      for (const [key, value] of Object.entries(settings.buffers)) {
        fft.realTransform(value.freq, value.display);
        fft.completeSpectrum(value.freq);
      }
      for (let i = 0; i < settings.buffers.filterKernel.freq.length; ++i) {
        settings.buffers.filterKernel.freq[i] *= 452;
      }
    }

    // fade in and out and suppress clipping distortions ------------------------

    // Audio output is windowed to prevent pops. The envelope is a simple linear
    // ramp up at the beginning and linear ramp down at the end.

    // This normalization makes sure the original signal isn't clipped.
    // The output is clipped during the simulation, so this may reduce its peak
    // amplitude a bit, but since the clipping adds distortion the perceived
    // loudness is relatively the same as the original signal in my testing.

    if (playback) {
      let normalize = settings.amplitude > 1.0 ? settings.amplitude : 1.0;
      for (const [key, value] of Object.entries(settings.buffers)) {
        applyFade(value.playback, normalize);
      }
    }
  }
}