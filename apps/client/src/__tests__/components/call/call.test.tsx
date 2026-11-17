import { mockStream, mockTrack } from '@/__tests__/mocks/mock-media';
import { mockSession } from '@/__tests__/mocks/mock-entities';
import CallPage from '@/app/(call)/call/[id]/page';
import ChatButton from '@/components/page/call/ChatButton';
import ChatPanel from '@/components/page/call/ChatPanel';
import Controls from '@/components/page/call/Controls';
import IncomingCallToast from '@/components/page/call/IncomingCallToast';
import ParticipantsButton from '@/components/page/call/ParticipantsButton';
import ParticipantsPanel from '@/components/page/call/ParticipantsPanel';
import RemoteParticipants from '@/components/page/call/RemoteParticipants';
import CurrentUserCam from '@/components/page/call/camera/CurrentUserCam';
import OpenCamera from '@/components/page/call/camera/OpenCamera';
import SelectCamera from '@/components/page/call/camera/SelectCamera';
import SelectMicrophone from '@/components/page/call/microphone/SelectMicrophone';
import CallSidePanelProvider from '@/components/providers/CallSidePanelProvider';
import PinnedParticipantsProvider from '@/components/providers/PinnedParticipantsProvider';
import type { CallContextType, CallParticipant, LocalMediaContextType } from '@/types/call.types';
import { CALL_MAX_VISIBLE_TILES, CALL_PINNED_SIDE_MAX_TILES } from '@repo/constants';
import type { CallMember, Conversation, MessagePayload, UserSession } from '@repo/types';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/* ---------- shared, mutable context the mocked hooks read ---------- */

let call: CallContextType;
let localMedia: LocalMediaContextType;
let sessionUser: UserSession | null;
let participantsState: {
  status: CallContextType['status'];
  error: string | null;
  participants: CallParticipant[];
  members: Map<string, CallMember>;
};
let isSelfInGrid = false;

vi.mock('@/components/providers/CallProvider', () => ({
  useCall: () => call,
  default: ({ conversationId, children }: { conversationId: string; children: React.ReactNode }) => (
    <div data-testid="call-provider" data-conversation={conversationId}>
      {children}
    </div>
  ),
}));
vi.mock('@/components/providers/LocalMediaProvider', () => ({
  useLocalMedia: () => localMedia,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="local-media-provider">{children}</div>,
}));
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));
vi.mock('@/components/hooks/useCallParticipants', () => ({
  default: () => participantsState,
  useIsSelfInGrid: () => isSelfInGrid,
  useSelfParticipant: () => ({
    participant: {
      peerId: 'self',
      userId: sessionUser?.id ?? 'self',
      audioTrack: null,
      videoTrack: null,
      isAudioPaused: !localMedia.isMicOn,
      isVideoPaused: !localMedia.isCameraOn,
    },
    member: { id: 'self', displayName: 'You', photoUrl: null },
  }),
}));
vi.mock('sonner', () => ({ toast: { dismiss: vi.fn() } }));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));
vi.mock('@/components/providers/SocketIOProvider', () => ({ useSocketIO: () => socket }));
vi.mock('@/components/hooks/queries/useConversation', () => ({ default: () => ({ data: conversation }) }));
vi.mock('@/components/page/main/conversation/ConversationMessages', () => ({
  default: () => <div data-testid="conversation-messages" />,
}));
vi.mock('@/components/page/main/conversation/ConversationMessageInput', () => ({
  default: () => <div data-testid="conversation-message-input" />,
}));

let conversation: Partial<Conversation> | undefined;
let messageHandlers = new Set<(message: MessagePayload) => void>();
const socket = {
  on: (_event: string, handler: (message: MessagePayload) => void) => messageHandlers.add(handler),
  off: (_event: string, handler: (message: MessagePayload) => void) => messageHandlers.delete(handler),
};

function receiveMessage({
  conversationId = 'c1',
  senderId = 'someone-else',
  notice = null,
}: { conversationId?: string; senderId?: string; notice?: MessagePayload['notice'] } = {}) {
  const message = { conversation: { id: conversationId }, sender: { id: senderId }, notice } as MessagePayload;
  act(() => {
    for (const handler of messageHandlers) handler(message);
  });
}

beforeAll(() => {
  // jsdom has no WebRTC; the tiles only wrap tracks in a stream for <video>/<audio>.
  vi.stubGlobal(
    'MediaStream',
    class {
      constructor(public tracks: MediaStreamTrack[]) {}
    },
  );
});

function member(id: string, displayName: string): CallMember {
  return { id, displayName, photoUrl: null };
}

function participant(userId: string, overrides: Partial<CallParticipant> = {}): CallParticipant {
  return {
    peerId: `peer-${userId}`,
    userId,
    audioTrack: null,
    videoTrack: mockTrack('video'),
    isAudioPaused: false,
    isVideoPaused: false,
    ...overrides,
  };
}

function renderWithParticipantsPanel(ui: React.ReactNode) {
  return render(
    <CallSidePanelProvider>
      <PinnedParticipantsProvider>
        {ui}
        <ParticipantsPanel />
      </PinnedParticipantsProvider>
    </CallSidePanelProvider>,
  );
}

/** N connected participants named "Person 1".."Person N". */
function connectedWith(count: number) {
  const participants = Array.from({ length: count }, (_, i) => participant(`u${i + 1}`));
  participantsState = {
    status: 'connected',
    error: null,
    participants,
    members: new Map(participants.map((p, i) => [p.userId, member(p.userId, `Person ${i + 1}`)])),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  call = {
    status: 'connected',
    error: null,
    members: new Map(),
    participants: [],
    leave: vi.fn(),
  };
  localMedia = {
    localMedia: { status: 'ready', stream: mockStream(), error: null },
    cameras: [],
    activeCameraId: undefined,
    selectCamera: vi.fn(),
    microphones: [],
    activeMicrophoneId: undefined,
    selectMicrophone: vi.fn(),
    isCameraOn: true,
    toggleCamera: vi.fn(),
    isMicOn: true,
    toggleMic: vi.fn(),
  };
  sessionUser = mockSession({ displayName: 'Me' });
  conversation = undefined;
  participantsState = { status: 'connected', error: null, participants: [], members: new Map() };
  isSelfInGrid = false;
});

/* ---------- tests ---------- */

describe('Controls', () => {
  it('mutes and unmutes the microphone', async () => {
    const { rerender } = render(<Controls />);

    await userEvent.click(screen.getByRole('button', { name: 'Mute microphone' }));
    expect(localMedia.toggleMic).toHaveBeenCalledOnce();

    localMedia.isMicOn = false;
    rerender(<Controls />);
    expect(screen.getByRole('button', { name: 'Unmute microphone' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('names each control in a tooltip on hover', async () => {
    render(<Controls />);

    await userEvent.hover(screen.getByRole('button', { name: 'Leave call' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Leave call');
  });

  it('leaves the call', async () => {
    render(<Controls />);

    await userEvent.click(screen.getByRole('button', { name: 'Leave call' }));

    expect(call.leave).toHaveBeenCalledOnce();
  });

  it('includes the microphone and camera controls', () => {
    render(<Controls />);

    expect(screen.getByRole('button', { name: 'Choose microphone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn camera off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose camera' })).toBeInTheDocument();
  });
});

describe('OpenCamera', () => {
  it('turns the camera off and shows it as pressed once off', async () => {
    const { rerender } = render(<OpenCamera />);

    await userEvent.click(screen.getByRole('button', { name: 'Turn camera off' }));
    expect(localMedia.toggleCamera).toHaveBeenCalledOnce();

    localMedia.isCameraOn = false;
    rerender(<OpenCamera />);
    expect(screen.getByRole('button', { name: 'Turn camera on' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SelectCamera', () => {
  it('says when there are no cameras', async () => {
    render(<SelectCamera />);

    await userEvent.click(screen.getByRole('button', { name: 'Choose camera' }));

    expect(await screen.findByText('No cameras found')).toBeInTheDocument();
  });

  it('lists the cameras, marks the active one and switches on pick', async () => {
    localMedia.cameras = [
      { deviceId: 'cam-1', label: 'Front' } as MediaDeviceInfo,
      { deviceId: 'cam-2', label: '' } as MediaDeviceInfo,
    ];
    localMedia.activeCameraId = 'cam-1';
    render(<SelectCamera />);

    await userEvent.click(screen.getByRole('button', { name: 'Choose camera' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Front' })).toHaveAttribute('aria-checked', 'true');
    const unnamed = screen.getByRole('menuitemradio', { name: 'Camera 2' });
    await userEvent.click(unnamed);
    expect(localMedia.selectCamera).toHaveBeenCalledWith('cam-2');
  });
});

describe('SelectMicrophone', () => {
  it('says when there are no microphones', async () => {
    render(<SelectMicrophone />);

    await userEvent.click(screen.getByRole('button', { name: 'Choose microphone' }));

    expect(await screen.findByText('No microphones found')).toBeInTheDocument();
  });

  it('lists the microphones, marks the active one and switches on pick', async () => {
    localMedia.microphones = [
      { deviceId: 'mic-1', label: 'Headset' } as MediaDeviceInfo,
      { deviceId: 'mic-2', label: '' } as MediaDeviceInfo,
    ];
    localMedia.activeMicrophoneId = 'mic-1';
    render(<SelectMicrophone />);

    await userEvent.click(screen.getByRole('button', { name: 'Choose microphone' }));

    expect(await screen.findByRole('menuitemradio', { name: 'Headset' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Microphone 2' }));
    expect(localMedia.selectMicrophone).toHaveBeenCalledWith('mic-2');
  });
});

describe('IncomingCallToast', () => {
  const incoming = { conversationId: 'c1', caller: { id: 'u', displayName: 'Bob', photoUrl: null } };

  it('says who is calling', () => {
    render(<IncomingCallToast call={incoming} toastId="t" onAccept={vi.fn()} />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('is calling you…')).toBeInTheDocument();
  });

  it('dismisses without answering on decline', async () => {
    const onAccept = vi.fn();
    render(<IncomingCallToast call={incoming} toastId="t" onAccept={onAccept} />);

    await userEvent.click(screen.getByRole('button', { name: 'Decline call' }));

    expect(toast.dismiss).toHaveBeenCalledWith('t');
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('dismisses and answers on accept', async () => {
    const onAccept = vi.fn();
    render(<IncomingCallToast call={incoming} toastId="t" onAccept={onAccept} />);

    await userEvent.click(screen.getByRole('button', { name: 'Accept call' }));

    expect(toast.dismiss).toHaveBeenCalledWith('t');
    expect(onAccept).toHaveBeenCalledOnce();
  });
});

describe('ParticipantsButton and ParticipantsPanel', () => {
  it('shows nothing until the button is pressed', () => {
    renderWithParticipantsPanel(<ParticipantsButton />);

    expect(screen.getByRole('button', { name: 'Show 1 person' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('complementary', { name: 'People in the call' })).not.toBeInTheDocument();
  });

  it('counts you plus everyone else and lists you first', async () => {
    connectedWith(2);
    participantsState.participants[1] = { ...participantsState.participants[1], videoTrack: null, isAudioPaused: true };
    localMedia.isMicOn = false;
    renderWithParticipantsPanel(<ParticipantsButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Show 3 people' }));

    const panel = screen.getByRole('complementary', { name: 'People in the call' });
    expect(within(panel).getByText('3 people')).toBeInTheDocument();
    const items = within(panel).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['MEMe (You)', 'P1Person 1', 'P2Person 2']);
    expect(within(items[0]).getByLabelText('Muted')).toBeInTheDocument();
    expect(within(items[0]).queryByLabelText('Camera off')).not.toBeInTheDocument();
    expect(within(items[1]).queryByLabelText('Muted')).not.toBeInTheDocument();
    expect(within(items[2]).getByLabelText('Camera off')).toBeInTheDocument();
    expect(within(items[2]).getByLabelText('Muted')).toBeInTheDocument();
  });

  it('hides the panel from the button or its close button', async () => {
    renderWithParticipantsPanel(<ParticipantsButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Show 1 person' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide 1 person' }));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'People in the call' })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Show 1 person' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close people in the call' }));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'People in the call' })).not.toBeInTheDocument());
  });

  it('shows nicknames under the names of the people who have one', async () => {
    connectedWith(2);
    conversation = {
      id: 'c1',
      nicknames: [
        { user: sessionUser?.id ?? '', value: 'Captain' },
        { user: 'u2', value: 'Shorty' },
      ],
    } as Partial<Conversation>;
    renderWithParticipantsPanel(<ParticipantsButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Show 3 people' }));

    const items = within(screen.getByRole('complementary', { name: 'People in the call' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['MEMe (You)Captain', 'P1Person 1', 'P2Person 2Shorty']);
  });

  it('names someone who is not a known member "Unknown"', async () => {
    participantsState.participants = [participant('stranger')];
    renderWithParticipantsPanel(<ParticipantsButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Show 2 people' }));

    expect(within(screen.getByRole('complementary')).getByText('Unknown')).toBeInTheDocument();
  });

  it('falls back to "You" without a session', async () => {
    sessionUser = null;
    renderWithParticipantsPanel(<ParticipantsButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Show 1 person' }));

    expect(within(screen.getByRole('complementary')).getByRole('listitem')).toHaveTextContent('You (You)');
  });
});

describe('ChatButton and ChatPanel', () => {
  function renderWithSidePanels() {
    return render(
      <CallSidePanelProvider>
        <ChatButton />
        <ParticipantsButton />
        <ParticipantsPanel />
        <ChatPanel />
      </CallSidePanelProvider>,
    );
  }

  beforeEach(() => {
    messageHandlers = new Set();
    conversation = { id: 'c1', name: 'Weekend trip', members: [], nicknames: [] };
  });

  it("titles the chat with the conversation's name", async () => {
    renderWithSidePanels();

    await userEvent.click(screen.getByRole('button', { name: 'Show chat' }));

    expect(within(screen.getByRole('complementary', { name: 'Chat' })).getByRole('heading')).toHaveTextContent(
      'Weekend trip',
    );
  });

  it('titles the chat "Chat" while the conversation is loading', async () => {
    conversation = undefined;
    renderWithSidePanels();

    await userEvent.click(screen.getByRole('button', { name: 'Show chat' }));

    expect(within(screen.getByRole('complementary', { name: 'Chat' })).getByRole('heading')).toHaveTextContent('Chat');
  });

  it('opens and closes the chat from the button or its close button', async () => {
    renderWithSidePanels();
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Chat' })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Show chat' }));
    const panel = screen.getByRole('complementary', { name: 'Chat' });
    expect(within(panel).getByTestId('conversation-messages')).toBeInTheDocument();
    expect(within(panel).getByTestId('conversation-message-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide chat' })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Hide chat' }));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Chat' })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Show chat' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Chat' })).not.toBeInTheDocument());
  });

  it('shows one side panel at a time', async () => {
    renderWithSidePanels();

    await userEvent.click(screen.getByRole('button', { name: 'Show 1 person' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show chat' }));
    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'People in the call' })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Show 1 person' }));
    expect(screen.getByRole('complementary', { name: 'People in the call' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Chat' })).not.toBeInTheDocument());
  });

  it('counts messages from others in this call while the chat is closed', async () => {
    renderWithSidePanels();

    receiveMessage();
    receiveMessage();
    receiveMessage({ senderId: sessionUser?.id });
    receiveMessage({ conversationId: 'other' });
    receiveMessage({ notice: { user: 'someone-else' } as MessagePayload['notice'] });

    await userEvent.click(screen.getByRole('button', { name: 'Show chat, 2 unread messages' }));
    receiveMessage();
    expect(screen.getByRole('button', { name: 'Hide chat' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Hide chat' }));
    expect(screen.getByRole('button', { name: 'Show chat' })).toBeInTheDocument();
    receiveMessage();
    expect(screen.getByRole('button', { name: 'Show chat, 1 unread message' })).toHaveTextContent('1');
  });
});

describe('RemoteParticipants', () => {
  it('adds nicknames in parentheses to the tile names', () => {
    connectedWith(2);
    isSelfInGrid = true;
    conversation = {
      id: 'c1',
      nicknames: [
        { user: sessionUser?.id ?? '', value: 'Captain' },
        { user: 'u1', value: 'Shorty' },
      ],
    } as Partial<Conversation>;

    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('You').parentElement).toHaveTextContent(/^You\(Captain\)$/);
    expect(screen.getByText('Person 1').parentElement).toHaveTextContent(/^Person 1\(Shorty\)$/);
    expect(screen.getByText('Person 2').parentElement).toHaveTextContent(/^Person 2$/);
    expect(screen.getByText('Shorty')).toHaveClass('truncate');
    expect(screen.getByText('Person 1')).toHaveClass('truncate');
  });

  it('says it is joining while connecting', () => {
    participantsState.status = 'connecting';

    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('Joining the call…')).toBeInTheDocument();
  });

  it('shows the error when the call failed', () => {
    participantsState = { ...participantsState, status: 'error', error: 'conversation not found' };

    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('conversation not found')).toBeInTheDocument();
  });

  it('shows a generic error when none was given', () => {
    participantsState = { ...participantsState, status: 'error', error: null };

    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('Could not join the call')).toBeInTheDocument();
  });

  it('waits for others when nobody else is there', () => {
    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('Waiting for others to join…')).toBeInTheDocument();
  });

  it('shows a tile per participant with their name and mute state', () => {
    connectedWith(2);
    participantsState.participants[0].isAudioPaused = true;

    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.getByText('Person 2')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Muted')).toHaveLength(1);
  });

  it('shows an avatar instead of video for a camera that is off', () => {
    connectedWith(1);
    participantsState.participants[0].isVideoPaused = true;

    const { container } = renderWithParticipantsPanel(<RemoteParticipants />);

    expect(container.querySelector('video')).toHaveClass('hidden');
  });

  it('plays everyone’s audio, kept apart from the tiles', () => {
    connectedWith(3);

    const { container } = renderWithParticipantsPanel(<RemoteParticipants />);

    expect(container.querySelectorAll('audio')).toHaveLength(3);
  });

  it('adds your own tile to the grid in bigger calls', () => {
    connectedWith(2);
    isSelfInGrid = true;

    renderWithParticipantsPanel(<RemoteParticipants />);

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('summarises everyone past the tile limit in one overflow tile', async () => {
    const count = CALL_MAX_VISIBLE_TILES + 3;
    connectedWith(count);

    const { container } = renderWithParticipantsPanel(<RemoteParticipants />);

    // The last visible tile becomes the overflow tile, so 4 people are folded into it.
    const overflow = screen.getByRole('button', { name: 'Show 4 others in the call' });
    expect(container.querySelectorAll('video')).toHaveLength(CALL_MAX_VISIBLE_TILES - 1);
    expect(container.querySelectorAll('audio')).toHaveLength(count);

    await userEvent.click(overflow);
    const panel = screen.getByRole('complementary', { name: 'People in the call' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(count + 1);
  });

  it('leaves room for your own tile when counting the overflow', () => {
    connectedWith(CALL_MAX_VISIBLE_TILES);
    isSelfInGrid = true;

    renderWithParticipantsPanel(<RemoteParticipants />);

    // 12 tiles: you + 10 people + one tile for the remaining 2.
    expect(screen.getByRole('button', { name: 'Show 2 others in the call' })).toBeInTheDocument();
  });
});

describe('Pinning participants', () => {
  async function openPanel() {
    await userEvent.click(screen.getByRole('button', { name: /^Show \d+ (people|person)$/ }));
    return screen.getByRole('complementary', { name: 'People in the call' });
  }

  it('offers a pin button for everyone but you', async () => {
    connectedWith(2);
    renderWithParticipantsPanel(<ParticipantsButton />);

    const panel = await openPanel();

    const [you, first, second] = within(panel).getAllByRole('listitem');
    expect(within(you).queryByRole('button', { name: /Pin/ })).not.toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'Pin Person 1' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(second).getByRole('button', { name: 'Pin Person 2' })).toBeInTheDocument();
  });

  it('moves pinned people to the main area and everyone else to a strip, until unpinned', async () => {
    connectedWith(3);
    isSelfInGrid = true;
    renderWithParticipantsPanel(
      <>
        <ParticipantsButton />
        <RemoteParticipants />
      </>,
    );
    const panel = await openPanel();

    await userEvent.click(within(panel).getByRole('button', { name: 'Pin Person 2' }));

    expect(within(panel).getByRole('button', { name: 'Unpin Person 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Pinned').parentElement).toHaveTextContent('Person 2');
    const strip = screen.getByRole('list', { name: 'Other people in the call' });
    expect(within(strip).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'MEYou',
      'Person 1',
      'Person 3',
    ]);

    await userEvent.click(within(panel).getByRole('button', { name: 'Unpin Person 2' }));

    expect(screen.queryByLabelText('Pinned')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Other people in the call' })).not.toBeInTheDocument();
  });

  it('pins one person at a time, the new pin replacing the old one', async () => {
    connectedWith(3);
    renderWithParticipantsPanel(
      <>
        <ParticipantsButton />
        <RemoteParticipants />
      </>,
    );
    const panel = await openPanel();

    await userEvent.click(within(panel).getByRole('button', { name: 'Pin Person 1' }));
    await userEvent.click(within(panel).getByRole('button', { name: 'Pin Person 3' }));

    expect(within(panel).getByRole('button', { name: 'Pin Person 1' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(panel).getByRole('button', { name: 'Unpin Person 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByLabelText('Pinned')).toHaveLength(1);
    expect(screen.getByLabelText('Pinned').parentElement).toHaveTextContent('Person 3');
    const strip = screen.getByRole('list', { name: 'Other people in the call' });
    expect(within(strip).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Person 1', 'Person 2']);
  });
});

describe('Pinned layout side column', () => {
  function renderCallWithPanel() {
    return renderWithParticipantsPanel(
      <>
        <ParticipantsButton />
        <RemoteParticipants />
      </>,
    );
  }

  async function pin(name: string) {
    await userEvent.click(screen.getByRole('button', { name: /^Show \d+ (people|person)$/ }));
    await userEvent.click(screen.getByRole('button', { name: `Pin ${name}` }));
  }

  it(`shows everyone when they fit in ${CALL_PINNED_SIDE_MAX_TILES} tiles`, async () => {
    connectedWith(CALL_PINNED_SIDE_MAX_TILES);
    isSelfInGrid = true;
    renderCallWithPanel();

    await pin('Person 1');

    const side = screen.getByRole('list', { name: 'Other people in the call' });
    expect(within(side).getAllByRole('listitem')).toHaveLength(CALL_PINNED_SIDE_MAX_TILES);
    expect(within(side).queryByRole('button', { name: /others? in the call/ })).not.toBeInTheDocument();
  });

  it('turns the last tile into a count of everyone left over, which opens the panel', async () => {
    connectedWith(CALL_PINNED_SIDE_MAX_TILES + 3);
    isSelfInGrid = true;
    renderCallWithPanel();

    await pin('Person 1');
    await userEvent.click(screen.getByRole('button', { name: 'Close people in the call' }));

    const side = screen.getByRole('list', { name: 'Other people in the call' });
    const tiles = within(side).getAllByRole('listitem');
    expect(tiles).toHaveLength(CALL_PINNED_SIDE_MAX_TILES);
    expect(tiles[0]).toHaveTextContent('You');
    const remaining = within(side).getByRole('button', { name: 'Show 4 others in the call' });
    expect(remaining).toHaveTextContent('+4');

    await userEvent.click(remaining);

    expect(screen.getByRole('complementary', { name: 'People in the call' })).toBeInTheDocument();
  });
});

describe('CurrentUserCam', () => {
  it('shows your camera mirrored in a floating tile', () => {
    const { container } = render(<CurrentUserCam />);

    const video = container.querySelector('video')!;
    expect(video).not.toHaveClass('hidden');
    expect(video).toHaveClass('-scale-x-100');
    expect(video.srcObject).toBe(localMedia.localMedia.stream);
    expect(screen.getByLabelText('Resize camera')).toBeInTheDocument();
  });

  it('says when the camera is off', () => {
    localMedia.isCameraOn = false;

    render(<CurrentUserCam />);

    expect(screen.getByText('Camera is off')).toBeInTheDocument();
  });

  it('says when the camera is starting', () => {
    localMedia.localMedia = { status: 'loading', stream: null, error: null };

    render(<CurrentUserCam />);

    expect(screen.getByText('Starting camera…')).toBeInTheDocument();
  });

  it('shows why the camera could not start', () => {
    localMedia.localMedia = { status: 'error', stream: null, error: 'Camera access was blocked' };

    render(<CurrentUserCam />);

    expect(screen.getByText('Camera access was blocked')).toBeInTheDocument();
  });

  it('is hidden once your camera moves into the grid', () => {
    isSelfInGrid = true;

    const { container } = render(<CurrentUserCam />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('CallPage', () => {
  it('joins the call for the conversation in the URL inside the media providers', async () => {
    render(await CallPage({ params: Promise.resolve({ id: 'c1' }) }));

    const provider = screen.getByTestId('call-provider');
    expect(provider).toHaveAttribute('data-conversation', 'c1');
    expect(screen.getByTestId('local-media-provider')).toContainElement(provider);
    expect(within(provider).getByRole('button', { name: 'Leave call' })).toBeInTheDocument();
    expect(within(provider).getByRole('button', { name: 'Show 1 person' })).toBeInTheDocument();
    expect(within(provider).getByRole('button', { name: 'Show chat' })).toBeInTheDocument();
  });
});
