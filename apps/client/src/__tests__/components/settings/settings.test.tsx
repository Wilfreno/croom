import { stubImageLoading, UPLOADED_FILE } from '@/__tests__/mocks/mock-components';
import { mockPhoto, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import SettingsPage from '@/app/(main)/(settings)/settings/page';
import SettingsBlockedUsers from '@/components/page/settings/SecurityAndAccessibility/SettingsBlockedUsers';
import SettingsChangePassword from '@/components/page/settings/SecurityAndAccessibility/SettingsChangePassword';
import SettingsDeleteAccount from '@/components/page/settings/SecurityAndAccessibility/SettingsDeleteAccount';
import SettingsChangeDisplayname from '@/components/page/settings/profile/SettingsChangeDisplayname';
import SettingsChangePhoto from '@/components/page/settings/profile/SettingsChangePhoto';
import SettingsChangeUserName from '@/components/page/settings/profile/SettingsChangeUserName';
import { DELETERequest, GETRequest, PATCHRequest } from '@/lib/server/requests';
import type { UserSession } from '@repo/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/page/UploadthingButton', async () => (await import('@/__tests__/mocks/mock-components')).uploadthingModule);
vi.mock('@/lib/server/requests', () => ({ GETRequest: vi.fn(), PATCHRequest: vi.fn(), DELETERequest: vi.fn() }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

let sessionUser: UserSession;
const update = vi.fn();
const logout = vi.fn();
vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: sessionUser, update }, logout }),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const OK = { status: 'OK', message: '', data: null };
const refused = (message: string) => ({ status: 'BAD REQUEST', message, data: null });

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser = mockSession({ displayName: 'Me', userName: '@me' });
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(PATCHRequest).mockResolvedValue(OK as never);
  vi.mocked(DELETERequest).mockResolvedValue(OK as never);
  vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [] } as never);
});
afterEach(() => vi.unstubAllGlobals());

describe('Settings page', () => {
  it('shows the profile and security sections, and goes back home', async () => {
    renderWithQuery(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security & Accessibility')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(push).toHaveBeenCalledWith('/');
  });
});

describe('SettingsChangeDisplayname', () => {
  it('changes your display name', async () => {
    renderWithQuery(<SettingsChangeDisplayname />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    const input = screen.getByPlaceholderText('Display name');
    expect(input).toHaveValue('Me');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Me{Enter}');

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/user/display_name', { displayName: 'New Me' });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ displayName: 'New Me' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Display name')).not.toBeInTheDocument());
  });

  it('does not update your session when the server refuses', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue(refused('too long') as never);
    renderWithQuery(<SettingsChangeDisplayname />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    await userEvent.type(screen.getByPlaceholderText('Display name'), '!{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('too long'));
    expect(update).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    renderWithQuery(<SettingsChangeDisplayname />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    await userEvent.click(screen.getByRole('button', { name: 'cancel' }));

    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(PATCHRequest).not.toHaveBeenCalled();
  });
});

describe('SettingsChangeUserName', () => {
  it('shows your username without the @', () => {
    renderWithQuery(<SettingsChangeUserName />);

    expect(screen.getByText('me')).toBeInTheDocument();
  });

  it('changes your username, adding the @', async () => {
    renderWithQuery(<SettingsChangeUserName />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    const input = screen.getByPlaceholderText('Username');
    expect(input).toHaveValue('me');
    await userEvent.clear(input);
    await userEvent.type(input, 'newme{Enter}');

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/user/username', { username: '@newme' });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ userName: '@newme' }));
  });

  it('cannot confirm an empty or unchanged username', async () => {
    renderWithQuery(<SettingsChangeUserName />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled();

    await userEvent.clear(screen.getByPlaceholderText('Username'));
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled();
  });

  it('shows why the username was refused', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue(refused('username taken') as never);
    renderWithQuery(<SettingsChangeUserName />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    await userEvent.type(screen.getByPlaceholderText('Username'), '2{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('username taken'));
    expect(update).not.toHaveBeenCalled();
  });
});

describe('SettingsChangePhoto', () => {
  it('shows your recent photos, except the current one', async () => {
    const photos = [mockPhoto({ url: 'https://utfs.io/current' }), mockPhoto({ url: 'https://utfs.io/older' })];
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: photos } as never);

    renderWithQuery(<SettingsChangePhoto />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'change' })).toHaveLength(1));
    expect(GETRequest).toHaveBeenCalledWith('/v1/user/photos');
  });

  it('switches back to a recent photo', async () => {
    const older = mockPhoto();
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [mockPhoto(), older] } as never);
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(await screen.findByRole('button', { name: 'change' }));

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/user/photo', { photo: older });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ photo: older }));
  });

  it('deletes a recent photo', async () => {
    const [current, older, oldest] = [mockPhoto(), mockPhoto(), mockPhoto()];
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [current, older, oldest] } as never);
    renderWithQuery(<SettingsChangePhoto />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'change' })).toHaveLength(2));

    const trash = screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-trash'));
    await userEvent.click(trash[1]);

    expect(DELETERequest).toHaveBeenCalledWith('/v1/photo/', { id: oldest.id });
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'change' })).toHaveLength(1));
  });

  it('keeps a photo it could not delete', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [mockPhoto(), mockPhoto()] } as never);
    vi.mocked(DELETERequest).mockResolvedValue(refused('in use') as never);
    renderWithQuery(<SettingsChangePhoto />);
    await screen.findByRole('button', { name: 'change' });

    await userEvent.click(screen.getAllByRole('button').find((b) => b.querySelector('.lucide-trash'))!);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('in use'));
    expect(screen.getByRole('button', { name: 'change' })).toBeInTheDocument();
  });

  it('uses a newly uploaded photo with its size', async () => {
    stubImageLoading();
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(screen.getByRole('button', { name: 'upload photo' }));

    await waitFor(() =>
      expect(PATCHRequest).toHaveBeenCalledWith('/v1/user/photo', {
        photo: { ...UPLOADED_FILE, width: 640, height: 480 },
      }),
    );
    await waitFor(() => expect(update).toHaveBeenCalled());
  });

  it('keeps your photo when the server refuses the new one', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [mockPhoto(), mockPhoto()] } as never);
    vi.mocked(PATCHRequest).mockResolvedValue(refused('too big') as never);
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(await screen.findByRole('button', { name: 'change' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('too big'));
    expect(update).not.toHaveBeenCalled();
  });

  it('shows an upload error', async () => {
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(screen.getByRole('button', { name: 'fail upload' }));

    expect(toast.error).toHaveBeenCalledWith('upload failed');
  });
});

describe('SettingsBlockedUsers', () => {
  const blocked = (userName: string) => ({
    id: `block-${userName}`,
    blockedUser: mockUser({ userName }),
    blocker: 'me',
    conversation: 'c',
    dateCreated: new Date(),
  });

  it('loads the list only when opened', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [blocked('@spammer')] } as never);
    renderWithQuery(<SettingsBlockedUsers />);
    expect(GETRequest).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    expect(await screen.findByText('@spammer')).toBeInTheDocument();
    expect(GETRequest).toHaveBeenCalledWith('/v1/user/blocked');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('unblocks someone', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [blocked('@a'), blocked('@b')] } as never);
    renderWithQuery(<SettingsBlockedUsers />);
    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    const row = (await screen.findByText('@b')).parentElement!;
    await userEvent.click(within(row).getByRole('button', { name: 'Unblock' }));

    expect(DELETERequest).toHaveBeenCalledWith('/v1/block', { id: 'block-@b' });
    await waitFor(() => expect(screen.queryByText('@b')).not.toBeInTheDocument());
    expect(screen.getByText('@a')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith('user unblocked');
  });

  it('keeps someone the server would not unblock', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ ...OK, data: [blocked('@a')] } as never);
    vi.mocked(DELETERequest).mockResolvedValue(refused('not found') as never);
    renderWithQuery(<SettingsBlockedUsers />);
    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Unblock' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('not found'));
    expect(screen.getByText('@a')).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalledWith('user unblocked');
  });
});

describe('SettingsChangePassword', () => {
  async function openForm() {
    renderWithQuery(<SettingsChangePassword />);
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    return {
      newPassword: screen.getByLabelText('New Password'),
      confirm: screen.getByLabelText('Confirm Password'),
      submit: screen.getByRole('button', { name: 'Confirm' }),
    };
  }

  it('labels each field correctly', async () => {
    const { newPassword, confirm } = await openForm();

    expect(newPassword).toHaveAttribute('placeholder', 'New Password');
    expect(confirm).toHaveAttribute('placeholder', 'Confirm Password');
  });

  it('only allows matching passwords', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(newPassword, 'secret1');
    await userEvent.type(confirm, 'secret2');

    expect(screen.getByText('Password is not the same')).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('changes the password', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(newPassword, 'secret1');
    await userEvent.type(confirm, 'secret1');
    await userEvent.click(submit);

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/user/password', { password: { new: 'secret1', confirm: 'secret1' } });
  });

  it('shows a generic error when the change fails', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue(refused('weak') as never);
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(newPassword, 'a');
    await userEvent.type(confirm, 'a');
    await userEvent.click(submit);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Oops! something went wrong'));
  });

  it('reveals each password separately', async () => {
    const { newPassword, confirm } = await openForm();
    const [revealNew] = screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-eye-off'));

    await userEvent.click(revealNew);

    expect(newPassword).toHaveAttribute('type', 'text');
    expect(confirm).toHaveAttribute('type', 'password');
  });

  it('clears everything on cancel', async () => {
    const { newPassword } = await openForm();
    await userEvent.type(newPassword, 'abc');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));

    expect(screen.getByLabelText('New Password')).toHaveValue('');
  });
});

describe('SettingsDeleteAccount', () => {
  async function openDialog() {
    renderWithQuery(<SettingsDeleteAccount />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    return screen.findByRole('dialog');
  }

  it('only deletes once DELETE is typed, in any case', async () => {
    const dialog = await openDialog();
    const confirm = within(dialog).getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByPlaceholderText('Type "DELETE" to confirm'), 'delete');
    await userEvent.click(confirm);

    expect(DELETERequest).toHaveBeenCalledWith('/v1/user');
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it('stays signed in when deleting fails', async () => {
    vi.mocked(DELETERequest).mockResolvedValue(refused('nope') as never);
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByPlaceholderText('Type "DELETE" to confirm'), 'DELETE');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Oops! something went wrong'));
    expect(logout).not.toHaveBeenCalled();
  });
});
