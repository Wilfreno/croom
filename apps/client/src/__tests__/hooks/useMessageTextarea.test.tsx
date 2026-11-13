import useMessageTextarea from '@/components/hooks/useMessageTextarea';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

function Harness({ onSubmit, canSubmit }: { onSubmit: () => void; canSubmit?: (value: string) => boolean }) {
  const { value, setValue, textareaProps } = useMessageTextarea({ onSubmit, canSubmit });

  return (
    <>
      <textarea aria-label="message" {...textareaProps} />
      <output aria-label="value">{value}</output>
      <button onClick={() => setValue('')}>clear</button>
    </>
  );
}

function setup(canSubmit?: (value: string) => boolean) {
  const onSubmit = vi.fn();
  render(<Harness onSubmit={onSubmit} canSubmit={canSubmit} />);
  return { onSubmit, textarea: screen.getByLabelText('message') as HTMLTextAreaElement, user: userEvent.setup() };
}

describe('useMessageTextarea', () => {
  it('tracks what is typed', async () => {
    const { textarea, user } = setup();

    await user.type(textarea, 'hello');

    expect(textarea).toHaveValue('hello');
    expect(screen.getByLabelText('value')).toHaveTextContent('hello');
  });

  it('submits on Enter without inserting a line break', async () => {
    const { textarea, user, onSubmit } = setup();

    await user.type(textarea, 'hi{Enter}');

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(textarea).toHaveValue('hi');
  });

  it('inserts a line break on Shift+Enter instead of submitting', async () => {
    const { textarea, user, onSubmit } = setup();

    await user.type(textarea, 'line one{Shift>}{Enter}{/Shift}line two');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('line one\nline two');
  });

  it('does not submit blank text by default', async () => {
    const { textarea, user, onSubmit } = setup();

    await user.type(textarea, '   {Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lets the caller decide what may be submitted', async () => {
    const { textarea, user, onSubmit } = setup(() => true);

    await user.type(textarea, '{Enter}');

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('ignores Enter while an IME composition is in progress', () => {
    const { textarea, onSubmit } = setup();
    fireEvent.change(textarea, { target: { value: 'にほん' } });

    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resizes to fit its content, including after being cleared', async () => {
    const { textarea, user } = setup();
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => 72 });

    await user.type(textarea, 'a');
    expect(textarea.style.height).toBe('72px');

    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => 24 });
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(textarea.style.height).toBe('24px');
  });

  it('starts as a single row', () => {
    const { textarea } = setup();

    expect(textarea).toHaveAttribute('rows', '1');
  });
});
