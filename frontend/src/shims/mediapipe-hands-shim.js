// Minimal shim for @mediapipe/hands to satisfy static imports during bundling.
// This provides a named export `Hands`. It is a no-op shim and will not perform
// real hand detection — it's a build-time compatibility shim. Replace with a
// proper shim that loads the real mediapipe runtime at runtime if you need
// full functionality.
export class Hands {
  constructor(options) {
    // store options if needed
    this._opts = options || {};
    console.warn('[mediapipe-hands-shim] Using shimbed Hands. Real mediapipe/hands is not used.');
  }
  setOptions() {}
  onResults() {}
  async initialize() { return; }
  send() { return; }
  close() {}
  reset() {}
}

export default Hands;
