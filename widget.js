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

  function createBuffers() {
    return {
      playback: new Float32Array(Math.floor(WEBAUDIO_MAX_SAMPLERATE * soundTimeSeconds)),
      display: new Float32Array(displaySignalSize),
      freq: fft.createComplexArray()
    }
  }

  let settings = {
    buffers: {
      originalUnfiltered: createBuffers(),
      original: createBuffers(),
      filterKernel: createBuffers(),
      stuffed: createBuffers(),
      quantNoise: createBuffers(),
      quantNoiseStuffed: createBuffers(),
      downsampled: createBuffers(),
      reconstructed: createBuffers(),
      reconstructedFiltered: createBuffers(),
      deltaSigma: createBuffers()
    },
    amplitude: 1.0
    , inputType: "Additive Synth"
    , fundFreq: 1250 // input signal fundamental freq
    , sampleRate: WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor: 2
    , numHarm: 2 //Number of harmonics
    , harmType: "All" // Harmonic series to evaluate - Odd, even or all
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
    , filterType: "FIR"
    , reconstructionFilterOrder: 200
    , deltaSigmaStep: 0.1
    , downsampled: new Float32Array(1) // this gets re-inited when rendering waves
    , ditherHistogram: {}
    , ditherHistogramBinSize: 0.01
    , snd: undefined
    , maxVisibleFrequency: WEBAUDIO_MAX_SAMPLERATE / 2
    , freqZoom: 1.0 //X axis zoom for frequency panels
    , ampZoom: 1.0 // Y axis zoom for all panels
    , timeZoom: 1.0 // X axis zoom for signal panels
    , reconstructionFilterFrequency: -1
    , render: undefined
    , play: playWave
    , renderStages : []
    , panelProcessingObjects : []
  };

  settings.render = renderWavesImpl(settings, fft);
  return settings;
}

let panelIdLookups = {
  'input-time-domain' : InputSigUnfilteredPanel,
  'input-freq-domain' : InputSigUnfilteredFFTPanel,
  'input-filtered-time-domain' : InputSigPanel,
  'input-filtered-freq-domain' : InputSigFFTPanel,
  'sampling-time-domain' : SampledInputPanel,
  'sampling-freq-domain' : SampledInputFreqPanel,
  'dither-histogram' : DitherDistributionHistogramPanel,
  'quantization-noise' : QuantNoisePanel,
  'quantization-noise-fft' : QuantNoiseFFTPanel,
  'reconstructed' : ReconstructedSigPanel,
  'reconstructed-fft' : ReconstructedSigFFTPanel,
  'filter-kernel' : FilterKernelPanel,
  'filter-kernel-fft' : FilterKernelFFTPanel,
  'input-plus-sampled' : InputPlusSampledPanel,
  'all-signals' : AllSignalsPanel,
  'delta-mod-panel' : DeltaModPanel
}

let sliderIdLookups = {
  'audio-input-type-slider' : AudioInputTypeSlider,
  'amplitude-slider' : AmplitudeSlider,
  'frequency-slider' : FreqSlider,
  'num-harmonics-slider' : NumHarmSlider,
  'antialiasing-filter-order-slider': AntialiasingSlider,
  'filter-type-slider' : FilterTypeSlider,
  'reconstruction-filter-order-slider': ReconstructionOrderSlider,
  'reconstruction-filter-freq-slider' : ReconstructionFilterFreqSlider,
  'sample-rate-slider' : SampleRateSlider,
  'dither-slider' : DitherSlider,
  'quantization-slider' : BitDepthSlider,
  'delta-sigma-step-slider' : DeltaSigmaStepSlider,
  'time-zoom-slider' : TimeZoomSlider,
  'amp-zoom-slider' : AmpZoomSlider
}

function createWidgets() {
  loadAudioSources();
  let settings = getDefaultSettings();

  const collapseButtons = document.getElementsByClassName("collapse-button");
  for (const button of collapseButtons) {
    button.textContent = "_";
  }

  const panels = document.getElementsByClassName('panel');
  for (const panel of panels) {
    const id = panel.getAttribute('id');
    if (id in panelIdLookups) {
      const sketch = p => {
        p.panelObject = new panelIdLookups[id]();
        settings.panelProcessingObjects.push(p);
        p.setup = function () {
          let canvas = p.createCanvas(450, 300);
          p.textAlign(p.CENTER);
          canvas.parent(id)
          p.panelObject.setup(p, 450, 300, settings);
          p.windowResized();
          p.noLoop();
          p.redraw();
        };
        p.draw = function () {
          p.panelObject.repaint();
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
          p.sliderObject.onEdit();
          p.redraw();
        }
      }
      new p5(sketch, id);
    }
  }

  const sections = document.getElementsByClassName('section');
  for (const section of sections) {
    if (section.id === "input-section") {
      settings.renderStages.push(renderOriginal);
    } else if (section.id === "delta-sigma-section") {
      settings.renderStages.push(renderDeltaSigma);

    } else if (section.id === "filter-section") {
      settings.renderStages.push(applyAntialiasingFilter);
    } else if (section.id === "samplerate-section") {
      settings.renderStages.push(downsampleWithQuantization)
    } else if (section.id === "reconstructed-section") {
      settings.renderStages.push(antiImagingFilter);
    }
  }


  const playButtons = document.getElementsByClassName('play-button');

  function buttonPlayFunction(buffer) {
    settings.render(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(buffer, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  }

  for (const playButton of playButtons) {
    const id = playButton.getAttribute('id');
    if (id === "play-input") {
        playButton.onclick = () => { buttonPlayFunction(settings.buffers.originalUnfiltered.playback)};
    } else if (id === "play-filter-kernel") {
      playButton.onclick = () => { buttonPlayFunction(settings.buffers.filterKernel.playback)};
    } else if (id === "play-filtered-input") {
      playButton.onclick = () => { buttonPlayFunction(settings.buffers.original.playback)};
    } else if (id === "play-quantized-noise") {
      playButton.onclick = () => { buttonPlayFunction(settings.buffers.quantNoise.playback); };
    } else if (id === "play-reconstructed") {
      playButton.onclick = () => { buttonPlayFunction(settings.buffers.reconstructed.playback); };
    }
  }


  settings.render();
}
