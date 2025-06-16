/**
 * Free Games Hub - Main Script File
 * Handles website common functions and interaction logic
 */

// Global Configuration
const SITE_CONFIG = {
    name: 'Free Games Hub',
    version: '1.0.0',
    debug: false,
    performance: {
        enableMonitoring: true,
        trackLoadTime: true,
        trackUserActions: true
    },
    animation: {
        duration: 300,
        easing: 'ease-in-out'
    }
};

// Global Variables
let isScrolled = false;

// Utility Functions Class
class Utils {
    /**
     * Debounce function
     * @param {Function} func Function to execute
     * @param {number} wait Delay time
     * @param {boolean} immediate Whether to execute immediately
     * @returns {Function}
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Throttle function
     * @param {Function} func Function to execute
     * @param {number} limit Limit time
     * @returns {Function}
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Detect device type
     * @returns {Object}
     */
    static detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        return {
            isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
            isTablet: /ipad|android|tablet/i.test(userAgent),
            isDesktop: !/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
            isIOS: /iphone|ipad|ipod/i.test(userAgent),
            isAndroid: /android/i.test(userAgent),
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    }

    /**
     * Get URL parameter
     * @param {string} name Parameter name
     * @returns {string|null}
     */
    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    /**
     * Format time
     * @param {Date} date Date object
     * @returns {string}
     */
    static formatTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Check if element is in viewport
     * @param {Element} element Element to check
     * @returns {boolean}
     */
    static isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Smooth scroll to element
     * @param {Element|string} target Target element or selector
     * @param {number} offset Offset amount
     */
    static smoothScrollTo(target, offset = 0) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text Text to copy
     * @returns {Promise<boolean>}
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (err) {
            console.error('Copy failed:', err);
            return false;
        }
    }
}

// Performance Monitor Class
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoadedTime: 0,
            firstPaintTime: 0,
            firstContentfulPaintTime: 0,
            userActions: []
        };
        
        if (SITE_CONFIG.performance.enableMonitoring) {
            this.init();
        }
    }

    init() {
        // DOM content loaded time
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.domContentLoadedTime = performance.now();
            this.log('DOM Content Loaded', this.metrics.domContentLoadedTime);
        });

        // Page fully loaded time
        window.addEventListener('load', () => {
            this.metrics.pageLoadTime = performance.now();
            this.log('Page Load Complete', this.metrics.pageLoadTime);
            
            // Collect browser performance metrics
            this.collectWebVitals();
            
            // 发送性能数据
            this.sendMetrics();
        });

        // 监听用户交互
        if (SITE_CONFIG.performance.trackUserActions) {
            this.trackUserActions();
        }
    }

    collectWebVitals() {
        // 获取性能条目
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
                this.metrics.firstPaintTime = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                this.metrics.firstContentfulPaintTime = entry.startTime;
            }
        });

        // 获取导航时间
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
            this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
            this.metrics.domInteractiveTime = navigationEntry.domInteractive;
        }
    }

    trackUserActions() {
        // 跟踪点击事件
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, [data-track]');
            if (target) {
                this.recordAction('click', {
                    element: target.tagName.toLowerCase(),
                    text: target.textContent?.trim().substring(0, 50),
                    href: target.href || null,
                    timestamp: Date.now()
                });
            }
        });

        // 跟踪滚动深度
        let maxScrollDepth = 0;
        const trackScrollDepth = Utils.throttle(() => {
            const scrollDepth = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
                this.recordAction('scroll', { depth: scrollDepth });
            }
        }, 1000);

        window.addEventListener('scroll', trackScrollDepth);
    }

    recordAction(type, data) {
        this.metrics.userActions.push({
            type,
            data,
            timestamp: Date.now()
        });
    }

    log(message, value) {
        if (SITE_CONFIG.debug) {
            console.log(`[Performance] ${message}:`, `${value.toFixed(2)}ms`);
        }
    }

    sendMetrics() {
        // 这里可以发送到分析服务，如Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                event_category: 'Performance',
                value: Math.round(this.metrics.pageLoadTime)
            });

            if (this.metrics.firstContentfulPaintTime) {
                gtag('event', 'first_contentful_paint', {
                    event_category: 'Performance',
                    value: Math.round(this.metrics.firstContentfulPaintTime)
                });
            }
        }

        if (SITE_CONFIG.debug) {
            console.log('[Performance Metrics]', this.metrics);
        }
    }
}

// 导航栏管理类
class NavbarManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.lastScrollTop = 0;
        this.scrollThreshold = 10;
        
        if (this.navbar) {
            this.init();
        }
    }

    init() {
        // 滚动效果
        const handleScroll = Utils.throttle(() => {
            this.handleScroll();
        }, 16); // 60fps

        window.addEventListener('scroll', handleScroll);

        // 移动端菜单自动关闭
        this.setupMobileMenu();

        // 导航链接平滑滚动
        this.setupSmoothScrolling();
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 添加滚动样式
        if (scrollTop > 50) {
            this.navbar.classList.add('navbar-scrolled');
        } else {
            this.navbar.classList.remove('navbar-scrolled');
        }

        this.lastScrollTop = scrollTop;
    }

    setupMobileMenu() {
        const navLinks = document.querySelectorAll('.nav-link');
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // 在移动端点击导航链接后自动关闭菜单
                if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            });
        });
    }

    setupSmoothScrolling() {
        // 处理锚点链接的平滑滚动
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '#top') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    Utils.smoothScrollTo(target, 80); // 考虑固定导航栏的高度
                }
            });
        });
    }
}

// 图片懒加载管理类
class LazyLoadManager {
    constructor() {
        this.images = document.querySelectorAll('img[loading="lazy"], img[data-src]');
        this.imageObserver = null;
        
        if (this.images.length > 0) {
            this.init();
        }
    }

    init() {
        // 使用Intersection Observer进行懒加载
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // 备用方案：立即加载所有图片
            this.loadAllImages();
        }
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, options);

        this.images.forEach(img => {
            this.imageObserver.observe(img);
        });
    }

    loadImage(img) {
        // 如果有data-src属性，则使用它
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }

        // 添加加载完成类
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });

        // 处理加载失败
        img.addEventListener('error', () => {
            img.classList.add('error');
            // 可以设置一个默认的错误图片
            console.warn('图片加载失败:', img.src);
        });
    }

    loadAllImages() {
        this.images.forEach(img => {
            this.loadImage(img);
        });
    }
}

// 动画管理类
class AnimationManager {
    constructor() {
        this.animatedElements = document.querySelectorAll('[data-animate]');
        this.observer = null;
        
        if (this.animatedElements.length > 0) {
            this.init();
        }
    }

    init() {
        // 检查用户是否偏好减少动画
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disableAnimations();
            return;
        }

        this.setupAnimationObserver();
    }

    setupAnimationObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        this.animatedElements.forEach(element => {
            this.observer.observe(element);
        });
    }

    triggerAnimation(element) {
        const animationType = element.dataset.animate;
        const delay = parseInt(element.dataset.delay) || 0;
        
        setTimeout(() => {
            element.classList.add('animate-in');
            
            // 根据动画类型添加特定类
            if (animationType) {
                element.classList.add(`animate-${animationType}`);
            }
        }, delay);
    }

    disableAnimations() {
        this.animatedElements.forEach(element => {
            element.classList.add('animate-in');
        });
    }
}

// 通知系统类
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 1050;
            max-width: 350px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // 启用指针事件
        notification.style.pointerEvents = 'auto';

        // 触发进入动画
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade notification-item`;
        notification.style.cssText = `
            margin-bottom: 10px;
            transform: translateX(100%);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">${icons[type] || icons.info}</span>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        // 添加关闭事件
        const closeBtn = notification.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        notification.classList.remove('show');
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'danger', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// 主应用类
class GameSiteApp {
    constructor() {
        this.device = Utils.detectDevice();
        this.performanceMonitor = null;
        this.navbarManager = null;
        this.lazyLoadManager = null;
        this.animationManager = null;
        this.notificationManager = null;
        
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
            });
        } else {
            this.initializeComponents();
        }

        // 设置全局错误处理
        this.setupErrorHandling();
        
        // 设置设备特定的类
        this.setupDeviceClasses();
    }

    initializeComponents() {
        try {
            // 初始化各个组件
            this.performanceMonitor = new PerformanceMonitor();
            this.navbarManager = new NavbarManager();
            this.lazyLoadManager = new LazyLoadManager();
            this.animationManager = new AnimationManager();
            this.notificationManager = new NotificationManager();

            // 初始化游戏卡片动画
            this.initGameCardAnimations();

            // 初始化全局事件监听器
            this.setupGlobalEventListeners();

            // 设置页面可见性API
            this.setupVisibilityAPI();

            console.log(`[${SITE_CONFIG.name}] 应用初始化完成`);
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    initGameCardAnimations() {
        const gameCards = document.querySelectorAll('.game-card');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('animate-in');
                        }, index * 100); // 错开动画时间
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
            
            gameCards.forEach(card => {
                observer.observe(card);
            });
        } else {
            // 备用方案：直接显示所有卡片
            gameCards.forEach(card => {
                card.classList.add('animate-in');
            });
        }
    }

    setupGlobalEventListeners() {
        // 处理复制链接功能
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-copy-url]') || e.target.closest('[data-copy-url]')) {
                e.preventDefault();
                this.handleCopyUrl();
            }
        });

        // 处理可点击游戏卡片
        this.setupClickableCards();

        // 处理返回顶部
        this.setupBackToTop();

        // 处理键盘导航
        this.setupKeyboardNavigation();
    }

    setupClickableCards() {
        const clickableCards = document.querySelectorAll('.clickable-card');
        
        clickableCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // 防止在点击按钮时触发卡片点击
                if (e.target.closest('.game-play-btn-main')) {
                    return;
                }
                
                const gameUrl = card.getAttribute('data-game-url');
                if (gameUrl) {
                    // 添加点击动画效果
                    card.style.transform = 'translateY(-4px) scale(0.98)';
                    
                    // 短暂延迟后跳转，让用户看到点击反馈
                    setTimeout(() => {
                        window.location.href = gameUrl;
                    }, 150);
                }
            });

            // 添加键盘支持
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const gameUrl = card.getAttribute('data-game-url');
                    if (gameUrl) {
                        window.location.href = gameUrl;
                    }
                }
            });

            // 确保卡片可以获得焦点
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }

            // 添加鼠标进入和离开的效果
            card.addEventListener('mouseenter', () => {
                card.style.cursor = 'pointer';
            });

            card.addEventListener('mouseleave', () => {
                // 重置变换效果
                card.style.transform = '';
            });
        });
    }

    async handleCopyUrl() {
        const url = window.location.href;
        const success = await Utils.copyToClipboard(url);
        
        if (success) {
            this.notificationManager.success('链接已复制到剪贴板！');
        } else {
            this.notificationManager.error('复制失败，请手动复制链接');
        }
    }

    setupBackToTop() {
        // 创建返回顶部按钮
        const backToTop = document.createElement('button');
        backToTop.className = 'btn btn-primary btn-back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            font-size: 1.2rem;
            font-weight: bold;
        `;

        document.body.appendChild(backToTop);

        // 滚动显示/隐藏按钮
        const toggleBackToTop = Utils.throttle(() => {
            if (window.pageYOffset > 300) {
                backToTop.style.opacity = '1';
                backToTop.style.visibility = 'visible';
            } else {
                backToTop.style.opacity = '0';
                backToTop.style.visibility = 'hidden';
            }
        }, 100);

        window.addEventListener('scroll', toggleBackToTop);

        // 点击返回顶部
        backToTop.addEventListener('click', () => {
            Utils.smoothScrollTo(document.body, 0);
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC键关闭模态框等
            if (e.key === 'Escape') {
                // 可以在这里添加关闭模态框的逻辑
            }
            
            // Alt + H 返回首页
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                window.location.href = '/';
            }
        });
    }

    setupVisibilityAPI() {
        // 处理页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时暂停一些操作
                console.log('页面隐藏');
            } else {
                // 页面重新可见时恢复操作
                console.log('页面可见');
            }
        });
    }

    setupErrorHandling() {
        // 全局错误处理
        window.addEventListener('error', (e) => {
            console.error('全局错误:', e.error);
            
            // 可以发送错误报告到服务器
            this.reportError(e.error, 'global');
        });

        // 未处理的Promise错误
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise错误:', e.reason);
            this.reportError(e.reason, 'promise');
        });
    }

    setupDeviceClasses() {
        const body = document.body;
        
        if (this.device.isMobile) {
            body.classList.add('is-mobile');
        }
        if (this.device.isTablet) {
            body.classList.add('is-tablet');
        }
        if (this.device.isDesktop) {
            body.classList.add('is-desktop');
        }
        if (this.device.hasTouch) {
            body.classList.add('has-touch');
        }
    }

    reportError(error, type) {
        // 这里可以实现错误报告逻辑
        if (SITE_CONFIG.debug) {
            console.group(`[Error Report] ${type}`);
            console.error(error);
            console.groupEnd();
        }
        
        // 发送到错误追踪服务
        // 例如：Sentry, LogRocket等
    }
}

// 全局实例
let gameApp;

// 当DOM加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    gameApp = new GameSiteApp();
});

// 导出供其他脚本使用
window.GameSite = {
    Utils,
    NotificationManager,
    SITE_CONFIG,
    app: () => gameApp
};

// 兼容旧版本的全局函数
window.copyGameUrl = function() {
    if (gameApp && gameApp.notificationManager) {
        gameApp.handleCopyUrl();
    }
};

// 初始化应用
function initializeApp() {
    initNavbar();
    initScrollAnimations();
    initGameCards();
    initSmoothScroll();
    initPerformanceOptimizations();
    
    console.log('🎮 免费游戏站已加载完成');
}

// 导航栏效果
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    // 滚动时导航栏效果
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldAddScrolled = scrollTop > 50;
        
        if (shouldAddScrolled !== isScrolled) {
            isScrolled = shouldAddScrolled;
            navbar.classList.toggle('navbar-scrolled', isScrolled);
        }
    }
    
    // 使用节流优化滚动性能
    const throttledScroll = throttle(handleScroll, 16);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // 初始检查
    handleScroll();
}

// 滚动动画效果
function initScrollAnimations() {
    // 创建Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // 为游戏卡片添加延迟动画
                if (entry.target.classList.contains('game-card-modern')) {
                    const delay = parseInt(entry.target.dataset.aosDelay) || 0;
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, delay);
                }
                
                // 为特色卡片添加延迟动画
                if (entry.target.classList.contains('feature-card')) {
                    const delay = parseInt(entry.target.dataset.aosDelay) || 0;
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, delay);
                }
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    const animatedElements = document.querySelectorAll('.game-card-modern, .feature-card, .hero-content, .section-header');
    animatedElements.forEach(el => {
        // 初始状态
        if (el.classList.contains('game-card-modern') || el.classList.contains('feature-card')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }
        
        observer.observe(el);
    });
}

// 游戏卡片交互效果
function initGameCards() {
    const gameCards = document.querySelectorAll('.game-card-modern');
    
    gameCards.forEach(card => {
        // 鼠标进入效果
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px)';
            
            // 添加光晕效果
            const iconWrapper = this.querySelector('.game-icon-wrapper');
            if (iconWrapper) {
                iconWrapper.style.transform = 'scale(1.1)';
            }
        });
        
        // 鼠标离开效果
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            
            const iconWrapper = this.querySelector('.game-icon-wrapper');
            if (iconWrapper) {
                iconWrapper.style.transform = 'scale(1)';
            }
        });
        
        // 点击波纹效果
        card.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
    });
}

// 创建波纹效果
function createRippleEffect(event, element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(13, 110, 253, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // 移除波纹元素
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 平滑滚动
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                const offsetTop = target.offsetTop - 80; // 考虑导航栏高度
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 性能优化
function initPerformanceOptimizations() {
    // 图片懒加载
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // 预加载关键资源
    preloadCriticalResources();
}

// 预加载关键资源
function preloadCriticalResources() {
    const criticalLinks = [
        '/games/epic-basketball.html',
        '/games/thief-puzzle.html',
        '/games/ultimate-moto.html',
        '/games/kick-the-pirate.html'
    ];
    
    // 在空闲时预加载
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            criticalLinks.forEach(link => {
                const linkElement = document.createElement('link');
                linkElement.rel = 'prefetch';
                linkElement.href = link;
                document.head.appendChild(linkElement);
            });
        });
    }
}

// 添加CSS动画关键帧
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    /* 提升用户体验的微交互 */
    .game-play-btn {
        position: relative;
        overflow: hidden;
    }
    
    .game-play-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }
    
    .game-play-btn:hover::before {
        left: 100%;
    }
    
    /* 加载状态优化 */
    .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
`;
document.head.appendChild(style);

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
});

// 页面可见性API - 优化性能
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时暂停动画
        document.body.style.animationPlayState = 'paused';
    } else {
        // 页面显示时恢复动画
        document.body.style.animationPlayState = 'running';
    }
});

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 工具函数：防抖
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// 导出供其他脚本使用
if (typeof window !== 'undefined') {
    window.GameSiteMain = {
        throttle,
        debounce,
        createRippleEffect
    };
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 