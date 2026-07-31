import Course from '../models/Course.js';

export const getCourses = async (req, res) => {
  try {
    const { departmentId, semester } = req.query;
    
    const query = { isActive: true };
    if (departmentId) query.department = departmentId;
    if (semester) query.semester = semester;
    
    const courses = await Course.find(query)
      .populate('department')
      .sort({ semester: 1, code: 1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId)
      .populate('department')
      .populate('prerequisites');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getCourses, getCourseById };