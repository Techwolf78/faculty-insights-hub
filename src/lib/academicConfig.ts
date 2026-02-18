// Academic Configuration utilities for INSYT

import { academicConfigApi, departmentsApi, collegesApi, AcademicConfig, College } from './storage';

// Default course data for ICEM (Engineering focused)
const icemDefaultCourseData: AcademicConfig['courseData'] = {
  'B.E': {
    years: ['1', '2', '3', '4'],
    yearDepartments: {
      '1': ['First Year Engineering'],
      '2': ['Computer Engineering', 'Artificial Intelligence & Data Science', 'Mechanical Engineering', 'Electronics & Telecommunication', 'Information Technology'],
      '3': ['Computer Engineering', 'Artificial Intelligence & Data Science', 'Mechanical Engineering', 'Civil Engineering', 'Electronics & Telecommunication', 'Information Technology'],
      '4': ['Computer Engineering', 'Artificial Intelligence & Data Science', 'Mechanical Engineering', 'Civil Engineering'],
    },
    semesters: ['Odd', 'Even'],
  },
  'MBA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Marketing Management', 'Human Resources Management', 'Financial Management'],
      '2': ['Marketing Management', 'Human Resources Management', 'Financial Management'],
    },
    semesters: ['Odd', 'Even'],
  },
  'MCA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['MCA'],
      '2': ['MCA'],
    },
    semesters: ['Odd', 'Even'],
  },
  'M.Tech': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Computer Engineering'],
      '2': ['Computer Engineering'],
    },
    semesters: ['Odd', 'Even'],
  },
  'BCA+MCA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Integrated BCA + MCA'],
      '2': ['Integrated BCA + MCA'],
    },
    semesters: ['Odd', 'Even'],
  },
};

// Default course data for IGSB (Business focused)
const igsbDefaultCourseData: AcademicConfig['courseData'] = {
  'MBA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['MBA'],
      '2': ['MBA'],
    },
    semesters: ['Odd', 'Even'],
  },
};

// Default subjects data for ICEM
const icemDefaultSubjectsData: AcademicConfig['subjectsData'] = {
  'B.E': {
    '1': {
      'First Year Engineering': {
        'Multivariate Calculus': { code: '25UBSL202', type: 'Theory', batches: [] },
        'Engineering Physics': { code: '25UBSL103', type: 'Theory / Practical', batches: [] },
        'Chemistry for Technology': { code: '25UBSL104', type: 'Theory', batches: [] },
        'Basic Electrical Engineering': { code: '25UBSL105', type: 'Theory', batches: [] },
        'Engineering Graphics': { code: '25UMEL111', type: 'Theory', batches: [] },
        'Model Making & Fabrication Workshop': { code: '25UMEP110', type: 'Practical', batches: [] },
        'Introduction to C Programming (Theory)': { code: '25UCEL107', type: 'Theory', batches: [] },
        'Introduction to C Programming (Practical)': { code: '25UCEPL107', type: 'Practical', batches: [] },
        'Introduction to Python Programming (Theory)': { code: '25UCEL208', type: 'Theory', batches: [] },
        'Introduction to Python Programming (Practical)': { code: '25UCEP208', type: 'Practical', batches: [] },
        'Basics of Civil Engineering & Mechanics': { code: '25UBSL112', type: 'Theory', batches: [] },
      },
    },
    '2': {
      'Computer Engineering': {
        'Data Security & Privacy': { code: '24UAIL405A', type: 'Theory', batches: [] },
        'Discrete Maths & Graph Theory': { code: '24UCEL403', type: 'Theory', batches: [] },
        'Advance Data Structure': { code: '24UCEL401', type: 'Theory', batches: [] },
        'Advance Data Structure Lab': { code: '24UCEP401', type: 'Practical', batches: [] },
        'Object Oriented Programming': { code: '24UCEL302', type: 'Theory', batches: [] },
        'Object Oriented Programming Lab': { code: '24UCEP302', type: 'Practical', batches: [] },
        'Operating System': { code: '24UCEL402', type: 'Theory', batches: [] },
        'Operating System Lab': { code: '24UCEP402', type: 'Practical', batches: [] },
        'Web Development': { code: '24UCEP404', type: 'Practical', batches: [] },
        'Environmental Studies': { code: '24UVEP407', type: 'Practical', batches: [] },
        'Advanced Data Structure Laboratory': { code: '24UCEP401', type: 'Theory', batches: [] },
      },
      'Artificial Intelligence & Data Science': {
        'Feature Engineering (Theory)': { code: '24UAIL401', type: 'Theory', batches: [] },
        'Feature Engineering Lab': { code: '24UAIP401', type: 'Practical', batches: [] },
        'Statistics & Probability': { code: '24UAIL403', type: 'Theory', batches: [] },
        'Cyber Security': { code: '24UCEL2E4', type: 'Theory', batches: [] },
      },
      'Mechanical Engineering': {
        'Theory of Machines (Theory)': { code: '24UMEL402', type: 'Theory', batches: [] },
        'Theory of Machines (Practical)': { code: '24UMEP402', type: 'Practical', batches: [] },
        'Motors & Battery Technology for EV': { code: '24UMEL3M22', type: 'Theory', batches: [] },
        'Environment Studies': { code: '24UVEP408', type: 'Practical', batches: [] },
      },
      'Electronics & Telecommunication': {
        'Signals & Systems': { code: '24UETL401', type: 'Theory', batches: [] },
        'Signals & Systems Lab': { code: '24UETP401', type: 'Practical', batches: [] },
        'Smart Sensors & IoT (Theory)': { code: '24UETL402', type: 'Theory', batches: [] },
        'Smart Sensors & IoT (Practical)': { code: '24UETP402', type: 'Practical', batches: [] },
      },
      'Information Technology': {
        'Operating Systems': { code: '24UITL402', type: 'Theory', batches: [] },
      },
    },
    '3': {
      'Computer Engineering': {
        'Cloud Computing': { code: '310254(C)', type: 'Theory', batches: [] },
        'Information Security': { code: '310254(A)', type: 'Theory', batches: [] },
        'Artificial Intelligence': { code: '310253', type: 'Theory', batches: [] },
        'Data Science & Big Data Analytics Lab': { code: '310256', type: 'Practical', batches: [] },
        'Laboratory Practice-II': { code: '310258', type: 'Practical', batches: [] },
      },
      'Artificial Intelligence & Data Science': {
        'Artificial Neural Network': { code: '317531', type: 'Theory', batches: [] },
        'Data Science': { code: '317529', type: 'Theory', batches: [] },
        'Software Lab III': { code: '317534', type: 'Practical', batches: [] },
        'Mini Project': { code: '317536', type: 'Practical', batches: [] },
      },
      'Mechanical Engineering': {
        'Computer Aided Engineering': { code: '302050', type: 'Theory', batches: [] },
        'Measurement Laboratory': { code: '302053', type: 'Practical', batches: [] },
        'Surface Engineering': { code: '302052-B', type: 'Theory', batches: [] },
        'Design of Transmission System': { code: '302051', type: 'Theory / Practical', batches: [] },
      },
      'Civil Engineering': {
        'Waste Water Engineering (Theory)': { code: '301012', type: 'Theory', batches: [] },
        'Waste Water Engineering (Practical)': { code: '301017', type: 'Practical', batches: [] },
        'Architecture & Town Planning (Theory)': { code: '301015e', type: 'Theory', batches: [] },
        'Architecture & Town Planning (Practical)': { code: '301020', type: 'Practical', batches: [] },
      },
      'Electronics & Telecommunication': {
        'Electronics Devices & Circuits': { code: '304193', type: 'Theory', batches: [] },
        'Project Management': { code: '24UETL301', type: 'Theory', batches: [] },
      },
      'Information Technology': {
        'Operating Systems Lab': { code: '24UITP402', type: 'Practical', batches: [] },
      },
    },
    '4': {
      'Computer Engineering': {
        'Computer Networks': { code: '310247', type: 'Theory', batches: [] },
        'Computer Networks Lab': { code: '310244', type: 'Practical', batches: [] },
        'Natural Language Processing': { code: '410252A', type: 'Theory', batches: [] },
        'Deep Learning': { code: '410251', type: 'Theory', batches: [] },
        'Laboratory Practice-V': { code: '410254', type: 'Practical', batches: [] },
      },
      'Artificial Intelligence & Data Science': {
        'Distributed Computing': { code: '417531', type: 'Theory', batches: [] },
        'Business Intelligence': { code: '417533(B)', type: 'Theory', batches: [] },
      },
      'Mechanical Engineering': {
        'Computer Integrated Manufacturing': { code: '402048', type: 'Theory / Practical', batches: [] },
        'Energy Engineering': { code: '402049', type: 'Theory / Practical', batches: [] },
        'Energy Audit & Management': { code: '402050B', type: 'Theory', batches: [] },
        'Electric & Hybrid Vehicle': { code: '402051E', type: 'Theory', batches: [] },
      },
      'Civil Engineering': {
        'Dams & Hydraulic Structures (Theory)': { code: '401011', type: 'Theory', batches: [] },
        'Dams & Hydraulic Structures (Practical)': { code: '401016', type: 'Practical', batches: [] },
        'Quantity Surveying, Contracts & Tenders (Theory)': { code: '401012', type: 'Theory', batches: [] },
        'Quantity Surveying, Contracts & Tenders (Practical)': { code: '401017', type: 'Practical', batches: [] },
        'Irrigation & Drainage (Theory)': { code: '401013c', type: 'Theory', batches: [] },
        'Irrigation & Drainage (Practical)': { code: '401018', type: 'Practical', batches: [] },
        'Green Structures & Smart Cities': { code: '401014e', type: 'Theory', batches: [] },
        'Audit Course – Social Responsibility': { code: '401019', type: 'Tutorial', batches: [] },
      },
    },
  },
  'MBA': {
    '1': {
      'Marketing Management': {
        'Marketing Management': { code: 'GC–09', type: 'Theory', batches: [] },
        'Digital Marketing-I': { code: 'SE-MKT-01', type: 'Theory', batches: [] },
      },
      'Human Resources Management': {
        'HR Operations': { code: 'GEHR06', type: 'Theory', batches: [] },
        'Learning & Development': { code: 'SEHR01', type: 'Theory', batches: [] },
      },
      'Financial Management': {
        'Financial Management': { code: 'GC10', type: 'Theory', batches: [] },
        'Cost & Works Accounting': { code: 'SE-FIN-02', type: 'Theory', batches: [] },
        'Indian Economy': { code: 'GC12', type: 'Theory', batches: [] },
        'Banking & Financial Intermediation': { code: 'SE-FIN-03', type: 'Theory', batches: [] },
      },
    },
    '2': {
      'Marketing Management': {
        'Digital Marketing-II': { code: 'SE-MKT-16', type: 'Theory', batches: [] },
        'Marketing Strategy': { code: 'SE-MKT-02', type: 'Theory', batches: [] },
        'Customer Relationship Management': { code: 'SE-MKT-15', type: 'Theory', batches: [] },
        'Marketing 5.0': { code: 'SEMKT13', type: 'Theory', batches: [] },
      },
      'Human Resources Management': {
        'Best Practices in HRM': { code: 'SE-HR-13', type: 'Theory', batches: [] },
        'Labour Welfare': { code: 'SC-HR-02', type: 'Theory', batches: [] },
        'Performance Management System': { code: 'SE-HR-16', type: 'Theory', batches: [] },
        'Change Management & New Technologies in HRM': { code: 'SEHR17', type: 'Theory', batches: [] },
        'Designing HR Policies': { code: 'SE.HR-18', type: 'Theory', batches: [] },
      },
      'Financial Management': {
        'Financial Markets & Banking Operations': { code: 'SCFIN.02', type: 'Theory', batches: [] },
        'Rural & Micro Finance': { code: 'SEFIN-13', type: 'Theory', batches: [] },
        'Fixed Income Securities': { code: 'SE-FIN-16', type: 'Theory', batches: [] },
        'Project & Trade Finance': { code: 'SE-FIN-17', type: 'Theory', batches: [] },
      },
    },
  },
  'MCA': {
    '1': {
      'MCA': {
        'Research Methodology': { code: 'MCA204', type: 'Theory', batches: [] },
        'Python Programming': { code: 'MCA201', type: 'Theory', batches: [] },
        'Python Programming Lab': { code: 'MCA201L', type: 'Practical', batches: [] },
        'AIML Lab': { code: 'MCA206L', type: 'Practical', batches: [] },
        'Software Testing & Tools': { code: 'MCA203', type: 'Theory', batches: [] },
        'Power BI': { code: 'MCA207L', type: 'Theory', batches: [] },
      },
    },
    '2': {
      'MCA': {},
    },
  },
  'M.Tech': {
    '1': {
      'Computer Engineering': {
        'Business Intelligence': { code: '', type: 'Theory', batches: [] },
      },
    },
    '2': {
      'Computer Engineering': {
        'Analysis of Algorithms': { code: '24PCE102', type: 'Theory', batches: [] },
      },
    },
  },
  'BCA+MCA': {
    '1': {
      'Integrated BCA + MCA': {
        'Lab Course on Programming with Python': { code: 'CA-154-T', type: 'Practical', batches: [] },
        'UI/UX': { code: 'CA-156-VSC', type: 'Theory', batches: [] },
        'Democracy, Election & Governance': { code: 'CA-160-VEC', type: 'Theory', batches: [] },
        'Essentials of Business Etiquette': { code: 'CA-156-AEC', type: 'Theory', batches: [] },
        'Open Elective-III': { code: 'CA-157-OE', type: 'Theory', batches: [] },
        'Open Elective-IV': { code: 'CA-158-OE', type: 'Theory', batches: [] },
        'Core Java Programming': { code: 'CA–257–MN', type: 'Theory', batches: [] },
        'Core Java Programming Lab': { code: 'CA–257–MN', type: 'Practical', batches: [] },
      },
    },
    '2': {
      'Integrated BCA + MCA': {
        'Web Programming using PHP': { code: 'CA-253-T', type: 'Theory', batches: [] },
        'Lab Course on PHP': { code: 'CA-254-P', type: 'Practical', batches: [] },
        'Gen AI & Prompt Engineering': { code: 'CA-255-SEC', type: 'Theory', batches: [] },
        'Community Project': { code: 'CA-256-CEP', type: 'Practical', batches: [] },
      },
    },
  },
};

// Default subjects data for IGSB
const igsbDefaultSubjectsData: AcademicConfig['subjectsData'] = {
  'MBA': {
    '1': {
      'MBA': {
        'Desk Research': { code: 'RM-02', type: 'Theory', batches: [] },
        'Legal Aspect of Business': { code: 'GC-205', type: 'Theory', batches: [] },
        'Financial Management': { code: 'GC 202', type: 'Theory', batches: [] },
        'Sustainable Development Goals': { code: '562 MJ', type: 'Theory', batches: [] },
        'Business Research Methods': { code: 'RM 01-206', type: 'Theory', batches: [] },
        'Technology Tools in Business Management -II': { code: '210 GE-09', type: 'Theory', batches: [] },
        'Technical Analysis of Financial Markets': { code: '407 FIN SE-11', type: 'Theory', batches: [] },
        'Human Resource Management': { code: 'GC 11 203', type: 'Theory', batches: [] },
        'Operations and Supply Chain Management': { code: 'GC-12 204', type: 'Theory', batches: [] },
        'Field project': { code: '', type: 'Theory', batches: [] },
        'Marketing Management': { code: '201 - GC 09', type: 'Theory', batches: [] },
      },
    },
    '2': {
      'MBA': {
        'Retail Marketing': { code: 'MKT-409', type: 'Theory', batches: [] },
        'Risk Management': { code: 'RM658ME', type: 'Theory', batches: [] },
        'Global HR Practices': { code: 'HRM SE-HRM-14', type: 'Theory', batches: [] },
        'Performance Management System': { code: 'HRM SE-HRM-12', type: 'Theory', batches: [] },
        'Research Project': { code: 'RM 404', type: 'Theory', batches: [] },
        'Employee Relations and Labour Legislations': { code: 'HR SC 403', type: 'Theory', batches: [] },
        'Business Valuation': { code: 'SE FIN-10', type: 'Theory', batches: [] },
        'Corporate Financial Restructuring': { code: 'SE FIN-15', type: 'Theory', batches: [] },
        'Enterprise Performance Management': { code: 'GC 402', type: 'Theory', batches: [] },
        'Financial Markets & Banking Operations': { code: 'SC 403', type: 'Theory', batches: [] },
        'Industry 4.0': { code: 'SC 403', type: 'Theory', batches: [] },
        'Six Sigma': { code: 'SC 404', type: 'Theory', batches: [] },
        'Change Management and New technologies in HRM': { code: '409 HRM SE-HRM-13', type: 'Theory', batches: [] },
        'World Class Manufacturing': { code: 'SE 408', type: 'Theory', batches: [] },
        'Sustainable Supply Chain': { code: 'SE 412', type: 'Theory', batches: [] },
        'Entrepreneurship, Innovation and Design Thinking': { code: 'GC 401', type: 'Theory', batches: [] },
        'Compensation & Reward Management': { code: 'GE 405', type: 'Theory', batches: [] },
        'Recent trends in Marketing': { code: '403 - SC MKT - 02', type: 'Theory', batches: [] },
        'Marketing Strategy': { code: '411 - SE MKT - 15', type: 'Theory', batches: [] },
        'Marketing of Financial Services': { code: '410 - SE MKT 14', type: 'Theory', batches: [] },
        'Digital Marketing II': { code: '408 - SE MKT 12', type: 'Theory', batches: [] },
      },
    },
  },
};

// Function to get default config based on college code
const getDefaultConfig = (collegeCode: string): { courseData: AcademicConfig['courseData'], subjectsData: AcademicConfig['subjectsData'], batches: string[] } => {
  if (collegeCode === 'ICEM') {
    return { courseData: icemDefaultCourseData, subjectsData: icemDefaultSubjectsData, batches: [] };
  } else if (collegeCode === 'IGSB') {
    return { courseData: igsbDefaultCourseData, subjectsData: igsbDefaultSubjectsData, batches: defaultBatches };
  } else {
    // Fallback to ICEM defaults
    return { courseData: icemDefaultCourseData, subjectsData: icemDefaultSubjectsData, batches: [] };
  }
};
// Default batches
const defaultBatches = ['A', 'B', 'C', 'D'];

export interface AcademicConfigData {
  courseData: Record<string, {
    years: string[];
    yearDepartments: Record<string, string[]>;
    semesters?: string[];
  }>;
  subjectsData: Record<string, Record<string, Record<string, Record<string, { code: string; type: string; batches: string[] }>>>>;
  batches: string[];
}

/**
 * Get academic configuration for a college
 * Returns default config if none exists
 */
export const getAcademicConfig = async (collegeId: string): Promise<AcademicConfigData> => {
  try {
    const config = await academicConfigApi.getByCollege(collegeId);
    if (config) {
      return {
        courseData: config.courseData,
        subjectsData: config.subjectsData,
        batches: config.batches || defaultBatches,
      };
    }
  } catch (error) {
    console.error('Error loading academic config:', error);
  }

  // Get college to determine default config
  try {
    const college = await collegesApi.getById(collegeId);
    const { courseData, subjectsData, batches } = getDefaultConfig(college?.code || 'ICEM');
    return {
      courseData,
      subjectsData,
      batches,
    };
  } catch (error) {
    console.error('Error loading college for default config:', error);
    // Fallback to ICEM defaults
    const { courseData, subjectsData, batches } = getDefaultConfig('ICEM');
    return {
      courseData,
      subjectsData,
      batches,
    };
  }
};

/**
 * Save academic configuration for a college
 */
export const saveAcademicConfig = async (
  collegeId: string,
  courseData: AcademicConfig['courseData'],
  subjectsData: AcademicConfig['subjectsData'],
  batches: string[] = defaultBatches
): Promise<boolean> => {
  try {
    // Save the academic configuration
    await academicConfigApi.upsert(collegeId, { courseData, subjectsData, batches });

    // Extract unique departments and create department documents
    const uniqueDepartments = new Set<string>();
    Object.values(courseData).forEach(course => {
      Object.values(course.yearDepartments).forEach(departments => {
        departments.forEach(dept => uniqueDepartments.add(dept));
      });
    });

    // Create department documents for each unique department
    const departmentPromises = Array.from(uniqueDepartments).map(async (deptName) => {
      // Check if department already exists for this college
      const existingDepts = await departmentsApi.getByCollege(collegeId);
      const existingDept = existingDepts.find(dept => dept.name === deptName);
      
      if (!existingDept) {
        // Generate a department code from the name (lowercase, replace spaces with hyphens)
        const code = deptName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Create new department document
        await departmentsApi.create({
          collegeId,
          name: deptName,
          code,
          isActive: true,
        });
      }
    });

    await Promise.all(departmentPromises);

    return true;
  } catch (error) {
    console.error('Error saving academic config:', error);
    return false;
  }
};

/**
 * Get available years for a course
 */
export const getYearsForCourse = (
  courseData: AcademicConfig['courseData'],
  course: string
): string[] => {
  return courseData[course]?.years || [];
};

/**
 * Get available departments for a course
 */
export const getDepartmentsForCourse = (
  courseData: AcademicConfig['courseData'],
  course: string
): string[] => {
  const courseInfo = courseData[course];
  if (!courseInfo) return [];
  const depts = new Set<string>();
  Object.values(courseInfo.yearDepartments).forEach(deptsArray => {
    deptsArray.forEach(dept => depts.add(dept));
  });
  return Array.from(depts);
};

/**
 * Get available subjects for a specific course/year/department combination
 */
export const getSubjectsForContext = (
  subjectsData: AcademicConfig['subjectsData'],
  course: string,
  year: string,
  department: string
): string[] => {
  return Object.keys(subjectsData[course]?.[year]?.[department] || {});
};

/**
 * Get all available courses
 */
export const getAllCourses = (courseData: AcademicConfig['courseData']): string[] => {
  return Object.keys(courseData);
};

/**
 * Get semesters for a course (if defined)
 */
export const getSemestersForCourse = (
  courseData: AcademicConfig['courseData'],
  course: string
): string[] => {
  return courseData[course]?.semesters || ['Odd', 'Even'];
};

// Export defaults for use in seed data
export { icemDefaultCourseData, icemDefaultSubjectsData, igsbDefaultCourseData, igsbDefaultSubjectsData, defaultBatches };
export { icemDefaultCourseData as defaultCourseData, icemDefaultSubjectsData as defaultSubjectsData };