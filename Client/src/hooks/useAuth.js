import { useContext } from "react";

import { login } from "../api/auth-api";
import { AuthContext } from "../contexts/AuthContext";

export const useLogin = () => {
    const loginHandler = async (email, password) => {
        const {changeAuthState} = useContext(AuthContext)

        const result = await login(email, password);
        
        changeAuthState(result);
    }

    return loginHandler;
};