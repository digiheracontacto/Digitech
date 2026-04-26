const adminUser = "admin";
const adminPassValue = "1234";

const defaultData = [
  {
    nombre: "Celulares",
    productos: [
      {
        nombre: "Samsung A15",
        precio: 180,
        precioMayorista: 165,
        descripcion: "128GB 4GB RAM",
        imagen: null,
        imagenes: [],
        oferta: null,
        activo: true
      },
      {
        nombre: "Redmi 13C",
        precio: 150,
        precioMayorista: 138,
        descripcion: "128GB 6GB RAM",
        imagen: null,
        imagenes: [],
        oferta: null,
        activo: true
      }
    ]
  }
];

const defaultRoleDisplay = {
  boss: {
    emoji: "\u265B",
    background: "linear-gradient(135deg,#f59e0b,#b45309)",
    color: "#ffffff"
  },
  administrador: {
    emoji: "\u{1F451}",
    background: "linear-gradient(135deg,#f97316,#ea580c)",
    color: "#ffffff"
  },
  vendedor: {
    emoji: "\u{1F3F7}",
    background: "linear-gradient(135deg,#0ea5e9,#0369a1)",
    color: "#ffffff"
  },
  mayorista: {
    emoji: "\u{1F4E6}",
    background: "linear-gradient(135deg,#22c55e,#15803d)",
    color: "#ffffff"
  },
  cliente: {
    emoji: "",
    background: "#e2e8f0",
    color: "#0f172a"
  }
};

const defaultSiteSettings = {
  logoText: "DIGIHERA TECH",
  logoSubtext: "Tecnologia, ofertas y contenido visual",
  logoImage: "",
  logoTextColor: "#edf5ff",
  logoSubtextColor: "#a6b7ca",
  logoFontFamily: "Space Grotesk",
  pageHeadingFontFamily: "Space Grotesk",
  bodyFontFamily: "Manrope",
  pageTextColor: "#edf5ff",
  pageMutedTextColor: "#a6b7ca",
  customFontName: "",
  customFontUrl: "",
  pageBackgroundEnabled: true,
  pageBackgroundType: "linear",
  pageBackgroundPosition: "180deg",
  pageBackgroundColor1: "#030815",
  pageBackgroundColor2: "#07111f",
  pageBackgroundColor3: "#081425",
  pageBackgroundImage: "",
  pageBackgroundImageFit: "cover",
  pageBackgroundImageRepeat: "no-repeat",
  pageBackgroundImageAttachment: "scroll",
  pageBackgroundImagePosition: "center center",
  pageBackgroundImageOpacity: 1,
  pageBackgroundImageBrightness: 1,
  pageBackgroundOverlayOpacity: 0.32,
  headerBackgroundEnabled: true,
  headerBackgroundType: "linear",
  headerBackgroundPosition: "135deg",
  headerBackgroundColor1: "rgba(4,9,21,.94)",
  headerBackgroundColor2: "rgba(8,17,33,.92)",
  headerBackgroundColor3: "rgba(12,24,48,.86)",
  headerBorderColor: "rgba(191,219,254,.24)",
  headerBackdropBlur: 18,
  headerButtonBackground: "rgba(15,23,42,.88)",
  headerButtonTextColor: "#f8fbff",
  headerButtonBorderColor: "rgba(191,219,254,.24)",
  headerButtonFontFamily: "Manrope",
  headerButtonFontCustom: "",
  headerButtonSize: 14,
  headerButtonRadius: 14,
  headerButtonPaddingY: 10,
  headerButtonPaddingX: 14,
  headerButtonShadowEnabled: false,
  headerButtonShadowColor: "rgba(2,8,23,.18)",
  headerButtonHoverBackground: "rgba(37,99,235,.34)",
  headerButtonHoverTextColor: "#f8fbff",
  headerButtonHoverBorderColor: "rgba(125,211,252,.42)",
  headerButtonHoverLift: 1,
  headerButtonHoverDuration: 0.2,
  headerButtonHoverShadowColor: "rgba(56,189,248,.18)",
  productCardBackgroundType: "linear",
  productCardBackgroundPosition: "180deg",
  productCardBackgroundColor1: "rgba(255,255,255,.09)",
  productCardBackgroundColor2: "rgba(255,255,255,.04)",
  productCardBackgroundColor3: "",
  productCardBackgroundOpacity: 1,
  productBorderColor: "rgba(191,219,254,.24)",
  productTitleColor: "#f8fbff",
  productDescriptionColor: "#d5e2ef",
  productTitleFontFamily: "Manrope",
  productTitleFontCustom: "",
  productTitleSize: 18,
  productDescriptionFontFamily: "Manrope",
  productDescriptionFontCustom: "",
  productDescriptionSize: 14,
  productShadowColor: "rgba(2,8,23,.42)",
  productHoverShadowColor: "rgba(56,189,248,.25)",
  productHoverLift: 6,
  productHoverScale: 1.01,
  productHoverDuration: 0.28,
  productButtonBackground: "rgba(37,99,235,.28)",
  productButtonTextColor: "#f8fbff",
  productButtonBorderColor: "rgba(191,219,254,.18)",
  productButtonRadius: 14,
  productButtonFontFamily: "Manrope",
  productButtonFontCustom: "",
  productButtonSize: 14,
  productButtonShadowEnabled: false,
  productButtonShadowColor: "rgba(2,8,23,.18)",
  productButtonHoverBackground: "rgba(34,211,238,.22)",
  productButtonHoverTextColor: "#f8fbff",
  productButtonHoverBorderColor: "rgba(125,211,252,.42)",
  productPriceColor: "#7dd3fc",
  productPriceFontFamily: "Manrope",
  productPriceFontCustom: "",
  productPriceSize: 22,
  productOldPriceColor: "#94a3b8",
  productOfferColor: "#fdba74",
  productOfferFontFamily: "Manrope",
  productOfferFontCustom: "",
  productOfferSize: 14,
  heroCards: [
    {
      eyebrow: "Tienda y constructor visual",
      title: "Una pagina mas limpia, rapida y preparada para vender mejor.",
      description: "Catalogos, slides, carrito, favoritos, perfil, historial y un builder visual conectado a tu Supabase.",
      design: {
        width: "100%",
        align: "left",
        boxAlign: "center",
        layoutWidth: "full",
        padding: 42,
        borderRadius: 34,
        eyebrowColor: "#c8f4ff",
        titleColor: "#edf5ff",
        descriptionColor: "#bed0e4",
        titleFont: "Space Grotesk",
        titleFontCustom: "",
        descriptionFont: "Manrope",
        descriptionFontCustom: "",
        titleSize: 74,
        descriptionSize: 18,
        gradient: {
          enabled: true,
          type: "linear",
          position: "135deg",
          color1: "rgba(56,189,248,.12)",
          color2: "rgba(249,115,22,.08)",
          color3: "rgba(255,255,255,.035)"
        }
      }
    }
  ]
};

const defaultAccessState = {
  adminCredentials: {
    username: adminUser,
    password: adminPassValue
  },
  wholesaleCredentials: {
    password: "mayoreo123"
  },
  bossCredentials: {
    username: "boss@2000",
    password: "#Zhzgk8uguyqpf",
    gmail: "",
    photo: "",
    verifiedEmail: "",
    verifiedAt: ""
  },
  roleAssignments: [],
  roleDisplay: clone(defaultRoleDisplay),
  specialSections: {
    hero: { position: "top", sortOrder: 10 },
    slider: { position: "afterSlider", sortOrder: 10 }
  }
};

let catalogos = JSON.parse(localStorage.getItem("catalogos")) || defaultData;
let catalogosRowId = null;
let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];
let slidesRowId = null;
let slideIndex = 0;
let sliderInterval = null;
let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;
let carrito = JSON.parse(localStorage.getItem("guestCarrito")) || [];
let favoritos = [];
let imagenesProducto = [];
let indiceImagenActual = 0;
let siteSettings = { ...defaultSiteSettings };
let accessState = clone(defaultAccessState);
let adminSession = {
  active: false,
  role: null,
  username: "",
  userId: null,
  source: "",
  wholesaleMode: false
};

const builderHooks = {
  render: () => {},
  refreshFeatured: () => {},
  setAdmin: () => {},
  syncSettings: () => {},
  syncAccess: () => {},
  persistAll: () => {},
  openPageSettings: () => {},
  openHeroEditor: () => {},
  openSliderEditor: () => {}
};

const appearanceColorCanvas = document.createElement("canvas");
const appearanceColorContext = appearanceColorCanvas.getContext("2d");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizarProducto(prod = {}) {
  return {
    nombre: prod.nombre || "Producto",
    precio: Number(prod.precio || 0),
    precioMayorista: Number(prod.precioMayorista ?? prod.precio ?? 0),
    descripcion: prod.descripcion || "",
    imagen: prod.imagen || null,
    imagenes: Array.isArray(prod.imagenes) ? prod.imagenes.filter(Boolean) : [],
    oferta: prod.oferta && prod.oferta.antes && prod.oferta.ahora ? prod.oferta : null,
    activo: prod.activo !== false
  };
}

function normalizarCatalogos(data) {
  if (!Array.isArray(data) || !data.length) return clone(defaultData);
  return data.map((cat) => ({
    nombre: cat?.nombre || "Catalogo",
    productos: Array.isArray(cat?.productos) ? cat.productos.map(normalizarProducto) : []
  }));
}

function mergeRoleDisplayConfig(config = {}) {
  const merged = {};
  Object.keys(defaultRoleDisplay).forEach((role) => {
    merged[role] = {
      ...defaultRoleDisplay[role],
      ...(config?.[role] || {})
    };
  });
  return merged;
}

function normalizeAccessState(nextState = {}) {
  const assignments = Array.isArray(nextState.roleAssignments)
    ? nextState.roleAssignments
        .filter((item) => (item?.userId || item?.username) && item?.role)
        .map((item) => ({
          userId: item.userId ?? null,
          username: item.username.trim(),
          role: item.role
        }))
    : [];

  return {
    ...clone(defaultAccessState),
    ...clone(nextState),
    adminCredentials: {
      ...defaultAccessState.adminCredentials,
      ...(nextState.adminCredentials || {})
    },
    wholesaleCredentials: {
      ...defaultAccessState.wholesaleCredentials,
      ...(nextState.wholesaleCredentials || {})
    },
    bossCredentials: {
      ...defaultAccessState.bossCredentials,
      ...(nextState.bossCredentials || {})
    },
    roleAssignments: assignments,
    roleDisplay: mergeRoleDisplayConfig(nextState.roleDisplay || {}),
    specialSections: {
      hero: {
        ...defaultAccessState.specialSections.hero,
        ...(nextState.specialSections?.hero || {})
      },
      slider: {
        ...defaultAccessState.specialSections.slider,
        ...(nextState.specialSections?.slider || {})
      }
    }
  };
}

function syncAccessState(nextState = {}) {
  accessState = normalizeAccessState(nextState);
  window.accessState = accessState;
  applyRoleToCurrentUser();
  if (adminSession.active && adminSession.source === "user") {
    adminSession.role = getAssignedRole(adminSession.userId, adminSession.username || "");
    if (!canEnterAdminMode(adminSession.role)) {
      logoutAdminMode();
      return;
    }
    if (getEffectiveRole(adminSession.role) !== "mayorista" && adminSession.wholesaleMode && !canToggleWholesale(adminSession.role)) {
      adminSession.wholesaleMode = false;
    }
  }
  actualizarUsuarioUI();
  actualizarAdminPanel();
  builderHooks.setAdmin(adminSession.active);
  render();
}

window.syncAccessState = syncAccessState;

function getAssignedRole(userOrName = "", maybeUsername = "") {
  const userId = typeof userOrName === "object" ? userOrName?.id : userOrName;
  const username = typeof userOrName === "object" ? userOrName?.username : maybeUsername;
  const normalized = (username || "").trim().toLowerCase();
  if (normalized && normalized === accessState.bossCredentials.username.trim().toLowerCase()) return "boss";
  if (userId !== undefined && userId !== null && userId !== "") {
    const byId = accessState.roleAssignments.find((item) => String(item.userId ?? "") === String(userId));
    if (byId) return byId.role || "cliente";
  }
  if (!normalized) return "cliente";
  return accessState.roleAssignments.find((item) => item.username.trim().toLowerCase() === normalized)?.role || "cliente";
}

function getEffectiveRole(role = "") {
  return role || "cliente";
}

function getCurrentUserRole() {
  if (!usuarioActual) return "cliente";
  if (usuarioActual.syntheticBoss) return "boss";
  return getAssignedRole(usuarioActual);
}

function canEnterAdminMode(role = adminSession.role) {
  const effective = getEffectiveRole(role);
  return ["boss", "administrador", "vendedor", "mayorista"].includes(effective);
}

function canUseBuilder(role = adminSession.role) {
  const effective = getEffectiveRole(role);
  return adminSession.active && ["boss", "administrador"].includes(effective);
}

function canEditRetail(role = adminSession.role) {
  const effective = getEffectiveRole(role);
  return adminSession.active && ["boss", "administrador", "vendedor"].includes(effective) && !adminSession.wholesaleMode;
}

function canEditWholesale(role = adminSession.role) {
  const effective = getEffectiveRole(role);
  return adminSession.active && ["boss", "administrador", "mayorista"].includes(effective) && adminSession.wholesaleMode;
}

function canToggleWholesale(role = adminSession.role) {
  const effective = getEffectiveRole(role);
  return adminSession.active && ["boss", "administrador", "mayorista"].includes(effective);
}

function canUseWholesaleCart(role = adminSession.role) {
  return adminSession.active && ["boss", "administrador", "mayorista"].includes(getEffectiveRole(role)) && adminSession.wholesaleMode;
}

function canManageTeam() {
  return getCurrentUserRole() === "boss";
}

function canManageInternalCredentials() {
  return getCurrentUserRole() === "boss";
}

function roleLabel(role = "cliente") {
  const map = {
    boss: "Boss",
    administrador: "Administrador",
    vendedor: "Vendedor",
    mayorista: "Mayorista",
    cliente: "Cliente"
  };
  return map[getEffectiveRole(role)] || "Cliente";
}

function roleChipClass(role = "cliente") {
  return `role-chip-${getEffectiveRole(role)}`;
}

function getRoleDisplay(role = "cliente") {
  return accessState.roleDisplay?.[getEffectiveRole(role)] || defaultRoleDisplay[getEffectiveRole(role)] || defaultRoleDisplay.cliente;
}

function applyRoleDisplayToElement(element, role = "cliente") {
  if (!element) return;
  const visual = getRoleDisplay(role);
  element.style.background = visual.background || defaultRoleDisplay.cliente.background;
  element.style.color = visual.color || defaultRoleDisplay.cliente.color;
}

function roleBadgeIcon(role = "cliente") {
  return getRoleDisplay(role).emoji || "";
}

function normalizarTexto(texto = "") {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (id === "loginModal") updateAdminModeHint();
  modal.style.display = "flex";
  requestAnimationFrame(() => modal.classList.add("is-open"));
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-open");
  setTimeout(() => {
    if (!modal.classList.contains("is-open")) modal.style.display = "none";
  }, 180);
}

function mostrarMensaje(texto) {
  alert(texto);
}

function limpiarInputArchivo(id) {
  const input = document.getElementById(id);
  if (input) input.value = "";
}

function bindCustomFileInput(inputId, labelId, captionId, emptyText = "Sin archivo") {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  const caption = document.getElementById(captionId);
  if (!input || input.dataset.bound === "true") return;
  input.dataset.bound = "true";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (label) label.textContent = file ? "Cambiar foto" : "Foto perfil";
    if (caption) caption.textContent = file ? file.name.slice(0, 28) : emptyText;
  });
}

function getStoredGuestCart() {
  return JSON.parse(localStorage.getItem("guestCarrito")) || [];
}

function persistGuestCart() {
  localStorage.setItem("guestCarrito", JSON.stringify(carrito));
}

function getUserCartPricingStorageKey(userId = usuarioActual?.id) {
  return userId ? `userCartPricing_${userId}` : "";
}

function getStoredUserCartPricing(userId = usuarioActual?.id) {
  const key = getUserCartPricingStorageKey(userId);
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function persistCurrentCartPricing(userId = usuarioActual?.id) {
  const key = getUserCartPricingStorageKey(userId);
  if (!key) return;
  const pricing = {};
  carrito.forEach((item) => {
    if (!item?.nombre) return;
    pricing[item.nombre] = {
      unitPrice: Number(obtenerPrecioUnitarioCarrito(item)),
      pricingMode: item.pricingMode === "wholesale" ? "wholesale" : "retail"
    };
  });
  localStorage.setItem(key, JSON.stringify(pricing));
}

function mergeStoredCartPricingEntries(items = [], userId = usuarioActual?.id) {
  const key = getUserCartPricingStorageKey(userId);
  if (!key) return;
  const pricing = getStoredUserCartPricing(userId);
  items.forEach((item) => {
    if (!item?.nombre) return;
    pricing[item.nombre] = {
      unitPrice: Number(typeof item.unitPrice === "number" ? item.unitPrice : item.precio || 0),
      pricingMode: item.pricingMode === "wholesale" ? "wholesale" : "retail"
    };
  });
  localStorage.setItem(key, JSON.stringify(pricing));
}

function clearStoredUserCartPricing(userId = usuarioActual?.id) {
  const key = getUserCartPricingStorageKey(userId);
  if (!key) return;
  localStorage.removeItem(key);
}

function setUsuarioActualData(data) {
  if (!data) return;
  usuarioActual = data;
  localStorage.setItem("usuarioActual", JSON.stringify(data));
}

function clearUsuarioActualData() {
  usuarioActual = null;
  localStorage.removeItem("usuarioActual");
}

function applyRoleToCurrentUser() {
  if (!usuarioActual) return;
  if (usuarioActual.syntheticBoss) {
    usuarioActual.role = "boss";
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
    return;
  }
  usuarioActual.role = getAssignedRole(usuarioActual);
  localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
}

async function obtenerUsuarioPorUsername(username) {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .order("id", { ascending: false })
    .limit(1);
  return {
    data: Array.isArray(data) ? data[0] || null : null,
    error
  };
}

async function obtenerUsuarioPorCredenciales(username, password) {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .order("id", { ascending: false })
    .limit(1);
  return {
    data: Array.isArray(data) ? data[0] || null : null,
    error
  };
}

async function guardarUsuarioRegistro(payload) {
  const attempts = [
    () => supabaseClient.from("usuarios").upsert([payload], { onConflict: "username" }),
    () => supabaseClient.from("usuarios").insert([payload])
  ];

  let lastError = null;
  for (const attempt of attempts) {
    const { error } = await attempt();
    if (!error) return { ok: true };
    lastError = error;
  }
  return { ok: false, error: lastError };
}

function getResolvedFontFamily(fontName = "") {
  const trimmed = fontName?.trim();
  if (!trimmed) return '"Manrope", sans-serif';
  if (trimmed.includes(",")) return trimmed;
  return `"${trimmed}", sans-serif`;
}

function ensureCustomFontLoaded() {
  const url = siteSettings.customFontUrl?.trim();
  if (!url) return;
  let link = document.getElementById("customSiteFontLink");
  if (!link) {
    link = document.createElement("link");
    link.id = "customSiteFontLink";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
}

function resolveGradientPosition(type = "linear", position = "") {
  const value = position || (type === "radial" ? "center" : "135deg");
  if (type === "radial") return value;
  if (/deg|turn|rad/.test(value)) return value;
  const map = {
    center: "180deg",
    "top left": "135deg",
    "top right": "45deg",
    "bottom left": "225deg",
    "bottom right": "315deg"
  };
  return map[value] || "135deg";
}

function getGridJustify(alignment = "center") {
  const map = {
    left: "start",
    center: "center",
    right: "end"
  };
  return map[alignment] || "center";
}

function resolveInlineWidth(width = "100%") {
  if (!width || width === "100%") return "100%";
  return `min(100%, ${width})`;
}

function parseHexColorValue(hex) {
  const clean = String(hex || "").replace("#", "").trim();
  if (![3, 4, 6, 8].includes(clean.length)) return null;
  const normalized = clean.length <= 4
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  const hasAlpha = normalized.length === 8;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: hasAlpha ? parseInt(normalized.slice(6, 8), 16) / 255 : 1
  };
}

function applyOpacityToCssColor(color, opacity = 1) {
  if (!color) return color;
  const finalOpacity = Math.max(0, Math.min(1, Number(opacity ?? 1)));
  try {
    appearanceColorContext.fillStyle = "#000000";
    appearanceColorContext.fillStyle = color;
    const normalized = appearanceColorContext.fillStyle;
    if (normalized.startsWith("#")) {
      const parsed = parseHexColorValue(normalized);
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

function buildGradientBackground(config = {}) {
  const colors = [config.color1, config.color2, config.color3]
    .filter(Boolean)
    .map((color) => applyOpacityToCssColor(color, config.opacity ?? 1));
  if (!colors.length) return "";
  if (config.enabled === false) return colors[0];
  if (config.type === "radial") {
    return `radial-gradient(circle at ${resolveGradientPosition("radial", config.position || "center")}, ${colors.join(", ")})`;
  }
  return `linear-gradient(${resolveGradientPosition("linear", config.position || "135deg")}, ${colors.join(", ")})`;
}

window.resolveGradientPosition = resolveGradientPosition;

function buildPageBackground(settings) {
  return buildGradientBackground({
    enabled: settings.pageBackgroundEnabled,
    type: settings.pageBackgroundType,
    position: settings.pageBackgroundPosition,
    color1: settings.pageBackgroundColor1,
    color2: settings.pageBackgroundColor2,
    color3: settings.pageBackgroundColor3
  });
}

function buildPageOverlay(settings) {
  const opacity = Math.max(0, Math.min(1, Number(settings.pageBackgroundOverlayOpacity ?? 0)));
  return opacity > 0
    ? `linear-gradient(rgba(3,8,21,${opacity}), rgba(3,8,21,${opacity}))`
    : "transparent";
}

function escapeCssUrl(url = "") {
  return url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function applySiteAppearance() {
  ensureCustomFontLoaded();
  document.body.style.fontFamily = getResolvedFontFamily(siteSettings.bodyFontFamily || siteSettings.customFontName || "Manrope");

  const pageBackground = buildPageBackground(siteSettings) || defaultSiteSettings.pageBackgroundColor1;
  document.documentElement.style.setProperty("--page-background", pageBackground);
  document.documentElement.style.setProperty("--text", siteSettings.pageTextColor || "#edf5ff");
  document.documentElement.style.setProperty("--muted", siteSettings.pageMutedTextColor || "#a6b7ca");
  document.documentElement.style.setProperty("--page-heading-font", getResolvedFontFamily(siteSettings.pageHeadingFontFamily || "Space Grotesk"));
  document.documentElement.style.setProperty("--product-shadow-color", siteSettings.productShadowColor || "rgba(2,8,23,.42)");
  document.documentElement.style.setProperty("--product-hover-shadow-color", siteSettings.productHoverShadowColor || "rgba(56,189,248,.25)");
  document.documentElement.style.setProperty("--product-hover-lift", `${siteSettings.productHoverLift || 6}px`);
  document.documentElement.style.setProperty("--product-hover-scale", String(siteSettings.productHoverScale || 1.01));
  document.documentElement.style.setProperty("--product-hover-duration", `${siteSettings.productHoverDuration || 0.28}s`);
  document.documentElement.style.setProperty("--header-background", buildGradientBackground({
    enabled: siteSettings.headerBackgroundEnabled,
    type: siteSettings.headerBackgroundType,
    position: siteSettings.headerBackgroundPosition,
    color1: siteSettings.headerBackgroundColor1,
    color2: siteSettings.headerBackgroundColor2,
    color3: siteSettings.headerBackgroundColor3
  }) || "rgba(4,9,21,.9)");
  document.documentElement.style.setProperty("--header-border-color", siteSettings.headerBorderColor || "rgba(191,219,254,.24)");
  document.documentElement.style.setProperty("--header-backdrop-blur", `${siteSettings.headerBackdropBlur || 18}px`);
  document.documentElement.style.setProperty("--header-button-background", siteSettings.headerButtonBackground || "rgba(15,23,42,.88)");
  document.documentElement.style.setProperty("--header-button-text-color", siteSettings.headerButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--header-button-border-color", siteSettings.headerButtonBorderColor || "rgba(191,219,254,.24)");
  document.documentElement.style.setProperty("--header-button-font", getResolvedFontFamily(siteSettings.headerButtonFontCustom || siteSettings.headerButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--header-button-size", `${siteSettings.headerButtonSize || 14}px`);
  document.documentElement.style.setProperty("--header-button-radius", `${siteSettings.headerButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--header-button-padding-y", `${siteSettings.headerButtonPaddingY || 10}px`);
  document.documentElement.style.setProperty("--header-button-padding-x", `${siteSettings.headerButtonPaddingX || 14}px`);
  document.documentElement.style.setProperty("--header-button-shadow", siteSettings.headerButtonShadowEnabled ? `0 12px 28px ${siteSettings.headerButtonShadowColor || "rgba(2,8,23,.18)"}` : "none");
  document.documentElement.style.setProperty("--header-button-hover-background", siteSettings.headerButtonHoverBackground || "rgba(37,99,235,.34)");
  document.documentElement.style.setProperty("--header-button-hover-text-color", siteSettings.headerButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--header-button-hover-border-color", siteSettings.headerButtonHoverBorderColor || "rgba(125,211,252,.42)");
  document.documentElement.style.setProperty("--header-button-hover-duration", `${siteSettings.headerButtonHoverDuration || 0.2}s`);
  document.documentElement.style.setProperty("--header-button-hover-lift", `${siteSettings.headerButtonHoverLift || 1}px`);
  document.documentElement.style.setProperty("--header-button-hover-shadow", siteSettings.headerButtonShadowEnabled ? `0 16px 32px ${siteSettings.headerButtonHoverShadowColor || siteSettings.headerButtonShadowColor || "rgba(56,189,248,.18)"}` : "none");
  document.documentElement.style.setProperty("--product-card-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.productCardBackgroundType,
    position: siteSettings.productCardBackgroundPosition,
    color1: siteSettings.productCardBackgroundColor1,
    color2: siteSettings.productCardBackgroundColor2,
    color3: siteSettings.productCardBackgroundColor3,
    opacity: siteSettings.productCardBackgroundOpacity ?? 1
  }) || "linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04))");
  document.documentElement.style.setProperty("--product-border-color", siteSettings.productBorderColor || "rgba(191,219,254,.24)");
  document.documentElement.style.setProperty("--product-title-color", siteSettings.productTitleColor || "#f8fbff");
  document.documentElement.style.setProperty("--product-description-color", siteSettings.productDescriptionColor || "#d5e2ef");
  document.documentElement.style.setProperty("--product-title-font", getResolvedFontFamily(siteSettings.productTitleFontCustom || siteSettings.productTitleFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-title-size", `${siteSettings.productTitleSize || 18}px`);
  document.documentElement.style.setProperty("--product-description-font", getResolvedFontFamily(siteSettings.productDescriptionFontCustom || siteSettings.productDescriptionFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-description-size", `${siteSettings.productDescriptionSize || 14}px`);
  document.documentElement.style.setProperty("--product-price-color", siteSettings.productPriceColor || "#7dd3fc");
  document.documentElement.style.setProperty("--product-price-font", getResolvedFontFamily(siteSettings.productPriceFontCustom || siteSettings.productPriceFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-price-size", `${siteSettings.productPriceSize || 22}px`);
  document.documentElement.style.setProperty("--product-old-price-color", siteSettings.productOldPriceColor || "#94a3b8");
  document.documentElement.style.setProperty("--product-offer-color", siteSettings.productOfferColor || "#fdba74");
  document.documentElement.style.setProperty("--product-offer-font", getResolvedFontFamily(siteSettings.productOfferFontCustom || siteSettings.productOfferFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-offer-size", `${siteSettings.productOfferSize || 14}px`);
  document.documentElement.style.setProperty("--product-button-background", siteSettings.productButtonBackground || "rgba(37,99,235,.28)");
  document.documentElement.style.setProperty("--product-button-text-color", siteSettings.productButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--product-button-border-color", siteSettings.productButtonBorderColor || "rgba(191,219,254,.18)");
  document.documentElement.style.setProperty("--product-button-radius", `${siteSettings.productButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--product-button-font", getResolvedFontFamily(siteSettings.productButtonFontCustom || siteSettings.productButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-button-size", `${siteSettings.productButtonSize || 14}px`);
  document.documentElement.style.setProperty("--product-button-shadow", siteSettings.productButtonShadowEnabled ? `0 12px 24px ${siteSettings.productButtonShadowColor || "rgba(2,8,23,.18)"}` : "none");
  document.documentElement.style.setProperty("--product-button-hover-background", siteSettings.productButtonHoverBackground || "rgba(34,211,238,.22)");
  document.documentElement.style.setProperty("--product-button-hover-text-color", siteSettings.productButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--product-button-hover-border-color", siteSettings.productButtonHoverBorderColor || "rgba(125,211,252,.42)");

  const hasImage = Boolean(siteSettings.pageBackgroundImage?.trim());
  document.documentElement.style.setProperty("--page-bg-image", hasImage ? `url("${escapeCssUrl(siteSettings.pageBackgroundImage.trim())}")` : "none");
  document.documentElement.style.setProperty("--page-bg-position", siteSettings.pageBackgroundImagePosition || "center center");
  document.documentElement.style.setProperty("--page-bg-fit", siteSettings.pageBackgroundImageFit || "cover");
  document.documentElement.style.setProperty("--page-bg-repeat", siteSettings.pageBackgroundImageRepeat || "no-repeat");
  document.documentElement.style.setProperty("--page-bg-attachment", siteSettings.pageBackgroundImageAttachment || "scroll");
  document.documentElement.style.setProperty("--page-bg-image-opacity", hasImage ? String(siteSettings.pageBackgroundImageOpacity ?? 1) : "0");
  document.documentElement.style.setProperty("--page-bg-image-brightness", String(siteSettings.pageBackgroundImageBrightness ?? 1));
  document.documentElement.style.setProperty("--page-bg-overlay", hasImage ? buildPageOverlay(siteSettings) : "transparent");
}

function syncSiteSettings(nextSettings = {}) {
  siteSettings = {
    ...defaultSiteSettings,
    ...nextSettings,
    heroCards: Array.isArray(nextSettings.heroCards) && nextSettings.heroCards.length
      ? nextSettings.heroCards
      : defaultSiteSettings.heroCards
  };
  window.siteSettings = siteSettings;
  applySiteAppearance();
  renderBranding();
  renderHero();
}

window.syncSiteSettings = syncSiteSettings;

async function comprimirImagen(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.88);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function subirArchivoABucket(bucket, prefix, file) {
  const isIcoFile = /\.ico$/i.test(file.name || "") || ["image/x-icon", "image/vnd.microsoft.icon"].includes(file.type);
  const shouldCompressImage = file.type.startsWith("image/") && !isIcoFile;
  const finalFile = shouldCompressImage ? await comprimirImagen(file) : file;
  const extension = file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : (isIcoFile ? "ico" : "jpg"));
  const fileName = `${prefix}_${Date.now()}.${extension}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(fileName, finalFile, { upsert: true });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function obtenerPrecioProducto(prod) {
  if (adminSession.wholesaleMode) return Number(prod?.precioMayorista ?? prod?.precio ?? 0);
  return prod?.oferta?.ahora || prod?.precio || 0;
}

function obtenerPrecioUnitarioCarrito(item) {
  if (typeof item?.unitPrice === "number") return Number(item.unitPrice);
  return Number(item?.precio || 0);
}

function buscarProducto(nombre) {
  for (const cat of catalogos) {
    const found = cat.productos.find((item) => item.nombre === nombre);
    if (found) return found;
  }
  return null;
}

function renderBranding() {
  const logoImage = document.getElementById("logoImage");
  const logoText = document.getElementById("logoText");
  const logoSubtext = document.getElementById("logoSubtext");
  if (logoImage) {
    if (siteSettings.logoImage) {
      logoImage.src = siteSettings.logoImage;
      logoImage.classList.remove("hidden");
      document.getElementById("logoMark")?.classList.add("hidden");
    } else {
      logoImage.classList.add("hidden");
      document.getElementById("logoMark")?.classList.remove("hidden");
    }
  }
  if (logoText) {
    logoText.textContent = siteSettings.logoText || defaultSiteSettings.logoText;
    logoText.style.color = siteSettings.logoTextColor || defaultSiteSettings.logoTextColor;
    logoText.style.fontFamily = getResolvedFontFamily(siteSettings.logoFontFamily || defaultSiteSettings.logoFontFamily);
  }
  if (logoSubtext) {
    logoSubtext.textContent = siteSettings.logoSubtext || defaultSiteSettings.logoSubtext;
    logoSubtext.style.color = siteSettings.logoSubtextColor || defaultSiteSettings.logoSubtextColor;
    logoSubtext.style.fontFamily = getResolvedFontFamily(siteSettings.bodyFontFamily || defaultSiteSettings.bodyFontFamily);
  }
}

function renderHero() {
  const container = document.getElementById("heroCards");
  if (!container) return;
  container.innerHTML = "";

  siteSettings.heroCards.forEach((card, index) => {
    const design = {
      width: "100%",
      align: "left",
      boxAlign: "center",
      layoutWidth: "full",
      padding: 42,
      borderRadius: 34,
      eyebrowColor: "#c8f4ff",
      titleColor: "#edf5ff",
      descriptionColor: "#bed0e4",
      titleFont: "Space Grotesk",
      titleFontCustom: "",
      descriptionFont: "Manrope",
      descriptionFontCustom: "",
      titleSize: 74,
      descriptionSize: 18,
      gradient: {
        enabled: true,
        type: "linear",
        position: "135deg",
        color1: "rgba(56,189,248,.12)",
        color2: "rgba(249,115,22,.08)",
        color3: "rgba(255,255,255,.035)"
      },
      ...(card.design || {})
    };
    const gradientColors = [design.gradient?.color1, design.gradient?.color2, design.gradient?.color3].filter(Boolean);
    const background = design.gradient?.enabled
      ? `${design.gradient.type === "radial" ? "radial-gradient(circle at" : "linear-gradient("} ${resolveGradientPosition(design.gradient?.type === "radial" ? "radial" : "linear", design.gradient.position || (design.gradient?.type === "radial" ? "center" : "135deg"))}${design.gradient.type === "radial" ? "," : ","} ${gradientColors.join(", ")})`
      : (gradientColors[0] || "rgba(255,255,255,.035)");
    const article = document.createElement("article");
    article.className = `hero-card hero-card-${design.layoutWidth === "half" ? "half" : "full"}`;
    article.dataset.heroIndex = index;
    article.style.width = resolveInlineWidth(design.width || "100%");
    article.style.justifySelf = getGridJustify(design.boxAlign || "center");
    article.style.textAlign = design.align || "left";
    article.style.padding = `${design.padding || 42}px`;
    article.style.borderRadius = `${design.borderRadius || 34}px`;
    article.style.background = background;
    article.innerHTML = `
      <span class="eyebrow" style="color:${design.eyebrowColor || "#c8f4ff"}">${card.eyebrow || ""}</span>
      <h1 style="color:${design.titleColor || "#edf5ff"};font-family:${getResolvedFontFamily(design.titleFontCustom || design.titleFont || "Space Grotesk")};font-size:clamp(34px,5vw,${design.titleSize || 74}px)">${card.title || ""}</h1>
      <p style="color:${design.descriptionColor || "#bed0e4"};font-family:${getResolvedFontFamily(design.descriptionFontCustom || design.descriptionFont || "Manrope")};font-size:clamp(16px,2vw,${design.descriptionSize || 18}px)">${card.description || ""}</p>
    `;
    container.appendChild(article);
  });

  const adminTools = document.getElementById("heroAdminTools");
  if (adminTools) adminTools.classList.toggle("hidden", !canUseBuilder());
  builderHooks.render();
}

function actualizarUsuarioUI() {
  const avatarWrap = document.getElementById("avatarWrap");
  const avatar = document.getElementById("userAvatar");
  const avatarRoleBadge = document.getElementById("avatarRoleBadge");
  const userMeta = document.getElementById("userMeta");
  const nombre = document.getElementById("userName");
  const role = document.getElementById("userRoleLabel");
  const loginBtn = document.getElementById("loginBtn");
  const carritoIcon = document.getElementById("carritoIcon");
  const guestNote = document.getElementById("carritoGuestNote");
  if (!avatarWrap || !avatar || !avatarRoleBadge || !userMeta || !nombre || !role || !loginBtn || !carritoIcon) return;

  const currentRole = getCurrentUserRole();
  const badge = roleBadgeIcon(currentRole);

  if (usuarioActual) {
    const photo = usuarioActual.syntheticBoss
      ? (accessState.bossCredentials.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png")
      : (usuarioActual.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png");
    avatar.src = photo ? `${photo}${photo.includes("?") ? "&" : "?"}t=${Date.now()}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    avatarWrap.classList.remove("hidden");
    userMeta.classList.remove("hidden");
    nombre.textContent = usuarioActual.username;
    role.textContent = roleLabel(currentRole);
    if (badge) {
      avatarRoleBadge.textContent = badge;
      applyRoleDisplayToElement(avatarRoleBadge, currentRole);
      avatarRoleBadge.classList.remove("hidden");
    } else {
      avatarRoleBadge.classList.add("hidden");
    }
    loginBtn.classList.add("hidden");
  } else {
    avatarWrap.classList.add("hidden");
    userMeta.classList.add("hidden");
    avatarRoleBadge.classList.add("hidden");
    loginBtn.classList.remove("hidden");
  }

  carritoIcon.classList.remove("hidden");
  guestNote?.classList.toggle("hidden", Boolean(usuarioActual));
}

function actualizarContadorCarrito() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const count = document.getElementById("carritoCount");
  const menuCount = document.getElementById("menuCarritoCount");
  if (count) count.textContent = total;
  if (menuCount) menuCount.textContent = total;
}

async function mergeGuestCartIntoUser() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) return;
  const guestCart = getStoredGuestCart();
  if (!guestCart.length) return;

  for (const item of guestCart) {
    const current = await supabaseClient
      .from("carrito")
      .select("id,cantidad")
      .eq("usuario_id", usuarioActual.id)
      .eq("producto_id", item.nombre)
      .maybeSingle();

    if (current.data?.id) {
      await supabaseClient
        .from("carrito")
        .update({ cantidad: Number(current.data.cantidad || 0) + Number(item.cantidad || 0) })
        .eq("id", current.data.id);
    } else {
      await supabaseClient.from("carrito").insert([{
        usuario_id: usuarioActual.id,
        producto_id: item.nombre,
        cantidad: Number(item.cantidad || 1)
      }]);
    }
  }
  mergeStoredCartPricingEntries(guestCart, usuarioActual.id);
  localStorage.removeItem("guestCarrito");
}

async function registrarUsuario() {
  const username = document.getElementById("regUser").value.trim();
  const password = document.getElementById("regPass").value;
  const fotoFile = document.getElementById("regFoto").files[0];
  if (!username) return mostrarMensaje("Completa el nombre de usuario.");
  if (!password) return mostrarMensaje("Completa la contrasena.");

  let fotoURL = null;
  if (fotoFile) fotoURL = await subirArchivoABucket("perfil", "perfil", fotoFile);

  const payload = { username, password, foto: fotoURL };
  const saveResult = await guardarUsuarioRegistro(payload);
  if (!saveResult.ok) {
    const existingUser = await obtenerUsuarioPorCredenciales(username, password);
    if (!existingUser.data) {
      return mostrarMensaje("No se pudo registrar el usuario.");
    }
  }

  const { data } = await obtenerUsuarioPorUsername(username);
  setUsuarioActualData(data || { ...payload });
  applyRoleToCurrentUser();
  await mergeGuestCartIntoUser();
  await cargarCarritoUsuario();
  await cargarFavoritos();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  document.getElementById("regUser").value = "";
  document.getElementById("regPass").value = "";
  limpiarInputArchivo("regFoto");
  document.getElementById("regFotoTrigger").textContent = "Foto perfil";
  document.getElementById("regFotoName").textContent = "Opcional";
  cerrarLoginUsuario();
  mostrarMensaje("Usuario registrado correctamente.");
}

async function loginUsuario() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  if (!username) return mostrarMensaje("Completa el nombre de usuario.");

  if (username === accessState.bossCredentials.username && password === accessState.bossCredentials.password) {
    setUsuarioActualData({
      id: "boss-account",
      username,
      password,
      foto: accessState.bossCredentials.photo || "",
      syntheticBoss: true,
      role: "boss"
    });
    carrito = getStoredGuestCart();
    favoritos = [];
    actualizarUsuarioUI();
    actualizarContadorCarrito();
    cerrarLoginUsuario();
    return;
  }

  const { data, error } = await obtenerUsuarioPorCredenciales(username, password);
  if (error || !data) return mostrarMensaje("Datos incorrectos.");
  setUsuarioActualData(data);
  applyRoleToCurrentUser();
  await mergeGuestCartIntoUser();
  await cargarCarritoUsuario();
  await cargarFavoritos();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  cerrarLoginUsuario();
}

function cerrarSesion() {
  clearUsuarioActualData();
  favoritos = [];
  carrito = getStoredGuestCart();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
}

async function cargarCarritoUsuario() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) {
    carrito = getStoredGuestCart();
    return;
  }
  const { data, error } = await supabaseClient.from("carrito").select("*").eq("usuario_id", usuarioActual.id);
  if (error || !data) {
    carrito = [];
    persistCurrentCartPricing(usuarioActual.id);
    return;
  }
  const storedPricing = getStoredUserCartPricing(usuarioActual.id);
  carrito = data.map((item) => {
    const prod = buscarProducto(item.producto_id) || { nombre: item.producto_id, precio: 0, descripcion: "", precioMayorista: 0 };
    const pricingState = storedPricing[item.producto_id] || {};
    return {
      ...prod,
      precio: Number(prod.precio || 0),
      precioMayorista: Number(prod.precioMayorista ?? prod.precio ?? 0),
      cantidad: Number(item.cantidad || 1),
      unitPrice: Number(typeof pricingState.unitPrice === "number" ? pricingState.unitPrice : prod.precio || 0),
      pricingMode: pricingState.pricingMode === "wholesale" ? "wholesale" : "retail"
    };
  });
}

async function cargarFavoritos() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) {
    favoritos = [];
    return;
  }
  const { data, error } = await supabaseClient.from("favoritos").select("*").eq("usuario_id", usuarioActual.id);
  if (error || !data) return;
  favoritos = data.map((item) => {
    const prod = buscarProducto(item.producto_id) || { nombre: item.producto_id, precio: 0, descripcion: "" };
    return { ...prod, cantidad: item.cantidad };
  });
}

async function syncCarritoProducto(nombre, cantidad) {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) {
    persistGuestCart();
    return;
  }
  const { data } = await supabaseClient.from("carrito").select("id").eq("usuario_id", usuarioActual.id).eq("producto_id", nombre).maybeSingle();
  if (cantidad <= 0) {
    await supabaseClient.from("carrito").delete().eq("usuario_id", usuarioActual.id).eq("producto_id", nombre);
    persistCurrentCartPricing();
    return;
  }
  if (data) {
    await supabaseClient.from("carrito").update({ cantidad }).eq("usuario_id", usuarioActual.id).eq("producto_id", nombre);
  } else {
    await supabaseClient.from("carrito").insert([{ usuario_id: usuarioActual.id, producto_id: nombre, cantidad }]);
  }
  persistCurrentCartPricing();
}

async function agregarCarritoCantidad(nombre, cantidad) {
  const prod = buscarProducto(nombre);
  if (!prod) return;
  const unitPrice = obtenerPrecioProducto(prod);
  const pricingMode = adminSession.wholesaleMode ? "wholesale" : "retail";
  const existing = carrito.find((item) => item.nombre === nombre);
  if (existing) {
    existing.cantidad += cantidad;
    existing.precio = Number(prod.precio || 0);
    existing.precioMayorista = Number(prod.precioMayorista ?? prod.precio ?? 0);
    existing.unitPrice = unitPrice;
    existing.pricingMode = pricingMode;
  } else {
    carrito.push({
      ...prod,
      precio: Number(prod.precio || 0),
      precioMayorista: Number(prod.precioMayorista ?? prod.precio ?? 0),
      cantidad,
      unitPrice,
      pricingMode
    });
  }
  const current = carrito.find((item) => item.nombre === nombre);
  await syncCarritoProducto(nombre, current.cantidad);
  actualizarContadorCarrito();
}

function abrirCantidad(nombre) {
  const value = parseInt(prompt("Cantidad que deseas agregar:", "1"), 10);
  if (!Number.isInteger(value) || value <= 0) return;
  agregarCarritoCantidad(nombre, value);
}

async function agregarFavorito(nombre) {
  if (!usuarioActual || usuarioActual.syntheticBoss) return mostrarMensaje("Debes iniciar sesion.");
  if (favoritos.find((item) => item.nombre === nombre)) return mostrarMensaje("Ya esta en favoritos.");
  const prod = buscarProducto(nombre);
  if (!prod) return;
  favoritos.push({ ...prod, cantidad: 1 });
  await supabaseClient.from("favoritos").insert([{ usuario_id: usuarioActual.id, producto_id: nombre, cantidad: 1 }]);
  abrirFavoritos();
}

function renderMenu() {
  const desktop = document.getElementById("menuCatalogos");
  const mobile = document.getElementById("menuMobile");
  if (!desktop || !mobile) return;
  desktop.innerHTML = "";
  mobile.innerHTML = "";

  catalogos.forEach((cat, index) => {
    const d = document.createElement("a");
    d.href = `#cat${index}`;
    d.textContent = cat.nombre;
    desktop.appendChild(d);

    const m = document.createElement("a");
    m.href = `#cat${index}`;
    m.textContent = cat.nombre;
    mobile.appendChild(m);
  });
}

function buildRetailPriceMarkup(prod) {
  const inOffer = prod.oferta && prod.oferta.antes && prod.oferta.ahora;
  const percentage = inOffer ? Math.round(((prod.oferta.antes - prod.oferta.ahora) / prod.oferta.antes) * 100) : 0;
  return inOffer
    ? `<span class="precio-antiguo">$${prod.oferta.antes}</span><span class="precio">$${prod.oferta.ahora}</span><span class="oferta">-${percentage}%</span>`
    : `<span class="precio">$${prod.precio}</span>`;
}

function buildWholesalePriceMarkup(prod) {
  return `<span class="mode-label">Mayorista</span><span class="precio">$${Number(prod.precioMayorista ?? prod.precio ?? 0)}</span>`;
}

function generarProductoHTML(prod, ci, pi) {
  const wholesaleView = adminSession.wholesaleMode;
  const cartAllowed = !wholesaleView || canUseWholesaleCart();
  return `
    ${!prod.activo ? '<div class="estado">No disponible</div>' : ""}
    <div class="product-image-wrap">
      <img src="${prod.imagen || "https://placehold.co/600x600/0f172a/e2e8f0?text=Sin+Imagen"}" alt="${prod.nombre}" onclick="abrirImagenProducto(${ci},${pi})">
      <span class="product-image-hint">Toca o haz click para ampliar y ver mas</span>
    </div>
    <div class="producto-body">
      <h4>${prod.nombre}</h4>
      <p>${prod.descripcion || ""}</p>
      <div class="precio-row">
        ${wholesaleView ? buildWholesalePriceMarkup(prod) : buildRetailPriceMarkup(prod)}
      </div>
      <div class="acciones-producto">
        <button type="button" onclick="agregarFavorito('${prod.nombre.replace(/'/g, "\\'")}')">Favorito</button>
        <button type="button" ${cartAllowed ? `onclick="abrirCantidad('${prod.nombre.replace(/'/g, "\\'")}')"` : "disabled"}>${cartAllowed ? "Agregar" : "Solo mayorista"}</button>
      </div>
      ${canEditRetail() ? `
        <div class="admin-product-actions">
          <button type="button" onclick="editarProducto(${ci},${pi})">Editar</button>
          <button type="button" onclick="crearOferta(${ci},${pi})">Oferta</button>
          <button type="button" onclick="quitarOferta(${ci},${pi})">Quitar Oferta</button>
          <button type="button" onclick="cambiarImagen(${ci},${pi})">Imagen</button>
          <button type="button" onclick="agregarImagenExtra(${ci},${pi})">Imagen Extra</button>
          <button type="button" onclick="quitarImagenExtra(${ci},${pi})">Quitar Extra</button>
          <button type="button" onclick="cambiarEstado(${ci},${pi})">Estado</button>
          <button type="button" onclick="eliminarProducto(${ci},${pi})">Eliminar</button>
        </div>
      ` : ""}
      ${canEditWholesale() ? `
        <div class="admin-product-actions">
          <button type="button" onclick="editarPrecioMayorista(${ci},${pi})">Precio Mayorista</button>
        </div>
      ` : ""}
    </div>
  `;
}

function render() {
  const cont = document.getElementById("catalogos");
  if (!cont) return;
  cont.innerHTML = "";
  renderMenu();

  catalogos.forEach((cat, ci) => {
    const section = document.createElement("section");
    section.className = "catalogo";
    section.id = `cat${ci}`;
    section.innerHTML = `
      <div class="catalogo-head">
        <h2 class="catalogo-title">${cat.nombre}</h2>
        ${canEditRetail() ? `<div class="catalogo-actions"><button type="button" onclick="agregarProducto(${ci})">Agregar Producto</button><button type="button" class="danger-btn" onclick="eliminarCatalogo(${ci})">Eliminar Catalogo</button></div>` : ""}
      </div>
    `;
    const grid = document.createElement("div");
    grid.className = "productos-grid";
    if (cat.productos.length === 1) grid.classList.add("single-product-grid");
    cat.productos.forEach((prod, pi) => {
      const article = document.createElement("article");
      article.className = "producto";
      article.dataset.searchText = normalizarTexto(`${cat.nombre} ${prod.nombre} ${prod.descripcion || ""}`);
      article.innerHTML = generarProductoHTML(prod, ci, pi);
      grid.appendChild(article);
    });
    section.appendChild(grid);
    cont.appendChild(section);
  });

  activarBuscador();
  actualizarResultadosBusqueda(document.getElementById("buscadorGlobal")?.value || "");
  builderHooks.refreshFeatured();
}

async function cargarDesdeSupabase() {
  try {
    const { data } = await supabaseClient.from("catalogos").select("*").limit(1);
    if (data?.length) {
      catalogos = normalizarCatalogos(data[0].data);
      catalogosRowId = data[0].id;
      return;
    }
  } catch (error) {
    console.error("Error cargando catalogos:", error);
  }
  catalogos = normalizarCatalogos(catalogos);
}

async function guardarEnSupabase() {
  try {
    if (catalogosRowId) {
      await supabaseClient.from("catalogos").update({ data: catalogos }).eq("id", catalogosRowId);
    } else {
      const { data } = await supabaseClient.from("catalogos").insert([{ data: catalogos }]).select();
      if (data?.length) catalogosRowId = data[0].id;
    }
  } catch (error) {
    console.error("Error guardando catalogos:", error);
  }
}

function guardar() {
  catalogos = normalizarCatalogos(catalogos);
  localStorage.setItem("catalogos", JSON.stringify(catalogos));
  guardarEnSupabase();
  render();
}

async function cargarSlidesSupabase() {
  try {
    const { data } = await supabaseClient.from("slides").select("*").limit(1);
    if (data?.length) {
      slidesData = Array.isArray(data[0].data) ? data[0].data : [];
      slidesRowId = data[0].id;
      return;
    }
  } catch (error) {
    console.error("Error cargando slides:", error);
  }
  slidesData = Array.isArray(slidesData) ? slidesData : [];
}

async function guardarSlidesSupabase() {
  try {
    if (slidesRowId) {
      await supabaseClient.from("slides").update({ data: slidesData }).eq("id", slidesRowId);
    } else {
      const { data } = await supabaseClient.from("slides").insert([{ data: slidesData }]).select();
      if (data?.length) slidesRowId = data[0].id;
    }
  } catch (error) {
    console.error("Error guardando slides:", error);
  }
}

function guardarSlides() {
  localStorage.setItem("slidesData", JSON.stringify(slidesData));
  guardarSlidesSupabase();
  renderSlider();
  builderHooks.render();
}

async function agregarSlide() {
  if (!canUseBuilder()) return mostrarMensaje("Solo boss y administradores pueden editar el slider.");
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await subirArchivoABucket("slides", "slide", file);
    slidesData.push({
      imagen: url,
      texto: prompt("Texto del slide:", "") || "",
      descripcion: prompt("Descripcion del slide:", "") || "",
      duracion: parseInt(prompt("Duracion en segundos:", "4"), 10) || 4
    });
    slideIndex = slidesData.length - 1;
    guardarSlides();
  };
  input.click();
}

function editarSlide(index) {
  if (!canUseBuilder()) return mostrarMensaje("Solo boss y administradores pueden editar el slider.");
  const slide = slidesData[index];
  if (!slide) return;
  slide.texto = prompt("Texto del slide:", slide.texto) ?? slide.texto;
  slide.descripcion = prompt("Descripcion del slide:", slide.descripcion || "") ?? slide.descripcion;
  slide.duracion = parseInt(prompt("Duracion:", String(slide.duracion || 4)), 10) || 4;
  guardarSlides();
}

function eliminarSlide(index) {
  if (!canUseBuilder()) return mostrarMensaje("Solo boss y administradores pueden editar el slider.");
  if (!slidesData[index] || !confirm("Eliminar slide?")) return;
  slidesData.splice(index, 1);
  slideIndex = Math.max(0, slideIndex - 1);
  guardarSlides();
}

function restaurarSlider() {
  if (!canUseBuilder()) return mostrarMensaje("Solo boss y administradores pueden editar el slider.");
  if (slidesData.length) return mostrarMensaje("El slider ya existe.");
  slidesData = [{
    imagen: "https://placehold.co/1600x700/082032/e2e8f0?text=DIGIHERA+TECH",
    texto: "Ofertas destacadas",
    descripcion: "Tu catalogo visual renovado y conectado.",
    duracion: 4
  }];
  guardarSlides();
}

function iniciarSlider() {
  clearInterval(sliderInterval);
  if (!slidesData.length) return;
  sliderInterval = setInterval(nextSlide, (slidesData[slideIndex]?.duracion || 4) * 1000);
}

function renderSlider() {
  const slider = document.getElementById("slider");
  if (!slider) return;
  slider.innerHTML = "";
  if (!slidesData.length) {
    slider.innerHTML = `<div class="slide"><img src="https://placehold.co/1600x700/082032/e2e8f0?text=Agrega+tu+primer+slide" alt="slider"><div class="slide-info"><h2>Slider listo para editar</h2><p>Activa el modo administrador y agrega tus slides.</p></div></div>`;
    return;
  }
  const slide = slidesData[slideIndex];
  const div = document.createElement("div");
  div.className = "slide";
  div.innerHTML = `
    <img src="${slide.imagen}" alt="${slide.texto || "Slide"}">
    <div class="slide-info">
      <h2>${slide.texto || ""}</h2>
      <p>${slide.descripcion || ""}</p>
      ${canUseBuilder() ? `<div class="modal-actions"><button type="button" onclick="editarSlide(${slideIndex})">Editar</button><button type="button" class="danger-btn" onclick="eliminarSlide(${slideIndex})">Eliminar</button></div>` : ""}
    </div>
  `;
  slider.appendChild(div);
  iniciarSlider();
}

function nextSlide() {
  if (!slidesData.length) return;
  slideIndex = (slideIndex + 1) % slidesData.length;
  renderSlider();
}

function prevSlide() {
  if (!slidesData.length) return;
  slideIndex = (slideIndex - 1 + slidesData.length) % slidesData.length;
  renderSlider();
}

function actualizarSliderAdmin() {
  const sliderAdmin = document.getElementById("sliderAdmin");
  if (sliderAdmin) sliderAdmin.classList.toggle("hidden", !canUseBuilder());
}

function startAdminSession(role, username = "", source = "user", userId = null) {
  adminSession = {
    active: true,
    role,
    username,
    userId,
    source,
    wholesaleMode: false
  };
  actualizarAdminPanel();
  render();
  renderHero();
  renderSlider();
  actualizarSliderAdmin();
  builderHooks.setAdmin(true);
  closeLogin();
}

function updateAdminModeHint() {
  const hint = document.getElementById("adminModeHint");
  if (!hint) return;
  const userField = document.getElementById("adminModeUser");
  const passField = document.getElementById("adminModePass");
  if (userField) userField.value = "";
  if (passField) passField.value = "";
  if (!usuarioActual) {
    hint.textContent = "Primero inicia sesion con una cuenta registrada.";
    hint.classList.remove("hidden");
    return;
  }
  const role = getCurrentUserRole();
  if (role === "boss") {
    hint.textContent = "Boss: puedes entrar con tu cuenta boss o con la clave interna.";
    hint.classList.remove("hidden");
    return;
  }
  if (["administrador", "vendedor", "mayorista"].includes(role)) {
    hint.textContent = "Tu cuenta ya tiene etiqueta interna. Usa el acceso interno para continuar.";
    hint.classList.remove("hidden");
    return;
  }
  hint.textContent = "Las cuentas cliente no pueden entrar al modo interno aunque conozcan la clave.";
  hint.classList.remove("hidden");
}

function logoutAdminMode() {
  adminSession = {
    active: false,
    role: null,
    username: "",
    userId: null,
    source: "",
    wholesaleMode: false
  };
  actualizarAdminPanel();
  actualizarUsuarioUI();
  render();
  renderHero();
  renderSlider();
  actualizarSliderAdmin();
  builderHooks.setAdmin(false);
}

function activarModoTienda() {
  if (!adminSession.active) return;
  adminSession.wholesaleMode = false;
  actualizarAdminPanel();
  render();
  renderSlider();
}

async function loginAdminMode() {
  const username = document.getElementById("adminModeUser").value.trim();
  const password = document.getElementById("adminModePass").value.trim();
  if (!username || !password) return mostrarMensaje("Completa usuario y contrasena.");
  if (!usuarioActual) return mostrarMensaje("Primero debes iniciar sesion con una cuenta registrada.");

  const currentRole = getCurrentUserRole();
  if (currentRole === "cliente") {
    return mostrarMensaje("Tu cuenta no tiene una etiqueta interna. El boss debe asignarte un rol primero.");
  }

  if (currentRole === "boss") {
    const isBossCredential = username === accessState.bossCredentials.username && password === accessState.bossCredentials.password;
    const isSharedInternal = username === accessState.adminCredentials.username && password === accessState.adminCredentials.password;
    if (!isBossCredential && !isSharedInternal) {
      return mostrarMensaje("Credenciales internas no validas.");
    }
      startAdminSession("boss", usuarioActual.username || accessState.bossCredentials.username, "user", usuarioActual.id || null);
    return;
  }

  const isSharedInternal = username === accessState.adminCredentials.username && password === accessState.adminCredentials.password;
  if (!isSharedInternal) {
    return mostrarMensaje("Debes usar el usuario y la contrasena interna configurados por el boss.");
  }

  if (!["administrador", "vendedor", "mayorista"].includes(currentRole)) {
    return mostrarMensaje("Tu cuenta no tiene acceso al modo interno.");
  }

  startAdminSession(currentRole, usuarioActual.username || username, "user", usuarioActual.id || null);
}

function solicitarPasswordMayorista() {
  const password = prompt("Contrasena del modo venta al por mayor:");
  if (password !== accessState.wholesaleCredentials.password) {
    mostrarMensaje("Contrasena mayorista incorrecta.");
    return false;
  }
  adminSession.wholesaleMode = true;
  actualizarAdminPanel();
  render();
  return true;
}

function toggleWholesaleMode() {
  if (!canToggleWholesale()) return mostrarMensaje("Tu rol no puede acceder a venta al por mayor.");
  if (adminSession.wholesaleMode) {
    activarModoTienda();
    return;
  }
  if (solicitarPasswordMayorista()) {
    render();
  }
}

function actualizarAdminPanel() {
  const panel = document.getElementById("adminGlobalPanel");
  const roleSummary = document.getElementById("adminRoleSummary");
  const modeSummary = document.getElementById("adminModeSummary");
  const wholesaleBtn = document.getElementById("adminWholesaleBtn");
  const retailBtn = document.getElementById("adminRetailBtn");
  const createCatalogBtn = document.getElementById("adminCreateCatalogBtn");
  if (!panel || !roleSummary || !modeSummary || !wholesaleBtn || !retailBtn || !createCatalogBtn) return;

  panel.classList.toggle("hidden", !adminSession.active);
  if (!adminSession.active) return;

  const role = getEffectiveRole(adminSession.role);
  roleSummary.textContent = `${roleLabel(role)} activo`;
  modeSummary.textContent = adminSession.wholesaleMode
    ? "Estas editando la vista y los precios de venta al por mayor."
    : role === "mayorista"
      ? "Estas viendo la tienda. Solo puedes modificar cuando actives venta al por mayor."
      : canUseBuilder(role)
        ? "Tienes acceso completo de tienda y builder segun tu rol."
        : "Estas gestionando la tienda para clientes.";

  wholesaleBtn.classList.toggle("hidden", !canToggleWholesale());
  retailBtn.classList.toggle("hidden", !adminSession.wholesaleMode);
  createCatalogBtn.classList.toggle("hidden", !canEditRetail());
  builderHooks.setAdmin(adminSession.active);
}

function closeLogin() { closeModal("loginModal"); }
function abrirLoginUsuario() { openModal("loginUsuarioModal"); }
function cerrarLoginUsuario() { closeModal("loginUsuarioModal"); }

function togglePass(id) {
  const input = document.getElementById(id);
  if (input) input.type = input.type === "password" ? "text" : "password";
}

function toggleSearchSections(isSearching) {
  document.querySelectorAll(".search-mode-hidden").forEach((node) => {
    node.classList.toggle("hidden", isSearching);
  });
}

function actualizarResultadosBusqueda(valor = "") {
  const value = normalizarTexto(valor);
  const isSearching = value.length > 0;
  toggleSearchSections(isSearching);

  document.querySelectorAll(".producto").forEach((prod) => {
    const searchText = prod.dataset.searchText || normalizarTexto(prod.innerText);
    prod.classList.toggle("oculto", isSearching && !searchText.includes(value));
  });

  document.querySelectorAll(".catalogo").forEach((section) => {
    const visibleProducts = [...section.querySelectorAll(".producto:not(.oculto)")];
    section.classList.toggle("hidden", isSearching && visibleProducts.length === 0);
  });

  if (!isSearching) {
    document.querySelectorAll(".catalogo").forEach((section) => section.classList.remove("hidden"));
  }
}

function activarBuscador() {
  const input = document.getElementById("buscadorGlobal");
  const toggle = document.getElementById("searchToggle");
  if (!input || input.dataset.bound === "true") return;
  input.dataset.bound = "true";

  input.addEventListener("input", () => {
    actualizarResultadosBusqueda(input.value);
    if (window.innerWidth <= 760 && input.value.trim()) {
      document.getElementById("searchWrap")?.classList.add("is-open");
    }
  });

  input.addEventListener("focus", () => {
    if (window.innerWidth <= 760) {
      document.getElementById("searchWrap")?.classList.add("is-open");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      actualizarResultadosBusqueda("");
      document.getElementById("searchWrap")?.classList.remove("is-open");
    }
  });

  toggle?.addEventListener("click", () => {
    const wrap = document.getElementById("searchWrap");
    if (!wrap) return;
    const willOpen = !wrap.classList.contains("is-open");
    wrap.classList.toggle("is-open", willOpen);
    if (willOpen) {
      input.focus();
    } else if (!input.value.trim()) {
      actualizarResultadosBusqueda("");
    }
  });
}

function animateImagePreview() {
  const preview = document.getElementById("imgPreview");
  if (!preview) return;
  preview.classList.remove("is-swapping");
  void preview.offsetWidth;
  preview.classList.add("is-swapping");
}

function renderImagenThumbnails() {
  const thumbs = document.getElementById("imgThumbs");
  if (!thumbs) return;
  if (imagenesProducto.length <= 1) {
    thumbs.innerHTML = "";
    thumbs.classList.add("hidden");
    return;
  }
  thumbs.classList.remove("hidden");
  thumbs.innerHTML = imagenesProducto.map((src, index) => `
    <button type="button" class="img-thumb ${index === indiceImagenActual ? "active" : ""}" onclick="setImagenModalIndex(${index})">
      <img src="${src}" alt="Miniatura ${index + 1}">
    </button>
  `).join("");
}

function setImagenModalIndex(index, animate = true) {
  if (!imagenesProducto.length) return;
  indiceImagenActual = (index + imagenesProducto.length) % imagenesProducto.length;
  actualizarImagenModal(animate);
}

window.setImagenModalIndex = setImagenModalIndex;

function abrirImagenProducto(ci, pi) {
  const producto = catalogos[ci].productos[pi];
  abrirImagen(producto.imagen, producto.imagenes || [], producto.nombre || "Producto");
}

function abrirImagen(src, imagenes = [], nombre = "") {
  imagenesProducto = [];
  if (src) imagenesProducto.push(src);
  if (Array.isArray(imagenes)) imagenesProducto = imagenesProducto.concat(imagenes.filter(Boolean));
  if (!imagenesProducto.length) return;
  indiceImagenActual = 0;
  const preview = document.getElementById("imgPreview");
  if (preview) {
    preview.alt = nombre ? `Vista ampliada de ${nombre}` : "Vista previa";
    preview.src = imagenesProducto[indiceImagenActual];
  }
  actualizarImagenModal(false);
  openModal("imgModal");
}

function actualizarImagenModal(animate = false) {
  const preview = document.getElementById("imgPreview");
  const prevBtn = document.getElementById("imgPrev");
  const nextBtn = document.getElementById("imgNext");
  const counter = document.getElementById("imgModalCounter");
  const moreBtn = document.getElementById("imgMoreBtn");
  if (!preview || !imagenesProducto.length) return;
  if (animate) animateImagePreview();
  preview.src = imagenesProducto[indiceImagenActual];
  if (counter) {
    counter.textContent = imagenesProducto.length > 1 ? `${indiceImagenActual + 1} / ${imagenesProducto.length}` : "";
  }
  if (prevBtn) prevBtn.classList.toggle("hidden", imagenesProducto.length <= 1);
  if (nextBtn) nextBtn.classList.toggle("hidden", imagenesProducto.length <= 1);
  if (moreBtn) {
    moreBtn.classList.toggle("hidden", imagenesProducto.length <= 1);
    moreBtn.textContent = imagenesProducto.length > 1 ? "Ver mas imagenes" : "";
  }
  renderImagenThumbnails();
}

function agregarProducto(ci) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede agregar productos en este modo.");
  const nombre = prompt("Nombre del producto:");
  const precio = parseFloat(prompt("Precio normal:"));
  const precioMayorista = parseFloat(prompt("Precio al por mayor:", String(precio || 0)));
  const descripcion = prompt("Descripcion:") || "";
  if (!nombre || Number.isNaN(precio)) return;
  catalogos[ci].productos.push(normalizarProducto({
    nombre: nombre.trim(),
    precio,
    precioMayorista: Number.isNaN(precioMayorista) ? precio : precioMayorista,
    descripcion: descripcion.trim(),
    imagen: null,
    imagenes: [],
    oferta: null,
    activo: true
  }));
  guardar();
}

function editarProducto(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede editar productos en este modo.");
  const prod = catalogos[ci].productos[pi];
  const nombre = prompt("Nombre:", prod.nombre);
  const precio = parseFloat(prompt("Precio normal:", String(prod.precio)));
  const descripcion = prompt("Descripcion:", prod.descripcion);
  if (!nombre || Number.isNaN(precio)) return;
  prod.nombre = nombre.trim();
  prod.precio = precio;
  prod.descripcion = (descripcion || "").trim();
  guardar();
}

function editarPrecioMayorista(ci, pi) {
  if (!canEditWholesale()) return mostrarMensaje("Activa el modo venta al por mayor para editar este precio.");
  const prod = catalogos[ci].productos[pi];
  const precioMayorista = parseFloat(prompt("Precio mayorista:", String(prod.precioMayorista ?? prod.precio ?? 0)));
  if (Number.isNaN(precioMayorista)) return;
  prod.precioMayorista = precioMayorista;
  guardar();
}

function eliminarProducto(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede eliminar productos.");
  if (!confirm("Eliminar producto?")) return;
  catalogos[ci].productos.splice(pi, 1);
  guardar();
}

function cambiarEstado(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede cambiar estado.");
  catalogos[ci].productos[pi].activo = !catalogos[ci].productos[pi].activo;
  guardar();
}

function crearOferta(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede crear ofertas.");
  const antes = parseFloat(prompt("Precio anterior:"));
  const ahora = parseFloat(prompt("Precio oferta:"));
  if (Number.isNaN(antes) || Number.isNaN(ahora) || ahora >= antes) return mostrarMensaje("La oferta debe ser menor que el precio anterior.");
  catalogos[ci].productos[pi].oferta = { antes, ahora };
  guardar();
}

function quitarOferta(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede quitar ofertas.");
  catalogos[ci].productos[pi].oferta = null;
  guardar();
}

async function cambiarImagen(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede cambiar imagenes.");
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    catalogos[ci].productos[pi].imagen = await subirArchivoABucket("productos", "producto", file);
    guardar();
  };
  input.click();
}

async function agregarImagenExtra(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede cambiar imagenes.");
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await subirArchivoABucket("productos", "producto_extra", file);
    catalogos[ci].productos[pi].imagenes = catalogos[ci].productos[pi].imagenes || [];
    catalogos[ci].productos[pi].imagenes.push(url);
    guardar();
  };
  input.click();
}

function quitarImagenExtra(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede cambiar imagenes.");
  if (!catalogos[ci].productos[pi].imagenes?.length) return mostrarMensaje("No hay imagenes extra.");
  catalogos[ci].productos[pi].imagenes.pop();
  guardar();
}

function crearCatalogo() {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede crear catalogos.");
  const nombre = prompt("Nombre del catalogo:");
  if (!nombre) return;
  catalogos.push({ nombre: nombre.trim(), productos: [] });
  guardar();
}

function eliminarCatalogo(ci) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede eliminar catalogos.");
  if (!confirm("Eliminar catalogo completo?")) return;
  catalogos.splice(ci, 1);
  guardar();
}

function abrirCarrito() {
  const lista = document.getElementById("carritoLista");
  const totalBox = document.getElementById("carritoTotal");
  if (!lista || !totalBox) return;
  lista.innerHTML = "";
  let total = 0;
  carrito.forEach((item, index) => {
    const subtotal = obtenerPrecioUnitarioCarrito(item) * Number(item.cantidad || 0);
    total += subtotal;
    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `
      <strong>${item.nombre}</strong>
      <div class="item-carrito-controls">
        <button type="button" onclick="restarCantidad(${index})">-</button>
        <input type="number" value="${item.cantidad}" min="1" onchange="cambiarCantidad(${index}, this.value)">
        <button type="button" onclick="sumarCantidad(${index})">+</button>
        <button type="button" class="danger-btn" onclick="quitarCarrito(${index})">Quitar</button>
      </div>
      <span>$${subtotal}</span>
    `;
    lista.appendChild(div);
  });
  totalBox.textContent = `Total: $${total}`;
  openModal("carritoModal");
}

function cerrarCarrito() { closeModal("carritoModal"); }

async function quitarCarrito(index) {
  const prod = carrito[index];
  carrito.splice(index, 1);
  await syncCarritoProducto(prod.nombre, 0);
  actualizarContadorCarrito();
  abrirCarrito();
}

async function sumarCantidad(index) {
  carrito[index].cantidad += 1;
  await syncCarritoProducto(carrito[index].nombre, carrito[index].cantidad);
  actualizarContadorCarrito();
  abrirCarrito();
}

async function restarCantidad(index) {
  if (carrito[index].cantidad <= 1) return;
  carrito[index].cantidad -= 1;
  await syncCarritoProducto(carrito[index].nombre, carrito[index].cantidad);
  actualizarContadorCarrito();
  abrirCarrito();
}

async function cambiarCantidad(index, value) {
  const amount = parseInt(value, 10);
  if (!Number.isInteger(amount) || amount <= 0) return;
  carrito[index].cantidad = amount;
  await syncCarritoProducto(carrito[index].nombre, amount);
  actualizarContadorCarrito();
  abrirCarrito();
}

function enviarPedido() {
  if (!carrito.length) return mostrarMensaje("Carrito vacio.");
  let total = 0;
  let mensaje = usuarioActual ? `Pedido DIGIHERA TECH de ${usuarioActual.username}\n\n` : "Pedido DIGIHERA TECH (cliente sin registro)\n\n";
  carrito.forEach((item) => {
    const subtotal = obtenerPrecioUnitarioCarrito(item) * Number(item.cantidad || 0);
    total += subtotal;
    const modeLabel = item.pricingMode === "wholesale" ? " (mayorista)" : "";
    mensaje += `${item.nombre}${modeLabel} x${item.cantidad} - $${subtotal}\n`;
  });
  mensaje += `\nTotal: $${total}`;
  window.open(`https://wa.me/18298483964?text=${encodeURIComponent(mensaje)}`, "_blank");
  guardarPedidoHistorial(total);
}

async function guardarPedidoHistorial(total) {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) return;
  await supabaseClient.from("pedidos").insert([{ usuario_id: usuarioActual.id, productos: carrito, total, fecha: new Date().toISOString() }]);
}

function abrirFavoritos() {
  if (!usuarioActual || usuarioActual.syntheticBoss) return mostrarMensaje("Inicia sesion para usar favoritos.");
  const lista = document.getElementById("favoritosLista");
  if (!lista) return;
  lista.innerHTML = "";
  favoritos.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `<strong>${item.nombre}</strong><span>$${item.precio || obtenerPrecioProducto(item)}</span><button type="button" class="danger-btn" onclick="quitarFavorito(${index})">Quitar</button>`;
    lista.appendChild(div);
  });
  openModal("favoritosModal");
}

function cerrarFavoritos() { closeModal("favoritosModal"); }

async function quitarFavorito(index) {
  const prod = favoritos[index];
  favoritos.splice(index, 1);
  await supabaseClient.from("favoritos").delete().eq("usuario_id", usuarioActual.id).eq("producto_id", prod.nombre);
  abrirFavoritos();
}

function buildRoleOptions(selectedRole = "administrador") {
  return `
    <option value="administrador" ${selectedRole === "administrador" ? "selected" : ""}>Administrador</option>
    <option value="vendedor" ${selectedRole === "vendedor" ? "selected" : ""}>Vendedor</option>
    <option value="mayorista" ${selectedRole === "mayorista" ? "selected" : ""}>Mayorista</option>
  `;
}

function buildBossRoleListMarkup() {
  if (!accessState.roleAssignments.length) return "<p>Aun no hay usuarios con etiquetas.</p>";
  return accessState.roleAssignments.map((item, index) => `
    <div class="role-row">
      <div>
        <strong>${item.username}</strong>
        <small>${roleLabel(item.role)}</small>
      </div>
      <div class="builder-action-row">
        <select id="bossRoleEdit_${index}">
          ${buildRoleOptions(item.role)}
        </select>
        <button type="button" onclick="modificarEtiquetaUsuario(${index})">Guardar</button>
        <button type="button" class="danger-btn" onclick="quitarEtiquetaUsuarioPorIndice(${index})">Quitar</button>
      </div>
    </div>
  `).join("");
}

function buildBossToolsMarkup() {
  const rolesMarkup = buildBossRoleListMarkup();

  return `
    <details class="accordion-card" open>
      <summary>Accesos internos</summary>
      <div class="accordion-body boss-grid">
        <label>Usuario admin compartido<input id="bossAdminUser" value="${accessState.adminCredentials.username}"></label>
        <label>Contrasena admin compartida<input id="bossAdminPass" value="${accessState.adminCredentials.password}"></label>
        <label>Contrasena venta al por mayor<input id="bossWholesalePass" value="${accessState.wholesaleCredentials.password}"></label>
        <button type="button" onclick="guardarCredencialesInternas()">Guardar accesos internos</button>
      </div>
    </details>
    <details class="accordion-card">
      <summary>Etiquetas del equipo</summary>
      <div class="accordion-body boss-grid">
        <label>Usuario registrado<input id="bossRoleUsername" placeholder="Nombre exacto del usuario"></label>
        <label>Contrasena del usuario<input id="bossRolePassword" placeholder="Contrasena usada al registrarse"></label>
        <label>Etiqueta<select id="bossRoleSelect">${buildRoleOptions("administrador")}</select></label>
        <button type="button" onclick="asignarEtiquetaUsuario()">Verificar y asignar</button>
        <div class="boss-role-list">${rolesMarkup}</div>
      </div>
    </details>
    <details class="accordion-card">
      <summary>Cuenta Boss</summary>
      <div class="accordion-body boss-grid">
        <label>Correo Gmail de verificacion<input id="bossGmail" value="${accessState.bossCredentials.gmail || ""}" placeholder="tucorreo@gmail.com"></label>
        <div class="builder-action-row">
          <button type="button" onclick="enviarVerificacionBoss()">Enviar codigo Gmail</button>
          <button type="button" class="ghost-btn" onclick="mostrarEstadoVerificacionBoss()">Estado</button>
        </div>
        <label>Codigo recibido<input id="bossOtpCode" placeholder="Codigo OTP del correo"></label>
        <button type="button" onclick="verificarCodigoBoss()">Verificar correo</button>
        <label>Usuario boss<input id="bossUsernameField" value="${accessState.bossCredentials.username}"></label>
        <label>Contrasena boss<input id="bossPasswordField" value="${accessState.bossCredentials.password}"></label>
        <button type="button" onclick="guardarCuentaBoss()">Guardar cuenta boss</button>
      </div>
    </details>
  `;
}

function renderProfileModal() {
  const pill = document.getElementById("profileRolePill");
  const bossTools = document.getElementById("bossProfileTools");
  const removeBtn = document.getElementById("eliminarCuentaBtn");
  const profileName = document.getElementById("perfilNombre");
  const currentPass = document.getElementById("perfilPassActual");
  const newPass = document.getElementById("perfilPassNueva");
  const confirmPass = document.getElementById("perfilPassConfirmar");
  if (!pill || !bossTools || !removeBtn) return;
  const role = getCurrentUserRole();
  pill.className = `role-chip ${roleChipClass(role)}`;
  pill.textContent = `${roleBadgeIcon(role) ? `${roleBadgeIcon(role)} ` : ""}${roleLabel(role)}`;
  applyRoleDisplayToElement(pill, role);
  bossTools.classList.toggle("hidden", role !== "boss");
  bossTools.innerHTML = role === "boss" ? buildBossToolsMarkup() : "";
  removeBtn.classList.toggle("hidden", role === "boss");
  if (profileName) profileName.readOnly = role === "boss";
  if (currentPass) currentPass.disabled = role === "boss";
  if (newPass) newPass.disabled = role === "boss";
  if (confirmPass) confirmPass.disabled = role === "boss";
}

function abrirPerfil() {
  if (!usuarioActual) return mostrarMensaje("Debes iniciar sesion.");
  document.getElementById("perfilNombre").value = usuarioActual.username || "";
  document.getElementById("passOculta").textContent = "*****";
  document.getElementById("perfilFotoTrigger").textContent = "Foto perfil";
  document.getElementById("perfilFotoName").textContent = "Sin cambios";
  limpiarInputArchivo("perfilFoto");
  renderProfileModal();
  openModal("perfilModal");
}

function verPasswordActual() {
  if (!usuarioActual) return;
  const span = document.getElementById("passOculta");
  const password = usuarioActual.syntheticBoss ? accessState.bossCredentials.password : usuarioActual.password;
  span.textContent = span.textContent === "*****" ? password : "*****";
}

function cerrarPerfil() { closeModal("perfilModal"); }

async function guardarPerfil() {
  if (!usuarioActual) return;
  const nombre = document.getElementById("perfilNombre").value.trim();
  const passActual = document.getElementById("perfilPassActual").value;
  const passNueva = document.getElementById("perfilPassNueva").value;
  const passConfirm = document.getElementById("perfilPassConfirmar").value;
  const previousUsername = usuarioActual.username;
  if (!nombre) return mostrarMensaje("El nombre no puede estar vacio.");
  if (passNueva && passNueva !== passConfirm) return mostrarMensaje("Las contrasenas no coinciden.");

  if (usuarioActual.syntheticBoss) {
    accessState.bossCredentials.photo = accessState.bossCredentials.photo || "";
    const fotoFile = document.getElementById("perfilFoto").files[0];
    if (fotoFile) {
      accessState.bossCredentials.photo = await subirArchivoABucket("perfil", "boss_perfil", fotoFile);
    }
    setUsuarioActualData({
      ...usuarioActual,
      username: accessState.bossCredentials.username,
      password: accessState.bossCredentials.password,
      foto: accessState.bossCredentials.photo,
      syntheticBoss: true,
      role: "boss"
    });
    syncAccessState(accessState);
    builderHooks.persistAll();
    actualizarUsuarioUI();
    cerrarPerfil();
    if (nombre !== accessState.bossCredentials.username || passNueva || passActual || passConfirm) {
      mostrarMensaje("La foto del boss se guardo. Para cambiar usuario o contrasena usa la seccion 'Cuenta Boss' con verificacion Gmail.");
      return;
    }
    return;
  }

  if (!usuarioActual?.id) return;
  if (passNueva && passActual !== usuarioActual.password) return mostrarMensaje("Contrasena actual incorrecta.");

  const updateData = { username: nombre };
  const fotoFile = document.getElementById("perfilFoto").files[0];
  if (fotoFile) updateData.foto = await subirArchivoABucket("perfil", `perfil_${usuarioActual.id}`, fotoFile);
  if (passNueva) updateData.password = passNueva;
  const { error } = await supabaseClient.from("usuarios").update(updateData).eq("id", usuarioActual.id);
  if (error) return mostrarMensaje("No se pudo actualizar el perfil.");
  const { data } = await supabaseClient.from("usuarios").select("*").eq("id", usuarioActual.id).single();
  const roleAssignment = accessState.roleAssignments.find((item) =>
    String(item.userId ?? "") === String(data.id) ||
    item.username?.trim().toLowerCase() === String(previousUsername || "").trim().toLowerCase()
  );
  if (roleAssignment) {
    roleAssignment.userId = data.id;
    roleAssignment.username = data.username;
  }
  if (adminSession.active && adminSession.source === "user" && adminSession.username === previousUsername) {
    adminSession.username = data.username;
  }
  usuarioActual = { ...data, role: getAssignedRole(data) };
  localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
  syncAccessState(accessState);
  builderHooks.persistAll();
  actualizarUsuarioUI();
  cerrarPerfil();
}

async function eliminarCuenta() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) return;
  const deletingUserId = usuarioActual.id;
  const pass = prompt("Escribe tu contrasena para eliminar la cuenta:");
  if (pass !== usuarioActual.password) return mostrarMensaje("Contrasena incorrecta.");
  if (!confirm("Esta accion eliminara tu cuenta. Deseas continuar?")) return;
  await supabaseClient.from("carrito").delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from("favoritos").delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from("pedidos").delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from("usuarios").delete().eq("id", usuarioActual.id);
  accessState.roleAssignments = accessState.roleAssignments.filter((item) =>
    String(item.userId ?? "") !== String(usuarioActual.id) &&
    item.username?.trim().toLowerCase() !== String(usuarioActual.username || "").trim().toLowerCase()
  );
  syncAccessState(accessState);
  builderHooks.persistAll();
  clearStoredUserCartPricing(deletingUserId);
  cerrarSesion();
  cerrarPerfil();
}

async function abrirHistorial() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) return mostrarMensaje("Este historial solo esta disponible para cuentas registradas.");
  const lista = document.getElementById("historialLista");
  if (!lista) return;
  lista.innerHTML = "";
  const { data } = await supabaseClient.from("pedidos").select("*").eq("usuario_id", usuarioActual.id).order("fecha", { ascending: false });
  (data || []).forEach((pedido) => {
    const div = document.createElement("div");
    div.className = "historial-item";
    const productos = Array.isArray(pedido.productos) ? pedido.productos.map((item) => `${item.nombre} x${item.cantidad}`).join(", ") : "Sin detalle";
    div.innerHTML = `
      <div class="historial-head">
        <strong>Total: $${pedido.total}</strong>
        <button type="button" class="danger-btn" onclick="eliminarHistorial('${pedido.id}')">Eliminar</button>
      </div>
      <p>${productos}</p>
      <small>${new Date(pedido.fecha).toLocaleString()}</small>
    `;
    lista.appendChild(div);
  });
  openModal("historialModal");
}

async function eliminarHistorial(id) {
  await supabaseClient.from("pedidos").delete().eq("id", id);
  abrirHistorial();
}

function cerrarHistorial() { closeModal("historialModal"); }

async function asignarEtiquetaUsuario() {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede asignar etiquetas.");
  const username = document.getElementById("bossRoleUsername")?.value.trim();
  const password = document.getElementById("bossRolePassword")?.value;
  const role = document.getElementById("bossRoleSelect")?.value;
  if (!username || !password || !role) return mostrarMensaje("Completa usuario, contrasena y etiqueta.");
  const { data } = await obtenerUsuarioPorCredenciales(username, password);
  if (!data) return mostrarMensaje("No se pudo verificar ese usuario con esa contrasena.");
  const existing = accessState.roleAssignments.find((item) => String(item.userId ?? "") === String(data.id));
  if (existing) {
    existing.userId = data.id;
    existing.username = data.username;
    existing.role = role;
  } else {
    accessState.roleAssignments.push({ userId: data.id, username: data.username, role });
  }
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
  mostrarMensaje("Etiqueta actualizada.");
}

function modificarEtiquetaUsuario(index) {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede modificar etiquetas.");
  const item = accessState.roleAssignments[index];
  const select = document.getElementById(`bossRoleEdit_${index}`);
  if (!item || !select) return;
  item.role = select.value;
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
}

function quitarEtiquetaUsuario(username) {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede quitar etiquetas.");
  accessState.roleAssignments = accessState.roleAssignments.filter((item) => item.username.toLowerCase() !== username.toLowerCase());
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
}

function quitarEtiquetaUsuarioPorIndice(index) {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede quitar etiquetas.");
  accessState.roleAssignments.splice(index, 1);
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
}

function guardarCredencialesInternas() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede cambiar estas credenciales.");
  const adminUsername = document.getElementById("bossAdminUser")?.value.trim();
  const adminPassword = document.getElementById("bossAdminPass")?.value.trim();
  const wholesalePassword = document.getElementById("bossWholesalePass")?.value.trim();
  if (!adminUsername || !adminPassword || !wholesalePassword) return mostrarMensaje("Completa todos los accesos internos.");
  accessState.adminCredentials.username = adminUsername;
  accessState.adminCredentials.password = adminPassword;
  accessState.wholesaleCredentials.password = wholesalePassword;
  syncAccessState(accessState);
  builderHooks.persistAll();
  mostrarMensaje("Credenciales internas guardadas.");
}

function bossVerificationStillValid() {
  if (!accessState.bossCredentials.verifiedAt || !accessState.bossCredentials.verifiedEmail) return false;
  const diff = Date.now() - new Date(accessState.bossCredentials.verifiedAt).getTime();
  return diff < 1000 * 60 * 15;
}

async function enviarVerificacionBoss() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede verificar este correo.");
  const email = document.getElementById("bossGmail")?.value.trim();
  if (!email || !/@gmail\.com$/i.test(email)) return mostrarMensaje("Debes usar un correo Gmail valido.");
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
    }
  });
  if (error) {
    console.error(error);
    return mostrarMensaje("No se pudo enviar el codigo. Revisa que Email Auth este activo en Supabase.");
  }
  accessState.bossCredentials.gmail = email;
  builderHooks.persistAll();
  mostrarMensaje("Codigo enviado al Gmail configurado.");
}

async function verificarCodigoBoss() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede verificar este correo.");
  const email = document.getElementById("bossGmail")?.value.trim();
  const token = document.getElementById("bossOtpCode")?.value.trim();
  if (!email || !token) return mostrarMensaje("Completa Gmail y codigo.");
  const { error } = await supabaseClient.auth.verifyOtp({
    email,
    token,
    type: "email"
  });
  if (error) {
    console.error(error);
    return mostrarMensaje("No se pudo verificar el codigo.");
  }
  accessState.bossCredentials.gmail = email;
  accessState.bossCredentials.verifiedEmail = email;
  accessState.bossCredentials.verifiedAt = new Date().toISOString();
  builderHooks.persistAll();
  mostrarMensaje("Correo verificado. Ahora puedes guardar la cuenta boss.");
}

function mostrarEstadoVerificacionBoss() {
  if (bossVerificationStillValid()) {
    mostrarMensaje(`Correo verificado: ${accessState.bossCredentials.verifiedEmail}`);
    return;
  }
  mostrarMensaje("No hay una verificacion activa o ya vencio.");
}

function guardarCuentaBoss() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede cambiar esta cuenta.");
  if (!bossVerificationStillValid()) return mostrarMensaje("Primero verifica el correo Gmail del boss.");
  const username = document.getElementById("bossUsernameField")?.value.trim();
  const password = document.getElementById("bossPasswordField")?.value.trim();
  const gmail = document.getElementById("bossGmail")?.value.trim();
  if (!username || !password || !gmail) return mostrarMensaje("Completa usuario, contrasena y Gmail.");
  accessState.bossCredentials.username = username;
  accessState.bossCredentials.password = password;
  accessState.bossCredentials.gmail = gmail;
  syncAccessState(accessState);
  builderHooks.persistAll();
  if (usuarioActual?.syntheticBoss) {
    setUsuarioActualData({
      ...usuarioActual,
      username,
      password,
      role: "boss"
    });
    actualizarUsuarioUI();
  }
  mostrarMensaje("Cuenta boss actualizada.");
}

function editarCajaPortada(index) {
  const card = siteSettings.heroCards[index];
  if (!card) return;
  card.eyebrow = prompt("Etiqueta superior:", card.eyebrow || "") ?? card.eyebrow;
  card.title = prompt("Titulo:", card.title || "") ?? card.title;
  card.description = prompt("Descripcion:", card.description || "") ?? card.description;
  builderHooks.syncSettings(siteSettings);
  builderHooks.persistAll();
}

function cambiarLogoEmpresa() {
  if (!canUseBuilder()) return;
  builderHooks.openPageSettings?.();
}

function abrirAjustesPaginaBuilder() {
  if (!canUseBuilder()) return;
  builderHooks.openPageSettings?.();
}

function abrirPortadaBuilder(index = 0) {
  if (!canUseBuilder()) return;
  builderHooks.openHeroEditor?.(index);
}

function abrirSliderBuilder() {
  if (!canUseBuilder()) return;
  builderHooks.openSliderEditor?.();
}

function setupEvents() {
  document.getElementById("menuToggle")?.addEventListener("click", () => document.getElementById("menuMobile").classList.toggle("hidden"));
  document.getElementById("userAvatar")?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("perfilMenu").classList.toggle("hidden");
  });
  document.getElementById("imgPrev")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setImagenModalIndex(indiceImagenActual - 1);
  });
  document.getElementById("imgNext")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setImagenModalIndex(indiceImagenActual + 1);
  });
  document.getElementById("imgPreview")?.addEventListener("animationend", (e) => {
    e.currentTarget.classList.remove("is-swapping");
  });
  document.getElementById("imgModalClose")?.addEventListener("click", () => closeModal("imgModal"));
  document.getElementById("imgMoreBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (imagenesProducto.length <= 1) return;
    setImagenModalIndex(indiceImagenActual + 1);
  });
  window.addEventListener("click", (e) => {
    document.querySelectorAll(".modal").forEach((modal) => {
      if (e.target === modal) closeModal(modal.id);
    });
    const menu = document.getElementById("perfilMenu");
    const avatar = document.getElementById("userAvatar");
    if (menu && avatar && !menu.contains(e.target) && e.target !== avatar) menu.classList.add("hidden");

    const searchWrap = document.getElementById("searchWrap");
    const searchInput = document.getElementById("buscadorGlobal");
    if (window.innerWidth <= 760 && searchWrap && searchInput && !searchWrap.contains(e.target) && !searchInput.value.trim()) {
      searchWrap.classList.remove("is-open");
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      document.getElementById("searchWrap")?.classList.remove("is-open");
    } else if (document.getElementById("buscadorGlobal")?.value.trim()) {
      document.getElementById("searchWrap")?.classList.add("is-open");
    }
    builderHooks.refreshFeatured();
  });
  bindCustomFileInput("regFoto", "regFotoTrigger", "regFotoName", "Opcional");
  bindCustomFileInput("perfilFoto", "perfilFotoTrigger", "perfilFotoName", "Sin cambios");
}

window.builderHooks = builderHooks;
window.siteSettings = siteSettings;
window.accessState = accessState;

window.addEventListener("load", async () => {
  setupEvents();
  catalogos = normalizarCatalogos(catalogos);
  await cargarDesdeSupabase();
  await cargarSlidesSupabase();

  if (usuarioActual) {
    applyRoleToCurrentUser();
    await mergeGuestCartIntoUser();
    await cargarCarritoUsuario();
    await cargarFavoritos();
  } else {
    carrito = getStoredGuestCart();
  }

  actualizarUsuarioUI();
  actualizarContadorCarrito();
  actualizarSliderAdmin();
  actualizarAdminPanel();
  applySiteAppearance();
  renderBranding();
  renderHero();
  render();
  renderSlider();

  try {
    supabaseClient.channel("usuarios_changes").on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "usuarios"
    }, (payload) => {
      const assignment = accessState.roleAssignments.find((item) =>
        String(item.userId ?? "") === String(payload.new.id) ||
        item.username?.trim().toLowerCase() === String(payload.old?.username || "").trim().toLowerCase()
      );
      if (assignment && assignment.username !== payload.new.username) {
        assignment.userId = payload.new.id;
        assignment.username = payload.new.username;
        syncAccessState(accessState);
        builderHooks.persistAll();
      }
      if (usuarioActual && !usuarioActual.syntheticBoss && payload.new.id === usuarioActual.id) {
        usuarioActual = { ...payload.new, role: getAssignedRole(payload.new) };
        localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
        actualizarUsuarioUI();
      }
    }).subscribe();
  } catch (error) {
    console.error("Realtime usuarios error:", error);
  }
});
