import { useEffect, useRef, useState } from 'react';

import { startAnimation, curves } from '@/utils/animationUtils';

import RegisterForm from './AuthForms/RegisterForm.jsx';
import LoginForm from './AuthForms/LoginForm.jsx';

import styles from './Auth.module.css';

const images = import.meta.glob('@/assets/images/auth-page/*.png', { eager: true });
const authVisuals = Object.values(images).map((mod) => mod.default);
const currentVisualNumber = Number(localStorage.getItem('currentAuthImage') || 0);

export default function AuthPage() {
    const visualContainerRef = useRef(null);
    const visualRef = useRef(null);
    const [currentVisual, setCurrentVisual] = useState(currentVisualNumber);

    const signUpRefs = {
        button: useRef(null),
        text: useRef(null),
        selection: useRef(null),
    };

    const signInRefs = {
        button: useRef(null),
        text: useRef(null),
        selection: useRef(null),
    };

    const formRefs = {
        register: useRef(null),
        login: useRef(null),
    };

    const switchImage = () => setCurrentVisual((prev) => (prev < authVisuals.length - 1 ? prev + 1 : 0));
    useEffect(() => localStorage.setItem('currentAuthImage', currentVisual), [currentVisual]);
    useEffect(() => formRefs.login.current.classList.add(styles.hiddenForm), []);

    const switchFormToRegister = () => switchForm(false);
    const switchFormToLogin = () => switchForm(true);

    const selectSignUpButton = () => runHoverEffect(signUpRefs, true);
    const deselectSignUpButton = () => runHoverEffect(signUpRefs, false);
    const selectSignInButton = () => runHoverEffect(signInRefs, true);
    const deselectSignInButton = () => runHoverEffect(signInRefs, false);

    function runHoverEffect({ button, text, selection }, isHoverIn) {
        const height = button.current.offsetHeight * 0.95;
        const textOffset = button.current.offsetHeight * 2;
        const duration = 400;

        const animateHover = (progress) => {
            const textTop = progress > 0.5 ? textOffset * progress - textOffset : textOffset * progress;
            selection.current.style.height = (isHoverIn ? progress * height : height - progress * height) + 'px';
            text.current.style.top = textTop + 'px';
        };

        startAnimation(curves.easeInOutCirc, animateHover, duration);
    }

    function switchForm(toLeft) {
        const isRegisterOpening = !toLeft;
        const isLoginOpening = toLeft;
        const duration = 1000;

        const animateVisualBlock = (progress) => {
            const showRegister = (progress > 0.4 && isRegisterOpening) || (progress < 0.6 && isLoginOpening);
            const showLogin = (progress > 0.4 && isLoginOpening) || (progress < 0.6 && isRegisterOpening);

            formRefs.register.current.classList.toggle(styles.hiddenForm, !showRegister);
            formRefs.login.current.classList.toggle(styles.hiddenForm, !showLogin);

            const backgroundInterval = 40;
            const buttonsInterval = 80;
            const formsInterval = 100;

            visualContainerRef.current.style.clipPath = `xywh(${
                toLeft ? 50 - progress * 50 : progress * 50
            }% 0% 50% 100%)`;
            visualRef.current.style.left = toLeft
                ? -backgroundInterval + progress * backgroundInterval + 'px'
                : progress * -backgroundInterval + 'px';

            signInRefs.button.current.style.right = toLeft
                ? progress * -buttonsInterval + 'px'
                : -buttonsInterval + progress * buttonsInterval + 'px';
            signUpRefs.button.current.style.left = toLeft
                ? -buttonsInterval + progress * buttonsInterval + 'px'
                : progress * -buttonsInterval + 'px';

            formRefs.register.current.style.right = toLeft
                ? progress * -formsInterval + 'px'
                : -formsInterval + progress * formsInterval + 'px';
            formRefs.login.current.style.left = toLeft
                ? -formsInterval + progress * formsInterval + 'px'
                : progress * -formsInterval + 'px';
        };

        startAnimation(curves.easeOutExpo, animateVisualBlock, duration);
    }

    return (
        <div className={styles.container}>
            <div className={styles.forms}>
                <RegisterForm ref={formRefs.register} />
                <LoginForm ref={formRefs.login} />
                <div className={styles.visualBlock} ref={visualContainerRef}>
                    <img
                        src={authVisuals[currentVisual]}
                        ref={visualRef}
                        className={styles.visual}
                        onClick={switchImage}
                    />
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
