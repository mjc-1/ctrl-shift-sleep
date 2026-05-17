const FireSound = {
    _ctx: null,
    _masterGain: null,
    _muted: false,
    _started: false,

    _create() {
        if (this._started) return;
        this._started = true;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            const sr = this._ctx.sampleRate;

            // --- Rumble buffer: brown noise, 8 sec loop ---
            const rumbleN = sr * 8;
            const rumbleBuf = this._ctx.createBuffer(2, rumbleN, sr);
            for (let ch = 0; ch < 2; ch++) {
                const d = rumbleBuf.getChannelData(ch);
                let b = 0;
                for (let i = 0; i < rumbleN; i++) {
                    b += (Math.random() - 0.5) * 0.025;
                    b = Math.max(-1, Math.min(1, b));
                    // Slow amplitude wavering (fire flicker, ~0.8 Hz)
                    const lfo = 0.82 + 0.18 * Math.sin(2 * Math.PI * 0.8 * i / sr + ch * 1.3);
                    d[i] = b * lfo;
                }
            }

            // --- Crackle buffer: random short impulses, 11 sec loop (coprime with rumble) ---
            const crackleN = sr * 11;
            const crackleBuf = this._ctx.createBuffer(2, crackleN, sr);
            for (let ch = 0; ch < 2; ch++) {
                const d = crackleBuf.getChannelData(ch);
                // Sparse crackle impulses (~70/sec)
                const rate = 70 / sr;
                for (let i = 0; i < crackleN; i++) {
                    if (Math.random() < rate) {
                        const dur   = Math.floor(sr * (0.003 + Math.random() * 0.018));
                        const amp   = 0.2 + Math.random() * 0.55;
                        const decay = 180 + Math.random() * 320;
                        for (let j = 0; j < dur && i + j < crackleN; j++) {
                            d[i + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j * decay / sr);
                        }
                    }
                }
                // Occasional larger pops (~5/sec)
                const popRate = 5 / sr;
                for (let i = 0; i < crackleN; i++) {
                    if (Math.random() < popRate) {
                        const dur   = Math.floor(sr * (0.008 + Math.random() * 0.025));
                        const amp   = 0.6 + Math.random() * 0.4;
                        const decay = 80 + Math.random() * 150;
                        for (let j = 0; j < dur && i + j < crackleN; j++) {
                            d[i + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j * decay / sr);
                        }
                    }
                }
            }

            // --- Routing ---
            const rumbleSrc = this._ctx.createBufferSource();
            rumbleSrc.buffer = rumbleBuf;
            rumbleSrc.loop = true;

            const crackleSrc = this._ctx.createBufferSource();
            crackleSrc.buffer = crackleBuf;
            crackleSrc.loop = true;

            // Rumble → heavy lowpass (deep fire roar)
            const lpf = this._ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 250;
            lpf.Q.value = 0.4;

            const rumbleGain = this._ctx.createGain();
            rumbleGain.gain.value = 0.30;

            // Crackle → gentle highshelf cut (remove harshness)
            const hsc = this._ctx.createBiquadFilter();
            hsc.type = 'highshelf';
            hsc.frequency.value = 4000;
            hsc.gain.value = -6;

            const crackleGain = this._ctx.createGain();
            crackleGain.gain.value = 0.55;

            // Master gain (controls mute)
            this._masterGain = this._ctx.createGain();
            this._masterGain.gain.value = this._muted ? 0 : 1;

            rumbleSrc.connect(lpf);
            lpf.connect(rumbleGain);
            rumbleGain.connect(this._masterGain);

            crackleSrc.connect(hsc);
            hsc.connect(crackleGain);
            crackleGain.connect(this._masterGain);

            this._masterGain.connect(this._ctx.destination);

            rumbleSrc.start();
            crackleSrc.start();
        } catch (e) {}
    },

    toggle() {
        if (!this._started) {
            this._create();
        } else if (this._ctx?.state === 'suspended') {
            this._ctx.resume();
        }
        this._muted = !this._muted;
        if (this._masterGain && this._ctx) {
            this._masterGain.gain.setTargetAtTime(
                this._muted ? 0 : 1,
                this._ctx.currentTime, 0.35
            );
        }
        const btn = document.getElementById('fire-sound-btn');
        if (btn) btn.textContent = this._muted ? '🔇' : '🔊';
    },

    // Soft chime for mini-graph stage feedback
    chime(freq = 528, dur = 0.15, vol = 0.032) {
        if (!this._ctx || this._ctx.state !== 'running' || this._muted) return;
        try {
            const osc  = this._ctx.createOscillator();
            const env  = this._ctx.createGain();
            const now  = this._ctx.currentTime;
            osc.type = 'sine';
            osc.frequency.value = freq;
            env.gain.setValueAtTime(0, now);
            env.gain.linearRampToValueAtTime(vol, now + 0.012);
            env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            osc.connect(env);
            env.connect(this._ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.05);
        } catch (e) {}
    },

    init() {
        const btn = document.createElement('button');
        btn.id = 'fire-sound-btn';
        btn.textContent = '🔊';
        btn.title = 'Toggle fire sound';
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (!FireSound._started) {
                FireSound._create();
                if (FireSound._ctx?.state === 'suspended') FireSound._ctx.resume();
            }
            FireSound.toggle();
        });
        document.body.appendChild(btn);

        // Start audio on first user gesture (browsers require this)
        const onGesture = () => {
            if (!FireSound._started) FireSound._create();
            if (FireSound._ctx?.state === 'suspended') FireSound._ctx.resume();
            document.removeEventListener('click',      onGesture);
            document.removeEventListener('touchstart', onGesture);
        };
        document.addEventListener('click',      onGesture, { once: true });
        document.addEventListener('touchstart', onGesture, { once: true });
    },
};

document.addEventListener('DOMContentLoaded', () => FireSound.init());
