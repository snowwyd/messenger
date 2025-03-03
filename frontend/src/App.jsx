import React, { useRef } from "react";
import { AuthClient } from "./proto/generated/msgauth.client";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";

const transport = new GrpcWebFetchTransport({ baseUrl: "http://localhost:810" });
const client = new AuthClient(transport);

import './App.css';

export default function App() {
    const errorMessageRef = useRef(null);

    async function handleSignUp(event) {
        event.preventDefault();

        const user = {
            email: event.target.email.value,
            // login: event.target.login.value,
            password: event.target.password.value
        };

        try {
            const response = await client.register(user);
            errorMessageRef.current.innerHTML = "successful registration";
        } catch (error) {
            errorMessageRef.current.innerHTML = "error: " + error.message;
        }
    }

    return (
        <div className="register-form-container">
            <form className="register-form" method="post" onSubmit={handleSignUp}>
                <h2>sign up form</h2>
                <input type="text" name="email" placeholder="email" />
                <input type="text" name="login" placeholder="login" />
                <input type="password" name="password" placeholder="password" />
                <p className="error-message" ref={errorMessageRef}></p>
                <input className="register-submit" type="submit" value="sign up" />
            </form>
        </div>
    )
}