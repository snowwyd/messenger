import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { authActions } from '@/store/store';
import { userService } from '@/api/userService';

import styles from './AuthForm.module.css';

export default function LoginForm({ formRef }) {
    const [loginMessage, setLoginMessage] = useState('');
    const [pulse, setPulse] = useState([false, false]);
    const resetPulse = () => setPulse([false, false]);

    const dispatch = useDispatch();

    const loginMutation = useMutation({
        mutationFn: (user) => userService.login(user.email, user.password),
        onSuccess: (data) => {
            setLoginMessage('successful login');
            setPulse([false, true]);
            dispatch(authActions.authorize(data.token));
        },
        onError: (error) => {
            setLoginMessage('error: ' + error.message);
            setPulse([true, false]);
        },
    });

    async function handleLogin(event) {
        event.preventDefault();
        resetPulse();

        const user = {
            email: event.target.email.value,
            password: event.target.password.value,
        };

        loginMutation.mutate(user);
    }

    const errorMessageClasses = [styles.errorMessage, pulse[0] && styles.redPulse, pulse[1] && styles.greenPulse]
        .filter(Boolean)
        .join(' ');

    return (
        <form ref={formRef} onSubmit={handleLogin} className={styles.forms}>
            <h2 className={styles.formName}>sign in</h2>
            <div className={styles.inputsContainer}>
                <input className={styles.emailInput} type="email" name="email" placeholder="email" />
                <input className={styles.passwordInput} type="password" name="password" placeholder="password" />
                <div className={styles.errorMessageContainer}>
                    <p className={errorMessageClasses} onAnimationEnd={resetPulse}>
                        {loginMessage}
                    </p>
                </div>
            </div>
            <input type="submit" value="sign in" />
        </form>
    );
}
