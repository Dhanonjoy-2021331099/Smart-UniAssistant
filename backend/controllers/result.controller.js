import Result from '../models/Result.js';
import Student from '../models/Student.js';

export const publishResults = async (req, res) => {
  try {
    const { resultIds } = req.body;
    
    await Result.updateMany(
      { _id: { $in: resultIds } },
      { isPublished: true, publishedBy: req.user._id, publishedAt: new Date() }
    );
    
    res.json({ message: 'Results published successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResultsByCourse = async (req, res) => {
  try {
    const { courseId, batchId } = req.query;
    
    const results = await Result.find({ course: courseId, batch: batchId })
      .populate('student')
      .populate('course')
      .sort({ totalMarks: -1 });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { publishResults, getResultsByCourse };