const BIT_DEPTH_MAX = 16;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;
const MAX_HARMONICS = 40;
const DISPLAY_SIGNAL_SIZE = 5000;

const MAX_VISIBLE_FREQUENCY = WEBAUDIO_MAX_SAMPLERATE / 2

const fftSize = 2048;

const fft = new FFTJS(fftSize);

let globalTimeZoom = 1;
let globalAmpZoom = 1;