import NavBar from "@/app/components/NavBar";
import AuthGate from "@/app/components/AuthGate";

// Keep this layout dynamic because authentication is request-specific.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="app-container">
        <NavBar />
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </AuthGate>
  );
}
