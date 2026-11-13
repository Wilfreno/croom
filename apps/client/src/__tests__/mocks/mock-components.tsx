import { vi } from 'vitest';

/** The file a fake upload "completes" with. */
export const UPLOADED_FILE = { key: 'uploaded-key', url: 'https://utfs.io/uploaded.png' };

type UploadButtonProps = {
  onUploadBegin?: () => void;
  onClientUploadComplete?: (files: { key: string; url: string }[]) => void;
  onUploadError?: (error: Error) => void;
};

/**
 * Stands in for UploadThing's generated button. Clicking "upload photo" runs the
 * begin/complete callbacks with {@link UPLOADED_FILE}; "fail upload" runs the error one.
 */
export function FakeUploadButton({ onUploadBegin, onClientUploadComplete, onUploadError }: UploadButtonProps) {
  return (
    <span>
      <button
        type="button"
        onClick={() => {
          onUploadBegin?.();
          onClientUploadComplete?.([UPLOADED_FILE]);
        }}
      >
        upload photo
      </button>
      <button type="button" onClick={() => onUploadError?.(new Error('upload failed'))}>
        fail upload
      </button>
    </span>
  );
}

export const uploadthingModule = { UploadThingButton: FakeUploadButton, UploadThingDropzone: FakeUploadButton };

/** Stands in for emoji-picker-react: one button that picks 😀. */
export function FakeEmojiPicker({ onEmojiClick }: { onEmojiClick: (emoji: { emoji: string }) => void }) {
  return (
    <button type="button" onClick={() => onEmojiClick({ emoji: '😀' })}>
      pick emoji
    </button>
  );
}

export const emojiPickerModule = { default: FakeEmojiPicker, EmojiStyle: { NATIVE: 'native' } };

/** Stands in for next/image, which needs Next's loader config. */
export function FakeNextImage({ src, alt }: { src: string | { src: string }; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={typeof src === 'string' ? src : src.src} alt={alt} />;
}

export const nextImageModule = { default: FakeNextImage };

/**
 * jsdom never loads images, so `new Image()` would never fire `onload`. This makes
 * every image "load" as 640x480 as soon as its src is set.
 *
 * Only the `onload` property fires, not a `load` event, so Radix avatars (which
 * listen for the event) keep showing their fallback instead of an extra <img>.
 */
export function stubImageLoading() {
  vi.stubGlobal(
    'Image',
    class extends EventTarget {
      width = 640;
      height = 480;
      onload: (() => void) | null = null;
      onerror: ((error: unknown) => void) | null = null;
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
}

/** A `fetch` stub for the `/api/photo` delete route. */
export function stubPhotoDelete(reply: { status: string; message: string } = { status: 'OK', message: 'photo deleted' }) {
  const fetchMock = vi.fn().mockResolvedValue({ json: async () => reply });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
