import { Suspense } from "react";
import RegisterClient from "./registerClient";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display:        "flex",
            minHeight:      "100vh",
            alignItems:     "center",
            justifyContent: "center",
            background:     "var(--bg)",
          }}
        >
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text3)" }}>
            Verifying link…
          </p>
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
