/* =============================================================
   皖美信用 · 身份认证与权限
   ============================================================= */
(function () {
    'use strict';

    const Auth = {
        login(userId) {
            const user = window.WM_STORE.getUser(userId);
            if (!user) return null;
            localStorage.setItem(window.WM_KEYS.CURRENT_USER, JSON.stringify(user));
            return user;
        },

        logout() {
            localStorage.removeItem(window.WM_KEYS.CURRENT_USER);
            window.location.href = 'login.html';
        },

        currentUser() {
            try {
                const raw = localStorage.getItem(window.WM_KEYS.CURRENT_USER);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },

        isLoggedIn() { return this.currentUser() !== null; },

        // 页面守卫：未登录强制跳转到登录页（除 login.html 和 index.html 之外）
        guard(options) {
            options = options || {};
            const allowAnonymous = options.allowAnonymous || false;
            if (!this.isLoggedIn() && !allowAnonymous) {
                const back = encodeURIComponent(window.location.pathname.split('/').pop());
                window.location.href = 'login.html?redirect=' + back;
                return false;
            }
            return true;
        },

        // 切换角色
        switchRole(userId) {
            this.login(userId);
            window.location.reload();
        },

        // 权限检查
        can(action) {
            const user = this.currentUser();
            if (!user) return false;
            if (user.permissions && user.permissions.indexOf('*') >= 0) return true;
            return user.permissions && user.permissions.indexOf(action) >= 0;
        },

        // 获取角色首页URL
        roleHomeUrl(user) {
            user = user || this.currentUser();
            if (!user) return 'login.html';
            // 省国资委走驾驶舱，其他走工作台
            if (user.role === 'sasac_chief' || user.role === 'sasac_officer') {
                return 'workbench.html';
            }
            return 'workbench.html';
        },
    };

    window.WM_AUTH = Auth;
})();
