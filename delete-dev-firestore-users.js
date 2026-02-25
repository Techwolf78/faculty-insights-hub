// delete-dev-firestore-users.js - Delete users from Firestore in dev database
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// For dev database, you'll need to use the dev service account key
// Replace this path with your dev service account key file
const devServiceAccountPath = './dev-serviceAccountKey.json'; // Update this path

try {
  const serviceAccount = JSON.parse(readFileSync(devServiceAccountPath, 'utf8'));

  const devApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'feedback-builder-fe792'  // Dev project ID
  }, 'devApp');

  const db = admin.firestore(devApp);

  async function deleteUsersCollection() {
    console.log('🗑️ Deleting all documents from users collection in dev database...');

    try {
      // Get all documents in users collection
      const usersSnapshot = await db.collection('users').get();

      if (usersSnapshot.empty) {
        console.log('No users found in collection');
        return;
      }

      console.log(`Found ${usersSnapshot.size} users to delete`);

      // Delete all documents in batches
      const batchSize = 10; // Firestore batch limit is 500, but we'll use smaller batches
      let batch = db.batch();
      let count = 0;
      let batchCount = 0;

      for (const doc of usersSnapshot.docs) {
        batch.delete(doc.ref);
        count++;

        // Commit batch every 10 documents
        if (count % batchSize === 0) {
          await batch.commit();
          batchCount++;
          console.log(`Deleted batch ${batchCount} (${count} users so far)`);
          batch = db.batch();
        }
      }

      // Commit remaining documents
      if (count % batchSize !== 0) {
        await batch.commit();
        batchCount++;
        console.log(`Deleted final batch ${batchCount} (${count} users total)`);
      }

      console.log(`✅ Successfully deleted ${count} users from Firestore`);

    } catch (error) {
      console.error('❌ Error deleting users:', error.message);
    }
  }

  async function deleteFacultyCollection() {
    console.log('🗑️ Deleting all documents from faculty collection in dev database...');

    try {
      const facultySnapshot = await db.collection('faculty').get();

      if (facultySnapshot.empty) {
        console.log('No faculty found in collection');
        return;
      }

      console.log(`Found ${facultySnapshot.size} faculty to delete`);

      const batchSize = 10;
      let batch = db.batch();
      let count = 0;
      let batchCount = 0;

      for (const doc of facultySnapshot.docs) {
        batch.delete(doc.ref);
        count++;

        if (count % batchSize === 0) {
          await batch.commit();
          batchCount++;
          console.log(`Deleted batch ${batchCount} (${count} faculty so far)`);
          batch = db.batch();
        }
      }

      if (count % batchSize !== 0) {
        await batch.commit();
        batchCount++;
        console.log(`Deleted final batch ${batchCount} (${count} faculty total)`);
      }

      console.log(`✅ Successfully deleted ${count} faculty from Firestore`);

    } catch (error) {
      console.error('❌ Error deleting faculty:', error.message);
    }
  }

  async function main() {
    await deleteUsersCollection();
    await deleteFacultyCollection();

    console.log('🎉 Cleanup complete!');
    process.exit(0);
  }

  main();

} catch (error) {
  console.error('Error:', error.message);
  console.log('\nTo use this script:');
  console.log('1. Download the service account key for feedback-builder-fe792 project');
  console.log('2. Save it as dev-serviceAccountKey.json in this directory');
  console.log('3. Run: node delete-dev-firestore-users.js');
}