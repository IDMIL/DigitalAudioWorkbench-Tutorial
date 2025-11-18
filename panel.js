// Canned documentation blurbs
//Panel class. should be extended with a drawPanel method
const log10 = Math.log(10);
function linToDB(a, a_0 = 1)
{
  return 20 * Math.log(a / a_0) / log10;
}

function getColor(num){
  return [num*666%255,num*69%255,num*420%255]
}

function magnitude(real, cplx) {
  return Math.sqrt(real * real + cplx * cplx);
}

const midline_doc='The horizontal middle line represents an amplitude of zero. ';
const time_signal_doc='Because this signal approximates a continuous analog signal in our simulation, the signal value is drawn with a simple interpolation scheme. There are currently bugs with this interpolation when zooming in (time zoom > 100%). In addition, visual aliasing may occur when viewing high frequency signals due to the limited number of pixels on the screen acting as a kind of spatial sampling process. This may appear as amplitude modulation in the plot that is not actually present in the signal. Finally, note that the amplitude of the signal is clipped to the size of the panel viewport. This visual clipping happens regardless of whether the signal itself actually exhibits clipping. ';
const lollipop_doc='Because this signal represents the discrete time output of the analog-to-digital conversion process, it is drawn with a lollipop plot where each stem represents a single sample. ';
const freq_amp_ticks_doc='Amplitude is plotted on the y-axis. Ticks on the left label the linear amplitude where 1.0 is equal to the maximum amplitude. ';
const amp_ticks_doc='Amplitude is plotted on the y-axis. Ticks on the left label the linear amplitude where +/- 1.0 is equal to the maximum amplitude. ';
const bin_amp_ticks_doc='Ticks on the right side of this plot label the numerical value assigned to a given amplitude by the simulated analog-to-digital conversion. The labels are written in hexadecimal unless the bit depth is 7 bits or lower, in which case the labels are in binary. ';
const time_ticks_doc='Time is plotted on the x-axis. ';
const freq_ticks_doc='Frequency is plotted on the x-axis. ';
const fft_doc='Because the FFT is used here, there are visual artifacts introduced by the windowing process, and the frequency resolution of the plot is inherently limited by the size of the FFT. Note that the resolution is not increased when zooming in with the frequency zoom slider. ';
const analytic_frequency_doc='Spikes are drawn at the appropriate frequency and amplitude based on the analytic definition of the signal determined by the frequency, number of harmonics, and harmonic amplitude scaling settings. As such, this plot should accurately reflect the frequency content of the signal without any influence of windowing or other considerations that would affect a discrete time fourier transform. Unfortunately, this approach does not reflect non-linear effects such as quantization and clipping, where applicable. ';


class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 1, fill = "black") {
    this.background =  background;
    this.stroke = stroke;
    this.strokeWeight = strokeWeight;
    this.fill = fill;
    this.xAxis= "Time";
    this.yAxis = "Amp";
    this.tickTextSize = 9;
    this.numTimeTicks = 8;
    this.numFreqTicks = 4;
    this.name = "Base Panel Class";
    this.description = "This is the base class that other panels inherit from. If you  can see this and you are not reading the source code right now there is probably a problem. Please open an issue or otherwise contact the project maintainers."
  }

  setup(p, width, height, settings) {
    this.settings = settings;
    this.buffer = p.createGraphics(1,1);
    this.resize(width, height);
    this.bufferInit();
    this.buffer.textFont('Helvetica',20);
    this.buffer.textAlign(p.CENTER);
  }

  resize(w, h) {
    this.buffer.resizeCanvas(w, h);
    this.xbezel = Math.max(70, w * 0.1);
    this.xbezelLeft  = 0.60 * this.xbezel;
    this.xbezelRight = 0.40 * this.xbezel;
    this.ybezel = Math.max(20, h * 0.1);
    this.halfh = h/2;
    this.plotHeight = h - 2 * this.ybezel;
    this.plotWidth = w - this.xbezel;
    this.plotLeft = this.xbezelLeft; // the x coord. of the left side of the plot
    this.plotRight = w - this.xbezelRight; // ditto of the right side of the plot
    this.plotTop = this.ybezel; // y coord. of top
    this.plotBottom = h - this.ybezel; // y coord. of bottom
  }

  bufferInit(){
    this.buffer.background(this.background);
    this.buffer.fill(this.fill);
    this.buffer.stroke(this.stroke);
    this.buffer.strokeWeight(this.strokeWeight);
  }

  drawStem(x,y,startHeight,ellipseSize =this.ellipseSize){
    let actual_y = y;
    y = (y<this.plotTop)? y=this.plotTop : (y>this.plotBottom)? y= this.plotBottom : y;
    this.buffer.line(x, startHeight, x, y);
    ellipseSize= (actual_y<this.plotTop || actual_y>this.plotBottom)? 0: ellipseSize;
    this.buffer.ellipse(x, y, ellipseSize);
  };

  setbackground(backgroundClr){ this.background = backgroundClr; }
  setStroke(strokeClr){ this.stroke = strokeClr; }
  setStrokeWeight(strokeWgt){ this.strokeWeight = strokeWgt; }
  setFill(fillClr){ this.fill = fillClr; }

  drawBorder(){
    this.buffer.stroke(this.stroke);
    this.buffer.line(this.plotLeft, this.plotTop, this.plotLeft, this.plotBottom);
    this.buffer.line(this.plotLeft, this.plotTop, this.plotRight, this.plotTop);
    this.buffer.line(this.plotRight, this.plotTop, this.plotRight, this.plotBottom);
    this.buffer.line(this.plotLeft, this.plotBottom, this.plotRight, this.plotBottom);
  }

  drawPanel(){}

  calculateNumImages() {
    // calculate the number of spectral images to draw so that the highest frequency
    // image's lowest negative harmonic is visible
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let max_harmonic = this.settings.harmonicFreqs[this.settings.harmonicFreqs.length - 1];
    let numImages = 0;
    while (numImages * sampleRate - max_harmonic < this.settings.maxVisibleFrequency)
      numImages++;
    return numImages;
  }


  drawName(){
    this.buffer.fill(this.fill);
    this.buffer.strokeWeight(0);
    this.buffer.textAlign(this.buffer.CENTER);
    this.buffer.textStyle(this.buffer.NORMAL);
    this.buffer.textFont('Helvetica',15);
    let textheight = this.buffer.textSize() + this.buffer.textDescent() + 1;
    this.buffer.text (this.name, this.plotLeft, this.plotTop - textheight, this.plotWidth, this.ybezel);
    this.buffer.strokeWeight(this.strokeWeight);
  }

  drawMidLine() {
    // this.buffer.drawingContext.setLineDash([5,5]);
    this.buffer.stroke("gray");
    this.buffer.line(this.plotLeft, this.halfh, this.plotRight, this.halfh);
    this.buffer.stroke(this.stroke);
    // this.buffer.drawingContext.setLineDash([]);
  }

  drawSignal(signal, zoom = 1)
  {
    let pixel_max = this.plotHeight/2;
    let pixel_per_fullscale = pixel_max * this.settings.ampZoom;
    this.buffer.noFill();
    //TODO: there are some artifacts here due to the way the signal is drawn, especially when zoomed in and/or large amplitude
    this.buffer.beginShape();
    this.buffer.curveTightness(1.0);
    for (let x = 0; x < this.plotWidth; x++) {
      let pixel_amp = pixel_per_fullscale * signal[Math.round(x/this.settings.timeZoom)];
      let y = this.halfh - pixel_amp;
      y = (y<this.plotTop)? y=this.plotTop : (y>this.plotBottom)? y= this.plotBottom : y=y; this.buffer.curveTightness(0.0);
      this.buffer.curveVertex(x + this.plotLeft, y);
    }
    this.buffer.endShape();
  }

  drawDiscreteSignal(signal){
    let gain = this.plotHeight/2;
    let visibleSamples = Math.floor(this.plotWidth / this.settings.downsamplingFactor/this.settings.timeZoom+1);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = Math.round(this.plotLeft + x * this.settings.downsamplingFactor*this.settings.timeZoom);
      let ypos = this.halfh - gain * signal[x]*this.settings.ampZoom;
      this.drawStem(xpos,ypos,this.halfh);
    }
  }

  drawHorizontalTick(text, height, tick_length = 5, side="left") {
    this.buffer.fill(this.fill);
    this.buffer.textFont('Helvetica', this.tickTextSize);
    this.buffer.textStyle(this.buffer.ITALIC);
    this.buffer.strokeWeight(0);
    this.buffer.textAlign(this.buffer.RIGHT);
    let tickStart = this.plotLeft - tick_length;
    let tickEnd = this.plotLeft;
    if (side === "right") {
      this.buffer.textAlign(this.buffer.LEFT);
      tickEnd = this.plotRight + tick_length;
      tickStart = this.plotRight;
      this.buffer.text(text, tickEnd + 2, height - this.tickTextSize / 2, this.buffer.width, height + this.tickTextSize / 2);
    } else {
      this.buffer.text(text, 0, height - this.tickTextSize / 2, tickStart, height + this.tickTextSize / 2);

    }

    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.line(tickStart, height,
      tickEnd, height);
  }

  drawVerticalTick(text, x, tick_length = 5) {
    if (x<this.plotLeft || x>this.plotRight) {return}
    this.buffer.fill(this.fill);
    this.buffer.textFont('Helvetica', this.tickTextSize);
    this.buffer.textAlign(this.buffer.CENTER);
    this.buffer.textStyle(this.buffer.ITALIC);
    this.buffer.strokeWeight(0);
    // we draw the text in the center of an oversized box centered over the tick
    // 20000 pixels should be more than enough for any reasonable tick text
    this.buffer.text(text, x - 10000, this.plotBottom + tick_length, 20000, this.ybezel - tick_length);
    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.line(x, this.plotBottom, x, this.plotBottom + tick_length);
  }

  drawTimeTicks(num_ticks, seconds_per_pixel) {
    let tick_jump = Math.floor((this.plotWidth) / num_ticks);
    for (let i = 0; i < num_ticks; ++i) {
      let x = i * tick_jump;
      let text = (x * seconds_per_pixel * 1000).toFixed(1) + ' ms';
      this.drawVerticalTick(text, x + this.plotLeft);
    }
  }

  drawDiracDashes() {
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let numImages = this.calculateNumImages();

    for (let image = 0; image <= numImages; image++) {
      let color = getColor(image);
      let imagehz = image * sampleRate; // frequency of a dirac comb harmonic that the input spectrum is convolved with
      let xpos = imagehz * pixels_per_hz + this.plotLeft;

      // draw the dotted line associated with this dirac comb image
      this.buffer.stroke(color);
      this.buffer.drawingContext.setLineDash([5,5]);
      this.buffer.line(xpos, this.plotTop, xpos, this.plotBottom);
      this.buffer.drawingContext.setLineDash([]);

      // label the dotted line associated with this dirac comb image
      let fstext = imagehz.toFixed(0) + ' Hz';
      this.drawVerticalTick(fstext, xpos);
    }
  }

  drawSignalAmplitudeTicks(pixel_max, num_ticks) {
    for (let i = 1; i <= num_ticks; ++i) {
      let tick_amp_pixels = i * pixel_max / num_ticks / this.settings.ampZoom;
      // let tick_amp_db = linToDB(tick_amp_pixels, pixel_max);
      this.drawHorizontalTick((tick_amp_pixels/pixel_max).toFixed(2), this.halfh - tick_amp_pixels*this.settings.ampZoom,5,"right");
      this.drawHorizontalTick((-tick_amp_pixels/pixel_max).toFixed(2), this.halfh + tick_amp_pixels*this.settings.ampZoom,5,"right");
      // this.drawHorizontalTick(tick_amp_db.toFixed(1) + 'dBFS', this.halfh - tick_amp_pixels*this.settings.ampZoom,5, "right");
      // this.drawHorizontalTick(tick_amp_db.toFixed(1) + 'dBFS', this.halfh + tick_amp_pixels*this.settings.ampZoom,5, "right");
    }
    // this.drawHorizontalTick('-inf dBFS', this.halfh, 5, "right");
    this.drawHorizontalTick('0.00', this.halfh, 5, "right");
  }

  drawSignalBinaryScaling(pixel_max, num_ticks, settings) {
    let maxInt = Math.pow(2, settings.bitDepth) - 1;
    let stepSize = (settings.quantType === "midTread") ? 2 / (maxInt - 1) : 2 / (maxInt);
    let numTicks = Math.min(num_ticks, maxInt + 1);
    let tickScale = (maxInt + 1) / numTicks;
    let pixel_per_fullscale = pixel_max * this.settings.ampZoom;
    // let stepSize = (settings.quantType == "midRise")?  2/(numTicks-1) : 2/(numTicks);

    let val = -1;
    let tick;
    let plotVal;
    for (tick = 0; tick < numTicks; tick++) {
      switch (settings.quantType) {
        case "midTread" :
          val = stepSize * Math.floor(val / stepSize + 0.5);
          break;
        case "midRise" :
          val = stepSize * (Math.floor(val / stepSize) + 0.5);
          break;
      }
      let tick_amp_pixels = val * pixel_max / num_ticks / this.settings.ampZoom;
      let pixel_amp = pixel_per_fullscale * val;
      let y = this.halfh - pixel_amp;

      if (y >= this.plotTop - .1 && y <= this.plotBottom + .1) {
        if (maxInt < 255) {
          //if under 8 bits, we can write out binary values
          this.drawHorizontalTick((Math.round(tick * tickScale)).toString(2).padStart(settings.bitDepth, "0"), y, 5, "left");
        } else {
          //draw axis labels in hex because of limited space
          this.drawHorizontalTick("0x" + (tick * tickScale).toString(16).padStart(4, "0"), y, 5, "left");
        }
        this.buffer.stroke("gray");
        this.buffer.drawingContext.setLineDash([5, 5]);
        this.buffer.line(this.plotLeft, y, this.plotRight, y);
        this.buffer.drawingContext.setLineDash([]);    // drawHorizontalTick(tick.toString(2), y,5,"left");
      }
      val = val + stepSize * tickScale;
    }
  }

}

class FreqPanel extends Panel{
  constructor(){
    super();
    this.xAxis = "Frequency";
  }

  drawPassBand() {
    let sampleRate = this.settings.sampleRate/this.settings.downsamplingFactor;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    this.buffer.strokeWeight(0);
    this.buffer.fill(235);
    let passbandcutoff = sampleRate/2;
    let passbandpixelwidth = passbandcutoff * pixels_per_hz;
    this.buffer.rect(this.plotLeft, this.plotTop, passbandpixelwidth, this.plotHeight);
    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.fill(this.fill);
  }

  drawPeak(x,height,base,colour="black"){
    height = Math.abs(height);
    this.buffer.fill(colour);
    this.buffer.stroke(colour);
    this.buffer.beginShape();
    if (x<this.plotLeft || x>this.plotRight) return;
    let x1=x-2; let x2 = x+2;
    x1 = Math.max(x1, this.plotLeft);
    x2 = Math.min(x2, this.plotRight);
    this.buffer.vertex(x1, base);
    this.buffer.vertex(x, this.plotBottom-height);
    this.buffer.vertex(x2, base);
    this.buffer.vertex(x, base);
    this.buffer.endShape();
    this.buffer.stroke(this.stroke); this.buffer.fill(this.fill);
  }

  drawFreqAmplitudeTicks(pixel_max, num_ticks) {
    for (let i = 0; i <= num_ticks; ++i) {
      let tick_amp_pixels = i * pixel_max / num_ticks / this.settings.ampZoom;
      this.drawHorizontalTick((tick_amp_pixels/pixel_max).toFixed(2), this.plotBottom - tick_amp_pixels*this.settings.ampZoom, 5, "right");
    }
  }

  drawFreqTicks(num_ticks, pixels_per_hz) {
    let hz_per_pixel = 1/pixels_per_hz;
    let tick_jump = Math.floor((this.plotWidth) / num_ticks);
    tick_jump=this.plotWidth / num_ticks
    for (let i = 0; i < num_ticks; ++i) {
      let x = i * tick_jump;
      if (x<this.plotLeft || x>this.plotRight) return;
      let text = (x * hz_per_pixel).toFixed(0) + ' Hz';
      this.drawVerticalTick(text, x + this.plotLeft);
    }
  }

  drawFFT(fft, tick='freq') {
    let gain = this.plotHeight * this.settings.ampZoom;
    let offset = 100;
    let hz_per_bin = this.settings.sampleRate / (fft.length / 2);
    // fft.length / 2 because it is an interleaved complex array
    // with twice as many elements as it has (complex) numbers
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let pixels_per_bin = pixels_per_hz * hz_per_bin;
    let num_bins = Math.round(this.plotWidth / pixels_per_bin);
    let normalize = 4/fft.length;

    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    this.drawPassBand();
    this.buffer.beginShape();
    this.buffer.vertex(this.plotLeft, this.plotBottom);
    for (let bin = 0; bin <= num_bins; bin++) {
      let xpos = pixels_per_bin * bin + this.plotLeft;
      let ypos = this.plotBottom - gain * normalize * magnitude(fft[2*bin], fft[2*bin+1]);
      this.buffer.vertex(xpos, ypos);
    }
    this.buffer.vertex(this.plotRight, this.plotBottom);
    this.buffer.endShape(this.buffer.CLOSE);
    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.stroke(this.stroke);
    this.drawBorder();
    this.drawName();
    if (tick === 'dirac')
      this.drawDiracDashes();
    else
      this.drawFreqTicks(this.numFreqTicks, pixels_per_hz);
    this.drawFreqAmplitudeTicks(this.plotHeight, 9);
  }
}

class InputSigUnfilteredPanel extends Panel {
  constructor(){
    super();
    this.name="Input Signal Time Domain (Pre-Filter)";
    this.description='This is a straightforward time domain plot of the input signal before filtering, "sampling", quantization, and "reconstruction". This signal corresponds with the authentic "analog" input to the simulated analog-to-digital conversion process. '
      + time_signal_doc + time_ticks_doc + amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    this.drawSignal(this.settings.buffers.originalUnfiltered.display);
    this.drawMidLine(this);
    this.drawName();
    this.drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    this.drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class FilterKernelPanel extends Panel {
  constructor() {
    super();
    this.name="Filter Kernel";
    this.description = 'Kernel (truncated sinc function) that is convolved with the input to lowpass filter it.'
      + time_signal_doc + time_ticks_doc + amp_ticks_doc + midline_doc;
  }

  drawPanel() {
    this.buffer.background(this.background);
    this.drawSignal(this.settings.buffers.filterKernel.display);
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    this.drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class InputSigPanel extends Panel {
  constructor(){
    super(); 
    this.name="Input Signal Time Domain (Post-Filter)";
    this.description='This is a straightforward time domain plot of the input signal before "sampling", quantization, and "reconstruction". This signal corresponds with the authentic "analog" input to the simulated analog-to-digital conversion process. ' 
      + time_signal_doc + time_ticks_doc + amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    this.drawSignal(this.settings.buffers.original.display);
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    this.drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class ReconstructedSigPanel extends Panel {
  constructor(){
    super(); 
    this.name="Reconstructed Signal Time Domain";
    this.description='This is a straightforward time domain plot of the signal output from the simulated digital-to-analog conversion process. '
      + time_signal_doc + time_ticks_doc + amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    this.drawSignal(this.settings.buffers.reconstructed.display);
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    this.drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class InputSigFreqPanel extends FreqPanel {
  constructor(){
    super();
    this.name="Input Signal Frequency Domain";
    this.description='This is a frequency domain representation of the simulated "continuous time" input signal. '
        + analytic_frequency_doc + freq_ticks_doc + passband_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    this.drawPassBand();
    // let harmInc = 1;
    // if (this.settings.harmType =="Odd" || this.settings.harmType == "Even"){ harmInc=2;}
    // let harmPeak = 1, harm =1, ampScale = 1;
    let harm =1;
    while (harm<=this.settings.numHarm){
      let hz = this.settings.harmonicFreqs[harm-1];
      let xpos = hz * pixels_per_hz + this.plotLeft;
      if (xpos > this.plotRight|| xpos< this.plotLeft) break;
      // if (this.settings.harmSlope == "lin") {ampScale = 1 - (harm-1)/(this.settings.numHarm)};
      // if (this.settings.harmSlope == "1/x") {ampScale = 1/harmPeak};
      let height = this.settings.ampZoom * this.settings.amplitude * this.plotHeight *this.settings.harmonicAmps[harm-1];
      this.drawPeak(xpos, height, this.plotBottom)
      harm+=1;
      // (harmPeak ==1 && this.settings.harmType != "Odd")? harmPeak++ : harmPeak +=harmInc;
    }


    this.drawBorder();
    this.drawFreqTicks(this, this.numFreqTicks, pixels_per_hz);
    this.drawFreqAmplitudeTicks(this, this.plotHeight, 9);
    this.drawName();
  }

}

class InputSigUnfilteredFFTPanel extends FreqPanel {
  constructor(){
    super();
    this.name = "Input Signal FFT";
    this.description='This plot shows the FFT of the input signal. ' + fft_doc + 'This plot clearly reveals one of the compromises inherent in the simulation; since everything must be represented by the computer, the ideal continuous time input signal must be approximated by a discrete time signal with a sufficiently high sampling rate. ';
  }

  drawPanel() {
    this.drawFFT(this.settings.buffers.originalUnfiltered.freq);
  }
}


class InputSigFFTPanel extends FreqPanel {
  constructor(){
    super(); 
    this.name = "Input Signal (filtered) FFT";
    this.description='This plot shows the FFT of the input signal. ' + fft_doc + 'This plot clearly reveals one of the compromises inherent in the simulation; since everything must be represented by the computer, the ideal continuous time input signal must be approximated by a discrete time signal with a sufficiently high sampling rate. ';
  }

  drawPanel() {
    this.drawFFT(this.settings.buffers.original.freq);
  }
}

class FilterKernelFFTPanel extends FreqPanel {
  constructor() {
    super();
    this.name = "Filter Kernel FFT";
    this.description='This plot shows the FFT of the filter kernel. ' + fft_doc;
  }

  drawPanel() {
    this.drawFFT(this.settings.buffers.filterKernel.freq);
  }
}

class SampledInputFFTPanel extends FreqPanel {
  constructor(){
    super();
    this.name="Sampled Signal FFT";
    this.description='This plot shows the FFT of the signal output by the simulated analog-to-digital conversion. ' + fft_doc;
  }
  drawPanel() {
    this.drawFFT(this.settings.buffers.stuffed.freq, 'dirac');
  }
}

class ReconstructedSigFFTPanel extends FreqPanel {
  constructor(){
    super();
    this.name="Reconstructed Signal FFT";
    this.description='This plot shows the FFT of the signal output by the simulated digital-to-analog conversion. ' + fft_doc + 'This plot clearly reveals one of the compromises inherent in the simulation; since everything must be represented by the computer, the ideal continuous time output signal must be approximated by a discrete time signal with a sufficiently high sampling rate. ';
  }
  drawPanel() {
    this.drawFFT(this.settings.buffers.reconstructed.freq);
  }
}

class ImpulsePanel extends Panel {
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name = "Sampling Signal Time Domain";
    this.description = 'This is a time domain plot of the dirac comb used to sample the input signal. Before quantization, the input signal is multiplied with this dirac comb; this is the "sampling" part of the analog-to-digital conversion process. '
        + time_ticks_doc;
  }
  drawPanel(){
    let base = this.plotBottom;
    let ytop = this.plotTop + 10;
    this.buffer.background(this.background);
    this.drawBorder();

    let visibleSamples = Math.floor(this.plotWidth / this.settings.downsamplingFactor/this.settings.timeZoom+1);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = this.plotLeft + x * this.settings.downsamplingFactor*this.settings.timeZoom;
      this.drawStem(xpos,ytop,base);
    }
    //I'm not sure dBs make sense here
    // drawHorizontalTick('0.0 dB', ytop);
    // drawHorizontalTick('-inf dB', base);
    this.drawHorizontalTick('1.0', ytop,5,"right");
    this.drawHorizontalTick('0.0', base,5,"right");

    this.drawTimeTicks(this.numTimeTicks, this.settings.timeZoom/(this.settings.sampleRate));
    this.drawName();
  }
}

class ImpulseFreqPanel extends FreqPanel {
  constructor(){
    super();
    this.name="Sampling Signal Frequency Domain";
    this.description = 'This is a frequency domain plot of the dirac comb used to sample the input signal. The sampling process causes the frequency content of the input signal to be convolved with the frequency response of the dirac comb, resulting in periodic images of the input signal frequency at mulitples of the sampling frequency. ';
  }
  drawPanel(){
    this.bufferInit();
    let base = this.plotBottom;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let numPeaks = Math.round(this.settings.maxVisibleFrequency / sampleRate);

    for (let peak = 0; peak <= numPeaks; peak++) {
      let hz = peak * this.settings.sampleRate / this.settings.downsamplingFactor;
      let xpos  = hz * pixels_per_hz + this.plotLeft;
      let color = getColor(peak);
      this.drawPeak(xpos, this.plotHeight, base, color)
      let text = peak.toFixed(0) + ' fs';
      this.drawVerticalTick(text, xpos);
    }

    this.drawFreqAmplitudeTicks(this.plotHeight, 9);
    this.drawBorder();
    this.drawName();
  }
}

class SampledInputPanel extends Panel{
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name="Sampled Signal Time Domain";
    this.description = lollipop_doc + time_ticks_doc + amp_ticks_doc + bin_amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    this.drawDiscreteSignal(this.settings.buffers.downsampled.display)
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this.plotHeight/2, 4);
    this.drawSignalBinaryScaling(this.plotHeight/2, 16,this.settings);

    this.drawTimeTicks(this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

const passband_doc='The frequency range below the nyquist frequency is highlighted by a light grey background. ';

class SampledInputFreqPanel extends FreqPanel{
  constructor(){ 
    super(); 
    this.name = "Sampled Signal Frequency Domain";
    this.description='This is a frequency domain representation of the output from the simulated analog-to-digital conversion process. ' + analytic_frequency_doc + 'Notice that periodic images of the input signal are present at multiples of the sampling frequency. These are later removed by the digital-to-analog conversion process, leaving only the frequency content below the Nyquist frequency (whether that content was present in the original signal or introduced by one of the period aliases at multiples of the sampling frequency, i.e. aliasing). '
      + freq_ticks_doc + passband_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    this.drawPassBand();
    this.drawDiracDashes();

    let base = this.plotBottom;
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let numImages = this.calculateNumImages();

    for (let image = 0; image <= numImages; image++) {

      let color = getColor(image);
      let imagehz = image * sampleRate; // frequency of a dirac comb harmonic that the input spectrum is convolved with

      for (let harm = 1; harm <= this.settings.numHarm; harm++) {

        let hzNegative = imagehz - this.settings.harmonicFreqs[harm-1];
        let hzPositive = imagehz + this.settings.harmonicFreqs[harm-1];

        if (hzNegative < 0) hzNegative = 0 + (0 - hzNegative); //Reflect at 0. TODO should technically use a new color.
        // don't reflect at sampleRate because we are already drawing the negative frequency images

        let positiveHeight = this.settings.ampZoom * this.settings.amplitude*this.plotHeight*this.settings.harmonicAmps[harm-1];
        let negativeHeight = this.settings.ampZoom * this.settings.amplitude*this.plotHeight*this.settings.harmonicAmps[harm-1];
        let xNegative = hzNegative * pixels_per_hz + this.plotLeft;
        let xPositive = hzPositive * pixels_per_hz + this.plotLeft;
        if (xNegative < this.plotRight) this.drawPeak(xNegative, negativeHeight, base, color);
        if (xPositive < this.plotRight) this.drawPeak(xPositive, positiveHeight, base, color);
      }
    }

    this.drawBorder();
    this.drawFreqAmplitudeTicks(this.plotHeight, 9);
    this.drawName();
  }
}

class QuantNoisePanel extends Panel{
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name ="Quantization Noise Time Domain";
    this.description = 'This plot shows the difference between the sampled signal before and after quantization, representing the error introduced by the quantization process. '
        + time_ticks_doc + amp_ticks_doc + midline_doc;
  }
  drawPanel(){
    this.buffer.background(this.background);
    this.drawDiscreteSignal(this.settings.buffers.quantNoise.display);
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this.plotHeight/2, 4);
    this.drawTimeTicks(this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class QuantNoiseFFTPanel extends FreqPanel {
  constructor(){
    super();
    this.name ="Quantization Noise FFT";
    this.description = 'This plot shows the frequency content of the error introduced by the quantization process. '
        + fft_doc + freq_ticks_doc + passband_doc;
    this.ellipseSize=2;
    this.xAxis = "Frequency";
  }
  drawPanel(){
    this.drawFFT(this.settings.buffers.quantNoise.freq);
  }
}

class DitherDistributionHistogramPanel extends Panel{
        constructor(){
            super();
            this.name = "Dither Distribution Histogram";
            this.description = 'This plot shows a histogram of the dither signal.';
            this.ellipseSize=2;
            this.xAxis = "Error";
        }

        drawPanel() {
            this.buffer.background(this.background);
            this.drawBorder();
            this.drawName();
            const x_axis_low = -1.2;
            const x_axis_high = 1.2;
            for (let i = x_axis_low; i <= x_axis_high; i += 0.2) {
                let x = Math.floor(this.plotWidth * (i - x_axis_low) / (x_axis_high - x_axis_low));
                let text = i.toFixed(1);
                this.drawVerticalTick(text, x + this.plotLeft);
            }

            let max_value = 0;
            for (const [key, value] of Object.entries(this.settings.ditherHistogram)) {
                max_value = Math.max(value, max_value)
            }
            let w = this.plotWidth / ((x_axis_high - x_axis_low) / this.settings.ditherHistogramBinSize);
            for (const [key, value] of Object.entries(this.settings.ditherHistogram)) {
                if (key >= x_axis_low && key <= x_axis_high - this.settings.ditherHistogramBinSize) {
                    let x = (key - x_axis_low) * this.plotWidth / (x_axis_high - x_axis_low) + this.plotLeft;
                    let h = value * this.plotHeight / max_value;
                    this.buffer.rect(x, this.plotBottom - h, w, h);
                }
            }
        }
}

class InputPlusSampledPanel extends Panel {
  constructor() {
    super();
    this.name = "Input with Sampled Signal Time Domain";
    this.description = 'This plot shows the input signal with the sampled signal overlayed on top. See the documentation for the input signal time domain and sampled signal time domain for more information. ';
    this.ellipseSize = 5;
  }

  drawPanel() {
    this.buffer.background(this.background);
    this.drawDiscreteSignal(this.settings.buffers.downsampled.display)
    this.buffer.stroke("gray");
    this.drawSignal(this.settings.original);
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this.plotHeight/2, 4);
    this.drawSignalBinaryScaling(this.plotHeight/2, 16,this.settings);
    this.drawTimeTicks(this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class AllSignalsPanel extends Panel {
  constructor() {
    super();
    this.name = "Input (solid), Sampled (lollipop), Reconstructed (dotted), Time Domain";
    this.description = 'This plot combines the input signal, sampled signal, and reconstructed signal time domain plots. See the documentation for each individual plot for more information. ';
    this.ellipseSize = 5;

  }

  drawPanel() {
    this.buffer.background(this.background);
    this.drawDiscreteSignal(this.settings.buffers.downsampled.display);
    this.drawSignal(this.settings.buffers.original.display);
    this.buffer.drawingContext.setLineDash([5,5]);
    this.drawSignal(this.settings.buffers.reconstructed.display);
    this.buffer.drawingContext.setLineDash([]);
    this.drawMidLine();
    this.drawName();
    this.drawSignalAmplitudeTicks(this.plotHeight/2, 4);
    this.drawTimeTicks(this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}
