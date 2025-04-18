import { useEffect, useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { authActions } from "@/store";
import { startAnimation, curves } from "@/utils/animation";
import { userService } from "@/api/userService";

import styles from './Auth.module.css';

import Image0 from '@/assets/images/image0.png';
import Image1 from '@/assets/images/image1.png';
import Image2 from '@/assets/images/image2.png';
import Image3 from '@/assets/images/image3.png';

const authImages = [Image0, Image1, Image2, Image3];
const currentImageNumber = Number(localStorage.getItem("currentAuthImage") || 0);

export default function App() {
    const imageContainerRef = useRef(null);
    const imageRef = useRef(null);
    const [currentImage, setCurrentImage] = useState(currentImageNumber);

    const signUpButtonRef = useRef(null);
    const signInButtonRef = useRef(null);
    const signUpTextRef = useRef(null);
    const signInTextRef = useRef(null);
    const selectionSignUpRef = useRef(null);
    const selectionSignInRef = useRef(null);

    const registerFormRef = useRef(null);
    const loginFormRef = useRef(null);

    const [registerMessage, setRegisterMessage] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const [pulse, setPulse] = useState([false, false]);

    const dispatch = useDispatch();

    const switchImage = () => setCurrentImage(prev => prev >= authImages.length - 1 ? 0 : prev + 1);
    useEffect(() => localStorage.setItem("currentAuthImage", currentImage), [currentImage]);

    function hoverEffect(button, text, selection, isOut) {
        const duration = 400;
        const animateHover = progress => {
            const height = button.offsetHeight * 0.95;
            const textOffset = button.offsetHeight * 2;
            const textTop = progress > 0.5 ? textOffset * progress - textOffset : textOffset * progress;

            selection.style.height = (isOut ? height - progress * height : progress * height) + 'px';
            text.style.top = textTop + 'px';
        }

        startAnimation(curves.easeInOutCirc, animateHover, duration);
    }

    function switchForm(toLeft) {
        const duration = 1000;
        const animateImageBlock = progress => {
            const showRegister = (progress < 0.6 && toLeft) || (progress > 0.4 && !toLeft);
            const showLogin = (progress > 0.4 && toLeft) || (progress < 0.6 && !toLeft);

            registerFormRef.current.style.visibility = showRegister ? "visible" : "hidden";
            registerFormRef.current.style.pointerEvents = showRegister ? "all" : "none";

            loginFormRef.current.style.visibility = showLogin ? "visible" : "hidden";
            loginFormRef.current.style.pointerEvents = showLogin ? "all" : "none";

            const bgInterval = 40;
            const btnsInterval = 80;
            const formsInterval = 100;

            imageContainerRef.current.style.clipPath = `xywh(${toLeft ? 49 - progress * 50 : progress * 50}% 0% 51% 100%)`;
            imageRef.current.style.left = toLeft ? (-bgInterval + progress * bgInterval) + 'px' : (progress * -bgInterval) + 'px';

            signInButtonRef.current.style.right = toLeft ? (progress * -btnsInterval) + 'px' : (-btnsInterval + progress * btnsInterval) + 'px';
            signUpButtonRef.current.style.left = toLeft ? (-btnsInterval + progress * btnsInterval) + 'px' : (progress * -btnsInterval) + 'px';

            loginFormRef.current.style.left = toLeft ? (-formsInterval + progress * formsInterval) + 'px' : (progress * -formsInterval) + 'px';
            registerFormRef.current.style.right = toLeft ? (progress * -formsInterval) + 'px' : (-formsInterval + progress * formsInterval) + 'px';
        }

        startAnimation(curves.easeOutExpo, animateImageBlock, duration);
    }

    const loginMutation = useMutation({
        mutationFn: user => userService.login(user.email, user.password),
        onSuccess: data => {
            setLoginMessage("successful login");
            setPulse([false, true]);
            dispatch(authActions.authorize(data.token));
        },
        onError: error => {
            setLoginMessage("error: " + error.message);
            setPulse([true, false]);
        }
    });

    const registerMutation = useMutation({
        mutationFn: user => userService.register(user.username, user.email, user.password),
        onSuccess: data => {
            setRegisterMessage("successful registration");
            setPulse([false, true]);
        },
        onError: error => {
            setRegisterMessage("error: " + error.message);
            setPulse([true, false]);
        }
    });

    async function handleRegister(event) {
        event.preventDefault();
        setPulse([false, false]);

        const user = {
            username: event.target.username.value,
            email: event.target.email.value,
            password: event.target.password.value
        }

        registerMutation.mutate(user);
    }

    async function handleLogin(event) {
        event.preventDefault();
        setPulse([false, false]);

        const user = {
            email: event.target.email.value,
            password: event.target.password.value
        }

        loginMutation.mutate(user);
    }

    return (
        <div className={styles.authFormsContainer}>
            <div className={styles.authForms}>
                <form className={styles.forms}
                    ref={registerFormRef} onSubmit={handleRegister}>
                    <h2>sign up</h2>
                    <div className={styles.inputsContainer}>
                        <input type="text" name="username" placeholder="username" />
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <div className={styles.errorMessageContainer}>
                            <p className={`${styles.errorMessage} ${pulse[0] ? styles.redPulse : ""} ${pulse[1] ? styles.greenPulse : ""}`}
                                onAnimationEnd={() => setPulse([false, false])}>{registerMessage}</p>
                        </div>
                    </div>
                    <input type="submit" value="sign up" />
                </form>
                <form className={styles.forms}
                    style={{ visibility: "hidden", pointerEvents: "none" }}
                    ref={loginFormRef} onSubmit={handleLogin}>
                    <h2>sign in</h2>
                    <div className={styles.inputsContainer}>
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <div className={styles.errorMessageContainer}>
                            <p className={`${styles.errorMessage} ${pulse[0] ? styles.redPulse : ""} ${pulse[1] ? styles.greenPulse : ""}`}
                                onAnimationEnd={() => setPulse([false, false])}>{loginMessage}</p>
                        </div>
                    </div>
                    <input type="submit" value="sign in" />
                </form>
                <div className={styles.imageBlock} ref={imageContainerRef}>
                    <img src={authImages[currentImage]} ref={imageRef} onClick={switchImage} className={styles.footage} />
                    <div ref={signUpButtonRef} className={styles.switchFormButton}
                        onClick={() => switchForm(false)}
                        onMouseEnter={() => hoverEffect(signUpButtonRef.current, signUpTextRef.current, selectionSignUpRef.current, false)}
                        onMouseLeave={() => hoverEffect(signUpButtonRef.current, signUpTextRef.current, selectionSignUpRef.current, true)}>
                        <span ref={signUpTextRef}>sign up</span>
                        <div className={styles.selection} ref={selectionSignUpRef}></div>
                    </div>
                    <div ref={signInButtonRef} className={styles.switchFormButton}
                        onClick={() => switchForm(true)}
                        onMouseEnter={() => hoverEffect(signInButtonRef.current, signInTextRef.current, selectionSignInRef.current, false)}
                        onMouseLeave={() => hoverEffect(signInButtonRef.current, signInTextRef.current, selectionSignInRef.current, true)}>
                        <span ref={signInTextRef}>sign in</span>
                        <div className={styles.selection} ref={selectionSignInRef}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}