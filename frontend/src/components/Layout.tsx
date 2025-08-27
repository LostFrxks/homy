import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
        {children}
      </main>
    </div>
  );
}
