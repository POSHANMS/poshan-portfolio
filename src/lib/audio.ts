export type AmbientAudioController = {
  start: () => Promise<void>;
  stop: () => void;
  setIntensity: (progress: number) => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
};

type ToneModule = typeof import("tone");

export function createAmbientAudio(): AmbientAudioController {
  let tone: ToneModule | null = null;
  let player: InstanceType<ToneModule["Player"]> | null = null;
  let loadingPromise: Promise<unknown> | null = null;
  let lastProgress = 0;

  const ensurePlayer = async () => {
    if (!tone) {
      tone = await import("tone");
    }

    if (!player) {
      player = new tone.Player({
        url: "/audio/ambient.mp3",
        loop: true,
        autostart: false,
        fadeIn: 1,
        fadeOut: 1,
      }).toDestination();
      player.volume.value = -16;
      loadingPromise = player.load("/audio/ambient.mp3");
    }

    return { tone, player };
  };

  return {
    start: async () => {
      const audio = await ensurePlayer();
      await audio.tone.start();
      await loadingPromise;
      if (audio.player.state !== "started") audio.player.start();
    },
    stop: () => {
      if (player?.state === "started") player.stop();
    },
    setIntensity: (progress: number) => {
      lastProgress = Math.max(0, Math.min(progress, 1));
      if (!player) return;
      player.playbackRate = 0.92 + lastProgress * 0.22;
      player.volume.rampTo(-18 + lastProgress * 5, 0.2);
    },
    setMuted: (muted: boolean) => {
      if (!player) return;
      player.volume.rampTo(muted ? -48 : -16 + lastProgress * 4, 0.4);
    },
    dispose: () => {
      player?.dispose();
      player = null;
    },
  };
}
