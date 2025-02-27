import React from "react";
import { AuthClient } from "./proto/generated/msgauth.client";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";

const transport = new GrpcWebFetchTransport({ baseUrl: "http://localhost:810" });
const client = new AuthClient(transport);

import './App.css';

export default function App() {
    async function handleSignUp(event) {
        event.preventDefault();

        const user = {
            email: event.target.email.value,
            // login: event.target.login.value,
            password: event.target.password.value
        };

        try {
            const response = await client.register(user);
            console.log(response);
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="register-form-container">
            <form className="register-form" method="post" onSubmit={handleSignUp}>
                <input type="text" name="email" placeholder="email" />
                <input type="text" name="login" placeholder="login" />
                <input type="password" name="password" placeholder="password" />
                <p className="error-message"></p>
                <input className="register-submit" type="submit" value="register" />
            </form>
        </div>
    )
}