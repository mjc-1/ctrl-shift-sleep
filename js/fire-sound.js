const FireSound = {
    _ctx: null,
    _source: null,
    _filter: null,
    _gain: null,
    _muted: true,
    _started: false,

    _create() {
        if (this._started) return;
        this._started = true;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            const sr = this._ctx.sampleRate;
            const bufLen = sr * 4;
            const buf = this._ctx.createBuffer(1, bufLen, sr);
            const d = buf.getChannelData(0);
            // Pink noise coefficients for a warm fire-like texture
            let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
            for (let i = 0; i < bufLen; i++) {
                const w = Math.random() * 2 - 1;
                b0 = 0.99886*b0 + w*0.0555179;
                b1 = 0.99332*b1 + w*0.0750759;
                b2 = 0.96900*b2 + w*0.1538520;
                b3 = 0.86650*b3 + w*0.3104856;
                b4 = 0.55000*b4 + w*0.5329522;
                b5 = -0.7616*b5 - w*0.0168980;
                d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) / 7;
                b6 = w * 0.115926;
            }

            this._source = this._ctx.createBufferSource();
            this._source.buffer = buf;
            this._source.loop = true;

            this._filter = this._ctx.createBiquadFilter();
            this._filter.type = 'lowpass';
            this._filter.frequency.value = 500;
            this._filter.Q.value = 0.4;

            this._gain = this._ctx.createGain();
            this._gain.gain.value = 0;

            this._source.connect(this._filter);
            this._filter.connect(this._gain);
            this._gain.connect(this._ctx.destination);
            this._source.start();
        } catch(e) {}
    },

    toggle() {
        if (!this._started) this._create();
        this._muted = !this._muted;
        if (this._gain && this._ctx) {
            this._gain.gain.setTargetAtTime(
                this._muted ? 0 : 0.22,
                this._ctx.currentTime, 0.4
            );
        }
        const btn = document.getElementById('fire-sound-btn');
        if (btn) btn.textContent = this._muted ? '🔇' : '🔊';
    },

    init() {
        const btn = document.createElement('button');
        btn.id = 'fire-sound-btn';
        btn.textContent = '🔇';
        btn.title = 'Play fire sound';
        btn.addEventListener('click', e => { e.stopPropagation(); FireSound.toggle(); });
        document.body.appendChild(btn);
    },
};

document.addEventListener('DOMContentLoaded', () => FireSound.init());
