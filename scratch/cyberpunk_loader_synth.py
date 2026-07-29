"""
═══════════════════════════════════════════════════════════════════════════
  CYBERPUNK LOADER AUDIO SYNTHESIZER
  ─────────────────────────────────────────────────────────────────────────
  Generates a cinematic 12-second peak-level audio track for the
  "Poshan MS" portfolio loader. 

  FEATURES:
  • 32Hz FM sub-bass with void rumble
  • Detuned sawtooth cyberpunk drone with filter sweep
  • Pink-noise matrix rain (gated digital texture)
  • Cardiac lub-dub heartbeat pulses
  • Heavy 808 impact kicks with sidechain pumping
  • Metallic FM "neon slash" transients
  • Quantum wave frequency sweeps
  • Dimensional breach climax:
      – Void implosion (60Hz→15Hz pitch dive)
      – Shockwave bandpassed noise
      – Crystal bell (440Hz + harmonics, 4s tail)
      – Sub rumble (28Hz physical thump)
      – Dimensional slash (9kHz→800Hz FM sweep)
  • Power surge glitch spikes
  • Telemetry data chirps
  • Convolution reverb + stereo width + mastering limiter

  OUTPUT: 48kHz / 32-bit float (or 16-bit int fallback) stereo WAV
═══════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import math
import os

try:
    from scipy.signal import butter, lfilter, fftconvolve
    from scipy.io import wavfile
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    import wave

SAMPLE_RATE = 48000
DURATION = 12.0
N = int(SAMPLE_RATE * DURATION)
t = np.linspace(0, DURATION, N)

def db_to_lin(db): 
    return 10.0 ** (db / 20.0)

def lowpass(signal, cutoff, order=2):
    if not HAS_SCIPY:
        out = np.zeros_like(signal)
        rc = 1.0 / (2.0 * np.pi * max(cutoff, 1.0))
        alpha = (1.0 / SAMPLE_RATE) / (rc + 1.0 / SAMPLE_RATE)
        out[0] = signal[0]
        for i in range(1, len(signal)):
            out[i] = out[i-1] + alpha * (signal[i] - out[i-1])
        return out
    nyq = SAMPLE_RATE / 2.0
    b, a = butter(order, max(0.01, cutoff / nyq), btype='low')
    return lfilter(b, a, signal)

def highpass(signal, cutoff, order=2):
    if not HAS_SCIPY:
        return signal - lowpass(signal, cutoff)
    nyq = SAMPLE_RATE / 2.0
    b, a = butter(order, max(0.01, cutoff / nyq), btype='high')
    return lfilter(b, a, signal)

def bandpass(signal, low, high, order=2):
    if not HAS_SCIPY:
        return highpass(lowpass(signal, high), low)
    nyq = SAMPLE_RATE / 2.0
    b, a = butter(order, [max(0.01, low/nyq), min(0.99, high/nyq)], btype='band')
    return lfilter(b, a, signal)

def pink_noise(n_samples):
    white = np.fft.rfft(np.random.randn(n_samples))
    freqs = np.fft.rfftfreq(n_samples, 1.0 / SAMPLE_RATE)
    freqs[0] = 1.0
    return np.fft.irfft(white / np.sqrt(freqs), n=n_samples)

def stereo_pan(signal, pan):
    angle = (pan + 1.0) * np.pi / 4.0
    return signal * np.cos(angle) * np.sqrt(2.0), signal * np.sin(angle) * np.sqrt(2.0)

def make_kick(start_time, amp=1.0):
    n = int(SAMPLE_RATE * 0.18)
    t_local = np.arange(n) / SAMPLE_RATE
    freq = 150.0 * np.exp(-t_local * 32.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    click = np.exp(-t_local * 250.0) * 0.3
    env = np.exp(-t_local * 16.0)
    sig = (np.sin(phase) + click) * env * amp
    idx = int(start_time * SAMPLE_RATE)
    return idx, min(n, N - idx), sig

def make_heartbeat(start_time, amp=0.5):
    n = int(SAMPLE_RATE * 0.45)
    sig = np.zeros(n)
    t1 = np.arange(int(0.13 * SAMPLE_RATE)) / SAMPLE_RATE
    f1 = 95.0 * np.exp(-t1 * 28.0)
    p1 = 2.0 * np.pi * np.cumsum(f1) / SAMPLE_RATE
    sig[:len(t1)] += np.sin(p1) * np.exp(-t1 * 22.0) * amp
    t2 = np.arange(int(0.11 * SAMPLE_RATE)) / SAMPLE_RATE
    f2 = 78.0 * np.exp(-t2 * 26.0)
    p2 = 2.0 * np.pi * np.cumsum(f2) / SAMPLE_RATE
    off = int(0.19 * SAMPLE_RATE)
    end = min(off + len(t2), n)
    sig[off:end] += np.sin(p2[:end-off]) * np.exp(-t2[:end-off] * 20.0) * amp * 0.65
    idx = int(start_time * SAMPLE_RATE)
    return idx, min(n, N - idx), sig

def make_sub_bass():
    lfo = np.sin(2.0 * np.pi * 0.4 * t)
    freq = 32.0 + 2.5 * lfo
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    sig = np.sin(phase)
    fade = np.ones(N)
    fade[:int(0.6*SAMPLE_RATE)] = np.linspace(0, 1, int(0.6*SAMPLE_RATE))
    return sig * fade * (0.55 + np.exp(-((t - 8.0)**2) * 1.8) * 0.6)

def make_cyber_drone():
    saw = lambda f, p: ((2.0 * np.pi * f * t + p) % (2.0 * np.pi)) / np.pi - 1.0
    drone = (saw(65.4, 0) * 1.0 + saw(98.0, 0.7) * 0.65 + saw(65.4*1.008, 2.1) * 0.45) / 2.1
    brightness = np.interp(t, [0, 2, 5, 8, 10, 12], [0.05, 0.15, 0.55, 1.0, 0.25, 0.1])
    harm = highpass(drone**3, 600)
    return (drone * (1.0 - brightness) + harm * brightness * 2.5) * 0.22

def make_matrix_rain():
    noise = pink_noise(N)
    gate = np.zeros(N)
    block = int(SAMPLE_RATE * 0.005)
    for i in range(0, N, block):
        if np.random.rand() < 0.07:
            end = min(i + block * 3, N)
            gate[i:end] = np.exp(-np.arange(end - i) / (SAMPLE_RATE * 0.008))
    return highpass(noise * gate, 1800) * 0.35

def make_slash(start_time, pan=0.0, amp=0.85):
    n = int(SAMPLE_RATE * 0.09)
    t_local = np.arange(n) / SAMPLE_RATE
    cf = 4200.0 * np.exp(-t_local * 12.0)
    mf = 850.0 * np.exp(-t_local * 18.0)
    mi = 9.0 * np.exp(-t_local * 30.0)
    cp = 2.0 * np.pi * np.cumsum(cf) / SAMPLE_RATE
    mp = 2.0 * np.pi * np.cumsum(mf) / SAMPLE_RATE
    fm = np.sin(cp + mi * np.sin(mp))
    noise = np.random.randn(n) * np.exp(-t_local * 45.0)
    sig = highpass((fm * 0.65 + noise * 0.35) * amp, 1500)
    idx = int(start_time * SAMPLE_RATE)
    l, r = stereo_pan(sig, pan)
    return idx, min(n, N - idx), l, r

def make_whoosh(start_time, amp=0.6, pan=0.0):
    n = int(SAMPLE_RATE * 0.4)
    t_local = np.arange(n) / SAMPLE_RATE
    freq = 350.0 * (35.0 / 350.0) ** (t_local / 0.4)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-t_local * 3.5) * (1.0 - t_local / 0.4) ** 0.5
    sig = bandpass((np.sin(phase) * 0.7 + np.random.randn(n) * 0.5) * env * amp, 80, 2500)
    idx = int(start_time * SAMPLE_RATE)
    l, r = stereo_pan(sig, pan)
    return idx, min(n, N - idx), l, r

def make_breach():
    sig = np.zeros(N)
    idx0 = int(8.0 * SAMPLE_RATE)

    # Void implosion
    n = int(1.6 * SAMPLE_RATE)
    t_loc = np.arange(n) / SAMPLE_RATE
    freq = 60.0 * np.exp(-t_loc * 3.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    sig[idx0:idx0+n] += np.sin(phase) * np.exp(-t_loc * 1.4) * 0.95

    # Shockwave
    n = int(1.3 * SAMPLE_RATE)
    t_loc = np.arange(n) / SAMPLE_RATE
    sig[idx0:idx0+n] += bandpass(np.random.randn(n) * np.exp(-t_loc * 2.8) * 0.85, 300, 2500)[:min(n, N-idx0)]

    # Crystal bell
    t_bell = t - 8.2
    bell = np.zeros(N)
    for fb, ab in [(440, 0.38), (880, 0.24), (1320, 0.14), (1760, 0.08)]:
        pb = 2.0 * np.pi * fb * t_bell + 2.0 * np.pi * np.cumsum(np.sin(2.0*np.pi*5.5*t_bell)*2.0) / SAMPLE_RATE
        bell += np.sin(pb) * np.exp(-t_bell * 0.75) * (t_bell > 0) * ab
    sig += bell

    # Sub rumble
    tr = t - 8.0
    sig += (np.sin(2.0*np.pi*28.0*t) + 0.5*np.sin(2.0*np.pi*56.0*t)) * np.exp(-tr * 0.55) * (tr > 0) * 0.75

    # Dimensional slash
    n = int(0.18 * SAMPLE_RATE)
    t_loc = np.arange(n) / SAMPLE_RATE
    freq = 9000.0 * (800.0 / 9000.0) ** (t_loc / 0.18)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-t_loc * 18.0)
    mi = 12.0 * env
    mod = mi * np.sin(2.0 * np.pi * np.cumsum(1500.0 * np.exp(-t_loc * 10.0)) / SAMPLE_RATE)
    ds = np.sin(phase + mod) * env * 1.1 + np.random.randn(n) * env * 0.35
    sig[idx0:idx0+n] += highpass(ds, 2500)[:min(n, N-idx0)]
    return sig

def make_power_surges():
    sig = np.zeros(N)
    for _ in range(12):
        st = np.random.uniform(5.5, 7.8)
        n = int(np.random.uniform(0.02, 0.06) * SAMPLE_RATE)
        idx = int(st * SAMPLE_RATE)
        if idx + n < N:
            spike = np.random.randn(n) * np.exp(-np.arange(n) / (SAMPLE_RATE * 0.015))
            sig[idx:idx+n] += bandpass(spike, 2000, 8000) * 0.4
    return sig

def make_data_chirps():
    sig = np.zeros(N)
    for ct in [2.5, 3.2, 3.9, 4.6, 5.3, 6.5, 7.1]:
        n = int(0.03 * SAMPLE_RATE)
        idx = int(ct * SAMPLE_RATE)
        if idx + n < N:
            t_loc = np.arange(n) / SAMPLE_RATE
            freq = 2000.0 + np.random.rand() * 3000.0
            sig[idx:idx+n] += np.sin(2.0 * np.pi * freq * t_loc) * np.exp(-t_loc * 60.0) * 0.15
    return sig

def make_reverb_ir(duration=2.5):
    n = int(SAMPLE_RATE * duration)
    ir = np.random.randn(n) * np.exp(-np.linspace(0, 7, n))
    return highpass(lowpass(ir, 5000), 60) / np.max(np.abs(ir))

def apply_reverb(signal, ir, wet=0.3):
    if HAS_SCIPY:
        rev = fftconvolve(signal, ir, mode='full')[:len(signal)]
    else:
        rev = np.convolve(signal, ir, mode='full')[:len(signal)]
    return signal + rev * wet

# ─── MAIN BUILD ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mix_l = np.zeros(N)
    mix_r = np.zeros(N)

    sub = make_sub_bass()
    mix_l += sub * 0.85; mix_r += sub * 0.85

    drone = make_cyber_drone()
    mix_l += drone * 0.95; mix_r += drone * 1.05

    rain = make_matrix_rain()
    mix_l += rain * 0.9; mix_r += rain * 1.1

    for hb_t in [0.8, 2.1, 3.4, 4.7, 6.0, 7.3, 8.6, 10.0]:
        idx, n, sig = make_heartbeat(hb_t, 0.42)
        if idx < N:
            mix_l[idx:idx+n] += sig[:n]
            mix_r[idx:idx+n] += sig[:n]

    for k_t, k_a in zip([2.0, 4.0, 6.0, 7.5, 8.0], [0.6, 0.6, 0.6, 0.8, 1.3]):
        idx, n, sig = make_kick(k_t, k_a)
        if idx < N:
            mix_l[idx:idx+n] += sig[:n]
            mix_r[idx:idx+n] += sig[:n]

    for s_t, s_p, s_a in [(5.2, -0.85, 0.75), (6.1, 0.85, 0.8), (6.8, -0.4, 0.7), 
                           (7.4, 0.6, 0.85), (8.0, 0.0, 1.0), (8.15, -0.7, 0.6)]:
        idx, n, l_sig, r_sig = make_slash(s_t, s_p, s_a)
        if idx < N:
            mix_l[idx:idx+n] += l_sig[:n]
            mix_r[idx:idx+n] += r_sig[:n]

    for w_t, w_a, w_p in [(4.0, 0.55, -0.5), (5.5, 0.5, 0.6), (7.0, 0.65, -0.3), (8.5, 0.45, 0.4)]:
        idx, n, l_sig, r_sig = make_whoosh(w_t, w_a, w_p)
        if idx < N:
            mix_l[idx:idx+n] += l_sig[:n]
            mix_r[idx:idx+n] += r_sig[:n]

    breach = make_breach()
    mix_l += breach * 0.98; mix_r += breach * 0.98

    surges = make_power_surges()
    mix_l += surges * 0.8; mix_r += surges * 0.8

    chirps = make_data_chirps()
    mix_l += chirps * 0.85; mix_r += chirps * 1.15

    # Sidechain
    sc_env = np.ones(N)
    for k_t in [2.0, 4.0, 6.0, 7.5, 8.0]:
        idx = int(k_t * SAMPLE_RATE)
        if idx < N:
            sc_env[idx:] = np.minimum(sc_env[idx:], np.exp(-np.arange(N-idx) / (SAMPLE_RATE * 0.12)))
    mix_l -= drone * (1.0 - sc_env) * 0.35
    mix_r -= drone * (1.0 - sc_env) * 0.35
    mix_l -= rain * (1.0 - sc_env) * 0.2
    mix_r -= rain * (1.0 - sc_env) * 0.2

    # Stutter
    stutter_mask = np.ones(N)
    for _ in range(20):
        g_start = np.random.uniform(6.0, 8.0)
        g_n = int(np.random.uniform(0.008, 0.025) * SAMPLE_RATE)
        g_idx = int(g_start * SAMPLE_RATE)
        if g_idx + g_n < N:
            stutter_mask[g_idx:g_idx+g_n] = 0.08
    mix_l *= stutter_mask; mix_r *= stutter_mask

    # Reverb
    ir = make_reverb_ir(2.5)
    mix_l = apply_reverb(mix_l, ir, 0.28)
    mix_r = apply_reverb(mix_r, ir, 0.28)

    # Stereo width
    mid = (mix_l + mix_r) / 2.0
    side = (mix_l - mix_r) / 2.0
    if HAS_SCIPY:
        side = lowpass(side, 800) + highpass(side, 800) * 1.5
    mix_l = mid + side
    mix_r = mid - side

    # Master
    mix_l = np.tanh(np.tanh(mix_l * 1.3) * 0.7 + mix_l * 0.3) * 1.15
    mix_r = np.tanh(np.tanh(mix_r * 1.3) * 0.7 + mix_r * 0.3) * 1.15
    peak = max(np.max(np.abs(mix_l)), np.max(np.abs(mix_r)))
    if peak > 0:
        mix_l *= db_to_lin(-0.3) / peak
        mix_r *= db_to_lin(-0.3) / peak

    out_path = "loader_breach_audio.wav"
    if HAS_SCIPY:
        wavfile.write(out_path, SAMPLE_RATE, np.stack([mix_l, mix_r], axis=1).astype(np.float32))
    else:
        frames = np.clip(np.stack([mix_l, mix_r], axis=1), -1.0, 1.0)
        frames_int = (frames * 32767.0).astype(np.int16)
        with wave.open(out_path, 'w') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SAMPLE_RATE)
            w.writeframes(frames_int.tobytes())
    print(f"[DONE] Exported: {out_path}")
