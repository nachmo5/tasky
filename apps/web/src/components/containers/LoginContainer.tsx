import { GlobalConsumer } from "@/config/store";
import { LoginForm } from "../blocks/LoginForm";
import { useNavigate } from "react-router";

export function LoginContainer() {
  const navigate = useNavigate();
  return (
    <GlobalConsumer mutations={["login"]}>
      {({ login }) => (
        <LoginForm
          error={login.error ? "Invalid credentials" : undefined}
          form={{
            onSubmit: (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);

              const email = (formData.get("email") as string | undefined)?.toString();
              const password = (formData.get("password") as string | undefined)?.toString();

              if (email && password) {
                void login({ username: email, password: password }).then(() => navigate("/", { replace: true }));
              }
            },
          }}
        />
      )}
    </GlobalConsumer>
  );
}
