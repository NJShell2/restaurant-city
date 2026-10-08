/* Restaurant City rebuild - tiny WebAudio sound effects. */
let __rcAudio = null;
function rc_sfx(name) {
  try {
    const s = window.__rcGame;
    if (s && s.sound === false) return;
    __rcAudio = __rcAudio || new (window.AudioContext || window.webkitAudioContext)();
    const ac = __rcAudio;
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    const now = ac.currentTime;
    if (name === 'coin') { o.frequency.setValueAtTime(880, now); o.frequency.setValueAtTime(1320, now + 0.08); }
    else if (name === 'place') { o.frequency.setValueAtTime(440, now); o.frequency.setValueAtTime(560, now + 0.06); }
    else { o.frequency.setValueAtTime(520, now); }
    o.type = 'triangle';
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o.start(now); o.stop(now + 0.2);
  } catch (e) { /* audio is decorative */ }
}
