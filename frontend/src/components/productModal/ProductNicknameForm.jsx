export default function ProductNicknameForm({
  nicknameInput,
  onChange,
  originalTitle,
  saveError,
  isSaving,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-stone-700">
          Nickname
        </span>
        <input
          id="product-nickname"
          type="text"
          value={nicknameInput}
          onChange={onChange}
          placeholder='e.g. "Birthday gift"'
          maxLength={80}
          autoFocus
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-[#FFBC42] focus:ring-2 focus:ring-[#FFBC42]/25"
        />
        <p className="mt-1.5 text-xs text-stone-400">
          Leave blank to use the original product name.
        </p>
      </label>

      {originalTitle && (
        <p className="text-sm text-stone-500">
          Original:{" "}
          <span className="text-stone-700">{originalTitle}</span>
        </p>
      )}

      {saveError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 rounded-xl bg-[#FFBC42] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
