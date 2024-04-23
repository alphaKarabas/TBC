import RegisterForm from "./RegisterForm";
import Benefits from "./Benefits";

export default function Registration() {
  return (
    <div className="row container">
      <div className="col w-5 form-signin m-auto bg-light text-dark p-4 rounded-4">
        <RegisterForm />
      </div>
      <Benefits />
    </div>
  );
}
