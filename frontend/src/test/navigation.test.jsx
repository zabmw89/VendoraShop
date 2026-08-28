import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AuthPage } from "../pages/AuthPage";
import { ToastProvider } from "../context/ToastContext";
import { AuthProvider } from "../context/AuthContext";
import { api } from "../services/api";

/* Minimal routing harness — only enough to observe AuthPage's onNavigate calls */
const Harness = ({ initialView = "auth", initialParam }) => {
  const [view, setView] = useState(initialView);
  const [param, setParam] = useState(initialParam);
  const navigate = (v, p) => { setView(v); setParam(p); };
  return (
    <ToastProvider>
      <AuthProvider>
        <div>
          <span data-testid="view">{view}</span>
          <span data-testid="param">{param || ""}</span>
          {view === "auth" && <AuthPage onNavigate={navigate} redirectParam={param} />}
          {view === "checkout" && <h1>Checkout</h1>}
        </div>
      </AuthProvider>
    </ToastProvider>
  );
};

/* Helpers that drive each auth method through its form */
const submit = {
  login: (email, pw) => {
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"), { target: { value: pw } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In to Account/i }));
  },
  register: (name, email, pw) => {
    fireEvent.change(screen.getByPlaceholderText(/Alex Johnson/i), { target: { value: name } });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"), { target: { value: pw } });
    fireEvent.click(screen.getByRole("button", { name: /Create Free Account/i }));
  },

};

const user = (overrides) => ({
  id: "u1", name: "Test", email: "test@example.com", role: "customer", createdAt: "2026-01-01", ...overrides,
});

describe("Auth flow", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  /* ── Contract: every auth method lands on the correct view ── */
  const cases = [
    { label: "customer login → account",  method: "login",          args: ["alex@example.com", "pw"],  api: "login",    mock: { user: user(), token: "t" }, param: "login",    expected: "account" },
    { label: "admin login → admin",       method: "login",          args: ["admin@store.com", "pw"],   api: "login",    mock: { user: user({ role: "admin" }), token: "t" }, param: "login",    expected: "admin" },
    // Registration returns requires_verification → stays on auth page for code entry
    { label: "registration → verify",       method: "register",       args: ["Jane", "j@ex.com", "pass123"],  api: "register", mock: { user: user(), token: "t", requires_verification: true }, param: "register", expected: "auth" },
  ];

  it.each(cases)("$label", async ({ method, args, api: apiMethod, mock, param, expected }) => {
    vi.spyOn(api, apiMethod).mockResolvedValueOnce(mock);
    render(<Harness initialParam={param} />);
    submit[method](...args);
    await waitFor(() => expect(screen.getByTestId("view").textContent).toBe(expected));
  });

  /* ── Contract: redirect destination is preserved across login ── */
  it("preserves redirect destination", async () => {
    vi.spyOn(api, "login").mockResolvedValueOnce({ user: user(), token: "t" });
    render(<Harness initialParam="checkout" />);
    submit.login("alex@example.com", "pw");
    await waitFor(() => expect(screen.getByTestId("view").textContent).toBe("checkout"));
  });

  /* ── Contract: failed login shows error, never navigates ── */
  it("shows error and blocks navigation on failed login", async () => {
    const onNavigate = vi.fn();
    vi.spyOn(api, "login").mockRejectedValueOnce(new Error("Invalid email or password"));
    render(
      <ToastProvider>
        <AuthProvider>
          <AuthPage onNavigate={onNavigate} redirectParam="login" />
        </AuthProvider>
      </ToastProvider>
    );
    submit.login("wrong@x.com", "bad");
    await waitFor(() => expect(screen.getAllByText(/Invalid email or password/i).length).toBeGreaterThan(0));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  /* ── Contract: button disables while request is in-flight ── */
  it("disables submit during authentication", async () => {
    let resolve;
    vi.spyOn(api, "login").mockReturnValueOnce(new Promise((r) => (resolve = r)));
    render(
      <ToastProvider>
        <AuthProvider>
          <AuthPage onNavigate={vi.fn()} redirectParam="login" />
        </AuthProvider>
      </ToastProvider>
    );
    const btn = screen.getByRole("button", { name: /Sign In to Account/i });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"), { target: { value: "password" } });
    fireEvent.click(btn);
    expect(screen.getByText(/Authenticating/i)).toBeInTheDocument();
    expect(btn).toBeDisabled();
    await act(async () => resolve({ user: user(), token: "t", message: "OK" }));
  });
});
