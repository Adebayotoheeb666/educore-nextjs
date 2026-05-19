import { Metadata } from "next";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Service Management | EduCore AI",
};

export default function ServicesPage() {
  return (
    <div className="dashboard-content">
      <div className="panel-card-header" style={{ marginBottom: "2rem" }}>
        <h2>Service Management</h2>
        <p className="text-muted">Manage your school's optional modules and subscriptions</p>
      </div>
      <ServicesClient />
    </div>
  );
}
