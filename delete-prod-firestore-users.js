// delete-prod-firestore-users.js - Delete users from Firestore in production database
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Use the production service account key
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

const prodApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'faculty-feedback-c51ae'  // Production project ID
}, 'prodApp');

const db = admin.firestore(prodApp);

async function deleteUsersCollection() {
  console.log('🗑️ Deleting all documents from users collection in production database...');

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
  console.log('🗑️ Deleting all documents from faculty collection in production database...');

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

  console.log('🎉 Production database cleanup complete!');
  process.exit(0);
}

main();