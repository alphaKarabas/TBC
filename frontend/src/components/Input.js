export default function Input({label, setValue, ...props}) {
  return (
    <div className="form-floating mb-3">
      <input onChange={(e) => setValue(e.target.value)} className="form-control" {...props}/>
      <label htmlFor={label}>{label}</label>
    </div>
  );
}
