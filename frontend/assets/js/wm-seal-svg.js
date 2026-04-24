/* ============================================================
   皖美信用之印 · SVG 模板构造（WMSeal）
   ------------------------------------------------------------
   原创声明：本 SVG 由本次项目原创设计，组件拆解：
     · 印盒（底座 + 内腔 + 金线）
     · 朱漆绶带（双飘带 + 系扣）
     · 印章身（方印体 + 徽派马头墙钮 + 朱泥正面）
     · 印面（篆隶"皖美信用"四字）
     · 落印印鉴（中心版本）
   状态驱动：通过 CSS/JS 根属性 data-stage 切换呈现
   ============================================================ */
(function (global) {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';

    /**
     * 构建信印 SVG 完整结构
     * 输出标签：内部元素带 data-role 方便 JS 动画 & CSS 驱动
     *
     * ViewBox 420 x 480：
     *   印盒中心在 y=360，宽 300，高 70
     *   印章身默认静置：x=110, y=130, w=200, h=230
     *   绶带系扣默认：cx=210, cy=360（系扣顶部中央）
     */
    function buildSealSVG() {
        return `
<svg
  xmlns="${SVG_NS}"
  viewBox="0 0 420 480"
  class="wm-seal-svg"
  role="img"
  aria-label="皖美信用之印 · 拖拽朱漆绶带以启封"
  focusable="false"
>
    <defs>
        <!-- 朱泥印面主色渐变 -->
        <linearGradient id="zhuniFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C41921"/>
            <stop offset="60%" stop-color="#A41118"/>
            <stop offset="100%" stop-color="#7A0A10"/>
        </linearGradient>
        <!-- 印章侧身阴影 -->
        <linearGradient id="zhuniSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6E080D"/>
            <stop offset="50%" stop-color="#8A0F14"/>
            <stop offset="100%" stop-color="#6E080D"/>
        </linearGradient>
        <!-- 鎏金边 -->
        <linearGradient id="liujinEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#E8C87A"/>
            <stop offset="50%" stop-color="#C9A063"/>
            <stop offset="100%" stop-color="#9E7D3C"/>
        </linearGradient>
        <!-- 徽墨底座 -->
        <linearGradient id="huimoBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1C222E"/>
            <stop offset="50%" stop-color="#0F1420"/>
            <stop offset="100%" stop-color="#070A12"/>
        </linearGradient>
        <!-- 印盒内腔朱绒 -->
        <radialGradient id="innerVelvet" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#6D0A0E"/>
            <stop offset="100%" stop-color="#320306"/>
        </radialGradient>
        <!-- 绶带朱漆 -->
        <linearGradient id="sashRed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#9A0F14"/>
            <stop offset="45%" stop-color="#D8161F"/>
            <stop offset="55%" stop-color="#D8161F"/>
            <stop offset="100%" stop-color="#9A0F14"/>
        </linearGradient>
        <!-- 启封光晕 -->
        <radialGradient id="unsealGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFE9B5" stop-opacity="0.55"/>
            <stop offset="40%" stop-color="#C9A063" stop-opacity="0.30"/>
            <stop offset="100%" stop-color="#C9A063" stop-opacity="0"/>
        </radialGradient>
        <!-- 扩散波 -->
        <radialGradient id="burstWave" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
            <stop offset="85%" stop-color="#C9A063" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#C9A063" stop-opacity="0"/>
        </radialGradient>
        <!-- 模糊 filter -->
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6"/>
        </filter>
        <filter id="softBlur4">
            <feGaussianBlur stdDeviation="3"/>
        </filter>
        <!-- 阴影 -->
        <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dy="4"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.45"/>
            </feComponentTransfer>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>

    <!-- 启封光晕底（段4+段6） -->
    <circle
        data-role="glow"
        cx="210" cy="260" r="190"
        fill="url(#unsealGlow)"
        filter="url(#softGlow)"
        opacity="0"
        pointer-events="none"
    />

    <!-- 落印扩散波 -->
    <circle
        data-role="burst"
        cx="210" cy="260" r="20"
        fill="none"
        stroke="#C9A063"
        stroke-width="1"
        opacity="0"
        pointer-events="none"
    />

    <!-- ===== 印盒（底座） ===== -->
    <g class="wm-seal-box-breathe" data-role="box">
        <!-- 底座阴影 -->
        <ellipse cx="210" cy="445" rx="160" ry="12" fill="rgba(0,0,0,0.45)" filter="url(#softBlur4)"/>

        <!-- 印盒主体 -->
        <path
            d="M 60 345 Q 60 335 72 332 L 348 332 Q 360 335 360 345 L 360 410 Q 360 420 348 422 L 72 422 Q 60 420 60 410 Z"
            fill="url(#huimoBase)"
            stroke="url(#liujinEdge)"
            stroke-width="0.8"
            opacity="0.98"
        />

        <!-- 内腔朱绒 -->
        <path
            d="M 78 342 L 342 342 L 342 384 Q 210 398 78 384 Z"
            fill="url(#innerVelvet)"
            opacity="0.85"
        />

        <!-- 左侧徽派马头墙小纹饰 -->
        <g opacity="0.45">
            <polyline points="72,400 80,392 80,400 88,392 88,400 96,392 96,400" fill="none" stroke="#C9A063" stroke-width="0.6"/>
            <polyline points="324,400 332,392 332,400 340,392 340,400 348,392 348,400" fill="none" stroke="#C9A063" stroke-width="0.6"/>
        </g>

        <!-- 底部金线 -->
        <line x1="70" y1="418" x2="350" y2="418" stroke="url(#liujinEdge)" stroke-width="0.5" opacity="0.6"/>
    </g>

    <!-- ===== 朱漆绶带（跟随状态翻转） ===== -->
    <g data-role="sash-group">
        <!-- 左飘带 -->
        <path
            data-role="sash-left"
            d="M 175 345 Q 160 390 140 432 Q 135 442 145 444 Q 160 442 165 435 Q 185 395 195 355 Z"
            fill="url(#sashRed)"
            stroke="#6A080D"
            stroke-width="0.5"
            opacity="0.92"
        />
        <!-- 右飘带 -->
        <path
            data-role="sash-right"
            d="M 245 345 Q 260 390 280 432 Q 285 442 275 444 Q 260 442 255 435 Q 235 395 225 355 Z"
            fill="url(#sashRed)"
            stroke="#6A080D"
            stroke-width="0.5"
            opacity="0.92"
        />
        <!-- 绶带金丝 -->
        <path data-role="sash-thread-l" d="M 178 345 Q 165 390 148 435" stroke="#E8C87A" stroke-width="0.4" fill="none" opacity="0.5"/>
        <path data-role="sash-thread-r" d="M 242 345 Q 255 390 272 435" stroke="#E8C87A" stroke-width="0.4" fill="none" opacity="0.5"/>
    </g>

    <!-- ===== 系扣（可拖拽把手） ===== -->
    <g data-role="handle-group" class="wm-seal-handle" tabindex="0" role="button" aria-label="拨动绶带以启封信印">
        <!-- 透明 hit-area（扩大交互点击范围 + 保证 SVG hit-testing 稳定） -->
        <circle
            data-role="handle-hitarea"
            cx="210" cy="360" r="28"
            fill="rgba(255,255,255,0.001)"
            pointer-events="all"
        />
        <!-- 系扣本体 -->
        <circle
            data-role="handle"
            cx="210" cy="360" r="12"
            fill="url(#liujinEdge)"
            stroke="#8A6B2B"
            stroke-width="1"
            pointer-events="none"
        />
        <!-- 系扣内环 -->
        <circle cx="210" cy="360" r="7" fill="none" stroke="#FFE9B5" stroke-width="0.6" opacity="0.7" pointer-events="none"/>
        <circle cx="210" cy="360" r="3" fill="#6A4B1E" opacity="0.8" pointer-events="none"/>
        <!-- 邀约呼吸光 -->
        <circle
            data-role="handle-pulse"
            cx="210" cy="360" r="16"
            fill="none"
            stroke="#E8C87A"
            stroke-width="1.5"
            opacity="0"
            pointer-events="none"
        />
    </g>

    <!-- ===== 印章身 ===== -->
    <g data-role="seal-body" transform="translate(0, 0)" style="transform-origin: 210px 260px;">
        <!-- 印章侧面（3D 厚度） -->
        <path
            data-role="seal-side"
            d="M 110 150 L 110 330 L 310 330 L 310 150 Z"
            fill="url(#zhuniSide)"
            opacity="0.85"
        />
        <!-- 印章顶部（马头墙印钮） -->
        <g data-role="seal-knob">
            <!-- 主墙体 -->
            <path
                d="M 150 150 L 150 110 L 175 110 L 175 95 L 200 95 L 200 78 L 220 78 L 220 95 L 245 95 L 245 110 L 270 110 L 270 150 Z"
                fill="#2A1410"
                stroke="url(#liujinEdge)"
                stroke-width="0.6"
            />
            <!-- 马头墙阶梯装饰 -->
            <polyline points="155,120 165,115 165,120 175,115 175,120 185,115 185,120 195,115 195,120 205,110 205,120 215,110 215,120 225,115 225,120 235,115 235,120 245,115 245,120 255,115 255,120 265,115"
                fill="none" stroke="#C9A063" stroke-width="0.5" opacity="0.65"/>
            <!-- 中心小孔 -->
            <ellipse cx="210" cy="125" rx="6" ry="3" fill="#1A0A08"/>
            <ellipse cx="210" cy="124" rx="5" ry="2" fill="#3A1F1A" opacity="0.7"/>
        </g>

        <!-- 印章正面（朱泥印面朝下 / 朝外双态） -->
        <g data-role="seal-face-group">
            <!-- 朱泥正面（FACE_DOWN 默认蒙尘，FACE_UP 启封后朝外） -->
            <rect
                data-role="seal-face"
                x="115" y="152" width="190" height="178"
                fill="url(#zhuniFace)"
                stroke="url(#liujinEdge)"
                stroke-width="0.8"
                rx="2" ry="2"
            />
            <!-- 印面内阴影 -->
            <rect x="118" y="155" width="184" height="172" fill="none" stroke="#5A0507" stroke-width="0.4" opacity="0.6" rx="1"/>

            <!-- 篆隶"皖美信用"四字（2x2 布局） -->
            <g data-role="seal-chars" font-family="SimSun, STSong, serif" font-weight="900" fill="#FFE9B5" text-anchor="middle" opacity="0">
                <!-- 皖 -->
                <text x="160" y="220" font-size="50" letter-spacing="2">皖</text>
                <!-- 美 -->
                <text x="260" y="220" font-size="50" letter-spacing="2">美</text>
                <!-- 信 -->
                <text x="160" y="295" font-size="50" letter-spacing="2">信</text>
                <!-- 用 -->
                <text x="260" y="295" font-size="50" letter-spacing="2">用</text>
                <!-- 中心十字分隔 -->
                <line x1="130" y1="241" x2="290" y2="241" stroke="#FFE9B5" stroke-width="0.4" opacity="0.35"/>
                <line x1="210" y1="160" x2="210" y2="322" stroke="#FFE9B5" stroke-width="0.4" opacity="0.35"/>
            </g>

            <!-- 蒙尘遮罩（封存态） -->
            <rect
                data-role="seal-dust"
                x="115" y="152" width="190" height="178"
                fill="#0D1119"
                opacity="0.55"
                rx="2" ry="2"
                pointer-events="none"
            />
        </g>

        <!-- 印章底部（落点） -->
        <rect
            data-role="seal-bottom"
            x="110" y="325" width="200" height="8"
            fill="#5A0608"
            opacity="0.85"
        />
    </g>

    <!-- 印盒前缘（遮住印章身下部，营造"嵌入"感） -->
    <path
        data-role="box-front"
        d="M 60 345 Q 60 335 72 332 L 348 332 Q 360 335 360 345 L 360 365 L 60 365 Z"
        fill="url(#huimoBase)"
        stroke="url(#liujinEdge)"
        stroke-width="0.8"
        opacity="0.95"
    />
</svg>
`;
    }

    /**
     * 构建中心落印印鉴 SVG（段4 浮现于页面中心）
     */
    function buildStampedMark() {
        return `
<svg xmlns="${SVG_NS}" viewBox="0 0 200 200" class="wm-stamped-svg" role="img" aria-label="皖美信用印鉴">
    <defs>
        <radialGradient id="stampBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#C41921"/>
            <stop offset="70%" stop-color="#A41118"/>
            <stop offset="100%" stop-color="#7A0A10"/>
        </radialGradient>
    </defs>
    <!-- 外框（双层方框） -->
    <rect x="10" y="10" width="180" height="180" fill="url(#stampBg)" stroke="#6A0A0E" stroke-width="2" rx="3"/>
    <rect x="18" y="18" width="164" height="164" fill="none" stroke="#FFE9B5" stroke-width="1" opacity="0.6" rx="2"/>
    <!-- 四字 -->
    <g font-family="SimSun, STSong, serif" font-weight="900" fill="#FFE9B5" text-anchor="middle" opacity="0.92">
        <text x="64" y="90" font-size="44" letter-spacing="1">皖</text>
        <text x="136" y="90" font-size="44" letter-spacing="1">美</text>
        <text x="64" y="158" font-size="44" letter-spacing="1">信</text>
        <text x="136" y="158" font-size="44" letter-spacing="1">用</text>
        <line x1="30" y1="106" x2="170" y2="106" stroke="#FFE9B5" stroke-width="0.5" opacity="0.45"/>
        <line x1="100" y1="30" x2="100" y2="170" stroke="#FFE9B5" stroke-width="0.5" opacity="0.45"/>
    </g>
    <!-- 斑驳纹（印章做旧质感） -->
    <g opacity="0.18" fill="#0F0306">
        <circle cx="30" cy="50" r="2"/>
        <circle cx="165" cy="40" r="1.5"/>
        <circle cx="40" cy="160" r="1.8"/>
        <circle cx="150" cy="150" r="2.2"/>
        <circle cx="100" cy="20" r="1"/>
        <circle cx="180" cy="100" r="1.4"/>
    </g>
</svg>
`;
    }

    global.WMSeal = { buildSealSVG, buildStampedMark };

})(typeof window !== 'undefined' ? window : this);
