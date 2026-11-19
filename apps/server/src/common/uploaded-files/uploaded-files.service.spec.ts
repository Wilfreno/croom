import { describe, expect, it, vi } from 'vitest';
import type { UTApi } from 'uploadthing/server';
import { UploadedFilesService } from './uploaded-files.service';

function build() {
  const deleteFiles = vi
    .fn()
    .mockResolvedValue({ success: true, deletedCount: 1 });
  const service = new UploadedFilesService({ deleteFiles } as unknown as UTApi);
  return { service, deleteFiles };
}

describe('UploadedFilesService', () => {
  it('deletes the files with the given keys', async () => {
    const { service, deleteFiles } = build();

    await service.deleteFiles(['first-key', 'second-key']);

    expect(deleteFiles).toHaveBeenCalledWith(['first-key', 'second-key']);
  });

  it('does not call UploadThing when there is nothing to delete', async () => {
    const { service, deleteFiles } = build();

    await service.deleteFiles([]);

    expect(deleteFiles).not.toHaveBeenCalled();
  });

  it('does not throw when UploadThing fails', async () => {
    const { service, deleteFiles } = build();
    deleteFiles.mockRejectedValue(new Error('uploadthing down'));

    await expect(service.deleteFiles(['key'])).resolves.toBeUndefined();
  });

  it('does not throw when UploadThing reports the deletion failed', async () => {
    const { service, deleteFiles } = build();
    deleteFiles.mockResolvedValue({ success: false, deletedCount: 0 });

    await expect(service.deleteFiles(['key'])).resolves.toBeUndefined();
  });
});
