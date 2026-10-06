import { GraduationCap } from "lucide-react";

type BrandMarkProps = {
  compact?: boolean;
};

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className={`brand-mark ${compact ? "brand-mark-compact" : ""}`}>
      <span className="brand-mark-icon" aria-hidden="true">
        <GraduationCap size={compact ? 18 : 21} strokeWidth={1.9} />
      </span>
      <span className="brand-mark-name">LEARNEXA</span>
    </span>
  );
}
