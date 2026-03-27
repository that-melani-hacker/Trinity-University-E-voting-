import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthToken() {
  return localStorage.getItem("token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("token");
}

export function getAuthOptions() {
  const token = getAuthToken();
  return {
    request: {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  };
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
