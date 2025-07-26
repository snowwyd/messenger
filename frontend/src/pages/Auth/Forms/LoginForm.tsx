import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import clsx from 'clsx';

import { authActions } from '@/store/store';
import { userService } from '@/api/userService';
import type { LoginData } from '@/types/LoginData';
import Button from '@/shared/ui/Button/Button';
import Input from '@/shared/ui/Input/Input';
import UsernameIcon from '@/assets/icons/username.svg';
import PasswordIcon from '@/assets/icons/password.svg';

import styles from './Form.module.css';

interface LoginFormProps {
    ref: React.Ref<HTMLFormElement>;
}

export default function LoginForm({ ref }: LoginFormProps) {
    const dispatch = useDispatch();

    const loginMutation = useMutation({
        mutationFn: (user: LoginData) => userService.login(user.email, user.password),
        onSuccess: (data) => {
            dispatch(authActions.authorize(data.token));
        },
    });

    function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const user: LoginData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };

        loginMutation.mutate(user);
    }

    return (
        <form className={styles.form} ref={ref} onSubmit={handleLogin}>
            <header>
                <h2 className={styles.formHeader}>sign in</h2>
            </header>
            <div className={styles.inputsContainer}>
                <Input
                    icon={UsernameIcon}
                    type="email"
                    name="email"
                    placeholder="email"
                    autoComplete="email"
                    minLength={8}
                    maxLength={254}
                    required
                />
                <Input
                    icon={PasswordIcon}
                    type="password"
                    name="password"
                    placeholder="password"
                    autoComplete="current-password"
                    minLength={8}
                    maxLength={64}
                    required
                />
                <div className={styles.errorMessageContainer}>
                    <span
                        className={clsx(
                            styles.errorMessage,
                            loginMutation.isError && styles.redPulse,
                            loginMutation.isSuccess && styles.greenPulse
                        )}
                    >
                        {loginMutation.error?.message}
                    </span>
                </div>
            </div>
            <Button type="submit" className={styles.submitButton} disabled={loginMutation.isPending}>
                sign in
            </Button>
        </form>
    );
}
