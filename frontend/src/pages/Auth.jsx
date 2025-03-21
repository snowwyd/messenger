import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../AppContext";

import './Auth.css';

export default function App() {
    const imageBlock = useRef(null);
    const footageRef = useRef(null);
    const [videoFootage, setVideoFootage] = useState(false);
    const [pulse, setPulse] = useState([false, false]);

    const signUpButton = useRef(null);
    const signInButton = useRef(null);
    const signUpText = useRef(null);
    const signInText = useRef(null);
    const selectionSignUpRef = useRef(null);
    const selectionSignInRef = useRef(null);
    
    const registerForm = useRef(null);
    const loginForm = useRef(null);
    
    const registerMessageRef = useRef(null);
    const loginMessageRef = useRef(null);
    const [signUpMessage, setSignUpMessage] = useState("");
    const [signInMessage, setSignInMessage] = useState("");

    const navigate = useNavigate();
    const { grpc } = useContext(AppContext)

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

                if (progress > 0.5) text.style.top = -(button.offsetHeight * 2 * progress) + (button.offsetHeight * 2) + 'px';
                else text.style.top = -(button.offsetHeight * 2 * progress) + 'px';
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
            navigate('/chats');
        } catch (error) {
            setSignInMessage("error: " + error.message);
            setPulse([true, false]);
            console.log(pulse);
            
        }
    }

    return (
        <div className="auth-forms-container">
            <div className="auth-forms">
                <form className="forms" ref={registerForm} onSubmit={handleSignUp}>
                    <h2>sign up</h2>
                    <div className="inputs-container">
                        <input type="text" name="username" placeholder="username" />
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <div className="error-message-container">
                            <p className={`error-message ${pulse[0] ? "red-pulse" : ""} ${pulse[1] ? "green-pulse" : ""}`}
                            onAnimationEnd={() => setPulse([false, false])}>{signUpMessage}</p>
                        </div>
                    </div>
                    <input type="submit" value="sign up" />
                </form>
                <form className="forms" style={{ visibility: "hidden", pointerEvents: "none" }} ref={loginForm} onSubmit={handleSignIn}>
                    <h2>sign in</h2>
                    <div className="inputs-container">
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <div className="error-message-container">
                            <p className={`error-message ${pulse[0] ? "red-pulse" : ""} ${pulse[1] ? "green-pulse" : ""}`}
                            onAnimationEnd={() => setPulse([false, false])}>{signInMessage}</p>
                        </div>
                    </div>
                    <input type="submit" value="sign in" />
                </form>
                <div className="image-block" ref={imageBlock}>
                    {videoFootage && <video ref={footageRef} src="/vids/footage.mp4" className="footage" autoPlay loop muted playsInline></video>}
                    {!videoFootage && <img src="vids/footage2.png" ref={footageRef} className="footage"/>}
                    <div ref={signUpButton} className="switch-form-button"
                        onClick={() => switchForm(false)}
                        onMouseEnter={() => hoverEffect(signUpButton.current, signUpText.current, selectionSignUpRef.current)}
                        onMouseLeave={() => hoverEffect(signUpButton.current, signUpText.current, selectionSignUpRef.current, true)}>
                        <span ref={signUpText}>sign up</span>
                        <div className="selection" ref={selectionSignUpRef}></div>
                    </div>
                    <div ref={signInButton} className="switch-form-button"
                        onClick={() => switchForm(true)}
                        onMouseEnter={() => hoverEffect(signInButton.current, signInText.current, selectionSignInRef.current)}
                        onMouseLeave={() => hoverEffect(signInButton.current, signInText.current, selectionSignInRef.current, true)}>
                        <span ref={signInText}>sign in</span>
                        <div className="selection" ref={selectionSignInRef}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}