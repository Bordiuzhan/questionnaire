document.addEventListener('DOMContentLoaded', async () => {
  const catalog = document.getElementById('catalog');
  const questionnaire = document.getElementById('questionnaire');
  const edit = document.getElementById('edit');
  const addQuestionBtn = document.getElementById('addQuestion');
  const saveQuestionnaireBtn = document.getElementById('saveQuestionnaire');
  const deleteQuestionnaireBtn = document.getElementById('deleteQuestionnaire');
  const submitAnswersBtn = document.getElementById('submitAnswers');

  if (catalog) {
    fetchCatalog();
  }
  if (questionnaire) {
    fetchQuestionnaire();
  }
  if (edit) {
    console.log('edit');

    fetchQuestionnaireForEdit();
  }
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', addQuestion);
  }
  if (saveQuestionnaireBtn) {
    saveQuestionnaireBtn.addEventListener('click', () => {
      const id = new URLSearchParams(window.location.search).get('id');
      if (id) {
        updateQuestionnaire(id);
      } else {
        saveQuestionnaire();
      }
    });
  }
  if (deleteQuestionnaireBtn) {
    deleteQuestionnaireBtn.addEventListener('click', deleteQuestionnaire);
  }
  if (submitAnswersBtn) {
    submitAnswersBtn.addEventListener('click', submitAnswers);
  }
});

function fetchCatalog() {
  fetch('https://questionnaire-back.onrender.com/api/questionnaires')
    .then((res) => res.json())
    .then((data) => {
      const catalog = document.getElementById('catalog');
      catalog.innerHTML = data
        .map(
          (q) => `
                <div class='questionnaire'>
                    <h3>${q.title}</h3>
                    <p>${q.description || 'No description'}</p>
                    <p>Questions: ${q.questions.length}</p>
                    <p>Completed: ${q.completions || 0}</p>
                    <button onclick="runQuestionnaire('${q._id}')">Run</button>
                    <button onclick="editQuestionnaire('${
                      q._id
                    }')">Edit</button>
                    <button onclick="deleteQuestionnaire('${
                      q._id
                    }')">Remove</button>
                </div>`
        )
        .join('');
    })
    .catch((err) => {
      console.error('Error loading catalog:', err);
      alert('Failed to load questionnaire catalog.');
    });
}
function addQuestion() {
  const questionsDiv = document.getElementById('questions');
  const newQuestion = document.createElement('div');
  newQuestion.innerHTML = `
      <select class="question-type">
        <option value="text">Text</option>
        <option value="multiple-choice">Multiple choice</option>
      </select>
    <textarea placeholder="Question"></textarea>
    <div class="options-container" style="display: none;">
      <button type="button" class="add-option">Add option</button>
      <div class="options"></div>
    </div>
    <button onclick="this.parentElement.remove()">Remove</button>
    `;
  const questionTypeSelect = newQuestion.querySelector('.question-type');
  const optionsContainer = newQuestion.querySelector('.options-container');
  const addOptionButton = newQuestion.querySelector('.add-option');
  const optionsDiv = newQuestion.querySelector('.options');

  questionTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'multiple-choice') {
      optionsContainer.style.display = 'block';
    } else {
      optionsContainer.style.display = 'none';
      optionsDiv.innerHTML = '';
    }
  });

  // Add option button click event
  addOptionButton.addEventListener('click', () => {
    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.placeholder = 'Опція';
    optionsDiv.appendChild(optionInput);
  });

  questionsDiv.appendChild(newQuestion);
}
function saveQuestionnaire() {
  const title = document.getElementById('qName').value;
  const description = document.getElementById('qDescription').value;
  const questions = [...document.getElementById('questions').children].map(
    (q) => {
      const text = q.querySelector('textarea').value;
      const type = q.querySelector('.question-type').value;
      const options = [...q.querySelectorAll('.options input')]
        .map((opt) => opt.value.trim())
        .filter((opt) => opt);

      return {
        text,
        type,
        ...(type === 'multiple-choice' ? { options } : {}),
      };
    }
  );

  fetch('https://questionnaire-back.onrender.com/api/questionnaires', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, questions }),
  }).then(() => (window.location.href = 'index.html'));
}
function deleteQuestionnaire(id) {
  if (confirm('Are you sure you want to delete this questionnaire?')) {
    fetch(`https://questionnaire-back.onrender.com/api/questionnaires/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error while deleting the questionnaire');
        }
        fetchCatalog();
      })
      .catch((err) => {
        console.error('Error while deleting the questionnaire:', err);
        alert('Could not delete the questionnaire. Please try again..');
      });
  }
}
function runQuestionnaire(id) {
  window.location.href = `questionnaire.html?id=${id}`;
}
function editQuestionnaire(id) {
  console.log('editQuestionnaire');

  window.location.href = `builder.html?id=${id}`;
}
function fetchQuestionnaire() {
  const id = new URLSearchParams(window.location.search).get('id');
  fetch(`https://questionnaire-back.onrender.com/api/questionnaires/${id}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error('Questionnaire not found');
      }
      return res.json();
    })
    .then((data) => {
      questionnaire.innerHTML = `<h2>${data.title}</h2>
        <p>${data.description || 'No description'}</p>
        <div id="questions">
          ${data.questions
            .map((q, i) => {
              if (q.type === 'multiple-choice') {
                return `
                  <div class="question" data-question-id="${q._id}">
                    <h3>${q.text}</h3>
                    ${q.options
                      .map(
                        (option, j) => `
                        <label>
                          <input type="radio" name="question${i}" value="${option}">
                          ${option}
                        </label>
                      `
                      )
                      .join('')}
                  </div>
                `;
              } else {
                return `
                  <div class="question" data-question-id="${q._id}">
                    <h3>${q.text}</h3>
                    <textarea id="answer${i}" placeholder="Respond"></textarea>
                  </div>
                `;
              }
            })
            .join('')}
        </div>
      `;
    });
}
function fetchQuestionnaireForEdit() {
  console.log('fetchQuestionnaireForEdit');

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return;
  fetch(`https://questionnaire-back.onrender.com/api/questionnaires/${id}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error('Questionnaire not found');
      }
      return res.json();
    })
    .then((data) => {
      document.getElementById('qName').value = data.title;
      document.getElementById('qDescription').value = data.description;

      const questionsDiv = document.getElementById('questions');
      questionsDiv.innerHTML = '';

      data.questions.forEach((q) => {
        const newQuestion = document.createElement('div');
        newQuestion.classList.add('question');
        newQuestion.setAttribute('data-question-id', q._id);
        newQuestion.innerHTML = `
          <select class="question-type">
            <option value="text" ${
              q.type === 'text' ? 'selected' : ''
            }>Text</option>
            <option value="multiple-choice" ${
              q.type === 'multiple-choice' ? 'selected' : ''
            }>Multiple choice</option>
          </select>
          <textarea placeholder="Question">${q.text}</textarea>
          <div class="options-container" style="display: ${
            q.type === 'multiple-choice' ? 'block' : 'none'
          };">
            <button type="button" class="add-option">Add option</button>
            <div class="options">
              ${q.options
                .map(
                  (opt) =>
                    `<input type="text" value="${opt}" placeholder="Option">`
                )
                .join('')}
            </div>
          </div>
          <button onclick="this.parentElement.remove()">Remove</button>
        `;

        const questionTypeSelect = newQuestion.querySelector('.question-type');
        const optionsContainer =
          newQuestion.querySelector('.options-container');
        const addOptionButton = newQuestion.querySelector('.add-option');
        const optionsDiv = newQuestion.querySelector('.options');

        questionTypeSelect.addEventListener('change', (e) => {
          if (e.target.value === 'multiple-choice') {
            optionsContainer.style.display = 'block';
          } else {
            optionsContainer.style.display = 'none';
            optionsDiv.innerHTML = '';
          }
        });

        addOptionButton.addEventListener('click', () => {
          const optionInput = document.createElement('input');
          optionInput.type = 'text';
          optionInput.placeholder = 'Опція';
          optionsDiv.appendChild(optionInput);
        });

        questionsDiv.appendChild(newQuestion);
      });
    })
    .catch((err) => {
      console.error('Error loading the questionnaire:', err);
      alert('Unable to download the questionnaire.');
    });
}
function updateQuestionnaire(id) {
  const title = document.getElementById('qName').value;
  const description = document.getElementById('qDescription').value;
  const questions = [...document.getElementById('questions').children].map(
    (q) => {
      const text = q.querySelector('textarea').value;
      const type = q.querySelector('.question-type').value;
      const options = [...q.querySelectorAll('.options input')]
        .map((opt) => opt.value.trim())
        .filter((opt) => opt);

      return {
        text,
        type,
        ...(type === 'multiple-choice' ? { options } : {}),
      };
    }
  );

  fetch(`https://questionnaire-back.onrender.com/api/questionnaires/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, questions }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Error updating the questionnaire');
      }
      return res.json();
    })
    .then(() => {
      alert('The questionnaire was successfully updated.!');
      window.location.href = 'index.html';
    })
    .catch((err) => {
      console.error('Error updating the questionnaire:', err);
      alert('Failed to update the questionnaire. Please try again..');
    });
}
function submitAnswers() {
  const id = new URLSearchParams(window.location.search).get('id');
  const questions = document.querySelectorAll('#questions .question');
  const answers = [];

  questions.forEach((question, index) => {
    const questionId = question.getAttribute('data-question-id');
    const radioInputs = question.querySelectorAll('input[type="radio"]');
    const textareaInput = question.querySelector('textarea');

    if (radioInputs.length > 0) {
      // Collect the selected radio button value
      const selectedOption = [...radioInputs].find((input) => input.checked);
      answers.push({
        questionId,
        answer: selectedOption ? selectedOption.value : null,
      });
    } else if (textareaInput) {
      // Collect the textarea value
      answers.push({
        questionId,
        answer: textareaInput.value.trim(),
      });
    }
  });

  // Send the answers to the server
  fetch(`https://questionnaire-back.onrender.com/api/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionnaireId: id, answers }),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Error saving responses');
      }
      return res.json();
    })
    .then((data) => {
      alert('Your answers have been successfully saved.!');
      console.log('Response saved:', data);
      window.location.href = 'index.html';
    })
    .catch((err) => {
      alert('Could not save responses. Please try again.');
      console.error(err);
    });
}
