import { useRef } from 'react';

import { useAnimation } from '@/hooks/useAnimation';

import RegisterForm from './Forms/RegisterForm';
import LoginForm from './Forms/LoginForm';
import Visual from './Visual/Visual';

import styles from './Auth.module.css';

interface ButtonRefs {
    button: React.RefObject<HTMLButtonElement | null>;
    text: React.RefObject<HTMLSpanElement | null>;
    selection: React.RefObject<HTMLDivElement | null>;
}

interface FormRefs {
    register: React.RefObject<HTMLFormElement | null>;
    login: React.RefObject<HTMLFormElement | null>;
}

export default function AuthPage() {
    const visualBlockRef = useRef<HTMLDivElement>(null);
    const visualRef = useRef<HTMLButtonElement>(null);
    const [startAnimation, curves] = useAnimation();

    const signUpRefs: ButtonRefs = {
        button: useRef(null),
        text: useRef(null),
        selection: useRef(null),
    };

    const signInRefs: ButtonRefs = {
        button: useRef(null),
        text: useRef(null),
        selection: useRef(null),
    };

    const formRefs: FormRefs = {
        register: useRef(null),
        login: useRef(null),
    };

    const switchFormToRegister = () => switchForm(false);
    const switchFormToLogin = () => switchForm(true);

    const selectSignUpButton = () => runHoverEffect(signUpRefs, true);
    const deselectSignUpButton = () => runHoverEffect(signUpRefs, false);
    const selectSignInButton = () => runHoverEffect(signInRefs, true);
    const deselectSignInButton = () => runHoverEffect(signInRefs, false);

    function runHoverEffect({ button, text, selection }: ButtonRefs, isHoverIn: boolean) {
        const height = (button?.current?.offsetHeight ?? 0) * 0.95;
        const textOffset = (button.current?.offsetHeight ?? 0) * 2;
        const duration = 400;

        const animateHover = (progress: number) => {
            const textTop = progress > 0.5 ? textOffset * progress - textOffset : textOffset * progress;

            selection.current?.style.setProperty(
                'height',
                (isHoverIn ? progress * height : height - progress * height) + 'px'
            );

            text.current?.style.setProperty('top', textTop + 'px');
        };

        startAnimation(curves.easeInOutCirc, animateHover, duration);
    }

    function switchForm(toLeft: boolean) {
        const isRegisterOpening = !toLeft;
        const isLoginOpening = toLeft;
        const duration = 1000;

        const visualOffset = 60;
        const visualInterval = 40;
        const buttonsInterval = 80;
        const formsInterval = 100;

        const animateVisualBlock = (progress: number) => {
            const showRegister = (progress > 0.4 && isRegisterOpening) || (progress < 0.6 && isLoginOpening);
            const showLogin = (progress > 0.4 && isLoginOpening) || (progress < 0.6 && isRegisterOpening);

            formRefs.register.current?.classList.toggle(styles.hiddenForm, !showRegister);
            formRefs.login.current?.classList.toggle(styles.hiddenForm, !showLogin);

            visualBlockRef.current?.style.setProperty(
                'clip-path',
                `xywh(${toLeft ? 50 - progress * 50 : progress * 50}% 0% 50% 100%)`
            );

            visualRef.current?.style.setProperty(
                'left',
                toLeft
                    ? -visualInterval + progress * visualInterval - visualOffset + 'px'
                    : progress * -visualInterval - visualOffset + 'px'
            );

            signInRefs.button.current?.style.setProperty(
                'right',
                toLeft ? progress * -buttonsInterval + 'px' : -buttonsInterval + progress * buttonsInterval + 'px'
            );

            signUpRefs.button.current?.style.setProperty(
                'left',
                toLeft ? -buttonsInterval + progress * buttonsInterval + 'px' : progress * -buttonsInterval + 'px'
            );

            formRefs.register.current?.style.setProperty(
                'right',
                toLeft ? progress * -formsInterval + 'px' : -formsInterval + progress * formsInterval + 'px'
            );

            formRefs.login.current?.style.setProperty(
                'left',
                toLeft ? -formsInterval + progress * formsInterval + 'px' : progress * -formsInterval + 'px'
            );
        };

        startAnimation(curves.easeOutExpo, animateVisualBlock, duration);
    }

    return (
        <div className={styles.container}>
            <div className={styles.forms}>
                <RegisterForm ref={formRefs.register} />
                <LoginForm ref={formRefs.login} />
                <div className={styles.visualBlock} ref={visualBlockRef}>
                    <Visual ref={visualRef} />
                    <button
                        ref={signUpRefs.button}
                        className={styles.switchFormButton}
                        onClick={switchFormToRegister}
                        onMouseEnter={selectSignUpButton}
                        onMouseLeave={deselectSignUpButton}
                    >
                        <div ref={signUpRefs.selection} className={styles.selection}></div>
                        <span ref={signUpRefs.text}>sign up</span>
                    </button>
                    <button
                        ref={signInRefs.button}
                        className={styles.switchFormButton}
                        onClick={switchFormToLogin}
                        onMouseEnter={selectSignInButton}
                        onMouseLeave={deselectSignInButton}
                    >
                        <div ref={signInRefs.selection} className={styles.selection}></div>
                        <span ref={signInRefs.text}>sign in</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
