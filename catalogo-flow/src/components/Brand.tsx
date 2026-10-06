import Link from "next/link";
import { Layers2 } from "lucide-react";
export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Catálogo Flow, início">
      <span className="brand-icon">
        <Layers2 size={22} />
      </span>
      catálogo<span>flow</span>
    </Link>
  );
}
