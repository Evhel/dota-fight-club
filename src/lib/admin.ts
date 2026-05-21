import { useEffect, useState } from "react";

const KEY = "fc_dota_admin";
const PASSWORD = "14888";

const listeners = new Set<() => void>();

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function loginAdmin(pwd: string): boolean {
  if (pwd !== PASSWORD) return false;
  localStorage.setItem(KEY, "1");
  listeners.forEach((l) => l());
  return true;
}

export function logoutAdmin() {
  localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useAdmin() {
  const [admin, setAdmin] = useState<boolean>(false);
  useEffect(() => {
    setAdmin(isAdmin());
    const l = () => setAdmin(isAdmin());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return admin;
}
