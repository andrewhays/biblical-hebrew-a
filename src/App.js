import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unitRange, setUnitRange] = useState('1-10'); // Initialize with the default range
  const [numQuestions, setNumQuestions] = useState(10);
  const [category, setCategory] = useState('vocab');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  useEffect(() => {
    // Inside your useEffect where you fetch questions:
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const jsonFileName = category === 'grammar' ? 'GrammarQuestions.json' : 'VocabQuestions.json';
        const response = await fetch(process.env.PUBLIC_URL + '/' + jsonFileName);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Filter questions based on the unitRange
        const [unitStart, unitEnd] = unitRange.split('-').map(Number);

        const filteredQuestions = data.filter(
          (questionData) =>
            questionData.Unit >= unitStart && questionData.Unit <= (unitEnd || unitStart)
        );

        // Randomly shuffle the filtered questions
        const shuffledQuestions = shuffleArray(filteredQuestions);

        // Select the first numQuestions for the quiz
        const selectedQuestions = shuffledQuestions.slice(0, numQuestions);

        // Process questions based on category
        const formattedQuestions = selectedQuestions.map((questionData) => {
          if (category === 'grammar') {
            // Process grammar questions
            const { question, correct_answer, incorrect_answers } = questionData;
            const allAnswers = shuffleArray([correct_answer, ...incorrect_answers]);
            return {
              question: question,
              correctAnswer: correct_answer,
              incorrectAnswers: allAnswers,
            };
          } else if (category === 'vocab') {
            // Process vocab questions
            const { Hebrew, Transliteration, Translation, Unit } = questionData;

            // Define the possible headers based on the unit and probability
            const possibleHeaders = ['Translation'];
            if (Unit >= 1 && Unit <= 10 && Math.random() <= 0.2) {
              possibleHeaders.push('Transliteration');
            }

            // Select a header randomly from the possible options
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

            // Shuffle the answers and insert the correct answer at a random position
            const allAnswers = shuffleArray(incorrectAnswers);
            allAnswers.splice(Math.floor(Math.random() * 4), 0, correctAnswer);

            return {
              question: `What is the ${selectedHeader} of ${Hebrew}?`,
              correctAnswer,
              incorrectAnswers: allAnswers,
            };
          }
          return null; // Skip questions that don't match the selected category
        });

        // Remove null values from the formatted questions array
        const finalQuestions = formattedQuestions.filter((question) => question !== null);

        setQuestions(finalQuestions);
        setCurrentQuestion(0);
        setScore(0);
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
    }

    const nextQuestion = currentQuestion + 1;

    if (nextQuestion < numQuestions) {
      setCurrentQuestion(nextQuestion);
    } else {
      // All questions answered, do nothing here
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuestions([]); // Reset the questions array
    setQuestionsAnswered(0); // Reset the questions answered counter
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

    // Collect all unique incorrect answers in a Set
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

    // If there are not enough unique incorrect answers, fill the remaining slots with correct answers
    while (uniqueIncorrectAnswers.size < 3) {
      uniqueIncorrectAnswers.add(correctAnswer);
    }

    // Convert the Set back to an array
    incorrectAnswers.push(...uniqueIncorrectAnswers);

    return incorrectAnswers;
  };

  return (
    <div className='container mt-5'>
      {quizStarted ? (
        questions.length > 0 ? (
          <div className='row'>
            <div className='col-md-6 offset-md-3'>
              <div className='card bg-dark-green text-black'>
                <div className='card-header'>
                  <span className='mr-2'>Question {currentQuestion + 1}</span>/{numQuestions}
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='row mt-3'>
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
                      placeholder={`Feel free to enter a range (e.g., 1-10)`}
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
        </>
      )}
    </div>
  );
}
