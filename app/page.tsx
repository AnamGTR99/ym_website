import WalkthroughNav from "@/components/ui/WalkthroughNav";
import LandingEnvironment from "@/components/env/LandingEnvironment";

export default function LandingPage() {
  return (
    <>
      <WalkthroughNav current="/" />
      <LandingEnvironment />
    </>
  );
}
