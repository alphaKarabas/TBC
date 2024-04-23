import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Input from "../../../../Inputs/Input";
import CheckboxInput from "../../../../Inputs/CheckboxInput";
import { login } from "../../../../store/UserSlice";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsOfUseCheckbox, setTermsOfUseCheckbox] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const fromPage = location?.state?.form?.pathname || "/botMenegment/myBots";

  const navTo = () => {
    navigate(fromPage, {replace: true});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password, callback: navTo }));
  }

  return (
    <form
      className="p-3"
      onSubmit={handleSubmit}
    >
      <Input
        type="email"
        value={email}
        setValue={setEmail}
        placeholder="name@example.com"
        // pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
        label="Email address"
        required
      />
      <Input
        type="password"
        value={password}
        setValue={setPassword}
        placeholder="Password"
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        title="Must contain at least one  number and one uppercase and lowercase"
        label="Password"
        required
      />
      <CheckboxInput
        type="checkbox"
        value=""
        label="Remember me"
        setChecked={setTermsOfUseCheckbox}
        checked={termsOfUseCheckbox}
      />

      <button type="submit" className="btn btn-primary">
        Sign in
      </button>
      <div>
        Don't have an account?{" "}
        <span data-bs-dismiss="offcanvas">
          <Link to="/registration">Register</Link>
        </span>
      </div>
    </form>
  );
}
