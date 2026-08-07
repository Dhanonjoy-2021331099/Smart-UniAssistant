import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Student from '../models/Student.js';
import { uploadFile, generateFilePath } from '../config/storage.js';
import File from '../models/File.js';

export const submitAssignment = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const { assignmentId, githubLink, comments } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: student._id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }
    
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const path = generateFilePath(req.user._id.toString(), file.originalname);
        const result = await uploadFile(path, file.buffer, file.mimetype);
        const storagePath = result?.path || path;

        await File.create({
          originalFileName: file.originalname,
          storagePath,
          contentType: file.mimetype,
          size: result?.size ?? file.size,
          uploadedBy: req.user._id,
          relatedModel: 'Submission'
        });

        files.push({
          fileName: file.originalname,
          filePath: storagePath,
          fileSize: result?.size ?? file.size,
          fileType: file.mimetype
        });
      }
    }
    
    const isLate = new Date() > new Date(assignment.dueDate);
    
    const submission = await Submission.create({
      assignment: assignmentId,
      student: student._id,
      submittedBy: req.user._id,
      files,
      githubLink,
      comments,
      isLate
    });
    
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    
    const submissions = await Submission.find({ student: student._id })
      .populate('assignment')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { submitAssignment, getMySubmissions };