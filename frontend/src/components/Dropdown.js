import React, { useRef, useState, useEffect } from "react";

export default function Dropdown({
  children,
  lable,
  hiden = true,
  pos,
  x = 0,
  y = 0,
  align,
  ref,
  ...props
}) {
  const [open, setOpen] = useState(hiden);
  const [dropdownX, setDropdownX] = useState(0);
  const [dropdownY, setDropdownY] = useState(0);
  const buttonRef = useRef();
  const dropdownRef = useRef();

  useEffect(() => {
    const button = buttonRef.current.getBoundingClientRect();
    const dropdown = dropdownRef.current.getBoundingClientRect();
    switch (pos) {
      case "TOP":
        setDropdownY(-dropdown.height);
        break;
      case "RIGHT":
        setDropdownX(button.width);
        break;
      case "BOTTOM":
        setDropdownY(button.bottom);
        break;
      case "LEFT":
        setDropdownX(-dropdown.width);
        break;
      default:
        setDropdownY(button.bottom);
        break;
    }

    switch (align) {
      case "H_CENTER":
        setDropdownX(button.width / 2 - dropdown.width / 2);
        break;
      case "V_CENTER":
        setDropdownY(button.height / 2 - dropdown.height / 2);
        break;
      case "TOP":
        setDropdownY(button.bottom - dropdown.height);
        break;
      case "LEFT":
        setDropdownX(-dropdown.width + button.width);
        break;
      default:
        break;
    }
  }, [pos, align]);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
      }}
    >
      <button
        {...props}
        style={{backgroundColor: open ? "" : "#ffffff0e"}}
        ref={buttonRef}
        onClick={() => {
          setOpen((open) => (open = !open));
        }}
      >
        {lable}
      </button>
      <div
        ref={dropdownRef}
        style={{
          visibility: open ? "hidden" : "visible",
          position: "absolute",
          left: dropdownX + x,
          top: dropdownY + y,
        }}
      >
        {children}
      </div>
    </div>
  );
}
