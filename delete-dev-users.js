// delete-dev-users.js - Delete bulk created users from dev database
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// For dev database, you'll need to use the dev service account key
// Replace this path with your dev service account key file
const devServiceAccountPath = './dev-serviceAccountKey.json'; // Update this path

try {
  const serviceAccount = JSON.parse(readFileSync(devServiceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'feedback-builder-fe792'  // Dev project ID
  });

  const auth = admin.auth();

  // List of emails that were bulk created (you can get this from Firebase console)
  // Add the emails of the users you want to delete
  const emailsToDelete = [
    // Add the faculty emails here, for example:
    // 'faculty1@college.edu',
    // 'faculty2@college.edu',
    // etc.
  ];

  async function deleteUsers() {
    console.log(`🗑️ Deleting ${emailsToDelete.length} users from dev database...`);

    for (const email of emailsToDelete) {
      try {
        console.log(`Deleting: ${email}`);
        // Get user by email first
        const userRecord = await auth.getUserByEmail(email);
        await auth.deleteUser(userRecord.uid);
        console.log(`✅ Deleted: ${email}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${email}:`, error.message);
      }
    }

    console.log('Done!');
    process.exit(0);
  }

  deleteUsers();

} catch (error) {
  console.error('Error:', error.message);
  console.log('\nTo use this script:');
  console.log('1. Download the service account key for feedback-builder-fe792 project');
  console.log('2. Save it as dev-serviceAccountKey.json in this directory');
  console.log('3. Add the faculty emails to the emailsToDelete array');
  console.log('4. Run: node delete-dev-users.js');
}