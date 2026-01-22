

class Section {
  panels = [];
  sliders = [];
  renderAllFunction = undefined;

  getHtml() {
    return `<div class="titlebar">
            <div class="section-title">
              <h2>` + this.getTitle() + `</h2>
            </div>
            <button class="collapse-button" id="coll-input" onclick="collapseClick(this.id)"></button>
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
        canvas.parent(id)
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
    new p5(sketch);
    return `<div id=` + panelParentId + ` class="panel"></div>`;
  }

  createSlider(sliderClass, sliderSettings) {
    let sliderParentId = "";
    const sketch = p => {
      p.sliderObject = new sliderClass();
      sliderParentId = p.sliderObject.id;
      console.log(sliderParentId);
      p.sliderObject.renderFunction = this.renderAllFunction;
      p.setup = function () {
        let canvas = p.createCanvas(500, 50);
        p.textAlign(p.CENTER);
        canvas.parent(sliderParentId)
        p.sliderObject.setup(p, sliderSettings);
        p.sliderObject.resize(0,0,500,50);
        p.sliderObject.onEdit();
        p.redraw();
      }
    }
    new p5(sketch);

    return `<div id=` + sliderParentId + ` class="slider"></div>`;
  }


  processAudio(signal) {

  }
}

class InputSection extends Section {
  audioInputSliderSettings = {}
  getTitle() {
    return `Input`;
  }

  getId() {
    return `inputSection`;
  }

  getSliders() {
    return this.createSlider(AudioInputTypeSlider, this.audioInputSliderSettings);
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

