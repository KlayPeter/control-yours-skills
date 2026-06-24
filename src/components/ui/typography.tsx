import { useEffect, useState } from "react";
import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";

export function formatAbsoluteTime(value: string) {
  return formatISO9075(new Date(value));
}

export function RelativeTimeText({ value }: { value: string }) {
  const absoluteTime = formatAbsoluteTime(value);
  const [displayValue, setDisplayValue] = useState(absoluteTime);

  useEffect(() => {
    setDisplayValue(
      `${formatDistanceToNowStrict(new Date(value), { addSuffix: true })} | ${absoluteTime}`
    );
  }, [absoluteTime, value]);

  return <>{displayValue}</>;
}

export function OverviewMetric({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="app-card p-4">
      <p className="text-xs uppercase tracking-[0.16em] app-text-soft">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight app-text">{value}</p>
    </div>
  );
}
