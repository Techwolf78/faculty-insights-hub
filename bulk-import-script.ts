import { readFileSync } from 'fs';
import { facultyAllocationsApi } from './src/lib/storage';

// Type definitions
interface AllocationData {
  'Full Name *': string;
  'Program *': string;
  'Year *': string;
  'Department *': string;
  'Subjects *': string;
  'Subject Code*': string;
  'Subject Type*': string;
  'Specialization'?: string;
}

// Script to bulk import faculty allocations from JSON file
async function bulkImportAllocations() {
  try {
    // Read the JSON file
    const jsonData = readFileSync('./icem_fac_sub_allocation.json', 'utf-8');
    const allocationData = JSON.parse(jsonData);

    // Validate the data structure
    if (!Array.isArray(allocationData)) {
      throw new Error('JSON data must be an array');
    }

    console.log(`Found ${allocationData.length} allocation records to import`);

    // Transform data to match API expectations
    const transformedData = allocationData.map((item: AllocationData) => ({
      facultyName: item['Full Name *'],
      course: item['Program *'],
      year: item['Year *'],
      department: item['Department *'],
      subjectName: item['Subjects *'],
      subjectCode: item['Subject Code*'],
      subjectType: item['Subject Type*'] as 'Theory' | 'Practical' | 'Tutorial'
    }));

    // For demo purposes, using a placeholder collegeId
    // In production, this would be passed as an argument or read from config
    const collegeId = 'demo-college-id';

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