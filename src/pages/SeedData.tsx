import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usersApi } from '@/lib/storage';

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createSuperAdmin = async () => {
    setIsSeeding(true);
    setMessage('Creating super admin...');
    setError('');

    try {
      const superAdminEmail = 'ajaypawargryphon@gmail.com';
      const superAdminPassword = 'Hardcode2627@';

      // Create super admin in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
      const firebaseUser = userCredential.user;

      const superAdminData = {
        email: superAdminEmail,
        name: 'Ajay Pawar',
        role: 'superAdmin' as const,
        isActive: true,
      };

      await usersApi.create(superAdminData, firebaseUser.uid);
      setMessage(`Super admin created successfully! Email: ${superAdminEmail}`);

      setMessage('🎉 Complete setup completed successfully! You can now login and explore the dashboard.');

    } catch (err) {
      console.error('Error creating super admin:', err);
      setError(`Failed to create super admin: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Data</CardTitle>
          <CardDescription>Create initial data for the application</CardDescription>
        </CardHeader>
        <CardContent>
          {message && <Alert>{message}</Alert>}
          {error && <Alert variant="destructive">{error}</Alert>}
          <Button onClick={createSuperAdmin} disabled={isSeeding} className="w-full">
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Super Admin'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;