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
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [unitInput, setUnitInput] = useState('');

  // Track questions that have been asked
  const [askedQuestions, setAskedQuestions] = useState([]);

  // Track unit range error
  const [unitRangeError, setUnitRangeError] = useState(false);

  // Track whether an answer has been selected
  const [answerSelected, setAnswerSelected] = useState(false);

  useEffect(() => {
    if (quizStarted) {
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
      
          // Validate unit range
          if (
            isNaN(unitStart) ||
            isNaN(unitEnd) ||
            unitStart > 30 ||
            unitEnd > 30 ||
            unitStart > unitEnd
          ) {
            // Invalid input, set error state
            setUnitRangeError(true);
            setLoading(false); // Make sure to stop loading here
            return;
          } else {
            // Reset error state if input is valid
            setUnitRangeError(false);
          }
      
          // Fetch questions based on unit range
          const filteredQuestions = data.filter(
            (questionData) =>
              questionData.Unit >= unitStart && questionData.Unit <= (unitEnd || unitStart)
          );
      
          if (filteredQuestions.length === 0) {
            throw new Error('No questions found for the specified unit range.');
          }
      
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
                isVocabularyQuestion: false, // Mark grammar questions
              };
            } else if (category === 'vocab') {
              const { Hebrew, Transliteration, Translation, Unit, Biblical_Frequency } = questionData;
  
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
                isVocabularyQuestion: true, // Mark vocabulary questions
                biblicalFrequency: Biblical_Frequency || 0, // Include biblical frequency or default to 0
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
          console.error('Error fetching or processing questions:', error);
          setUnitRangeError(true); // Set the error state in case of an error
        } finally {
          setLoading(false);
        }
      };
      

      fetchQuestions();
    }
  }, [quizStarted, unitRange, numQuestions, category]);

  const handleAnswerClick = (selectedAnswer) => {
    if (answerSelected) {
      // Do nothing if an answer has already been selected
      return;
    }
  
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    setUserAnswer(selectedAnswer);
    setIsAnswerCorrect(isCorrect);
    setAnswerSelected(true); // Mark that an answer has been selected
  
    if (isCorrect) {
      setScore(score + 1); // Increment the score if the answer is correct
    }
  
    if (questionsAnswered < numQuestions - 1) {
      // Move to the next question only if not all questions have been answered
      setQuestionsAnswered(questionsAnswered + 1);
    }
  
    if (questionsAnswered === numQuestions - 1) {
      // If all questions have been answered, end the quiz
      setQuizStarted(false);
      setQuizCompleted(true);
    }
  };
  
  const handleNextQuestion = () => {
    setUserAnswer('');
    setIsAnswerCorrect(null);
    setAnswerSelected(false); // Reset answerSelected
  
    if (questionsAnswered === numQuestions - 1) {
      // If all questions have been answered, end the quiz
      setQuizStarted(false);
      setQuizCompleted(true);
    } else if (currentQuestion >= questions.length - 1) {
      // If reached end of questions, shuffle questions and reset to the first question
      const shuffledQuestions = shuffleArray(questions);
      setQuestions(shuffledQuestions);
      setCurrentQuestion(0);
    } else {
      // Move to the next question
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const startQuiz = () => {
    if (!isNaN(unitInput) && parseInt(unitInput) >= 1 && parseInt(unitInput) <= 30) {
      // If a valid single unit is entered, set unitRange to that unit
      setUnitRange(`${unitInput}-${unitInput}`);
    } else {
      // If a range is entered, validate and set unitRange, else show error
      const [unitStart, unitEnd] = unitInput.split('-').map(Number);
      if (
        isNaN(unitStart) ||
        isNaN(unitEnd) ||
        unitStart > 30 ||
        unitEnd > 30 ||
        unitStart > unitEnd
      ) {
        setUnitRangeError(true);
        return;
      } else {
        setUnitRange(`${unitStart}-${unitEnd}`);
        setUnitRangeError(false);
      }
    }

    setQuizStarted(true);
    setQuestions([]);
    setQuestionsAnswered(0);
    setScore(0);
    setAskedQuestions([]);
    setQuizCompleted(false);
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
      {quizStarted && !unitRangeError ? (
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
                        onClick={() => handleAnswerClick(answerOption)}
                      >
                        {answerOption}
                      </button>
                    ))}
                  </div>
                  {isAnswerCorrect !== null && (
                    <div className={`alert ${isAnswerCorrect ? 'alert-success' : 'alert-danger'} mt-3`}>
                      {isAnswerCorrect ? (
                        `Correct! 🎉 This word occurs ${questions[currentQuestion].biblicalFrequency} times in the T'nakh 🔢`
                      ) : (
                        `Wrong! The correct answer is: ${questions[currentQuestion].correctAnswer}`
                      )}
                    </div>
                  )}
                  <button
                    className='btn btn-primary mt-3'
                    onClick={handleNextQuestion}
                    disabled={!answerSelected} // Disable the button if no answer has been selected
                  >
                    Next Question
                  </button>
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
                  <div className='card-header'>Biblical Hebrew A</div>
                  <div className='card-body'>
                    <div className='mb-3'>
                      <label>Select Unit:</label>
                      <input
                        type='text'
                        className={`form-control ${unitRangeError ? 'is-invalid' : ''}`}
                        onChange={(e) => setUnitInput(e.target.value)}
                        placeholder={`Feel free to enter a single unit or a range (e.g., 1-10)`}
                      />
                      {unitRangeError && (
                        <div className="invalid-feedback">
                          Please enter a valid unit or unit range between 1 and 30.
                        </div>
                      )}
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
