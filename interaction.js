function collapseClick(id) {
  let collapse = document.getElementById(id).parentNode.parentNode  .querySelector('.collapse');
  if (collapse.style.display === 'none') {
    collapse.style.display = 'block';
    document.getElementById(id).textContent = "_";
  } else {
    collapse.style.display = 'none';
    document.getElementById(id).textContent = "\u26F6";
  }
}