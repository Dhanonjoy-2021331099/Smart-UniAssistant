import Resource from '../models/Resource.js';
import Student from '../models/Student.js';

export const getResources = async (req, res) => {
  try {
    const { type, category, courseId } = req.query;
    
    const query = { isPublic: true };
    if (type) query.type = type;
    if (category) query.category = category;
    if (courseId) query.course = courseId;
    
    const resources = await Resource.find(query)
      .populate('course')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const incrementDownload = async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getResources, incrementDownload };