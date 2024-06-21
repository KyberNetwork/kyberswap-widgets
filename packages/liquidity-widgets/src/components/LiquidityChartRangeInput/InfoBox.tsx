import { ReactNode } from "react";

export function InfoBox({
  message,
  icon,
}: {
  message?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div style={{ height: "100%", justifyContent: "center" }}>
      {icon}
      {message && (
        <div
          style={{
            fontWeight: "700",
            fontSize: "20px",
            textAlign: "center",
            paddingTop: "4px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
