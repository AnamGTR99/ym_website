import WalkthroughNav from "@/components/ui/WalkthroughNav";
import RoomEnvironment from "@/components/env/RoomEnvironment";

export default function RoomPage() {
  return (
    <>
      <WalkthroughNav current="/room" />
      <RoomEnvironment />
    </>
  );
}
