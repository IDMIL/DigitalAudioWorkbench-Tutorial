
let audioSources = {}

let allSections = []

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

function play(sectionId) {
  renderAll(false);

  console.log(allSections);
  for (const section of allSections) {
    if (section.getId() === sectionId) {
      section.play();
      break;
    }
  }
}

function repaintPanels() {
  for (const section of allSections) {
    section.repaintPanels();
  }
}

function renderAll(display=true) {
  signal = {
    fs: WEBAUDIO_MAX_SAMPLERATE,
    data: new Float32Array(display ? DISPLAY_SIGNAL_SIZE : soundTimeSeconds * WEBAUDIO_MAX_SAMPLERATE)
  }


  for (const section of allSections) {
    section.processAudio(signal, display);
  }

  if (display) {
    for (const section of allSections) {
      repaintPanels();
    }
  }
}


function buildAndRunPage(sections) {
  for (const section of sections) {
    allSections.push(section);
    section.renderAllFunction = renderAll;
    const div = document.createElement('div');
    div.className = 'section';
    div.id = section.getId();
    div.innerHTML = section.getHtml();
    document.getElementById('sections').appendChild(div);
  }

  for (const section of sections) {
    section.createCanvasesAndSliders();
  }

  // renderAll(true);
}