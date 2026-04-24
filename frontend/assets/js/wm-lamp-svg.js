/* ============================================================
   皖美信用 · 现代弧形落地灯 SVG · V4.0
   ------------------------------------------------------------
   设计：Arco 启发现代黄铜弧形落地灯
     · 矩形黑色大理石底座（厚重 + 金边）
     · 优雅弧形黄铜悬臂（Arco 标志性曲线）
     · 半球拉丝金属灯罩（哑光 + 内部反射）
     · 可见锥形光柱（罩底→地面 戏剧性光束）
     · 清晰椭圆地面聚光（双层 radial）
     · 极细金链 + 末端小圆珠（保留极简）
   原则：
     · 现代极简 → 去除所有传统装饰（骨架、字纹、回纹）
     · 黑金高级感公式 → 黑底座 + 黄铜杆 + 暖金光
     · 戏剧性光照 → 可见光柱 + 聚光地斑
   ============================================================ */
(function (global) {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';

    /**
     * ViewBox 420 x 640
     *   底座：矩形 (110, 540) to (310, 590)，高 50，宽 200
     *   弧形悬臂：起点 (210, 540)，弧过 (140, 360)，到达罩侧 (260, 180)
     *   灯罩：半球罩口朝下，主体 (235, 160)-(305, 210) 椭圆
     *   可见光柱：从罩底梯形到地面椭圆
     *   地面聚光：cy=605, rx=140, ry=14
     *   拉链：从罩底 (270, 210) 到垂珠 (290, 285)
     */
    function buildLampSVG() {
        return `
<svg
  xmlns="${SVG_NS}"
  viewBox="0 0 420 640"
  class="wm-lamp-svg"
  role="img"
  aria-label="现代落地灯 · 拉动垂链以启长明"
  focusable="false"
>
    <defs>
        <!-- 黄铜主色渐变（弧形悬臂） -->
        <linearGradient id="brassArm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#8A6B2B"/>
            <stop offset="30%"  stop-color="#D4AD68"/>
            <stop offset="55%"  stop-color="#EACC88"/>
            <stop offset="85%"  stop-color="#B89148"/>
            <stop offset="100%" stop-color="#6E5326"/>
        </linearGradient>
        <linearGradient id="brassArmLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#B8934A"/>
            <stop offset="50%"  stop-color="#F2D58A"/>
            <stop offset="100%" stop-color="#8A6B2B"/>
        </linearGradient>

        <!-- 大理石底座（深色磨砂） -->
        <linearGradient id="marbleBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#1E232D"/>
            <stop offset="50%" stop-color="#0F131B"/>
            <stop offset="100%" stop-color="#05070B"/>
        </linearGradient>
        <linearGradient id="marbleBaseLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#4A4538"/>
            <stop offset="50%" stop-color="#2C2820"/>
            <stop offset="100%" stop-color="#17140E"/>
        </linearGradient>

        <!-- 半球拉丝金属罩（熄时） -->
        <linearGradient id="shadeMetalOff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#3A3530"/>
            <stop offset="45%" stop-color="#564E42"/>
            <stop offset="80%" stop-color="#2E2A24"/>
            <stop offset="100%" stop-color="#18140E"/>
        </linearGradient>
        <linearGradient id="shadeMetalLightOff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#6E5E42"/>
            <stop offset="50%" stop-color="#4E4130"/>
            <stop offset="100%" stop-color="#2A2318"/>
        </linearGradient>

        <!-- 半球罩启灯时（罩口透暖金 + 外侧仍深色金属） -->
        <linearGradient id="shadeMetalOn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#2A2520"/>
            <stop offset="40%"  stop-color="#4A4032"/>
            <stop offset="80%"  stop-color="#B88C3E"/>
            <stop offset="100%" stop-color="#FFC97A"/>
        </linearGradient>

        <!-- 罩内灯泡辉光 -->
        <radialGradient id="bulbCore" cx="50%" cy="55%" r="45%">
            <stop offset="0%"   stop-color="#FFFAE0" stop-opacity="1"/>
            <stop offset="35%"  stop-color="#FFE4A3" stop-opacity="0.9"/>
            <stop offset="75%"  stop-color="#F5B85A" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#C9851F" stop-opacity="0"/>
        </radialGradient>

        <!-- 可见光柱（从罩底到地面的梯形渐变） -->
        <linearGradient id="lightBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#FFE4A3" stop-opacity="0.65"/>
            <stop offset="40%" stop-color="#FFD07A" stop-opacity="0.32"/>
            <stop offset="85%" stop-color="#E8B05A" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#C9A063" stop-opacity="0"/>
        </linearGradient>

        <!-- 地面聚光池 -->
        <radialGradient id="floorSpotCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#FFEFC0" stop-opacity="0.85"/>
            <stop offset="35%" stop-color="#F9C87A" stop-opacity="0.45"/>
            <stop offset="75%" stop-color="#C9A063" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="#C9A063" stop-opacity="0"/>
        </radialGradient>

        <!-- 罩外溢光 -->
        <radialGradient id="shadeBloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#FFE3A3" stop-opacity="0"/>
            <stop offset="55%" stop-color="#FFD07A" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#C9A063" stop-opacity="0"/>
        </radialGradient>

        <!-- 阴影/柔焦滤镜 -->
        <filter id="softDropShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dy="6"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softBlurV4" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8"/>
        </filter>
        <filter id="bigBlurV4" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18"/>
        </filter>

        <!-- 拉丝纹理（半球罩外表面的细横纹） -->
        <pattern id="brushedMetal" width="2" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3" x2="2" y2="3" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
        </pattern>
    </defs>

    <!-- ===== 罩外溢光（启灯后罩周围柔光） ===== -->
    <ellipse
        data-role="glow"
        cx="270" cy="188" rx="110" ry="95"
        fill="url(#shadeBloom)"
        filter="url(#bigBlurV4)"
        opacity="0"
        pointer-events="none"
    />

    <!-- ===== 可见光柱（罩底→地面梯形） ===== -->
    <path
        data-role="light-beam"
        d="M 240 212 L 300 212 L 380 590 L 160 590 Z"
        fill="url(#lightBeam)"
        opacity="0"
        pointer-events="none"
        filter="url(#softBlurV4)"
    />

    <!-- ===== 地面椭圆聚光（启灯后） ===== -->
    <g data-role="desk-pool-group">
        <!-- 外层柔边 -->
        <ellipse
            data-role="desk-pool-outer"
            cx="270" cy="605" rx="200" ry="28"
            fill="url(#floorSpotCenter)"
            opacity="0"
            pointer-events="none"
            filter="url(#softBlurV4)"
        />
        <!-- 内层清晰中心 -->
        <ellipse
            data-role="desk-pool"
            cx="270" cy="605" rx="140" ry="18"
            fill="url(#floorSpotCenter)"
            opacity="0"
            pointer-events="none"
        />
    </g>

    <!-- ===== 爆发波（段4 启灯） ===== -->
    <circle
        data-role="burst"
        cx="270" cy="190" r="20"
        fill="none"
        stroke="#F9C87A"
        stroke-width="1.2"
        opacity="0"
        pointer-events="none"
    />

    <!-- ===== 底座投影 ===== -->
    <ellipse cx="210" cy="595" rx="110" ry="5" fill="rgba(0,0,0,0.7)" filter="url(#softBlurV4)"/>

    <!-- ===== 矩形大理石底座 ===== -->
    <g data-role="base">
        <!-- 主体 -->
        <rect x="110" y="540" width="200" height="48" fill="url(#marbleBase)" rx="2"/>
        <!-- 顶面高光线 -->
        <line x1="112" y1="542" x2="308" y2="542" stroke="url(#brassArm)" stroke-width="0.7" opacity="0.85"/>
        <!-- 前沿金细边 -->
        <line x1="110" y1="586" x2="310" y2="586" stroke="url(#brassArm)" stroke-width="0.4" opacity="0.6"/>
        <!-- 侧沿微高光 -->
        <line x1="112" y1="545" x2="112" y2="585" stroke="rgba(255,220,140,0.08)" stroke-width="0.6"/>
        <line x1="308" y1="545" x2="308" y2="585" stroke="rgba(255,220,140,0.08)" stroke-width="0.6"/>
        <!-- 大理石纹理极淡 -->
        <g opacity="0.15" stroke="#3A3830" stroke-width="0.3" fill="none">
            <path d="M 130 560 Q 160 555 200 560 Q 240 565 280 560"/>
            <path d="M 140 572 Q 180 568 220 572 Q 260 576 295 572"/>
        </g>
        <!-- 底座上方连接处（弧臂基座） -->
        <rect x="200" y="534" width="20" height="10" fill="url(#brassArm)" rx="1"/>
        <circle cx="210" cy="538" r="3" fill="#F2D58A" opacity="0.85"/>
    </g>

    <!-- ===== 弧形黄铜悬臂 ===== -->
    <g data-role="column">
        <!-- 主弧臂（描边不填充，模拟弯折管） -->
        <path
            data-role="arm-path"
            d="M 210 534 Q 210 380 150 260 Q 150 200 210 174 Q 250 170 260 172"
            fill="none"
            stroke="url(#brassArm)"
            stroke-width="10"
            stroke-linecap="round"
            filter="url(#softDropShadow)"
        />
        <!-- 弧臂高光线（细条亮线沿弧） -->
        <path
            d="M 212 540 Q 214 400 156 262 Q 155 204 212 176 Q 252 172 258 174"
            fill="none"
            stroke="#F5D68E"
            stroke-width="1.4"
            stroke-linecap="round"
            opacity="0.75"
        />
        <!-- 悬臂末端连接环（罩与臂之间） -->
        <circle cx="258" cy="172" r="5" fill="url(#brassArm)" stroke="#6E5326" stroke-width="0.5"/>
        <circle cx="258" cy="172" r="2.5" fill="#2A2218"/>
    </g>

    <!-- ===== 半球拉丝金属灯罩 ===== -->
    <g data-role="shade-group">
        <!-- 罩主体（倒扣半椭圆，口朝下） -->
        <path
            data-role="shade-body"
            d="M 230 178 Q 270 140 310 178 L 308 215 Q 270 225 232 215 Z"
            fill="url(#shadeMetalOff)"
            stroke="#6E5326"
            stroke-width="0.4"
        />
        <!-- 罩顶高光弧（金属反光） -->
        <path
            d="M 240 170 Q 270 150 300 170"
            fill="none"
            stroke="rgba(255,230,160,0.5)"
            stroke-width="1.2"
            stroke-linecap="round"
        />
        <!-- 罩顶反光亮点 -->
        <ellipse cx="265" cy="162" rx="8" ry="2" fill="rgba(255,245,200,0.45)"/>
        <!-- 罩边缘金边（下沿） -->
        <path
            d="M 232 215 Q 270 225 308 215"
            fill="none"
            stroke="url(#brassArm)"
            stroke-width="1.2"
            opacity="0.9"
        />
        <!-- 拉丝纹理覆层 -->
        <path
            d="M 230 178 Q 270 140 310 178 L 308 215 Q 270 225 232 215 Z"
            fill="url(#brushedMetal)"
            opacity="0.4"
            pointer-events="none"
        />

        <!-- 罩内灯泡（启灯时显现） -->
        <ellipse
            data-role="bulb"
            cx="270" cy="198" rx="16" ry="18"
            fill="url(#bulbCore)"
            opacity="0"
            pointer-events="none"
        />
        <!-- 罩内光晕层（更大范围柔光） -->
        <ellipse
            data-role="bulb-halo"
            cx="270" cy="198" rx="32" ry="28"
            fill="url(#bulbCore)"
            opacity="0"
            filter="url(#softBlurV4)"
            pointer-events="none"
        />

        <!-- 启灯时罩内壁反光（改变罩色） -->
        <path
            data-role="shade-body-on"
            d="M 230 178 Q 270 140 310 178 L 308 215 Q 270 225 232 215 Z"
            fill="url(#shadeMetalOn)"
            opacity="0"
            pointer-events="none"
        />

        <!-- 熄灭态蒙层（额外压暗） -->
        <rect
            data-role="shade-dim"
            x="225" y="138" width="90" height="90"
            fill="#05070B"
            opacity="0.3"
            pointer-events="none"
        />

        <!-- 罩底开口的内部发光圆（启灯时，罩底看到灯泡底部） -->
        <ellipse
            data-role="shade-underlight"
            cx="270" cy="218" rx="36" ry="6"
            fill="#FFD880"
            opacity="0"
            filter="url(#softBlurV4)"
            pointer-events="none"
        />
    </g>

    <!-- ===== 极细金属链 + 小垂珠 ===== -->
    <g data-role="chain-group">
        <path
            data-role="chain-path"
            d="M 290 220 Q 292 252 290 285"
            stroke="url(#brassArm)"
            stroke-width="0.8"
            fill="none"
            opacity="0.9"
        />
        <path
            data-role="chain-thread"
            d="M 290 220 Q 292 252 290 285"
            stroke="#8A6B2B"
            stroke-width="0.25"
            fill="none"
            opacity="0.6"
        />
    </g>

    <!-- ===== 拖拽把手：小圆珠 ===== -->
    <g data-role="handle-group" class="wm-seal-handle" tabindex="0" role="button" aria-label="拉动垂链以启长明">
        <!-- 透明 hit-area -->
        <circle
            data-role="handle-hitarea"
            cx="290" cy="290" r="22"
            fill="rgba(255,255,255,0.001)"
            pointer-events="all"
        />
        <!-- 小黄铜球 -->
        <circle
            cx="290" cy="290" r="5"
            fill="url(#brassArm)"
            stroke="#6E5326"
            stroke-width="0.5"
            filter="url(#softDropShadow)"
            pointer-events="none"
        />
        <!-- 反光点 -->
        <circle cx="288.5" cy="288" r="1.3" fill="#FFF8D8" opacity="0.95" pointer-events="none"/>
        <!-- 邀约呼吸光 -->
        <circle
            data-role="handle-pulse"
            cx="290" cy="290" r="12"
            fill="none"
            stroke="#F5D68E"
            stroke-width="1"
            opacity="0"
            pointer-events="none"
        />
    </g>

    <!-- ===== 底座阴影（启灯后加强桌面反光） ===== -->
    <ellipse
        data-role="base-reflect"
        cx="210" cy="608" rx="75" ry="3"
        fill="#FFD880"
        opacity="0"
        filter="url(#softBlurV4)"
        pointer-events="none"
    />
</svg>
`;
    }

    /**
     * 中心印鉴（保留接口，V4 默认不使用）
     */
    function buildStampedMark() {
        return `
<svg xmlns="${SVG_NS}" viewBox="0 0 200 200" role="img" aria-label="皖美信用印鉴">
    <defs>
        <radialGradient id="stampBgV4" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#C41921"/>
            <stop offset="70%" stop-color="#A41118"/>
            <stop offset="100%" stop-color="#7A0A10"/>
        </radialGradient>
    </defs>
    <rect x="14" y="14" width="172" height="172" fill="url(#stampBgV4)" stroke="#6A0A0E" stroke-width="1.5" rx="2"/>
    <rect x="22" y="22" width="156" height="156" fill="none" stroke="#FFE9B5" stroke-width="0.8" opacity="0.55" rx="1"/>
    <g font-family="SimSun, STSong, serif" font-weight="900" fill="#FFE9B5" text-anchor="middle" opacity="0.88">
        <text x="64"  y="90"  font-size="40">皖</text>
        <text x="136" y="90"  font-size="40">美</text>
        <text x="64"  y="158" font-size="40">信</text>
        <text x="136" y="158" font-size="40">用</text>
    </g>
</svg>
`;
    }

    global.WMLamp = { buildLampSVG, buildStampedMark };
    global.WMSeal = { buildSealSVG: buildLampSVG, buildStampedMark: buildStampedMark };

    // 浅色版主题时替换为浅色 gradient 的 helper（由 CSS 驱动为主，此函数保留接口）
    global.WMLamp.getLightThemeMetalOff = () => 'url(#shadeMetalLightOff)';

})(typeof window !== 'undefined' ? window : this);
