interface StatCalloutProps {
  value: string;
  label: string;
  color?: "emerald" | "amber" | "red" | "sky";
}

const colorMap = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
  sky: "text-sky-400",
};

export default function StatCallout({
  value,
  label,
  color = "emerald",
}: StatCalloutProps) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 sm:p-5 text-center">
      <div className={`text-2xl sm:text-3xl font-bold ${colorMap[color]}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-400">{label}</div>
    </div>
  );
}
