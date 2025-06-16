/**
 * Game Loader
 * Handles game iframe loading, fullscreen, reload and other functions
 */

class GameLoader {
    constructor() {
        this.gameFrame = null;
        this.gameContainer = null;
        this.loadingElement = null;
        this.isFullscreen = false;
        this.loadTimeout = 30000; // 30 seconds timeout
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGameLoader();
            });
        } else {
            this.setupGameLoader();
        }
    }

    setupGameLoader() {
        this.gameFrame = document.getElementById('gameFrame');
        this.gameContainer = document.querySelector('.game-container');
        this.loadingElement = document.getElementById('gameLoading');

        if (!this.gameFrame) {
            console.warn('Game iframe not found');
            return;
        }

        this.setupEventListeners();
        this.startLoading();
    }

    setupEventListeners() {
        // iframe加载完成
        this.gameFrame.addEventListener('load', () => {
            this.onGameLoaded();
        });

        // iframe加载错误
        this.gameFrame.addEventListener('error', () => {
            this.onGameError();
        });

        // 监听iframe内容变化
        this.monitorGameFrame();

        // 全屏变化监听
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });

        document.addEventListener('webkitfullscreenchange', () => {
            this.handleFullscreenChange();
        });

        document.addEventListener('mozfullscreenchange', () => {
            this.handleFullscreenChange();
        });

        document.addEventListener('MSFullscreenChange', () => {
            this.handleFullscreenChange();
        });

        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // 窗口大小变化
        window.addEventListener('resize', Utils.debounce(() => {
            this.adjustGameSize();
        }, 250));
    }

    startLoading() {
        this.showLoading();
        
        // Set loading timeout
        this.loadingTimer = setTimeout(() => {
            this.onLoadTimeout();
        }, this.loadTimeout);

        // Record loading start time
        this.loadStartTime = performance.now();
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
            this.loadingElement.querySelector('p').textContent = 'Game loading, please wait...';
        }

        if (this.gameFrame) {
            this.gameFrame.style.opacity = '0';
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }

        if (this.gameFrame) {
            this.gameFrame.style.opacity = '1';
            this.gameFrame.style.transition = 'opacity 0.5s ease';
        }

        if (this.loadingTimer) {
            clearTimeout(this.loadingTimer);
        }
    }

    onGameLoaded() {
        const loadTime = performance.now() - this.loadStartTime;
        console.log(`Game loaded successfully, time taken: ${loadTime.toFixed(2)}ms`);

        // Delay hiding loading screen to ensure game content is truly visible
        setTimeout(() => {
            this.hideLoading();
            this.adjustGameSize();
            this.showSuccessMessage();
        }, 1000);

        // Send game loaded event
        this.dispatchGameEvent('gameLoaded', { loadTime });

        // Reset retry count
        this.retryCount = 0;
    }

    onGameError() {
        console.error('Game loading failed');
        
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying game loading... (${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.reloadGame();
            }, 2000);
        } else {
            this.showErrorMessage();
        }

        this.dispatchGameEvent('gameError', { retryCount: this.retryCount });
    }

    onLoadTimeout() {
        console.warn('Game loading timeout');
        
        if (this.loadingElement) {
            const loadingText = this.loadingElement.querySelector('p');
            if (loadingText) {
                loadingText.innerHTML = `
                    Game is taking longer to load, please be patient...<br>
                    <small class="text-muted">If it continues to fail loading, please try refreshing the page</small>
                `;
            }
        }

        // Extend timeout
        this.loadingTimer = setTimeout(() => {
            this.onGameError();
        }, 15000);
    }

    showSuccessMessage() {
        if (window.GameSite && window.GameSite.app()?.notificationManager) {
            window.GameSite.app().notificationManager.success('Game loaded successfully! Enjoy playing!', 3000);
        }
    }

    showErrorMessage() {
        this.hideLoading();
        
        if (this.gameContainer) {
            const errorElement = document.createElement('div');
            errorElement.className = 'game-error alert alert-danger text-center';
            errorElement.innerHTML = `
                <h4>🎮 Game Loading Failed</h4>
                <p>Sorry, the game cannot be loaded at the moment. Please try the following solutions:</p>
                <ul class="list-unstyled">
                    <li>• Check network connection</li>
                    <li>• Refresh page and retry</li>
                    <li>• Try using a different browser</li>
                    <li>• Disable ad blocker</li>
                </ul>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    🔄 Refresh Page
                </button>
                <a href="/" class="btn btn-outline-primary mt-3 ms-2">
                    🏠 Back to Home
                </a>
            `;
            
            // 替换iframe
            if (this.gameFrame && this.gameFrame.parentNode) {
                this.gameFrame.parentNode.replaceChild(errorElement, this.gameFrame);
            }
        }

        if (window.GameSite && window.GameSite.app()?.notificationManager) {
            window.GameSite.app().notificationManager.error('Game loading failed, please refresh page and retry', 0);
        }
    }

    monitorGameFrame() {
        // 检查iframe内容是否可访问
        const checkInterval = setInterval(() => {
            try {
                if (this.gameFrame && this.gameFrame.contentWindow) {
                    // 如果能访问contentWindow，说明加载正常
                    const doc = this.gameFrame.contentWindow.document;
                    if (doc && doc.readyState === 'complete') {
                        clearInterval(checkInterval);
                        console.log('游戏iframe内容加载完成');
                    }
                }
            } catch (e) {
                // 跨域访问被阻止是正常的，不需要处理
            }
        }, 1000);

        // 10秒后停止检查
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    adjustGameSize() {
        if (!this.gameFrame) return;

        const containerWidth = this.gameContainer?.offsetWidth || window.innerWidth;
        const containerHeight = window.innerHeight - 200; // 预留导航栏和其他元素空间

        // 响应式调整
        if (window.innerWidth < 768) {
            // 移动端
            this.gameFrame.style.height = '300px';
        } else if (window.innerWidth < 992) {
            // 平板
            this.gameFrame.style.height = '450px';
        } else {
            // 桌面端
            this.gameFrame.style.height = '600px';
        }

        console.log('游戏尺寸已调整');
    }

    // 全屏功能
    toggleFullscreen() {
        if (!this.gameFrame) return;

        if (!this.isFullscreen) {
            this.requestFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    requestFullscreen() {
        const element = this.gameFrame;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        } else {
            // 备用方案：使用CSS模拟全屏
            this.simulateFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else {
            this.exitSimulateFullscreen();
        }
    }

    simulateFullscreen() {
        if (!this.gameFrame) return;

        this.gameFrame.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            border: none !important;
            background: #000 !important;
        `;

        this.isFullscreen = true;
        this.updateFullscreenButton();
        
        // 隐藏页面滚动条
        document.body.style.overflow = 'hidden';
    }

    exitSimulateFullscreen() {
        if (!this.gameFrame) return;

        this.gameFrame.style.cssText = '';
        this.adjustGameSize();
        
        this.isFullscreen = false;
        this.updateFullscreenButton();
        
        // 恢复页面滚动条
        document.body.style.overflow = '';
    }

    handleFullscreenChange() {
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        this.updateFullscreenButton();
        
        if (!this.isFullscreen) {
            // 退出全屏时调整游戏大小
            setTimeout(() => {
                this.adjustGameSize();
            }, 100);
        }

        console.log('全屏状态:', this.isFullscreen ? '已进入' : '已退出');
    }

    updateFullscreenButton() {
        const fullscreenBtn = document.querySelector('[onclick="toggleFullscreen()"]');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = this.isFullscreen ? '📱 退出全屏' : '📺 全屏游玩';
        }
    }

    handleKeyboard(e) {
        // ESC键退出全屏
        if (e.key === 'Escape' && this.isFullscreen) {
            this.exitFullscreen();
        }
        
        // F11键切换全屏
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    // Reload game
    reloadGame() {
        if (!this.gameFrame) return;

        console.log('Reloading game...');
        
        this.showLoading();
        
        // Reset src
        const originalSrc = this.gameFrame.src;
        this.gameFrame.src = '';
        
        setTimeout(() => {
            this.gameFrame.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + '_t=' + Date.now();
            this.startLoading();
        }, 100);

        this.dispatchGameEvent('gameReload');
    }

    // Get game information
    getGameInfo() {
        return {
            src: this.gameFrame?.src,
            isLoaded: this.gameFrame?.complete,
            isFullscreen: this.isFullscreen,
            retryCount: this.retryCount,
            loadStartTime: this.loadStartTime
        };
    }

    // 派发游戏事件
    dispatchGameEvent(eventName, detail = {}) {
        const event = new CustomEvent(`game:${eventName}`, {
            detail: {
                ...detail,
                timestamp: Date.now(),
                gameInfo: this.getGameInfo()
            }
        });
        
        document.dispatchEvent(event);
        
        // 发送到性能监控
        if (window.GameSite?.app()?.performanceMonitor) {
            window.GameSite.app().performanceMonitor.recordAction('game_event', {
                eventName,
                detail
            });
        }
    }

    // Destroy method
    destroy() {
        if (this.loadingTimer) {
            clearTimeout(this.loadingTimer);
        }

        if (this.isFullscreen) {
            this.exitFullscreen();
        }

        // Clean up event listeners
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
    }
}

// Game Control Functions
class GameControls {
    constructor(gameLoader) {
        this.gameLoader = gameLoader;
        this.setupControls();
    }

    setupControls() {
        // Setup fullscreen button
        window.toggleFullscreen = () => {
            this.gameLoader.toggleFullscreen();
        };

        // Setup reload button
        window.reloadGame = () => {
            this.gameLoader.reloadGame();
        };
    }



    showControlMessage(message) {
        // Show control operation feedback message
        if (window.GameSite && window.GameSite.app()?.notificationManager) {
            window.GameSite.app().notificationManager.info(message, 2000);
        } else {
            // Simple toast implementation
            const toast = document.createElement('div');
            toast.className = 'game-control-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 9999;
                font-size: 14px;
                transition: opacity 0.3s ease;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 1700);
        }
    }


}

// 全局实例
let gameLoader;
let gameControls;

// 初始化游戏加载器
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否在游戏页面
    if (document.getElementById('gameFrame')) {
        gameLoader = new GameLoader();
        gameControls = new GameControls(gameLoader);
        
        console.log('游戏加载器初始化完成');
        
        // 监听游戏事件
        document.addEventListener('game:gameLoaded', (e) => {
            console.log('游戏加载事件:', e.detail);
        });

        document.addEventListener('game:gameError', (e) => {
            console.error('游戏错误事件:', e.detail);
        });
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (gameLoader) {
        gameLoader.destroy();
    }
});

// 导出供其他脚本使用
if (typeof window !== 'undefined') {
    window.GameLoader = GameLoader;
    window.GameControls = GameControls;
} 