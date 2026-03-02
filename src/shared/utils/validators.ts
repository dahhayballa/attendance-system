import i18n from '../../i18n';

export const validateEmail = (email: string): string | null => {
    if (!email) return i18n.t('validation.emailRequired');
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return isValid ? null : i18n.t('validation.emailInvalid');
};

export const validatePassword = (password: string): string | null => {
    if (!password) return i18n.t('validation.passwordRequired');
    if (password.length < 6) return i18n.t('validation.passwordTooShort');
    return null;
};
