// test-auth-permissions.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'faculty-feedback-c51ae'
});

const auth = admin.auth();

async function testPermissions() {
  try {
    console.log('Testing Auth permissions...');
    const listUsersResult = await auth.listUsers(5);
    console.log(`✅ Can list users. Found ${listUsersResult.users.length} users`);
    listUsersResult.users.forEach(user => {
      console.log(`- ${user.uid}: ${user.email}`);
    });

    // Try to delete one user to test delete permissions
    if (listUsersResult.users.length > 0) {
      const testUid = listUsersResult.users[0].uid;
      console.log(`\nTesting delete permission with user: ${testUid}`);
      try {
        await auth.deleteUser(testUid);
        console.log(`✅ Can delete users`);
      } catch (deleteError) {
        console.log(`❌ Cannot delete users: ${deleteError.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Cannot access Auth:', error.message);
  }
}

testPermissions();