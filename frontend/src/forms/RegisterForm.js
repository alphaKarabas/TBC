import React, { useState } from "react";
import Input from "../components/Input";
import CheckboxInput from "../components/CheckboxInput";
import { registration } from "../store/UserSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [termsOfUseCheckbox, setTermsOfUseCheckbox] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fromPage = "/botMenegment/myBots";

  const navTo = () => {
    navigate(fromPage, { replace: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registration({ email, phoneNumber, password, callback: navTo }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="h3 mb-3 fw-normal">Registration</h1>
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
        type="tel"
        value={phoneNumber}
        setValue={setTel}
        placeholder="Phone numbers"
        pattern="[0-9]{6,16}"
        title=""
        label="Phone number"
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
        label="I accept the Terms of use"
        setChecked={setTermsOfUseCheckbox}
        checked={termsOfUseCheckbox}
        required
      />
      <button className="w-100 btn btn-lg btn-primary" type="submit">
        Sign Up
      </button>
    </form>
  );
}
