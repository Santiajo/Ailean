import RegisterForm from "./components/RegisterForm";
import RegisterInfo from "./components/RegisterInfo";
import styles from "./styles/registerPage.module.css";

export default function RegisterPage() {
  return (
    <div className={styles.registerContainer}>
      <RegisterInfo />
      <div className={styles.formSide}>
        <RegisterForm />
      </div>
    </div>
  );
}