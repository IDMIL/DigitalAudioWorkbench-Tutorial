function collapseClick(id) {

  let collapse = document.getElementById(id).querySelector('.collapse');
  if (collapse.style.display === 'none') {
    collapse.style.display = 'block';
    document.getElementById(id).textContent = "_";
  } else {
    collapse.style.display = 'none';
    document.getElementById(id).textContent = "\u26F6";
  }
}

function collapseGlobalPanel() {
  let collapse = document.getElementById("global-panel-collapse-button").parentNode.querySelector('.contents');
  if (collapse.style.display === 'none') {
    collapse.style.display = 'block';
  } else {
    collapse.style.display = 'none';
  }

}