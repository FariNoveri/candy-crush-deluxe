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
                
                this.initializeGrid();
                this.renderGrid();
                this.updateUI();
                this.setupDragEvents();
                this.particleCleanupQueue = [];
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
                
                // Check horizontal matches
                if (col >= 2 && 
                    this.grid[row][col - 1] === candy && 
                    this.grid[row][col - 2] === candy) {
                    return true;
                }
                
                // Check vertical matches
                if (row >= 2 && 
                    this.grid[row - 1][col] === candy && 
                    this.grid[row - 2][col] === candy) {
                    return true;
                }
                
                return false;
            }

renderGrid() {
    const gridElement = document.getElementById('gameGrid');
    gridElement.innerHTML = '';
    
    for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = this.grid[row][col];
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.draggable = true;
            
            // Enhanced falling animation untuk buah baru dan yang bergerak
            if (this.grid[row][col] && (cell.dataset.isNew === 'true' || cell.dataset.isMoved === 'true')) {
                // Stagger animation berdasarkan row dan col untuk efek wave
                const delay = (row * 0.08) + (col * 0.02);
                cell.style.animationDelay = `${delay}s`;
                cell.classList.add('falling-enhanced');
                
                // Tambah bounce effect
                setTimeout(() => {
                    cell.classList.add('bounce-land');
                }, (delay + 0.5) * 1000);
                
                setTimeout(() => {
                    cell.classList.remove('falling-enhanced', 'bounce-land');
                    cell.style.animationDelay = '';
                    delete cell.dataset.isNew;
                    delete cell.dataset.isMoved;
                }, 1200);
            }
            cell.addEventListener('click', () => this.cellClicked(row, col));
            gridElement.appendChild(cell);
        }
    }
}

            setupDragEvents() {
                const grid = document.getElementById('gameGrid');
                let dragPreview = null;
                let lastTrailTime = 0;
                
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
                        
                        // Create drag preview
                        dragPreview = this.createDragPreview(cell);
                        cell.style.opacity = '0.5';
                        
                        // Add candy pop effect
                        cell.classList.add('candy-pop');
                        setTimeout(() => cell.classList.remove('candy-pop'), 500);
                        
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setDragImage(new Image(), 0, 0); // Hide default drag image
                    }
                });

                grid.addEventListener('drag', (e) => {
                    if (dragPreview && this.isDragging) {
                        dragPreview.style.left = (e.clientX - 32) + 'px';
                        dragPreview.style.top = (e.clientY - 32) + 'px';
                        
                        // Create trail effect
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

                // Enhanced touch events
                let touchStartPos = null;
                
                grid.addEventListener('touchstart', (e) => {
                    if (!this.gameActive) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
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
                    
                    // Create trail effect
                    const now = Date.now();
                    if (now - lastTrailTime > 80) {
                        this.createDragTrail(touch.clientX, touch.clientY);
                        lastTrailTime = now;
                    }
                    
                    // Clear previous highlights
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
                    
                    setTimeout(() => {
                        document.body.removeChild(particle);
                    }, 1000);
                }
            }

            createDragTrail(x, y) {
                const trail = document.createElement('div');
                trail.className = 'drag-trail';
                trail.style.left = (x - 4) + 'px';
                trail.style.top = (y - 4) + 'px';
                document.body.appendChild(trail);
                
                setTimeout(() => {
                    if (document.body.contains(trail)) {
                        document.body.removeChild(trail);
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
                    
                    setTimeout(() => {
                        if (document.body.contains(sparkle)) {
                            document.body.removeChild(sparkle);
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
                } else {
                    // Swap back if no matches
                    const temp = this.grid[cell1.row][cell1.col];
                    this.grid[cell1.row][cell1.col] = this.grid[cell2.row][cell2.col];
                    this.grid[cell2.row][cell2.col] = temp;
                }
                
                this.renderGrid();
            }

            findMatches() {
                const matches = [];
                
                // Check horizontal matches
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
                
                // Check vertical matches
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

// 1. Update method processMatches - bagian yang handle animasi setelah clear
processMatches() {
    const matches = this.findMatches();
    
    if (matches.length === 0) {
        this.comboCount = 0;
        this.checkGameEnd();
        return;
    }
    
    this.comboCount++;
    
    if (this.comboCount > 1) {
        this.showComboIndicator();
    }
    
    // Animasi clear buah yang match
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
    
    // Remove matches dan mulai animasi falling
    setTimeout(() => {
        // Hapus buah yang match
        matches.forEach(match => {
            this.grid[match.row][match.col] = null;
        });
        
        // Update score
        const baseScore = matches.length * 10 * this.level;
        const comboBonus = this.comboCount > 1 ? (this.comboCount - 1) * 50 : 0;
        this.score += baseScore + comboBonus;
        
        // BAGIAN PENTING: Animasi buah turun dengan sequence yang benar
        this.animateFallingSequence();
        
    }, Math.max(800, matches.length * 100));
}

animateFallingSequence() {
    // Step 1: Hitung dan tandai buah yang akan turun
    this.calculateFallingCandies();
    
    // Step 2: Animate buah yang turun
    setTimeout(() => {
        this.animateExistingCandiesFalling();
    }, 100);
    
    // Step 3: Drop candies secara logic
    setTimeout(() => {
        this.dropCandies();
    }, 200);
    
    // Step 4: Fill empty spaces dengan buah baru
    setTimeout(() => {
        this.fillEmptySpaces();
    }, 400);
    
    // Step 5: Render ulang dengan animasi buah baru turun
    setTimeout(() => {
        this.renderGridWithFallingAnimation();
        this.updateUI();
    }, 500);
    
    // Step 6: Check for more matches
    setTimeout(() => {
        this.processMatches();
    }, 1500);
}

renderGridWithFallingAnimation() {
    const gridElement = document.getElementById('gameGrid');
    gridElement.innerHTML = '';
    
    for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = this.grid[row][col];
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.draggable = true;
            
            // Cek apakah ini buah baru yang turun dari atas
            if (this.isNewCandy(row, col)) {
                this.animateNewCandyFalling(cell, row);
            }
            
            cell.addEventListener('click', () => this.cellClicked(row, col));
            gridElement.appendChild(cell);
        }
    }
}

isNewCandy(row, col) {
    return this.newCandyPositions && 
           this.newCandyPositions.length > 0 &&
           this.newCandyPositions.some(pos => pos.row === row && pos.col === col);
}

animateNewCandyFalling(cell, row) {
    const startY = -80 * (row + 1); // Start dari atas layar
    const delay = row * 100; // Delay berdasarkan row
    
    // Set posisi awal
    cell.style.transform = `translateY(${startY}px)`;
    cell.style.opacity = '0.8';
    
    // Animate turun
    setTimeout(() => {
        cell.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out';
        cell.style.transform = 'translateY(0)';
        cell.style.opacity = '1';
        
        // Bounce effect
        setTimeout(() => {
            cell.style.transform = 'translateY(-5px) scale(1.05)';
        }, 600);
        
        setTimeout(() => {
            cell.style.transform = 'translateY(0) scale(1)';
        }, 700);
        
        // Reset
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
        const cellHeight = 70; // Height dari setiap cell + gap
        const fallPixels = fallDistance * cellHeight;
        
        // Animate turun
        cell.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        cell.style.transform = `translateY(${fallPixels}px)`;
        cell.style.zIndex = '10';
        
        // Bounce effect saat landing
        setTimeout(() => {
            cell.style.transform = `translateY(${fallPixels}px) scale(1.1)`;
        }, 400);
        
        setTimeout(() => {
            cell.style.transform = `translateY(${fallPixels}px) scale(1)`;
        }, 500);
        
        // Reset setelah animasi selesai
        setTimeout(() => {
            cell.style.transition = '';
            cell.style.transform = '';
            cell.style.zIndex = '';
            delete cell.dataset.willFall;
            delete cell.dataset.fallDistance;
        }, 600);
    });
}


// 3. Method untuk calculate buah mana yang akan turun
calculateFallingCandies() {
    for (let col = 0; col < this.gridSize; col++) {
        let emptyCount = 0;
        
        // Hitung dari bawah ke atas
        for (let row = this.gridSize - 1; row >= 0; row--) {
            if (this.grid[row][col] === null) {
                emptyCount++;
            } else if (emptyCount > 0) {
                // Tandai buah ini akan turun
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
                const indicator = document.createElement('div');
                indicator.className = 'combo-indicator';
                indicator.textContent = `COMBO x${this.comboCount}! 🔥`;
                document.body.appendChild(indicator);
                
                setTimeout(() => {
                    document.body.removeChild(indicator);
                }, 1000);
            }

            dropCandies() {
                for (let col = 0; col < this.gridSize; col++) {
                    // Find all null cells in the column
                    let nullPositions = [];
                    for (let row = 0; row < this.gridSize; row++) {
                        if (this.grid[row][col] === null) {
                            nullPositions.push(row);
                        }
                    }
                    
                    // If there are null cells, shift candies down
                    if (nullPositions.length > 0) {
                        // Start from the bottom and move non-null candies down
                        let writeRow = this.gridSize - 1;
                        for (let row = this.gridSize - 1; row >= 0; row--) {
                            if (this.grid[row][col] !== null) {
                                if (writeRow !== row) {
                                    this.grid[writeRow][col] = this.grid[row][col];
                                    this.grid[row][col] = null;
                                    // Mark as moved for animation
                                    const cell = document.querySelector(`[data-row="${writeRow}"][data-col="${col}"]`);
                                    if (cell) {
                                        cell.dataset.isMoved = 'true';
                                    }
                                }
                                writeRow--;
                            }
                        }
                    }
                }
            }

fillEmptySpaces() {
    this.newCandyPositions = []; // Track posisi buah baru
    
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
                
                // Create burst particles
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
                        {
                            transform: 'translate(0, 0) scale(1)',
                            opacity: 1
                        },
                        {
                            transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                            opacity: 0
                        }
                    ], {
                        duration: duration * 1000,
                        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    });
                    
                    document.body.appendChild(particle);
                    
                    setTimeout(() => {
                        if (document.body.contains(particle)) {
                            document.body.removeChild(particle);
                        }
                    }, duration * 1000);
                }
            }

            updateUI() {
                document.getElementById('score').textContent = this.score.toLocaleString();
                document.getElementById('level').textContent = this.level;
                document.getElementById('moves').textContent = this.moves;
                document.getElementById('target').textContent = this.target.toLocaleString();
                
                // Update progress bar
                const progress = Math.min((this.score / this.target) * 100, 100);
                document.getElementById('scoreProgress').style.width = progress + '%';
                
                const movesElement = document.getElementById('moves');
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
    
    // Create small sparkle particles sebelum explosion
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
        
        setTimeout(() => {
            if (document.body.contains(particle)) {
                document.body.removeChild(particle);
            }
        }, 600);
    }
}

createExplosionParticles(element, matchCount) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Lebih banyak particles untuk match yang lebih besar
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
            {
                transform: 'translate(0, 0) scale(0) rotate(0deg)',
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * distance * 0.7}px, ${Math.sin(angle) * distance * 0.7}px) scale(1.2) rotate(180deg)`,
                opacity: 1,
                offset: 0.3
            },
            {
                transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 100}px) scale(0) rotate(360deg)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (document.body.contains(particle)) {
                document.body.removeChild(particle);
            }
        }, duration);
    }
}

createChainReactionWave(element, index) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create expanding ring effect
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
        {
            transform: 'scale(0)',
            opacity: 1,
            borderWidth: '3px'
        },
        {
            transform: 'scale(3)',
            opacity: 0,
            borderWidth: '0px'
        }
    ], {
        duration: 800,
        easing: 'ease-out'
    });
    
    document.body.appendChild(wave);
    
    setTimeout(() => {
        if (document.body.contains(wave)) {
            document.body.removeChild(wave);
        }
    }, 800);
}

screenShake() {
    const gameContainer = document.querySelector('#gameGrid').parentElement;
    gameContainer.style.animation = 'screenShake 0.5s ease-in-out';
    
    setTimeout(() => {
        gameContainer.style.animation = '';
    }, 500);
}

animateScoreUpdate(scoreIncrease) {
    const scoreElement = document.getElementById('score');
    const currentScore = this.score - scoreIncrease;
    const targetScore = this.score;
    const duration = 800;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const displayScore = Math.floor(currentScore + (scoreIncrease * easeOut));
        
        scoreElement.textContent = displayScore.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

// 4. Enhanced dropCandies method dengan better physics
dropCandies() {
    for (let col = 0; col < this.gridSize; col++) {
        // Collect non-null candies
        const candies = [];
        for (let row = 0; row < this.gridSize; row++) {
            if (this.grid[row][col] !== null) {
                candies.push(this.grid[row][col]);
            }
        }
        
        // Clear column
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row][col] = null;
        }
        
        // Place candies from bottom
        for (let i = 0; i < candies.length; i++) {
            this.grid[this.gridSize - 1 - i][col] = candies[candies.length - 1 - i];
        }
    }
}

showGameOver(title, message) {
    this.gameActive = false;
    
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const finalScore = document.getElementById('finalScore');
    const gameOverModal = document.getElementById('gameOverModal');

    if (gameOverTitle && gameOverMessage && finalScore && gameOverModal) {
        gameOverTitle.textContent = title;
        gameOverMessage.textContent = message; // Use textContent instead of innerHTML
        finalScore.textContent = this.score.toLocaleString();
        gameOverModal.classList.remove('hidden');
    } else {
        console.error('Missing game over modal elements:', {
            gameOverTitle: !!gameOverTitle,
            gameOverMessage: !!gameOverMessage,
            finalScore: !!finalScore,
            gameOverModal: !!gameOverModal
        });
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
                document.getElementById('gameOverModal').classList.add('hidden');
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
                    document.getElementById('gameOverModal').classList.add('hidden');
                    this.initializeGrid();
                    this.renderGrid();
                    this.updateUI();
                } else {
                    alert('Capai target skor terlebih dahulu!');
                }
            }

            showHint() {
                if (!this.gameActive) return;
                
                // Find possible moves
                const possibleMoves = this.findPossibleMoves();
                
                if (possibleMoves.length > 0) {
                    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    const cell1 = document.querySelector(`[data-row="${randomMove.from.row}"][data-col="${randomMove.from.col}"]`);
                    const cell2 = document.querySelector(`[data-row="${randomMove.to.row}"][data-col="${randomMove.to.col}"]`);
                    
                    // Highlight hint cells
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
                    // No moves available, suggest shuffle
                    alert('Tidak ada gerakan yang tersedia! Gunakan shuffle untuk mengacak papan.');
                }
            }

            findPossibleMoves() {
                const moves = [];
                
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        // Check right neighbor
                        if (col < this.gridSize - 1) {
                            // Simulate swap
                            const temp = this.grid[row][col];
                            this.grid[row][col] = this.grid[row][col + 1];
                            this.grid[row][col + 1] = temp;
                            
                            if (this.findMatches().length > 0) {
                                moves.push({
                                    from: { row, col },
                                    to: { row, col: col + 1 }
                                });
                            }
                            
                            // Swap back
                            this.grid[row][col + 1] = this.grid[row][col];
                            this.grid[row][col] = temp;
                        }
                        
                        // Check bottom neighbor
                        if (row < this.gridSize - 1) {
                            // Simulate swap
                            const temp = this.grid[row][col];
                            this.grid[row][col] = this.grid[row + 1][col];
                            this.grid[row + 1][col] = temp;
                            
                            if (this.findMatches().length > 0) {
                                moves.push({
                                    from: { row, col },
                                    to: { row: row + 1, col }
                                });
                            }
                            
                            // Swap back
                            this.grid[row + 1][col] = this.grid[row][col];
                            this.grid[row][col] = temp;
                        }
                    }
                }
                
                return moves;
            }

            shuffleBoard() {
                if (!this.gameActive) return;
                
                // Create array of all candies
                const allCandies = [];
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        allCandies.push(this.grid[row][col]);
                    }
                }
                
                // Shuffle array
                for (let i = allCandies.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allCandies[i], allCandies[j]] = [allCandies[j], allCandies[i]];
                }
                
                // Put shuffled candies back to grid
                let index = 0;
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        this.grid[row][col] = allCandies[index++];
                    }
                }
                
                // Deduct moves for using shuffle
                this.moves = Math.max(0, this.moves - 1);
                
                this.renderGrid();
                this.updateUI();
                
                // Add shuffle animation
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

        // Initialize game when page loads
        window.addEventListener('load', initGame);