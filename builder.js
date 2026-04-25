let builderData = [];
let builderRowId = null;
let selectedBlockId = null;
let activeBuilderTab = "contenido";
let draftBlock = null;
let builderSettings = { ...defaultSiteSettings };
let pageSettingsDraft = null;
let builderEditorMode = "blocks";
let heroSelectedIndex = 0;
let heroDraft = null;
let sliderDraft = null;
const builderRuntime = {
  youtubePlaying: {}
};

const FONT_OPTIONS = [
  "Manrope",
  "Space Grotesk",
  "Poppins",
  "Montserrat",
  "Raleway",
  "Nunito",
  "Lora",
  "Merriweather",
  "Playfair Display",
  "Roboto Slab",
  "Oswald",
  "Bebas Neue"
];

const POSITION_LABELS = {
  top: "Arriba de todo",
  afterSlider: "Debajo del primer bloque",
  middle: "Antes del catalogo",
  bottom: "Debajo del catalogo",
  footer: "Pie de pagina"
};

const BLOCK_TYPES = {
  texto: "Texto",
  imagen: "Imagen",
  slider: "Slider",
  video: "Video propio",
  embed: "Video/red social",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  banner: "Banner",
  destacados: "Destacados",
  espaciador: "Espaciador",
  ubicacion: "Ubicacion",
  piepagina: "Pie de pagina"
};

const colorParserCanvas = document.createElement("canvas");
const colorParserContext = colorParserCanvas.getContext("2d");

function uid() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampOpacity(value) {
  return Math.max(0, Math.min(1, Number(value ?? 1)));
}

function parseHexColor(hex) {
  const clean = hex.replace("#", "").trim();
  if (![3, 4, 6, 8].includes(clean.length)) return null;
  const normalized = clean.length <= 4
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  const hasAlpha = normalized.length === 8;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(normalized.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function applyColorOpacity(color, opacity = 1) {
  if (!color) return color;
  const finalOpacity = clampOpacity(opacity);
  try {
    colorParserContext.fillStyle = "#000000";
    colorParserContext.fillStyle = color;
    const normalized = colorParserContext.fillStyle;
    if (normalized.startsWith("#")) {
      const parsed = parseHexColor(normalized);
      if (!parsed) return color;
      return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Number((parsed.a * finalOpacity).toFixed(3))})`;
    }
    const match = normalized.match(/rgba?\(([^)]+)\)/i);
    if (!match) return color;
    const parts = match[1].split(",").map((item) => item.trim());
    const [r, g, b] = parts.slice(0, 3).map(Number);
    const alpha = parts[3] !== undefined ? Number(parts[3]) : 1;
    return `rgba(${r}, ${g}, ${b}, ${Number((alpha * finalOpacity).toFixed(3))})`;
  } catch {
    return color;
  }
}

function getBoxAlignmentStyle(alignment = "center") {
  const map = {
    left: "margin-left:0;margin-right:auto;",
    center: "margin-left:auto;margin-right:auto;",
    right: "margin-left:auto;margin-right:0;"
  };
  return map[alignment] || map.center;
}

function formatMultilineText(text = "") {
  return String(text || "").replace(/\n/g, "<br>");
}

function normalizeBuilderPayload(payload) {
  if (Array.isArray(payload)) {
    return { blocks: payload, settings: { ...defaultSiteSettings }, access: clone(defaultAccessState) };
  }
  return {
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
    settings: { ...defaultSiteSettings, ...(payload?.settings || {}) },
    access: normalizeAccessState(payload?.access || window.accessState || defaultAccessState)
  };
}

function createGradientDefaults() {
  return {
    enabled: false,
    type: "linear",
    position: "135deg",
    color1: "#0f1c33",
    color2: "#1d4ed8",
    color3: ""
  };
}

function createDefaultHeroCard() {
  return clone(defaultSiteSettings.heroCards[0]);
}

function normalizeHeroCard(card = {}) {
  const base = createDefaultHeroCard();
  return {
    ...base,
    ...clone(card),
    design: {
      ...base.design,
      ...(card.design || {}),
      gradient: {
        ...base.design.gradient,
        ...(card.design?.gradient || {})
      }
    }
  };
}

function getDefaultBlock(type) {
  const base = {
    id: uid(),
    type,
    title: BLOCK_TYPES[type],
    position: type === "piepagina" ? "footer" : "afterSlider",
    sortOrder: builderData.length * 10 + 20,
    hidden: false,
    layout: { width: "full", boxAlign: "center" },
    animation: "none",
    design: {
      width: "100%",
      height: 420,
      padding: 24,
      borderRadius: 24,
      textColor: "#ffffff",
      shadow: false,
      shadowColor: "rgba(2,8,23,.22)",
      align: "left",
      objectFit: "cover",
      opacity: 1,
      backgroundOpacity: 1,
      sectionTitle: "Productos destacados",
      accentBackground: "rgba(255,255,255,.12)",
      textAlign: "left",
      titleColor: "#ffffff",
      descriptionColor: "#dbeafe",
      titleSize: 30,
      descriptionSize: 16,
      titleFont: "Space Grotesk",
      titleFontCustom: "",
      descriptionFont: "Manrope",
      descriptionFontCustom: "",
      textShadow: false,
      textShadowColor: "rgba(2,8,23,.55)",
      transparentBackground: false,
      fitMode: "normal",
      gradient: createGradientDefaults()
    }
  };

  const byType = {
    texto: {
      ...base,
      content: {
        title: "Titulo principal",
        description: "Descripcion con otro tamano en la misma caja.",
        titleSize: 36,
        descriptionSize: 17,
        titleFont: "Space Grotesk",
        titleFontCustom: "",
        descriptionFont: "Manrope",
        descriptionFontCustom: "",
        align: "left"
      }
    },
    imagen: {
      ...base,
      content: {
        title: "Titulo de la imagen",
        description: "Descripcion debajo de la imagen.",
        src: "",
        alt: "imagen",
        link: ""
      },
      design: {
        ...base.design,
        width: "1100px",
        height: 520,
        objectFit: "contain"
      }
    },
    slider: {
      ...base,
      content: { images: [], autoplay: true, seconds: 4, currentIndex: 0 }
    },
    video: {
      ...base,
      content: {
        title: "Titulo del video",
        description: "Descripcion debajo del video.",
        sources: [],
        src: "",
        autoplay: false,
        muted: false,
        loop: false,
        controls: true,
        currentIndex: 0
      },
      design: {
        ...base.design,
        width: "1100px",
        height: 540
      }
    },
    embed: {
      ...base,
      content: {
        title: "Titulo del contenido social",
        description: "Descripcion debajo del contenido.",
        urls: [],
        url: "",
        currentIndex: 0
      },
      design: {
        ...base.design,
        width: "680px",
        height: 680
      }
    },
    youtube: {
      ...base,
      content: {
        title: "Titulo del video de YouTube",
        description: "Descripcion debajo del video.",
        url: "",
        startMode: "click",
        muted: false,
        loop: false
      },
      design: {
        ...base.design,
        width: "1100px",
        height: 540
      }
    },
    whatsapp: {
      ...base,
      content: { text: "Escribenos por WhatsApp", phone: "18298483964", message: "Hola, quiero informacion." },
      design: { ...base.design, align: "center", width: "360px", height: 0 }
    },
    banner: {
      ...base,
      content: {
        title: "Oferta especial",
        description: "Banner promocional adaptable.",
        badgeText: "Nuevo",
        buttonText: "Ver mas",
        buttonLink: "#catalogos",
        boxPosition: "top"
      },
      design: {
        ...base.design,
        accentBackground: "rgba(255,255,255,.12)"
      }
    },
    destacados: {
      ...base,
      content: { productNames: [], currentIndex: 0 }
    },
    espaciador: {
      ...base,
      content: {},
      design: { ...base.design, height: 48, width: "100%" }
    },
    ubicacion: {
      ...base,
      content: {
        title: "Nuestra ubicacion",
        description: "Agrega una descripcion debajo del mapa.",
        mapUrl: ""
      },
      design: {
        ...base.design,
        width: "1100px",
        height: 440
      }
    },
    piepagina: {
      ...base,
      position: "footer",
      content: {
        title: "DIGIHERA TECH",
        description: "Comparte tu mensaje principal o la informacion clave del pie de pagina.",
        subtext: "Todos los derechos reservados.",
        socialLinks: [
          { label: "Instagram", url: "", icon: "" },
          { label: "Facebook", url: "", icon: "" }
        ],
        textLinks: [
          { label: "Terminos", url: "" },
          { label: "Privacidad", url: "" }
        ]
      },
      design: {
        ...base.design,
        width: "100%",
        titleSize: 28,
        descriptionSize: 15,
        textAlign: "left"
      }
    }
  };

  return byType[type];
}

function normalizeBlock(rawBlock) {
  const block = clone(rawBlock || {});
  if (block.type === "footer") block.type = "piepagina";
  const defaults = getDefaultBlock(block.type || "texto");
  const gradient = {
    ...createGradientDefaults(),
    ...(block.design?.gradient || {})
  };
  if (block.design?.useGradient && !block.design?.gradient) {
    gradient.enabled = true;
    gradient.color1 = block.design.background || gradient.color1;
    gradient.color2 = block.design.backgroundAlt || gradient.color2;
  }
  if (block.type === "youtube" && block.content?.autoplay === true && !block.content?.startMode) {
    block.content.startMode = "auto";
  }
  if (block.type === "ubicacion" && block.content?.note && !block.content?.description) {
    block.content.description = block.content.note;
  }
  if (block.type === "video") {
    const sources = Array.isArray(block.content?.sources) ? block.content.sources.filter(Boolean) : [];
    if (!sources.length && block.content?.src) sources.push(block.content.src);
    block.content = {
      ...(block.content || {}),
      sources,
      currentIndex: Number.isInteger(block.content?.currentIndex) ? block.content.currentIndex : 0
    };
  }
  if (block.type === "embed") {
    const urls = Array.isArray(block.content?.urls) ? block.content.urls.filter(Boolean) : [];
    if (!urls.length && block.content?.url) urls.push(block.content.url);
    block.content = {
      ...(block.content || {}),
      urls,
      currentIndex: Number.isInteger(block.content?.currentIndex) ? block.content.currentIndex : 0
    };
  }
  if (block.type === "piepagina") {
    const socialLinks = Array.isArray(block.content?.socialLinks)
      ? block.content.socialLinks.map((item) => ({
          label: item?.label || "Red social",
          url: item?.url || "",
          icon: item?.icon || ""
        }))
      : getDefaultBlock("piepagina").content.socialLinks;
    const textLinks = Array.isArray(block.content?.textLinks)
      ? block.content.textLinks.map((item) => ({
          label: item?.label || "Enlace",
          url: item?.url || ""
        }))
      : getDefaultBlock("piepagina").content.textLinks;
    block.content = {
      ...(block.content || {}),
      socialLinks,
      textLinks
    };
  }

  return {
    ...defaults,
    ...block,
    layout: {
      ...defaults.layout,
      ...(block.layout || {})
    },
    content: {
      ...defaults.content,
      ...(block.content || {})
    },
    design: {
      ...defaults.design,
      ...(block.design || {}),
      gradient
    }
  };
}

function getBlock(id) {
  return builderData.find((item) => item.id === id);
}

function sortBlocks() {
  builderData.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function getSpecialSectionMeta(kind) {
  const fallback = kind === "hero" ? defaultAccessState.specialSections.hero : defaultAccessState.specialSections.slider;
  if (!window.accessState.specialSections) window.accessState.specialSections = clone(defaultAccessState.specialSections);
  if (!window.accessState.specialSections[kind]) window.accessState.specialSections[kind] = clone(fallback);
  const current = window.accessState.specialSections[kind];
  if (!["top", "afterSlider", "middle", "bottom", "footer"].includes(current.position)) {
    current.position = fallback.position;
  }
  if (!Number.isFinite(Number(current.sortOrder))) {
    current.sortOrder = fallback.sortOrder;
  }
  return current;
}

function setSpecialSectionMeta(kind, patch = {}) {
  const current = getSpecialSectionMeta(kind);
  window.accessState.specialSections[kind] = { ...current, ...patch };
  window.syncAccessState(window.accessState);
}

async function cargarBuilderSupabase() {
  const { data } = await supabaseClient.from("builder_content").select("*").limit(1);
  if (data?.length) {
    const normalized = normalizeBuilderPayload(data[0].data);
    builderData = normalized.blocks.map(normalizeBlock);
    builderSettings = { ...defaultSiteSettings, ...(normalized.settings || {}) };
    builderSettings.heroCards = (builderSettings.heroCards || defaultSiteSettings.heroCards).map(normalizeHeroCard);
    builderRowId = data[0].id;
    window.syncAccessState(normalized.access || defaultAccessState);
  } else {
    builderData = [];
    builderSettings = clone(defaultSiteSettings);
    builderSettings.heroCards = builderSettings.heroCards.map(normalizeHeroCard);
    window.syncAccessState(defaultAccessState);
  }
  sortBlocks();
  window.syncSiteSettings(builderSettings);
  renderBuilder();
}

function getBuilderPayload() {
  return {
    blocks: builderData,
    settings: builderSettings,
    access: window.accessState
  };
}

async function guardarBuilderSupabase() {
  sortBlocks();
  const payload = getBuilderPayload();
  if (builderRowId) {
    await supabaseClient.from("builder_content").update({ data: payload }).eq("id", builderRowId);
  } else {
    const { data } = await supabaseClient.from("builder_content").insert([{ data: payload }]).select();
    if (data?.length) builderRowId = data[0].id;
  }
  renderBuilder();
}

function buildGradientValue(gradient, opacity = 1) {
  const colors = [gradient.color1, gradient.color2, gradient.color3]
    .filter(Boolean)
    .map((color) => applyColorOpacity(color, opacity));
  if (!colors.length) return "#0f1c33";
  if (!gradient.enabled) return colors[0] || "#0f1c33";
  if (gradient.type === "radial") {
    return `radial-gradient(circle at ${(window.resolveGradientPosition ? window.resolveGradientPosition("radial", gradient.position) : (gradient.position || "center"))}, ${colors.join(", ")})`;
  }
  return `linear-gradient(${(window.resolveGradientPosition ? window.resolveGradientPosition("linear", gradient.position) : (gradient.position || "135deg"))}, ${colors.join(", ")})`;
}

function getSurfaceStyle(block) {
  const useTransparentBackground = Boolean(block.design.transparentBackground);
  return [
    `background:${useTransparentBackground ? "transparent" : buildGradientValue(block.design.gradient, block.design.backgroundOpacity ?? 1)}`,
    `color:${block.design.textColor}`,
    `border-radius:${block.design.borderRadius}px`,
    `padding:${block.design.padding}px`,
    `width:min(100%, ${block.design.width || "100%"})`,
    getBoxAlignmentStyle(block.layout?.boxAlign || "center"),
    `box-shadow:${useTransparentBackground ? "none" : (block.design.shadow ? `0 18px 45px ${block.design.shadowColor || "rgba(2,8,23,.22)"}` : "none")}`,
    `border:${useTransparentBackground ? "none" : "1px solid var(--line)"}`
  ].join(";");
}

function getVisibleFeaturedCount() {
  if (window.innerWidth < 760) return 1;
  if (window.innerWidth < 1120) return 2;
  return 4;
}

function getTextShadowValue(design = {}) {
  return design.textShadow ? `0 10px 24px ${design.textShadowColor || "rgba(2,8,23,.55)"}` : "none";
}

function getDesignedTextStyle(block, kind = "title") {
  const isTitle = kind === "title";
  const color = isTitle ? (block.design.titleColor || block.design.textColor || "#ffffff") : (block.design.descriptionColor || block.design.textColor || "#dbeafe");
  const size = isTitle ? (block.design.titleSize || 30) : (block.design.descriptionSize || 16);
  const font = isTitle
    ? (block.design.titleFontCustom || block.design.titleFont || "Space Grotesk")
    : (block.design.descriptionFontCustom || block.design.descriptionFont || "Manrope");
  return [
    `color:${color}`,
    `font-size:${size}px`,
    `font-family:${getResolvedFontFamily(font)}`,
    `text-shadow:${getTextShadowValue(block.design)}`,
    `text-align:${block.design.textAlign || "left"}`
  ].join(";");
}

function getMediaFrameStyle(block, kind = "landscape") {
  const radius = Math.max(12, (block.design.borderRadius || 24) - 6);
  const maxHeight = block.design.height || (kind === "portrait" ? 680 : kind === "map" ? 460 : 520);
  const minHeight = kind === "portrait" ? 360 : kind === "map" ? 250 : 220;
  const preferred = kind === "portrait" ? "92vw" : kind === "map" ? "56vw" : "48vw";
  if (block.design.fitMode === "adjust") {
    if (kind === "portrait") {
      return `border-radius:${radius}px;min-height:0;max-width:min(100%, 480px);margin-inline:auto;`;
    }
    if (kind === "auto") {
      return `border-radius:${radius}px;min-height:0;`;
    }
    return `border-radius:${radius}px;min-height:0;`;
  }
  return `border-radius:${radius}px;min-height:clamp(${minHeight}px, ${preferred}, ${maxHeight}px);`;
}

function buildFramePlaceholder(text) {
  return `<div style="display:grid;place-items:center;height:100%;padding:20px;text-align:center;color:#dbeafe;">${text}</div>`;
}

function createMediaShell(block, frameContent, kind = "landscape") {
  const box = document.createElement("div");
  box.className = "builder-media-shell";
  box.style.cssText = `${getSurfaceStyle(block)} text-align:${block.design.textAlign || "left"};`;
  const title = block.content.title ? `<h3 class="builder-media-title" style="${getDesignedTextStyle(block, "title")}">${block.content.title}</h3>` : "";
  const description = block.content.description ? `<p class="builder-media-description" style="${getDesignedTextStyle(block, "description")}">${block.content.description}</p>` : "";
  box.innerHTML = `${title}<div class="builder-media-frame ${kind}" style="${getMediaFrameStyle(block, kind)}">${frameContent}</div>${description}`;
  return box;
}

function getCarouselWindow(total, currentIndex) {
  if (total <= 1) return [{ index: 0, state: "current" }];
  if (total === 2) {
    const other = currentIndex === 0 ? 1 : 0;
    return [
      { index: other, state: "side" },
      { index: currentIndex, state: "current" }
    ];
  }
  const prev = (currentIndex - 1 + total) % total;
  const next = (currentIndex + 1) % total;
  return [
    { index: prev, state: "side" },
    { index: currentIndex, state: "current" },
    { index: next, state: "side" }
  ];
}

function buildCarouselMarkup(block, items, kind, shiftAction, renderItem) {
  const currentIndex = Math.max(0, Math.min(block.content.currentIndex || 0, items.length - 1));
  const windowItems = getCarouselWindow(items.length, currentIndex);
  return `
    <div class="builder-media-carousel ${kind}">
      ${items.length > 1 ? `<button type="button" class="builder-media-nav prev" onclick="${shiftAction}('${block.id}', -1)">❮</button>` : ""}
      <div class="builder-media-track ${kind}">
        ${windowItems.map(({ index, state }) => `
          <div class="builder-media-slide ${state}" ${state !== "current" ? `onclick="builderSetCarouselIndex('${block.id}', ${index})"` : ""}>
            ${renderItem(items[index], state, index === currentIndex)}
          </div>
        `).join("")}
      </div>
      ${items.length > 1 ? `<button type="button" class="builder-media-nav next" onclick="${shiftAction}('${block.id}', 1)">❯</button>` : ""}
    </div>
    ${items.length > 1 ? `<div class="builder-media-dots">${items.map((_, index) => `<button type="button" class="${index === currentIndex ? "active" : ""}" onclick="builderSetCarouselIndex('${block.id}', ${index})"></button>`).join("")}</div>` : ""}
  `;
}

function shouldUseYoutubeExternalFallback() {
  return window.location.protocol === "file:";
}

function createBlockElement(block) {
  const wrapper = document.createElement("section");
  wrapper.className = `builder-block builder-width-${block.layout?.width || "full"} animation-${block.animation || "none"}`;
  wrapper.dataset.blockId = block.id;
  wrapper.addEventListener("click", () => {
    if (!canUseBuilder()) return;
    seleccionarBloque(block.id);
  });

  if (canUseBuilder()) {
    const toolbar = document.createElement("div");
    toolbar.className = "builder-toolbar";
    toolbar.innerHTML = `
      <button type="button" onclick="moverBloque('${block.id}', -1)">Subir</button>
      <button type="button" onclick="moverBloque('${block.id}', 1)">Bajar</button>
      ${block.layout?.width === "half" ? `<button type="button" onclick="moverBloqueHorizontal('${block.id}', -1)">Izquierda</button><button type="button" onclick="moverBloqueHorizontal('${block.id}', 1)">Derecha</button>` : ""}
      <button type="button" onclick="duplicarBloque('${block.id}')">Duplicar</button>
      <button type="button" onclick="toggleBloque('${block.id}')">${block.hidden ? "Mostrar" : "Ocultar"}</button>
      <button type="button" onclick="eliminarBloqueDirecto('${block.id}')">Eliminar</button>
    `;
    wrapper.appendChild(toolbar);
  }

  const node = renderBlockNode(block);
  if (node) wrapper.appendChild(node);
  return wrapper;
}

function renderBlockNode(block) {
  if (block.type === "texto") {
    const box = document.createElement("div");
    box.className = "builder-text-card";
    box.style.cssText = `${getSurfaceStyle(block)} text-align:${block.content.align || "left"};`;
    const titleFont = block.content.titleFontCustom || block.content.titleFont;
    const descriptionFont = block.content.descriptionFontCustom || block.content.descriptionFont;
    box.innerHTML = `
      <h2 style="font-size:${block.content.titleSize}px;font-family:${getResolvedFontFamily(titleFont)};margin:0 0 12px;">${block.content.title || ""}</h2>
      <p style="font-size:${block.content.descriptionSize}px;font-family:${getResolvedFontFamily(descriptionFont)};margin:0;opacity:.92;">${block.content.description || ""}</p>
    `;
    return box;
  }

  if (block.type === "imagen") {
    const frameKind = block.design.fitMode === "adjust" ? "auto" : "landscape";
    const imageMarkup = block.content.src
      ? `<img src="${block.content.src}" alt="${block.content.alt || ""}" style="object-fit:${block.design.fitMode === "adjust" ? "contain" : (block.design.objectFit || "contain")};opacity:${block.design.opacity ?? 1};height:${block.design.fitMode === "adjust" ? "auto" : "100%"};">`
      : buildFramePlaceholder("Sube o pega una imagen para verla aqui.");
    const content = block.content.src && block.content.link
      ? `<a href="${block.content.link}" target="_blank" rel="noreferrer" style="display:block;width:100%;height:100%;">${imageMarkup}</a>`
      : imageMarkup;
    return createMediaShell(block, content, frameKind);
  }

  if (block.type === "slider") {
    const box = document.createElement("div");
    const images = block.content.images?.length ? block.content.images : ["https://placehold.co/1400x700/0f172a/e2e8f0?text=Slider"];
    block.content.currentIndex = block.content.currentIndex || 0;
    box.className = "builder-media-shell";
    box.style.cssText = `${getSurfaceStyle(block)} text-align:${block.design.textAlign || "left"};`;
    const frameKind = block.design.fitMode === "adjust" ? "auto" : "landscape";
    box.innerHTML = `
      <div class="builder-media-frame ${frameKind}" style="${getMediaFrameStyle(block, frameKind)}">
        <img src="${images[block.content.currentIndex]}" alt="slider" style="object-fit:${block.design.fitMode === "adjust" ? "contain" : "cover"};height:${block.design.fitMode === "adjust" ? "auto" : "100%"};">
        <button type="button" class="builder-arrow left" onclick="builderPrev('${block.id}')">❮</button>
        <button type="button" class="builder-arrow right" onclick="builderNext('${block.id}')">❯</button>
      </div>
    `;
    if (block.content.autoplay && images.length > 1) {
      clearTimeout(block.timer);
      block.timer = setTimeout(() => builderNext(block.id), (block.content.seconds || 4) * 1000);
    }
    return box;
  }

  if (block.type === "video") {
    const sources = block.content.sources?.length ? block.content.sources : (block.content.src ? [block.content.src] : []);
    const frameKind = block.design.fitMode === "adjust" ? "auto" : "landscape";
    if (!sources.length) {
      return createMediaShell(block, buildFramePlaceholder("Sube un video para mostrarlo completo aqui."), frameKind);
    }
    const markup = sources.length > 1
      ? buildCarouselMarkup(block, sources, frameKind, "builderShiftVideoCarousel", (src, state, isCurrent) => `
          <video
            src="${src}"
            style="object-fit:contain;height:${block.design.fitMode === "adjust" ? "auto" : "100%"};"
            ${isCurrent && block.content.controls ? "controls" : ""}
            ${isCurrent && block.content.autoplay ? "autoplay" : ""}
            ${(isCurrent ? block.content.muted : true) ? "muted" : ""}
            ${block.content.loop ? "loop" : ""}
            ${!isCurrent ? "preload='metadata'" : ""}
            playsinline
          ></video>
        `)
      : `<video src="${sources[0]}" style="object-fit:contain;height:${block.design.fitMode === "adjust" ? "auto" : "100%"};" ${block.content.controls ? "controls" : ""} ${block.content.autoplay ? "autoplay" : ""} ${block.content.muted ? "muted" : ""} ${block.content.loop ? "loop" : ""} playsinline></video>`;
    return createMediaShell(block, markup, frameKind);
  }

  if (block.type === "youtube") {
    const id = extractYoutubeId(block.content.url);
    if (!id) {
      return createMediaShell(block, buildFramePlaceholder("Pega un enlace valido de YouTube."), "landscape");
    }
    if (shouldUseYoutubeExternalFallback()) {
      const previewMarkup = `
        <a href="${block.content.url}" target="_blank" rel="noreferrer" class="builder-youtube-preview builder-youtube-fallback">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="YouTube preview" style="object-fit:cover;">
          <span class="play-pill">▶</span>
          <span class="builder-youtube-fallback-copy">Abrir video completo en YouTube</span>
        </a>
      `;
      return createMediaShell(block, previewMarkup, "landscape");
    }
    const iframeSrc = buildYoutubeEmbed(block.content.url, { ...block.content, id: block.id });
    const shouldAutoplay = block.content.startMode === "auto";
    const isPlaying = shouldAutoplay || builderRuntime.youtubePlaying[block.id];
    const markup = !isPlaying
      ? `
        <button type="button" class="builder-youtube-preview" onclick="playYoutubeInline('${block.id}')">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="YouTube preview" style="object-fit:cover;">
          <span class="play-pill">▶</span>
        </button>
      `
      : `<iframe src="${iframeSrc}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return createMediaShell(block, markup, "landscape");
  }

  if (block.type === "embed") {
    const urls = block.content.urls?.length ? block.content.urls : (block.content.url ? [block.content.url] : []);
    if (!urls.length) {
      return createMediaShell(block, buildFramePlaceholder("Pega uno o varios enlaces validos de TikTok, Instagram o Facebook."), "landscape");
    }
    const embeds = urls.map((url) => ({ ...buildSocialEmbed(url), originalUrl: url })).filter((item) => item.src);
    if (!embeds.length) {
      return createMediaShell(block, buildFramePlaceholder("Pega uno o varios enlaces validos de TikTok, Instagram o Facebook."), "landscape");
    }
    block.content.currentIndex = Math.max(0, Math.min(block.content.currentIndex || 0, embeds.length - 1));
    const frameKind = embeds[block.content.currentIndex]?.kind === "tiktok" || embeds[block.content.currentIndex]?.kind === "instagram" ? "portrait" : "landscape";
    const markup = embeds.length > 1
      ? buildCarouselMarkup(block, embeds, frameKind, "builderShiftEmbedCarousel", (embed, state, isCurrent) => `
          <iframe
            src="${embed.src}"
            loading="lazy"
            allowfullscreen
            scrolling="no"
            referrerpolicy="strict-origin-when-cross-origin"
            ${!isCurrent ? 'tabindex="-1"' : ""}
          ></iframe>
        `)
      : `<iframe src="${embeds[0].src}" loading="lazy" allowfullscreen scrolling="no" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return createMediaShell(block, markup, frameKind);
  }

  if (block.type === "whatsapp") {
    const box = document.createElement("div");
    box.className = "builder-text-card";
    box.style.cssText = `${getSurfaceStyle(block)} text-align:${block.design.align || "center"};`;
    box.innerHTML = `<a class="builder-whatsapp" target="_blank" rel="noreferrer" href="https://wa.me/${block.content.phone}?text=${encodeURIComponent(block.content.message || "")}">${block.content.text || "WhatsApp"}</a>`;
    return box;
  }

  if (block.type === "banner") {
    const box = document.createElement("div");
    box.className = `builder-banner-card ${block.content.boxPosition === "bottom" ? "badge-bottom" : "badge-top"}`;
    box.style.cssText = `${getSurfaceStyle(block)} text-align:${block.design.align || "left"};`;
    box.innerHTML = `
      <div class="builder-banner-badge" style="background:${block.design.accentBackground || "rgba(255,255,255,.12)"}">${block.content.badgeText || ""}</div>
      <div class="builder-banner-copy">
        <h2 style="${getDesignedTextStyle(block, "title")}">${block.content.title || ""}</h2>
        <p style="${getDesignedTextStyle(block, "description")}">${block.content.description || ""}</p>
        <a href="${block.content.buttonLink || "#"}" class="builder-banner-link">${block.content.buttonText || "Ver mas"}</a>
      </div>
    `;
    return box;
  }

  if (block.type === "destacados") {
    const products = (block.content.productNames || []).map((name) => buscarProducto(name)).filter(Boolean);
    const visibleCount = getVisibleFeaturedCount();
    const maxStart = Math.max(0, products.length - visibleCount);
    block.content.currentIndex = Math.min(block.content.currentIndex || 0, maxStart);
    const currentProducts = products.slice(block.content.currentIndex, block.content.currentIndex + visibleCount);

    const box = document.createElement("div");
    box.className = "builder-featured";
    box.style.cssText = getSurfaceStyle(block);
    box.innerHTML = `
      <div class="builder-featured-head">
        <h2 style="${getDesignedTextStyle(block, "title")}">${block.design.sectionTitle || "Productos destacados"}</h2>
        ${products.length > visibleCount ? `
          <div class="builder-featured-arrows">
            <button type="button" onclick="destacadosPrev('${block.id}')">❮</button>
            <button type="button" onclick="destacadosNext('${block.id}')">❯</button>
          </div>
        ` : ""}
      </div>
    `;

    const grid = document.createElement("div");
    grid.className = "builder-featured-grid";
    currentProducts.forEach((prod) => {
      const item = document.createElement("article");
      item.className = "producto compact";
      item.innerHTML = `
        <div class="featured-fire">🔥</div>
        <div class="product-image-wrap"><img src="${prod.imagen || "https://placehold.co/600x600/0f172a/e2e8f0?text=Producto"}" alt="${prod.nombre}"></div>
        <div class="producto-body">
          <h4>${prod.nombre}</h4>
          <p>${prod.descripcion || ""}</p>
          <div class="precio-row"><span class="precio">$${obtenerPrecioProducto(prod)}</span></div>
        </div>
      `;
      grid.appendChild(item);
    });
    box.appendChild(grid);
    return box;
  }

  if (block.type === "espaciador") {
    const box = document.createElement("div");
    box.className = "builder-spacer-card";
    box.style.height = `${block.design.height}px`;
    return box;
  }

  if (block.type === "ubicacion") {
    const src = buildMapEmbed(block.content.mapUrl);
    const markup = src
      ? `<iframe src="${src}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : buildFramePlaceholder("Pega un enlace de Google Maps valido.");
    return createMediaShell(block, markup, "map");
  }

  if (block.type === "piepagina") {
    const box = document.createElement("footer");
    const links = (block.content.textLinks || []).filter((item) => item?.url);
    const socialLinks = (block.content.socialLinks || []).filter((item) => item?.url);
    box.className = "builder-footer-card";
    box.style.cssText = `${getSurfaceStyle(block)} text-align:${block.design.textAlign || "left"};`;
    box.innerHTML = `
      <div class="builder-footer-copy">
        <h3 style="${getDesignedTextStyle(block, "title")}">${block.content.title || ""}</h3>
        <p style="${getDesignedTextStyle(block, "description")}">${formatMultilineText(block.content.description || "")}</p>
        ${links.length ? `
          <div class="builder-inline-link-list">
            ${links.map((item) => `<a href="${item.url || "#"}" target="_blank" rel="noreferrer">${item.label || "Enlace"}</a>`).join("")}
          </div>
        ` : ""}
        <small style="${getDesignedTextStyle(block, "description")}">${formatMultilineText(block.content.subtext || "")}</small>
      </div>
      ${socialLinks.length ? `
        <div class="builder-footer-links builder-footer-socials">
          ${socialLinks.map((item) => `
            <a href="${item.url || "#"}" target="_blank" rel="noreferrer" class="builder-footer-social-link">
              ${item.icon ? `<img src="${item.icon}" alt="${item.label || "Red social"}" class="builder-footer-social-icon">` : ""}
              <span>${item.label || "Red social"}</span>
            </a>
          `).join("")}
        </div>
      ` : ""}
    `;
    return box;
  }

  return null;
}

function getZoneItems(position) {
  const items = [];
  builderData
    .filter((block) => block.position === position && !block.hidden)
    .forEach((block) => items.push({
      id: `block:${block.id}`,
      type: "block",
      sortOrder: Number(block.sortOrder ?? 0),
      ref: block
    }));

  ["hero", "slider"].forEach((kind) => {
    const meta = getSpecialSectionMeta(kind);
    if (meta.position === position) {
      items.push({
        id: `special:${kind}`,
        type: "special",
        kind,
        sortOrder: Number(meta.sortOrder ?? 0)
      });
    }
  });

  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

function renderBuilder() {
  const heroSection = document.getElementById("heroSection");
  const sliderSection = document.getElementById("sliderContainer");
  const zones = {
    top: document.getElementById("zoneTop"),
    afterSlider: document.getElementById("zoneAfterSlider"),
    middle: document.getElementById("zoneMiddle"),
    bottom: document.getElementById("zoneBottom"),
    footer: document.getElementById("zoneFooter")
  };

  Object.values(zones).forEach((zone) => {
    if (zone) zone.innerHTML = "";
  });

  Object.keys(zones).forEach((position) => {
    const zone = zones[position];
    if (!zone) return;
    getZoneItems(position).forEach((item) => {
      if (item.type === "block") {
        zone.appendChild(createBlockElement(item.ref));
        return;
      }
      if (item.kind === "hero" && heroSection) zone.appendChild(heroSection);
      if (item.kind === "slider" && sliderSection) zone.appendChild(sliderSection);
    });
  });

  if (heroSection && !heroSection.isConnected && zones.top) {
    zones.top.appendChild(heroSection);
  }
  if (sliderSection && !sliderSection.isConnected && zones.afterSlider) {
    zones.afterSlider.appendChild(sliderSection);
  }

  renderBlocksList();
  renderInspector();
}

function renderBlocksList() {
  const list = document.getElementById("builderBlocksList");
  if (!list) return;
  list.innerHTML = "";

  const specialHero = getSpecialSectionMeta("hero");
  const specialSlider = getSpecialSectionMeta("slider");

  const heroItem = document.createElement("div");
  heroItem.className = `builder-block-item ${builderEditorMode === "hero" ? "active" : ""}`;
  heroItem.innerHTML = `
    <div class="builder-block-item-head">
      <strong>Portada principal</strong>
      <button type="button" onclick="openHeroEditor(${heroSelectedIndex})">Editar</button>
    </div>
    <small>${POSITION_LABELS[specialHero.position]} · Orden ${specialHero.sortOrder}</small>
  `;
  list.appendChild(heroItem);

  const sliderItem = document.createElement("div");
  sliderItem.className = `builder-block-item ${builderEditorMode === "slider" ? "active" : ""}`;
  sliderItem.innerHTML = `
    <div class="builder-block-item-head">
      <strong>Slider principal</strong>
      <button type="button" onclick="openSliderEditor()">Editar</button>
    </div>
    <small>${POSITION_LABELS[specialSlider.position]} · Orden ${specialSlider.sortOrder}</small>
  `;
  list.appendChild(sliderItem);

  sortBlocks();
  builderData.forEach((block) => {
    const item = document.createElement("div");
    item.className = `builder-block-item ${selectedBlockId === block.id && builderEditorMode === "blocks" ? "active" : ""}`;
    item.innerHTML = `
      <div class="builder-block-item-head">
        <strong>${BLOCK_TYPES[block.type]}</strong>
        <button type="button" onclick="seleccionarBloque('${block.id}')">Editar</button>
      </div>
      <small>${POSITION_LABELS[block.position]} · ${block.layout?.width === "half" ? "Medio ancho" : "Ancho completo"} · Orden ${block.sortOrder}${block.hidden ? " · Oculto" : ""}</small>
    `;
    list.appendChild(item);
  });
}

function seleccionarBloque(id) {
  const block = getBlock(id);
  if (!block) return;
  builderEditorMode = "blocks";
  selectedBlockId = id;
  draftBlock = clone(block);
  renderBlocksList();
  renderInspector();
  openBuilderSidebar();
}

function openPageSettingsMode() {
  builderEditorMode = "page";
  pageSettingsDraft = clone(builderSettings || siteSettings || defaultSiteSettings);
  renderBlocksList();
  renderInspector();
  openBuilderSidebar();
}

function openHeroEditor(index = 0) {
  builderEditorMode = "hero";
  heroSelectedIndex = Math.max(0, Math.min(index, (builderSettings.heroCards || []).length - 1));
  heroDraft = normalizeHeroCard((builderSettings.heroCards || [createDefaultHeroCard()])[heroSelectedIndex]);
  renderBlocksList();
  renderInspector();
  openBuilderSidebar();
}

function openSliderEditor() {
  builderEditorMode = "slider";
  sliderDraft = {
    ...getSpecialSectionMeta("slider")
  };
  renderBlocksList();
  renderInspector();
  openBuilderSidebar();
}

function renderInspector() {
  const inspector = document.getElementById("builderInspector");
  if (!inspector) return;

  document.querySelectorAll("[data-builder-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.builderTab === activeBuilderTab);
  });

  if (builderEditorMode === "page") {
    inspector.innerHTML = buildPageSettingsInspector();
    hydratePageSettingsInspector();
    return;
  }

  if (builderEditorMode === "hero") {
    inspector.innerHTML = buildHeroInspector();
    hydrateHeroInspector();
    return;
  }

  if (builderEditorMode === "slider") {
    inspector.innerHTML = buildSliderInspector();
    hydrateSliderInspector();
    return;
  }

  if (!draftBlock) {
    inspector.innerHTML = `<div class="builder-form"><p>Selecciona un bloque para editarlo.</p></div>`;
    return;
  }

  const views = {
    contenido: buildContentTab(draftBlock),
    diseno: buildDesignTab(draftBlock),
    animacion: buildAnimationTab(draftBlock),
    ubicacion: buildPositionTab(draftBlock),
    avanzado: buildAdvancedTab(draftBlock)
  };

  inspector.innerHTML = `
    <div class="builder-form">${views[activeBuilderTab] || ""}</div>
    <div class="builder-apply-bar">
      <button type="button" class="primary-btn" onclick="aplicarCambiosBloque()">Aplicar cambios</button>
    </div>
  `;
  hydrateInspectorValues();
}

function fontSelectMarkup(path, selected) {
  return `
    <select data-path="${path}">
      ${FONT_OPTIONS.map((font) => `<option value="${font}" ${selected === font ? "selected" : ""}>${font}</option>`).join("")}
    </select>
  `;
}

function buildRichTextDesignControls(block) {
  return `
    <label>Alineacion texto<select data-path="design.textAlign"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
    <label>Color titulo<input type="color" data-path="design.titleColor"></label>
    <label>Color descripcion<input type="color" data-path="design.descriptionColor"></label>
    <label>Tamano titulo<input type="number" data-path="design.titleSize"></label>
    <label>Tamano descripcion<input type="number" data-path="design.descriptionSize"></label>
    <label>Fuente titulo${fontSelectMarkup("design.titleFont", block.design.titleFont)}</label>
    <label>Fuente titulo personalizada<input data-path="design.titleFontCustom" placeholder="Ejemplo: Anton"></label>
    <label>Fuente descripcion${fontSelectMarkup("design.descriptionFont", block.design.descriptionFont)}</label>
    <label>Fuente descripcion personalizada<input data-path="design.descriptionFontCustom" placeholder="Ejemplo: Anton"></label>
    <label><input type="checkbox" data-path="design.textShadow"> Activar sombra texto</label>
    <label>Color sombra texto<input data-path="design.textShadowColor" placeholder="rgba(2,8,23,.55)"></label>
  `;
}

function buildFooterSocialEditor(block) {
  const items = block.content.socialLinks || [];
  return `
    <div class="builder-group-title">
      <span>Redes sociales</span>
      <button type="button" onclick="builderAddFooterSocial()">Agregar red</button>
    </div>
    <div class="builder-link-editor-list">
      ${items.map((item, index) => `
        <div class="builder-link-editor-row">
          <label>Nombre<input data-footer-social-index="${index}" data-footer-social-field="label"></label>
          <label>Enlace<input data-footer-social-index="${index}" data-footer-social-field="url"></label>
          <label>URL icono<input data-footer-social-index="${index}" data-footer-social-field="icon" placeholder="https://.../icono.ico"></label>
          <div class="builder-link-editor-actions">
            <button type="button" onclick="builderUploadFooterSocialIcon(${index})">Subir icono</button>
            <button type="button" onclick="builderMoveFooterSocial(${index}, -1)">Subir</button>
            <button type="button" onclick="builderMoveFooterSocial(${index}, 1)">Bajar</button>
            <button type="button" onclick="builderRemoveFooterSocial(${index})">Quitar</button>
          </div>
        </div>
      `).join("") || "<p>No hay redes sociales agregadas.</p>"}
    </div>
  `;
}

function buildFooterTextLinksEditor(block) {
  const items = block.content.textLinks || [];
  return `
    <div class="builder-group-title">
      <span>Enlaces de texto</span>
      <button type="button" onclick="builderAddFooterTextLink()">Agregar enlace</button>
    </div>
    <div class="builder-link-editor-list">
      ${items.map((item, index) => `
        <div class="builder-link-editor-row">
          <label>Texto enlace<input data-footer-link-index="${index}" data-footer-link-field="label"></label>
          <label>URL enlace<input data-footer-link-index="${index}" data-footer-link-field="url"></label>
          <div class="builder-link-editor-actions">
            <button type="button" onclick="builderMoveFooterTextLink(${index}, -1)">Subir</button>
            <button type="button" onclick="builderMoveFooterTextLink(${index}, 1)">Bajar</button>
            <button type="button" onclick="builderRemoveFooterTextLink(${index})">Quitar</button>
          </div>
        </div>
      `).join("") || "<p>No hay enlaces agregados.</p>"}
    </div>
  `;
}

function buildContentTab(block) {
  if (block.type === "texto") {
    return `
      <label>Titulo<input data-path="content.title"></label>
      <label>Descripcion<textarea data-path="content.description"></textarea></label>
      <label>Tamano titulo<input type="number" data-path="content.titleSize"></label>
      <label>Tamano descripcion<input type="number" data-path="content.descriptionSize"></label>
      <label>Fuente titulo${fontSelectMarkup("content.titleFont", block.content.titleFont)}</label>
      <label>Fuente titulo personalizada<input data-path="content.titleFontCustom" placeholder="Ejemplo: 'Anton'"></label>
      <label>Fuente descripcion${fontSelectMarkup("content.descriptionFont", block.content.descriptionFont)}</label>
      <label>Fuente descripcion personalizada<input data-path="content.descriptionFontCustom" placeholder="Ejemplo: 'Anton'"></label>
      <label>Alineacion<select data-path="content.align"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
    `;
  }

  if (block.type === "imagen") {
    return `
      <label>Titulo arriba<input data-path="content.title"></label>
      <label>Descripcion abajo<textarea data-path="content.description"></textarea></label>
      <label>URL imagen<input data-path="content.src"></label>
      <label>Enlace<input data-path="content.link"></label>
      <label>Texto alt<input data-path="content.alt"></label>
      <button type="button" onclick="subirArchivoInspector('imagen')">Subir imagen</button>
    `;
  }

  if (block.type === "slider") {
    return `
      <label>Segundos<input type="number" min="1" data-path="content.seconds"></label>
      <label><input type="checkbox" data-path="content.autoplay"> Autoplay</label>
      <label>Imagenes (una por linea)<textarea data-path="content.imagesText"></textarea></label>
      <button type="button" onclick="subirArchivoInspector('slider')">Subir imagenes</button>
    `;
  }

  if (block.type === "video") {
    return `
      <label>Titulo arriba<input data-path="content.title"></label>
      <label>Descripcion abajo<textarea data-path="content.description"></textarea></label>
      <label>Videos (una URL por linea)<textarea data-path="content.sourcesText"></textarea></label>
      <label><input type="checkbox" data-path="content.autoplay"> Autoplay</label>
      <label><input type="checkbox" data-path="content.muted"> Muted</label>
      <label><input type="checkbox" data-path="content.loop"> Loop</label>
      <label><input type="checkbox" data-path="content.controls"> Controles</label>
      <button type="button" onclick="subirArchivoInspector('video')">Subir video(s)</button>
    `;
  }

  if (block.type === "embed") {
    return `
      <label>Titulo arriba<input data-path="content.title"></label>
      <label>Descripcion abajo<textarea data-path="content.description"></textarea></label>
      <label>Enlaces de TikTok, Instagram o Facebook (uno por linea)<textarea data-path="content.urlsText"></textarea></label>
    `;
  }

  if (block.type === "youtube") {
    return `
      <label>Titulo arriba<input data-path="content.title"></label>
      <label>Descripcion abajo<textarea data-path="content.description"></textarea></label>
      <label>Enlace YouTube<input data-path="content.url"></label>
      <label>Inicio video<select data-path="content.startMode"><option value="click">Con click</option><option value="auto">Automatico</option></select></label>
      <label><input type="checkbox" data-path="content.muted"> Muted</label>
      <label><input type="checkbox" data-path="content.loop"> Loop</label>
    `;
  }

  if (block.type === "whatsapp") {
    return `
      <label>Texto boton<input data-path="content.text"></label>
      <label>Telefono<input data-path="content.phone"></label>
      <label>Mensaje<textarea data-path="content.message"></textarea></label>
    `;
  }

  if (block.type === "banner") {
    return `
      <label>Titulo<input data-path="content.title"></label>
      <label>Descripcion<textarea data-path="content.description"></textarea></label>
      <label>Texto de caja/acento<input data-path="content.badgeText"></label>
      <label>Posicion de caja<select data-path="content.boxPosition"><option value="top">Arriba</option><option value="bottom">Abajo</option></select></label>
      <label>Texto boton<input data-path="content.buttonText"></label>
      <label>Enlace boton<input data-path="content.buttonLink"></label>
    `;
  }

  if (block.type === "destacados") {
    const selectedProducts = block.content.productNames || [];
    const availableProducts = catalogos.flatMap((cat) => cat.productos.map((prod) => prod.nombre)).filter((name) => !selectedProducts.includes(name));
    return `
      <label>Titulo<input data-path="design.sectionTitle"></label>
      <label>Agregar producto
        <select id="featuredProductPool">
          <option value="">Selecciona un producto</option>
          ${availableProducts.map((name) => `<option value="${name}">${name}</option>`).join("")}
        </select>
      </label>
      <button type="button" onclick="builderDraftAddFeaturedProduct()">Agregar a destacados</button>
      <div class="featured-selected-list">
        ${selectedProducts.map((name, index) => `
          <div class="featured-selected-item">
            <strong>${name}</strong>
            <div class="featured-selected-actions">
              <button type="button" onclick="builderDraftMoveFeaturedProduct(${index}, -1)">↑</button>
              <button type="button" onclick="builderDraftMoveFeaturedProduct(${index}, 1)">↓</button>
              <button type="button" onclick="builderDraftRemoveFeaturedProduct(${index})">Quitar</button>
            </div>
          </div>
        `).join("") || "<p>No hay productos seleccionados.</p>"}
      </div>
    `;
  }

  if (block.type === "ubicacion") {
    return `
      <label>Titulo arriba<input data-path="content.title"></label>
      <label>Descripcion abajo<textarea data-path="content.description"></textarea></label>
      <label>Enlace Google Maps<input data-path="content.mapUrl"></label>
    `;
  }

  if (block.type === "piepagina") {
    return `
      <label>Titulo principal<input data-path="content.title"></label>
      <label>Descripcion<textarea data-path="content.description"></textarea></label>
      <label>Subtexto / derechos<textarea data-path="content.subtext"></textarea></label>
      ${buildFooterSocialEditor(block)}
      ${buildFooterTextLinksEditor(block)}
    `;
  }

  return `<p>Este bloque no necesita contenido adicional.</p>`;
}

function buildDesignTab(block) {
  const common = `
    <label>Color texto<input type="color" data-path="design.textColor"></label>
    <label>Ancho caja<input data-path="design.width" placeholder="100%, 860px, 420px"></label>
    <label>Padding<input type="number" data-path="design.padding"></label>
    <label>Redondeado<input type="number" data-path="design.borderRadius"></label>
    <label>Opacidad del fondo<input type="range" min="0" max="1" step="0.05" data-path="design.backgroundOpacity"></label>
    <label><input type="checkbox" data-path="design.transparentBackground"> Fondo transparente</label>
    <label><input type="checkbox" data-path="design.shadow"> Activar sombra propia</label>
    <label>Color sombra<input data-path="design.shadowColor" placeholder="rgba(0,0,0,.25)"></label>
    <label>Color fondo 1<input type="color" data-path="design.gradient.color1"></label>
    <label>Color fondo 2<input type="color" data-path="design.gradient.color2"></label>
    <label>Color fondo 3<input type="color" data-path="design.gradient.color3"></label>
    <label><input type="checkbox" data-path="design.gradient.enabled"> Usar degradado</label>
    <label>Tipo degradado<select data-path="design.gradient.type"><option value="linear">Lineal</option><option value="radial">Radial</option></select></label>
    <label>Direccion / punto<select data-path="design.gradient.position">
      <option value="180deg">Abajo</option>
      <option value="90deg">Derecha</option>
      <option value="135deg">Diagonal derecha</option>
      <option value="45deg">Diagonal izquierda</option>
      <option value="center">Centro</option>
      <option value="top left">Esquina izquierda</option>
      <option value="top right">Esquina derecha</option>
      <option value="bottom left">Abajo izquierda</option>
      <option value="bottom right">Abajo derecha</option>
    </select></label>
  `;

  if (block.type === "slider") {
    return `${common}<label>Modo tamano<select data-path="design.fitMode"><option value="normal">Normal</option><option value="adjust">Ajustar</option></select></label><label>Altura maxima<input type="number" data-path="design.height"></label>`;
  }

  if (["imagen", "video", "embed", "youtube", "ubicacion"].includes(block.type)) {
    const extraControls = block.type === "imagen"
      ? `<label>Object fit<select data-path="design.objectFit"><option value="cover">Cover</option><option value="contain">Contain</option></select></label><label>Opacidad<input type="number" min="0" max="1" step="0.1" data-path="design.opacity"></label>`
      : "";
    return `${common}<label>Modo tamano<select data-path="design.fitMode"><option value="normal">Normal</option><option value="adjust">Ajustar</option></select></label><label>Altura maxima<input type="number" data-path="design.height"></label>${extraControls}${buildRichTextDesignControls(block)}`;
  }

  if (block.type === "banner") {
    return `${common}<label>Fondo caja interna<input data-path="design.accentBackground"></label><label>Alineacion<select data-path="design.align"><option value="left">Izquierda</option><option value="center">Centro</option></select></label>${buildRichTextDesignControls(block)}`;
  }

  if (block.type === "piepagina") {
    return `${common}${buildRichTextDesignControls(block)}`;
  }

  if (block.type === "destacados") {
    return `${common}${buildRichTextDesignControls(block)}`;
  }

  if (block.type === "whatsapp") {
    return `${common}<label>Alineacion<select data-path="design.align"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>`;
  }

  if (block.type === "espaciador") {
    return `${common}<label>Altura<input type="number" data-path="design.height"></label>`;
  }

  return common;
}

function buildAnimationTab() {
  return `<label>Animacion<select data-path="animation"><option value="none">Ninguna</option><option value="fade">Fade</option><option value="up">Subir</option><option value="zoom">Zoom</option></select></label>`;
}

function buildPositionTab(block) {
  return `
    <label>Ubicacion<select data-path="position">
      <option value="top">Arriba de todo</option>
      <option value="afterSlider">Debajo del primer bloque</option>
      <option value="middle">Antes del catalogo</option>
      <option value="bottom">Debajo del catalogo</option>
      <option value="footer">Pie de pagina</option>
    </select></label>
    <label>Ancho en maquetacion<select data-path="layout.width"><option value="full">Ancho completo</option><option value="half">Mitad / al lado de otra</option></select></label>
    <label>Posicion de la caja<select data-path="layout.boxAlign"><option value="left">Izquierda</option><option value="center">Centrada</option><option value="right">Derecha</option></select></label>
    <div class="builder-action-row">
      <button type="button" onclick="moverBloque('${block.id}', -1)">Mover arriba</button>
      <button type="button" onclick="moverBloque('${block.id}', 1)">Mover abajo</button>
      <button type="button" onclick="moverBloqueHorizontal('${block.id}', -1)">Mover izquierda</button>
      <button type="button" onclick="moverBloqueHorizontal('${block.id}', 1)">Mover derecha</button>
    </div>
  `;
}

function buildAdvancedTab(block) {
  return `
    <label>Titulo interno<input data-path="title"></label>
    <label><input type="checkbox" data-path="hidden"> Ocultar bloque</label>
    <div class="builder-action-row">
      <button type="button" onclick="duplicarBloque('${block.id}')">Duplicar</button>
      <button type="button" onclick="eliminarBloqueDirecto('${block.id}')">Eliminar</button>
    </div>
  `;
}

function buildPageSettingsInspector() {
  return `
    <div class="builder-form">
      <label>Nombre logo<input data-site-path="logoText"></label>
      <label>Frase logo<input data-site-path="logoSubtext"></label>
      <label>Color nombre logo<input type="color" data-site-path="logoTextColor"></label>
      <label>Color frase logo<input type="color" data-site-path="logoSubtextColor"></label>
      <label>Fuente logo${fontSelectMarkup("site.logoFontFamily", pageSettingsDraft.logoFontFamily)}</label>
      <label>Fuente titulos pagina${fontSelectMarkup("site.pageHeadingFontFamily", pageSettingsDraft.pageHeadingFontFamily)}</label>
      <label>Fuente general${fontSelectMarkup("site.bodyFontFamily", pageSettingsDraft.bodyFontFamily)}</label>
      <label>Color texto general<input type="color" data-site-path="pageTextColor"></label>
      <label>Color texto secundario<input type="color" data-site-path="pageMutedTextColor"></label>
      <label>Nombre fuente personalizada<input data-site-path="customFontName" placeholder="Ejemplo: Anton"></label>
      <label>URL fuente personalizada<input data-site-path="customFontUrl" placeholder="https://fonts.googleapis.com/..."></label>
      <label><input type="checkbox" data-site-path="pageBackgroundEnabled"> Fondo especial para toda la pagina</label>
      <label>Tipo fondo<select data-site-path="pageBackgroundType"><option value="linear">Lineal</option><option value="radial">Radial</option></select></label>
      <label>Direccion / punto<select data-site-path="pageBackgroundPosition">
        <option value="180deg">Abajo</option>
        <option value="90deg">Derecha</option>
        <option value="135deg">Diagonal derecha</option>
        <option value="45deg">Diagonal izquierda</option>
        <option value="center">Centro</option>
        <option value="top left">Esquina izquierda</option>
        <option value="top right">Esquina derecha</option>
        <option value="bottom left">Abajo izquierda</option>
        <option value="bottom right">Abajo derecha</option>
      </select></label>
      <label>Color fondo 1<input type="color" data-site-path="pageBackgroundColor1"></label>
      <label>Color fondo 2<input type="color" data-site-path="pageBackgroundColor2"></label>
      <label>Color fondo 3<input type="color" data-site-path="pageBackgroundColor3"></label>
      <label>URL imagen de fondo<input data-site-path="pageBackgroundImage" placeholder="https://..."></label>
      <label>Ajuste imagen fondo<select data-site-path="pageBackgroundImageFit">
        <option value="cover">Cubrir completo</option>
        <option value="contain">Mostrar completa</option>
        <option value="100% auto">Ancho completo</option>
        <option value="auto 100%">Alto completo</option>
        <option value="auto">Tamano natural</option>
      </select></label>
      <label>Repeticion imagen<select data-site-path="pageBackgroundImageRepeat">
        <option value="no-repeat">No repetir</option>
        <option value="repeat">Repetir</option>
        <option value="repeat-x">Repetir horizontal</option>
        <option value="repeat-y">Repetir vertical</option>
      </select></label>
      <label>Posicion imagen fondo<select data-site-path="pageBackgroundImagePosition">
        <option value="center center">Centro</option>
        <option value="top center">Arriba</option>
        <option value="bottom center">Abajo</option>
        <option value="center left">Izquierda</option>
        <option value="center right">Derecha</option>
      </select></label>
      <label>Comportamiento<select data-site-path="pageBackgroundImageAttachment">
        <option value="scroll">Normal</option>
        <option value="fixed">Fijo</option>
      </select></label>
      <label>Claridad imagen fondo<input type="number" min="0.4" max="1.6" step="0.05" data-site-path="pageBackgroundImageBrightness"></label>
      <label>Intensidad imagen fondo<input type="number" min="0" max="1" step="0.05" data-site-path="pageBackgroundImageOpacity"></label>
      <label>Oscuridad fondo<input type="number" min="0" max="0.85" step="0.05" data-site-path="pageBackgroundOverlayOpacity"></label>
      <label>Color sombra productos<input data-site-path="productShadowColor" placeholder="rgba(2,8,23,.42) o #000000"></label>
      <label>Color sombra hover<input data-site-path="productHoverShadowColor" placeholder="rgba(56,189,248,.25) o #38bdf8"></label>
      <label>Suavidad hover<input type="number" step="0.01" data-site-path="productHoverDuration"></label>
      <label>Elevacion hover<input type="number" step="1" data-site-path="productHoverLift"></label>
      <label>Escala hover<input type="number" step="0.01" data-site-path="productHoverScale"></label>
      <div class="builder-action-row">
        <button type="button" onclick="subirLogoDesdeAjustesPagina()">Subir imagen logo</button>
        <button type="button" onclick="subirFondoDesdeAjustesPagina()">Subir fondo pagina</button>
      </div>
      <div class="builder-apply-bar">
        <button type="button" class="primary-btn" onclick="aplicarAjustesPagina()">Aplicar cambios</button>
      </div>
    </div>
  `;
}

function buildHeroInspector() {
  if (!heroDraft) return `<div class="builder-form"><p>No hay portada seleccionada.</p></div>`;
  const heroMeta = getSpecialSectionMeta("hero");
  return `
    <div class="builder-form">
      <label>Etiqueta superior<input data-hero-path="eyebrow"></label>
      <label>Titulo<textarea data-hero-path="title"></textarea></label>
      <label>Descripcion<textarea data-hero-path="description"></textarea></label>
      <label>Tamano titulo<input type="number" data-hero-path="design.titleSize"></label>
      <label>Tamano descripcion<input type="number" data-hero-path="design.descriptionSize"></label>
      <label>Zona de la portada<select data-hero-setting="position"><option value="top">Arriba</option><option value="afterSlider">Debajo del primer bloque</option><option value="middle">Antes del catalogo</option><option value="bottom">Debajo del catalogo</option><option value="footer">Pie</option></select></label>
      <label>Ancho de portada<select data-hero-path="design.layoutWidth"><option value="full">Completa</option><option value="half">Mitad</option></select></label>
      <label>Posicion de la caja<select data-hero-path="design.boxAlign"><option value="left">Izquierda</option><option value="center">Centrada</option><option value="right">Derecha</option></select></label>
      <label>Fuente titulo${fontSelectMarkup("hero.design.titleFont", heroDraft.design.titleFont)}</label>
      <label>Fuente titulo personalizada<input data-hero-path="design.titleFontCustom"></label>
      <label>Fuente descripcion${fontSelectMarkup("hero.design.descriptionFont", heroDraft.design.descriptionFont)}</label>
      <label>Fuente descripcion personalizada<input data-hero-path="design.descriptionFontCustom"></label>
      <label>Alineacion contenido<select data-hero-path="design.align"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
      <label>Ancho caja<input data-hero-path="design.width" placeholder="100%, 900px"></label>
      <label>Padding<input type="number" data-hero-path="design.padding"></label>
      <label>Redondeado<input type="number" data-hero-path="design.borderRadius"></label>
      <label>Color etiqueta<input type="color" data-hero-path="design.eyebrowColor"></label>
      <label>Color titulo<input type="color" data-hero-path="design.titleColor"></label>
      <label>Color descripcion<input type="color" data-hero-path="design.descriptionColor"></label>
      <label><input type="checkbox" data-hero-path="design.gradient.enabled"> Usar degradado</label>
      <label>Tipo degradado<select data-hero-path="design.gradient.type"><option value="linear">Lineal</option><option value="radial">Radial</option></select></label>
      <label>Direccion / punto<select data-hero-path="design.gradient.position">
        <option value="180deg">Abajo</option>
        <option value="90deg">Derecha</option>
        <option value="135deg">Diagonal derecha</option>
        <option value="45deg">Diagonal izquierda</option>
        <option value="center">Centro</option>
        <option value="top left">Esquina izquierda</option>
        <option value="top right">Esquina derecha</option>
        <option value="bottom left">Abajo izquierda</option>
        <option value="bottom right">Abajo derecha</option>
      </select></label>
      <label>Color fondo 1<input data-hero-path="design.gradient.color1"></label>
      <label>Color fondo 2<input data-hero-path="design.gradient.color2"></label>
      <label>Color fondo 3<input data-hero-path="design.gradient.color3"></label>
      <div class="builder-action-row">
        <button type="button" onclick="moveSpecialSection('hero', -1)">Mover arriba</button>
        <button type="button" onclick="moveSpecialSection('hero', 1)">Mover abajo</button>
      </div>
      <div class="builder-action-row">
        <button type="button" onclick="moveHeroCard(-1)">Caja anterior</button>
        <button type="button" onclick="moveHeroCard(1)">Caja siguiente</button>
      </div>
      <div class="builder-action-row">
        <button type="button" onclick="addHeroCard()">Crear portada</button>
        <button type="button" onclick="duplicateHeroCard()">Duplicar portada</button>
        <button type="button" onclick="removeHeroCard()">Eliminar portada</button>
      </div>
      <small>Orden actual: ${heroMeta.sortOrder}</small>
      <div class="builder-apply-bar">
        <button type="button" class="primary-btn" onclick="applyHeroCardChanges()">Aplicar cambios</button>
      </div>
    </div>
  `;
}

function buildSliderInspector() {
  const sliderMeta = sliderDraft || getSpecialSectionMeta("slider");
  return `
    <div class="builder-form">
      <p>El slider principal ahora usa 100% del ancho de la pagina.</p>
      <label>Zona del slider<select data-slider-path="position">
        <option value="top">Arriba</option>
        <option value="afterSlider">Debajo del primer bloque</option>
        <option value="middle">Antes del catalogo</option>
        <option value="bottom">Debajo del catalogo</option>
        <option value="footer">Pie</option>
      </select></label>
      <div class="builder-action-row">
        <button type="button" onclick="moveSpecialSection('slider', -1)">Mover arriba</button>
        <button type="button" onclick="moveSpecialSection('slider', 1)">Mover abajo</button>
      </div>
      <small>Orden actual: ${sliderMeta.sortOrder}</small>
      <div class="builder-group-title">
        <span>Slides</span>
        <button type="button" onclick="agregarSlide()">Agregar slide</button>
      </div>
      <div class="builder-blocks-list">
        ${(slidesData || []).map((slide, index) => `
          <div class="builder-block-item">
            <div class="builder-block-item-head">
              <strong>${slide.texto || `Slide ${index + 1}`}</strong>
              <button type="button" onclick="editarSlide(${index})">Editar</button>
            </div>
            <small>${slide.descripcion || "Sin descripcion"} · ${slide.duracion || 4}s</small>
            <div class="builder-action-row">
              <button type="button" onclick="setSliderIndexFromBuilder(${index})">Ver</button>
              <button type="button" class="danger-btn" onclick="eliminarSlide(${index})">Eliminar</button>
            </div>
          </div>
        `).join("") || "<p>No hay slides creados.</p>"}
      </div>
      <div class="builder-apply-bar">
        <button type="button" class="primary-btn" onclick="applySliderChanges()">Aplicar cambios</button>
      </div>
    </div>
  `;
}

function hydrateFooterEditorFields() {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  document.querySelectorAll("#builderInspector [data-footer-social-field]").forEach((field) => {
    const index = Number(field.dataset.footerSocialIndex);
    const key = field.dataset.footerSocialField;
    field.value = draftBlock.content.socialLinks?.[index]?.[key] ?? "";
  });
  document.querySelectorAll("#builderInspector [data-footer-link-field]").forEach((field) => {
    const index = Number(field.dataset.footerLinkIndex);
    const key = field.dataset.footerLinkField;
    field.value = draftBlock.content.textLinks?.[index]?.[key] ?? "";
  });
}

function hydrateInspectorValues() {
  if (!draftBlock) return;
  document.querySelectorAll("#builderInspector [data-path]").forEach((field) => {
    const pathMap = {
      "content.imagesText": "content.images",
      "content.sourcesText": "content.sources",
      "content.urlsText": "content.urls"
    };
    const path = pathMap[field.dataset.path] || field.dataset.path;
    const value = getNestedValue(draftBlock, path);
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else if (field.dataset.path === "content.imagesText") {
      field.value = Array.isArray(draftBlock.content.images) ? draftBlock.content.images.join("\n") : "";
    } else if (field.dataset.path === "content.sourcesText") {
      field.value = Array.isArray(draftBlock.content.sources) ? draftBlock.content.sources.join("\n") : (draftBlock.content.src || "");
    } else if (field.dataset.path === "content.urlsText") {
      field.value = Array.isArray(draftBlock.content.urls) ? draftBlock.content.urls.join("\n") : (draftBlock.content.url || "");
    } else {
      field.value = value ?? "";
    }
  });
  hydrateFooterEditorFields();
}

function hydratePageSettingsInspector() {
  if (!pageSettingsDraft) return;
  document.querySelectorAll("#builderInspector [data-site-path]").forEach((field) => {
    const value = getNestedValue(pageSettingsDraft, field.dataset.sitePath);
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? "";
    }
  });
  const logoSelect = document.querySelector('[data-path="site.logoFontFamily"]');
  if (logoSelect) logoSelect.value = pageSettingsDraft.logoFontFamily || "Space Grotesk";
  const headingSelect = document.querySelector('[data-path="site.pageHeadingFontFamily"]');
  if (headingSelect) headingSelect.value = pageSettingsDraft.pageHeadingFontFamily || "Space Grotesk";
  const bodySelect = document.querySelector('[data-path="site.bodyFontFamily"]');
  if (bodySelect) bodySelect.value = pageSettingsDraft.bodyFontFamily || "Manrope";
}

function hydrateHeroInspector() {
  if (!heroDraft) return;
  document.querySelectorAll("#builderInspector [data-hero-path]").forEach((field) => {
    const value = getNestedValue(heroDraft, field.dataset.heroPath);
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? "";
    }
  });
  const titleSelect = document.querySelector('[data-path="hero.design.titleFont"]');
  if (titleSelect) titleSelect.value = heroDraft.design.titleFont || "Space Grotesk";
  const descSelect = document.querySelector('[data-path="hero.design.descriptionFont"]');
  if (descSelect) descSelect.value = heroDraft.design.descriptionFont || "Manrope";
  const heroPositionSelect = document.querySelector('[data-hero-setting="position"]');
  if (heroPositionSelect) heroPositionSelect.value = getSpecialSectionMeta("hero").position || "top";
}

function hydrateSliderInspector() {
  if (!sliderDraft) return;
  document.querySelectorAll("#builderInspector [data-slider-path]").forEach((field) => {
    const value = getNestedValue(sliderDraft, field.dataset.sliderPath);
    field.value = value ?? "";
  });
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((acc, key, index) => {
    const nextKey = keys[index + 1];
    if (acc[key] === undefined) {
      acc[key] = Number.isInteger(Number(nextKey)) ? [] : {};
    }
    return acc[key];
  }, obj);
  target[last] = value;
}

function parseFieldValue(field) {
  if (field.type === "checkbox") return field.checked;
  if (field.type === "number" || field.type === "range") return Number(field.value);
  return field.value;
}

function aplicarCambiosBloque() {
  if (!draftBlock) return;
  syncDraftBlockFieldsFromInspector();
  const index = builderData.findIndex((item) => item.id === draftBlock.id);
  if (index >= 0) builderData[index] = normalizeBlock(draftBlock);
  guardarBuilderSupabase();
}

function syncDraftBlockFieldsFromInspector() {
  if (!draftBlock) return;
  const inspector = document.getElementById("builderInspector");
  inspector.querySelectorAll("[data-path]").forEach((field) => {
    if (field.dataset.path.startsWith("site.") || field.dataset.path.startsWith("hero.")) return;
    if (field.dataset.path === "content.imagesText") {
      draftBlock.content.images = field.value.split("\n").map((item) => item.trim()).filter(Boolean);
      return;
    }
    if (field.dataset.path === "content.sourcesText") {
      draftBlock.content.sources = field.value.split("\n").map((item) => item.trim()).filter(Boolean);
      draftBlock.content.src = draftBlock.content.sources[0] || "";
      return;
    }
    if (field.dataset.path === "content.urlsText") {
      draftBlock.content.urls = field.value.split("\n").map((item) => item.trim()).filter(Boolean);
      draftBlock.content.url = draftBlock.content.urls[0] || "";
      return;
    }
    setNestedValue(draftBlock, field.dataset.path, parseFieldValue(field));
  });

  if (draftBlock.type === "piepagina") {
    draftBlock.content.socialLinks = draftBlock.content.socialLinks || [];
    document.querySelectorAll("#builderInspector [data-footer-social-field]").forEach((field) => {
      const index = Number(field.dataset.footerSocialIndex);
      const key = field.dataset.footerSocialField;
      draftBlock.content.socialLinks[index] = draftBlock.content.socialLinks[index] || { label: "Red social", url: "", icon: "" };
      draftBlock.content.socialLinks[index][key] = field.value.trim();
    });
    draftBlock.content.textLinks = draftBlock.content.textLinks || [];
    document.querySelectorAll("#builderInspector [data-footer-link-field]").forEach((field) => {
      const index = Number(field.dataset.footerLinkIndex);
      const key = field.dataset.footerLinkField;
      draftBlock.content.textLinks[index] = draftBlock.content.textLinks[index] || { label: "Enlace", url: "" };
      draftBlock.content.textLinks[index][key] = field.value.trim();
    });
  }
}

function aplicarAjustesPagina() {
  if (!pageSettingsDraft) return;
  const inspector = document.getElementById("builderInspector");
  inspector.querySelectorAll("[data-site-path]").forEach((field) => {
    setNestedValue(pageSettingsDraft, field.dataset.sitePath, parseFieldValue(field));
  });
  const logoSelect = document.querySelector('[data-path="site.logoFontFamily"]');
  if (logoSelect) pageSettingsDraft.logoFontFamily = logoSelect.value;
  const headingSelect = document.querySelector('[data-path="site.pageHeadingFontFamily"]');
  if (headingSelect) pageSettingsDraft.pageHeadingFontFamily = headingSelect.value;
  const bodySelect = document.querySelector('[data-path="site.bodyFontFamily"]');
  if (bodySelect) pageSettingsDraft.bodyFontFamily = bodySelect.value;
  builderSettings = { ...defaultSiteSettings, ...pageSettingsDraft };
  builderSettings.heroCards = (builderSettings.heroCards || defaultSiteSettings.heroCards).map(normalizeHeroCard);
  window.syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
}

function applyHeroCardChanges() {
  if (!heroDraft) return;
  const inspector = document.getElementById("builderInspector");
  inspector.querySelectorAll("[data-hero-path]").forEach((field) => {
    setNestedValue(heroDraft, field.dataset.heroPath, parseFieldValue(field));
  });
  const titleSelect = document.querySelector('[data-path="hero.design.titleFont"]');
  if (titleSelect) heroDraft.design.titleFont = titleSelect.value;
  const descSelect = document.querySelector('[data-path="hero.design.descriptionFont"]');
  if (descSelect) heroDraft.design.descriptionFont = descSelect.value;
  const positionSelect = document.querySelector('[data-hero-setting="position"]');
  if (positionSelect) setSpecialSectionMeta("hero", { position: positionSelect.value });

  builderSettings.heroCards = builderSettings.heroCards || [];
  builderSettings.heroCards[heroSelectedIndex] = normalizeHeroCard(heroDraft);
  window.syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
}

function applySliderChanges() {
  if (!sliderDraft) return;
  const inspector = document.getElementById("builderInspector");
  inspector.querySelectorAll("[data-slider-path]").forEach((field) => {
    setNestedValue(sliderDraft, field.dataset.sliderPath, parseFieldValue(field));
  });
  setSpecialSectionMeta("slider", { position: sliderDraft.position || "afterSlider" });
  guardarBuilderSupabase();
}

function moveHeroCard(step) {
  builderSettings.heroCards = builderSettings.heroCards || [];
  const target = heroSelectedIndex + step;
  if (target < 0 || target >= builderSettings.heroCards.length) return;
  [builderSettings.heroCards[heroSelectedIndex], builderSettings.heroCards[target]] = [builderSettings.heroCards[target], builderSettings.heroCards[heroSelectedIndex]];
  heroSelectedIndex = target;
  heroDraft = clone(builderSettings.heroCards[heroSelectedIndex]);
  window.syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
  renderBlocksList();
  renderInspector();
}

function addHeroCard() {
  builderSettings.heroCards = builderSettings.heroCards || [];
  builderSettings.heroCards.push(normalizeHeroCard(createDefaultHeroCard()));
  heroSelectedIndex = builderSettings.heroCards.length - 1;
  heroDraft = clone(builderSettings.heroCards[heroSelectedIndex]);
  builderEditorMode = "hero";
  window.syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
  renderBlocksList();
  renderInspector();
}

function duplicateHeroCard() {
  if (!heroDraft) return;
  builderSettings.heroCards = builderSettings.heroCards || [];
  const copy = normalizeHeroCard(clone(heroDraft));
  builderSettings.heroCards.splice(heroSelectedIndex + 1, 0, copy);
  heroSelectedIndex += 1;
  heroDraft = clone(copy);
  builderEditorMode = "hero";
  window.syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
  renderBlocksList();
  renderInspector();
}

function removeHeroCard() {
  builderSettings.heroCards = builderSettings.heroCards || [];
  if (builderSettings.heroCards.length <= 1) return;
  builderSettings.heroCards.splice(heroSelectedIndex, 1);
  heroSelectedIndex = Math.max(0, heroSelectedIndex - 1);
  heroDraft = clone(builderSettings.heroCards[heroSelectedIndex]);
  window.syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
  renderBlocksList();
  renderInspector();
}

async function subirArchivoInspector(type) {
  if (!draftBlock) return;
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = type === "slider" || type === "video";
  input.accept = type === "video" ? "video/*" : "image/*";
  input.onchange = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    if (type === "slider") {
      draftBlock.content.images = [];
      for (const file of files) {
        draftBlock.content.images.push(await subirArchivoABucket("productos", "builder_slider", file));
      }
      const field = document.querySelector('[data-path="content.imagesText"]');
      if (field) field.value = draftBlock.content.images.join("\n");
      return;
    }
    if (type === "video") {
      draftBlock.content.sources = [];
      for (const file of files) {
        draftBlock.content.sources.push(await subirArchivoABucket("slides", "builder_video", file));
      }
      draftBlock.content.src = draftBlock.content.sources[0] || "";
      const field = document.querySelector('[data-path="content.sourcesText"]');
      if (field) field.value = draftBlock.content.sources.join("\n");
      return;
    }
    draftBlock.content.src = await subirArchivoABucket("productos", "builder_img", files[0]);
    const field = document.querySelector('[data-path="content.src"]');
    if (field) field.value = draftBlock.content.src;
  };
  input.click();
}

async function builderUploadFooterSocialIcon(index) {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".ico,image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    draftBlock.content.socialLinks[index] = draftBlock.content.socialLinks[index] || { label: "Red social", url: "", icon: "" };
    draftBlock.content.socialLinks[index].icon = await subirArchivoABucket("productos", "footer_icon", file);
    renderInspector();
  };
  input.click();
}

async function subirLogoDesdeAjustesPagina() {
  if (!pageSettingsDraft) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pageSettingsDraft.logoImage = await subirArchivoABucket("productos", "logo_empresa", file);
    window.syncSiteSettings(pageSettingsDraft);
    renderInspector();
  };
  input.click();
}

async function subirFondoDesdeAjustesPagina() {
  if (!pageSettingsDraft) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pageSettingsDraft.pageBackgroundImage = await subirArchivoABucket("productos", "fondo_pagina", file);
    pageSettingsDraft.pageBackgroundImageRepeat = pageSettingsDraft.pageBackgroundImageRepeat || "no-repeat";
    pageSettingsDraft.pageBackgroundImageFit = pageSettingsDraft.pageBackgroundImageFit || "cover";
    pageSettingsDraft.pageBackgroundImageOpacity = pageSettingsDraft.pageBackgroundImageOpacity ?? 1;
    window.syncSiteSettings(pageSettingsDraft);
    renderInspector();
  };
  input.click();
}

function swapLayoutItems(source, target) {
  const sourceOrder = source.type === "block" ? Number(source.ref.sortOrder ?? 0) : Number(getSpecialSectionMeta(source.kind).sortOrder ?? 0);
  const targetOrder = target.type === "block" ? Number(target.ref.sortOrder ?? 0) : Number(getSpecialSectionMeta(target.kind).sortOrder ?? 0);

  if (source.type === "block") {
    source.ref.sortOrder = targetOrder;
  } else {
    window.accessState.specialSections[source.kind].sortOrder = targetOrder;
  }

  if (target.type === "block") {
    target.ref.sortOrder = sourceOrder;
  } else {
    window.accessState.specialSections[target.kind].sortOrder = sourceOrder;
  }
}

function getLayoutItemById(layoutId) {
  if (layoutId.startsWith("block:")) {
    const block = getBlock(layoutId.replace("block:", ""));
    return block ? { type: "block", ref: block } : null;
  }
  if (layoutId === "special:hero") {
    return { type: "special", kind: "hero", ref: getSpecialSectionMeta("hero") };
  }
  if (layoutId === "special:slider") {
    return { type: "special", kind: "slider", ref: getSpecialSectionMeta("slider") };
  }
  return null;
}

function moveLayoutItem(layoutId, step) {
  const item = getLayoutItemById(layoutId);
  if (!item) return;
  const position = item.type === "block" ? item.ref.position : item.ref.position;
  const siblings = getZoneItems(position);
  const index = siblings.findIndex((entry) => entry.id === layoutId);
  const targetIndex = index + step;
  if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
  const sourceTarget = siblings[index];
  const otherTarget = siblings[targetIndex];
  swapLayoutItems(sourceTarget, otherTarget);
  window.syncAccessState(window.accessState);
  guardarBuilderSupabase();
}

function moverBloque(id, step) {
  moveLayoutItem(`block:${id}`, step);
}

function moveSpecialSection(kind, step) {
  moveLayoutItem(`special:${kind}`, step);
}

function moverBloqueHorizontal(id, step) {
  const block = getBlock(id);
  if (!block || block.layout?.width !== "half") return;
  sortBlocks();
  const siblings = builderData.filter((item) => item.position === block.position && item.layout?.width === "half");
  const index = siblings.findIndex((item) => item.id === id);
  const target = index + step;
  if (target < 0 || target >= siblings.length) return;
  const sourceBlock = siblings[index];
  const targetBlock = siblings[target];
  const sourceOrder = sourceBlock.sortOrder;
  sourceBlock.sortOrder = targetBlock.sortOrder;
  targetBlock.sortOrder = sourceOrder;
  guardarBuilderSupabase();
}

function duplicarBloque(id) {
  const block = getBlock(id);
  if (!block) return;
  const copy = normalizeBlock(clone(block));
  copy.id = uid();
  copy.title = `${copy.title} copia`;
  copy.sortOrder = (copy.sortOrder || 0) + 1;
  builderData.push(copy);
  selectedBlockId = copy.id;
  draftBlock = clone(copy);
  guardarBuilderSupabase();
}

function toggleBloque(id) {
  const block = getBlock(id);
  if (!block) return;
  block.hidden = !block.hidden;
  guardarBuilderSupabase();
}

function eliminarBloqueDirecto(id) {
  builderData = builderData.filter((item) => item.id !== id);
  if (selectedBlockId === id) {
    selectedBlockId = builderData[0]?.id || null;
    draftBlock = selectedBlockId ? clone(getBlock(selectedBlockId)) : null;
  }
  guardarBuilderSupabase();
}

function builderDraftAddFeaturedProduct() {
  if (!draftBlock || draftBlock.type !== "destacados") return;
  syncDraftBlockFieldsFromInspector();
  const select = document.getElementById("featuredProductPool");
  if (!select?.value) return;
  draftBlock.content.productNames = draftBlock.content.productNames || [];
  if (!draftBlock.content.productNames.includes(select.value)) {
    draftBlock.content.productNames.push(select.value);
  }
  renderInspector();
}

function builderDraftRemoveFeaturedProduct(index) {
  if (!draftBlock || draftBlock.type !== "destacados") return;
  syncDraftBlockFieldsFromInspector();
  draftBlock.content.productNames.splice(index, 1);
  renderInspector();
}

function builderDraftMoveFeaturedProduct(index, direction) {
  if (!draftBlock || draftBlock.type !== "destacados") return;
  syncDraftBlockFieldsFromInspector();
  const target = index + direction;
  if (target < 0 || target >= draftBlock.content.productNames.length) return;
  [draftBlock.content.productNames[index], draftBlock.content.productNames[target]] = [draftBlock.content.productNames[target], draftBlock.content.productNames[index]];
  renderInspector();
}

function builderAddFooterSocial() {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  draftBlock.content.socialLinks = draftBlock.content.socialLinks || [];
  draftBlock.content.socialLinks.push({ label: "Nueva red", url: "", icon: "" });
  renderInspector();
}

function builderRemoveFooterSocial(index) {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  draftBlock.content.socialLinks.splice(index, 1);
  renderInspector();
}

function builderMoveFooterSocial(index, direction) {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  const target = index + direction;
  if (target < 0 || target >= draftBlock.content.socialLinks.length) return;
  [draftBlock.content.socialLinks[index], draftBlock.content.socialLinks[target]] = [draftBlock.content.socialLinks[target], draftBlock.content.socialLinks[index]];
  renderInspector();
}

function builderAddFooterTextLink() {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  draftBlock.content.textLinks = draftBlock.content.textLinks || [];
  draftBlock.content.textLinks.push({ label: "Nuevo enlace", url: "" });
  renderInspector();
}

function builderRemoveFooterTextLink(index) {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  draftBlock.content.textLinks.splice(index, 1);
  renderInspector();
}

function builderMoveFooterTextLink(index, direction) {
  if (!draftBlock || draftBlock.type !== "piepagina") return;
  syncDraftBlockFieldsFromInspector();
  const target = index + direction;
  if (target < 0 || target >= draftBlock.content.textLinks.length) return;
  [draftBlock.content.textLinks[index], draftBlock.content.textLinks[target]] = [draftBlock.content.textLinks[target], draftBlock.content.textLinks[index]];
  renderInspector();
}

function openBuilderSidebar() {
  if (!canUseBuilder()) return;
  document.getElementById("builderSidebar").classList.remove("hidden");
}

function closeBuilderSidebar() {
  document.getElementById("builderSidebar").classList.add("hidden");
}

window.closeBuilderSidebar = closeBuilderSidebar;

function addBuilderBlock(type) {
  const block = normalizeBlock(getDefaultBlock(type));
  if (type === "destacados") {
    block.content.productNames = catalogos.flatMap((cat) => cat.productos.map((prod) => prod.nombre)).slice(0, 4);
  }
  if (type === "piepagina") {
    block.position = "footer";
    block.layout.width = "full";
  }
  builderData.push(block);
  selectedBlockId = block.id;
  draftBlock = clone(block);
  builderEditorMode = "blocks";
  guardarBuilderSupabase();
}

function makeSidebarDraggable() {
  const panel = document.getElementById("builderSidebar");
  const handle = document.getElementById("builderDragHandle");
  if (!panel || !handle) return;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (e) => {
    dragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    panel.classList.add("floating");
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    panel.style.left = `${Math.max(0, e.clientX - offsetX)}px`;
    panel.style.top = `${Math.max(0, e.clientY - offsetY)}px`;
    panel.style.right = "auto";
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });
}

function initBuilderControls() {
  document.getElementById("btnBuilderAdmin")?.addEventListener("click", openBuilderSidebar);
  document.getElementById("builderCloseBtn")?.addEventListener("click", closeBuilderSidebar);
  document.getElementById("builderPageBtn")?.addEventListener("click", openPageSettingsMode);
  document.getElementById("builderHeroBtn")?.addEventListener("click", () => openHeroEditor(0));
  document.getElementById("builderSliderBtn")?.addEventListener("click", openSliderEditor);
  document.getElementById("builderBlocksBtn")?.addEventListener("click", () => {
    builderEditorMode = "blocks";
    renderBlocksList();
    renderInspector();
  });
  document.querySelectorAll("[data-builder-type]").forEach((btn) => {
    btn.addEventListener("click", () => addBuilderBlock(btn.dataset.builderType));
  });
  document.querySelectorAll("[data-builder-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeBuilderTab = btn.dataset.builderTab;
      renderInspector();
    });
  });
  document.getElementById("builderOpacityRange")?.addEventListener("input", (e) => {
    document.getElementById("builderSidebar").style.opacity = e.target.value;
  });
  makeSidebarDraggable();
}

function extractYoutubeId(url = "") {
  try {
    if (!url) return "";
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split(/[?&]/)[0];
    if (url.includes("watch?v=")) return url.split("watch?v=")[1].split("&")[0];
    if (url.includes("/shorts/")) return url.split("/shorts/")[1].split(/[?&]/)[0];
    if (url.includes("/embed/")) return url.split("/embed/")[1].split(/[?&]/)[0];
  } catch {
    return "";
  }
  return "";
}

function buildYoutubeEmbed(url = "", options = {}) {
  const id = extractYoutubeId(url);
  if (!id) return "";
  const params = new URLSearchParams({
    autoplay: options.startMode === "auto" || builderRuntime.youtubePlaying[options.id || id] ? "1" : "0",
    mute: options.muted ? "1" : "0",
    rel: "0",
    controls: "1",
    playsinline: "1",
    modestbranding: "1"
  });
  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

function buildSocialEmbed(url = "") {
  if (!url) return { src: "", kind: "" };
  if (url.includes("tiktok.com")) {
    const match = url.match(/video\/(\d+)/);
    return { src: match ? `https://www.tiktok.com/player/v1/${match[1]}` : "", kind: "tiktok" };
  }
  if (url.includes("instagram.com")) {
    const clean = url.split("?")[0].replace(/\/$/, "");
    return { src: `${clean}/embed`, kind: "instagram" };
  }
  if (url.includes("facebook.com")) {
    return { src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=1280`, kind: "facebook" };
  }
  return { src: "", kind: "" };
}

function buildMapEmbed(url = "") {
  if (!url) return "";
  if (url.includes("/embed")) return url;
  if (url.includes("@")) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return `https://www.google.com/maps?q=${match[1]},${match[2]}&output=embed`;
  }
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get("q");
    if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    if (parsed.pathname.includes("/place/")) {
      const place = decodeURIComponent(parsed.pathname.split("/place/")[1].split("/")[0]).replace(/\+/g, " ");
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }
  } catch {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
}

function playYoutubeInline(id) {
  builderRuntime.youtubePlaying[id] = true;
  renderBuilder();
}

function builderNext(id) {
  const block = getBlock(id);
  if (!block || !block.content.images?.length) return;
  block.content.currentIndex = ((block.content.currentIndex || 0) + 1) % block.content.images.length;
  renderBuilder();
}

function builderPrev(id) {
  const block = getBlock(id);
  if (!block || !block.content.images?.length) return;
  block.content.currentIndex = ((block.content.currentIndex || 0) - 1 + block.content.images.length) % block.content.images.length;
  renderBuilder();
}

function builderSetCarouselIndex(id, index) {
  const block = getBlock(id);
  if (!block) return;
  const total = block.type === "video"
    ? (block.content.sources || []).length
    : block.type === "embed"
      ? (block.content.urls || []).length
      : 0;
  if (!total) return;
  block.content.currentIndex = Math.max(0, Math.min(index, total - 1));
  renderBuilder();
}

function builderShiftVideoCarousel(id, step) {
  const block = getBlock(id);
  const total = (block?.content?.sources || []).length;
  if (!block || !total) return;
  block.content.currentIndex = ((block.content.currentIndex || 0) + step + total) % total;
  renderBuilder();
}

function builderShiftEmbedCarousel(id, step) {
  const block = getBlock(id);
  const total = (block?.content?.urls || []).length;
  if (!block || !total) return;
  block.content.currentIndex = ((block.content.currentIndex || 0) + step + total) % total;
  renderBuilder();
}

function destacadosPrev(id) {
  const block = getBlock(id);
  if (!block) return;
  const visible = getVisibleFeaturedCount();
  const total = (block.content.productNames || []).length;
  const maxStart = Math.max(0, total - visible);
  block.content.currentIndex = block.content.currentIndex > 0 ? block.content.currentIndex - 1 : maxStart;
  renderBuilder();
}

function destacadosNext(id) {
  const block = getBlock(id);
  if (!block) return;
  const visible = getVisibleFeaturedCount();
  const total = (block.content.productNames || []).length;
  const maxStart = Math.max(0, total - visible);
  block.content.currentIndex = block.content.currentIndex < maxStart ? block.content.currentIndex + 1 : 0;
  renderBuilder();
}

function setSliderIndexFromBuilder(index) {
  slideIndex = index;
  renderSlider();
}

window.builderHooks.render = renderBuilder;
window.builderHooks.refreshFeatured = renderBuilder;
window.builderHooks.setAdmin = () => {
  document.getElementById("builderPanel").style.display = canUseBuilder() ? "block" : "none";
  document.getElementById("heroAdminTools").classList.toggle("hidden", !canUseBuilder());
  document.getElementById("sliderAdmin").classList.toggle("hidden", !canUseBuilder());
  if (!canUseBuilder()) closeBuilderSidebar();
  renderBuilder();
};
window.builderHooks.syncSettings = (settings) => {
  builderSettings = { ...defaultSiteSettings, ...(settings || {}) };
  builderSettings.heroCards = (builderSettings.heroCards || defaultSiteSettings.heroCards).map(normalizeHeroCard);
  window.syncSiteSettings(builderSettings);
};
window.builderHooks.syncAccess = (nextAccess) => {
  window.syncAccessState(nextAccess || window.accessState);
};
window.builderHooks.persistAll = guardarBuilderSupabase;
window.builderHooks.openPageSettings = openPageSettingsMode;
window.builderHooks.openHeroEditor = openHeroEditor;
window.builderHooks.openSliderEditor = openSliderEditor;

document.addEventListener("DOMContentLoaded", async () => {
  initBuilderControls();
  await cargarBuilderSupabase();
  try {
    supabaseClient.channel("builder_changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "builder_content"
    }, async () => {
      await cargarBuilderSupabase();
    }).subscribe();
  } catch (error) {
    console.error("Realtime builder error:", error);
  }
  document.getElementById("builderPanel").style.display = canUseBuilder() ? "block" : "none";
  window.addEventListener("resize", renderBuilder);
});
