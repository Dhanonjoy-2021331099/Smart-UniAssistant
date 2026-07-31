import Event from '../models/Event.js';

export const getEvents = async (req, res) => {
  try {
    const { type, batchId, upcoming } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (batchId) query.batch = batchId;
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }
    
    const events = await Event.find(query)
      .populate('batch')
      .populate('department')
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { getEvents };