// Kikstart - Add a custom slide animation on main menu - Global
$(document).ready(function(){
  
  // The animation needs a new class name [is-hover]
  let menuMain = '#pageheader .navigation__tier-1-container .navigation__tier-1 li';

  $(menuMain).hover(function(){
    // setTimeout(() => {
      
    // }), 10000;
    $(this).addClass('is-hover');
  }, function(){
    $(this).removeClass('is-hover');
  });

});