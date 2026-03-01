class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const float32 = input[0];
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = float32[i] * 32767;
    }
    this.port.postMessage({ audio_data: int16.buffer });

    return true;
  }
}

registerProcessor("pcm-processor", PcmProcessor);
