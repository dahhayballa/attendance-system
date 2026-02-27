import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../../../shared/components/ui/Card';
import Input from '../../../shared/components/ui/Input';
import Button from '../../../shared/components/ui/Button';
import ErrorMessage from '../../../shared/components/ui/ErrorMessage';
import { validateEmail, validatePassword } from '../../../shared/utils/validators';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const validateForm = (): boolean => {
        const newErrors = {
            email: validateEmail(email),
            password: validatePassword(password)
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== null);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAuthError(null);

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const { data, error } = await login(email, password);

            if (error) {
                setAuthError(error.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
                return;
            }

            // Check where user came from, or default based on role
            const from = (location.state as any)?.from?.pathname;
            if (from) {
                navigate(from, { replace: true });
            } else {
                const userRole = data?.user?.role;
                navigate(userRole === 'admin' ? '/admin' : '/supervisor', { replace: true });
            }

        } catch (err: any) {
            setAuthError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-all duration-300">
                        <span className="text-3xl" role="img" aria-label="logo">🎓</span>
                    </div>
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    تسجيل الدخول
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    نظام إدارة الحضور - EETFP MPG NKTT
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="shadow-xl border-0 ring-1 ring-gray-900/5 sm:rounded-2xl" padding="p-8">
                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>

                        {authError && <ErrorMessage message={authError} />}

                        <Input
                            id="email"
                            type="email"
                            label="البريد الإلكتروني"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: null });
                            }}
                            error={errors.email}
                            leftIcon={<Mail className="h-5 w-5" />}
                            placeholder="admin@example.com"
                            autoComplete="email"
                            required
                        />

                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            label="كلمة المرور"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors({ ...errors, password: null });
                            }}
                            error={errors.password}
                            leftIcon={<Lock className="h-5 w-5" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="hover:text-blue-500 focus:outline-none transition-colors"
                                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            }
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={isLoading}
                            className="py-3 shadow-md hover:shadow-lg mt-8 text-lg"
                        >
                            دخول
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
