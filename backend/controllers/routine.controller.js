import Routine from '../models/Routine.js';
import Student from '../models/Student.js';

export const getRoutines = async (req, res) => {
  try {
    const { batchId, type } = req.query;
    
    const query = { isActive: true };
    if (batchId) query.batch = batchId;
    if (type) query.type = type;
    
    const routines = await Routine.find(query)
      .populate('batch')
      .populate('department')
      .populate('schedule.course')
      .populate('schedule.teacher')
      .populate('examSchedule.course');
    
    res.json(routines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getRoutines };