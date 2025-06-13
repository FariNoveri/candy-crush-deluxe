class CandyCrushGame {
    constructor() {
        this.gridSize = 8;
        this.candyTypes = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝'];
        this.grid = [];
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.target = 1000;
        this.selectedCell = null;
        this.gameActive = true;
        this.isDragging = false;
        this.dragStartCell = null;
        this.comboCount = 0;
        this.particleCleanupQueue = [];
        this.movedCandyPositions = [];
        this.newCandyPositions = [];
        this.sounds = {
            combo2x: new Audio('assets/music/combo_2x.mp3'),
            combo3x: new Audio('assets/music/combo_3x.mp3'),
            combo4x: new Audio('assets/music/combo_4x.mp3'),
            comboMax: new Audio('assets/music/combo_max.mp3')
        };
        this.initializeGrid();
        this.renderGrid();
        this.updateUI();
        this.setupDragEvents();
        this.setupSounds();
    }

    setupSounds() {
        Object.values(this.sounds).forEach(sound => {
            sound.preload = 'auto';
            sound.volume = 0.7;
            sound.addEventListener('error', (e) => {
                console.warn('Could not load sound:', e.target.src);
            });
            sound.load();
        });
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                do {
                    this.grid[row][col] = this.getRandomCandy();
                } while (this.hasInitialMatches(row, col));
            }
        }
    }

    getRandomCandy() {
        return this.candyTypes[Math.floor(Math.random() * this.candyTypes.length)];
    }

    hasInitialMatches(row, col) {
        const candy = this.grid[row][col];
        if (col >= 2 &&
            this.grid[row][col - 1] === candy &&
            this.grid[row][col - 2] === candy) {
            return true;
        }
        if (row >= 2 &&
            this.grid[row - 1][col] === candy &&
            this.grid[row - 2][col] === candy) {
            return true;
        }
        return false;
    }

    playComboSound(comboCount) {
        try {
            let soundToPlay;
            if (comboCount === 2) {
                soundToPlay = this.sounds.combo2x;
            } else if (comboCount === 3) {
                soundToPlay = this.sounds.combo3x;
            } else if (comboCount === 4) {
                soundToPlay = this.sounds.combo4x;
            } else if (comboCount >= 5) {
                soundToPlay = this.sounds.comboMax;
            }
            if (soundToPlay) {
                soundToPlay.currentTime = 0;
                soundToPlay.play().catch(e => {
                    console.warn('Could not play sound:', e);
                });
            }
        } catch (error) {
            console.warn('Sound playback error:', error);
        }
    }

    renderGrid(withFallingAnimation = false) {
        this.cleanupAllParticles(); // Clean up particles before rendering
        const gridElement = document.getElementById('gameGrid');
        if (!gridElement) {
            console.error('Game grid element not found');
            return;
        }
        gridElement.innerHTML = '';
        gridElement.setAttribute('role', 'grid');
        gridElement.setAttribute('aria-label', 'Candy Crush Game Grid');

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = this.grid[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.draggable = true;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', `Candy ${this.grid[row][col]} at row ${row + 1}, column ${col + 1}`);
                cell.tabIndex = 0;

                if (withFallingAnimation) {
                    if (this.grid[row][col] && (this.movedCandyPositions.some(pos => pos.row === row && pos.col === col))) {
                        const delay = (row * 0.08) + (col * 0.02);
                        cell.style.animationDelay = `${delay}s`;
                        cell.classList.add('falling-enhanced');
                        setTimeout(() => {
                            cell.classList.add('bounce-land');
                        }, (delay + 0.5) * 1000);
                        setTimeout(() => {
                            cell.classList.remove('falling-enhanced', 'bounce-land');
                            cell.style.animationDelay = '';
                        }, 1200);
                    } else if (this.isNewCandy(row, col)) {
                        this.animateNewCandyFalling(cell, row);
                    }
                }

                gridElement.appendChild(cell);
            }
        }

        // Use event delegation for click events
        gridElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && this.gameActive && !this.isDragging) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                if (!isNaN(row) && !isNaN(col)) {
                    this.cellClicked(row, col);
                }
            }
        });
    }

    setupDragEvents() {
        const grid = document.getElementById('gameGrid');
        let dragPreview = null;
        let lastTrailTime = 0;
        let touchStartPos = null;

        grid.addEventListener('dragstart', (e) => {
            if (!this.gameActive) return;
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                this.isDragging = true;
                this.dragStartCell = {
                    row: parseInt(cell.dataset.row),
                    col: parseInt(cell.dataset.col),
                    element: cell
                };
                dragPreview = this.createDragPreview(cell);
                cell.style.opacity = '0.5';
                cell.classList.add('candy-pop');
                setTimeout(() => cell.classList.remove('candy-pop'), 500);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setDragImage(new Image(), 0, 0);
            }
        });

        grid.addEventListener('drag', (e) => {
            if (dragPreview && this.isDragging) {
                dragPreview.style.left = (e.clientX - 32) + 'px';
                dragPreview.style.top = (e.clientY - 32) + 'px';
                const now = Date.now();
                if (now - lastTrailTime > 50) {
                    this.createDragTrail(e.clientX, e.clientY);
                    lastTrailTime = now;
                }
            }
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        grid.addEventListener('dragenter', (e) => {
            e.preventDefault();
            const cell = e.target;
            if (cell.classList.contains('cell') && this.isDragging) {
                cell.classList.add('drop-target');
            }
        });

        grid.addEventListener('dragleave', (e) => {
            const cell = e.target;
            if (cell.classList.contains('cell') && this.isDragging) {
                cell.classList.remove('drop-target');
            }
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            const cell = e.target;
            if (cell.classList.contains('cell') && this.isDragging && this.dragStartCell) {
                const dropRow = parseInt(cell.dataset.row);
                const dropCol = parseInt(cell.dataset.col);
                if (this.isAdjacent(this.dragStartCell, { row: dropRow, col: dropCol })) {
                    this.swapCandies(this.dragStartCell, { row: dropRow, col: dropCol });
                }
                cell.classList.remove('drop-target');
            }
            this.cleanupDrag();
            if (dragPreview) {
                document.body.removeChild(dragPreview);
                dragPreview = null;
            }
        });

        grid.addEventListener('dragend', (e) => {
            this.cleanupDrag();
            if (dragPreview) {
                document.body.removeChild(dragPreview);
                dragPreview = null;
            }
        });

        grid.addEventListener('touchstart', (e) => {
            if (!this.gameActive) return;
            const touch = e.touches[0];
            const gridRect = grid.getBoundingClientRect();
            if (touch.clientX < gridRect.left || touch.clientX > gridRect.right ||
                touch.clientY < gridRect.top || touch.clientY > gridRect.bottom) {
                return;
            }
            e.preventDefault();
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('cell')) {
                touchStartPos = { x: touch.clientX, y: touch.clientY };
                this.dragStartCell = {
                    row: parseInt(cell.dataset.row),
                    col: parseInt(cell.dataset.col),
                    element: cell
                };
                cell.classList.add('candy-pop');
                setTimeout(() => cell.classList.remove('candy-pop'), 500);
            }
        });

        grid.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.dragStartCell || !touchStartPos) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartPos.x;
            const deltaY = touch.clientY - touchStartPos.y;
            const now = Date.now();
            if (now - lastTrailTime > 80) {
                this.createDragTrail(touch.clientX, touch.clientY);
                lastTrailTime = now;
            }
            document.querySelectorAll('.cell').forEach(c => {
                c.classList.remove('drop-target');
            });
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('cell') && cell !== this.dragStartCell.element) {
                cell.classList.add('drop-target');
            }
        });

        grid.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.dragStartCell || !touchStartPos) return;
            const touch = e.changedTouches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('cell') && cell !== this.dragStartCell.element) {
                const dropRow = parseInt(cell.dataset.row);
                const dropCol = parseInt(cell.dataset.col);
                if (this.isAdjacent(this.dragStartCell, { row: dropRow, col: dropCol })) {
                    this.swapCandies(this.dragStartCell, { row: dropRow, col: dropCol });
                }
            }
            this.cleanupDrag();
            touchStartPos = null;
        });
    }

    cleanupDrag() {
        if (this.dragStartCell && this.dragStartCell.element) {
            this.dragStartCell.element.classList.remove('dragging');
            this.dragStartCell.element.style.opacity = '1';
        }
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('drop-target');
        });
        this.isDragging = false;
        this.dragStartCell = null;
    }

    cleanupAllParticles() {
        this.particleCleanupQueue.forEach(element => {
            if (document.body.contains(element)) {
                document.body.removeChild(element);
            }
        });
        this.particleCleanupQueue = [];
    }

    cellClicked(row, col) {
        if (!this.gameActive || this.isDragging) return;
        row = parseInt(row);
        col = parseInt(col);
        if (isNaN(row) || isNaN(col)) {
            console.warn('Invalid row or col:', row, col);
            return;
        }
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (this.selectedCell === null) {
            this.selectedCell = { row, col };
            cell.classList.add('selected');
            this.createParticles(cell);
        } else {
            const prevCell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
            prevCell.classList.remove('selected');
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                this.selectedCell = null;
                return;
            }
            if (this.isAdjacent(this.selectedCell, { row, col })) {
                this.swapCandies(this.selectedCell, { row, col });
                this.selectedCell = null;
            } else {
                this.selectedCell = { row, col };
                cell.classList.add('selected');
                this.createParticles(cell);
            }
        }
    }

    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const animateParticles = () => {
            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = centerX + 'px';
                particle.style.top = centerY + 'px';
                particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
                const angle = (i / 6) * Math.PI * 2;
                const distance = 30 + Math.random() * 20;
                particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
                particle.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
                document.body.appendChild(particle);
                this.particleCleanupQueue.push(particle);
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (document.body.contains(particle)) {
                            document.body.removeChild(particle);
                            this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== particle);
                        }
                    }, 1000);
                });
            }
        };
        requestAnimationFrame(animateParticles);
    }

    createDragTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'drag-trail';
        trail.style.left = (x - 4) + 'px';
        trail.style.top = (y - 4) + 'px';
        document.body.appendChild(trail);
        this.particleCleanupQueue.push(trail);
        setTimeout(() => {
            if (document.body.contains(trail)) {
                document.body.removeChild(trail);
                this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== trail);
            }
        }, 500);
    }

    createSparkles(element, count = 8) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            const angle = (i / count) * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            sparkle.style.animationDelay = (Math.random() * 0.3) + 's';
            document.body.appendChild(sparkle);
            this.particleCleanupQueue.push(sparkle);
            setTimeout(() => {
                if (document.body.contains(sparkle)) {
                    document.body.removeChild(sparkle);
                    this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== sparkle);
                }
            }, 1000);
        }
    }

    createDragPreview(element) {
        const preview = element.cloneNode(true);
        preview.className = 'cell drag-preview';
        preview.style.left = '0px';
        preview.style.top = '0px';
        document.body.appendChild(preview);
        return preview;
    }

    isAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapCandies(cell1, cell2) {
        const temp = this.grid[cell1.row][cell1.col];
        this.grid[cell1.row][cell1.col] = this.grid[cell2.row][cell2.col];
        this.grid[cell2.row][cell2.col] = temp;
        if (this.findMatches().length > 0) {
            this.moves--;
            this.processMatches();
            this.updateUI();
            this.renderGrid(true);
        } else {
            this.grid[cell2.row][cell2.col] = this.grid[cell1.row][cell1.col];
            this.grid[cell1.row][cell1.col] = temp;
            this.renderGrid();
        }
    }

    findMatches() {
        const matches = [];
        for (let row = 0; row < this.gridSize; row++) {
            let count = 1;
            let currentCandy = this.grid[row][0];
            for (let col = 1; col < this.gridSize; col++) {
                if (this.grid[row][col] === currentCandy) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = col - count; i < col; i++) {
                            matches.push({ row, col: i });
                        }
                    }
                    count = 1;
                    currentCandy = this.grid[row][col];
                }
            }
            if (count >= 3) {
                for (let i = this.gridSize - count; i < this.gridSize; i++) {
                    matches.push({ row, col: i });
                }
            }
        }
        for (let col = 0; col < this.gridSize; col++) {
            let count = 1;
            let currentCandy = this.grid[0][col];
            for (let row = 1; row < this.gridSize; row++) {
                if (this.grid[row][col] === currentCandy) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = row - count; i < row; i++) {
                            matches.push({ row: i, col });
                        }
                    }
                    count = 1;
                    currentCandy = this.grid[row][col];
                }
            }
            if (count >= 3) {
                for (let i = this.gridSize - count; i < this.gridSize; i++) {
                    matches.push({ row: i, col });
                }
            }
        }
        return matches;
    }

    processMatches(recursionCount = 0) {
        if (recursionCount > 10) {
            console.warn('Maximum recursion limit reached in processMatches');
            this.checkGameEnd();
            return;
        }
        const matches = this.findMatches();
        if (matches.length === 0) {
            this.comboCount = 0;
            this.checkGameEnd();
            return;
        }
        this.comboCount++;
        if (this.comboCount > 1) {
            this.showComboIndicator();
            this.screenShake();
        }
        matches.forEach((match, index) => {
            const cell = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            if (cell) {
                setTimeout(() => {
                    if (this.comboCount > 1) {
                        cell.classList.add('chain-reaction');
                    } else {
                        cell.classList.add('clearing');
                    }
                    this.createSparkles(cell, 6);
                    this.createEnhancedParticles(cell);
                }, index * 100);
            }
        });
        setTimeout(() => {
            matches.forEach(match => {
                this.grid[match.row][match.col] = null;
            });
            const baseScore = matches.length * 10 * this.level;
            const comboBonus = this.comboCount > 1 ? (this.comboCount - 1) * 50 : 0;
            const scoreIncrease = baseScore + comboBonus;
            this.score += scoreIncrease;
            this.animateScoreUpdate(scoreIncrease);
            this.animateFallingSequence(recursionCount + 1);
        }, Math.max(800, matches.length * 100));
    }

    animateFallingSequence(recursionCount) {
        this.calculateFallingCandies();
        setTimeout(() => {
            this.animateExistingCandiesFalling();
        }, 100);
        setTimeout(() => {
            this.dropCandies();
        }, 200);
        setTimeout(() => {
            this.fillEmptySpaces();
        }, 400);
        setTimeout(() => {
            this.renderGrid(true); // Updated to use unified renderGrid
            this.updateUI();
        }, 500);
        setTimeout(() => {
            this.processMatches(recursionCount);
        }, 1500);
    }

    isNewCandy(row, col) {
        return this.newCandyPositions && 
               this.newCandyPositions.length > 0 &&
               this.newCandyPositions.some(pos => pos.row === row && pos.col === col);
    }

    animateNewCandyFalling(cell, row) {
        const startY = -80 * (row + 1);
        const delay = row * 100;
        cell.style.transform = `translateY(${startY}px)`;
        cell.style.opacity = '0.8';
        setTimeout(() => {
            cell.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out';
            cell.style.transform = 'translateY(0)';
            cell.style.opacity = '1';
            setTimeout(() => {
                cell.style.transform = 'translateY(-5px) scale(1.05)';
            }, 600);
            setTimeout(() => {
                cell.style.transform = 'translateY(0) scale(1)';
            }, 700);
            setTimeout(() => {
                cell.style.transition = '';
                cell.style.transform = '';
                cell.style.opacity = '';
            }, 800);
        }, delay);
    }

    animateExistingCandiesFalling() {
        const fallingCells = document.querySelectorAll('[data-will-fall="true"]');
        fallingCells.forEach(cell => {
            const fallDistance = parseInt(cell.dataset.fallDistance);
            const cellHeight = 70;
            const fallPixels = fallDistance * cellHeight;
            cell.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            cell.style.transform = `translateY(${fallPixels}px)`;
            cell.style.zIndex = '10';
            setTimeout(() => {
                cell.style.transform = `translateY(${fallPixels}px) scale(1.1)`;
            }, 400);
            setTimeout(() => {
                cell.style.transform = `translateY(${fallPixels}px) scale(1)`;
            }, 500);
            setTimeout(() => {
                cell.style.transition = '';
                cell.style.transform = '';
                cell.style.zIndex = '';
                delete cell.dataset.willFall;
                delete cell.dataset.fallDistance;
            }, 600);
        });
    }

    calculateFallingCandies() {
        for (let col = 0; col < this.gridSize; col++) {
            let emptyCount = 0;
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.grid[row][col] === null) {
                    emptyCount++;
                } else if (emptyCount > 0) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.dataset.willFall = 'true';
                        cell.dataset.fallDistance = emptyCount.toString();
                    }
                }
            }
        }
    }

    showComboIndicator() {
        this.playComboSound(this.comboCount);
        const indicator = document.createElement('div');
        indicator.className = 'combo-indicator';
        indicator.textContent = `COMBO x${this.comboCount}! 🔥`;
        document.body.appendChild(indicator);
        this.particleCleanupQueue.push(indicator);
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
                this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== indicator);
            }
        }, 1000);
    }

    dropCandies() {
        this.movedCandyPositions = [];
        for (let col = 0; col < this.gridSize; col++) {
            const candies = [];
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== null) {
                    candies.push(this.grid[row][col]);
                }
            }
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col] = null;
            }
            for (let i = 0; i < candies.length; i++) {
                const targetRow = this.gridSize - 1 - i;
                this.grid[targetRow][col] = candies[candies.length - 1 - i];
                if (targetRow !== (this.gridSize - 1 - i)) {
                    this.movedCandyPositions.push({ row: targetRow, col });
                }
            }
        }
    }

    fillEmptySpaces() {
        this.newCandyPositions = [];
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] === null) {
                    this.grid[row][col] = this.getRandomCandy();
                    this.newCandyPositions.push({ row, col });
                }
            }
        }
    }

    createEnhancedParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${centerX}px;
                top: ${centerY}px;
            `;
            const angle = (i / 12) * Math.PI * 2;
            const distance = 40 + Math.random() * 40;
            const duration = 0.6 + Math.random() * 0.4;
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            document.body.appendChild(particle);
            this.particleCleanupQueue.push(particle);
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                    this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== particle);
                }
            }, duration * 1000);
        }
    }

    updateUI() {
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const movesElement = document.getElementById('moves');
        const targetElement = document.getElementById('target');
        const progressElement = document.getElementById('scoreProgress');
        if (!scoreElement || !levelElement || !movesElement || !targetElement || !progressElement) {
            console.error('Missing UI elements');
            return;
        }
        scoreElement.textContent = this.score.toLocaleString();
        levelElement.textContent = this.level;
        movesElement.textContent = this.moves;
        targetElement.textContent = this.target.toLocaleString();
        const progress = Math.min((this.score / this.target) * 100, 100);
        progressElement.style.width = progress + '%';
        if (this.moves <= 5) {
            movesElement.style.color = '#ff4081';
            movesElement.parentElement.style.background = 'rgba(255, 64, 129, 0.2)';
        } else {
            movesElement.style.color = 'inherit';
            movesElement.parentElement.style.background = 'rgba(255,255,255,0.15)';
        }
    }

    checkGameEnd() {
        if (this.score >= this.target) {
            this.showGameOver('🎉 Selamat! Level Selesai! 🎉', `Target tercapai! Skor: ${this.score.toLocaleString()}`);
        } else if (this.moves <= 0) {
            this.showGameOver('💔 Game Over! 💔', `Target tidak tercapai. Skor akhir: ${this.score.toLocaleString()}`);
        }
    }

    createAnticipationParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        for (let i = 0; i < 4; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #fff, #ffeb3b);
                border-radius: 50%;
                pointer-events: none;
                z-index: 999;
                left: ${centerX}px;
                top: ${centerY}px;
                box-shadow: 0 0 10px #ffeb3b;
            `;
            const angle = (i / 4) * Math.PI * 2;
            const distance = 15;
            particle.animate([
                { transform: 'translate(0, 0) scale(0)', opacity: 0 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1)`, opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance * 1.5}px, ${Math.sin(angle) * distance * 1.5}px) scale(0)`, opacity: 0 }
            ], {
                duration: 600,
                easing: 'ease-out'
            });
            document.body.appendChild(particle);
            this.particleCleanupQueue.push(particle);
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                    this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== particle);
                }
            }, 600);
        }
    }

    createExplosionParticles(element, matchCount) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const particleCount = Math.min(20, 8 + matchCount * 2);
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const size = 6 + Math.random() * 8;
            const hue = Math.random() * 360;
            particle.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(45deg, 
                    hsl(${hue}, 80%, 60%), 
                    hsl(${(hue + 60) % 360}, 80%, 70%));
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${centerX}px;
                top: ${centerY}px;
                box-shadow: 0 0 15px hsla(${hue}, 80%, 60%, 0.8);
            `;
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 60 + Math.random() * 80;
            const duration = 1000 + Math.random() * 500;
            particle.animate([
                { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance * 0.7}px, ${Math.sin(angle) * distance * 0.7}px) scale(1.2) rotate(180deg)`, opacity: 1, offset: 0.3 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 100}px) scale(0) rotate(360deg)`, opacity: 0 }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            document.body.appendChild(particle);
            this.particleCleanupQueue.push(particle);
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                    this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== particle);
                }
            }, duration);
        }
    }

    createChainReactionWave(element, index) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const wave = document.createElement('div');
        wave.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 3px solid #ff6b6b;
            border-radius: 50%;
            pointer-events: none;
            z-index: 998;
            left: ${centerX - 10}px;
            top: ${centerY - 10}px;
            box-shadow: 0 0 20px #ff6b6b;
        `;
        wave.animate([
            { transform: 'scale(0)', opacity: 1, borderWidth: '3px' },
            { transform: 'scale(3)', opacity: 0, borderWidth: '0px' }
        ], {
            duration: 800,
            easing: 'ease-out'
        });
        document.body.appendChild(wave);
        this.particleCleanupQueue.push(wave);
        setTimeout(() => {
            if (document.body.contains(wave)) {
                document.body.removeChild(wave);
                this.particleCleanupQueue = this.particleCleanupQueue.filter(p => p !== wave);
            }
        }, 800);
    }

    screenShake() {
        const gameContainer = document.querySelector('#gameGrid').parentElement;
        if (gameContainer) {
            gameContainer.style.animation = 'screenShake 0.5s ease-in-out';
            setTimeout(() => {
                gameContainer.style.animation = '';
            }, 500);
        }
    }

    animateScoreUpdate(scoreIncrease) {
        const scoreElement = document.getElementById('score');
        if (!scoreElement) return;
        const currentScore = this.score - scoreIncrease;
        const targetScore = this.score;
        const duration = 800;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const displayScore = Math.floor(currentScore + (scoreIncrease * easeOut));
            scoreElement.textContent = displayScore.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    showGameOver(title, message) {
        this.gameActive = false;
        let gameOverModal = document.getElementById('gameOverModal');
        if (!gameOverModal) {
            gameOverModal = document.createElement('div');
            gameOverModal.id = 'gameOverModal';
            gameOverModal.className = 'modal';
            gameOverModal.innerHTML = `
                <div class="modal-content">
                    <h2 id="gameOverTitle"></h2>
                    <p id="gameOverMessage"></p>
                    <p>Skor Akhir: <span id="finalScore"></span></p>
                    <button onclick="resetGame()">Main Lagi</button>
                    <button onclick="nextLevel()">Level Berikutnya</button>
                </div>
            `;
            document.body.appendChild(gameOverModal);
        }
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const finalScore = document.getElementById('finalScore');
        if (gameOverTitle && gameOverMessage && finalScore) {
            gameOverTitle.textContent = title;
            gameOverMessage.textContent = message;
            finalScore.textContent = this.score.toLocaleString();
            gameOverModal.classList.remove('hidden');
        } else {
            console.error('Missing game over modal elements');
            alert(`${title}\n${message}\nFinal Score: ${this.score.toLocaleString()}`);
        }
    }

    reset() {
        this.score = 0;
        this.moves = 30;
        this.gameActive = true;
        this.selectedCell = null;
        this.comboCount = 0;
        this.cleanupDrag();
        this.cleanupAllParticles();
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) gameOverModal.classList.add('hidden');
        this.initializeGrid();
        this.renderGrid();
        this.updateUI();
    }

    nextLevel() {
        if (this.score >= this.target) {
            this.level++;
            this.target = this.level * 1000 + (this.level - 1) * 500;
            this.moves = Math.max(20, 35 - this.level);
            this.gameActive = true;
            this.selectedCell = null;
            this.comboCount = 0;
            this.cleanupDrag();
            this.cleanupAllParticles();
            const gameOverModal = document.getElementById('gameOverModal');
            if (gameOverModal) gameOverModal.classList.add('hidden');
            this.initializeGrid();
            this.renderGrid();
            this.updateUI();
        } else {
            alert('Capai target skor terlebih dahulu!');
        }
    }

    showHint() {
        if (!this.gameActive) return;
        const possibleMoves = this.findPossibleMoves();
        if (possibleMoves.length > 0) {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const cell1 = document.querySelector(`[data-row="${randomMove.from.row}"][data-col="${randomMove.from.col}"]`);
            const cell2 = document.querySelector(`[data-row="${randomMove.to.row}"][data-col="${randomMove.to.col}"]`);
            [cell1, cell2].forEach(cell => {
                if (cell) {
                    cell.style.boxShadow = '0 0 30px #ffeb3b, inset 0 0 10px rgba(255,235,59,0.3)';
                    cell.style.border = '3px solid #ffeb3b';
                    setTimeout(() => {
                        cell.style.boxShadow = '';
                        cell.style.border = '2px solid transparent';
                    }, 3000);
                }
            });
        } else {
            alert('Tidak ada gerakan yang tersedia! Gunakan shuffle untuk mengacak papan.');
        }
    }

    findPossibleMoves() {
        const moves = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (col < this.gridSize - 1) {
                    const temp = this.grid[row][col];
                    this.grid[row][col] = this.grid[row][col + 1];
                    this.grid[row][col + 1] = temp;
                    if (this.findMatches().length > 0) {
                        moves.push({
                            from: { row, col },
                            to: { row, col: col + 1 }
                        });
                    }
                    this.grid[row][col + 1] = this.grid[row][col];
                    this.grid[row][col] = temp;
                }
                if (row < this.gridSize - 1) {
                    const temp = this.grid[row][col];
                    this.grid[row][col] = this.grid[row + 1][col];
                    this.grid[row + 1][col] = temp;
                    if (this.findMatches().length > 0) {
                        moves.push({
                            from: { row, col },
                            to: { row: row + 1, col }
                        });
                    }
                    this.grid[row + 1][col] = this.grid[row][col];
                    this.grid[row][col] = temp;
                }
            }
        }
        return moves;
    }

    shuffleBoard() {
        if (!this.gameActive) return;
        const allCandies = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                allCandies.push(this.grid[row][col]);
            }
        }
        for (let i = allCandies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCandies[i], allCandies[j]] = [allCandies[j], allCandies[i]];
        }
        let index = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = allCandies[index++];
            }
        }
        this.moves = Math.max(0, this.moves - 1);
        this.renderGrid(true);
        this.updateUI();
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, i) => {
            cell.style.animation = `fallEnhanced 0.9s ease ${i * 0.05}s`;
            setTimeout(() => {
                cell.style.animation = '';
            }, 900);
        });
    }
}

let game;

function initGame() {
    game = new CandyCrushGame();
}

function resetGame() {
    game.reset();
}

function nextLevel() {
    game.nextLevel();
}

function showHint() {
    game.showHint();
}

function shuffleBoard() {
    game.shuffleBoard();
}

window.addEventListener('load', initGame);