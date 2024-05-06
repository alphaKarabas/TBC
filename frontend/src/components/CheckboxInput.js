export default function CheckboxInput({ label, setChecked, ...props }) {
  return (
    <div className="checkbox mb-3 form-check">
      <input onChange={() => setChecked(!props.checked)} className="form-check-input" {...props} />
      <label htmlFor={label}>{label}</label>
    </div>
  );
}
