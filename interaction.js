function collapseClick(id) {
  let collapse = document.getElementById(id).parentNode.parentNode.querySelector('.collapse');
  if (collapse.style.display === 'none') {
    collapse.style.display = 'block';
  } else {
    collapse.style.display = 'none';
  }
}