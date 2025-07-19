import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import clsx from 'clsx';

import { authActions } from '@/store/store';
import { userService } from '@/api/userService';
import Button from '@/shared/ui/Button/Button.jsx';

import styles from './AuthForm.module.css';

export default function LoginForm({ ref }) {
    const [loginMessage, setLoginMessage] = useState('');
    const [pulse, setPulse] = useState('none');
    const resetPulse = () => setPulse('none');

    const dispatch = useDispatch();

    const loginMutation = useMutation({
        mutationFn: (user) => userService.login(user.email, user.password),
        onSuccess: (data) => {
            setLoginMessage('successful login');
            setPulse('success');
            dispatch(authActions.authorize(data.token));
        },
        onError: (error) => {
            setLoginMessage('error: ' + error.message);
            setPulse('error');
        },
    });

    function handleLogin(event) {
        event.preventDefault();
        resetPulse();

        const user = {
            email: event.target.email.value,
            password: event.target.password.value,
        };

        loginMutation.mutate(user);
    }

    return (
        <form className={styles.form} ref={ref} onSubmit={handleLogin}>
            <header>
                <h2 className={styles.formHeader}>sign in</h2>
            </header>
            <div className={styles.inputsContainer}>
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
                        {loginMessage}
                    </span>
                </div>
            </div>
            <Button type="submit" className={styles.submitButton} disabled={loginMutation.isLoading}>
                sign in
            </Button>
        </form>
    );
}
