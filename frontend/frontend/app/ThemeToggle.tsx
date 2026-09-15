"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("learnexa-theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  function changeTheme() {
    const newValue = !darkMode;

    setDarkMode(newValue);

    if (newValue) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("learnexa-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("learnexa-theme", "light");
    }
  }

  return (
    <button
      type="button"
      onClick={changeTheme}
      className="secondary-button"
      aria-label="Change theme"
      title="Change theme"
    >
      {darkMode ? "☀ Light" : "☾ Dark"}
    </button>
  );
}