import LoginForm from "../forms/LoginForm";

export default function LoginSlider() {
  return (
    <div
      className="offcanvas offcanvas-end text-dark"
      tabIndex="-1"
      id="offcanvasEnd"
      aria-labelledby="Login"
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title h3" id="offcanvasEndLabel">
          Login
        </h5>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Закрыть"
        ></button>
      </div>
      <div className="offcanvas-body small">
        <LoginForm />
      </div>
    </div>
  );
}
