import { useEffect, useRef, useState } from 'react';
import { startAnimation, curves } from '@/utils/animation';

import RegisterForm from './AuthForms/RegisterForm.jsx';
import LoginForm from './AuthForms/LoginForm.jsx';

import styles from './Auth.module.css';

const images = import.meta.glob('@/assets/images/auth-page/*.png', { eager: true });
const authImages = Object.values(images).map((mod) => mod.default);
const currentImageNumber = Number(localStorage.getItem('currentAuthImage') || 0);

export default function AuthPage() {
    const imageContainerRef = useRef(null);
    const imageRef = useRef(null);
    const [currentImage, setCurrentImage] = useState(currentImageNumber);

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

    const [isRegisterFormActive, setIsRegisterFormActive] = useState(true);

    const switchImage = () => setCurrentImage((prev) => (prev < authImages.length - 1 ? prev + 1 : 0));
    useEffect(() => localStorage.setItem('currentAuthImage', currentImage), [currentImage]);
    useEffect(() => formRefs.login.current.classList.add(styles.hiddenForm), []);

    function showLoginForm() {
        formRefs.login.current.classList.remove(styles.hiddenForm);
        formRefs.register.current.classList.add(styles.hiddenForm);
        setIsRegisterFormActive(false);
    }

    function showRegisterForm() {
        formRefs.register.current.classList.remove(styles.hiddenForm);
        formRefs.login.current.classList.add(styles.hiddenForm);
        setIsRegisterFormActive(true);
    }

    const switchFormToRegister = () => switchForm(false);
    const switchFormToLogin = () => switchForm(true);

    const selectSignUpButton = () => runHoverEffect(signUpRefs, true);
    const deselectSignUpButton = () => runHoverEffect(signUpRefs, false);
    const selectSignInButton = () => runHoverEffect(signInRefs, true);
    const deselectSignInButton = () => runHoverEffect(signInRefs, false);

    function runHoverEffect({ button, text, selection }, isHoverIn) {
        const duration = 400;
        const animateHover = (progress) => {
            const height = button.current.offsetHeight * 0.95;
            const textOffset = button.current.offsetHeight * 2;
            const textTop = progress > 0.5 ? textOffset * progress - textOffset : textOffset * progress;

            selection.current.style.height = (isHoverIn ? progress * height : height - progress * height) + 'px';
            text.current.style.top = textTop + 'px';
        };

        startAnimation(curves.easeInOutCirc, animateHover, duration);
    }

    function switchForm(toLeft) {
        const duration = 1000;
        const animateImageBlock = (progress) => {
            const isRegisterOpening = !toLeft;
            const isLoginOpening = toLeft;

            if (isRegisterOpening) setIsRegisterFormActive(true);
            if (isLoginOpening) setIsRegisterFormActive(false);

            const showRegister = (progress > 0.4 && isRegisterOpening) || (progress < 0.6 && isLoginOpening);
            const showLogin = (progress > 0.4 && isLoginOpening) || (progress < 0.6 && isRegisterOpening);

            formRefs.register.current.classList.toggle(styles.hiddenForm, !showRegister);
            formRefs.login.current.classList.toggle(styles.hiddenForm, !showLogin);

            const backgroundInterval = 40;
            const buttonsInterval = 80;
            const formsInterval = 100;

            imageContainerRef.current.style.clipPath = `xywh(${
                toLeft ? 50 - progress * 50 : progress * 50
            }% 0% 50% 100%)`;
            imageRef.current.style.left = toLeft
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

        startAnimation(curves.easeOutExpo, animateImageBlock, duration);
    }

    return (
        <div className={styles.authFormsContainer}>
            <div className={styles.authForms}>
                <RegisterForm formRef={formRefs.register} />
                <LoginForm formRef={formRefs.login} />
                <div className={styles.imageBlock} ref={imageContainerRef}>
                    <img
                        src={authImages[currentImage]}
                        ref={imageRef}
                        className={styles.footage}
                        onClick={switchImage}
                    />
                    <div
                        ref={signUpRefs.button}
                        className={styles.switchFormButton}
                        onClick={switchFormToRegister}
                        onMouseEnter={selectSignUpButton}
                        onMouseLeave={deselectSignUpButton}
                    >
                        <div ref={signUpRefs.selection} className={styles.selection}></div>
                        <span ref={signUpRefs.text}>sign up</span>
                    </div>
                    <div
                        ref={signInRefs.button}
                        className={styles.switchFormButton}
                        onClick={switchFormToLogin}
                        onMouseEnter={selectSignInButton}
                        onMouseLeave={deselectSignInButton}
                    >
                        <div ref={signInRefs.selection} className={styles.selection}></div>
                        <span ref={signInRefs.text}>sign in</span>
                    </div>
                </div>
                <div className={styles.switchFormMobileButton}>
                    {isRegisterFormActive ? (
                        <>
                            already have an account? <span onClick={showLoginForm}>sign in</span>
                        </>
                    ) : (
                        <>
                            are you new here? <span onClick={showRegisterForm}>create account</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
