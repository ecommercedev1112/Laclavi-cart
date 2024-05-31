// Kikstart - Custom filter functionality
$(document).on('click', '.filters #CollectionFilterForm .filter-group__item input', () => {
  setTimeout(() => {
    $('.submit-filter').trigger('click');
  }), 1000;
});

$(document).on('mousedown', '.utility-bar-custom .utility-bar__left .toggle-btn--revealed-desktop', () => {
  $('.filters .filters__inner').after('<div class="submit-filter-to-close"><div class="btn-apply">Apply</div></div>'); // Will append a new button
});

$(document).on('click', '.submit-filter-to-close', () => {
  $('.filters__close').trigger('click'); // Will close the filter box
  $('.submit-filter-to-close').remove();
});

$(document).on('mousedown', '.filter-shade', () => {
  $('.submit-filter-to-close').remove();
});

$(document).on('mousedown', '.filters__close', () => {
  $('.submit-filter-to-close').remove();
});

$(document).on('change', '.cc-price-range__input--min', () => {
  setTimeout(() => {
    $('.submit-filter').trigger('click');
  }), 1000;
});

$(document).on('change', '.cc-price-range__input--max', () => {
  setTimeout(() => {
    $('.submit-filter').trigger('click');
  }), 1000;
});