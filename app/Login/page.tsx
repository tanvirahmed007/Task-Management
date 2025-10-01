// app/Login/page.tsx
import { LoginForm } from '@/components/LoginForm/LoginForm';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <LoginForm />
    </div>
  );
}