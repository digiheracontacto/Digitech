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
  afterSlider: "Debajo del slider",
  middle: "Mitad de pagina",
  bottom: "Final de pagina"
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
  ubicacion: "Ubicacion"
};

function uid() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBuilderPayload(payload) {
  if (Array.isArray(payload)) {
    return { blocks: payload, settings: { ...defaultSiteSettings } };
  }
  return {
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
    settings: { ...defaultSiteSettings, ...(payload?.settings || {}) }
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
    position: "afterSlider",
    sortOrder: builderData.length,
    hidden: false,
    layout: { width: "full" },
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
      sectionTitle: "Productos destacados",
      accentBackground: "rgba(255,255,255,.12)",
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
      content: { src: "", alt: "imagen", link: "" }
    },
    slider: {
      ...base,
      content: { images: [], autoplay: true, seconds: 4, currentIndex: 0 }
    },
    video: {
      ...base,
      content: { src: "", autoplay: false, muted: false, loop: false, controls: true }
    },
    embed: {
      ...base,
      content: { url: "" }
    },
    youtube: {
      ...base,
      content: { url: "", startMode: "click", muted: false, loop: false }
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
      content: { title: "Nuestra ubicacion", note: "", mapUrl: "" },
      design: { ...base.design, height: 360 }
    }
  };

  return byType[type];
}

function normalizeBlock(rawBlock) {
  const block = clone(rawBlock || {});
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
  builderData.forEach((item, index) => {
    item.sortOrder = index;
  });
}

async function cargarBuilderSupabase() {
  const { data } = await supabaseClient.from("builder_content").select("*").limit(1);
  if (data?.length) {
    const normalized = normalizeBuilderPayload(data[0].data);
    builderData = normalized.blocks.map(normalizeBlock);
    builderSettings = { ...defaultSiteSettings, ...(normalized.settings || {}) };
    builderRowId = data[0].id;
  } else {
    builderData = [];
    builderSettings = { ...defaultSiteSettings };
  }
  builderSettings.heroCards = (builderSettings.heroCards || defaultSiteSettings.heroCards).map(normalizeHeroCard);
  sortBlocks();
  syncSiteSettings(builderSettings);
  renderBuilder();
}

function getBuilderPayload() {
  return {
    blocks: builderData,
    settings: builderSettings
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

function buildGradientValue(gradient) {
  const colors = [gradient.color1, gradient.color2, gradient.color3].filter(Boolean);
  if (!colors.length) return "#0f1c33";
  if (!gradient.enabled) return gradient.color1 || "#0f1c33";
  if (gradient.type === "radial") {
    return `radial-gradient(circle at ${(window.resolveGradientPosition ? window.resolveGradientPosition("radial", gradient.position) : (gradient.position || "center"))}, ${colors.join(", ")})`;
  }
  return `linear-gradient(${(window.resolveGradientPosition ? window.resolveGradientPosition("linear", gradient.position) : (gradient.position || "135deg"))}, ${colors.join(", ")})`;
}

function getSurfaceStyle(block) {
  return [
    `background:${buildGradientValue(block.design.gradient)}`,
    `color:${block.design.textColor}`,
    `border-radius:${block.design.borderRadius}px`,
    `padding:${block.design.padding}px`,
    `width:min(100%, ${block.design.width || "100%"})`,
    `margin-inline:auto`,
    `box-shadow:${block.design.shadow ? `0 18px 45px ${block.design.shadowColor || "rgba(2,8,23,.22)"}` : "none"}`
  ].join(";");
}

function getVisibleFeaturedCount() {
  if (window.innerWidth < 760) return 1;
  if (window.innerWidth < 1120) return 2;
  return 4;
}

function renderBuilder() {
  const zones = {
    top: document.getElementById("builderTop"),
    afterSlider: document.getElementById("builderAfterSlider"),
    middle: document.getElementById("builderMiddle"),
    bottom: document.getElementById("builderBottom")
  };

  Object.values(zones).forEach((zone) => {
    if (zone) zone.innerHTML = "";
  });

  sortBlocks();
  builderData.filter((block) => !block.hidden).forEach((block) => {
    const zone = zones[block.position] || zones.afterSlider;
    const element = createBlockElement(block);
    if (zone && element) zone.appendChild(element);
  });

  renderBlocksList();
  renderInspector();
}

function createBlockElement(block) {
  const wrapper = document.createElement("section");
  wrapper.className = `builder-block builder-width-${block.layout?.width || "full"} animation-${block.animation || "none"}`;
  wrapper.dataset.blockId = block.id;
  wrapper.draggable = isAdmin;
  wrapper.addEventListener("dragstart", () => wrapper.classList.add("dragging"));
  wrapper.addEventListener("dragend", updateOrderFromDom);
  wrapper.addEventListener("click", () => {
    if (!isAdmin) return;
    seleccionarBloque(block.id);
  });

  if (isAdmin) {
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
    const box = document.createElement("div");
    box.className = "builder-media-card";
    box.style.cssText = `width:min(100%, ${block.design.width || "100%"});margin-inline:auto;`;
    const image = `<img src="${block.content.src || "https://placehold.co/1400x700/0f172a/e2e8f0?text=Imagen"}" alt="${block.content.alt || ""}" style="height:${block.design.height}px;object-fit:${block.design.objectFit};opacity:${block.design.opacity};border-radius:${block.design.borderRadius}px;">`;
    box.innerHTML = block.content.link ? `<a href="${block.content.link}" target="_blank" rel="noreferrer">${image}</a>` : image;
    return box;
  }

  if (block.type === "slider") {
    const box = document.createElement("div");
    const images = block.content.images?.length ? block.content.images : ["https://placehold.co/1400x700/0f172a/e2e8f0?text=Slider"];
    block.content.currentIndex = block.content.currentIndex || 0;
    box.className = "builder-media-card builder-slider-card";
    box.style.cssText = `width:min(100%, ${block.design.width || "100%"});margin-inline:auto;`;
    box.innerHTML = `
      <img src="${images[block.content.currentIndex]}" alt="slider" style="height:${block.design.height}px;object-fit:cover;border-radius:${block.design.borderRadius}px;">
      <button type="button" class="builder-arrow left" onclick="builderPrev('${block.id}')">❮</button>
      <button type="button" class="builder-arrow right" onclick="builderNext('${block.id}')">❯</button>
    `;
    if (block.content.autoplay && images.length > 1) {
      clearTimeout(block.timer);
      block.timer = setTimeout(() => builderNext(block.id), (block.content.seconds || 4) * 1000);
    }
    return box;
  }

  if (block.type === "video") {
    const box = document.createElement("div");
    box.className = "builder-media-card";
    box.style.cssText = `width:min(100%, ${block.design.width || "100%"});margin-inline:auto;`;
    box.innerHTML = `
      <video src="${block.content.src || ""}" style="height:${block.design.height}px;border-radius:${block.design.borderRadius}px;" ${block.content.controls ? "controls" : ""} ${block.content.autoplay ? "autoplay" : ""} ${block.content.muted ? "muted" : ""} ${block.content.loop ? "loop" : ""} playsinline></video>
    `;
    return box;
  }

  if (block.type === "youtube") {
    const box = document.createElement("div");
    box.className = "builder-media-card";
    box.style.cssText = `width:min(100%, ${block.design.width || "100%"});margin-inline:auto;`;
    const id = extractYoutubeId(block.content.url);
    const iframeSrc = buildYoutubeEmbed(block.content.url, { ...block.content, id: block.id });
    if (!id) {
      box.innerHTML = `<div class="builder-placeholder" style="${getSurfaceStyle(block)}">Pega un enlace valido de YouTube.</div>`;
      return box;
    }
    const shouldAutoplay = block.content.startMode === "auto";
    const isPlaying = shouldAutoplay || builderRuntime.youtubePlaying[block.id];
    if (!isPlaying) {
      box.innerHTML = `
        <button type="button" class="builder-youtube-preview" onclick="playYoutubeInline('${block.id}')">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="YouTube preview" style="height:${block.design.height}px;border-radius:${block.design.borderRadius}px;">
          <span class="play-pill">▶</span>
        </button>
      `;
      return box;
    }
    box.innerHTML = `<iframe src="${iframeSrc}" style="height:${block.design.height}px;border-radius:${block.design.borderRadius}px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return box;
  }

  if (block.type === "embed") {
    const embed = buildSocialEmbed(block.content.url);
    const box = document.createElement("div");
    box.className = "builder-media-card";
    box.style.cssText = `width:min(100%, ${block.design.width || "100%"});margin-inline:auto;`;
    if (!embed.src) {
      box.innerHTML = `<div class="builder-placeholder" style="${getSurfaceStyle(block)}">Pega un enlace valido de TikTok, Instagram o Facebook.</div>`;
      return box;
    }
    box.innerHTML = `<div class="builder-social-wrap ${embed.kind}" style="height:${block.design.height}px;"><iframe src="${embed.src}" loading="lazy" allowfullscreen scrolling="no" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    return box;
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
        <h2>${block.content.title || ""}</h2>
        <p>${block.content.description || ""}</p>
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
        <h2>${block.design.sectionTitle || "Productos destacados"}</h2>
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
    const box = document.createElement("div");
    box.className = "builder-location-card";
    box.style.cssText = getSurfaceStyle(block);
    box.innerHTML = `
      <div class="builder-location-copy">
        <h2>${block.content.title || ""}</h2>
        <p>${block.content.note || ""}</p>
      </div>
      ${src ? `<iframe src="${src}" style="height:${block.design.height}px;border-radius:${block.design.borderRadius}px;" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<div class="builder-placeholder">Pega un enlace de Google Maps valido.</div>`}
    `;
    return box;
  }

  return null;
}

function renderBlocksList() {
  const list = document.getElementById("builderBlocksList");
  if (!list) return;
  list.innerHTML = "";

  if (builderEditorMode === "hero") {
    (builderSettings.heroCards || []).forEach((card, index) => {
      const item = document.createElement("div");
      item.className = `builder-block-item ${heroSelectedIndex === index ? "active" : ""}`;
      item.innerHTML = `
        <div class="builder-block-item-head">
          <strong>Portada ${index + 1}</strong>
          <button type="button" onclick="openHeroEditor(${index})">Editar</button>
        </div>
        <small>${card.title || "Sin titulo"}</small>
      `;
      list.appendChild(item);
    });
    return;
  }

  sortBlocks();
  builderData.forEach((block) => {
    const item = document.createElement("div");
    item.className = `builder-block-item ${selectedBlockId === block.id && builderEditorMode === "blocks" ? "active" : ""}`;
    item.innerHTML = `
      <div class="builder-block-item-head">
        <strong>${BLOCK_TYPES[block.type]}</strong>
        <button type="button" onclick="seleccionarBloque('${block.id}')">Editar</button>
      </div>
      <small>${POSITION_LABELS[block.position]} · ${block.layout?.width === "half" ? "Medio ancho" : "Ancho completo"}${block.hidden ? " · Oculto" : ""}</small>
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
      <label>URL video<input data-path="content.src"></label>
      <label><input type="checkbox" data-path="content.autoplay"> Autoplay</label>
      <label><input type="checkbox" data-path="content.muted"> Muted</label>
      <label><input type="checkbox" data-path="content.loop"> Loop</label>
      <label><input type="checkbox" data-path="content.controls"> Controles</label>
      <button type="button" onclick="subirArchivoInspector('video')">Subir video</button>
    `;
  }

  if (block.type === "embed") {
    return `<label>Enlace de TikTok, Instagram o Facebook<input data-path="content.url"></label>`;
  }

  if (block.type === "youtube") {
    return `
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
      <label>Titulo<input data-path="content.title"></label>
      <label>Nota<textarea data-path="content.note"></textarea></label>
      <label>Enlace Google Maps<input data-path="content.mapUrl"></label>
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

  if (["imagen", "slider", "video", "embed", "youtube", "ubicacion"].includes(block.type)) {
    return `${common}<label>Altura<input type="number" data-path="design.height"></label>${block.type === "imagen" ? `<label>Object fit<select data-path="design.objectFit"><option value="cover">Cover</option><option value="contain">Contain</option></select></label><label>Opacidad<input type="number" min="0" max="1" step="0.1" data-path="design.opacity"></label>` : ""}`;
  }

  if (block.type === "banner") {
    return `${common}<label>Fondo caja interna<input data-path="design.accentBackground"></label><label>Alineacion<select data-path="design.align"><option value="left">Izquierda</option><option value="center">Centro</option></select></label>`;
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
      <option value="afterSlider">Debajo del slider</option>
      <option value="middle">Mitad de pagina</option>
      <option value="bottom">Final de pagina</option>
    </select></label>
    <label>Ancho en maquetacion<select data-path="layout.width"><option value="full">Ancho completo</option><option value="half">Mitad / al lado de otra</option></select></label>
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
      <label>Color sombra productos<input data-site-path="productShadowColor" placeholder="rgba(2,8,23,.42) o #000000"></label>
      <label>Color sombra hover<input data-site-path="productHoverShadowColor" placeholder="rgba(56,189,248,.25) o #38bdf8"></label>
      <label>Suavidad hover<input type="number" step="0.01" data-site-path="productHoverDuration"></label>
      <label>Elevacion hover<input type="number" step="1" data-site-path="productHoverLift"></label>
      <label>Escala hover<input type="number" step="0.01" data-site-path="productHoverScale"></label>
      <div class="builder-action-row">
        <button type="button" onclick="subirLogoDesdeAjustesPagina()">Subir imagen logo</button>
      </div>
      <div class="builder-apply-bar">
        <button type="button" class="primary-btn" onclick="aplicarAjustesPagina()">Aplicar cambios</button>
      </div>
    </div>
  `;
}

function buildHeroInspector() {
  if (!heroDraft) return `<div class="builder-form"><p>No hay portada seleccionada.</p></div>`;
  return `
    <div class="builder-form">
      <label>Etiqueta superior<input data-hero-path="eyebrow"></label>
      <label>Titulo<textarea data-hero-path="title"></textarea></label>
      <label>Descripcion<textarea data-hero-path="description"></textarea></label>
      <label>Tamano titulo<input type="number" data-hero-path="design.titleSize"></label>
      <label>Tamano descripcion<input type="number" data-hero-path="design.descriptionSize"></label>
      <label>Fuente titulo${fontSelectMarkup("hero.design.titleFont", heroDraft.design.titleFont)}</label>
      <label>Fuente titulo personalizada<input data-hero-path="design.titleFontCustom"></label>
      <label>Fuente descripcion${fontSelectMarkup("hero.design.descriptionFont", heroDraft.design.descriptionFont)}</label>
      <label>Fuente descripcion personalizada<input data-hero-path="design.descriptionFontCustom"></label>
      <label>Alineacion<select data-hero-path="design.align"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
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
        <button type="button" onclick="addHeroCard()">Crear portada</button>
        <button type="button" onclick="duplicateHeroCard()">Duplicar portada</button>
        <button type="button" onclick="removeHeroCard()">Eliminar portada</button>
      </div>
      <div class="builder-apply-bar">
        <button type="button" class="primary-btn" onclick="applyHeroCardChanges()">Aplicar cambios</button>
      </div>
    </div>
  `;
}

function hydrateInspectorValues() {
  if (!draftBlock) return;
  document.querySelectorAll("#builderInspector [data-path]").forEach((field) => {
    const path = field.dataset.path === "content.imagesText" ? "content.images" : field.dataset.path;
    const value = getNestedValue(draftBlock, path);
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else if (field.dataset.path === "content.imagesText") {
      field.value = Array.isArray(draftBlock.content.images) ? draftBlock.content.images.join("\n") : "";
    } else {
      field.value = value ?? "";
    }
  });
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
  if (field.type === "number") return Number(field.value);
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
    setNestedValue(draftBlock, field.dataset.path, parseFieldValue(field));
  });
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
  syncSiteSettings(builderSettings);
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

  builderSettings.heroCards = builderSettings.heroCards || [];
  builderSettings.heroCards[heroSelectedIndex] = normalizeHeroCard(heroDraft);
  syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
}

function addHeroCard() {
  builderSettings.heroCards = builderSettings.heroCards || [];
  builderSettings.heroCards.push(normalizeHeroCard(createDefaultHeroCard()));
  heroSelectedIndex = builderSettings.heroCards.length - 1;
  heroDraft = clone(builderSettings.heroCards[heroSelectedIndex]);
  builderEditorMode = "hero";
  syncSiteSettings(builderSettings);
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
  syncSiteSettings(builderSettings);
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
  syncSiteSettings(builderSettings);
  guardarBuilderSupabase();
}

async function subirArchivoInspector(type) {
  if (!draftBlock) return;
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = type === "slider";
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
      draftBlock.content.src = await subirArchivoABucket("slides", "builder_video", files[0]);
      const field = document.querySelector('[data-path="content.src"]');
      if (field) field.value = draftBlock.content.src;
      return;
    }
    draftBlock.content.src = await subirArchivoABucket("productos", "builder_img", files[0]);
    const field = document.querySelector('[data-path="content.src"]');
    if (field) field.value = draftBlock.content.src;
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
  };
  input.click();
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
    playsinline: "1"
  });
  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", id);
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
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

function moverBloque(id, step) {
  const index = builderData.findIndex((item) => item.id === id);
  const target = index + step;
  if (index < 0 || target < 0 || target >= builderData.length) return;
  [builderData[index], builderData[target]] = [builderData[target], builderData[index]];
  guardarBuilderSupabase();
}

function moverBloqueHorizontal(id, step) {
  const block = getBlock(id);
  if (!block) return;
  sortBlocks();
  const siblings = builderData.filter((item) => item.position === block.position);
  const index = siblings.findIndex((item) => item.id === id);
  const target = index + step;
  if (target < 0 || target >= siblings.length) return;
  moverBloque(id, builderData.findIndex((item) => item.id === siblings[target].id) - builderData.findIndex((item) => item.id === id));
}

function duplicarBloque(id) {
  const block = getBlock(id);
  if (!block) return;
  const copy = normalizeBlock(clone(block));
  copy.id = uid();
  copy.title = `${copy.title} copia`;
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

function openBuilderSidebar() {
  if (!isAdmin) return;
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
  builderData.push(block);
  selectedBlockId = block.id;
  draftBlock = clone(block);
  builderEditorMode = "blocks";
  guardarBuilderSupabase();
}

function updateOrderFromDom() {
  document.querySelectorAll(".builder-block").forEach((node, index) => {
    const block = getBlock(node.dataset.blockId);
    if (block) block.sortOrder = index;
  });
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

window.builderHooks.render = renderBuilder;
window.builderHooks.refreshFeatured = renderBuilder;
window.builderHooks.setAdmin = (adminState) => {
  document.getElementById("builderPanel").style.display = adminState ? "block" : "none";
  document.getElementById("heroAdminTools").classList.toggle("hidden", !adminState);
  if (!adminState) closeBuilderSidebar();
  renderBuilder();
};
window.builderHooks.syncSettings = (settings) => {
  builderSettings = { ...defaultSiteSettings, ...(settings || {}) };
  builderSettings.heroCards = (builderSettings.heroCards || defaultSiteSettings.heroCards).map(normalizeHeroCard);
  syncSiteSettings(builderSettings);
};
window.builderHooks.persistAll = guardarBuilderSupabase;
window.builderHooks.openPageSettings = openPageSettingsMode;
window.builderHooks.openHeroEditor = openHeroEditor;

document.addEventListener("DOMContentLoaded", async () => {
  initBuilderControls();
  await cargarBuilderSupabase();
  supabaseClient.channel("builder_changes").on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "builder_content"
  }, async () => {
    await cargarBuilderSupabase();
  }).subscribe();
  document.getElementById("builderPanel").style.display = isAdmin ? "block" : "none";
  window.addEventListener("resize", renderBuilder);
});
