(function () {
    const PANEL_SETTINGS = {
        columnWidth: 25,
        gap: 4,
        sidePadding: 16,
        trackHeight: 100,
        topPadding: 50,
        bottomPadding: 50,
        sliderWidth: 4,
        knobRadius: 6,
        trackRadius: 6,
        trackBorder: 1,
    };

    const PANEL_COLORS = {
        background: "#12151d",
        track: "#191d26",
        trackBorder: "#2a3240",
        active: "#cfd4dc",
        knobFill: "#f1f3f8",
        knobStroke: "#202733",
        valueText: "#d8dce6",
        labelText: "#7f8696",
        emptyText: "#6c7487",
    };

    let MIN_PANEL_WIDTH = 160;
    const OUTER_MARGIN_DEFAULT = 6;
    let OUTER_MARGIN = OUTER_MARGIN_DEFAULT;
    let LOAD_BTN_WIDTH = 80;
    let LOAD_BTN_HEIGHT = 26;
    let NODE_WIDTH_EXTRA = 12;
    let NODE_HEIGHT_EXTRA = 20;

    const $ = (id) => document.getElementById(id);
    const promptsInput = $("promptsInput");
    const loadBtn = $("loadBtn");
    const resetBtn = $("resetBtn");
    const linkBtn = $("linkBtn");
    const unlinkBtn = $("unlinkBtn");
    const promptsDot = $("promptsDot");
    const outDot = $("outDot");
    const canvas = $("sliderCanvas");
    const nodeContainer = $("nodeContainer");
    const inp_columnWidth = $("inp_columnWidth");
    const inp_gap = $("inp_gap");
    const inp_sidePadding = $("inp_sidePadding");
    const inp_trackHeight = $("inp_trackHeight");
    const inp_topPadding = $("inp_topPadding");
    const inp_bottomPadding = $("inp_bottomPadding");
    const inp_sliderWidth = $("inp_sliderWidth");
    const inp_knobRadius = $("inp_knobRadius");
    const inp_trackRadius = $("inp_trackRadius");
    const inp_trackBorder = $("inp_trackBorder");
    const inp_minPanelWidth = $("inp_minPanelWidth");
    const inp_outerMargin = $("inp_outerMargin");
    const inp_btnWidth = $("inp_btnWidth");
    const inp_btnHeight = $("inp_btnHeight");
    const inp_nodeWidthExtra = $("inp_nodeWidthExtra");
    const inp_nodeHeightExtra = $("inp_nodeHeightExtra");

    const ctx = canvas.getContext("2d");

    const state = {
        prompts: [],
        layout: [],
        draggingIndex: null,
        isLinked: false,
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const clampToRange = (value) => {
        if (typeof value === "number" && Number.isFinite(value)) return clamp(value, 0, 2);
        const n = parseFloat(value);
        if (!Number.isFinite(n)) return 1.0;
        return clamp(n, 0, 2);
    };
    const parsePrompts = (raw) => {
        if (!raw) return [];
        return raw
            .split(/[\n,]/)
            .map((t) => t.trim())
            .filter((t, i, arr) => t && arr.indexOf(t) === i);
    };
    const drawRoundedRect = (ctx, x, y, width, height, radius) => {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };
    const formatFloat = (value) => (Number(value).toFixed(1));

    const computeSize = () => {
        const count = Math.max(state.prompts.length, 1);
        const columns = Math.max(count, 1);
        const rows = 1;
        const contentWidth = columns * PANEL_SETTINGS.columnWidth + Math.max(0, columns - 1) * PANEL_SETTINGS.gap;
        const innerWidth = PANEL_SETTINGS.sidePadding * 2 + contentWidth;
        const totalWidth = Math.max(MIN_PANEL_WIDTH, innerWidth + OUTER_MARGIN * 2);
        const height = PANEL_SETTINGS.topPadding + rows * PANEL_SETTINGS.trackHeight + PANEL_SETTINGS.bottomPadding;
        return { width: totalWidth, height, contentWidth, columns, rows };
    };

    const applyContainerSize = (panelW, panelH) => {
        if (!nodeContainer) return;
        nodeContainer.style.width = `${Math.ceil(panelW + NODE_WIDTH_EXTRA)}px`;
        nodeContainer.style.minHeight = `${Math.ceil(panelH + NODE_HEIGHT_EXTRA)}px`;
    };

    const applyButtonSize = () => {
        if (!loadBtn) return;
        loadBtn.style.width = `${Math.max(40, LOAD_BTN_WIDTH)}px`;
        loadBtn.style.height = `${Math.max(20, LOAD_BTN_HEIGHT)}px`;
    };

    const rebuildCanvasSize = () => {
        const { width, height } = computeSize();
        canvas.width = Math.ceil(width);
        canvas.height = Math.ceil(height);
        applyContainerSize(width, height);
        applyButtonSize();
    };

    const drawPanel = () => {
        const { width, height, contentWidth, columns } = computeSize();
        const innerWidth = width - OUTER_MARGIN * 2;
        const extraSpace = Math.max(0, innerWidth - (PANEL_SETTINGS.sidePadding * 2 + contentWidth));
        const baseX = OUTER_MARGIN + PANEL_SETTINGS.sidePadding + extraSpace / 2;
        const trackTopBase = OUTER_MARGIN + PANEL_SETTINGS.topPadding;

        state.layout = [];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        drawRoundedRect(ctx, OUTER_MARGIN, OUTER_MARGIN, width - OUTER_MARGIN * 2, height - OUTER_MARGIN * 2, 14);
        ctx.fillStyle = PANEL_COLORS.background;
        ctx.fill();
        ctx.restore();

        if (!state.prompts.length) {
            return;
        }

        state.prompts.forEach((entry, index) => {
            const col = index % columns;
            const rowTop = trackTopBase;
            const sliderCenterX = baseX + col * (PANEL_SETTINGS.columnWidth + PANEL_SETTINGS.gap) + PANEL_SETTINGS.columnWidth / 2;
            const sliderX = sliderCenterX - PANEL_SETTINGS.sliderWidth / 2;
            const sliderYAbsolute = rowTop;
            const sliderWidth = PANEL_SETTINGS.sliderWidth;
            const sliderHeight = PANEL_SETTINGS.trackHeight;

            state.layout[index] = {
                left: sliderX - PANEL_SETTINGS.knobRadius * 2,
                right: sliderX + sliderWidth + PANEL_SETTINGS.knobRadius * 2,
                top: rowTop,
                bottom: rowTop + sliderHeight,
                height: sliderHeight,
                centerX: sliderCenterX,
            };

            const value = clampToRange(entry.value);
            const normalized = (value - 0) / 2;
            const activeHeight = sliderHeight * normalized;

            ctx.save();
            drawRoundedRect(
                ctx,
                sliderX - PANEL_SETTINGS.trackBorder,
                sliderYAbsolute,
                sliderWidth + PANEL_SETTINGS.trackBorder * 2,
                sliderHeight,
                PANEL_SETTINGS.trackRadius,
            );
            ctx.fillStyle = PANEL_COLORS.track;
            ctx.fill();
            ctx.lineWidth = PANEL_SETTINGS.trackBorder;
            ctx.strokeStyle = PANEL_COLORS.trackBorder;
            ctx.stroke();

            if (activeHeight > 0) {
                drawRoundedRect(
                    ctx,
                    sliderX - PANEL_SETTINGS.trackBorder,
                    sliderYAbsolute + sliderHeight - activeHeight,
                    sliderWidth + PANEL_SETTINGS.trackBorder * 2,
                    activeHeight,
                    PANEL_SETTINGS.trackRadius,
                );
                ctx.fillStyle = PANEL_COLORS.active;
                ctx.fill();
            }

            const knobCenterY = sliderYAbsolute + sliderHeight - activeHeight;
            ctx.fillStyle = PANEL_COLORS.knobFill;
            ctx.beginPath();
            ctx.arc(sliderCenterX, knobCenterY, PANEL_SETTINGS.knobRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = PANEL_COLORS.knobStroke;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.font = "11px sans-serif";
            ctx.fillStyle = PANEL_COLORS.valueText;
            ctx.textAlign = "center";
            ctx.fillText((value).toFixed(1), sliderCenterX, sliderYAbsolute - 10);

            ctx.font = "10px sans-serif";
            ctx.fillStyle = PANEL_COLORS.labelText;
            const trackBottomAbsolute = sliderYAbsolute + sliderHeight;
            ctx.fillText(entry.displayLabel, sliderCenterX, trackBottomAbsolute + 16);
            ctx.restore();
        });
    };

    const serializeStrengths = () => {
        const payload = {};
        const meta = [];
        const list = [];
        state.prompts.forEach((entry, index) => {
            const value = Math.round(clampToRange(entry.value) * 10) / 10;
            const key = entry.prompt || entry.id || `Prompt ${index + 1}`;
            payload[String(index)] = value;
            payload[key] = value;
            list.push(key);
            meta.push({ id: key, label: entry.label, displayLabel: entry.displayLabel, value });
        });
        payload.__prompts__ = list;
        payload.__order__ = meta;
        return {
            payload,
            formatted: list.map((p) => `(${p}:${formatFloat(payload[p])})`).join(","),
        };
    };

    const pickIndexAt = (x, y) => {
        for (let i = 0; i < state.layout.length; i++) {
            const m = state.layout[i];
            if (!m) continue;
            if (x >= m.left && x <= m.right && y >= m.top && y <= m.bottom) return i;
        }
        return -1;
    };

    const onPointerDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hit = pickIndexAt(x, y);
        if (hit === -1) return;
        state.draggingIndex = hit;
        e.preventDefault();
    };

    const onPointerUp = () => {
        if (state.draggingIndex == null) return;
        state.draggingIndex = null;
    };

    const onPointerMove = (e) => {
        if (state.draggingIndex == null) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const m = state.layout[state.draggingIndex];
        if (!m) return;

        const yClamped = clamp(y, m.top, m.bottom);
        let ratio = 1 - (yClamped - m.top) / m.height;
        ratio = clamp(ratio, 0, 1);
        let computed = ratio * 2;
        computed = Math.round(computed / 0.1) * 0.1;
        computed = Number(computed.toFixed(2));

        const entry = state.prompts[state.draggingIndex];
        if (!entry) return;
        if (entry.value !== computed) {
            entry.value = computed;
            serializeStrengths();
            drawPanel();
        }
        e.preventDefault();
    };

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("mousemove", onPointerMove);

    canvas.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        if (!t) return;
        onPointerDown({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() });
    }, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    window.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        if (!t) return;
        onPointerMove({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() });
    }, { passive: false });

    const loadPrompts = () => {
        if (!state.isLinked) {
            drawPanel();
            return;
        }
        const raw = promptsInput.value || "";
        const tokens = parsePrompts(raw);
        state.prompts = tokens.map((prompt, index) => {
            const safe = prompt.trim();
            const displayLabel = safe.length > 14 ? `${safe.slice(0, 13)}…` : safe;
            return { id: safe, prompt: safe, label: safe, displayLabel, value: 1.0 };
        });
        rebuildCanvasSize();
        serializeStrengths();
        drawPanel();
    };

    const resetAll = () => {
        state.prompts.forEach((p) => { p.value = 1.0; });
        serializeStrengths();
        drawPanel();
    };

    const syncLinkUI = () => {
        if (state.isLinked) promptsDot.classList.add("linked"); else promptsDot.classList.remove("linked");
        if (outDot) outDot.classList.add("linked");
    };

    linkBtn.addEventListener("click", () => { state.isLinked = true; syncLinkUI(); });
    unlinkBtn.addEventListener("click", () => { state.isLinked = false; syncLinkUI(); });
    loadBtn.addEventListener("click", loadPrompts);
    resetBtn.addEventListener("click", resetAll);

    const initSettingsInputs = () => {
        inp_columnWidth.value = PANEL_SETTINGS.columnWidth;
        inp_gap.value = PANEL_SETTINGS.gap;
        inp_sidePadding.value = PANEL_SETTINGS.sidePadding;
        inp_trackHeight.value = PANEL_SETTINGS.trackHeight;
        inp_topPadding.value = PANEL_SETTINGS.topPadding;
        inp_bottomPadding.value = PANEL_SETTINGS.bottomPadding;
        inp_sliderWidth.value = PANEL_SETTINGS.sliderWidth;
        inp_knobRadius.value = PANEL_SETTINGS.knobRadius;
        inp_trackRadius.value = PANEL_SETTINGS.trackRadius;
        inp_trackBorder.value = PANEL_SETTINGS.trackBorder;
        inp_minPanelWidth.value = MIN_PANEL_WIDTH;
        inp_outerMargin.value = OUTER_MARGIN;
        inp_btnWidth.value = LOAD_BTN_WIDTH;
        inp_btnHeight.value = LOAD_BTN_HEIGHT;
        inp_nodeWidthExtra.value = NODE_WIDTH_EXTRA;
        inp_nodeHeightExtra.value = NODE_HEIGHT_EXTRA;

        const handlers = [
            [inp_columnWidth, (v) => PANEL_SETTINGS.columnWidth = Math.max(1, Math.round(v))],
            [inp_gap, (v) => PANEL_SETTINGS.gap = Math.max(0, Math.round(v))],
            [inp_sidePadding, (v) => PANEL_SETTINGS.sidePadding = Math.max(0, Math.round(v))],
            [inp_trackHeight, (v) => PANEL_SETTINGS.trackHeight = Math.max(10, Math.round(v))],
            [inp_topPadding, (v) => PANEL_SETTINGS.topPadding = Math.max(0, Math.round(v))],
            [inp_bottomPadding, (v) => PANEL_SETTINGS.bottomPadding = Math.max(0, Math.round(v))],
            [inp_sliderWidth, (v) => PANEL_SETTINGS.sliderWidth = Math.max(1, Math.round(v))],
            [inp_knobRadius, (v) => PANEL_SETTINGS.knobRadius = Math.max(1, Math.round(v))],
            [inp_trackRadius, (v) => PANEL_SETTINGS.trackRadius = Math.max(0, Math.round(v))],
            [inp_trackBorder, (v) => PANEL_SETTINGS.trackBorder = Math.max(0, Math.round(v))],
            [inp_minPanelWidth, (v) => MIN_PANEL_WIDTH = Math.max(100, Math.round(v))],
            [inp_outerMargin, (v) => OUTER_MARGIN = Math.max(0, Math.round(v))],
            [inp_btnWidth, (v) => LOAD_BTN_WIDTH = Math.max(1, Math.round(v))],
            [inp_btnHeight, (v) => LOAD_BTN_HEIGHT = Math.max(1, Math.round(v))],
            [inp_nodeWidthExtra, (v) => NODE_WIDTH_EXTRA = Math.max(0, Math.round(v))],
            [inp_nodeHeightExtra, (v) => NODE_HEIGHT_EXTRA = Math.max(0, Math.round(v))],
        ];

        const onChange = (input, apply) => {
            const handler = () => {
                const val = Number(input.value);
                if (!Number.isFinite(val)) return;
                apply(val);
                rebuildCanvasSize();
                drawPanel();
            };
            input.addEventListener("input", handler);
            input.addEventListener("change", handler);
        };

        handlers.forEach(([el, apply]) => onChange(el, apply));
    };

    rebuildCanvasSize();
    syncLinkUI();
    drawPanel();
    initSettingsInputs();
})();

