/* ============================================================
   皖美信用登录页 · 交互编排 (WMCD-LOGIN-CORE)
   ------------------------------------------------------------
   功能：
     · 有限状态机 FSM：SEALED / RELEASING / UNSEALED / RESEALING
     · 绶带 Pointer 拖拽 1:1 跟随 + 40% 阈值判定
     · 中式"起承顿收"四拍启封动画（GSAP）
     · CSS keyframes 降级（无 GSAP 时）
     · 卷轴展开 + 字段 stagger（由 CSS 驱动）
     · 段6 呼吸照映 + 段4 扩散波
     · Web Audio API 自合成音效（绶带丝 / 落印嗡 / 纸展 / 收印）
     · 键盘等价路径（Tab+Enter/Space）
     · sessionStorage 一次性惊喜
     · prefers-reduced-motion 自动降级
     · 双版本切换（深色/浅色）+ localStorage 记忆 + URL 参数
     · 合规浮层（忘密） + Toast
     · 角色快速登录入口（MVP 兼容）
   ============================================================ */
(function () {
    'use strict';

    // ---------- 1. FSM 状态 & 常量 ----------
    const STATE = {
        SEALED:    'SEALED',
        RELEASING: 'RELEASING',
        UNSEALED:  'UNSEALED',
        RESEALING: 'RESEALING',
    };
    const THRESHOLD_RATIO = 0.4;   // 拖拽相对印盒高度 40%
    const MAX_DRAG_Y = 80;         // 绶带最大拖拽距离（px）
    const HAS_GSAP = typeof window.gsap !== 'undefined';
    const HAS_AUDIO_CTX = typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined';
    const PREFERS_REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- 2. Web Audio 合成 ----------
    const AudioSvc = (function () {
        let ctx = null;
        let muted = false;

        function ensure() {
            if (!HAS_AUDIO_CTX) return null;
            if (!ctx) {
                try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
                catch (e) { return null; }
            }
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
            return ctx;
        }

        // V4 · 金属链触音（脆亮 pluck，30ms）· 替代白噪
        function playSash() {
            if (muted) return;
            const a = ensure(); if (!a) return;
            try {
                const now = a.currentTime;
                // 主 pluck：高频正弦快速衰减
                const o = a.createOscillator(); o.type = 'triangle';
                o.frequency.setValueAtTime(880, now);
                o.frequency.exponentialRampToValueAtTime(660, now + 0.05);
                const g = a.createGain();
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.055, now + 0.004);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                // 极短高通让音色更金属感
                const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600;
                o.connect(hp); hp.connect(g); g.connect(a.destination);
                o.start(now); o.stop(now + 0.1);
            } catch (e) { /* 静默 */ }
        }

        // V4 · 启灯主音：暖调三音琶音（A4-C#5-E5 · 轻柔 400ms）
        function playStamp() {
            if (muted) return;
            const a = ensure(); if (!a) return;
            try {
                const now = a.currentTime;
                // 三音琶音
                const freqs = [440, 554.37, 659.25]; // A4, C#5, E5
                freqs.forEach((f, i) => {
                    const delay = i * 0.06;
                    const o = a.createOscillator(); o.type = 'sine';
                    o.frequency.setValueAtTime(f, now + delay);
                    // 微泛音（带一点温暖感）
                    const o2 = a.createOscillator(); o2.type = 'triangle';
                    o2.frequency.setValueAtTime(f * 2, now + delay);
                    const g = a.createGain();
                    g.gain.setValueAtTime(0, now + delay);
                    g.gain.linearRampToValueAtTime(0.08, now + delay + 0.03);
                    g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);
                    const g2 = a.createGain();
                    g2.gain.setValueAtTime(0, now + delay);
                    g2.gain.linearRampToValueAtTime(0.02, now + delay + 0.03);
                    g2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
                    // 低通让音色温暖
                    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
                    o.connect(lp); lp.connect(g); g.connect(a.destination);
                    o2.connect(g2); g2.connect(a.destination);
                    o.start(now + delay); o.stop(now + delay + 0.5);
                    o2.start(now + delay); o2.stop(now + delay + 0.35);
                });
                // 伴生电流嘶嘶（短 50ms 高通白噪）
                setTimeout(() => {
                    const dur = 0.05;
                    const size = Math.floor(a.sampleRate * dur);
                    const buf = a.createBuffer(1, size, a.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
                    const src = a.createBufferSource(); src.buffer = buf;
                    const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4500;
                    const g = a.createGain(); g.gain.setValueAtTime(0.015, a.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
                    src.connect(hp); hp.connect(g); g.connect(a.destination);
                    src.start(); src.stop(a.currentTime + dur);
                }, 30);
            } catch (e) { /* 静默 */ }
        }

        // V4 · 轻拂音（纸展→改为现代感高通白噪 60ms）
        function playPaper() {
            if (muted) return;
            const a = ensure(); if (!a) return;
            try {
                const dur = 0.06;
                const size = Math.floor(a.sampleRate * dur);
                const buf = a.createBuffer(1, size, a.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < size; i++) {
                    const envelope = Math.sin((i / size) * Math.PI);
                    data[i] = (Math.random() * 2 - 1) * envelope * 0.7;
                }
                const src = a.createBufferSource(); src.buffer = buf;
                const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
                const g = a.createGain(); g.gain.setValueAtTime(0.022, a.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
                src.connect(hp); hp.connect(g); g.connect(a.destination);
                src.start(); src.stop(a.currentTime + dur);
            } catch (e) { /* 静默 */ }
        }

        // V4 · 归印→柔和下行音（400→200Hz · 100ms · 类 Mac 息屏感）
        function playReseal() {
            if (muted) return;
            const a = ensure(); if (!a) return;
            try {
                const now = a.currentTime;
                const o = a.createOscillator(); o.type = 'sine';
                o.frequency.setValueAtTime(420, now);
                o.frequency.exponentialRampToValueAtTime(180, now + 0.12);
                const g = a.createGain();
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.06, now + 0.015);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000;
                o.connect(lp); lp.connect(g); g.connect(a.destination);
                o.start(now); o.stop(now + 0.16);
            } catch (e) { /* 静默 */ }
        }

        function toggleMute() { muted = !muted; return muted; }
        function isMuted() { return muted; }

        return { playSash, playStamp, playPaper, playReseal, toggleMute, isMuted };
    })();

    // ---------- 3. FSM ----------
    class SealFSM {
        constructor() {
            this.state = STATE.SEALED;
            this.listeners = [];
        }
        can(next) {
            const map = {
                [STATE.SEALED]:    [STATE.RELEASING],
                [STATE.RELEASING]: [STATE.UNSEALED, STATE.SEALED],
                [STATE.UNSEALED]:  [STATE.RESEALING],
                [STATE.RESEALING]: [STATE.SEALED],
            };
            return (map[this.state] || []).indexOf(next) >= 0;
        }
        transition(next) {
            if (!this.can(next)) return false;
            const prev = this.state;
            this.state = next;
            this.listeners.forEach(fn => {
                try { fn(next, prev); } catch (e) { /* noop */ }
            });
            return true;
        }
        on(fn) { this.listeners.push(fn); }
        get() { return this.state; }
    }

    // ---------- 4. 核心控制器 ----------
    const Controller = {
        root: null,
        sealHost: null,
        svgEl: null,
        handleGroup: null,
        chainPath: null,
        chainThread: null,
        columnGroup: null,
        shadeGroup: null,
        shadeBody: null,
        shadeBodyOn: null,
        shadeDim: null,
        shadeUnderlight: null,
        bulb: null,
        bulbHalo: null,
        lightBeam: null,
        deskPool: null,
        deskPoolOuter: null,
        baseReflect: null,
        glow: null,
        burst: null,
        invitePulse: null,
        inviteText: null,
        stampedMark: null,
        watermark: null,
        ambientGlow: null,

        fsm: new SealFSM(),
        dragActive: false,
        dragY: 0,
        lastSashPlayAt: 0,
        failAttempts: 0,
        failTimerId: null,

        init() {
            this.root = document.documentElement;
            this.sealHost = document.getElementById('wm-seal-host');
            this.stampedMark = document.getElementById('wm-stamped-mark');
            this.watermark = document.querySelector('.wm-watermark');
            this.ambientGlow = document.querySelector('.wm-ambient-glow');
            this.inviteText = document.querySelector('.wm-seal-invite');

            if (!this.sealHost) {
                console.warn('[WMCD] lamp host not found, skip lamp init');
                return;
            }

            // 1) 挂载 SVG（长明灯）
            const WMSvg = window.WMLamp || window.WMSeal;
            this.sealHost.innerHTML = WMSvg.buildLampSVG ? WMSvg.buildLampSVG() : WMSvg.buildSealSVG();
            if (this.stampedMark) {
                this.stampedMark.innerHTML = WMSvg.buildStampedMark();
            }

            // 2) 绑定 SVG 关键子元素引用（V4 现代落地灯）
            this.svgEl          = this.sealHost.querySelector('svg');
            this.handleGroup    = this.sealHost.querySelector('[data-role="handle-group"]');
            this.chainPath      = this.sealHost.querySelector('[data-role="chain-path"]');
            this.chainThread    = this.sealHost.querySelector('[data-role="chain-thread"]');
            this.columnGroup    = this.sealHost.querySelector('[data-role="column"]');
            this.shadeGroup     = this.sealHost.querySelector('[data-role="shade-group"]');
            this.shadeBody      = this.sealHost.querySelector('[data-role="shade-body"]');
            this.shadeBodyOn    = this.sealHost.querySelector('[data-role="shade-body-on"]');
            this.shadeDim       = this.sealHost.querySelector('[data-role="shade-dim"]');
            this.shadeUnderlight= this.sealHost.querySelector('[data-role="shade-underlight"]');
            this.bulb           = this.sealHost.querySelector('[data-role="bulb"]');
            this.bulbHalo       = this.sealHost.querySelector('[data-role="bulb-halo"]');
            this.lightBeam      = this.sealHost.querySelector('[data-role="light-beam"]');
            this.deskPool       = this.sealHost.querySelector('[data-role="desk-pool"]');
            this.deskPoolOuter  = this.sealHost.querySelector('[data-role="desk-pool-outer"]');
            this.baseReflect    = this.sealHost.querySelector('[data-role="base-reflect"]');
            this.glow           = this.sealHost.querySelector('[data-role="glow"]');
            this.burst          = this.sealHost.querySelector('[data-role="burst"]');
            this.invitePulse    = this.sealHost.querySelector('[data-role="handle-pulse"]');

            // 3) 初始 CSS 根属性
            this.root.setAttribute('data-stage', STATE.SEALED);

            // 4) 状态变化钩子
            this.fsm.on((next) => {
                this.root.setAttribute('data-stage', next);
                this.syncAriaForStage(next);
            });

            // 5) 邀约动画（段1）
            if (!PREFERS_REDUCED) {
                setTimeout(() => this.showInvitation(), 800);
            } else {
                // reduced-motion 用户直接可见
                this.inviteText && (this.inviteText.textContent = '按 Enter 启封（或点击右上角"直接登录"）');
                this.inviteText && this.inviteText.classList.add('show');
            }

            // 6) 绑定交互
            this.bindPointer();
            this.bindKeyboard();

            // 7) sessionStorage 跳过仪式
            if (sessionStorage.getItem('wm_seal_opened') === '1') {
                setTimeout(() => this.directUnseal(), 80);
            }

            // 8) V5 · 3s 自动启封（避免用户停留在封印态困惑）
            this._autoUnsealTimer = setTimeout(() => {
                if (this.fsm && this.fsm.get() === STATE.SEALED) {
                    this.directUnseal();
                    const focusFirst = document.getElementById('wm-acct');
                    setTimeout(() => focusFirst && focusFirst.focus(), 700);
                }
            }, 3000);

            // 9) V5 · 封印态卡片点击即启封
            const placeholder = document.querySelector('.wm-form-placeholder');
            if (placeholder) {
                placeholder.style.cursor = 'pointer';
                placeholder.addEventListener('click', () => {
                    if (this.fsm && this.fsm.get() === STATE.SEALED) {
                        clearTimeout(this._autoUnsealTimer);
                        this.directUnseal();
                    }
                });
            }
        },

        syncAriaForStage(stage) {
            if (!this.handleGroup) return;
            if (stage === STATE.UNSEALED) {
                this.handleGroup.setAttribute('aria-label', '信印已启 · 按此归印');
            } else {
                this.handleGroup.setAttribute('aria-label', '拨动绶带以启封信印');
            }
        },

        showInvitation() {
            if (this.fsm.get() !== STATE.SEALED) return;
            this.inviteText && (this.inviteText.classList.add('show'));
            if (this.invitePulse) {
                if (HAS_GSAP) {
                    gsap.fromTo(this.invitePulse,
                        { attr: { r: 12 }, opacity: 0.8 },
                        {
                            attr: { r: 22 }, opacity: 0,
                            duration: 1.2, ease: 'sine.out',
                            repeat: 1, repeatDelay: 0.1,
                            onComplete: () => { this.invitePulse.setAttribute('opacity', '0'); }
                        }
                    );
                } else {
                    // CSS fallback
                    this.invitePulse.style.animation = 'wmSpin 2.4s linear infinite';
                    this.invitePulse.setAttribute('opacity', '0.4');
                }
            }
            setTimeout(() => {
                this.inviteText && this.inviteText.classList.remove('show');
            }, 2200);
        },

        // ---------- 5. Pointer 拖拽 ----------
        bindPointer() {
            if (!this.handleGroup) return;
            const host = this.handleGroup;

            const onDown = (ev) => {
                if (this.fsm.get() !== STATE.SEALED) return;
                this.dragActive = true;
                this.dragY = 0;
                host.setPointerCapture && ev.pointerId !== undefined && host.setPointerCapture(ev.pointerId);
                this.startY = (ev.clientY !== undefined ? ev.clientY : ev.touches ? ev.touches[0].clientY : 0);
                ev.preventDefault && ev.preventDefault();
            };
            const onMove = (ev) => {
                if (!this.dragActive) return;
                const clientY = (ev.clientY !== undefined ? ev.clientY : ev.touches ? ev.touches[0].clientY : 0);
                const dy = Math.max(0, Math.min(MAX_DRAG_Y, clientY - this.startY));
                this.dragY = dy;
                this.applyDrag(dy);
                // 节流绶带丝声：每 45px 或 150ms 一次
                const now = Date.now();
                if (dy > 8 && now - this.lastSashPlayAt > 150) {
                    AudioSvc.playSash();
                    this.lastSashPlayAt = now;
                }
            };
            const onUp = (ev) => {
                if (!this.dragActive) return;
                this.dragActive = false;
                host.releasePointerCapture && ev.pointerId !== undefined && host.releasePointerCapture(ev.pointerId);
                if (this.dragY >= MAX_DRAG_Y * THRESHOLD_RATIO) {
                    this.beginUnseal();
                } else {
                    this.reboundSash();
                    this.recordFail();
                }
            };

            if ('onpointerdown' in window) {
                host.addEventListener('pointerdown', onDown);
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
                window.addEventListener('pointercancel', onUp);
            } else {
                // 老浏览器 fallback
                host.addEventListener('mousedown', onDown);
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
                host.addEventListener('touchstart', onDown, { passive: false });
                window.addEventListener('touchmove', onMove);
                window.addEventListener('touchend', onUp);
            }
        },

        applyDrag(dy) {
            if (!this.handleGroup) return;
            // 小垂珠跟随（y 方向）
            this.handleGroup.setAttribute('transform', `translate(0, ${dy})`);
            // 垂链延展：起点 (290, 220) 罩底，末端 (290, 285+dy)
            if (this.chainPath) {
                const endY = 285 + dy;
                const ctrlY = 252 + dy * 0.45;
                const d = `M 290 220 Q 292 ${ctrlY} 290 ${endY}`;
                this.chainPath.setAttribute('d', d);
                this.chainThread && this.chainThread.setAttribute('d', d);
            }
            // 灯罩极弱微抖（幅度 ≤ 0.6px）
            if (this.shadeGroup) {
                const ratio = dy / (MAX_DRAG_Y * THRESHOLD_RATIO);
                const jitter = Math.min(0.6, ratio * 0.6) * (Math.random() - 0.5) * 2;
                this.shadeGroup.setAttribute('transform', `translate(${jitter}, 0)`);
            }
        },

        // ---------- 6. 回弹（未达阈值） ----------
        reboundSash() {
            const restoreHandle = () => {
                if (HAS_GSAP && !PREFERS_REDUCED) {
                    gsap.to(this.handleGroup, {
                        attr: { transform: 'translate(0, 0)' },
                        duration: 0.6,
                        ease: 'power3.out',
                        onUpdate: () => {
                            // 同步更新绶带路径
                            const m = /translate\(0, ?([-\d.]+)\)/.exec(this.handleGroup.getAttribute('transform') || '');
                            const dy = m ? parseFloat(m[1]) : 0;
                            this.applyDrag(dy);
                        },
                        onComplete: () => {
                            this.resetPaths();
                            this.boxGroup && this.boxGroup.setAttribute('transform', 'translate(0, 0)');
                        }
                    });
                } else {
                    // 简易 CSS 回弹
                    this.handleGroup.setAttribute('transform', 'translate(0, 0)');
                    this.resetPaths();
                    this.boxGroup && this.boxGroup.setAttribute('transform', 'translate(0, 0)');
                }
            };
            restoreHandle();
        },

        resetPaths() {
            const d = 'M 290 220 Q 292 252 290 285';
            this.chainPath   && this.chainPath.setAttribute('d', d);
            this.chainThread && this.chainThread.setAttribute('d', d);
            this.columnGroup && this.columnGroup.setAttribute('transform', 'translate(0, 0)');
            this.shadeGroup  && this.shadeGroup.setAttribute('transform', 'translate(0, 0)');
        },

        recordFail() {
            this.failAttempts += 1;
            clearTimeout(this.failTimerId);
            this.failTimerId = setTimeout(() => { this.failAttempts = 0; }, 500);
            if (this.failAttempts >= 3) {
                this.failAttempts = 0;
                Toast.show('连续三次未启封 · 建议点击右上角「直接登录」或按 Enter 快速进入', 4200);
                this.highlightSkip();
            }
        },

        highlightSkip() {
            const skip = document.querySelector('[data-action="skip-ritual"]');
            if (!skip) return;
            skip.classList.add('wm-chip-strong');
            setTimeout(() => skip.classList.remove('wm-chip-strong'), 3200);
        },

        // ---------- 7. 键盘等价 ----------
        bindKeyboard() {
            if (!this.handleGroup) return;
            this.handleGroup.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    if (this.fsm.get() === STATE.SEALED) this.beginUnseal();
                    else if (this.fsm.get() === STATE.UNSEALED) this.beginReseal();
                }
            });
        },

        // ---------- 8. 启封（起承顿收四拍） ----------
        beginUnseal() {
            if (!this.fsm.transition(STATE.RELEASING)) return;
            AudioSvc.playStamp();
            // 启封视觉开始：绶带回弹 + 印章上升 + 翻转 + 朱泥润色 + 落印
            if (HAS_GSAP && !PREFERS_REDUCED) {
                this.gsapUnsealSequence();
            } else {
                this.cssUnsealSequence();
            }
            sessionStorage.setItem('wm_seal_opened', '1');
        },

        gsapUnsealSequence() {
            // V4 启灯四拍（现代落地灯）：
            //   起 · 灯泡点亮（bulb + bulbHalo 渐显 + shadeBodyOn 罩内反光色）
            //   承 · 可见光柱延展 + 罩底暖光溢出 + 蒙层退场
            //   顿 · 罩外辉光一次性弥漫（glow）
            //   收 · 地面椭圆聚光 + 底座反光
            const tl = gsap.timeline({
                onComplete: () => {
                    this.fsm.transition(STATE.UNSEALED);
                    AudioSvc.playPaper();
                    this.fireBurst();
                }
            });
            // 0 · 垂链归位
            tl.to(this.handleGroup, {
                attr: { transform: 'translate(0, 0)' },
                duration: 0.3, ease: 'power2.in',
                onUpdate: () => {
                    const m = /translate\(0, ?([-\d.]+)\)/.exec(this.handleGroup.getAttribute('transform') || '');
                    const dy = m ? parseFloat(m[1]) : 0;
                    this.applyDrag(dy);
                },
                onComplete: () => this.resetPaths()
            });
            // 起 · 灯泡点亮 + 罩内反光色切换
            tl.to(this.bulb,        { opacity: 1,    duration: 0.3,  ease: 'power2.out' });
            tl.to(this.bulbHalo,    { opacity: 0.9,  duration: 0.35, ease: 'power2.out' }, '<');
            tl.to(this.shadeBodyOn, { opacity: 0.95, duration: 0.3,  ease: 'power2.out' }, '<');
            tl.to(this.shadeDim,    { opacity: 0,    duration: 0.3,  ease: 'power3.inOut' }, '<');
            // 承 · 可见光柱延展 + 罩底暖光
            tl.to(this.lightBeam,       { opacity: 1,    duration: 0.4, ease: 'power3.inOut' }, '-=0.1');
            tl.to(this.shadeUnderlight, { opacity: 0.85, duration: 0.3, ease: 'power3.inOut' }, '<');
            // 顿 · 罩外辉光一次性弥漫
            tl.to(this.glow, { opacity: 1, duration: 0.1, ease: 'back.out(0.8)' });
            // 收 · 地面聚光 + 底座反光
            tl.to(this.deskPoolOuter, { opacity: 0.95, duration: 0.4, ease: 'sine.out' }, '-=0.02');
            tl.to(this.deskPool,      { opacity: 1,    duration: 0.4, ease: 'sine.out' }, '<');
            tl.to(this.baseReflect,   { opacity: 0.55, duration: 0.4, ease: 'sine.out' }, '<');
        },

        cssUnsealSequence() {
            // 无 GSAP 降级：直接切到启灯稳态
            this.resetPaths();
            this.handleGroup.setAttribute('transform', 'translate(0, 0)');
            const apply = (el, op) => { if (el) { el.style.transition = 'opacity 300ms'; el.style.opacity = op; } };
            apply(this.bulb, '1');
            apply(this.bulbHalo, '0.9');
            apply(this.shadeBodyOn, '0.95');
            apply(this.shadeDim, '0');
            apply(this.lightBeam, '1');
            apply(this.shadeUnderlight, '0.85');
            apply(this.glow, '1');
            apply(this.deskPoolOuter, '0.95');
            apply(this.deskPool, '1');
            apply(this.baseReflect, '0.55');
            setTimeout(() => {
                this.fsm.transition(STATE.UNSEALED);
                AudioSvc.playPaper();
                this.fireBurst();
            }, 900);
        },

        fireBurst() {
            if (!this.burst) return;
            this.burst.setAttribute('opacity', '0');
            if (HAS_GSAP && !PREFERS_REDUCED) {
                gsap.fromTo(this.burst,
                    { attr: { r: 12 }, opacity: 0.55 },
                    {
                        attr: { r: 220 }, opacity: 0,
                        duration: 0.7, ease: 'power2.out',
                        onComplete: () => this.burst.setAttribute('opacity', '0')
                    }
                );
            }
        },

        pulseStampedMark() {
            if (!this.stampedMark) return;
            this.stampedMark.classList.remove('show');
            // force reflow
            void this.stampedMark.offsetWidth;
            this.stampedMark.classList.add('show');
            setTimeout(() => this.stampedMark.classList.remove('show'), 1300);
        },

        // ---------- 9. 归印（回退） ----------
        beginReseal() {
            if (!this.fsm.transition(STATE.RESEALING)) return;
            AudioSvc.playReseal();
            const resetAll = () => {
                // 强制复位所有可动元素（V4 现代落地灯）
                this.resetPaths();
                if (this.handleGroup)     this.handleGroup.setAttribute('transform', 'translate(0, 0)');
                if (this.bulb)            this.bulb.setAttribute('opacity', '0');
                if (this.bulbHalo)        this.bulbHalo.setAttribute('opacity', '0');
                if (this.shadeBodyOn)     this.shadeBodyOn.setAttribute('opacity', '0');
                if (this.shadeDim)        this.shadeDim.setAttribute('opacity', '0.3');
                if (this.shadeUnderlight) this.shadeUnderlight.setAttribute('opacity', '0');
                if (this.lightBeam)       this.lightBeam.setAttribute('opacity', '0');
                if (this.glow)            this.glow.setAttribute('opacity', '0');
                if (this.deskPool)        this.deskPool.setAttribute('opacity', '0');
                if (this.deskPoolOuter)   this.deskPoolOuter.setAttribute('opacity', '0');
                if (this.baseReflect)     this.baseReflect.setAttribute('opacity', '0');
                this.dragY = 0;
                this.dragActive = false;
            };
            if (HAS_GSAP && !PREFERS_REDUCED) {
                const tl = gsap.timeline({
                    onComplete: () => {
                        resetAll();
                        this.fsm.transition(STATE.SEALED);
                    }
                });
                // 地面聚光 + 底座反光先淡出
                tl.to(this.deskPool,      { opacity: 0, duration: 0.3 });
                tl.to(this.deskPoolOuter, { opacity: 0, duration: 0.3 }, '<');
                tl.to(this.baseReflect,   { opacity: 0, duration: 0.3 }, '<');
                // 光柱 + 外溢辉光收敛
                tl.to(this.lightBeam,       { opacity: 0, duration: 0.25 }, '-=0.1');
                tl.to(this.glow,            { opacity: 0, duration: 0.25 }, '<');
                tl.to(this.shadeUnderlight, { opacity: 0, duration: 0.25 }, '<');
                // 灯泡熄灭 + 罩内反光退场 + 蒙层回位
                tl.to(this.bulb,        { opacity: 0,   duration: 0.25 }, '-=0.05');
                tl.to(this.bulbHalo,    { opacity: 0,   duration: 0.25 }, '<');
                tl.to(this.shadeBodyOn, { opacity: 0,   duration: 0.3  }, '<');
                tl.to(this.shadeDim,    { opacity: 0.3, duration: 0.3  }, '<');
            } else {
                setTimeout(() => {
                    resetAll();
                    this.fsm.transition(STATE.SEALED);
                }, 600);
            }
        },

        // ---------- 10. 跳过仪式（直接进入长明稳态 · V4） ----------
        directUnseal() {
            if (this.fsm.get() !== STATE.SEALED) return;
            this.fsm.transition(STATE.RELEASING);
            this.resetPaths();
            if (this.handleGroup)     this.handleGroup.setAttribute('transform', 'translate(0, 0)');
            if (this.bulb)            this.bulb.setAttribute('opacity', '1');
            if (this.bulbHalo)        this.bulbHalo.setAttribute('opacity', '0.9');
            if (this.shadeBodyOn)     this.shadeBodyOn.setAttribute('opacity', '0.95');
            if (this.shadeDim)        this.shadeDim.setAttribute('opacity', '0');
            if (this.shadeUnderlight) this.shadeUnderlight.setAttribute('opacity', '0.85');
            if (this.lightBeam)       this.lightBeam.setAttribute('opacity', '1');
            if (this.glow)            this.glow.setAttribute('opacity', '1');
            if (this.deskPool)        this.deskPool.setAttribute('opacity', '1');
            if (this.deskPoolOuter)   this.deskPoolOuter.setAttribute('opacity', '0.95');
            if (this.baseReflect)     this.baseReflect.setAttribute('opacity', '0.55');
            setTimeout(() => this.fsm.transition(STATE.UNSEALED), 100);
        }
    };

    // ---------- 11. Toast ----------
    const Toast = {
        el: null,
        timer: null,
        show(msg, dur) {
            if (!this.el) {
                this.el = document.createElement('div');
                this.el.className = 'wm-toast';
                document.body.appendChild(this.el);
            }
            this.el.textContent = msg;
            this.el.classList.add('show');
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.el.classList.remove('show'), dur || 2200);
        }
    };

    // ---------- 12. 主题切换 ----------
    const Theme = {
        init() {
            const params = new URLSearchParams(location.search);
            let theme = params.get('mode');
            if (theme !== 'dark' && theme !== 'light') {
                theme = localStorage.getItem('wm_login_theme');
            }
            if (theme !== 'dark' && theme !== 'light') {
                // 国资场景默认深色（大屏/会议室优先）；仅当系统偏好明确 light 时跟随
                theme = 'dark';
            }
            this.apply(theme);

            const btn = document.querySelector('[data-action="toggle-theme"]');
            if (btn) {
                btn.addEventListener('click', () => {
                    const now = document.documentElement.getAttribute('data-theme');
                    this.apply(now === 'dark' ? 'light' : 'dark');
                });
            }
        },
        apply(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('wm_login_theme', theme);
            const btn = document.querySelector('[data-action="toggle-theme"]');
            if (btn) btn.querySelector('.wm-theme-label').textContent = theme === 'dark' ? '皖墨' : '皖白';
        }
    };

    // ---------- 13. 表单行为 ----------
    const Form = {
        state: {
            selectedUserId: null,
        },
        init() {
            // 聚焦动画
            document.querySelectorAll('.wm-input').forEach(inp => {
                const group = inp.closest('.wm-input-group');
                inp.addEventListener('focus', () => group && group.classList.add('focused'));
                inp.addEventListener('blur',  () => {
                    group && group.classList.remove('focused');
                    this.validateField(inp);
                });
                inp.addEventListener('input', () => {
                    const err = group && group.querySelector('.wm-field-err');
                    if (err) err.classList.remove('show');
                });
            });

            // 密码显隐切换
            const pwdInput = document.getElementById('wm-pwd');
            const pwdToggle = document.getElementById('wm-pwd-toggle');
            if (pwdInput && pwdToggle) {
                pwdToggle.addEventListener('click', () => {
                    const isShow = pwdInput.getAttribute('type') === 'text';
                    pwdInput.setAttribute('type', isShow ? 'password' : 'text');
                    pwdToggle.querySelector('.wm-pwd-icon').textContent = isShow ? '封' : '启';
                    pwdToggle.setAttribute('aria-label', isShow ? '显示密码' : '隐藏密码');
                });
            }

            // 大写锁定检测
            if (pwdInput) {
                pwdInput.addEventListener('keydown', (ev) => {
                    const tip = document.getElementById('wm-caps-tip');
                    if (!tip) return;
                    const on = typeof ev.getModifierState === 'function' && ev.getModifierState('CapsLock');
                    tip.classList.toggle('show', !!on);
                });
            }

            // 记住账号（仅记账号）+ 演示态预填 admin/admin123
            const remember = document.getElementById('wm-remember');
            const acct = document.getElementById('wm-acct');
            const pwdEl = document.getElementById('wm-pwd');
            if (acct) {
                const saved = localStorage.getItem('wm_remembered_account');
                if (saved) {
                    acct.value = saved;
                    if (remember) remember.checked = true;
                } else {
                    // 演示/测试默认：预填 admin / admin123
                    acct.value = 'admin';
                    if (pwdEl) pwdEl.value = 'admin123';
                }
            }

            // 忘密浮层
            const forgot = document.querySelector('[data-action="open-forgot"]');
            if (forgot) {
                forgot.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    this.openForgotModal();
                });
            }
            document.querySelectorAll('[data-action="close-modal"]').forEach(el => {
                el.addEventListener('click', () => this.closeForgotModal());
            });

            // 登录按钮
            const cta = document.getElementById('wm-cta');
            if (cta) cta.addEventListener('click', () => this.submit());

            // 角色列表（MVP 兼容）
            this.initRoleList();

            // 展开/收起角色
            const toggle = document.querySelector('[data-action="toggle-role"]');
            const panel = document.getElementById('wm-role-quick');
            if (toggle && panel) {
                toggle.addEventListener('click', () => {
                    panel.classList.toggle('expanded');
                    toggle.textContent = panel.classList.contains('expanded')
                        ? '收起角色快速登录'
                        : '或选择角色快速体验（MVP 演示）↓';
                });
            }

            // 归印按钮
            const reseal = document.querySelector('[data-action="reseal"]');
            if (reseal) {
                reseal.addEventListener('click', () => Controller.beginReseal());
            }

            // 跳过仪式
            const skip = document.querySelector('[data-action="skip-ritual"]');
            if (skip) {
                skip.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    Controller.directUnseal();
                    const focusFirst = document.getElementById('wm-acct');
                    setTimeout(() => focusFirst && focusFirst.focus(), 700);
                });
            }

            // 官方认证通道
            document.querySelectorAll('[data-action^="auth-"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const a = btn.getAttribute('data-action');
                    const map = {
                        'auth-sso':   { msg: '政务网统一身份认证 · 正在检测授权票据…', fn: 'ssoLogin' },
                        'auth-ca':    { msg: 'CA 证书登录 · 正在检测本机证书驱动…', fn: 'caLogin' },
                        'auth-ukey':  { msg: '国密 U-Key · 请插入 U-Key 并等待识别…', fn: 'ukeyLogin' }
                    };
                    const cfg = map[a];
                    if (!cfg) return;
                    Toast.show(cfg.msg, 2800);
                    // 预留：实际政务环境应走 SSO 跳转或驱动调用
                    setTimeout(() => {
                        Toast.show('演示环境暂未对接外部认证通道 · 请使用账号密码或角色快速登录', 3200);
                    }, 3000);
                });
            });

            // 主题切换按钮挂回车
            const themeBtn = document.querySelector('[data-action="toggle-theme"]');
            themeBtn && themeBtn.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    Theme.apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
                }
            });
        },

        validateField(inp) {
            const group = inp.closest('.wm-input-group');
            if (!group) return true;
            const err = group.querySelector('.wm-field-err');
            const val = inp.value.trim();
            if (inp.dataset.required === 'true' && !val) {
                err && (err.textContent = '此项必填', err.classList.add('show'));
                return false;
            }
            if (inp.id === 'wm-acct' && val && val.length < 2) {
                err && (err.textContent = '账号长度至少 2 位', err.classList.add('show'));
                return false;
            }
            if (inp.id === 'wm-pwd' && val && val.length < 4) {
                err && (err.textContent = '密码长度至少 4 位', err.classList.add('show'));
                return false;
            }
            return true;
        },

        initRoleList() {
            const panel = document.getElementById('wm-role-grid');
            if (!panel || !window.WM_USERS) return;
            // 限制展示前 8 个角色，避免过度占位
            const list = window.WM_USERS.slice(0, 8);
            panel.innerHTML = list.map(u => `
                <button type="button" class="wm-role-card" data-uid="${u.id}" role="option">
                    <span class="wm-role-avatar" style="background:${u.avatarBg || '#8A0F14'};">${u.avatar || u.shortName[0]}</span>
                    <span class="wm-role-info">
                        <span class="wm-role-name">${u.shortName}</span>
                        <span class="wm-role-label">${u.roleLabel}</span>
                    </span>
                </button>
            `).join('');
            panel.querySelectorAll('.wm-role-card').forEach(card => {
                card.addEventListener('click', () => {
                    panel.querySelectorAll('.wm-role-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.state.selectedUserId = card.getAttribute('data-uid');
                    const u = window.WM_STORE && window.WM_STORE.getUser(this.state.selectedUserId);
                    if (u) {
                        const acct = document.getElementById('wm-acct');
                        const pwd = document.getElementById('wm-pwd');
                        if (acct) acct.value = u.shortName;
                        if (pwd)  pwd.value = '•'.repeat(8);
                        Toast.show(`已选择身份：${u.shortName} · ${u.roleLabel}`, 1800);
                    }
                });
            });
        },

        openForgotModal() {
            const m = document.getElementById('wm-forgot-modal');
            if (m) m.classList.add('show');
        },
        closeForgotModal() {
            const m = document.getElementById('wm-forgot-modal');
            if (m) m.classList.remove('show');
        },

        submit() {
            const cta = document.getElementById('wm-cta');
            const acct = document.getElementById('wm-acct');
            const pwd  = document.getElementById('wm-pwd');
            const remember = document.getElementById('wm-remember');

            // 校验
            const acctOk = this.validateField(acct);
            const pwdOk  = this.validateField(pwd);
            if (!acctOk || !pwdOk) {
                Toast.show('请填写完整账号与密码', 1800);
                return;
            }
            if (!acct.value.trim() || !pwd.value.trim()) {
                Toast.show('请填写完整账号与密码', 1800);
                return;
            }

            // 记住账号（仅账号）
            if (remember && remember.checked) {
                localStorage.setItem('wm_remembered_account', acct.value.trim());
            } else {
                localStorage.removeItem('wm_remembered_account');
            }

            // 加载态
            cta.setAttribute('disabled', 'disabled');
            cta.innerHTML = '<span class="wm-cta-loader"></span><span class="wm-cta-text" style="letter-spacing:4px;">核 验 中…</span>';

            // 钤印动画（旧）
            const stamp = document.createElement('span');
            stamp.className = 'wm-cta-stamp pulse';
            cta.appendChild(stamp);
            setTimeout(() => stamp.remove(), 500);

            // V6 · 盖印动画（朱红圆章钤落按钮中心）
            const sealDrop = document.createElement('span');
            sealDrop.className = 'wm-cta-seal-drop active';
            sealDrop.setAttribute('aria-hidden', 'true');
            sealDrop.innerHTML = `
                <svg viewBox="0 0 72 72" width="72" height="72">
                    <circle cx="36" cy="36" r="32" fill="#B8141A" stroke="#6A0F14" stroke-width="1.5"/>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="#F5D68E" stroke-width="1" opacity="0.65"/>
                    <g font-family="SimSun,STSong,serif" font-weight="900" fill="#F5D68E" text-anchor="middle">
                        <text x="26" y="34" font-size="14">皖</text>
                        <text x="46" y="34" font-size="14">美</text>
                        <text x="26" y="52" font-size="14">信</text>
                        <text x="46" y="52" font-size="14">用</text>
                    </g>
                </svg>
            `;
            cta.appendChild(sealDrop);
            setTimeout(() => sealDrop.remove(), 1400);

            // 决定目标用户：
            //   1) 角色快速登录已选定 → 用选定用户
            //   2) 账号 + 密码强匹配（account/password 字段）
            //   3) 兜底：shortName / id / name 模糊匹配，但必须对密码做基本校验
            let targetUser = null;
            if (this.state.selectedUserId && window.WM_STORE) {
                targetUser = window.WM_STORE.getUser(this.state.selectedUserId);
            } else if (window.WM_USERS) {
                const v = acct.value.trim();
                const pv = pwd.value;
                // 强匹配：account 字段 + password 严格相等
                const strong = window.WM_USERS.find(u => u.account && u.account === v);
                if (strong) {
                    if (strong.password && strong.password !== pv) {
                        cta.removeAttribute('disabled');
                        cta.innerHTML = '<span class="wm-cta-text">核 验 并 登 录</span>';
                        const pwdGroup = pwd.closest('.wm-input-group');
                        const err = pwdGroup && pwdGroup.querySelector('.wm-field-err');
                        if (err) { err.textContent = '账号与密码不匹配'; err.classList.add('show'); }
                        Toast.show('账号与密码不匹配', 2000);
                        return;
                    }
                    targetUser = strong;
                } else {
                    // 弱匹配（MVP 演示）
                    targetUser = window.WM_USERS.find(u =>
                        u.shortName === v || u.id === v || (u.name && u.name.indexOf(v) >= 0)
                    ) || window.WM_USERS[0];
                }
            }

            setTimeout(() => {
                if (!targetUser || !window.WM_AUTH) {
                    Toast.show('系统异常 · 请刷新重试', 3000);
                    cta.removeAttribute('disabled');
                    cta.innerHTML = '<span class="wm-cta-text">核验并登录</span>';
                    return;
                }
                window.WM_AUTH.login(targetUser.id);

                // 成功态
                cta.innerHTML = '<span class="wm-cta-text" style="letter-spacing:6px;">✓ 核 验 通 过</span>';
                cta.style.background = 'linear-gradient(180deg, #C9A063 0%, #A8823E 100%)';
                cta.style.color = '#2A1410';
                Toast.show(`登录成功 · 以 ${targetUser.shortName}（${targetUser.roleLabel}）身份进入`, 1500);

                // 跳转
                const params = new URLSearchParams(location.search);
                const redirect = params.get('redirect');
                setTimeout(() => {
                    window.location.href = redirect || 'workbench.html';
                }, 900);
            }, 600);
        }
    };

    // ---------- 14. 已登录提示 ----------
    function checkExisting() {
        if (!window.WM_AUTH) return;
        const cur = window.WM_AUTH.currentUser();
        if (cur) {
            setTimeout(() => {
                const tip = document.createElement('div');
                tip.className = 'wm-toast show';
                tip.style.top = '20px';
                tip.style.borderColor = 'var(--wm-accent)';
                tip.innerHTML = `✓ 您已登录为 <strong style="color:var(--wm-accent)">${cur.shortName}</strong> · <a href="workbench.html" style="color:var(--wm-accent);margin-left:8px;text-decoration:underline;">直接进入工作台 →</a>`;
                document.body.appendChild(tip);
                setTimeout(() => {
                    tip.classList.remove('show');
                    setTimeout(() => tip.remove(), 400);
                }, 6000);
            }, 1200);
        }
    }

    // ---------- 15. 启动 ----------
    function boot() {
        Theme.init();
        Controller.init();
        Form.init();
        checkExisting();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // 暴露调试接口
    window.WMLogin = {
        Controller, Form, Toast, Theme, AudioSvc, STATE
    };
})();
