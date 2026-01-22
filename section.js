

class Section {
  panels = [];
  sliders = [];
  renderAllFunction = undefined;

  getHtml() {
    return `<div class="titlebar">
            <div class="section-title">
              <h2>` + this.getTitle() + `</h2>
            </div>
            <button class="collapse-button" id="coll-input" onclick="collapseClick('` + this.getId() + `')"></button>
          </div>
          <div class="collapse">
            <div class="row panels">
              ` + this.getPanels() + `
            </div>
            <div class="row sliders">
              ` + this.getSliders() + `
            </div>
            ` + this.getPlayButton() + `
          </div>`;
  }

  getId() {
    return 'default-section'
  }

  getTitle() {
    return ``;
  }

  getPanels() {
    return ``;
  }

  getSliders() {
    return ``;
  }

  getPlayButton() {
    return ``;
  }

  createPanel(panelClass, panelSettings) {
    let panelParentId = panelClass.id;

    const sketch = p => {
      p.panelObject = new panelClass();
      panels.push(p);
      p.setup = function () {
        let canvas = p.createCanvas(450, 300);
        p.textAlign(p.CENTER);
        canvas.parent(panelParentId);
        p.panelObject.setup(p, 450, 300, panelSettings);
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
    this.panels.push(sketch);
    return `<div id=` + panelParentId + ` class="panel"></div>`;
  }

  createSlider(sliderClass, sliderSettings) {
    let sliderParentId = sliderClass.id;
    const sketch = p => {
      p.sliderObject = new sliderClass();
      p.sliderObject.renderFunction = this.renderAllFunction;
      p.setup = function () {
        let canvas = p.createCanvas(500, 50);
        p.textAlign(p.CENTER);
        console.log(sliderParentId);
        canvas.parent(sliderParentId)
        p.sliderObject.setup(p, sliderSettings);
        p.sliderObject.resize(0,0,500,50);
        p.sliderObject.onEdit();
        p.redraw();
      }
    }
    // new p5(sketch);
    this.sliders.push(sketch);

    return `<div id=` + sliderParentId + ` class="slider"></div>`;
  }

  createCanvasesAndSliders() {
    for (const sketch of this.sliders) {
      console.log(sketch);
      new p5(sketch);
    }

    for (const panel of this.panels) {
      new p5(panel);
    }
  }

  processAudio(signal) {

  }
}

class InputSection extends Section {
  audioInputSliderSettings = {};
  frequencySliderSettings = {};
  numHarmonicsSliderSettings = {};
  amplitudeSliderSettings = {};
  noiseFloorSliderSettings = {};

  getTitle() {
    return `Input`;
  }

  getId() {
    return `inputSection`;
  }

  getSliders() {
    return this.createSlider(AudioInputTypeSlider, this.audioInputSliderSettings) +
      this.createSlider(FreqSlider, this.frequencySliderSettings) +
      this.createSlider(NumHarmSlider, this.numHarmonicsSliderSettings) +
      this.createSlider(AmplitudeSlider, this.amplitudeSliderSettings) +
      this.createSlider(NoiseFloorSlider, this.noiseFloorSliderSettings)
  }
}

class FilterSection extends Section {
  getTitle() {
    return `Anti-Aliasing Filter`;
  }

  getId() {
    return `filter-section`;
  }
}
class SamplerateSection extends Section {
  getTitle() {
    return `Sample Rate`;
  }

  getId() {
    return `samplerate-section`;
  }
}

class DitherSection extends Section {
  getTitle() {
    return `Dither`;
  }

  getId() {
    return `dither-section`;
  }
}

class QuantizationSection extends Section {
  getTitle() {
    return `Quantization`;
  }

  getId() {
    return `quantization-section`;
  }
}

class ReconstructedSection extends Section {
  getTitle() {
    return `Reconstructed`;
  }

  getId() {
    return `reconstructed-section`;
  }
}

