import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import clsx from 'clsx';

import { userService } from '@/api/userService';
import Button from '@/shared/ui/Button/Button.jsx';

import styles from './AuthForm.module.css';

export default function RegisterForm({ ref }) {
    const [registerMessage, setRegisterMessage] = useState('');
    const [pulse, setPulse] = useState('none');
    const resetPulse = () => setPulse('none');

    const registerMutation = useMutation({
        mutationFn: (user) => userService.register(user.username, user.email, user.password),
        onSuccess: () => {
            setRegisterMessage('successful registration');
            setPulse('success');
        },
        onError: (error) => {
            setRegisterMessage('error: ' + error.message);
            setPulse('error');
        },
    });

    async function handleRegister(event) {
        event.preventDefault();
        resetPulse();

        const user = {
            username: event.target.username.value,
            email: event.target.email.value,
            password: event.target.password.value,
        };

        registerMutation.mutate(user);
    }

    return (
        <form className={styles.form} ref={ref} onSubmit={handleRegister}>
            <header>
                <h2 className={styles.formHeader}>sign up</h2>
            </header>
            <div className={styles.inputsContainer}>
                <input
                    className={clsx(styles.input, styles.usernameInput)}
                    type="text"
                    name="username"
                    placeholder="username"
                    minLength="3"
                    maxLength="32"
                    pattern="[a-zA-Z0-9_]+"
                    required
                />
                <input
                    className={clsx(styles.input, styles.emailInput)}
                    type="email"
                    name="email"
                    placeholder="email"
                    minLength="8"
                    maxLength="254"
                    required
                />
                <input
                    className={clsx(styles.input, styles.passwordInput)}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="password"
                    minLength="8"
                    maxLength="64"
                    required
                />
                <div className={styles.errorMessageContainer}>
                    <span
                        className={clsx(
                            styles.errorMessage,
                            pulse === 'error' && styles.redPulse,
                            pulse === 'success' && styles.greenPulse
                        )}
                        onAnimationEnd={resetPulse}
                    >
                        {registerMessage}
                    </span>
                </div>
            </div>
            <Button type="submit" className={styles.submitButton} disabled={registerMutation.isLoading}>
                sign up
            </Button>
        </form>
    );
}
