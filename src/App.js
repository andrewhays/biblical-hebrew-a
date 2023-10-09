import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unitRange, setUnitRange] = useState("1-10");
  const [numQuestions, setNumQuestions] = useState(5);
  const [category, setCategory] = useState('vocab');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [unitInput, setUnitInput] = useState('');
  const [unitRangeError, setUnitRangeError] = useState(false);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [repeatQuizMissedQuestions, setRepeatQuizMissedQuestions] = useState([]);
  const [inRepeatQuizMode, setInRepeatQuizMode] = useState(false);
  const [repeatMissedButtonVisible, setRepeatMissedButtonVisible] = useState(true);
  const [isLastQuestion, setIsLastQuestion] = useState(false); 
  const [showQuizFinished, setShowQuizFinished] = useState(false);
  const [timesRepeated, settimesRepeated] = useState(0);




  useEffect(() => {
    if (quizStarted && !inRepeatQuizMode) {
      fetchQuestions(numQuestions);
    }
  }, [quizStarted, unitRange, numQuestions, category, inRepeatQuizMode]);

  const handleAnswerClick = (selectedAnswer) => {
    if (answerSelected) {
      return;
    }
  
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    setUserAnswer(selectedAnswer);
    setIsAnswerCorrect(isCorrect);
    setAnswerSelected(true);
  
    if (isCorrect) {
      setScore(score + 1);
    } else {
      if (!inRepeatQuizMode) {
        setMissedQuestions((prevMissedQuestions) => [
          ...prevMissedQuestions,
          questions[currentQuestion], // Add the current question to missedQuestions
        ]);
      } else {
        setRepeatQuizMissedQuestions((prevRepeatMissedQuestions) => [
          ...prevRepeatMissedQuestions,
          questions[currentQuestion], // Add the current question to repeatQuizMissedQuestions
        ]);
      }
    }
  };
  
  

  const handleNextQuestion = () => {
    setUserAnswer('');
    setIsAnswerCorrect(null);
    setAnswerSelected(false);    
    // Check if it's the last question and show the Finish Quiz button
    if (
      (numQuestions === 2 && currentQuestion + 1 === numQuestions - 1) ||
      (numQuestions > 2 && currentQuestion === numQuestions - 2)
    ) {
      setIsLastQuestion(true);
    } else {
      setIsLastQuestion(false);
    }
  
    if (questionsAnswered < numQuestions - 1) {
      setQuestionsAnswered(questionsAnswered + 1);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      if (inRepeatQuizMode && missedQuestions.length > 0) {
        const nextMissedQuestion = missedQuestions.pop();
        setQuestions([nextMissedQuestion]);
        setCurrentQuestion(0);
        setScore(score);
        setMissedQuestions([...missedQuestions]);
      } else if (inRepeatQuizMode && missedQuestions.length === 0) {
        setQuizStarted(false);
        setQuizCompleted(true);
        setInRepeatQuizMode(false);
      } else if (!inRepeatQuizMode && currentQuestion >= questions.length - 1) {
        if (quizCompleted) {
          const shuffledRepeatQuestions = shuffleArray(repeatQuizMissedQuestions);
          const numRepeatQuestions = Math.min(
            shuffledRepeatQuestions.length,
            numQuestions
          );
  
          const selectedRepeatQuestions = shuffledRepeatQuestions.slice(
            0,
            numRepeatQuestions
          );
  
          setQuestions(selectedRepeatQuestions);
          setCurrentQuestion(0);
          setScore(0);
          setQuizCompleted(false);
          setUserAnswer('');
          setIsAnswerCorrect(null);
          setAnswerSelected(false);
          setInRepeatQuizMode(true);
          setQuestionsAnswered(0);
          setQuizStarted(true);
        } else {
          const shuffledQuestions = shuffleArray(questions);
          setQuestions(shuffledQuestions);
          setCurrentQuestion(0);
        }
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }  

  };
  
  
  

  const startQuiz = (repeatMissed = false) => {
    // Reset all variables to their initial values
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setQuizStarted(true);
    setQuestionsAnswered(0);
    setUserAnswer('');
    setIsAnswerCorrect(null);
    setAnswerSelected(false);
    setInRepeatQuizMode(repeatMissed);
    setRepeatQuizMissedQuestions([]);
    
    // Check if it's the last question and show the Finish Quiz button
    if (
      (numQuestions === 1 && currentQuestion === numQuestions - 1) 
    ) {
      setIsLastQuestion(true);
    } else {
      setIsLastQuestion(false);
    }

    if (!repeatMissed) {
      if (!isNaN(unitInput) && parseInt(unitInput) >= 1 && parseInt(unitInput) <= 30) {
        setUnitRange(`${unitInput}-${unitInput}`);
      } else {
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
    }

    const numQuestionsToAsk = repeatMissed ? missedQuestions.length : numQuestions;
    setNumQuestions(numQuestionsToAsk);

    fetchQuestions(numQuestionsToAsk);

    setQuizStarted(true);
    setQuestions([]);
    setQuestionsAnswered(0);
    setScore(0);
    setQuizCompleted(false);
    setUserAnswer('');
    setIsAnswerCorrect(null);
    setAnswerSelected(false);
    setInRepeatQuizMode(repeatMissed);
    setRepeatQuizMissedQuestions([]);
  };

  const repeatMissed = () => {
    settimesRepeated(timesRepeated + 1);
    let missedQuestionsToRepeat = [];
  
    if (quizCompleted && !inRepeatQuizMode) {
      missedQuestionsToRepeat = missedQuestions;
    } else {
      // Filter the questions from the previous repeat quiz to include only the missed ones
      missedQuestionsToRepeat = repeatQuizMissedQuestions.filter((questionData) => {
        return !isAnswerCorrectInRepeatQuiz(questionData);
      });
    }
  
    if (missedQuestionsToRepeat.length > 0) {
      const numMissedQuestions = Math.min(missedQuestionsToRepeat.length, numQuestions);
      const shuffledMissedQuestions = shuffleArray(missedQuestionsToRepeat);
      const selectedQuestions = shuffledMissedQuestions.slice(0, numMissedQuestions);
  
      // Update the state to reset the quiz with missed questions
      setNumQuestions(numMissedQuestions);
      setQuestions(selectedQuestions);
      setCurrentQuestion(0);
      setScore(0);
      setQuizCompleted(false);
      setUserAnswer('');
      setIsAnswerCorrect(null);
      setAnswerSelected(false);
      setInRepeatQuizMode(true); // Set inRepeatQuizMode to true for repeat quiz
      setQuestionsAnswered(0);
      setQuizStarted(true); // Set quizStarted to true for repeat quiz
  
      // Reset the repeatQuizMissedQuestions array
      setRepeatQuizMissedQuestions([]);
    } else {
      setRepeatMissedButtonVisible(false);
    }
  
    // Check if it's the last question and show the Finish Quiz button
    if (
      (numQuestions === 1 && currentQuestion === numQuestions - 1) ||
      (numQuestions === 2 && currentQuestion === 0) ||
      (numQuestions > 2 && currentQuestion === numQuestions - 2)
    ) {
      setIsLastQuestion(true);
    } else {
      setIsLastQuestion(false);
    }
  };
  
  
  
  const handleFinishQuiz = () => {
    // Handle finishing the quiz and show the "Quiz Finished" card
    setShowQuizFinished(true);
    setQuizCompleted(true);
    setRepeatMissedButtonVisible(false);
    if (missedQuestions.length > 0) {
      setRepeatMissedButtonVisible(true);
    } else {
      setRepeatMissedButtonVisible(false);
    } 
    setQuizStarted(false);
  };
  const isAnswerCorrectInRepeatQuiz = (questionData) => {
    const selectedAnswer = questionData.userAnswer;
    const correctAnswer = questionData.correctAnswer;
    return selectedAnswer === correctAnswer;
  };

  const fetchQuestions = async (numQuestionsToFetch) => {
    setLoading(true);
    try {
      const jsonFileName = category === 'grammar' ? 'GrammarQuestions.json' : 'VocabQuestions.json';
      const response = await fetch(process.env.PUBLIC_URL + '/' + jsonFileName);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      const [unitStart, unitEnd] = unitRange.split('-').map(Number);

      if (
        isNaN(unitStart) ||
        isNaN(unitEnd) ||
        unitStart > 30 ||
        unitEnd > 30 ||
        unitStart > unitEnd
      ) {
        setUnitRangeError(true);
        setLoading(false);
        return;
      } else {
        setUnitRangeError(false);
      }

      const filteredQuestions = data.filter(
        (questionData) =>
          questionData.Unit >= unitStart && questionData.Unit <= (unitEnd || unitStart)
      );

      if (filteredQuestions.length === 0) {
        throw new Error('No questions found for the specified unit range.');
      }

      const shuffledQuestions = shuffleArray(filteredQuestions);

      const selectedQuestions = shuffledQuestions.slice(0, numQuestionsToFetch);

      const formattedQuestions = selectedQuestions.map((questionData) => {
        if (category === 'grammar') {
          const { question, correct_answer, incorrect_answers } = questionData;
          const allAnswers = shuffleArray([correct_answer, ...incorrect_answers]);
          return {
            question: question,
            correctAnswer: correct_answer,
            incorrectAnswers: allAnswers,
            isVocabularyQuestion: false,
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
            isVocabularyQuestion: true,
            biblicalFrequency: Biblical_Frequency || 0,
          };
        }
        return null;
      });

      const finalQuestions = formattedQuestions.filter((question) => question !== null);

      setQuestions(finalQuestions);
      setCurrentQuestion(0);
      setScore(0);
      setQuizCompleted(false);
      setMissedQuestions([]);
    } catch (error) {
      console.error('Error fetching or processing questions:', error);
      setUnitRangeError(true);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSettings = () => {
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setQuizStarted(false);
    setQuestionsAnswered(0);
    settimesRepeated(0);
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

  
  const handleExitQuiz = () => {
    // Reset all quiz-related state variables to their initial values
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setQuestionsAnswered(0);
    setUserAnswer('');
    setIsAnswerCorrect(null);
    setAnswerSelected(false);
    setMissedQuestions([]);
    setRepeatQuizMissedQuestions([]);
    setInRepeatQuizMode(false);
    setIsLastQuestion(false);
    settimesRepeated(0);
    setShowQuizFinished(false);
  };

  return (
    <div className='container mt-5'>
      <div className='row'>
        <div className='col-md-6 offset-md-3'>
          <div className='card bg-dark-green text-black'>
            <div className='card-header d-flex justify-content-between align-items-center'>
              <span>Biblical Hebrew A</span>
              <button
                className='btn btn-primary'
                onClick={handleExitQuiz}
                style={{
                  background: '#56877a',
                  border: 'none', // Remove the border
                  fontSize: '1rem',
                  color: 'white',
                  display: quizStarted ? 'inline-block' : 'none',
                }}
              >
                Exit Quiz
              </button>
            </div>
            <div className='card-body'>
              {quizCompleted ? (
                <>
                  <h5 className='card-title'>Quiz Finished</h5>
                  {questionsAnswered > 0 && (
                    <p className='card-text'>
                      Your Score: {score} out of {questionsAnswered + 1}
                    </p>
                  )}
                  <button
                    className='btn btn-primary'
                    onClick={navigateToSettings}
                    style={{
                      background: '#56877a',
                      border: 'none', // Remove the border
                    }}
                  >
                    Go Back to Start
                    </button>
                  {repeatMissedButtonVisible && timesRepeated <= 2 && (quizCompleted && missedQuestions.length > 0) ||
                  (repeatQuizMissedQuestions.length > 0 && inRepeatQuizMode) ? (
                    <button className='btn btn-danger ml-2' onClick={repeatMissed}
                    style={{
                      background: '#dc6c75',
                      border: 'none', // Remove the border
                      color: 'white',
                    }}>
                      Repeat Missed Questions
                                  
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  {!quizStarted ? (
                    <>
                      <div className='mb-3'>
                        <label>Select Unit:</label>
                        <input
                          type='text'
                          className={`form-control ${unitRangeError ? 'is-invalid' : ''}`}
                          onChange={(e) => setUnitInput(e.target.value)}
                          placeholder={`Enter a single unit or a range (e.g., 1-10)`}
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
                      <button
                        className='btn btn-primary'
                        onClick={() => startQuiz(false)}
                        style={{
                          background: '#56877a',
                          border: 'none', // Remove the border
                        }}
                      >
                        Start
                      </button>
                    </>
                  ) : (
                    <>
                      <div className='card-header'>
                        <span className='mr-2'>Question {questionsAnswered + 1}</span>/{numQuestions}
                      </div>
                      <div className='card-body'>
                        {questions.length > 0 && (
                          <>
                            <h5 className='card-title'>{questions[currentQuestion].question}</h5>
                            <div className='btn-group-vertical w-100' role='group'>
                              {questions[currentQuestion].incorrectAnswers.map((answerOption, index) => (
                                <button
                                  key={index}
                                  className='btn btn-secondary mb-1 py-2'
                                  onClick={() => handleAnswerClick(answerOption)}
                                  style={{
                                    background: '#f8f8f8f8',
                                    border: 'none', // Remove the border
                                    color: 'black',
                                  }}
                                >
                                  {answerOption}
                                </button>
                              ))}
                            </div>
                            {isAnswerCorrect !== null && (
                              <div
                                className={`alert ${isAnswerCorrect ? 'alert-success' : 'alert-danger'} mt-3`}
                              >
                                {isAnswerCorrect ? (
                                  category === 'grammar' ? (
                                    `Mozel Tov Sababa! You'll be turning pages in no time! 🕎🎉📜`
                                  ) : (
                                    `🕎Mozel Tov Sababa! 🎉 This word occurs ${questions[currentQuestion].biblicalFrequency} times in the T'nakh 📜`
                                  )
                                ) : (
                                  `Oy vey! 😢 The correct answer is: ${questions[currentQuestion].correctAnswer}`
                                )}
                              </div>
                            )}
                            {isLastQuestion ? (
                              <button
                                className='btn btn-primary mt-3'
                                onClick={handleFinishQuiz}
                                disabled={!answerSelected}
                                style={{
                                  background: '#56877a',
                                  border: 'none', // Remove the border
                                }}
                              >
                                Finish Quiz
                              </button>
                            ) : (
                              <button
                                className='btn btn-primary mt-3'
                                onClick={handleNextQuestion}
                                disabled={!answerSelected}
                                style={{
                                  background: '#56877a',
                                  border: 'none', // Remove the border
                                }}
                              >
                                Next Question
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );  
}
