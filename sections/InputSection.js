class InputSection extends Section {
  settings = {
    inputType : "Additive Synth",
    harmType : "All",
    harmSlope : "1/x",
    fundFreq: 440,
    numHarm: 1,
    amplitude: 1,
    noiseFloor: -96,
    display: new Float32Array(DISPLAY_SIGNAL_SIZE),
    playback: new Float32Array(soundTimeSeconds * WEBAUDIO_MAX_SAMPLERATE),
    freq: fft.createComplexArray(),
    harmonicFreqs: new Float32Array(MAX_HARMONICS), //Array storing harmonic frequency in hz
    harmonicAmps: new Float32Array(MAX_HARMONICS), //Array storing harmonic amp  (0-1.0)
  };

  getTitle() {
    return `Input`;
  }

  getId() {
    return `inputSection`;
  }

  getSliders() {
    return this.createSlider(AudioInputTypeSlider, this.settings) +
      this.createSlider(FreqSlider, this.settings) +
      this.createSlider(NumHarmSlider, this.settings) +
      this.createSlider(AmplitudeSlider, this.settings) +
      this.createSlider(NoiseFloorSlider, this.settings)
  }

  getPanels() {
    return this.createPanel(InputSigPanel, this.settings)
      + this.createPanel(InputSigFreqPanel, this.settings);
  }

   #formantFrequencyStrength(freq, formant1, formant2, decayPerOctave) {
    if (freq < 1) {
      return 0;
    }

    let f1Decay = (formant1 > 1) ? Math.pow(decayPerOctave, Math.abs(Math.log2(formant1) - Math.log2(freq))) : 0;
    let f2Decay = (formant2 > 1) ? Math.pow(decayPerOctave, Math.abs(Math.log2(formant2) - Math.log2(freq))) : 0;

    return Math.max(f1Decay, f2Decay);
  }

  #calculateHarmonics() {
    let harmonic_number = 1;
    let harmonic_amplitude = 1;
    let invert = 1;
    let harmInc = (this.settings.harmType === "Odd" || this.settings.harmType === "Even") ? 2 : 1;


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

    for (let i = 0; i < this.settings.numHarm; i++) {

      // the amplitude of each harmonic depends on the harmonic slope setting
      if (this.settings.harmSlope === "lin") harmonic_amplitude = 1 - i / this.settings.numHarm;
      else if (this.settings.harmSlope === "1/x") harmonic_amplitude = 1 / harmonic_number;
      else if (this.settings.harmSlope === "1/x2") harmonic_amplitude = 1 / harmonic_number / harmonic_number;
      else if (this.settings.harmSlope === "flat") harmonic_amplitude = 1;
      else if (this.settings.harmSlope === "log") {
        harmonic_amplitude = Math.exp(-0.1 * (harmonic_number - 1));
      } else if (this.settings.harmSlope === "clarinet") {
        harmonic_amplitude = i < clarinetHarmonics.length ? clarinetHarmonics[i] : 0;
      } else if (this.settings.harmSlope === "vowel a") {
        harmonic_amplitude = formantFrequencyStrength(harmonic_number * this.settings.fundFreq,
          850, 1610, 0.2);
      } else if (this.settings.harmSlope === "vowel e") {
        harmonic_amplitude = formantFrequencyStrength(harmonic_number * this.settings.fundFreq,
          390, 2300, 0.2);
      } else if (this.settings.harmSlope === "vowel i") {
        harmonic_amplitude = formantFrequencyStrength(harmonic_number * this.settings.fundFreq,
          240, 2400, 0.2);
      } else if (this.settings.harmSlope === "vowel o") {
        harmonic_amplitude = formantFrequencyStrength(harmonic_number * this.settings.fundFreq,
          360, 640, 0.2);
      } else if (this.settings.harmSlope === "vowel u") {
        harmonic_amplitude = formantFrequencyStrength(harmonic_number * this.settings.fundFreq,
          250, 595, 0.2);
      }

      // In case the harmonic slope is 1/x^2 and the harmonic type is "odd",
      // by inverting every other harmonic we generate a nice triangle wave.
      if (this.settings.harmSlope === "1/x2" && this.settings.harmType === "Odd") {
        harmonic_amplitude = harmonic_amplitude * invert;
        invert *= -1;
      }

      // the frequency of each partial is a multiple of the fundamental frequency
      this.settings.harmonicFreqs[i] = harmonic_number * this.settings.fundFreq;

      // The harmonic amplitude is calculated above according to the harmonic
      // slope setting, taking into account the special case for generating a
      // triangle.
      this.settings.harmonicAmps[i] = harmonic_amplitude;

      // With harmonic type set to "even" we want the fundamental and even
      // harmonics. To achieve this, we increment the harmonic number by 1 after
      // the fundamental and by 2 after every other partial.
      if (i === 0 && this.settings.harmType === "Even") harmonic_number += 1;
      else harmonic_number += harmInc;
    }
  }

  #normalize(arr, targetAmplitude) {
    const amp = Math.max(Math.max(...arr), -Math.min(...arr));

    // normlize and apply amplitude scaling
    arr.forEach((x, n, y) => y[n] = targetAmplitude * x / amp);
  }

  #getAdditiveSynthSample(n) {
    let sample = 0;
    for (let harmonic = 0; harmonic < this.settings.numHarm; harmonic++) {
      if (this.settings.harmonicFreqs[harmonic] >= 96000 / 2) {
        // our input signal is not truly analog, but it sampled at 96k, the maximum samplerate supported in webaudio.
        // If we generate inputs at higher frequencies than that nyquist, it will create aliasing on the input.
        return sample;
      }
      let fundamental_frequency = this.settings.harmonicFreqs[0];
      let frequency = this.settings.harmonicFreqs[harmonic];
      let amplitude = this.settings.harmonicAmps[harmonic];

      // convert phase offset specified in degrees to radians
      let phase_offset = Math.PI / 180 * 0; // TODO: bring back phase slider?

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

  #getSamples(destination) {
    let sample = 0;
    if (this.settings.inputType === "Additive Synth") {
      destination.forEach((_, n, arr) => {
        arr[n] = this.#getAdditiveSynthSample(n);
      });
    } else {
      for (const [name, buffer] of Object.entries(audioSources)) {
        if (this.settings.inputType === name) {
          buffer.copyFromChannel(destination, 0, 0);
        }
      }
    }
    if (this.settings.noiseFloor > -96) {
      const noiseGain = Math.pow(10, this.settings.noiseFloor / 20);
      destination.forEach((x, n, arr) => {
        arr[n] = x + (Math.random() * 2 - 1) * noiseGain;
      });
    }
  }

  hasStandardPlayButton() {
    return true;
  }

  play() {
    console.log("play input");
    this.playWave(this.settings.playback, WEBAUDIO_MAX_SAMPLERATE);
  }

  processAudio(signal, display) {
    this.#calculateHarmonics();
    signal.data.fill(0);
    this.#getSamples(signal.data);
    this.#normalize(signal.data, this.settings.amplitude);
    if (display) {
      for (let i = 0; i < signal.data.length; i++) {
        this.settings.display[i] = signal.data[i];
      }
      fft.realTransform(this.settings.freq, this.settings.display);
      fft.completeSpectrum(this.settings.freq);
    } else {
      for (let i = 0; i < signal.data.length; i++) {
        this.settings.playback[i] = signal.data[i];
      }
    }
  }
}