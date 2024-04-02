const BIT_DEPTH_MAX = 16;
const WEBAUDIO_MAX_SAMPLERATE = 96000;  
const NUM_COLUMNS = 2;
const MAX_HARMONICS = 100;
function new_widget(panels, sliders, buttons, elem_id, elem_id2, margin_size, width_factor=1.0, height_factor=1.0) {sketch = p => {
/* 
new_widget - 

inputs:
  panels:
    list of panels to be used in the widget
    []
  sliders:
    list of panels to be used in the widget, like 
    []
  buttons:
    Tells the widget which button to have appear in the widget (play original, play reconstructed, play quantization noise)
  elem_id:
    Tells the widget in which Div class to place the buttons in (Questions or answers etc)
  elem_id2:
    Tells the widget which div with the according class name to take into account for placing the widget in height terms/
  margin_size:
    Used to place the uplaod buttons on a specific place.
  width_factor:
    By default is 1 and determines the width of the widget
  height_factor:
    By default is 1 and determines the height of the widget

*/
var element = undefined;
console.log(elem_id);
if (elem_id) {
   element = document.getElementById(elem_id);
   console.log(element.id);
   console.log(element.clientHeight, element.clientWidth);

}
var intro_text = document.getElementsByClassName(elem_id2);
var intro_height = 0;

var numPanels = panels.length;
var numSliders = sliders.length;
var old_x = 220;
let panelHeight, panelWidth, sliderWidth, sliderHeight, numColumns, contentWrap;
resize(1080, 1920);

// set display and fftSize to ensure there is enough data to fill the panels when zoomed all the way out
let fftSize = p.pow(2, p.round(p.log(panelWidth/minFreqZoom) / p.log(2)));
let displaySignalSize = p.max(fftSize, panelWidth/minTimeZoom) * 1.1; // 1.1 for 10% extra safety margin
let fft = new FFTJS(fftSize);
var settings =
    { amplitude : 1.0
    , fundFreq : 1250 // input signal fundamental freq
    , sampleRate : WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor : 2
    , downsamplingFactorDelta : 2
    , numHarm : 1 //Number of harmonics
    , harmType : "Odd" // Harmonic series to evaluate - Odd, even or all
    , harmSlope : "1/x" // Amplitude scaling for harmonics. can be used to create different shapes like saw or square
    , harmonicFreqs : new Float32Array(MAX_HARMONICS) //Array storing harmonic frequency in hz
    , harmonicAmps  : new Float32Array(MAX_HARMONICS) //Array storing harmonic amp  (0-1.0)
    , phase : 0.0 // phase offset for input signal
    , fftSize : fftSize
    , bitDepth : BIT_DEPTH_MAX //quantization bit depth
    , quantType : "midRise" // type of quantization
    , dither : 0.0 // amplitude of white noise added to signal before quantization
    , antialiasing : 0 // antialiasing filter order
    , original: new Float32Array(displaySignalSize)
    , downsampled: new Float32Array(1) // this gets re-inited when rendering waves
    , downsampledDelta: new Float32Array(1)
    , reconstructed: new Float32Array(displaySignalSize)
    , reconstructedDelta: new Float32Array(displaySignalSize)
    , stuffed: new Float32Array(displaySignalSize)
    , quantNoiseStuffed: new Float32Array(displaySignalSize)
    , quantNoiseStuffedDelta: new Float32Array(displaySignalSize)
    , quantNoise: new Float32Array(displaySignalSize)
    , original_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , reconstructed_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , reconstructedDelta_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , quantNoise_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , quantNoiseDelta_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , originalFreq : fft.createComplexArray()
    , stuffedFreq : fft.createComplexArray()
    , reconstructedFreq : fft.createComplexArray()
    , reconstructedDeltaFreq : fft.createComplexArray()
    , quantNoiseFreq : fft.createComplexArray()
    , quantNoiseDeltaFreq : fft.createComplexArray()
    , snd : undefined
    , maxVisibleFrequency : WEBAUDIO_MAX_SAMPLERATE / 2
    , freqZoom : 1.0 //X axis zoom for frequency panels
    , ampZoom : 1.0 // Y axis zoom for all panels
    , timeZoom: 1.0 // X axis zoom for signal panels
    , deltaFrequency: 96000
    , deltaStep: 0.05
    , deltaType: "non-adaptive"
    , adaptiveNumSteps: 3 //Number of consecutive steps needed to trigger adaptive delta modulation
    , element : element
    , margine_size : margin_size+20
    , p5: undefined
    , render : undefined
    , play : undefined

    };

p.settings = settings;

var renderWaves = renderWavesImpl(settings, fft, p);

p.setup = function () {
  settings.p5 = p;
  settings.render = renderWaves;
  settings.play = playWave;

  p.createCanvas(p.windowWidth, p.windowHeight+500);
  console.log(p.windowWidth,p.windowHeight)
  p.textAlign(p.CENTER);
  contentWrap = p.createDiv();
  contentWrap.id("content-wrap");
  contentWrap.position(0,100);
  contentWrap.class("title qs");
  contentWrap.elt.innerHtml = `
    <H1>
      Waveforms
    </H1>
    <hr> 
    <p id = "main page">
      Leave blank
    </p>`;

    panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));
  sliders.forEach(slider => slider.setup(p, settings));
  sliders.forEach(slider => slider.updateValue(p));
  renderWaves();
  buttonSetup();
  p.windowResized();
  p.noLoop();
  setTimeout(p.draw, 250);
};

p.draw = function() {
  console.log("Page Num:", pageNum);
  panels.forEach(panel => panel.drawPanel());
  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y+intro_height);
  });
};

p.windowResized = function() {
  console.log(p.windowWidth,p.windowHeight)
  let w = width_factor * p.windowWidth - 20; // TODO: get panel bezel somehow instead of hardcoded 20
  let h = height_factor * p.windowHeight - 20;
  resize(w, h);
  
  intro_height = contentWrap.elt.clientHeight;

  p.resizeCanvas(w, h);
  panels.forEach(panel => panel.resize(panelHeight, panelWidth));
  
  let sliderPosX = new Array(numColumns).fill(1);
  sliderPosX.forEach((pos,index)=>{
    sliderPosX[index] = 120+index*sliderWidth/numColumns + index*70;
  });
  
  yoffset = intro_height+p.ceil(numPanels/numColumns)*panelHeight+100;
  console.log("slider position", sliderPosX, yoffset);
  console.log("sliders:", sliders);
  sliders.forEach( (slider, index) => {
    let y;
    if (numColumns == 2) {y=yoffset+(p.floor(index/numColumns))*sliderHeight;}
    else {y=yoffset+index*sliderHeight;}
    slider.resize(sliderPosX[index%numColumns], y, sliderWidth/numColumns,p);
  });
  if (numColumns == 2) {y=yoffset+(p.ceil(numSliders/numColumns))*sliderHeight+30;}
  else {y=yoffset+numSliders*sliderHeight+30;}
  let x = margin_size;
  //originalButton.position(x + 20, y);
  console.log(x+20,400, yoffset);
  originalButton.position(x+20, y);
  reconstructedButton.position(originalButton.x + originalButton.width +25, originalButton.y-8);
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width +25, reconstructedButton.y);
  reconstructedDeltaButton.position(quantNoiseButton.x + quantNoiseButton.width +25, quantNoiseButton.y);
  quantNoiseDeltaButton.position(reconstructedDeltaButton.x + reconstructedDeltaButton.width +25, reconstructedDeltaButton.y);
  adaptiveSwitchButton.position(quantNoiseDeltaButton.x + quantNoiseDeltaButton.width +25, quantNoiseDeltaButton.y);
  updateButton.position(adaptiveSwitchButton.x + adaptiveSwitchButton.width +40, adaptiveSwitchButton.y);
  
  timeZoomSliderCheckbox.position(originalButton.x, originalButton.y + originalButton.height * 1.1);
  inputFrequencySliderCheckbox.position(originalButton.x, originalButton.y+2*originalButton.height*1.1);
  samplingFrequencySliderCheckbox.position(originalButton.x, originalButton.y+3*originalButton.height*1.1);
  deltaStepSliderCheckbox.position(originalButton.x, originalButton.y+4*originalButton.height*1.1);
  numHarmSliderCheckbox.position(originalButton.x, originalButton.y+5*originalButton.height*1.1);
  inputDeltaPanelCheckbox.position(originalButton.x, originalButton.y+6*originalButton.height*1.1);
  reconstructedDeltaPanelCheckbox.position(originalButton.x, originalButton.y+7*originalButton.height*1.1);
  freqPanelsCheckbox.position(originalButton.x, originalButton.y+8*originalButton.height*1.1);
};

function resize(w, h) {
  if (w < 800 || (numPanels % 2 == 1)) numColumns = 1;
  else numColumns = 2;
  let panelRows = Math.ceil((numPanels+1)/numColumns);
  let sliderRows = Math.ceil((numSliders+1)/numColumns);
  panelWidth   = w / numColumns;
  sliderWidth  = w-300//w / numColumns - 200;
  panelHeight  = h / panelRows;
  sliderHeight = 45;
  if (sliderHeight < 30) { // keep sliders from getting squished
    sliderHeight = 30;
    let sliderPanelHeight = sliderHeight * sliderRows;
    panelHeight = (h - sliderPanelHeight) / (panelRows - 1);
  }
}

function buttonSetup() {
  nextButton = p.createButton("Next Page");
  nextButton.position(p.windowWidth/2+38,13,"absolute");
  nextButton.class("button_round");
  nextButton.mousePressed( () => {
    pageNum++;
    console.log("pageNum:", pageNum);
    updatePage(pageNum);
    p.windowResized();
    redraw();
  })
  prevButton = p.createButton("Prev. Page");
  prevButton.position(p.windowWidth/2-158,13,"absolute");
  prevButton.class("button_round");
  prevButton.mousePressed( () => {
    pageNum--;
    console.log("pageNum:", pageNum);
    updatePage(pageNum);
    p.windowResized();
    redraw();
  })
  updatePage(initialPageNum);


  originalButton = p.createButton("Play original");
  originalButton.mousePressed( () => {
  renderWaves(true);
  if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
  playWave(settings.original_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  //originalButton.parent(element.id);
  if(!buttons.includes("original")){
    originalButton.hide();
  }
  originalButton.class("button");
  
  reconstructedButton = p.createButton("Play reconstructed");
  reconstructedButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructed_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  reconstructedButton.parent(element.id);
  if(!buttons.includes("recon")){
    reconstructedButton.hide();
  }
  reconstructedButton.class("button");

  quantNoiseButton = p.createButton("Play quantization noise");
  quantNoiseButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.quantNoise_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  quantNoiseButton.parent(element.id);
  if(!buttons.includes("quant")){
    quantNoiseButton.hide();
  }
  quantNoiseButton.class("button");

  reconstructedDeltaButton = p.createButton("Play reconstructed delta modulation");
  reconstructedDeltaButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructedDelta_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  reconstructedDeltaButton.parent(element.id);
  if(!buttons.includes("reconDelta")){
    reconstructedDeltaButton.hide();
  }
  reconstructedDeltaButton.class("button");

  quantNoiseDeltaButton = p.createButton("Play quantization noise");
  quantNoiseDeltaButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.quantNoiseDelta_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  quantNoiseDeltaButton.parent(element.id);
  if(!buttons.includes("quantDelta")){
    quantNoiseDeltaButton.hide();
  }
  quantNoiseDeltaButton.class("button");

  adaptiveSwitchButton = p.createButton("Switch to adaptive modulation");
  adaptiveSwitchButton.mousePressed( () => {
    if (settings.deltaType == "adaptive") {settings.deltaType = "non-adaptive";adaptiveSwitchButton.html("Switch to adaptive modulation");}
    else {settings.deltaType = "adaptive";adaptiveSwitchButton.html("Switch to non-adaptive modulation");}
    settings.render();
    settings.p5.draw();
  });
  adaptiveSwitchButton.parent(element.id);
  if(!buttons.includes("adaptive")){
    adaptiveSwitchButton.hide();
  }
  adaptiveSwitchButton.class("button");

  timeZoomSliderCheckbox = p.createCheckbox("Time Zoom Slider");
  timeZoomSliderCheckbox.parent(element.id);
  inputFrequencySliderCheckbox = p.createCheckbox("Input Frequency Slider", true);
  inputFrequencySliderCheckbox.parent(element.id);
  samplingFrequencySliderCheckbox = p.createCheckbox("Sampling Frequency Slider", true);
  samplingFrequencySliderCheckbox.parent(element.id);
  deltaStepSliderCheckbox = p.createCheckbox("Delta Step", true);
  deltaStepSliderCheckbox.parent(element.id);
  numHarmSliderCheckbox = p.createCheckbox("Harmonics Slider", true);
  numHarmSliderCheckbox.parent(element.id);
  inputDeltaPanelCheckbox = p.createCheckbox("Input with Delta Modulation Panel", true);
  inputDeltaPanelCheckbox.parent(element.id);
  reconstructedDeltaPanelCheckbox = p.createCheckbox("Reconstruction with Delta Modulation Panel", true);
  reconstructedDeltaPanelCheckbox.parent(element.id);
  freqPanelsCheckbox = p.createCheckbox("Frequency Domain Panels", true);
  freqPanelsCheckbox.parent(element.id);
  updateButton = p.createButton("Add/Remove Widgets");
  updateButton.mousePressed( () => {
    updatePanel(panels, "Input Signal Time Domain with Delta Modulation", inputDeltaPanelCheckbox.checked());
    updatePanel(panels, "Input Signal Frequency Domain", freqPanelsCheckbox.checked());
    updatePanel(panels, "Reconstructed Signal Time Domain", reconstructedDeltaPanelCheckbox.checked());
    updatePanel(panels, "Reconstructed Signal FFT", freqPanelsCheckbox.checked());
    
    /*updatePanel(panels, "Input Signal Time Domain", true);
    updatePanel(panels, "Sampled Signal FFT", true);
    updatePanel(panels, "Sampling Signal Time Domain", true);
    updatePanel(panels, "Sampling Signal Frequency Domain", true);
    updatePanel(panels, "Sampled Signal Time Domain", true);
    updatePanel(panels, "Sampled Signal Frequency Domain", true);
    updatePanel(panels, "Quantization Noise Time Domain", true);
    updatePanel(panels, "Quantization Noise FFT", true);
    updatePanel(panels, "Input with Sampled Signal Time Domain", true);
    updatePanel(panels, "Input (solid), Sampled (lollipop), Reconstructed (dotted), Time Domain", true);*/


    updateSlider(sliders, "timeZoom", timeZoomSliderCheckbox.checked());
    updateSlider(sliders, "fundFreq", inputFrequencySliderCheckbox.checked());
    updateSlider(sliders, "downsamplingFactor", samplingFrequencySliderCheckbox.checked());
    updateSlider(sliders, "deltaStep", deltaStepSliderCheckbox.checked());
    updateSlider(sliders, "numHarm", numHarmSliderCheckbox.checked());

    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);
    updateSlider(sliders, "", true);

    reorderPanels();
    reorderSliders();

    redraw();
  });
  updateButton.parent(element.id);
  if (!buttons.includes("options")) {
    timeZoomSliderCheckbox.hide();
    inputFrequencySliderCheckbox.hide();
    samplingFrequencySliderCheckbox.hide();
    deltaStepSliderCheckbox.hide();
    numHarmSliderCheckbox.hide();
    inputDeltaPanelCheckbox.hide();
    reconstructedDeltaPanelCheckbox.hide();
    freqPanelsCheckbox.hide();
    updateButton.hide();
  }

  text = p.select("main page");
  console.log("text: ", text);
  //nextButton.mousePressed( () => {console.log("does this work?");});
}


function redraw() {
  settings.p5.windowResized();     
  settings.render();
  settings.p5.draw();
}

function updatePanel(panels, name, checkBoxState) {
  if (checkBoxState) {//Add the given panel if not present
    let panelPresent = false;
    for (let i=0;i<numPanels;i++) {
      if (panels[i].name == name) {
        panelPresent = true;
        break;
      }
    }
    if (!panelPresent) {
      //Replace/add lines for more options
      if (name == "Input Signal Time Domain with Delta Modulation") {panels.push(new deltaModPanel());}
      if (name == "Input Signal Frequency Domain") {panels.push(new inputSigFreqPanel());}
      if (name == "Reconstructed Signal Time Domain") {panels.push(new reconstructedSigPanel());}
      if (name == "Reconstructed Signal FFT") {panels.push(new reconstructedSigFFTPanel());}
      if (name == "Reconstructed Signal Time Domain using Delta Modulation") {panels.push(new reconstructedDeltaModSigPanel());}
      if (name == "Reconstructed Signal using Delta Modulation FFT") {panels.push(new reconstructedDeltaModSigFFTPanel());}
      if (name == "Input Signal Time Domain") {panels.push(new inputSigPanel());}
      if (name == "Sampled Signal FFT") {panels.push(new sampledInputFFTPanel());}
      if (name == "Sampling Signal Time Domain") {panels.push(new impulsePanel());}
      if (name == "Sampling Signal Frequency Domain") {panels.push(new impulseFreqPanel());}
      if (name == "Sampled Signal Time Domain") {panels.push(new sampledInputPanel());}
      if (name == "Sampled Signal Frequency Domain") {panels.push(new sampledInputFreqPanel());}
      if (name == "Quantization Noise Time Domain") {panels.push(new quantNoisePanel());}
      if (name == "Quantization Noise FFT") {panels.push(new quantNoiseFFTPanel());}
      if (name == "Input with Sampled Signal Time Domain") {panels.push(new inputPlusSampledPanel());}
      if (name == "Input (solid), Sampled (lollipop), Reconstructed (dotted), Time Domain") {panels.push(new allSignalsPanel());}

      
      //reorderPanels();
      //console.log(panels);
      /* temp = panels[0]
      panels[0] = panels[1]
      panels[1] = temp */


      numPanels++;
      let w = width_factor * settings.p5.windowWidth - 20;
      let h = height_factor * settings.p5.windowHeight - 20;
      resize(w, h);
      panels[numPanels-1].setup(settings.p5, panelHeight,panelWidth,settings);
    }
  } else {//Remove the given panel if present
    let panelIndex = -1;
    for (let i=0;i<numPanels;i++) {
      if (panels[i].name == name) {
        panelIndex=i;
        break;
      }
    }
    if (panelIndex != -1) {
      panels[panelIndex].buffer.remove();

      panels.splice(panelIndex,1);
      //panels = reorderPanels(panels);
      console.log(panels);
      numPanels--;
      settings.p5.windowResized();
    }
  }
}

function updateSlider(sliders, propName, checkBoxState) {
  if (checkBoxState) {//Add the given slider if not present
    let sliderPresent = false;
    for (let i=0;i<numSliders;i++) {
      if (sliders[i].propName == propName) {
        sliderPresent = true;
        break;
      }
    }
    if (!sliderPresent) {
      //Replace/add lines for more options
      if (propName == "timeZoom") {sliders.push(new timeZoomSlider());}
      if (propName == "fundFreq") {sliders.push(new freqSlider());}
      if (propName == "downsamplingFactor") {sliders.push(new sampleRateSlider());}
      if (propName == "downsamplingFactorDelta") {sliders.push(new sampleRateDeltaSlider());}
      if (propName == "deltaStep") {sliders.push(new deltaStepSlider());}
      if (propName == "numHarm") {sliders.push(new numHarmSlider());}
      if (propName == "phase") {sliders.push(new phaseSlider());}
      /*if (propName == "") {sliders.push(new ());}
      if (propName == "") {sliders.push(new ());}
      if (propName == "") {sliders.push(new ());}
      if (propName == "") {sliders.push(new ());}
      if (propName == "") {sliders.push(new ());}
      if (propName == "") {sliders.push(new ());}*/

      numSliders++;
      sliders[numSliders-1].setup(settings.p5, settings);
      sliders[numSliders-1].updateValue(settings.p5);
    }
  } else {//Remove the given slider if present
    let sliderIndex = -1;
    for (let i=0;i<numSliders;i++) {
      if (sliders[i].propName == propName) {
        sliderIndex=i;
        break;
      }
    }
    if (sliderIndex != -1) {
      sliders[sliderIndex].slider.remove();
      sliders[sliderIndex].textBox.remove();
      sliders[sliderIndex].textLabel.remove();
      sliders[sliderIndex].button.remove();
      if (propName == "numHarm") {
        sliders[sliderIndex].oddEvenSel.remove();
        sliders[sliderIndex].slopeSel.remove();
      }

      sliders.splice(sliderIndex,1);
      console.log(sliders);
      numSliders--;
    }
  }
}

function reorderPanels() {
  panelNames = [];
  for (let i=0;i<panels.length;i++) {
    panelNames.push(panels[i].name);
  }
  reorderedPanelNames = [];
  //The first panel should be input signal time domain, if present
  if (panelNames.includes("Input Signal Time Domain")) {
    reorderedPanelNames.push("Input Signal Time Domain");
    //Add the frequency domain if present
    if (panelNames.includes("Input Signal Frequency Domain")) {
      reorderedPanelNames.push("Input Signal Frequency Domain");
    }
  }
  if (panelNames.includes("Input Signal Time Domain with Delta Modulation")) {
    reorderedPanelNames.push("Input Signal Time Domain with Delta Modulation");
    //Add the frequency domain if present
    if (panelNames.includes("Input Signal Frequency Domain")) {
      reorderedPanelNames.push("Input Signal Frequency Domain");
    }
  }
  //The next panels should be the reconstruction
  if (panelNames.includes("Reconstructed Signal Time Domain")) {
    reorderedPanelNames.push("Reconstructed Signal Time Domain");
    //Add the frequency domain if present
    if (panelNames.includes("Reconstructed Signal FFT")) {
      reorderedPanelNames.push("Reconstructed Signal FFT");
    }
  }
  for (let i=0;i<reorderedPanelNames.length; i++) {
    for (let j=0;j<panels.length;j++) {
      if (panels[j].name == reorderedPanelNames[i]) {
        temp = panels[i];
        panels[i] = panels[j];
        panels[j]=temp;
        break;
      }
    }
  }
  //console.log("Got", panels, "returned", reorderedPanels)
  return;
}

function reorderSliders() {
  sliderNames = [];
  for (let i=0;i<sliders.length;i++) {
    sliderNames.push(sliders[i].propName);
  }
  reorderedSliderNames = [];
  //The first slider should be frequency of the input signal, if present
  if (sliderNames.includes("fundFreq")) {
    reorderedSliderNames.push("fundFreq");
  }
  //The next slider should be the harmonics
  if (sliderNames.includes("numHarm")) {
    reorderedSliderNames.push("numHarm");
  }
  for (let i=0;i<reorderedSliderNames.length; i++) {
    for (let j=0;j<sliders.length;j++) {
      if (sliders[j].propName == reorderedSliderNames[i]) {
        temp = sliders[i];
        sliders[i] = sliders[j];
        sliders[j]=temp;
        break;
      }
    }
  }
  //console.log("Got", sliders, "returned", reorderedSliders)
  return;
}

function playWave(wave, sampleRate, audioctx) {
  var buffer = audioctx.createBuffer(1, wave.length, sampleRate);
  buffer.copyToChannel(wave, 0, 0);
  var source = audioctx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioctx.destination);
  source.start();
}

function downloadWave(wave, sampleRate, audioctx) {

}

//These define the different pages, which edit the text and panels/sliders whenever the next/prev buttons are pressed
function updatePage(pageNum) {
  switch(pageNum) {
    //Chapter 1: Waveform Building
    case 0:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 1: Waveform Building
      </H1>
      <hr> 
      Let's start with the basics. A sound is created by a <i>variation of pressure</i> through the air (or some other medium).<br>
      The characteristics of this sound depend on the characteristics of the variation. <br>
      If the variation of pressure (i.e. the <i>amplitude</i>) is very large, the sound will be loud. <br>
      If the pressure changes rapidly, we say that the sound signal has a high <i>frequency</i>, and the pitch will be high.<br><br>
      In order to visualize a sound, we usually plot its amplitude as a function of time. The simplest such sound is a <i>sine wave</i>, which looks like the function in the panel below.<br>
      A sine wave only has one frequency at a certain amplitude, and can be written as: (amplitude)*sin(frequency*time)<br>
      Try playing around with the frequency slider below and press the "Play original" button to see what it sounds like.<br>
      <b>Careful not to hurt your ears!</b>`;
      updatePanel(panels, "Input Signal Frequency Domain", false);
      break;
    case 1:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 1: Waveform Building
      </H1>
      <hr> 
      In the right panel, a vertical line at 440 Hz represents the sine wave frequency component.<br> 
      Remember that a sine (or a cosine) wave has only one frequency component.<br>
      In other words, it represents a <i>simple harmonic motion</i> such as the motion of an ideal pendulum or a tuning fork.`;
      settings.fundFreq = 440;
      updatePanel(panels, "Input Signal Frequency Domain", true);
      updateSlider(sliders, "numHarm", false);
      break;
    case 2:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 1: Waveform Building
      </H1>
      <hr>
      However, in the real world, sounds aren't just composed of a single frequency component. Usually, on top of the main frequency, sounds will also have a multitude of smaller<br> frequency components called <i>harmonics</i>, situated at integer multiples of the original frequency.<br>
      You may now add harmonics to the generated waveforms. You may choose to have only even or odd-integer harmonics, as well as different harmonic schemes.<br>
      Try playing around with the parameters. Can you build a waveform with:
      <ul>
      <li>Square Waves?</li>
      <li>Triangular Waves?</li>
      <li>Sawtooth Waves?</li>
      </ul>
      What do each of these sound like?
      `;
      updateSlider(sliders, "numHarm", true);
      updatePanel(panels, "Sampling Signal Time Domain", false);
      updateSlider(sliders, "downsamplingFactor", false);
      updatePanel(panels, "Input with Sampled Signal Time Domain", false);
      break;

    //Chapter 2: Sampling a Waveform in the Time Domain
    case 3:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 2: Sampling a Waveform in the Time Domain
      </H1>
      <hr>
      We're now interested in what happens when trying to record a signal in the real world. For sound, an input signal would be some kind of continuous signal, whether analogue<br>
      or acoustic and would be captured either directly or by a microphone. In this case, we have a sinusoidal waveform.<br> 
      Before the continuous signal can be converted into a set of 0's and 1's, it must be sampled. A simple one-dimensional sampling system would be represented by: y[n] = x(nT<sub>s</sub>)<br>
      This means that we simply measure the amplitude of the signal every T<sub>s</sub> seconds.
      The bottom right panel represents said sampling method (the <i>impulse train</i>) that will poll the input x at time [n].<br>
      The bottom left panel shows the resulting samples with amplitudes corresponding to the polled input signal.
      `;
      settings.numHarm = 1;
      updateSlider(sliders, "numHarm", false);
      updateSlider(sliders, "downsamplingFactor", true);
      updatePanel(panels, "Input with Sampled Signal Time Domain", true);
      updatePanel(panels, "Sampling Signal Time Domain", true);
      reconstructedButton.hide();
      break;
    case 4:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 2: Sampling a Waveform in the Time Domain
      </H1>
      <hr>
      After having measured the amplitude at each point shown, we will end up with a sequence of numbers representing our sound. Once converted to binary, this will be our sound file.<br>
      From there, we can reconstruct what we think the input sound is. You may now listen to the reconstruction using the button below the page.
      `;
      reconstructedButton.show();
      break;
    case 5:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 2: Sampling a Waveform in the Time Domain
      </H1>
      <hr>
      Try putting the sample rate to its minimum value. What do you see happening in the polled input signal?
      `;
      break;
    case 6:
      contentWrap.elt.innerHTML = `
      <H1>
        Chapter 2: Sampling a Waveform in the Time Domain
      </H1>
      <hr>
      From now on, we will also show you the frequency domain of the reconstructed waveform. This is what we think the input signal's frequency is, based off the information we measure.<br>
      Now, set the input signal frequency to 150 Hz. You may do this using the textboxes and "Update" buttons. How many samples do you get in each period?
      `;
      updatePanel(panels, "Sampling Signal Time Domain", false);
      updatePanel(panels, "Reconstructed Signal FFT", true);
      break;
      case 7:
        contentWrap.elt.innerHTML = `
        <H1>
          Chapter 2: Sampling a Waveform in the Time Domain
        </H1>
        <hr>
        Now, what happens when you increase the input frequency?<br> 
        In particular, try making it so that the input frequency is exactly half the sampling frequency.<br>
        What happens to the location of the samples? What should the resulting waveform sound like?
        `;
        break;
    case 8:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 2: Sampling a Waveform in the Time Domain
    </H1>
    <hr>
    You should've seen that when the sampling frequency is exactly twice that of the input frequency, <i>no variation</i> is detected by the sampling process. This would mean our recording has no sound!<br> 
    This is called the "<i>Nyquist frequency</i>", represented by the edge of the gray area in the frequency domain. We will now explore methods to deal with sounds whose frequency approaches the Nyquist.<br>
    To start with, you may now control the phase of the input signal relative to the samples. What do you notice when you shift the phase of the input by a little bit?<br>
    `;
    updateSlider(sliders, "phase", true);
    break;
    case 9:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 2: Sampling a Waveform in the Time Domain
    </H1>
    <hr>
    You may have seen that by shifting the phase, we are able to gain more information about the input signal than was previously available.<br>
    Now, setting the phase back to zero, try decreasing the input frequency slightly below Nyquist.<br>
    What do you notice? Can you tell what the resulting frequency would be? What happens if the input is slightly above Nyquist?<br>
    `;
    settings.phase = 0;
    updateSlider(sliders, "phase", false);
    updateSlider(sliders, "numHarm", false);
    break;
    case 10:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 2: Sampling a Waveform in the Time Domain
    </H1>
    <hr>
    Near the Nyquist frequency, we see that the input frequency gets "duplicated" on either side of the Nyquist.<br> 
    This is an example of "<i>signal folding</i>", which happens due to the samples getting chosen at inconvenient spots in the input signal.<br>
    As an extreme case, with the sampling rate at 3000 Hz, what happens when the input signal is at 2900? What happens if the input signal is way higher than 3000 Hz?<br>
    `;
    break;
    case 11:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 2: Sampling a Waveform in the Time Domain
    </H1>
    <hr>
    When the input signal is only 100 Hz below the sampling frequency, the reconstruction thinks that we're measuring a 100 Hz signal! This is, once again, an example of signal folding.<br>
    In general, the reconstructed signal is unable to distinguish sounds above the Nyquist frequency. This means the frequency range of our recordings is limited by the Nyquist.<br>
    Now, set the input signal frequency to 750 and the number of odd 1/x harmonics to 2.<br>
    With the sampling rate at 3000 Hz, do you notice something in how the input signal is being sampled?
    `;
    updateSlider(sliders, "numHarm", true);
    settings.phase = 0;
    break;
    case 12:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 2: Sampling a Waveform in the Time Domain
    </H1>
    <hr>
    You may have noticed that the samples fell on the same spots whether or not you had 1 or 2 harmonics. This is because the second harmonic fell exactly on the Nyquist frequency (1500 Hz).<br> 
    Thus both the measurement of the fundamental frequency and its harmonics can be affected by our sampling process.<br>
    This is something that must be taken into account as many sounds contain frequencies above the sampling range and this must be filtered out to prevent ghosting.
    `;
    break;
    case 13:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 2: Sampling a Waveform in the Time Domain
    </H1>
    <hr>
    The hearing range of the average human goes from 20 Hz to around 20,000 Hz.<br> 
    Using the information presented so far, can you explain why most recording devices use sampling rates of 48,000 Hz?
    `;
    updateSlider(sliders, "fundFreq", true);
    updateSlider(sliders, "numHarm", true);
    updateSlider(sliders, "downsamplingFactor", true);
    updateSlider(sliders, "phase", true);
    updatePanel(panels, "Input Signal Frequency Domain", true);
    updatePanel(panels, "Input with Sampled Signal Time Domain", true);
    updatePanel(panels, "Reconstructed Signal FFT", true);
    updatePanel(panels, "Input Signal Time Domain with Delta Modulation", false);
    reconstructedButton.show();
    break;

    //Add more pages here

    //Chapter ??: Delta Modulation
    case 14:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    So far, we've only looked at one sampling method, which is the simplest and most standard approach to recording sound. However, there exist many other methods, and each<br>
    comes with its own advantages and limitations.<br>
    For example, 
    
    In this chapter, we will cover a method called "<i>Delta Modulation</i>" sampling. The idea is that, instead of measuring the amplitude of the signal at one point, we will<br> 
    just compare the current amplitude with the previous one.<br> 
    Here's how we would implement this: Start the recording by measuring the current amplitude of the signal.<br>
    At some time T<sub>s</sub> afterwards, if the amplitude is greater than the previous, assign the bit "1". If it is smaller, assign the bit "0".<br>
    Update the current amplitude by adding or subtracting a "delta step". This is a fixed amplitude that must be decided on beforehand.<br>
    As T<sub>s</sub> becomes very small, we will be able to reconstruct the shape of the waveform!
    `;
    settings.fundFreq = 440;
    settings.numHarm = 1;
    settings.phase = 0;
    settings.timeZoom = 2;
    updateSlider(sliders, "fundFreq", false);
    updateSlider(sliders, "phase", false);
    updateSlider(sliders, "numHarm", false);
    updateSlider(sliders, "downsamplingFactor", false);
    updatePanel(panels, "Input with Sampled Signal Time Domain", false);
    updatePanel(panels, "Reconstructed Signal FFT", false);
    updatePanel(panels, "Input Signal Time Domain with Delta Modulation", true);
    reconstructedButton.hide();

    updatePanel(panels, "Input Signal Time Domain", true);
    updatePanel(panels, "Input Signal Frequency Domain", false);
    updatePanel(panels, "Reconstructed Signal Time Domain using Delta Modulation", false);
    updatePanel(panels, "Reconstructed Signal using Delta Modulation FFT", false);
    reconstructedDeltaButton.hide();
    break;
    case 15:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    From now on, we will show you the input signal overlaid with the delta modulation steps, along with the reconstruction using the same algorithm.<br>
    You also have access to the frequency domain of the input and reconstructed signal.<br>
    Try playing around with the input signal and listening to the reconstructed sound. In what situations does the delta modulation algorithm fail to reproduce the input signal? Why?
    `;
    updateSlider(sliders, "fundFreq", true);
    updateSlider(sliders, "numHarm", true);
    updatePanel(panels, "Input Signal Time Domain", false);
    updatePanel(panels, "Input Signal Frequency Domain", true);
    updatePanel(panels, "Reconstructed Signal Time Domain using Delta Modulation", true);
    updatePanel(panels, "Reconstructed Signal using Delta Modulation FFT", true);
    reconstructedDeltaButton.show();

    updateSlider(sliders, "downsamplingFactorDelta", false);
    break;
    case 16:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    You might have noticed that, at high input frequencies, the reconstruction is unable to "keep up" with the rapid change in amplitude. This leads to the creation of small triangular waves in the reconstruction.<br>
    This is known as <i>waveform overloading</i>, and it causes the amplitude of the high frequency components to be attenuated (notice the spike in the frequency domain is much smaller).<br>
    There are a few ways to fix this problem. For instance, try increasing the sampling frequency and see how the reconstruction is affected.<br>
    Does the reconstruction sound better for high frequency inputs?
    `;
    updateSlider(sliders, "downsamplingFactorDelta", true);
    break;
    case 17:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    When the sampling frequency is sufficiently high, the algorithm is now able to follow rapid changes in the amplitude.<br>
    Notice that since we are only assigning a single bit at each step, we are able to sample the signal much more frequently than in our previous sampling method.<br>
    For a typical delta modulation algorithm, the sampling frequency can go to 4MHz or higher.<br>
    However, this introduces an additional problem. At the maximum sampling frequency, try sending a low-frequency input signal with no harmonics. Do you notice anything abnormal in the reconstruction?<br>
    `;

    updateSlider(sliders, "deltaStep", false);
    break;
    case 18:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    When the input signal stays stable for a certain amount of time, the delta modulation rapidly oscillates around that value, as it is only able to increase or decrease by a fixed step.<br>
    This creates a distinctive "buzzing" noise in the reconstruction, which you may have noticed by playing around with the parameters.<br> 
    In many ways, this is similar to the quantization phenomenon we saw previously.<br>
    In order to reduce this, we can decrease the delta step. So far the delta step has increased or decreased by 5% of the amplitude range each time.<br>
    Try playing around with this now. Are you able to get rid of the buzzing?
    `;
    updateSlider(sliders, "deltaStep", true);
    break;
    case 19:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    At very low delta steps, the reconstruction is much more sensitive to the details of the input signal, which gets rid of the buzzing sound from earlier.<br>
    However, you might have noticed a new problem. Whenever there are large changes in the input, the reconstruction needs many more steps to catch up to it.<br>
    So, if the step is too <i>low</i>, waveform overloading becomes a problem again, and high-frequency sounds get attenuated.<br>
    If the step is too <i>high</i>, quantization becomes an issue, and low-frequency sounds will contain buzzing.<br> 
    In other words, it seems we need to adjust the delta step according to the behaviour of the input signal... 
    `;
    adaptiveSwitchButton.hide();
    break;
    case 20:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    Here's how we can change the algorithm to do this. If the input signal is higher than our current amplitude, add the delta step as usual.<br>
    If the input signal is higher twice in a row, add twice the delta step. If this happens three times in a row, add three times the delta step and so on.<br>
    Once the input signal is lower than our current amplitude, reset the multiplier back to 1.<br> 
    In other words, consecutive changes in the delta modulation increase the delta step.<br> 
    This means that the reconstruction can react to abrupt changes in the input, while still capturing the details of the sections where the input is stable.<br>
    `;
    break;
    case 21:
    contentWrap.elt.innerHTML = `
    <H1>
      Chapter 5: Delta Modulation
    </H1>
    <hr>
    This algorithm is known as "<i>adaptive delta modulation</i>". You may now switch between the adaptive and non-adaptive version using the button at the bottom.<br>
    Try playing around with different situations where the non-adaptive version had problems. Does the adaptive version improve?  
    `;
    adaptiveSwitchButton.show();
    break;
  }
  reorderPanels();
  reorderSliders();
}


};
return new p5(sketch); } // end function new_widget() { var sketch = p => {
