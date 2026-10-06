import Link from "next/link";
import { Network } from "lucide-react";

export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="NOC Telemetry Center · início">
      <span className="brand-mark">
        <Network size={22} strokeWidth={1.7} />
      </span>
      <span>
        NOC<span className="brand-light"> / telemetry</span>
      </span>
    </Link>
  );
}
