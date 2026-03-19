import TrackForm from "@/components/admin/TrackForm";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function NewTrackPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add Track</h1>
      <TrackForm />
    </div>
  );
}
