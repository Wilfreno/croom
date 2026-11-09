export type LocalMediaState =
  | { status: 'off'; stream: null; error: null } // camera and microphone both turned off
  | { status: 'loading'; stream: null; error: null }
  | { status: 'ready'; stream: MediaStream; error: null }
  | { status: 'error'; stream: null; error: string };

export type LocalMediaOptions = {
  cameraDeviceId?: string;
  video?: boolean;
  audio?: boolean;
};

export type LocalMediaContextType = {
  localMedia: LocalMediaState;
  cameras: MediaDeviceInfo[];
  activeCameraId?: string;
  selectCamera: (cameraDeviceId: string) => void;
  isCameraOn: boolean;
  toggleCamera: () => void;
};
