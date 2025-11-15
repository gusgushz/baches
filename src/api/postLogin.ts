import type { UserSession } from "../models";

const postLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );
    // Log para ver lo que devuelve el backend
    const res = (await response.json()) as LoginResponse;
    console.log("postLogin response:", res);
    return res;
    // return (await response.json()) as LoginResponse;
  } catch (error) {
    console.error("Error postLogin:", error);
    throw error;
  }
};
export default postLogin;

export type LoginResponse =
  | {
      message: string;
      data: UserSession;
      token: string;
    }
  | {
      message: string;
      error: string;
    };
