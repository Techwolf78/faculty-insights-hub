import { readFileSync, writeFileSync } from 'fs';

// Type definitions
interface AllocationData {
  'Full Name *': string;
  'Course *'?: string;
  'Program *'?: string;
  'Year *': string;
  'Semester *'?: string;
  'Department *': string;
  'Subjects *': string;
  'Subject Code*': string;
  'Subject Type*': string;
  'Specialization'?: string;
  [key: string]: string | undefined; // Index signature for dynamic access
}

interface FixRecord {
  index: number;
  field: string;
  oldValue: string;
  newValue: string;
}

// Script to analyze and fix faculty allocation JSON data
function analyzeAndFixAllocations() {
  try {
    // Read the JSON file
    const jsonData = readFileSync('./icem_fac_sub_allocation.json', 'utf-8');
    const allocations: AllocationData[] = JSON.parse(jsonData);

    console.log(`Analyzing ${allocations.length} allocation records...\n`);

    const issues: string[] = [];
    const fixes: Array<FixRecord> = [];

    allocations.forEach((item: AllocationData, index: number) => {
      const itemNum = index + 1;

      // Check for Program * or Course *
      if (!item['Program *'] && !item['Course *']) {
        issues.push(`Item ${itemNum}: Missing both 'Program *' and 'Course *'`);
      }

      // Check required fields
      const requiredFields = [
        'Full Name *',
        'Year *',
        'Department *',
        'Subjects *',
        'Subject Code*',
        'Subject Type*'
      ];

      for (const field of requiredFields) {
        if (!item[field] || typeof item[field] !== 'string' || item[field].trim() === '') {
          issues.push(`Item ${itemNum}: Missing or empty ${field}`);
          if (field === 'Subject Code*' && (!item[field] || item[field].trim() === '')) {
            fixes.push({
              index,
              field,
              oldValue: item[field],
              newValue: 'TBD' // To Be Determined
            });
          }
        }
      }

      // Check for Semester *
      if (!item['Semester *'] || item['Semester *'].trim() === '') {
        issues.push(`Item ${itemNum}: Missing or empty 'Semester *'`);
      }

      // Check subject type
      if (item['Subject Type*']) {
        const validTypes = ['Theory', 'Practical', 'Tutorial'];
        if (!validTypes.includes(item['Subject Type*'])) {
          issues.push(`Item ${itemNum}: Invalid Subject Type "${item['Subject Type*']}" - should be Theory, Practical, or Tutorial`);
        }
      }

      // Check for empty year
      if (item['Year *'] && item['Year *'].trim() === '') {
        issues.push(`Item ${itemNum}: Empty Year field`);
        fixes.push({
          index,
          field: 'Year *',
          oldValue: item['Year *'],
          newValue: '1' // Default to year 1
        });
      }
    });

    console.log('ISSUES FOUND:');
    issues.forEach(issue => console.log(`❌ ${issue}`));

    if (fixes.length > 0) {
      console.log(`\nSUGGESTED FIXES (${fixes.length}):`);
      fixes.forEach(fix => {
        console.log(`🔧 Item ${fix.index + 1} (${fix.field}): "${fix.oldValue}" → "${fix.newValue}"`);
      });

      // Apply fixes
      console.log('\nApplying automatic fixes...');
      fixes.forEach(fix => {
        allocations[fix.index][fix.field] = fix.newValue;
      });

      // Write fixed file
      writeFileSync('./icem_fac_sub_allocation_fixed.json', JSON.stringify(allocations, null, 2));
      console.log('✅ Fixed file saved as: icem_fac_sub_allocation_fixed.json');
    }

    console.log(`\nSUMMARY:`);
    console.log(`Total records: ${allocations.length}`);
    console.log(`Issues found: ${issues.length}`);
    console.log(`Auto-fixes applied: ${fixes.length}`);

  } catch (error) {
    console.error('Error analyzing file:', error);
  }
}

// Run the analysis
analyzeAndFixAllocations();