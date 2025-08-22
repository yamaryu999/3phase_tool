class ThreePhaseSimulator {
    constructor() {
        this.frequency = 50; // Hz
        this.amplitude = 220; // V
        this.timeScale = 2;
        this.lineVoltageScale = 2; // 線間電圧の表示スケール
        this.animationSpeed = 0.3; // アニメーション速度（遅めのデフォルト）
        this.time = 0;
        this.animationId = null;
        this.isManualMode = false; // 手動モードフラグ
        this.isDragging = false; // ドラッグ中フラグ
        
        // 相の有効・無効フラグ
        this.rPhaseEnabled = true;
        this.sPhaseEnabled = true;
        this.tPhaseEnabled = true;
        
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.lineVoltageCanvas = document.getElementById('lineVoltageCanvas');
        this.phasorCanvas = document.getElementById('phasorCanvas');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.lineVoltageCtx = this.lineVoltageCanvas.getContext('2d');
        this.phasorCtx = this.phasorCanvas.getContext('2d');
        
        this.setupEventListeners();
        this.startAnimation();
        
        // 初期状態でオーバーレイのpointer-eventsを有効化（自動モード）
        document.getElementById('waveformVoltageOverlay').style.pointerEvents = 'auto';
        document.getElementById('lineVoltageOverlay').style.pointerEvents = 'auto';
    }
    
    setupEventListeners() {
        document.getElementById('frequency').addEventListener('input', (e) => {
            this.frequency = parseInt(e.target.value);
            document.getElementById('frequencyValue').textContent = `${this.frequency} Hz`;
        });
        
        document.getElementById('amplitude').addEventListener('input', (e) => {
            this.amplitude = parseInt(e.target.value);
            document.getElementById('amplitudeValue').textContent = `${this.amplitude} V`;
        });
        
        document.getElementById('timeScale').addEventListener('input', (e) => {
            this.timeScale = parseFloat(e.target.value);
            document.getElementById('timeScaleValue').textContent = `${this.timeScale}x`;
        });
        
        document.getElementById('lineVoltageScale').addEventListener('input', (e) => {
            this.lineVoltageScale = parseFloat(e.target.value);
            document.getElementById('lineVoltageScaleValue').textContent = `${this.lineVoltageScale.toFixed(1)}x`;
        });
        
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            document.getElementById('animationSpeedValue').textContent = `${this.animationSpeed.toFixed(1)}x`;
        });

        // 相の有効・無効イベントリスナー
        document.getElementById('rPhaseEnabled').addEventListener('change', (e) => {
            this.rPhaseEnabled = e.target.checked;
        });
        
        document.getElementById('sPhaseEnabled').addEventListener('change', (e) => {
            this.sPhaseEnabled = e.target.checked;
        });
        
        document.getElementById('tPhaseEnabled').addEventListener('change', (e) => {
            this.tPhaseEnabled = e.target.checked;
        });

        // マウスイベントの設定
        this.setupMouseEvents();
        
        // 手動モードボタンのイベントリスナー
        document.getElementById('manualModeBtn').addEventListener('click', () => {
            this.toggleManualMode();
            const btn = document.getElementById('manualModeBtn');
            const span = btn.querySelector('span');
            if (this.isManualMode) {
                span.textContent = '手動モード: ON';
                btn.classList.add('active');
            } else {
                span.textContent = '手動モード: OFF';
                btn.classList.remove('active');
            }
        });
    }
    
    // 三相電圧の計算
    calculateVoltages(time) {
        const omega = 2 * Math.PI * this.frequency;
        const phaseShift = 2 * Math.PI / 3; // 120度
        
        const rPhase = this.rPhaseEnabled ? this.amplitude * Math.sin(omega * time) : 0;
        const sPhase = this.sPhaseEnabled ? this.amplitude * Math.sin(omega * time - phaseShift) : 0;
        const tPhase = this.tPhaseEnabled ? this.amplitude * Math.sin(omega * time - 2 * phaseShift) : 0;
        
        // 線間電圧の計算
        const rsVoltage = this.rPhaseEnabled && this.sPhaseEnabled ? rPhase - sPhase : 0;
        const stVoltage = this.sPhaseEnabled && this.tPhaseEnabled ? sPhase - tPhase : 0;
        const trVoltage = this.tPhaseEnabled && this.rPhaseEnabled ? tPhase - rPhase : 0;
        
        return {
            rPhase, sPhase, tPhase,
            rsVoltage, stVoltage, trVoltage
        };
    }
    
    // 波形の描画
    drawWaveform() {
        const ctx = this.waveformCtx;
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        // グリッドの描画
        this.drawGrid(ctx, width, height);
        
        // 時間軸の描画
        const timeRange = 2 / this.frequency; // 2周期分
        const timeStep = timeRange / width;
        
        // 各相の波形を描画
        const colors = {
            r: '#ff6b6b',
            s: '#4ecdc4',
            t: '#45b7d1'
        };
        
        ctx.lineWidth = 2;
        
        // R相
        if (this.rPhaseEnabled) {
            ctx.strokeStyle = colors.r;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x * timeStep * this.timeScale;
                const voltage = this.amplitude * Math.sin(2 * Math.PI * this.frequency * t);
                const y = height / 2 - (voltage / this.amplitude) * (height / 2 - 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // S相
        if (this.sPhaseEnabled) {
            ctx.strokeStyle = colors.s;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x * timeStep * this.timeScale;
                const voltage = this.amplitude * Math.sin(2 * Math.PI * this.frequency * t - 2 * Math.PI / 3);
                const y = height / 2 - (voltage / this.amplitude) * (height / 2 - 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // T相
        if (this.tPhaseEnabled) {
            ctx.strokeStyle = colors.t;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x * timeStep * this.timeScale;
                const voltage = this.amplitude * Math.sin(2 * Math.PI * this.frequency * t - 4 * Math.PI / 3);
                const y = height / 2 - (voltage / this.amplitude) * (height / 2 - 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // 現在時刻のマーカー
        const currentX = (this.time % timeRange) / timeRange * width;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // ベクトル図の描画
    drawPhasorDiagram() {
        const ctx = this.phasorCtx;
        const width = this.phasorCanvas.width;
        const height = this.phasorCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        // 中心点
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // 座標軸
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - radius - 20, centerY);
        ctx.lineTo(centerX + radius + 20, centerY);
        ctx.moveTo(centerX, centerY - radius - 20);
        ctx.lineTo(centerX, centerY + radius + 20);
        ctx.stroke();
        
        // 円の描画
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 各相のベクトルを描画
        const colors = {
            r: '#ff6b6b',
            s: '#4ecdc4',
            t: '#45b7d1'
        };
        
        const omega = 2 * Math.PI * this.frequency;
        const phaseShift = 2 * Math.PI / 3;
        
        // R相ベクトル
        if (this.rPhaseEnabled) {
            const rAngle = omega * this.time;
            const rX = centerX + radius * Math.cos(rAngle);
            const rY = centerY - radius * Math.sin(rAngle);
            
            ctx.strokeStyle = colors.r;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(rX, rY);
            ctx.stroke();
        }
        
        // S相ベクトル
        if (this.sPhaseEnabled) {
            const sAngle = omega * this.time - phaseShift;
            const sX = centerX + radius * Math.cos(sAngle);
            const sY = centerY - radius * Math.sin(sAngle);
            
            ctx.strokeStyle = colors.s;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(sX, sY);
            ctx.stroke();
        }
        
        // T相ベクトル
        if (this.tPhaseEnabled) {
            const tAngle = omega * this.time - 2 * phaseShift;
            const tX = centerX + radius * Math.cos(tAngle);
            const tY = centerY - radius * Math.sin(tAngle);
            
            ctx.strokeStyle = colors.t;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(tX, tY);
            ctx.stroke();
        }
        
        // ベクトルの先端に円を描画
        if (this.rPhaseEnabled) {
            const rAngle = omega * this.time;
            const rX = centerX + radius * Math.cos(rAngle);
            const rY = centerY - radius * Math.sin(rAngle);
            ctx.fillStyle = colors.r;
            ctx.beginPath();
            ctx.arc(rX, rY, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        if (this.sPhaseEnabled) {
            const sAngle = omega * this.time - phaseShift;
            const sX = centerX + radius * Math.cos(sAngle);
            const sY = centerY - radius * Math.sin(sAngle);
            ctx.fillStyle = colors.s;
            ctx.beginPath();
            ctx.arc(sX, sY, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        if (this.tPhaseEnabled) {
            const tAngle = omega * this.time - 2 * phaseShift;
            const tX = centerX + radius * Math.cos(tAngle);
            const tY = centerY - radius * Math.sin(tAngle);
            ctx.fillStyle = colors.t;
            ctx.beginPath();
            ctx.arc(tX, tY, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 線間電圧ベクトルの描画（破線）
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        
        // R-S間
        if (this.rPhaseEnabled && this.sPhaseEnabled) {
            const rAngle = omega * this.time;
            const rX = centerX + radius * Math.cos(rAngle);
            const rY = centerY - radius * Math.sin(rAngle);
            const sAngle = omega * this.time - phaseShift;
            const sX = centerX + radius * Math.cos(sAngle);
            const sY = centerY - radius * Math.sin(sAngle);
            
            ctx.beginPath();
            ctx.moveTo(rX, rY);
            ctx.lineTo(sX, sY);
            ctx.stroke();
        }
        
        // S-T間
        if (this.sPhaseEnabled && this.tPhaseEnabled) {
            const sAngle = omega * this.time - phaseShift;
            const sX = centerX + radius * Math.cos(sAngle);
            const sY = centerY - radius * Math.sin(sAngle);
            const tAngle = omega * this.time - 2 * phaseShift;
            const tX = centerX + radius * Math.cos(tAngle);
            const tY = centerY - radius * Math.sin(tAngle);
            
            ctx.beginPath();
            ctx.moveTo(sX, sY);
            ctx.lineTo(tX, tY);
            ctx.stroke();
        }
        
        // T-R間
        if (this.tPhaseEnabled && this.rPhaseEnabled) {
            const tAngle = omega * this.time - 2 * phaseShift;
            const tX = centerX + radius * Math.cos(tAngle);
            const tY = centerY - radius * Math.sin(tAngle);
            const rAngle = omega * this.time;
            const rX = centerX + radius * Math.cos(rAngle);
            const rY = centerY - radius * Math.sin(rAngle);
            
            ctx.beginPath();
            ctx.moveTo(tX, tY);
            ctx.lineTo(rX, rY);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }
    
    // グリッドの描画
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        
        // 縦線
        for (let x = 0; x <= width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 横線
        for (let y = 0; y <= height; y += height / 6) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 中心線
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }
    
    // 電圧値の更新
    updateVoltageDisplay() {
        const voltages = this.calculateVoltages(this.time);
        
        document.getElementById('rVoltage').textContent = `${voltages.rPhase.toFixed(2)} V`;
        document.getElementById('sVoltage').textContent = `${voltages.sPhase.toFixed(2)} V`;
        document.getElementById('tVoltage').textContent = `${voltages.tPhase.toFixed(2)} V`;
        document.getElementById('rsVoltage').textContent = `${voltages.rsVoltage.toFixed(2)} V`;
        document.getElementById('stVoltage').textContent = `${voltages.stVoltage.toFixed(2)} V`;
        document.getElementById('trVoltage').textContent = `${voltages.trVoltage.toFixed(2)} V`;
    }
    
    // マウスイベントの設定
    setupMouseEvents() {
        const canvas = this.waveformCanvas;
        const lineVoltageCanvas = this.lineVoltageCanvas;
        
        // マウスダウン（三相電圧波形）
        canvas.addEventListener('mousedown', (e) => {
            if (!this.isManualMode) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = canvas.width;
            
            // 時間軸マーカー付近をクリックしたかチェック
            const timeRange = 2 / this.frequency;
            const currentX = (this.time % timeRange) / timeRange * width;
            
            if (Math.abs(x - currentX) < 20) { // マーカー付近20px以内
                this.isDragging = true;
                canvas.style.cursor = 'grabbing';
                lineVoltageCanvas.style.cursor = 'grabbing';
            }
        });

        // マウスダウン（線間電圧波形）
        lineVoltageCanvas.addEventListener('mousedown', (e) => {
            if (!this.isManualMode) return;
            
            const rect = lineVoltageCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = lineVoltageCanvas.width;
            
            // 時間軸マーカー付近をクリックしたかチェック
            const timeRange = 2 / this.frequency;
            const currentX = (this.time % timeRange) / timeRange * width;
            
            if (Math.abs(x - currentX) < 20) { // マーカー付近20px以内
                this.isDragging = true;
                canvas.style.cursor = 'grabbing';
                lineVoltageCanvas.style.cursor = 'grabbing';
            }
        });
        
        // マウス移動（三相電圧波形）
        canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = canvas.width;
                
                // 時間を計算
                const timeRange = 2 / this.frequency;
                const normalizedX = Math.max(0, Math.min(1, x / width));
                this.time = normalizedX * timeRange;
                
                canvas.style.cursor = 'grabbing';
                lineVoltageCanvas.style.cursor = 'grabbing';
            } else if (this.isManualMode) {
                // マーカー付近にマウスがあるかチェック
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = canvas.width;
                const timeRange = 2 / this.frequency;
                const currentX = (this.time % timeRange) / timeRange * width;
                
                if (Math.abs(x - currentX) < 20) {
                    canvas.style.cursor = 'grab';
                } else {
                    canvas.style.cursor = 'default';
                }
            }
        });

        // マウス移動（線間電圧波形）
        lineVoltageCanvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = lineVoltageCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = lineVoltageCanvas.width;
                
                // 時間を計算
                const timeRange = 2 / this.frequency;
                const normalizedX = Math.max(0, Math.min(1, x / width));
                this.time = normalizedX * timeRange;
                
                canvas.style.cursor = 'grabbing';
                lineVoltageCanvas.style.cursor = 'grabbing';
            } else if (this.isManualMode) {
                // マーカー付近にマウスがあるかチェック
                const rect = lineVoltageCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = lineVoltageCanvas.width;
                const timeRange = 2 / this.frequency;
                const currentX = (this.time % timeRange) / timeRange * width;
                
                if (Math.abs(x - currentX) < 20) {
                    lineVoltageCanvas.style.cursor = 'grab';
                } else {
                    lineVoltageCanvas.style.cursor = 'default';
                }
            }
        });
        
        // マウスアップ
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.waveformCanvas.style.cursor = 'default';
            this.lineVoltageCanvas.style.cursor = 'default';
        });
        
        // マウスがキャンバスから離れた場合
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.waveformCanvas.style.cursor = 'default';
            this.lineVoltageCanvas.style.cursor = 'default';
        });

        // 線間電圧波形のマウスアップ
        lineVoltageCanvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.waveformCanvas.style.cursor = 'default';
            this.lineVoltageCanvas.style.cursor = 'default';
        });
        
        // 線間電圧波形のマウスリーブ
        lineVoltageCanvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.waveformCanvas.style.cursor = 'default';
            this.lineVoltageCanvas.style.cursor = 'default';
        });
    }
    
    // 手動モードの切り替え
    toggleManualMode() {
        this.isManualMode = !this.isManualMode;
        if (this.isManualMode) {
            console.log('手動モード: マウスで時間軸をドラッグできます');
            this.waveformCanvas.style.cursor = 'grab';
            this.lineVoltageCanvas.style.cursor = 'grab';
            // 手動モード時は速度スライダーを無効化
            document.getElementById('animationSpeed').disabled = true;
            document.getElementById('animationSpeed').style.opacity = '0.5';
            // 手動モード時はオーバーレイのpointer-eventsを無効化
            document.getElementById('waveformVoltageOverlay').style.pointerEvents = 'none';
            document.getElementById('lineVoltageOverlay').style.pointerEvents = 'none';
        } else {
            console.log('自動モード: 時間軸が自動で動きます');
            this.waveformCanvas.style.cursor = 'default';
            this.lineVoltageCanvas.style.cursor = 'default';
            // 自動モード時は速度スライダーを有効化
            document.getElementById('animationSpeed').disabled = false;
            document.getElementById('animationSpeed').style.opacity = '1';
            // 自動モード時はオーバーレイのpointer-eventsを有効化
            document.getElementById('waveformVoltageOverlay').style.pointerEvents = 'auto';
            document.getElementById('lineVoltageOverlay').style.pointerEvents = 'auto';
        }
    }
    
    // 線間電圧波形の描画
    drawLineVoltageWaveform() {
        const ctx = this.lineVoltageCtx;
        const width = this.lineVoltageCanvas.width;
        const height = this.lineVoltageCanvas.height;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        // グリッドの描画
        this.drawGrid(ctx, width, height);
        
        // 時間軸の描画
        const timeRange = 2 / this.frequency; // 2周期分
        const timeStep = timeRange / width;
        
        // 線間電圧の波形を描画
        const colors = {
            rs: '#ff9ff3',
            st: '#54a0ff',
            tr: '#5f27cd'
        };
        
        ctx.lineWidth = 2;
        
        // R-S間電圧
        if (this.rPhaseEnabled && this.sPhaseEnabled) {
            ctx.strokeStyle = colors.rs;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x * timeStep * this.timeScale;
                const rPhase = this.rPhaseEnabled ? this.amplitude * Math.sin(2 * Math.PI * this.frequency * t) : 0;
                const sPhase = this.sPhaseEnabled ? this.amplitude * Math.sin(2 * Math.PI * this.frequency * t - 2 * Math.PI / 3) : 0;
                const rsVoltage = rPhase - sPhase;
                const y = height / 2 - (rsVoltage / (this.amplitude * this.lineVoltageScale)) * (height / 2 - 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // S-T間電圧
        if (this.sPhaseEnabled && this.tPhaseEnabled) {
            ctx.strokeStyle = colors.st;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x * timeStep * this.timeScale;
                const sPhase = this.sPhaseEnabled ? this.amplitude * Math.sin(2 * Math.PI * this.frequency * t - 2 * Math.PI / 3) : 0;
                const tPhase = this.tPhaseEnabled ? this.amplitude * Math.sin(2 * Math.PI * this.frequency * t - 4 * Math.PI / 3) : 0;
                const stVoltage = sPhase - tPhase;
                const y = height / 2 - (stVoltage / (this.amplitude * this.lineVoltageScale)) * (height / 2 - 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // T-R間電圧
        if (this.tPhaseEnabled && this.rPhaseEnabled) {
            ctx.strokeStyle = colors.tr;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x * timeStep * this.timeScale;
                const tPhase = this.tPhaseEnabled ? this.amplitude * Math.sin(2 * Math.PI * this.frequency * t - 4 * Math.PI / 3) : 0;
                const rPhase = this.rPhaseEnabled ? this.amplitude * Math.sin(2 * Math.PI * this.frequency * t) : 0;
                const trVoltage = tPhase - rPhase;
                const y = height / 2 - (trVoltage / (this.amplitude * this.lineVoltageScale)) * (height / 2 - 20);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // 現在時刻のマーカー
        const currentX = (this.time % timeRange) / timeRange * width;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // アニメーションループ
    animate() {
        if (!this.isManualMode) {
            this.time += 0.016 * this.animationSpeed; // アニメーション速度を適用
        }
        this.drawWaveform();
        this.drawLineVoltageWaveform();
        this.drawPhasorDiagram();
        this.updateVoltageDisplay();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // アニメーション開始
    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    }
    
    // アニメーション停止
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// シミュレーターの初期化
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new ThreePhaseSimulator();
    
    // ページを離れる際にアニメーションを停止
    window.addEventListener('beforeunload', () => {
        simulator.stopAnimation();
    });
});
