import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { userService } from '@/api/userService';

import styles from './AuthForm.module.css';

export default function RegisterForm({ formRef }) {
    const [registerMessage, setRegisterMessage] = useState('');
    const [pulse, setPulse] = useState([false, false]);
    const resetPulse = () => setPulse([false, false]);

    const registerMutation = useMutation({
        mutationFn: (user) => userService.register(user.username, user.email, user.password),
        onSuccess: () => {
            setRegisterMessage('successful registration');
            setPulse([false, true]);
        },
        onError: (error) => {
            setRegisterMessage('error: ' + error.message);
            setPulse([true, false]);
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

    const errorMessageClasses = [styles.errorMessage, pulse[0] && styles.redPulse, pulse[1] && styles.greenPulse]
        .filter(Boolean)
        .join(' ');

    return (
        <form className={styles.forms} ref={formRef} onSubmit={handleRegister}>
            <h2 className={styles.formName}>sign up</h2>
            <div className={styles.inputsContainer}>
                <input className={styles.usernameInput} type="text" name="username" placeholder="username" />
                <input className={styles.emailInput} type="email" name="email" placeholder="email" />
                <input
                    className={styles.passwordInput}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="password"
                />
                <div className={styles.errorMessageContainer}>
                    <p className={errorMessageClasses} onAnimationEnd={resetPulse}>
                        {registerMessage}
                    </p>
                </div>
            </div>
            <input type="submit" value="sign up" />
        </form>
    );
}
