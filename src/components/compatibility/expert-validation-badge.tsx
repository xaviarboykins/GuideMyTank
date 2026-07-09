type ExpertValidationBadgeProps = {
  expertValidated: boolean;
};

export function ExpertValidationBadge({
  expertValidated,
}: ExpertValidationBadgeProps) {
  if (!expertValidated) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">
      Expert validated
    </span>
  );
}
