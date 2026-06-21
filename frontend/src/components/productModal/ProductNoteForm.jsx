export default function ProductNoteForm({
  noteInput,
  onChange,
  saveError,
  isSaving,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Note
        </span>
        <textarea
          value={noteInput}
          onChange={onChange}
          placeholder="Add a personal note about this item…"
          maxLength={500}
          rows={3}
          autoFocus
          className="w-full resize-none rounded-xl border border-stone-200 bg-[var(--color-bg-surface)] px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-[#FFBC42] focus:ring-2 focus:ring-[#FFBC42]/25 dark:border-stone-700 dark:text-stone-50"
        />
        <p className="mt-1.5 text-xs text-stone-400">
          Your note replaces the product description in this cart. Clear to remove.
        </p>
      </label>

      {saveError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 rounded-xl bg-[#FFBC42] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save note"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-xl border border-stone-200 bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
