import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import Card from '../../../shared/components/ui/Card';
import Input from '../../../shared/components/ui/Input';
import Button from '../../../shared/components/ui/Button';
import ErrorMessage from '../../../shared/components/ui/ErrorMessage';
import { validateEmail, validatePassword } from '../../../shared/utils/validators';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import LanguageSwitcher from '../../../shared/components/ui/LanguageSwitcher';

export const LoginPage = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const { login } = useAuth();
    const { t } = useTranslation();
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

    const getLoginErrorMessage = (error: any): string => {
        const msg = error?.message?.toLowerCase() || '';
        const status = error?.status;

        // User banned (disabled account)
        if (msg.includes('banned') || msg.includes('user is banned')) {
            return t('auth.accountDisabled');
        }
        // Invalid credentials
        if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
            return t('auth.invalidCredentials');
        }
        // Email not confirmed / not found
        if (msg.includes('email not confirmed') || msg.includes('user not found')) {
            return t('auth.emailNotFound');
        }
        // Rate limited
        if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
            return t('auth.tooManyAttempts');
        }
        // Generic fallback
        return t('auth.loginFailed');
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAuthError(null);

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const { data, error } = await login(email, password);

            if (error) {
                setAuthError(getLoginErrorMessage(error));
                return;
            }

            if (!data) return;

            // Check where user came from and validate it against the user's role
            const resolvedRole = data?.resolvedUser?.role;
            const from = (location.state as any)?.from?.pathname;

            let targetPath = resolvedRole === 'admin' ? '/admin' : '/supervisor';

            if (from && from !== '/' && from !== '/login') {
                const isAdminRoute = from.startsWith('/admin');
                const isSupervisorRoute = from.startsWith('/supervisor');

                if (resolvedRole === 'admin' && isAdminRoute) {
                    targetPath = from;
                } else if ((resolvedRole === 'supervisor' || resolvedRole === 'surveillance') && isSupervisorRoute) {
                    targetPath = from;
                } else if (!isAdminRoute && !isSupervisorRoute) {
                    targetPath = from; // Standard cross-role routes
                }
            }

            navigate(targetPath, { replace: true });

        } catch (err: any) {
            setAuthError(t('auth.unexpectedError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-[100dvh] bg-orange-50 flex flex-col ${isFocused ? 'justify-start pt-6 pb-32' : 'justify-center py-8'} px-4 sm:py-12 sm:px-6 lg:px-8 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23f97316\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] overflow-y-auto transition-all duration-500`}>
            <div className="mt-2 sm:mt-8 sm:mx-auto w-full sm:max-w-md">
                <Card className="shadow-xl border-0 ring-1 ring-gray-900/5 rounded-2xl sm:rounded-2xl" padding="p-6 sm:p-8" >
                    <div className="flex justify-end ltr:justify-start mb-2">
                        <LanguageSwitcher />
                    </div>
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className={`flex justify-center relative transition-all duration-500 ${isFocused ? 'mb-2 sm:mb-6' : 'mb-4 sm:mb-6'}`}>
                            {/* Decorative elegant background circle */}
                            <div className="absolute inset-0 flex items-center justify-center -z-10">
                                <div className={`rounded-full blur-xl animate-pulse transition-all duration-500 ${isFocused ? 'w-16 h-16 sm:w-32 sm:h-32' : 'w-24 h-24 sm:w-32 sm:h-32'}`}></div>
                            </div>
                            {/* Professional logo container */}
                            <div className={`bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-[2rem] flex items-center justify-center p-2 overflow-hidden transition-all duration-500 ${isFocused ? 'w-20 h-20 sm:w-48 sm:h-48' : 'w-28 h-28 sm:w-48 sm:h-48'}`}>
                                <img
                                    src="/logo-mpg.png"
                                    alt="M.P.G - École d'Enseignement Technique Supérieur"
                                    className="w-full h-full object-contain filter drop-shadow hover:drop-shadow-md mix-blend-multiply"
                                />
                            </div>
                        </div>
                    </div>
                    <form 
                        className="space-y-4 sm:space-y-6" 
                        onSubmit={handleSubmit} 
                        noValidate
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => {
                            // Clicks outside inputs (such as closing keyboard)
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setIsFocused(false);
                            }
                        }}
                    >

                        {authError && <ErrorMessage message={authError} />}

                        <Input
                            id="email"
                            type="email"
                            label={t('auth.emailLabel')}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: null });
                            }}
                            error={errors.email}
                            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
                            placeholder={t('auth.emailPlaceholder')}
                            autoComplete="email"
                            required
                        />

                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            label={t('auth.passwordLabel')}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors({ ...errors, password: null });
                            }}
                            error={errors.password}
                            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-orange-500 focus:outline-none transition-colors"
                                    aria-label={showPassword ? t('auth.passwordLabel') : t('auth.passwordLabel')}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            }
                            placeholder={t('auth.passwordPlaceholder')}
                            autoComplete="current-password"
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={isLoading}
                            className="py-3 shadow-md hover:shadow-lg mt-6 sm:mt-8 text-lg"
                        >
                            {t('auth.loginButton')}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
