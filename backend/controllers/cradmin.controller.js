import CRAdmin from "../models/CRAdmin.js";
import Routine from "../models/Routine.js";
import Notice from "../models/Notice.js";
import Event from "../models/Event.js";
import Resource from "../models/Resource.js";

export const getDashboard = async (req, res) => {
  try {
    const crAdmin = await CRAdmin.findOne({ userId: req.user._id })
      .populate("department")
      .populate("batch");

    if (!crAdmin) {
      return res.json({ crAdmin: null, notices: [], events: [] });
    }

    const notices = await Notice.find()
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(5);

    const events = await Event.find({ batch: crAdmin.batch })
      .sort({ startDate: -1 })
      .limit(5);

    res.json({ crAdmin, notices, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const crAdmin = await CRAdmin.findOne({ userId: req.user._id });
    if (!crAdmin) {
      return res.status(404).json({ error: "CR Admin profile not found" });
    }
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      organizer,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      organizer,
      batch: crAdmin.batch,
      department: crAdmin.department,
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const manageRoutine = async (req, res) => {
  try {
    const crAdmin = await CRAdmin.findOne({ userId: req.user._id });
    if (!crAdmin) {
      return res.status(404).json({ error: "CR Admin profile not found" });
    }
    const { type, semester, schedule, examSchedule } = req.body;

    const routine = await Routine.findOneAndUpdate(
      { batch: crAdmin.batch, type, semester },
      {
        department: crAdmin.department,
        schedule,
        examSchedule,
        createdBy: req.user._id,
      },
      { returnDocument: 'after', upsert: true },
    );

    res.json(routine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadResource = async (req, res) => {
  try {
    const crAdmin = await CRAdmin.findOne({ userId: req.user._id });
    if (!crAdmin) {
      return res.status(404).json({ error: "CR Admin profile not found" });
    }
    const { title, description, type, category, externalLink, tags } = req.body;

    const resource = await Resource.create({
      title,
      description,
      type,
      category,
      externalLink,
      tags,
      batch: crAdmin.batch,
      department: crAdmin.department,
      uploadedBy: req.user._id,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getDashboard,
  createEvent,
  manageRoutine,
  uploadResource,
};
