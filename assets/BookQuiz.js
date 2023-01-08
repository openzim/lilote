/*eslint no-unused-vars: 0*/

Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
        return this;
    }
});

function addEvent(el, type, handler) {
  if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
}

function removeEvent(el, type, handler) {
  if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
}

// matches polyfill
this.Element && function(ElementPrototype) {
    ElementPrototype.matches = ElementPrototype.matches ||
    ElementPrototype.matchesSelector ||
    ElementPrototype.webkitMatchesSelector ||
    ElementPrototype.msMatchesSelector ||
    function(selector) {
        var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
        while (nodes[++i] && nodes[i] != node);
        return !!nodes[i];
    }
}(Element.prototype);

// live binding helper using matchesSelector
function live(selector, event, callback, context) {
    addEvent(context || document, event, function(e) {
        var found, el = e.target || e.srcElement;
        while (el && el.matches && el !== context && !(found = el.matches(selector))) el = el.parentElement;
        if (found) callback.call(el, e);
    });
}

function hasClass(el, className) {
  return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
}

function addClass(el, className) {
  if (el.classList) el.classList.add(className);
  else if (!hasClass(el, className)) el.className += ' ' + className;
}

function removeClass(el, className) {
  if (el.classList) el.classList.remove(className);
  else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
}

function firstParentOf(el, nodeName) {
  let current = el;
  while(current.parentNode != null && current.parentNode != document.documentElement) {
    current = current.parentNode;
    if (current.nodeName.toLowerCase() == nodeName.toLowerCase()){
      return current;
    }
   }
}

function hide(el) {
  if (!hasClass(el, 'hidden'))
    addClass(el, 'hidden');
}

function unhide(el) {
  removeClass(el, 'hidden');
}

/*
  Book Quiz
*/
/* exported BookQuiz */
var BookQuiz = (function() {
  BookQuiz.name = 'BookQuiz';

  BookQuiz.ERRONEOUS_ANSWER = 0;
  BookQuiz.SKIPPED_ANSWER = 1;
  BookQuiz.CORRECT_ANSWER = 3;

  function BookQuiz(slug, debug) {
    this.slug = slug;
    this.error = null;
    this.data = null;

    this.current = null;  // index of last displayed question
    this.answers = [];  // current list of answers
    this.answer = 0;  // current correct answer index

    this.points = 0;  // user's gained points
    this.user_answers = [];

    // UI elements
    this.error_e = document.getElementById('error');
    this.quiz_e = document.getElementById('quiz');
    this.question_name_e = document.getElementById('question_name');
    this.question_text_e = document.getElementById('question_text');
    this.question_answers_e = document.getElementById('answers');

    this.skip_button_e = document.getElementById('skip-button');
    this.validate_button_e = document.getElementById('validate-button');
    this.next_question_button_e = document.getElementById('next-question-button');
    this.view_score_button_e = document.getElementById('view-score-button');

    this.question_num_e = document.getElementById('question-num');
    this.nb_points_e = document.getElementById('nb-points');

    this.scores_e = document.getElementById('scores');

    // event handler (cant be anonymous to be unbound)
    var instance = this;
    this.answer_clicked_handler = function(event) { instance.on_answer_clicked(event); }

    this.console = debug ? console : {
      log() {},
      debug() {},
      warn() {},
      error() {},
    };
  }

  BookQuiz.prototype.displayError = function (message) {
    this.error_e.innerText = message;
    unhide(this.error_e);
  };

  BookQuiz.prototype.load = async function() {
    try {
      const response = await fetch(`./${this.slug}.json`);
      if (!response.ok)
        throw new Error(`HTTP ${response.status} Error`, {cause: response});
      this.data = await response.json();
    } catch (e) {
      console.error('Failed to retrieve JSON for ', this.slug, e);
      this.displayError(`Missing JSON payload: ${e.toString()}`);
      return false;
    }
  };

  BookQuiz.prototype.nb_questions = function() {
    return this.data.question_export.length;
  }

  BookQuiz.prototype.update_points = function(additional_points) {
    if (additional_points)
      this.points += additional_points;
    this.nb_points_e.innerText = this.points;
  }

  BookQuiz.prototype.update_question_num = function() {
    this.question_num_e.innerText = `${this.current + 1}/${this.nb_questions()}`;
  }

  BookQuiz.prototype.has_more = function() {
    return this.current < this.nb_questions() -1;
  }

  BookQuiz.prototype.mark_asked = function() {
    hide(this.next_question_button_e);

    unhide(this.validate_button_e);
    this.validate_button_e.setAttribute('disabled', 'disabled');

    unhide(this.skip_button_e);
  }

  BookQuiz.prototype.mark_selected = function() {
    this.validate_button_e.removeAttribute('disabled');
  }

  BookQuiz.prototype.mark_answered = function() {
    // can't validate answer anymore
    this.validate_button_e.setAttribute('disabled', 'disabled');
    hide(this.validate_button_e);

    // can't skip question anymore
    hide(this.skip_button_e);

    // allow moving to next question
    if (this.has_more())
      unhide(this.next_question_button_e);
    else
      unhide(this.view_score_button_e);
  }

  BookQuiz.prototype.on_validate_answer = function(event) {
    // right or wrong?
    let li_target = this.question_answers_e.querySelector('li label[class~=selected]').parentNode;  // li
    let index = Array.prototype.indexOf.call(li_target.parentNode.children, li_target);
    let correct = index == this.answer;
    // this.console.debug(`SELECTED answer [${index}]`, `right answer is ${this.answer}, correct ? ${correct}`, li_target);

    // disable interactions on answers
    this.question_answers_e.querySelectorAll('li label').forEach(el => addClass(el, 'disabled'))
    this.question_answers_e.querySelectorAll('li').forEach(el => removeEvent(el, 'click', this.answer_clicked_handler));

    // add answer feedback (colored border and icon)
    let label_e = li_target.querySelector('label');
    addClass(label_e, correct ? 'correct' : 'erroneous');
    label_e.innerHTML += `<span class="bodymovin answer-icon" data-bm-path="assets/char-${correct ? 'superhappy' : 'pensive'}.json" data-bm-renderer="svg"></span>`;
    lottie.searchAnimations();  // foreign (lottie.js)

    // highlight correct answer if if was wrong
    if (!correct) {
      addClass(this.question_answers_e.querySelectorAll("li label")[this.answer], 'correct');
    }

    // update scores
    this.user_answers.push(correct ? BookQuiz.CORRECT_ANSWER : BookQuiz.ERRONEOUS_ANSWER);
    this.update_points(correct ? BookQuiz.CORRECT_ANSWER : BookQuiz.ERRONEOUS_ANSWER);
    this.mark_answered();
  }

  BookQuiz.prototype.on_skip_question = function(event) {
    // remove selection marker from previously selected
    this.question_answers_e.querySelectorAll('li label').forEach(el => removeClass(el, 'selected'))

    // disable interactions on answers
    this.question_answers_e.querySelectorAll('li label').forEach(el => addClass(el, 'disabled'))
    this.question_answers_e.querySelectorAll('li').forEach(el => removeEvent(el, 'click', this.answer_clicked_handler));

    // highlight correct answer
    addClass(this.question_answers_e.querySelectorAll("li label")[this.answer], 'correct');

    this.user_answers.push(BookQuiz.SKIPPED_ANSWER);
    this.update_points(BookQuiz.SKIPPED_ANSWER);
    this.mark_answered();
  }

  BookQuiz.prototype.on_next_question = function(event) {
    if (this.has_more())
      this.next();
    else
      this.go_to_scores();
  }

  BookQuiz.prototype.on_answer_clicked = function(event) {
    let li_target = firstParentOf(event.target, 'li');
    let clicked_index = Array.prototype.indexOf.call(li_target.parentNode.children, li_target);

    // remove selection marker from previously selected
    this.question_answers_e.querySelectorAll('li label').forEach(el => removeClass(el, 'selected'))

    // add selection marker to clicked one
    let el = li_target.querySelector('label')
    if (!hasClass(el, 'selected')) addClass(el, 'selected');

    this.mark_selected();
  }

  BookQuiz.prototype.next = function() {
    index = (this.current === null) ? 0 : this.current + 1;
    question = this.data.question_export[index];

    answers = [question.correct_answer].concat(question.wrong_answer).shuffle();
    answer = answers.indexOf(question.correct_answer);
    this.display_question(index + 1, question.question, answers);
    this.current = index;
    this.answers = answers;
    this.answer = answer;
    this.update_question_num();
  }

  BookQuiz.prototype.display_question = function(question_num, question, answers) {
    this.question_name_e.innerText = `Question ${question_num}`;
    this.question_text_e.innerText = question;
    this.question_answers_e.innerHTML = '';
    let list_text = '';
    answers.forEach(answer => list_text += `<li><label>${answer}</label></li>\n`);

    this.question_answers_e.innerHTML = list_text;

    this.mark_asked();
    this.question_answers_e.querySelectorAll('li').forEach(el => addEvent(el, 'click', this.answer_clicked_handler));
  }

  BookQuiz.prototype.go_to_scores = function() {
    // hide quiz mode
    hide(this.quiz_e);

    // set correct answers and progress
    let nb_questions = this.nb_questions();
    let nb_correct = this.user_answers.filter(a => a == BookQuiz.CORRECT_ANSWER).length;
    let nb_erroneous = this.user_answers.filter(a => a == BookQuiz.ERRONEOUS_ANSWER).length;
    let nb_skipped = this.user_answers.filter(a => a == BookQuiz.SKIPPED_ANSWER).length;

    this.scores_e.querySelector('.quiz-result__number--correct strong').innerText = nb_correct;
    this.scores_e.querySelector('.quiz-result__line--correct').style.width = `calc(${parseInt(nb_correct / nb_questions * 100)}%)`;

    this.scores_e.querySelector('.quiz-result__number--wrong strong').innerText = nb_erroneous;
    this.scores_e.querySelector('.quiz-result__line--wrong').style.width = `calc(${parseInt(nb_erroneous / nb_questions * 100)}%)`;

    this.scores_e.querySelector('.quiz-result__number--skip strong').innerText = nb_skipped;
    this.scores_e.querySelector('.quiz-result__line--skip').style.width = `calc(${parseInt(nb_skipped / nb_questions * 100)}%)`;

    this.scores_e.querySelector('.quiz-result__total-score strong').innerText = this.points;

    // display scores
    unhide(this.scores_e);
  }

  BookQuiz.prototype.start = async function() {
    await this.load();
    if (this.data === null)
      return 1;
    this.update_points(0);
    this.next();

    hide('#next-question-button');
    live('#validate-button', 'click', (event) => this.on_validate_answer(event));
    live('#skip-button', 'click', (event) => this.on_skip_question(event));
    live('#next-question-button', 'click', (event) => this.on_next_question(event));
    live('#view-score-button', 'click', (event) => this.go_to_scores(event));
  };

  return BookQuiz;

})();
