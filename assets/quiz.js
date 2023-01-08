function run() {
  // find slug in URL
  var parts = document.location.pathname.split("/");
  var slug = parts[parts.length - 1];
  slug = slug.slice(0, slug.length - ".quiz".length);
  console.debug("Found slug", slug);
  // start BookQuiz UI
  window.quiz = new BookQuiz(slug, false);
  window.quiz.start();
}

(function (){
  // in case the document is already rendered
  if (document.readyState!='loading') run();
  // modern browsers
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', run);
  // IE <= 8
  else document.attachEvent('onreadystatechange', function(){
      if (document.readyState=='complete') run();
  });
})();
