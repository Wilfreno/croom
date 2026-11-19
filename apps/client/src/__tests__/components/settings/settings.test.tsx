import { UPLOADED_PHOTO } from '@/__tests__/mocks/mock-components';
import { mockPhoto, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import SettingsPage from '@/app/(main)/(settings)/settings/page';
import SettingsBlockedUsers from '@/components/page/settings/SecurityAndAccessibility/SettingsBlockedUsers';
import SettingsChangePassword from '@/components/page/settings/SecurityAndAccessibility/SettingsChangePassword';
import SettingsDeleteAccount from '@/components/page/settings/SecurityAndAccessibility/SettingsDeleteAccount';
import SettingsChangeDisplayname from '@/components/page/settings/profile/SettingsChangeDisplayname';
import SettingsChangePhoto from '@/components/page/settings/profile/SettingsChangePhoto';
import SettingsChangeUserName from '@/components/page/settings/profile/SettingsChangeUserName';
import { axiosInstance } from '@/lib/axios-instance';
import { PASSWORD_CHANGED, PROFILE_PHOTO_CHANGED, SOMETHING_WENT_WRONG } from '@repo/constants';
import { AuthServiceOptions } from '@repo/enums';
import type { UserSession } from '@repo/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/page/UploadthingButton', async () => (await import('@/__tests__/mocks/mock-components')).uploadthingModule);
vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

let sessionUser: UserSession;
const update = vi.fn();
const logout = vi.fn();
vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: sessionUser, update }, logout }),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const STRONG_PASSWORD = 'N3w-secret!';

const reply = (data: unknown) => ({ data: { status: 'OK', message: '', data } });

function refused(message: string, status = 400) {
  const response = {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { status: 'BAD REQUEST', message, data: null },
  };
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, response);
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser = mockSession({
    displayName: 'Me',
    userName: 'me',
    authService: [AuthServiceOptions.WITH_EMAIL_AND_PASSWORD],
  });
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(axiosInstance.get).mockResolvedValue(reply([]));
  vi.mocked(axiosInstance.patch).mockImplementation(async (_url, body) => reply(body));
  vi.mocked(axiosInstance.delete).mockResolvedValue(reply(null));
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
    await userEvent.type(input, '  New Me {Enter}');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/user/display-name', { displayName: 'New Me' });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ displayName: 'New Me' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Display name')).not.toBeInTheDocument());
  });

  it('cannot confirm an empty or unchanged display name', async () => {
    renderWithQuery(<SettingsChangeDisplayname />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled();

    await userEvent.clear(screen.getByPlaceholderText('Display name'));
    await userEvent.type(screen.getByPlaceholderText('Display name'), '   ');
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled();
  });

  it('does not update your session when the server refuses', async () => {
    vi.mocked(axiosInstance.patch).mockRejectedValue(refused('too long'));
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
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });
});

describe('SettingsChangeUserName', () => {
  it('shows a legacy username without its @', () => {
    sessionUser = mockSession({ userName: '@legacy' });
    renderWithQuery(<SettingsChangeUserName />);

    expect(screen.getByText('legacy')).toBeInTheDocument();
  });

  it('shows a username that has no @ in full', () => {
    renderWithQuery(<SettingsChangeUserName />);

    expect(screen.getByText('me')).toBeInTheDocument();
  });

  it('changes your username', async () => {
    renderWithQuery(<SettingsChangeUserName />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    const input = screen.getByPlaceholderText('Username');
    expect(input).toHaveValue('me');
    await userEvent.clear(input);
    await userEvent.type(input, '@newme{Enter}');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/user/user-name', { userName: 'newme' });
    await waitFor(() => expect(update).toHaveBeenCalledWith({ userName: 'newme' }));
  });

  it('cannot confirm an empty or unchanged username', async () => {
    renderWithQuery(<SettingsChangeUserName />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled();

    await userEvent.clear(screen.getByPlaceholderText('Username'));
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled();
  });

  it('shows why the username was refused', async () => {
    vi.mocked(axiosInstance.patch).mockRejectedValue(refused('username is already taken', 409));
    renderWithQuery(<SettingsChangeUserName />);

    await userEvent.click(screen.getByRole('button', { name: 'change' }));
    await userEvent.type(screen.getByPlaceholderText('Username'), '2{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('username is already taken'));
    expect(update).not.toHaveBeenCalled();
  });
});

describe('SettingsChangePhoto', () => {
  it('shows your recent photos, except the one you are using', async () => {
    const current = mockPhoto();
    sessionUser = mockSession({ photo: current });
    vi.mocked(axiosInstance.get).mockResolvedValue(reply([mockPhoto(), current, mockPhoto()]));

    renderWithQuery(<SettingsChangePhoto />);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'change' })).toHaveLength(2));
    expect(axiosInstance.get).toHaveBeenCalledWith('/user/photos');
  });

  it('switches back to a recent photo', async () => {
    const older = mockPhoto();
    vi.mocked(axiosInstance.get).mockResolvedValue(reply([older]));
    vi.mocked(axiosInstance.patch).mockResolvedValue(reply({ photo: { id: older.id, url: older.url } }));
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(await screen.findByRole('button', { name: 'change' }));

    expect(axiosInstance.patch).toHaveBeenCalledWith(`/user/photos/${older.id}`);
    await waitFor(() => expect(update).toHaveBeenCalledWith({ photo: { id: older.id, url: older.url } }));
  });

  it('deletes a recent photo', async () => {
    const [older, oldest] = [mockPhoto(), mockPhoto()];
    vi.mocked(axiosInstance.get).mockResolvedValue(reply([older, oldest]));
    renderWithQuery(<SettingsChangePhoto />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'change' })).toHaveLength(2));

    await userEvent.click(screen.getAllByRole('button', { name: 'delete photo' })[1]);

    expect(axiosInstance.delete).toHaveBeenCalledWith(`/user/photos/${oldest.id}`);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'change' })).toHaveLength(1));
  });

  it('cannot delete a recent photo while switching to it', async () => {
    const older = mockPhoto();
    vi.mocked(axiosInstance.get).mockResolvedValue(reply([older]));
    vi.mocked(axiosInstance.patch).mockReturnValue(new Promise(() => {}));
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(await screen.findByRole('button', { name: 'change' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'delete photo' })).toBeDisabled());
    expect(axiosInstance.delete).not.toHaveBeenCalled();
  });

  it('keeps a photo it could not delete', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue(reply([mockPhoto()]));
    vi.mocked(axiosInstance.delete).mockRejectedValue(refused('photo does not exist', 404));
    renderWithQuery(<SettingsChangePhoto />);
    await screen.findByRole('button', { name: 'change' });

    await userEvent.click(screen.getByRole('button', { name: 'delete photo' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('photo does not exist'));
    expect(screen.getByRole('button', { name: 'change' })).toBeInTheDocument();
  });

  it('uses the photo the server saved for the upload', async () => {
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(screen.getByRole('button', { name: 'upload photo' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(UPLOADED_PHOTO));
    expect(toast.success).toHaveBeenCalledWith(PROFILE_PHOTO_CHANGED);
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it('says something went wrong when the server saved no photo', async () => {
    renderWithQuery(<SettingsChangePhoto />);

    await userEvent.click(screen.getByRole('button', { name: 'upload photo without result' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
    expect(update).not.toHaveBeenCalled();
  });

  it('keeps your photo when the server refuses the new one', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue(reply([mockPhoto()]));
    vi.mocked(axiosInstance.patch).mockRejectedValue(refused('too big'));
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
    id: `conversation-${userName}`,
    blockedUser: mockUser({ userName }),
    blocker: 'me',
  });
  const respondWith = (data: unknown) => vi.mocked(axiosInstance.get).mockResolvedValue(reply(data));

  it('loads the list only when opened', async () => {
    respondWith([blocked('@spammer')]);
    renderWithQuery(<SettingsBlockedUsers />);
    expect(axiosInstance.get).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    expect(await screen.findByText('@spammer')).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledWith('/user/blocked');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('says so when nobody is blocked', async () => {
    respondWith([]);
    renderWithQuery(<SettingsBlockedUsers />);

    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    expect(await screen.findByText("You haven't blocked anyone.")).toBeInTheDocument();
  });

  it('unblocks the conversation of whoever you pick', async () => {
    respondWith([blocked('@a'), blocked('@b')]);
    vi.mocked(axiosInstance.delete).mockResolvedValue({});
    renderWithQuery(<SettingsBlockedUsers />);
    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    const row = (await screen.findByText('@b')).parentElement!;
    await userEvent.click(within(row).getByRole('button', { name: 'Unblock' }));

    expect(axiosInstance.delete).toHaveBeenCalledWith('/conversation/conversation-@b/block');
    await waitFor(() => expect(screen.queryByText('@b')).not.toBeInTheDocument());
    expect(screen.getByText('@a')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith('user unblocked');
  });

  it('keeps someone the server would not unblock', async () => {
    respondWith([blocked('@a')]);
    vi.mocked(axiosInstance.delete).mockRejectedValue(new Error('409'));
    renderWithQuery(<SettingsBlockedUsers />);
    await userEvent.click(screen.getByRole('button', { name: 'See list' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Unblock' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
    expect(screen.getByText('@a')).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalledWith('user unblocked');
    await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledTimes(2));
  });
});

describe('SettingsChangePassword', () => {
  async function openForm() {
    renderWithQuery(<SettingsChangePassword />);
    await userEvent.click(screen.getByRole('button', { name: /Change|Set password/ }));
    return {
      newPassword: screen.getByLabelText('New Password'),
      confirm: screen.getByLabelText('Confirm Password'),
      submit: screen.getByRole('button', { name: 'Confirm' }),
    };
  }

  it('labels each field correctly', async () => {
    const { newPassword, confirm } = await openForm();

    expect(screen.getByLabelText('Current Password')).toHaveAttribute('placeholder', 'Current Password');
    expect(newPassword).toHaveAttribute('placeholder', 'New Password');
    expect(confirm).toHaveAttribute('placeholder', 'Confirm Password');
  });

  it('only allows matching passwords', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(screen.getByLabelText('Current Password'), 'old');
    await userEvent.type(newPassword, STRONG_PASSWORD);
    await userEvent.type(confirm, 'N3w-secret?');

    expect(screen.getByText('Password is not the same')).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('does not allow a weak password', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(screen.getByLabelText('Current Password'), 'old');
    await userEvent.type(newPassword, 'weakweak');
    await userEvent.type(confirm, 'weakweak');

    expect(submit).toBeDisabled();
  });

  it('requires your current password', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(newPassword, STRONG_PASSWORD);
    await userEvent.type(confirm, STRONG_PASSWORD);

    expect(submit).toBeDisabled();
  });

  it('changes the password', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(screen.getByLabelText('Current Password'), 'old');
    await userEvent.type(newPassword, STRONG_PASSWORD);
    await userEvent.type(confirm, STRONG_PASSWORD);
    await userEvent.click(submit);

    expect(axiosInstance.patch).toHaveBeenCalledWith('/user/password', {
      currentPassword: 'old',
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(PASSWORD_CHANGED));
  });

  it('lets an account without a password set one', async () => {
    sessionUser = mockSession({ authService: [AuthServiceOptions.WITH_GOOGLE] });
    const { newPassword, confirm, submit } = await openForm();

    expect(screen.queryByLabelText('Current Password')).not.toBeInTheDocument();
    await userEvent.type(newPassword, STRONG_PASSWORD);
    await userEvent.type(confirm, STRONG_PASSWORD);
    await userEvent.click(submit);

    expect(axiosInstance.patch).toHaveBeenCalledWith('/user/password', {
      currentPassword: undefined,
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    });
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        authService: [AuthServiceOptions.WITH_GOOGLE, AuthServiceOptions.WITH_EMAIL_AND_PASSWORD],
      }),
    );
  });

  it('leaves the sign in methods alone when changing an existing password', async () => {
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(screen.getByLabelText('Current Password'), 'old');
    await userEvent.type(newPassword, STRONG_PASSWORD);
    await userEvent.type(confirm, STRONG_PASSWORD);
    await userEvent.click(submit);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(PASSWORD_CHANGED));
    expect(update).not.toHaveBeenCalled();
  });

  it('shows why the change failed', async () => {
    vi.mocked(axiosInstance.patch).mockRejectedValue(refused('current password is incorrect', 401));
    const { newPassword, confirm, submit } = await openForm();

    await userEvent.type(screen.getByLabelText('Current Password'), 'wrong');
    await userEvent.type(newPassword, STRONG_PASSWORD);
    await userEvent.type(confirm, STRONG_PASSWORD);
    await userEvent.click(submit);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('current password is incorrect'));
  });

  it('reveals each password separately', async () => {
    const { newPassword, confirm } = await openForm();

    await userEvent.click(screen.getByRole('button', { name: 'show New Password' }));

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

    expect(axiosInstance.delete).toHaveBeenCalledWith('/user');
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it('stays signed in when deleting fails', async () => {
    vi.mocked(axiosInstance.delete).mockRejectedValue(new Error('500'));
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByPlaceholderText('Type "DELETE" to confirm'), 'DELETE');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
    expect(logout).not.toHaveBeenCalled();
  });
});
