"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "../../components/Modal";
import "./quizzes.css";

interface Question {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [myKids, setMyKids] = useState<any[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Study Modal State
  const [studyingQuiz, setStudyingQuiz] = useState<any | null>(null);

  // Active Quiz Playing State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Mentor Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    weekNumber: "",
    biblePassage: "",
    memoryVerse: "",
    classCategoryId: "",
    sermonNotes: "",
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: "",
      },
    ],
  });

  // Submissions Modal State (For Mentors / Admins)
  const [viewingSubmissionsQuiz, setViewingSubmissionsQuiz] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Notification Modal State
  const [actionAlert, setActionAlert] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string } | null>(null);

  const isMentorOrAdmin = currentUser?.role === 'MENTOR' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const fetchQuizzes = (catId?: string) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    const url = catId
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quizzes?classCategoryId=${catId}`
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quizzes`;

    fetch(url, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login?redirect=/quizzes";
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setQuizzes(data);
        else setQuizzes([]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load quizzes:", err);
        setQuizzes([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/quizzes";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] as string));
      setCurrentUser(payload);
    } catch (e) {
      console.error(e);
    }

    // Fetch categories and parent's kids
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/my-kids`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json())
    ]).then(([catData, kidsData]) => {
      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(kidsData)) {
        setMyKids(kidsData);
        if (kidsData.length > 0) {
          setSelectedKidId(kidsData[0]._id);
        }
      }
    }).catch(console.error);

    fetchQuizzes(selectedCategory);
  }, []);

  const handleCategoryFilter = (catId: string) => {
    setSelectedCategory(catId);
    fetchQuizzes(catId);
  };

  // Start Playing Quiz
  const handleStartQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setStudyingQuiz(null);
    setQuizAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizResult(null);
  };

  // Select Option
  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setQuizAnswers(prev => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    
    // Check if child is selected
    if (!selectedKidId && myKids.length > 0) {
      alert("Please select which child is taking this quiz!");
      return;
    }

    const unansweredIndex = quizAnswers.findIndex(a => a === -1);
    if (unansweredIndex !== -1) {
      if (!confirm(`You have not answered Question ${unansweredIndex + 1}. Do you still want to submit?`)) {
        return;
      }
    }

    setSubmittingQuiz(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quizzes/${activeQuiz._id}/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          childId: selectedKidId || (myKids[0]?._id),
          answers: quizAnswers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit quiz");

      setQuizResult(data);
    } catch (err: any) {
      alert(err.message || "Error submitting quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this weekly quiz and its sermon notes?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quizzes/${quizId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete quiz");
      setActionAlert({ isOpen: true, type: "success", title: "Deleted", message: "Weekly quiz deleted successfully!" });
      fetchQuizzes(selectedCategory);
    } catch (err: any) {
      setActionAlert({ isOpen: true, type: "error", title: "Error", message: err.message });
    }
  };

  // Load Submissions
  const handleViewSubmissions = async (quiz: any) => {
    setViewingSubmissionsQuiz(quiz);
    setLoadingSubmissions(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quizzes/${quiz._id}/submissions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setSubmissions(data);
      else setSubmissions([]);
    } catch (err) {
      console.error(err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Add Question in Creator
  const handleAddQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          explanation: "",
        }
      ]
    }));
  };

  // Remove Question in Creator
  const handleRemoveQuestion = (idx: number) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  // Create Quiz Submit
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/quizzes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newQuiz)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create quiz");

      setShowCreateModal(false);
      setNewQuiz({
        title: "",
        weekNumber: "",
        biblePassage: "",
        memoryVerse: "",
        classCategoryId: "",
        sermonNotes: "",
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctOptionIndex: 0,
            explanation: "",
          },
        ],
      });
      setActionAlert({ isOpen: true, type: "success", title: "Quiz Published", message: "Weekly Quiz & Sermon Notes created successfully!" });
      fetchQuizzes(selectedCategory);
    } catch (err: any) {
      setActionAlert({ isOpen: true, type: "error", title: "Creation Failed", message: err.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="quizzes-container">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {actionAlert && (
        <Modal
          isOpen={actionAlert.isOpen}
          type={actionAlert.type}
          title={actionAlert.title}
          onClose={() => setActionAlert(null)}
          onConfirm={() => setActionAlert(null)}
        >
          <p>{actionAlert.message}</p>
        </Modal>
      )}

      {/* Main Header */}
      <header className="quizzes-header glass-panel animate-fade-in">
        <div>
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <h1 className="quizzes-title">Weekly Sermon Notes & Quiz Hub</h1>
          <p className="quizzes-subtitle">Study God's Word, review Sunday sermon notes, and test your knowledge with interactive multi-choice quizzes!</p>
        </div>

        <div className="header-actions">
          {isMentorOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary hover-lift"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', whiteSpace: 'nowrap' }}
            >
              ✍️ Upload Sermon Notes & Quiz
            </button>
          )}
        </div>
      </header>

      {/* Filter and Child Selection Toolbar */}
      <div className="quizzes-toolbar glass-panel animate-fade-in">
        <div className="toolbar-item">
          <label>Filter by Class:</label>
          <select value={selectedCategory} onChange={e => handleCategoryFilter(e.target.value)}>
            <option value="">All Classes</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {myKids.length > 0 && (
          <div className="toolbar-item">
            <label>Taking Quiz For:</label>
            <select value={selectedKidId} onChange={e => setSelectedKidId(e.target.value)}>
              {myKids.map(k => (
                <option key={k._id} value={k._id}>{k.name} ({k.classCategoryId?.name || 'Class'})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quizzes List */}
      <div className="quizzes-grid">
        {loading ? (
          <div className="loading-placeholder">Loading weekly sermon notes & quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="glass-panel no-quizzes-card">
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📖</div>
            <h3>No Quizzes Published Yet</h3>
            <p>Mentors will publish the weekly sermon notes and interactive quizzes here each Sunday.</p>
            {isMentorOrAdmin && (
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary hover-lift" style={{ marginTop: '1rem' }}>
                Create the First Weekly Quiz
              </button>
            )}
          </div>
        ) : (
          quizzes.map(quiz => (
            <div key={quiz._id} className="quiz-card glass-panel hover-lift">
              <div className="quiz-card-header">
                <div>
                  {quiz.weekNumber && <span className="week-badge">Week {quiz.weekNumber}</span>}
                  <span className="class-badge">{quiz.classCategoryId?.name || 'All Classes'}</span>
                </div>
                {isMentorOrAdmin && (
                  <button onClick={() => handleDeleteQuiz(quiz._id)} className="delete-btn" title="Delete Quiz">
                    🗑️
                  </button>
                )}
              </div>

              <h2 className="quiz-card-title">{quiz.title}</h2>

              {quiz.biblePassage && (
                <p className="quiz-bible-passage">
                  📜 <strong>Bible Passage:</strong> {quiz.biblePassage}
                </p>
              )}

              {quiz.memoryVerse && (
                <div className="memory-verse-snippet">
                  <em>"{quiz.memoryVerse.length > 100 ? `${quiz.memoryVerse.slice(0, 100)}...` : quiz.memoryVerse}"</em>
                </div>
              )}

              <p className="quiz-questions-count">
                ❓ {quiz.questions?.length || 0} Multiple-Choice Questions
              </p>

              <div className="quiz-card-actions">
                <button
                  onClick={() => setStudyingQuiz(quiz)}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                >
                  📖 Study Notes
                </button>
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  🚀 Take Quiz
                </button>
              </div>

              {isMentorOrAdmin && (
                <button
                  onClick={() => handleViewSubmissions(quiz)}
                  className="btn btn-outline btn-sm submissions-btn"
                >
                  📊 View Student Scores
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Study Sermon Notes Modal */}
      {studyingQuiz && (
        <Modal
          isOpen={!!studyingQuiz}
          title={studyingQuiz.title}
          onClose={() => setStudyingQuiz(null)}
          confirmText="Start Quiz Now"
          onConfirm={() => handleStartQuiz(studyingQuiz)}
        >
          <div className="study-content-reader">
            {studyingQuiz.biblePassage && (
              <div className="study-passage-banner">
                <strong>📖 Bible Passage:</strong> {studyingQuiz.biblePassage}
              </div>
            )}

            {studyingQuiz.memoryVerse && (
              <div className="study-memory-verse-card">
                <h4>⭐ Memory Verse to Memorize</h4>
                <p>"{studyingQuiz.memoryVerse}"</p>
              </div>
            )}

            <div className="study-notes-body">
              <h4>📝 Sermon Summary & Notes</h4>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.05rem', marginTop: '0.5rem' }}>
                {studyingQuiz.sermonNotes}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Interactive Quiz Playing Modal */}
      {activeQuiz && (
        <Modal
          isOpen={!!activeQuiz}
          title={quizResult ? "Quiz Results & Review" : activeQuiz.title}
          onClose={() => setActiveQuiz(null)}
          confirmText={quizResult ? "Done" : (submittingQuiz ? "Submitting..." : "Submit Answers")}
          onConfirm={quizResult ? () => setActiveQuiz(null) : handleSubmitQuiz}
        >
          <div className="quiz-player-container">
            {!quizResult ? (
              <>
                <p className="quiz-instructions">
                  Answer the {activeQuiz.questions.length} questions below. Good luck!
                </p>

                <div className="questions-list">
                  {activeQuiz.questions.map((q: Question, qIdx: number) => (
                    <div key={qIdx} className="question-item glass-panel">
                      <h4 className="question-title">
                        <span className="q-number">{qIdx + 1}.</span> {q.question}
                      </h4>

                      <div className="options-grid">
                        {q.options.map((opt: string, optIdx: number) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`option-btn ${quizAnswers[qIdx] === optIdx ? 'selected' : ''}`}
                          >
                            <span className="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                            <span className="opt-text">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Quiz Result Screen */
              <div className="quiz-result-view animate-fade-in">
                <div className="score-summary-banner">
                  <div className="celebration-emoji">
                    {quizResult.percentage >= 80 ? '🏆 ⭐' : quizResult.percentage >= 50 ? '👏' : '💪'}
                  </div>
                  <h3>Your Score: {quizResult.score} / {quizResult.totalQuestions}</h3>
                  <div className="percentage-badge">{quizResult.percentage}%</div>
                  <p className="result-feedback">
                    {quizResult.percentage === 100
                      ? "Outstanding job! You mastered this week's lesson!"
                      : quizResult.percentage >= 70
                      ? "Great job! Keep learning God's Word!"
                      : "Good effort! Review the correct answers below to learn more!"}
                  </p>
                </div>

                <div className="review-breakdown">
                  <h4>Question Review & Answers:</h4>
                  {quizResult.review?.map((rev: any, rIdx: number) => (
                    <div
                      key={rIdx}
                      className={`review-card ${rev.isCorrect ? 'correct-card' : 'incorrect-card'}`}
                    >
                      <div className="review-header">
                        <strong>Q{rev.questionNumber}: {rev.question}</strong>
                        <span className={`status-pill ${rev.isCorrect ? 'pill-success' : 'pill-danger'}`}>
                          {rev.isCorrect ? '✓ Correct (+1)' : '✗ Incorrect'}
                        </span>
                      </div>

                      <div className="review-answer-details">
                        <p><strong>Your Answer:</strong> {rev.selectedOption}</p>
                        {!rev.isCorrect && (
                          <p style={{ color: 'var(--success)' }}>
                            <strong>Correct Answer:</strong> {rev.correctOption}
                          </p>
                        )}
                        {rev.explanation && (
                          <p className="review-explanation">
                            💡 <em>{rev.explanation}</em>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Mentor Create Quiz Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          title="Upload Weekly Sermon Notes & Quiz"
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateQuiz} className="quiz-create-form">
            <div className="input-group">
              <label>Lesson / Quiz Title <span className="required">*</span></label>
              <input
                type="text"
                required
                value={newQuiz.title}
                onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
                placeholder="e.g. Week 42: The Armor of God"
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Week Number (Optional)</label>
                <input
                  type="number"
                  value={newQuiz.weekNumber}
                  onChange={e => setNewQuiz({ ...newQuiz, weekNumber: e.target.value })}
                  placeholder="e.g. 42"
                />
              </div>

              <div className="input-group">
                <label>Target Class Category</label>
                <select
                  value={newQuiz.classCategoryId}
                  onChange={e => setNewQuiz({ ...newQuiz, classCategoryId: e.target.value })}
                >
                  <option value="">All Classes</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Bible Passage</label>
              <input
                type="text"
                value={newQuiz.biblePassage}
                onChange={e => setNewQuiz({ ...newQuiz, biblePassage: e.target.value })}
                placeholder="e.g. Ephesians 6:10-18"
              />
            </div>

            <div className="input-group">
              <label>Memory Verse</label>
              <input
                type="text"
                value={newQuiz.memoryVerse}
                onChange={e => setNewQuiz({ ...newQuiz, memoryVerse: e.target.value })}
                placeholder="e.g. Put on the whole armor of God, that ye may be able to stand..."
              />
            </div>

            <div className="input-group">
              <label>Sermon Notes for Kids to Study <span className="required">*</span></label>
              <textarea
                required
                rows={6}
                value={newQuiz.sermonNotes}
                onChange={e => setNewQuiz({ ...newQuiz, sermonNotes: e.target.value })}
                placeholder="Paste or write the weekly sermon summary, key teachings, and lessons for the kids to study before taking the quiz..."
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--primary)' }}>Multi-Choice Questions ({newQuiz.questions.length})</h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn btn-outline btn-sm"
              >
                + Add Question
              </button>
            </div>

            {newQuiz.questions.map((q, qIdx) => (
              <div key={qIdx} className="create-question-card glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong>Question {qIdx + 1}</strong>
                  {newQuiz.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="delete-small-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What is the shield used for in the armor of God?"
                    value={q.question}
                    onChange={e => {
                      const updated = [...newQuiz.questions];
                      if (updated[qIdx]) {
                        updated[qIdx] = { ...updated[qIdx], question: e.target.value };
                        setNewQuiz({ ...newQuiz, questions: updated });
                      }
                    }}
                  />
                </div>

                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                  Options (Select radio button for the correct answer):
                </label>

                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="create-option-row">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctOptionIndex === optIdx}
                      onChange={() => {
                        const updated = [...newQuiz.questions];
                        if (updated[qIdx]) {
                          updated[qIdx] = { ...updated[qIdx], correctOptionIndex: optIdx };
                          setNewQuiz({ ...newQuiz, questions: updated });
                        }
                      }}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      value={opt}
                      onChange={e => {
                        const updated = [...newQuiz.questions];
                        if (updated[qIdx]) {
                          const newOptions = [...updated[qIdx].options];
                          newOptions[optIdx] = e.target.value;
                          updated[qIdx] = { ...updated[qIdx], options: newOptions };
                          setNewQuiz({ ...newQuiz, questions: updated });
                        }
                      }}
                    />
                  </div>
                ))}

                <div className="input-group" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Optional explanation (e.g. Ephesians 6:16 says the shield of faith extinguishes fiery darts)"
                    value={q.explanation}
                    onChange={e => {
                      const updated = [...newQuiz.questions];
                      if (updated[qIdx]) {
                        updated[qIdx] = { ...updated[qIdx], explanation: e.target.value };
                        setNewQuiz({ ...newQuiz, questions: updated });
                      }
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="btn btn-primary submit-btn hover-lift"
              disabled={creating}
              style={{ marginTop: '1rem' }}
            >
              {creating ? "Publishing..." : "Publish Weekly Quiz & Notes"}
            </button>
          </form>
        </Modal>
      )}

      {/* View Submissions Modal */}
      {viewingSubmissionsQuiz && (
        <Modal
          isOpen={!!viewingSubmissionsQuiz}
          title={`Submissions: ${viewingSubmissionsQuiz.title}`}
          onClose={() => setViewingSubmissionsQuiz(null)}
          confirmText="Close"
          onConfirm={() => setViewingSubmissionsQuiz(null)}
        >
          <div className="submissions-view">
            {loadingSubmissions ? (
              <p>Loading student scores...</p>
            ) : submissions.length === 0 ? (
              <p className="text-secondary">No students have taken this quiz yet.</p>
            ) : (
              <div className="submissions-list">
                {submissions.map((sub: any) => (
                  <div key={sub._id} className="submission-item glass-panel">
                    <div>
                      <strong>{sub.childId?.name || 'Child'}</strong>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Submitted by: {sub.submittedBy?.name || 'Parent'} on {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="sub-score">{sub.score} / {sub.totalQuestions}</span>
                      <span className="sub-percent">{sub.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
