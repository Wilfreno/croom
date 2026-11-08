'use client';

import { ChangeEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';

/**
 * State and behavior for a message textarea:
 * - grows with its content (and shrinks back when cleared), capped by the textarea's CSS `max-height`
 * - Enter submits, Shift+Enter inserts a line break
 * - ignores Enter while an IME composition is in progress
 *
 * Spread `textareaProps` onto the `<Textarea>`.
 *
 * @param canSubmit decides whether Enter submits; defaults to "has non-whitespace text"
 */
export default function useMessageTextarea({
  onSubmit,
  canSubmit = (value) => !!value.trim(),
}: {
  onSubmit: () => void;
  canSubmit?: (value: string) => boolean;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  // Runs on every value change, so typing, emoji inserts and clearing after send all resize.
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.currentTarget.value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!canSubmit(value)) return;
    onSubmit();
  }

  return {
    value,
    setValue,
    textareaProps: { ref, value, onChange, onKeyDown, rows: 1 },
  };
}
