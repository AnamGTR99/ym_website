import { redirect } from "next/navigation";

// The TV experience lives inside the 3D room now. This route only
// exists to catch direct /tv links and drop users straight into the
// motel room with the CRT already zoomed in.
export default function TVRedirect() {
  redirect("/room?tv=1");
}
