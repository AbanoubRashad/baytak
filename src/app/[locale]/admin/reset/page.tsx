import { Logo } from '@/components/ui/Logo';
import { NewPasswordForm } from '@/components/admin/AuthForms';

export default function ResetPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card border border-line bg-card p-7 shadow-soft">
        <Logo locale="en" />
        <h1 className="mt-6 text-3xl font-extrabold">Choose a new password</h1>
        <div className="mt-6">
          <NewPasswordForm />
        </div>
      </div>
    </main>
  );
}
