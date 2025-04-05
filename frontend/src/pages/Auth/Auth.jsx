import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useGrpc } from "@/GrpcContext.jsx";

import styles from './Auth.module.css';

import Image0 from '@/assets/images/image0.png';
import Image1 from '@/assets/images/image1.png';
import Image2 from '@/assets/images/image2.png';

const authImages = [Image0, Image1, Image2];

export default function App() {
    const imageBlock = useRef(null);
    const footageRef = useRef(null);
    const [currentAuthImage, setCurrentAuthImage] = useState(Number(localStorage.getItem("currentAuthImage") !== null ? localStorage.getItem("currentAuthImage") : 0));
    const [pulse, setPulse] = useState([false, false]);

    const dispatch = useDispatch();
    const grpc = useGrpc();

    const signUpButton = useRef(null);
    const signInButton = useRef(null);
    const signUpText = useRef(null);
    const signInText = useRef(null);
    const selectionSignUpRef = useRef(null);
    const selectionSignInRef = useRef(null);

    const registerForm = useRef(null);
    const loginForm = useRef(null);

    const [signUpMessage, setSignUpMessage] = useState("");
    const [signInMessage, setSignInMessage] = useState("");

    function hoverEffect(button, text, selection, isOut = false) {
        const startTime = performance.now();
        const duration = 400;

        requestAnimationFrame(animate);

        function animate(currentTime) {
            let timeFraction = (currentTime - startTime) / duration;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 0) timeFraction = 0;

            let progress = easeInOutCirc(timeFraction);
            animateHover(progress);

            if (timeFraction < 1) requestAnimationFrame(animate);
        }

        function animateHover(progress) {
            if (!isOut) {
                selection.style.height = progress * (button.offsetHeight * 0.95) + 'px';

                if (progress > 0.5) text.style.top = (button.offsetHeight * 2 * progress) - (button.offsetHeight * 2) + 'px';
                else text.style.top = (button.offsetHeight * 2 * progress) + 'px';
            } else {
                selection.style.height = button.offsetHeight * 0.95 - (progress * button.offsetHeight * 0.95) + 'px';

                if (progress > 0.5) text.style.top = (button.offsetHeight * 2 * progress) - (button.offsetHeight * 2) + 'px';
                else text.style.top = (button.offsetHeight * 2 * progress) + 'px';
            }
        }
    }

    function easeInOutCirc(x) {
        return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    }

    function switchForm(toLeft) {
        requestAnimationFrame(animate);
        const startTime = performance.now();
        const duration = 1000;

        function animate(currentTime) {
            let timeFraction = (currentTime - startTime) / duration;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 0) timeFraction = 0;
            if (timeFraction > 0.1) {
                if (toLeft) {
                    registerForm.current.style.visibility = "hidden";
                    registerForm.current.style.pointerEvents = "none";
                    loginForm.current.style.visibility = "visible";
                    loginForm.current.style.pointerEvents = "all";
                } else {
                    registerForm.current.style.visibility = "visible";
                    registerForm.current.style.pointerEvents = "all";
                    loginForm.current.style.visibility = "hidden";
                    loginForm.current.style.pointerEvents = "none";
                }
            }

            let progress = easeOutExpo(timeFraction);
            animateImageBlock(progress, toLeft);

            if (timeFraction < 1) requestAnimationFrame(animate);
        }
    }

    function animateImageBlock(progress, toLeft) {
        if (toLeft) {
            imageBlock.current.style.clipPath = `xywh(${49 - progress * 50}% 0% 51% 100%)`;

            loginForm.current.style.left = `${-100 + progress * 100}px`;
            registerForm.current.style.right = `-${progress * 100}px`;

            signInButton.current.style.right = `-${progress * 80}px`;
            signUpButton.current.style.left = `${-80 + progress * 80}px`;

            footageRef.current.style.left = `${-40 + progress * 40}px`;
            // footageRef.current.style.left = `${80 - progress * 80}px`;
        } else {
            imageBlock.current.style.clipPath = `xywh(${progress * 50}% 0% 51% 100%)`;

            registerForm.current.style.right = `${-100 + progress * 100}px`;
            loginForm.current.style.left = `-${progress * 100}px`;

            signUpButton.current.style.left = `-${progress * 80}px`;
            signInButton.current.style.right = `${-80 + progress * 80}px`;

            footageRef.current.style.left = `-${progress * 40}px`;
            // footageRef.current.style.left = `${progress * 80}px`;
        }
    }

    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    useEffect(() => {
        localStorage.setItem("currentAuthImage", currentAuthImage);
    }, [currentAuthImage]);

    function switchFootage() {
        setCurrentAuthImage(prev => {
            if (prev >= authImages.length - 1) return 0
            return prev + 1;
        });
    }

    async function handleSignUp(event) {
        event.preventDefault();
        setPulse([false, false])

        const user = {
            username: event.target.username.value,
            email: event.target.email.value,
            password: event.target.password.value
        };

        try {
            await grpc.auth.register(user);
            setSignUpMessage("successful registration");
            setPulse([false, true]);
        } catch (error) {
            setSignUpMessage("error: " + error.message);
            setPulse([true, false]);
        }
    }

    async function handleSignIn(event) {
        event.preventDefault();
        setPulse([false, false])

        const user = {
            email: event.target.email.value,
            password: event.target.password.value
        };

        try {
            const response = await grpc.auth.login(user);
            setSignInMessage("successful login");
            setPulse([false, true]);
            localStorage.setItem('token', response.response.token);
            dispatch({ type: 'authorize' });
        } catch (error) {
            setSignInMessage("error: " + error.message);
            setPulse([true, false]);
        }
    }

    return (
        <div className={styles.authFormsContainer}>
            <div className={styles.authForms}>
                <form className={styles.forms} ref={registerForm} onSubmit={handleSignUp}>
                    <h2 onClick={() => dispatch({ type: 'increment' })}>sign up</h2>
                    <div className={styles.inputsContainer}>
                        <input type="text" name="username" placeholder="username" />
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <div className={styles.errorMessageContainer}>
                            <p className={`${styles.errorMessage} ${pulse[0] ? styles.redPulse : ""} ${pulse[1] ? styles.greenPulse : ""}`}
                                onAnimationEnd={() => setPulse([false, false])}>{signUpMessage}</p>
                        </div>
                    </div>
                    <input type="submit" value="sign up" />
                </form>
                <form className={styles.forms} style={{ visibility: "hidden", pointerEvents: "none" }} ref={loginForm} onSubmit={handleSignIn}>
                    <h2>sign in</h2>
                    <div className={styles.inputsContainer}>
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <div className={styles.errorMessageContainer}>
                            <p className={`${styles.errorMessage} ${pulse[0] ? styles.redPulse : ""} ${pulse[1] ? styles.greenPulse : ""}`}
                                onAnimationEnd={() => setPulse([false, false])}>{signInMessage}</p>
                        </div>
                    </div>
                    <input type="submit" value="sign in" />
                </form>
                <div className={styles.imageBlock} ref={imageBlock}>
                    <img src={authImages[currentAuthImage]} ref={footageRef} onClick={switchFootage} className={styles.footage} />
                    <div ref={signUpButton} className={styles.switchFormButton}
                        onClick={() => switchForm(false)}
                        onMouseEnter={() => hoverEffect(signUpButton.current, signUpText.current, selectionSignUpRef.current)}
                        onMouseLeave={() => hoverEffect(signUpButton.current, signUpText.current, selectionSignUpRef.current, true)}>
                        <span ref={signUpText}>sign up</span>
                        <div className={styles.selection} ref={selectionSignUpRef}></div>
                    </div>
                    <div ref={signInButton} className={styles.switchFormButton}
                        onClick={() => switchForm(true)}
                        onMouseEnter={() => hoverEffect(signInButton.current, signInText.current, selectionSignInRef.current)}
                        onMouseLeave={() => hoverEffect(signInButton.current, signInText.current, selectionSignInRef.current, true)}>
                        <span ref={signInText}>sign in</span>
                        <div className={styles.selection} ref={selectionSignInRef}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}