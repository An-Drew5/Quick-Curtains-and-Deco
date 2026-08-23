export default function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
