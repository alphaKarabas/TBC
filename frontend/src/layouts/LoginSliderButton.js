import LoginSlider from "./LoginSlider";

export default function LoginSliderButton() {
  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasEnd"
        aria-controls="offcanvasEnd"
      >
        Login
      </button>

      <LoginSlider />
    </>
  );
}
