$(function () {

  var category = 'All';

  function filterMovies() {
    var query = $('#searchInput').val().toLowerCase();
    var found = 0;
    $('.movie-item').each(function () {
      var show = (category === 'All' || $(this).data('genre') === category) &&
                 $(this).text().toLowerCase().indexOf(query) !== -1;
      $(this).toggle(show);
      if (show) { found++; }
    });
    $('#noResults').toggle(found === 0);
  }

  $('#searchInput').on('input', filterMovies);

  $('.filter-btn').on('click', function () {
    category = $(this).data('category');
    $('.filter-btn').removeClass('active').attr('aria-pressed', 'false');
    $(this).addClass('active').attr('aria-pressed', 'true');
    filterMovies();
  });

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = {
    regName: function (v) {
      v = $.trim(v);
      if (v === '') { return 'Name is required.'; }
      return v.length < 2 ? 'Name must be at least 2 characters.' : '';
    },
    regEmail: function (v) {
      v = $.trim(v);
      if (v === '') { return 'Email is required.'; }
      return emailRegex.test(v) ? '' : 'Enter a valid email, e.g. name@example.com.';
    },
    regPass: function (v) {
      if (v === '') { return 'Password is required.'; }
      return v.length < 8 ? 'Use at least 8 characters.' : '';
    },
    regConfirm: function (v) {
      if (v === '') { return 'Please confirm your password.'; }
      return v === $('#regPass').val() ? '' : 'Passwords do not match.';
    }
  };

  function validate(id) {
    var error = rules[id]($('#' + id).val());
    var ok = error === '';
    var $field = $('#' + id).closest('.field');
    $field.toggleClass('valid', ok).toggleClass('invalid', !ok);
    $field.find('.status').text(ok ? '\u2714' : '\u2716');
    $field.find('.msg').text(ok ? 'Looks good!' : error);
    return ok;
  }

  function showStrength() {
    var p = $('#regPass').val();
    var score = [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)]
      .filter(Boolean).length;
    var level = score <= 1 ? 'weak' : (score <= 3 ? 'medium' : 'strong');
    $('#strengthBar').removeClass('weak medium strong').addClass(p === '' ? '' : level);
    $('#strengthText').text('Password strength: ' + (p === '' ? '-' : level));
  }

  $('#regName, #regEmail, #regConfirm').on('input blur', function () { validate(this.id); });
  $('#regPass').on('input blur', function () {
    showStrength();
    validate('regPass');
    if ($('#regConfirm').val() !== '') { validate('regConfirm'); }
  });

  $('#registerForm').on('submit', function (e) {
    e.preventDefault(); 
    var errors = 0;
    $.each(rules, function (id) { if (!validate(id)) { errors++; } });

    if (errors > 0) {
      $('#formAlert').html('<div class="alert alert-danger">Please fix ' + errors + ' field(s) marked with \u2716.</div>');
    } else {
      $('#formAlert').html('<div class="alert alert-success">Account created successfully. Welcome to CineVault!</div>');
      this.reset();
      $('.field').removeClass('valid invalid').find('.status, .msg').text('');
      showStrength();
    }
  });


  if ($('#movieRows').length) {
    var movies = [
      { id: 1, title: 'Inception', year: 2010, genre: 'Sci-Fi', rating: 8.8 },
      { id: 2, title: 'The Dark Knight', year: 2008, genre: 'Action', rating: 9.0 },
      { id: 3, title: 'Parasite', year: 2019, genre: 'Thriller', rating: 8.5 },
      { id: 4, title: 'Spirited Away', year: 2001, genre: 'Animation', rating: 8.6 },
      { id: 5, title: 'Interstellar', year: 2014, genre: 'Sci-Fi', rating: 8.7 },
      { id: 6, title: 'Whiplash', year: 2014, genre: 'Drama', rating: 8.5 }
    ];
    var modal = new bootstrap.Modal('#movieModal');

    try { movies = JSON.parse(localStorage.getItem('cv_movies')) || movies; } catch (err) {}
    function save() {
      try { localStorage.setItem('cv_movies', JSON.stringify(movies)); } catch (err) {}
    }

    function message(type, text) {
      $('#crudAlert').html($('<div class="alert alert-' + type + '">').text(text));
    }

    function findMovie(id) {
      return movies.filter(function (m) { return m.id === Number(id); })[0];
    }

    function render() {
      var $rows = $('#movieRows').empty();
      $.each(movies, function (i, m) {
        $rows.append(
          $('<tr>').append(
            $('<td>').text(i + 1),
            $('<td>').text(m.title),
            $('<td>').text(m.year),
            $('<td>').text(m.genre),
            $('<td>').text(m.rating.toFixed(1)),
            $('<td>').append(
              $('<button class="btn btn-sm btn-cv edit-btn me-1">Edit</button>').attr('data-id', m.id),
              $('<button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>').attr('data-id', m.id)
            )
          )
        );
      });
      if (movies.length === 0) { $rows.append('<tr><td colspan="6">No movies yet.</td></tr>'); }
    }

    function openModal(m) {
      $('#movieForm')[0].reset();
      $('#modalError').text('');
      $('#modalTitle').text(m ? 'Edit movie' : 'Add movie');
      $('#movieId').val(m ? m.id : '');
      if (m) {
        $('#mTitle').val(m.title);
        $('#mYear').val(m.year);
        $('#mGenre').val(m.genre);
        $('#mRating').val(m.rating);
      }
      modal.show();
    }

    $('#addBtn').on('click', function () { openModal(null); });
    $('#movieRows').on('click', '.edit-btn', function () { openModal(findMovie($(this).data('id'))); });

    $('#movieRows').on('click', '.delete-btn', function () {
      var m = findMovie($(this).data('id'));
      if (confirm('Delete "' + m.title + '"?')) {
        movies = movies.filter(function (x) { return x !== m; });
        save(); render();
        message('warning', '"' + m.title + '" was deleted.');
      }
    });

    $('#movieForm').on('submit', function (e) {
      e.preventDefault();
      var title = $.trim($('#mTitle').val());
      var year = parseInt($('#mYear').val(), 10);
      var rating = parseFloat($('#mRating').val());
      var error = '';
      if (title === '') { error = 'Title is required.'; }
      else if (isNaN(year) || year < 1888 || year > 2100) { error = 'Enter a year between 1888 and 2100.'; }
      else if (isNaN(rating) || rating < 0 || rating > 10) { error = 'Rating must be between 0 and 10.'; }
      if (error) { $('#modalError').text(error); return; }

      var data = { title: title, year: year, genre: $('#mGenre').val(), rating: rating };
      var id = $('#movieId').val();
      if (id === '') {
        data.id = Date.now();
        movies.push(data);
        message('success', '"' + title + '" was added.');
      } else {
        $.extend(findMovie(id), data);
        message('success', '"' + title + '" was updated.');
      }
      save(); render(); modal.hide();
    });

    render();
  }

  var $items = $('.gallery-item');
  var $lightbox = $('#lightbox');
  var $image = $('#lbImg');
  var current = 0;

  $items.css('opacity', 0).each(function (i) {
    $(this).delay(i * 100).animate({ opacity: 1 }, 400);
  });

  function showImage(index) {
    current = (index + $items.length) % $items.length;
    var $img = $items.eq(current).find('img');
    $image.attr({ src: $img.attr('src'), alt: $img.attr('alt') });
    $('#lbCaption').text($items.eq(current).data('caption'));
  }

  function change(step) {
    $image.stop(true, true).fadeOut(200, function () {
      showImage(current + step);
      $image.fadeIn(200);
    });
  }

  $items.on('click', function (e) {
    e.preventDefault();
    showImage($items.index(this));
    $lightbox.fadeIn(300);
  });

  $('.lb-next').on('click', function () { change(1); });
  $('.lb-prev').on('click', function () { change(-1); });
  $('.lb-close').on('click', function () { $lightbox.fadeOut(300); });
  $lightbox.on('click', function (e) { if (e.target === this) { $lightbox.fadeOut(300); } });

  $(document).on('keydown', function (e) {
    if (!$lightbox.is(':visible')) { return; }
    if (e.key === 'Escape') { $lightbox.fadeOut(300); }
    if (e.key === 'ArrowRight') { change(1); }
    if (e.key === 'ArrowLeft') { change(-1); }
  });

});
