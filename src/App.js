import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unitRange, setUnitRange] = useState('1-10'); // Initialize with the default range
  const [numQuestions, setNumQuestions] = useState(10);
  const [category, setCategory] = useState('vocab');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Track questions that have been asked
  const [askedQuestions, setAskedQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const jsonFileName = category === 'grammar' ? 'GrammarQuestions.json' : 'VocabQuestions.json';
        const response = await fetch(process.env.PUBLIC_URL + '/' + jsonFileName);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const [unitStart, unitEnd] = unitRange.split('-').map(Number);

        const filteredQuestions = data.filter(
          (questionData) =>
            questionData.Unit >= unitStart && questionData.Unit <= (unitEnd || unitStart)
        );

        const shuffledQuestions = shuffleArray(filteredQuestions);

        const selectedQuestions = shuffledQuestions.slice(0, numQuestions);

        const formattedQuestions = selectedQuestions.map((questionData) => {
          if (category === 'grammar') {
            const { question, correct_answer, incorrect_answers } = questionData;
            const allAnswers = shuffleArray([correct_answer, ...incorrect_answers]);
            return {
              question: question,
              correctAnswer: correct_answer,
              incorrectAnswers: allAnswers,
            };
          } else if (category === 'vocab') {
            const { Hebrew, Transliteration, Translation, Unit } = questionData;

            const possibleHeaders = ['Translation'];
            if (Unit >= 1 && Unit <= 10 && Math.random() <= 0.2) {
              possibleHeaders.push('Transliteration');
            }

            const selectedHeader =
              possibleHeaders[Math.floor(Math.random() * possibleHeaders.length)];

            let correctAnswer =
              selectedHeader === 'Transliteration' ? Transliteration : Translation;

            if (correctAnswer === 'null') {
              correctAnswer = Translation;
            }

            const incorrectAnswers = generateIncorrectAnswers(
              selectedHeader,
              correctAnswer,
              data
            );

            const allAnswers = shuffleArray(incorrectAnswers);
            allAnswers.splice(Math.floor(Math.random() * 4), 0, correctAnswer);

            return {
              question: `What is the ${selectedHeader} of ${Hebrew}?`,
              correctAnswer,
              incorrectAnswers: allAnswers,
            };
          }
          return null;
        });

        const finalQuestions = formattedQuestions.filter((question) => question !== null);

        setQuestions(finalQuestions);
        setCurrentQuestion(0);
        setScore(0);
        setQuizCompleted(false); // Reset quiz completion status
        setAskedQuestions([]);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (quizStarted) {
      fetchQuestions();
    }
  }, [category, unitRange, numQuestions, quizStarted]);

  const handleAnswerClick = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 1);
    }

    setQuestionsAnswered(questionsAnswered + 1);

    if (questionsAnswered === numQuestions - 1) {
      setQuizStarted(false);
      setQuizCompleted(true);
      return;
    }

    if (currentQuestion >= questions.length - 1) {
      const shuffledQuestions = shuffleArray(questions);
      setQuestions(shuffledQuestions);
      setCurrentQuestion(0);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuestions([]);
    setQuestionsAnswered(0);
    setScore(0);
    setAskedQuestions([]);
    setQuizCompleted(false); // Reset quiz completion status
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const generateIncorrectAnswers = (selectedHeader, correctAnswer, data) => {
    const incorrectAnswers = [];
    const uniqueIncorrectAnswers = new Set();

    while (uniqueIncorrectAnswers.size < 3 && uniqueIncorrectAnswers.size < data.length) {
      const randomData = data[Math.floor(Math.random() * data.length)];
      let incorrectAnswer;
      if (selectedHeader === 'Transliteration') {
        incorrectAnswer = randomData.Transliteration;
      } else {
        incorrectAnswer = randomData.Translation;
      }

      if (
        incorrectAnswer !== 'null' &&
        incorrectAnswer !== '' &&
        incorrectAnswer !== correctAnswer &&
        !uniqueIncorrectAnswers.has(incorrectAnswer)
      ) {
        uniqueIncorrectAnswers.add(incorrectAnswer);
      }
    }

    while (uniqueIncorrectAnswers.size < 3) {
      uniqueIncorrectAnswers.add(correctAnswer);
    }

    incorrectAnswers.push(...uniqueIncorrectAnswers);

    return incorrectAnswers;
  };

  const navigateToSettings = () => {
    setQuizCompleted(false); // Reset quiz completion status
    setCurrentQuestion(0); // Reset the current question index
    setQuizStarted(false); // Ensure the quiz is not running
  };
  

  return (
    <div className='container mt-5'>
      {quizStarted ? (
        questions.length > 0 ? (
          <div className='row'>
            <div className='col-md-6 offset-md-3'>
              <div className='card bg-dark-green text-black'>
                <div className='card-header'>
                  <span className='mr-2'>Question {questionsAnswered + 1}</span>/{numQuestions}
                </div>
                <div className='card-body'>
                  <h5 className='card-title'>{questions[currentQuestion].question}</h5>
                  <div className='btn-group-vertical w-100' role='group'>
                    {questions[currentQuestion].incorrectAnswers.map((answerOption, index) => (
                      <button
                        key={index}
                        className='btn btn-secondary mb-1 py-2'
                        onClick={() =>
                          handleAnswerClick(answerOption === questions[currentQuestion].correctAnswer)
                        }
                      >
                        {answerOption}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-center'>Loading questions...</div>
        )
      ) : (
        <>
          {quizCompleted ? (
            <div className='row'>
              <div className='col-md-6 offset-md-3'>
                <div className='card bg-dark-green text-black'>
                  <div className='card-header'>Quiz Finished</div>
                  <div className='card-body'>
                    {questionsAnswered > 0 && (
                      <>
                        <h5 className='card-title'>Your Score:</h5>
                        <p className='card-text'>
                          You scored {score} out of {questionsAnswered}
                        </p>
                        <button className='btn btn-primary' onClick={navigateToSettings}>
                          Go Back to Start
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='row'>
              <div className='col-md-6 offset-md-3'>
                <div className='card bg-dark-green text-black'>
                  <div className='card-header'>Quiz Settings</div>
                  <div className='card-body'>
                    <div className='mb-3'>
                      <label>Select Unit:</label>
                      <input
                        type='text'
                        className='form-control'
                        onChange={(e) => setUnitRange(e.target.value)}
                        placeholder={`Feel free to enter a single unit or a range (e.g., 1-10)`}
                      />
                    </div>
                    <div className='mb-3'>
                      <label>Number of Questions:</label>
                      <input
                        type='number'
                        className='form-control'
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      />
                    </div>
                    <div className='mb-3'>
                      <label>Select Category:</label>
                      <select
                        className='form-select'
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value='grammar'>Grammar</option>
                        <option value='vocab'>Vocabulary</option>
                      </select>
                    </div>
                    <button className='btn btn-primary' onClick={startQuiz}>
                      Start
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}