import api from './api';

export const getStudentCourses = () =>
  api.get('/api/students/courses').then((res) => res.data);

export const updateStudentProfile = (payload) =>
  api.put('/api/students/profile', payload).then((res) => res.data);

export default {
  getStudentCourses,
  updateStudentProfile,
};