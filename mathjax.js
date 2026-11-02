// MathJax 4 with its STIX2 math font, matching the STIX Two Text body font (style.css) and Physical Review's
// typeset math. Pages load this file instead of the CDN script, so the version and font are set in one place.
// The -nofont build skips MathJax's default font, which would otherwise download before STIX2.
// linebreaks.inline:false keeps v3 behavior: v4 otherwise splits in-line math across lines, which wraps
// the rotated plot axis titles (cmb-plot.js overlays) onto several lines.
window.MathJax = { output: { font: 'mathjax-stix2', linebreaks: { inline: false } } };
(function(){
  var s = document.createElement('script');
  s.id = 'MathJax-script';
  s.async = true;
  s.src = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-mml-chtml-nofont.js';
  document.head.appendChild(s);
})();
