import QuestionBank from '../models/QuestionBank.js';

export const getQuestions = async (req, res) => {
  try {
    const { courseId, examType, year } = req.query;
    
    const query = {};
    if (courseId) query.course = courseId;
    if (examType) query.examType = examType;
    if (year) query.year = year;
    
    const questions = await QuestionBank.find(query)
      .populate('course')
      .populate('batch')
      .populate('uploadedBy', 'name email')
      .sort({ year: -1, createdAt: -1 });
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadQuestion = async (req, res) => {
  try {
    const { courseId, batchId, year, semester, examType, title, questions, solution, tags } = req.body;
    
    const questionBank = await QuestionBank.create({
      course: courseId,
      batch: batchId,
      year,
      semester,
      examType,
      title,
      questions,
      solution,
      tags,
      uploadedBy: req.user._id
    });
    
    res.status(201).json(questionBank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getQuestions, uploadQuestion };