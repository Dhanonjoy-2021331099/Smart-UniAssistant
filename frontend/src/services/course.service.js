const COURSE_CATALOG = [
  // Year 1 - Semester 1
  { id: "cse101", code: "CSE 101", name: "Structured Programming", credits: 3, type: "Theory", semester: "1-1", description: "Introduction to problem solving, algorithms and structured programming using C." },
  { id: "cse102", code: "CSE 102", name: "Structured Programming Laboratory", credits: 1.5, type: "Lab", semester: "1-1", description: "Hands-on practice in writing, debugging and testing C programs." },
  { id: "mat103", code: "MAT 103", name: "Calculus I", credits: 3, type: "Theory", semester: "1-1", description: "Limits, continuity, differentiation and integration of single-variable functions." },
  { id: "phy101", code: "PHY 101", name: "Physics I", credits: 3, type: "Theory", semester: "1-1", description: "Mechanics, waves, optics and thermodynamics for engineers." },
  { id: "phy102", code: "PHY 102", name: "Physics Laboratory", credits: 1.5, type: "Lab", semester: "1-1", description: "Experimental verification of fundamental laws of mechanics and optics." },
  { id: "eng101", code: "ENG 101", name: "Functional English", credits: 2, type: "Theory", semester: "1-1", description: "Academic writing, reading comprehension and presentation skills." },

  // Year 1 - Semester 2
  { id: "cse103", code: "CSE 103", name: "Object Oriented Programming", credits: 3, type: "Theory", semester: "1-2", description: "Concepts of classes, objects, inheritance, polymorphism and encapsulation." },
  { id: "cse104", code: "CSE 104", name: "Object Oriented Programming Laboratory", credits: 1.5, type: "Lab", semester: "1-2", description: "Implementation of object-oriented design patterns using C++ or Java." },
  { id: "mat104", code: "MAT 104", name: "Calculus II", credits: 3, type: "Theory", semester: "1-2", description: "Sequences, series, multivariable calculus and applications." },
  { id: "sta101", code: "STA 101", name: "Basic Statistics", credits: 3, type: "Theory", semester: "1-2", description: "Descriptive statistics, probability distributions and hypothesis testing." },
  { id: "cse105", code: "CSE 105", name: "Digital Logic Design", credits: 3, type: "Theory", semester: "1-2", description: "Boolean algebra, combinational and sequential logic circuits." },
  { id: "cse106", code: "CSE 106", name: "Digital Logic Design Laboratory", credits: 1.5, type: "Lab", semester: "1-2", description: "Design and simulation of digital circuits using logic gates." },

  // Year 2 - Semester 1
  { id: "cse201", code: "CSE 201", name: "Data Structures", credits: 3, type: "Theory", semester: "2-1", description: "Linear and non-linear data structures with complexity analysis." },
  { id: "cse202", code: "CSE 202", name: "Data Structures Laboratory", credits: 1.5, type: "Lab", semester: "2-1", description: "Implementation of stacks, queues, trees and graphs." },
  { id: "cse203", code: "CSE 203", name: "Algorithms", credits: 3, type: "Theory", semester: "2-1", description: "Design and analysis of algorithms, sorting, searching and dynamic programming." },
  { id: "mat201", code: "MAT 201", name: "Linear Algebra", credits: 3, type: "Theory", semester: "2-1", description: "Matrices, vector spaces, eigenvalues and applications." },
  { id: "cse205", code: "CSE 205", name: "Computer Organization", credits: 3, type: "Theory", semester: "2-1", description: "CPU architecture, memory hierarchy and assembly-level organization." },
  { id: "acc101", code: "ACC 101", name: "Principles of Accounting", credits: 2, type: "Theory", semester: "2-1", description: "Fundamentals of financial accounting for business decision making." },

  // Year 2 - Semester 2
  { id: "cse206", code: "CSE 206", name: "Database Systems", credits: 3, type: "Theory", semester: "2-2", description: "Relational model, SQL, normalization and transaction management." },
  { id: "cse207", code: "CSE 207", name: "Database Systems Laboratory", credits: 1.5, type: "Lab", semester: "2-2", description: "Designing and querying relational databases using SQL." },
  { id: "cse208", code: "CSE 208", name: "Operating Systems", credits: 3, type: "Theory", semester: "2-2", description: "Processes, scheduling, memory management and file systems." },
  { id: "cse209", code: "CSE 209", name: "Operating Systems Laboratory", credits: 1.5, type: "Lab", semester: "2-2", description: "System calls, process synchronization and shell scripting." },
  { id: "cse211", code: "CSE 211", name: "Theory of Computation", credits: 3, type: "Theory", semester: "2-2", description: "Automata theory, formal languages and computational complexity." },
  { id: "mat202", code: "MAT 202", name: "Numerical Methods", credits: 3, type: "Theory", semester: "2-2", description: "Numerical techniques for solving equations and interpolation." },

  // Year 3 - Semester 1
  { id: "cse301", code: "CSE 301", name: "Computer Networks", credits: 3, type: "Theory", semester: "3-1", description: "OSI/TCP-IP models, routing, transport protocols and network security." },
  { id: "cse302", code: "CSE 302", name: "Computer Networks Laboratory", credits: 1.5, type: "Lab", semester: "3-1", description: "Socket programming and network simulation exercises." },
  { id: "cse303", code: "CSE 303", name: "Software Engineering", credits: 3, type: "Theory", semester: "3-1", description: "Software development life cycle, requirements and project management." },
  { id: "cse305", code: "CSE 305", name: "Microprocessors and Assembly", credits: 3, type: "Theory", semester: "3-1", description: "Microprocessor architecture and assembly language programming." },
  { id: "cse307", code: "CSE 307", name: "Artificial Intelligence", credits: 3, type: "Theory", semester: "3-1", description: "Search algorithms, knowledge representation and reasoning." },
  { id: "mat301", code: "MAT 301", name: "Probability and Statistics for CSE", credits: 3, type: "Theory", semester: "3-1", description: "Random variables, distributions and statistical inference." },

  // Year 3 - Semester 2
  { id: "cse308", code: "CSE 308", name: "Machine Learning", credits: 3, type: "Theory", semester: "3-2", description: "Supervised and unsupervised learning, regression and classification." },
  { id: "cse310", code: "CSE 310", name: "Compiler Design", credits: 3, type: "Theory", semester: "3-2", description: "Lexical analysis, parsing, semantic analysis and code generation." },
  { id: "cse311", code: "CSE 311", name: "Computer Graphics", credits: 3, type: "Theory", semester: "3-2", description: "Rendering pipelines, transformations and rasterization." },
  { id: "cse312", code: "CSE 312", name: "Computer Graphics Laboratory", credits: 1.5, type: "Lab", semester: "3-2", description: "Interactive graphics programming and 3D modeling." },
  { id: "cse313", code: "CSE 313", name: "Web Engineering", credits: 3, type: "Theory", semester: "3-2", description: "Client-server web architecture, REST APIs and full-stack development." },
  { id: "cse314", code: "CSE 314", name: "Web Engineering Laboratory", credits: 1.5, type: "Lab", semester: "3-2", description: "Building responsive web applications with modern frameworks." },

  // Year 4 - Semester 1
  { id: "cse401", code: "CSE 401", name: "Distributed Systems", credits: 3, type: "Theory", semester: "4-1", description: "Distributed architectures, consistency, replication and fault tolerance." },
  { id: "cse403", code: "CSE 403", name: "Information Security", credits: 3, type: "Theory", semester: "4-1", description: "Cryptography, authentication, and secure system design." },
  { id: "cse405", code: "CSE 405", name: "Parallel Computing", credits: 3, type: "Theory", semester: "4-1", description: "Parallel algorithms, concurrency and performance optimization." },
  { id: "cse407", code: "CSE 407", name: "Elective I: Data Mining", credits: 3, type: "Theory", semester: "4-1", description: "Data preprocessing, clustering and association rule mining." },
  { id: "cse409", code: "CSE 409", name: "Capstone Project I", credits: 3, type: "Project", semester: "4-1", description: "Design and implementation of a major software project." },

  // Year 4 - Semester 2
  { id: "cse402", code: "CSE 402", name: "Capstone Project II", credits: 4, type: "Project", semester: "4-2", description: "Completion, documentation and defense of the capstone project." },
  { id: "cse404", code: "CSE 404", name: "Professional Ethics and Soft Skills", credits: 2, type: "Theory", semester: "4-2", description: "Professional conduct, communication and career readiness." },
  { id: "cse406", code: "CSE 406", name: "Elective II: Cloud Computing", credits: 3, type: "Theory", semester: "4-2", description: "Cloud service models, virtualization and deployment pipelines." },
  { id: "cse408", code: "CSE 408", name: "Internship", credits: 3, type: "Project", semester: "4-2", description: "Industry internship with a structured learning outcome." },
];

export const SEMESTERS = [
  { id: "1-1", year: 1, semester: 1, label: "Year 1 - Semester 1" },
  { id: "1-2", year: 1, semester: 2, label: "Year 1 - Semester 2" },
  { id: "2-1", year: 2, semester: 1, label: "Year 2 - Semester 1" },
  { id: "2-2", year: 2, semester: 2, label: "Year 2 - Semester 2" },
  { id: "3-1", year: 3, semester: 1, label: "Year 3 - Semester 1" },
  { id: "3-2", year: 3, semester: 2, label: "Year 3 - Semester 2" },
  { id: "4-1", year: 4, semester: 1, label: "Year 4 - Semester 1" },
  { id: "4-2", year: 4, semester: 2, label: "Year 4 - Semester 2" },
];

export const getSemesters = () => SEMESTERS;

export const getSemesterLabel = (semesterId) => {
  const semester = SEMESTERS.find((item) => item.id === semesterId);
  return semester ? semester.label : "Unknown Semester";
};

export const getSemesterCourses = (semesterId) =>
  COURSE_CATALOG.filter((course) => course.semester === semesterId);

export const getCourseById = (courseId) =>
  COURSE_CATALOG.find((course) => course.id === courseId);

export const getAllCourses = () => COURSE_CATALOG;
