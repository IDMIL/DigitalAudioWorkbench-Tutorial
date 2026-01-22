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


function buildAndRunPage(sections) {
  function renderAll() {
    for (let section of sections) {
      section.processAudio();

      // TODO: redraw all panels
    }
  }

  for (const section of sections) {
    section.renderAllFunction = renderAll;
    const div = document.createElement('div');
    div.className = 'section';
    div.id = section.getId();
    div.innerHTML = section.getHtml();
    document.getElementById('sections').appendChild(div);
  }
}