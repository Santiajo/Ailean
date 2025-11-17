import LoginForm from "./components/LoginForm";
import LoginInfo from "./components/LoginInfo";
import styles from "./styles/loginPage.module.css";

export default function LoginPage() {
  return (
    <div className={styles.loginContainer}>
      <LoginInfo />
      <div className={styles.formSide}>
        <LoginForm />
      </div>
    </div>
  );
}
