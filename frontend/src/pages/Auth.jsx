import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../AppContext";

import './Auth.css';

export default function App() {
    const imageBlock = useRef(null);
    const registerForm = useRef(null);
    const loginForm = useRef(null);
    const signUpButton = useRef(null);
    const signInButton = useRef(null);
    const signUpText = useRef(null);
    const signInText = useRef(null);
    const footageRef = useRef(null);
    const selectionRef = useRef(null);
    const registerMessageRef = useRef(null);
    const loginMessageRef = useRef(null);

    const navigate = useNavigate();
    const services = useContext(AppContext)

    useEffect(() => {
        signInButton.current.addEventListener('mouseover', () => hoverEffect(signInButton.current, signInText.current));
        signInButton.current.addEventListener('mouseout', () => outEffect(signInButton.current, signInText.current));
        signUpButton.current.addEventListener('mouseover', () => hoverEffect(signUpButton.current, signUpText.current));
        signUpButton.current.addEventListener('mouseout', () => outEffect(signUpButton.current, signUpText.current));
    });

    function hoverEffect(link, text) {
        selectionRef.current.style.width = link.offsetWidth + 'px';
        selectionRef.current.style.left = link.offsetLeft + 'px';
        selectionRef.current.style.bottom = link.offsetTop + 'px';

        const startTime = performance.now();
        const duration = 500;

        requestAnimationFrame(animate);

        function animate(currentTime) {
            let timeFraction = (currentTime - startTime) / duration;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 0) timeFraction = 0;

            let progress = easeInOutCubic(timeFraction);
            animateHover(progress, link, text);

            if (timeFraction < 1) requestAnimationFrame(animate);
        }
    }

    function animateHover(progress, link, text) {
        if (selectionRef.current === null) return;
        selectionRef.current.style.height = progress * link.offsetHeight + 'px';

        if (progress > 0.5) {
            text.style.top = (link.offsetHeight * 2 * progress) - (link.offsetHeight * 2) + 'px';
        } else {
            text.style.top = link.offsetHeight * 2 * progress + 'px';
        }
    }

    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function outEffect(button) {
        selectionRef.current.style.width = '0';
        selectionRef.current.style.height = '0';
    }

    function switchForm(toLeft) {
        requestAnimationFrame(animate);
        const startTime = performance.now();
        const duration = 1000;

        function animate(currentTime) {
            let timeFraction = (currentTime - startTime) / duration;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 0) timeFraction = 0;

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

            signInButton.current.style.right = `-${progress * 75}px`;
            signUpButton.current.style.left = `${-75 + progress * 75}px`;

            footageRef.current.style.left = `${-40 + progress * 40}px`;
            // footageRef.current.style.left = `-${progress * 20}px`;
        } else {
            imageBlock.current.style.clipPath = `xywh(${progress * 50}% 0% 51% 100%)`;

            registerForm.current.style.right = `${-100 + progress * 100}px`;
            loginForm.current.style.left = `-${progress * 100}px`;

            signUpButton.current.style.left = `-${progress * 75}px`;
            signInButton.current.style.right = `${-75 + progress * 75}px`;

            footageRef.current.style.left = `-${progress * 40}px`;
            // footageRef.current.style.left = `${-20 + progress * 20}px`;
        }
    }

    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    async function handleSignUp(event) {
        event.preventDefault();
        loginMessageRef.current.innerHTML = '';

        const user = {
            username: event.target.username.value,
            email: event.target.email.value,
            password: event.target.password.value
        };

        try {
            await services.auth.register(user);
            registerMessageRef.current.innerHTML = "successful registration";
        } catch (error) {
            registerMessageRef.current.innerHTML = "error: " + error.message;
        }
    }

    async function handleSignIn(event) {
        event.preventDefault();
        loginMessageRef.current.innerHTML = '';

        const user = {
            email: event.target.email.value,
            password: event.target.password.value
        };

        try {
            const response = await services.auth.login(user);
            loginMessageRef.current.innerHTML = "successful login";
            localStorage.setItem('token', response.response.token);
            navigate('/chats');
        } catch (error) {
            console.log(error);
            loginMessageRef.current.innerHTML = "error: " + error.message;
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
                        <p ref={registerMessageRef} className="error-message"></p>
                    </div>
                    <input type="submit" value="sign up" />
                </form>
                <form className="forms" ref={loginForm} onSubmit={handleSignIn}>
                    <h2>sign in</h2>
                    <div className="inputs-container">
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <p ref={loginMessageRef} className="error-message"></p>
                    </div>
                    <input type="submit" value="sign in" />
                </form>
                <div className="image-block" ref={imageBlock}>
                    <video ref={footageRef} src="/vids/footage.mp4" className="footage" autoPlay loop muted playsInline></video>
                    <h2 onClick={() => switchForm(false)} ref={signUpButton}><span ref={signUpText}>sign up</span></h2>
                    <h2 onClick={() => switchForm(true)} ref={signInButton}><span ref={signInText}>sign in</span></h2>
                    <div className="selection" ref={selectionRef}></div>
                </div>
            </div>
        </div>
    )
}