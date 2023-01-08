async function run() {
  try {
      const response = await fetch(`./books_list.json`);
      console.log(response)
      if (!response.ok)
        throw new Error(`HTTP ${response.status} Error`, {cause: response});
      data = await response.json();
    } catch (e) {
      console.error(e);
      let error_e = document.getElementById('error');
      error_e.innerText = `Missing JSON payload: ${e.toString()}`;
      unhide(error_e);
      return;
    }

    $('#search-selection').select2({
        data: data,
        placeholder: 'Titre, auteur, éditeur…',
        allowClear: true,
        language: 'fr',
        width: 'element',
        minimumResultsForSearch: 1,
        theme: "bootstrap-5",
      });

    $('#search-selection').val(null).trigger('change');

    $('#search-selection').on('change', function (event) {
      let selected = $('#search-selection').find(':selected')[0].value;
      console.log("SELECTED", selected);
      if (selected)
        window.location.href = selected;
    });
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
