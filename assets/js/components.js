/**
 * 公共组件库 - GameBox Hub
 * 维护所有页面的公共HTML组件
 */

// 网站配置
const SITE_CONFIG = {
    siteName: 'GameBox Hub',
    domain: 'https://gamebox.games',
    logoPath: '/assets/images/logo/logo-horizontal-gamepad.svg',
    games: [
        { name: 'Epic Basketball', url: '/games/epic-basketball.html', icon: '🏀' },
        { name: 'Thief Puzzle', url: '/games/thief-puzzle.html', icon: '🧩' },
        { name: 'Ultimate Moto', url: '/games/ultimate-moto.html', icon: '🏎️' },
        { name: 'Kick the Pirate', url: '/games/kick-the-pirate.html', icon: '⚔️' }
    ]
};

/**
 * 公共导航栏组件
 * @param {string} activePage - 当前激活的页面 ('home', 'categories', 'about')
 * @returns {string} HTML字符串
 */
function renderNavbar(activePage = '') {
    const isActive = (page) => activePage === page ? 'active fw-medium' : 'fw-medium';
    const ariaCurrent = (page) => activePage === page ? 'aria-current="page"' : '';
    
    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="/">
                <img src="${SITE_CONFIG.logoPath}" alt="${SITE_CONFIG.siteName} Logo" height="30" class="me-2">
            </a>
            
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link ${isActive('home')}" href="/" ${ariaCurrent('home')}>Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${isActive('categories')}" href="/categories.html" ${ariaCurrent('categories')}>Categories</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${isActive('about')}" href="/about.html" ${ariaCurrent('about')}>About</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `;
}

/**
 * 面包屑导航组件
 * @param {Array} breadcrumbs - 面包屑数组 [{ name: '', url: '' }, ...]
 * @returns {string} HTML字符串
 */
function renderBreadcrumb(breadcrumbs) {
    if (!breadcrumbs || breadcrumbs.length === 0) return '';
    
    const breadcrumbItems = breadcrumbs.map((item, index) => {
        if (index === breadcrumbs.length - 1) {
            // 最后一个是当前页面
            return `<li class="breadcrumb-item active" aria-current="page">${item.name}</li>`;
        } else {
            return `<li class="breadcrumb-item"><a href="${item.url}">${item.name}</a></li>`;
        }
    }).join('');
    
    return `
    <section class="breadcrumb-section bg-light py-3">
        <div class="container">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    ${breadcrumbItems}
                </ol>
            </nav>
        </div>
    </section>
    `;
}

/**
 * 公共Footer组件
 * @param {boolean} showStats - 是否显示统计信息（首页显示）
 * @returns {string} HTML字符串
 */
function renderFooter(showStats = false) {
    const statsSection = showStats ? `
        <div class="footer-stats">
            <div class="stat-item">
                <span class="stat-number">4+</span>
                <span class="stat-label">Quality Games</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">100%</span>
                <span class="stat-label">Free</span>
            </div>
        </div>
    ` : '';
    
    const gameLinks = SITE_CONFIG.games.map(game => 
        `<li><a href="${game.url}">${game.icon} ${game.name}</a></li>`
    ).join('');
    
    return `
    <footer class="footer-modern bg-dark text-white py-5">
        <div class="container">
            <div class="row">
                <div class="col-lg-6 mb-4 mb-lg-0">
                    <div class="footer-brand mb-3">
                        <div class="brand-icon me-2">🎮</div>
                        <span class="brand-text h5 mb-0">GameBox Hub</span>
                    </div>
                    <p class="footer-description text-muted mb-3">
                        Providing high-quality free online gaming experiences for players worldwide, no download required - click and play instantly.
                    </p>
                    ${statsSection}
                </div>
                <div class="col-lg-6">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <h6 class="footer-title">Game Categories</h6>
                            <ul class="footer-links">
                                ${gameLinks}
                            </ul>
                        </div>
                        <div class="col-md-6 mb-3">
                            <h6 class="footer-title">About Us</h6>
                            <ul class="footer-links">
                                <li><a href="/about.html">About Us</a></li>
                                <li><a href="mailto:contact@gamebox.games">Contact Us</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="footer-divider my-4">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <p class="footer-copyright mb-0">
                        &copy; 2025 GameBox Hub. All rights reserved.
                    </p>
                </div>
                <div class="col-lg-6 text-lg-end">
                    <p class="footer-update mb-0">
                        <small class="text-muted">Last updated: June 16, 2025</small>
                    </p>
                </div>
            </div>
        </div>
    </footer>
    `;
}

/**
 * 游戏页面标题部分组件
 * @param {Object} gameInfo - 游戏信息 { title, description, icon, tags }
 * @returns {string} HTML字符串
 */
function renderGameTitleSection(gameInfo) {
    const tags = gameInfo.tags ? gameInfo.tags.map(tag => 
        `<span class="badge bg-dark text-light me-2">${tag}</span>`
    ).join('') : '';
    
    return `
    <section class="game-title-section py-4 bg-primary text-white">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-8">
                    <h1 class="display-5 fw-bold mb-2">${gameInfo.title}</h1>
                    <p class="lead mb-3">${gameInfo.icon} ${gameInfo.description}</p>
                    <div class="game-tags">
                        ${tags}
                    </div>
                </div>
                <div class="col-lg-4 text-center">
                    <div class="game-icon-large">
                        ${gameInfo.icon}
                    </div>
                </div>
            </div>
        </div>
    </section>
    `;
}

/**
 * 游戏控制按钮组件
 * @returns {string} HTML字符串
 */
function renderGameControls() {
    return `
    <div class="game-controls">
        <button class="btn btn-outline-primary btn-sm" onclick="toggleFullscreen()" id="fullscreenBtn">
            📺 Fullscreen
        </button>
        <button class="btn btn-outline-secondary btn-sm" onclick="reloadGame()">
            🔄 Reload
        </button>
    </div>
    `;
}

/**
 * 相关游戏推荐组件
 * @param {string} currentGame - 当前游戏名称，用于排除
 * @returns {string} HTML字符串
 */
function renderRelatedGames(currentGame = '') {
    // 为每个游戏定义详细描述
    const gameDescriptions = {
        'Epic Basketball': 'Experience real basketball shooting challenges and test your shooting skills.',
        'Thief Puzzle': 'Challenge your wisdom and help the thief complete various puzzle tasks.',
        'Ultimate Moto': 'Experience high-speed motorcycle racing and challenge various tracks.',
        'Kick the Pirate': 'Join epic pirate battles and showcase your combat skills.'
    };
    
    // 为每个游戏定义主题类
    const gameThemes = {
        'Epic Basketball': 'basketball-theme',
        'Thief Puzzle': 'puzzle-theme',
        'Ultimate Moto': 'racing-theme',
        'Kick the Pirate': 'action-theme'
    };
    
    // 为每个游戏定义分类
    const gameCategories = {
        'Epic Basketball': 'Sports',
        'Thief Puzzle': 'Puzzle',
        'Ultimate Moto': 'Racing',
        'Kick the Pirate': 'Action'
    };
    
    const relatedGames = SITE_CONFIG.games
        .filter(game => game.name !== currentGame)
        .slice(0, 3)
        .map(game => `
            <div class="related-game-card" data-aos="fade-up" data-aos-delay="100">
                <div class="related-game-inner" style="background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/assets/images/thumbnails/${game.name.toLowerCase().replace(' ', '-')}-thumb.jpg'); background-size: cover; background-position: center;">
                    <div class="related-game-header ${gameThemes[game.name]}">
                        <div class="related-game-icon">${game.icon}</div>
                        <div class="related-game-category">${gameCategories[game.name]}</div>
                    </div>
                    <div class="related-game-body">
                        <h3 class="related-game-title" style="color: white;">${game.name}</h3>
                        <p class="related-game-description" style="color: rgba(255,255,255,0.9);">${gameDescriptions[game.name]}</p>
                    </div>
                    <div class="related-game-footer">
                        <a href="${game.url}" class="related-game-btn">
                            <span class="btn-icon">${game.icon}</span>
                            <span class="btn-text">Play Now</span>
                            <span class="btn-arrow">→</span>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    
    return `
    <section class="related-games-modern">
        <div class="container">
            <div class="section-header-center">
                <div class="section-badge">
                    <span class="badge-icon">🎮</span>
                    <span class="badge-text">More Exciting</span>
                </div>
                <h2 class="section-title-large">Recommended Games</h2>
                <p class="section-description" style="color: white;">Discover more interesting games and continue your gaming journey</p>
            </div>
            
            <div class="related-games-grid">
                ${relatedGames}
            </div>
        </div>
    </section>
    `;
}

/**
 * 初始化公共组件
 * 在DOM加载完成后自动渲染组件
 */
function initComponents() {
    // 如果页面已经有手动设置的组件，则不自动渲染
    const hasNavbar = document.querySelector('.navbar');
    const hasFooter = document.querySelector('footer');
    
    if (!hasNavbar) {
        console.warn('未找到导航栏，请手动调用renderNavbar()函数');
    }
    
    if (!hasFooter) {
        console.warn('未找到Footer，请手动调用renderFooter()函数');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initComponents);

// 导出到全局作用域
window.GameBoxComponents = {
    renderNavbar,
    renderBreadcrumb,
    renderFooter,
    renderGameTitleSection,
    renderGameControls,
    renderRelatedGames,
    SITE_CONFIG
}; 