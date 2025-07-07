import RegistrationForm from '@/components/RegistrationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/BackButton';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 px-4">
        <div className="mb-6">
            <BackButton />
        </div>
        <Card>
            <CardHeader className="text-center">
                <h1 className="font-headline text-5xl text-primary">वसुधैव कुटुम्बकम्</h1>
                <CardTitle className="text-2xl font-semibold tracking-tight pt-2">Register Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <RegistrationForm />
            </CardContent>
        </Card>
    </div>
  );
}
