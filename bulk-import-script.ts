import { readFileSync } from 'fs';
import { facultyAllocationsApi } from './src/lib/storage';

// Type definitions
interface AllocationData {
  'Full Name *': string;
  'Course *'?: string;
  'Program *'?: string;
  'Year *': string;
  'Semester *': string;
  'Department *': string;
  'Subjects *': string;
  'Subject Code*': string;
  'Subject Type*': string;
  'Specialization'?: string;
}

// Script to bulk import faculty allocations from JSON file
async function bulkImportAllocations() {
  try {
    // Get filename and collegeId from command line
    const filename = process.argv[2] || './icem_fac_sub_allocation.json';
    const collegeId = process.argv[3] || 'demo-college-id';

    if (!filename) {
      console.log('Usage: npx ts-node bulk-import-script.ts [json-file] [college-id]');
      return;
    }

    // Read the JSON file
    const jsonData = readFileSync(filename, 'utf-8');
    const allocationData = JSON.parse(jsonData);

    // Validate the data structure
    if (!Array.isArray(allocationData)) {
      throw new Error('JSON data must be an array');
    }

    console.log(`Found ${allocationData.length} allocation records in ${filename} to import for college ${collegeId}`);

    // Transform data to match API expectations
    const transformedData = allocationData.map((item: AllocationData) => ({
      facultyName: item['Full Name *']?.trim(),
      course: (item['Course *'] || item['Program *'] || '').trim(),
      year: item['Year *']?.trim(),
      semester: item['Semester *']?.trim() || '',
      department: item['Department *']?.trim(),
      subjectName: item['Subjects *']?.trim(),
      subjectCode: item['Subject Code*']?.trim(),
      subjectType: (item['Subject Type*']?.trim() || 'Theory') as 'Theory' | 'Practical' | 'Tutorial'
    }));

    console.log('Starting bulk import...');
    const result = await facultyAllocationsApi.bulkImportAllocations(collegeId, transformedData);

    console.log('Bulk import completed:');
    console.log(`✅ Successfully imported: ${result.success} allocations`);
    if (result.errors.length > 0) {
      console.log(`❌ Errors (${result.errors.length}):`);
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

  } catch (error: unknown) {
    console.error('Error during bulk import:', error);
    process.exit(1);
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  bulkImportAllocations();
}

export { bulkImportAllocations };