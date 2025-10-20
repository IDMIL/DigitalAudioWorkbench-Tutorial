const BIT_DEPTH_MAX = 16;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;
const MAX_HARMONICS = 40;

function playWave(wave, sampleRate, audioctx) {
  var buffer = audioctx.createBuffer(1, wave.length, sampleRate);
  buffer.copyToChannel(wave, 0, 0);
  var source = audioctx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioctx.destination);
  source.start();
}

function getDefaultSettings() {
  let fftSize = 2048;
  let displaySignalSize = 5000; // TODO: fine-tune these numbers
  let fft = new FFTJS(fftSize);

  let settings = {
    amplitude: 1.0
    , inputType: "Additive Synth"
    , fundFreq: 1250 // input signal fundamental freq
    , sampleRate: WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor: 2
    , numHarm: 2 //Number of harmonics
    , harmType: "Odd" // Harmonic series to evaluate - Odd, even or all
    , harmSlope: "1/x" // Amplitude scaling for harmonics. can be used to create different shapes like saw or square
    , harmonicFreqs: new Float32Array(MAX_HARMONICS) //Array storing harmonic frequency in hz
    , harmonicAmps: new Float32Array(MAX_HARMONICS) //Array storing harmonic amp  (0-1.0)
    , phase: 0.0 // phase offset for input signal
    , fftSize: fftSize
    , bitDepth: BIT_DEPTH_MAX //quantization bit depth
    , ditherType: "Rectangular"
    // Rectangular, Triangular, or Gaussian. distribution from which dither noise is selected.
    // See Principles of Digital Audio, Pohlmann, p. 41
    , quantType: "midRise" // type of quantization
    , dither: 0.0 // amplitude of white noise added to signal before quantization
    , antialiasing: 0 // antialiasing filter order
    , original: new Float32Array(displaySignalSize)
    , originalUnfiltered: new Float32Array(displaySignalSize)
    , filterKernel: new Float32Array(displaySignalSize)
    , downsampled: new Float32Array(1) // this gets re-inited when rendering waves
    , ditherHistogram: {}
    , ditherHistogramBinSize: 0.01
    , reconstructed: new Float32Array(displaySignalSize)
    , stuffed: new Float32Array(displaySignalSize)
    , quantNoiseStuffed: new Float32Array(displaySignalSize)
    , quantNoise: new Float32Array(displaySignalSize)
    , original_pb: new Float32Array(Math.floor(WEBAUDIO_MAX_SAMPLERATE * soundTimeSeconds))
    , reconstructed_pb: new Float32Array(Math.floor(WEBAUDIO_MAX_SAMPLERATE * soundTimeSeconds))
    , quantNoise_pb: new Float32Array(Math.floor(WEBAUDIO_MAX_SAMPLERATE * soundTimeSeconds))
    , originalFreq: fft.createComplexArray()
    , stuffedFreq: fft.createComplexArray()
    , reconstructedFreq: fft.createComplexArray()
    , quantNoiseFreq: fft.createComplexArray()
    , snd: undefined
    , maxVisibleFrequency: WEBAUDIO_MAX_SAMPLERATE / 2
    , freqZoom: 1.0 //X axis zoom for frequency panels
    , ampZoom: 1.0 // Y axis zoom for all panels
    , timeZoom: 1.0 // X axis zoom for signal panels

    , render: undefined
    , play: playWave
  };

  settings.render = renderWavesImpl(settings, fft);
  return settings;
}

let panelIdLookups = {
  'input-time-domain' : InputSigUnfilteredPanel,
  'input-freq-domain' : InputSigFreqPanel,
  'sampling-time-domain' : SampledInputPanel,
  'sampling-freq-domain' : SampledInputFreqPanel,
  'dither-histogram' : DitherDistributionHistogramPanel,
  'quantization-noise' : QuantNoisePanel,
  'quantization-noise-fft' : QuantNoiseFFTPanel,
  'reconstructed' : ReconstructedSigPanel,
  'reconstructed-fft' : ReconstructedSigFFTPanel,
  'filter-kernel' : FilterKernelPanel
}

let sliderIdLookups = {
  'audio-input-type-slider' : AudioInputTypeSlider,
  'frequency-slider' : FreqSlider,
  'num-harmonics-slider' : NumHarmSlider,
  'antialiasing-filter-order-slider': AntialiasingSlider,
  'sample-rate-slider' : SampleRateSlider,
  'dither-slider' : DitherSlider,
  'quantization-slider' : BitDepthSlider
}

function createWidgets() {
  let settings = getDefaultSettings();

  settings.render();

  const panels = document.getElementsByClassName('panel');
  for (const panel of panels) {
    const id = panel.getAttribute('id');
    if (id in panelIdLookups) {
      const sketch = p => {
        p.panelObject = new panelIdLookups[id]();
        p.setup = function () {
          let canvas = p.createCanvas(450, 300);
          p.textAlign(p.CENTER);
          canvas.parent(id)
          p.panelObject.setup(p, 450, 300, settings);
          p.windowResized();
          // p.noLoop();
        };
        p.draw = function () {
          p.panelObject.drawPanel();
          p.image(p.panelObject.buffer, 0, 0);
        };

        p.windowResized = function () {
          p.panelObject.resize(450, 300);
        };

        p.settings = settings;
      }
      new p5(sketch);
    }
  }

  const sliders = document.getElementsByClassName('slider');
  for (const slider of sliders) {
    const id = slider.getAttribute('id');
    if (id in sliderIdLookups) {
      const sketch = p => {
        p.sliderObject = new sliderIdLookups[id]();

        p.setup = function () {
          let canvas = p.createCanvas(500, 50);
          p.textAlign(p.CENTER);
          canvas.parent(id)
          p.sliderObject.setup(p, settings);
          p.sliderObject.resize(0,0,500,50);
        }


      }
      new p5(sketch, id);
    }
  }
}
