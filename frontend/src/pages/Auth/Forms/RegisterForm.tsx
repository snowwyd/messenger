import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { userService } from '@/api/userService';
import type { RegisterData } from '@/types/RegisterData';
import Button from '@/shared/ui/Button/Button';
import Input from '@/shared/ui/Input/Input';
import UsernameIcon from '@/assets/icons/username.svg';
import EmailIcon from '@/assets/icons/email.svg';
import PasswordIcon from '@/assets/icons/password.svg';

import styles from './Form.module.css';

interface RegisterFormProps {
    ref: React.Ref<HTMLFormElement>;
}

export default function RegisterForm({ ref }: RegisterFormProps) {
    const registerMutation = useMutation({
        mutationFn: (user: RegisterData) => userService.register(user.username, user.email, user.password),
    });

    function handleRegister(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const user: RegisterData = {
            username: formData.get('username') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };

        registerMutation.mutate(user);
    }

    return (
        <form className={styles.form} ref={ref} onSubmit={handleRegister}>
            <header>
                <h2 className={styles.formHeader}>sign up</h2>
            </header>
            <div className={styles.inputsContainer}>
                <Input
                    icon={UsernameIcon}
                    type="text"
                    name="username"
                    placeholder="username"
                    autoComplete="username"
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9_]+"
                    required
                />
                <Input
                    icon={EmailIcon}
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
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={64}
                    required
                />
                <div className={styles.errorMessageContainer}>
                    <span
                        className={clsx(
                            styles.errorMessage,
                            registerMutation.isError && styles.redPulse,
                            registerMutation.isSuccess && styles.greenPulse
                        )}
                    >
                        {registerMutation.error?.message}
                        {registerMutation.isSuccess && 'successful registration'}
                    </span>
                </div>
            </div>
            <Button type="submit" className={styles.submitButton} disabled={registerMutation.isPending}>
                sign up
            </Button>
        </form>
    );
}
