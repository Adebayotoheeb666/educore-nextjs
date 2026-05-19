import Link from "next/link";

export default function ActionCard({ quickActions, children }: { quickActions: { href: string; icon: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <div className="dashboard-action-card">
      <div className="dashboard-action-card-actions">
        {children}
      </div>
      <div className="dashboard-action-card-quick">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="quick-action-btn">
            <span className="quick-action-icon">{a.icon}</span>
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
