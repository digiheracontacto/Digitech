/*
  QUE HACE:
  Script principal de la tienda, login, carrito, roles, multi-tenant, apariencia y rendimiento.

  POR QUE SE HIZO:
  Reemplaza credenciales en texto plano, prepara la app para multiples clientes y deja el
  frontend listo para que builder, catalogos y dominio funcionen sobre una misma base reusable.

  COMO MODIFICARLO:
  - Multi-cliente y dominio: tenant-config.js
  - Estilos globales y variables: style.css
  - Constructor visual: builder.js

  PROTECCION / OFUSCACION:
  - Para produccion puedes minificar con esbuild, Vite o Terser.
  - Si quieres endurecer lectura del JS puedes pasar el bundle final por javascript-obfuscator.
  - NO se pueden ocultar por completo el HTML renderizado, los assets publicos, las llamadas de red
    o cualquier dato que el navegador necesite para ejecutar la pagina.
*/

/* QUE HACE: Fuentes base disponibles en todo el builder.
   POR QUE SE HIZO: Permite reusar el mismo catalogo de fuentes en toda la pagina.
   COMO MODIFICARLO: Agrega mas fuentes aqui o desde builder con custom fonts. */
const BUILTIN_FONT_OPTIONS = [
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

/* QUE HACE: Resuelve automaticamente el tenant activo por dominio.
   POR QUE SE HIZO: Asi el mismo codigo sirve a varios clientes con bases separadas.
   COMO MODIFICARLO: Edita tenant-config.js y agrega dominios nuevos por cliente. */
function resolveActiveTenantConfig() {
  const runtime = window.APP_RUNTIME_CONFIG || { tenants: [] };
  const host = (window.location.hostname || "").toLowerCase();
  const normalizedTenants = Array.isArray(runtime.tenants) ? runtime.tenants : [];
  const exactMatch = normalizedTenants.find((tenant) =>
    (tenant.domains || []).some((domain) => String(domain || "").toLowerCase() === host)
  );
  if (exactMatch) return exactMatch;
  return normalizedTenants.find((tenant) => tenant.id === runtime.fallbackTenantId) || normalizedTenants[0] || {
    id: "local-demo",
    clientName: "Demo",
    database: { provider: "disabled", tableNames: {} },
    storage: { productBucket: "productos", profileBucket: "perfil", slideBucket: "slides" },
    commerce: { whatsappNumber: "18298483964" },
    security: {
      adminUsername: "admin",
      adminPasswordHash: "",
      wholesalePasswordHash: "",
      bossUsername: "boss@2000",
      bossPasswordHash: "",
      bossGmail: "",
      allowClientSideAdminFallback: true
    },
    performance: {
      useCloudflareImageResizing: false,
      cloudflareImageBasePath: "/cdn-cgi/image",
      defaultImageQuality: 82
    }
  };
}

const activeTenantConfig = resolveActiveTenantConfig();
const TABLES = {
  catalogos: activeTenantConfig.database?.tableNames?.catalogos || "catalogos",
  slides: activeTenantConfig.database?.tableNames?.slides || "slides",
  builder: activeTenantConfig.database?.tableNames?.builder || "builder_content",
  usuarios: activeTenantConfig.database?.tableNames?.usuarios || "usuarios",
  carrito: activeTenantConfig.database?.tableNames?.carrito || "carrito",
  favoritos: activeTenantConfig.database?.tableNames?.favoritos || "favoritos",
  pedidos: activeTenantConfig.database?.tableNames?.pedidos || "pedidos"
};
const STORAGE_BUCKETS = {
  productos: activeTenantConfig.storage?.productBucket || "productos",
  perfil: activeTenantConfig.storage?.profileBucket || "perfil",
  slides: activeTenantConfig.storage?.slideBucket || "slides"
};
const WHATSAPP_NUMBER = activeTenantConfig.commerce?.whatsappNumber || "18298483964";

window.activeTenantConfig = activeTenantConfig;
window.APP_TABLES = TABLES;
window.APP_STORAGE_BUCKETS = STORAGE_BUCKETS;
window.DEFAULT_FONT_OPTIONS = BUILTIN_FONT_OPTIONS;

/* QUE HACE: Crea un cliente safe para que la app no explote si falta Supabase.
   POR QUE SE HIZO: Mantiene la pagina usable en entornos de maqueta o cuando la config aun no existe.
   COMO MODIFICARLO: Si siempre trabajaras con Supabase configurado, puedes simplificar este fallback. */
function createMockSupabaseClient() {
  function createBuilder(defaultData = []) {
    return {
      _result: { data: defaultData, error: null },
      select() { return this; },
      insert() { this._result = { data: [], error: null }; return this; },
      update() { this._result = { data: [], error: null }; return this; },
      delete() { this._result = { data: [], error: null }; return this; },
      upsert() { this._result = { data: [], error: null }; return this; },
      eq() { return this; },
      order() { return this; },
      limit() { return this; },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      single() { return Promise.resolve({ data: null, error: null }); },
      then(resolve, reject) { return Promise.resolve(this._result).then(resolve, reject); }
    };
  }

  return {
    from() { return createBuilder([]); },
    storage: {
      from() {
        return {
          async upload() {
            return { error: new Error("Storage no configurado para este tenant.") };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: path } };
          }
        };
      }
    },
    auth: {
      async signInWithOtp() { return { error: new Error("Auth OTP no disponible sin Supabase real.") }; },
      async verifyOtp() { return { error: new Error("Auth OTP no disponible sin Supabase real.") }; }
    },
    channel() {
      return {
        on() { return this; },
        subscribe() { return this; }
      };
    }
  };
}

function createSupabaseClientOrFallback() {
  const provider = activeTenantConfig.database?.provider || "disabled";
  if (provider !== "supabase") return createMockSupabaseClient();
  const supabaseUrl = activeTenantConfig.database?.supabaseUrl;
  const supabaseAnonKey = activeTenantConfig.database?.supabaseAnonKey;
  if (!window.supabase || !supabaseUrl || !supabaseAnonKey) return createMockSupabaseClient();
  return window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}

const supabaseClient = createSupabaseClientOrFallback();
window.supabaseClient = supabaseClient;

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

/* QUE HACE: Presets visuales limitados para usuarios registrados.
   POR QUE SE HIZO: Permiten que cada usuario personalice la vista sin romper legibilidad ni el diseno base.
   COMO MODIFICARLO: Puedes editar estos paquetes desde el builder en la nueva seccion Pantalla. */
function getDefaultUserThemePresets() {
  return [
    { id: "fem_rosa_nube", group: "femenino", label: "Rosa Nube", pageBackgroundColor1: "#fff7fb", pageBackgroundColor2: "#fde7f3", pageBackgroundColor3: "#f8d8eb", pageTextColor: "#4a3041", pageMutedTextColor: "#7a5d6a", panelBackgroundColor1: "#ffffff", panelBackgroundColor2: "#fff3f8", panelTextColor: "#412634", panelMutedTextColor: "#735664", panelBorderColor: "#f0c9dc", productBorderColor: "#f0c9dc", productShadowColor: "#d49bb8", productHoverShadowColor: "#eab0cc", productGalleryBorderColor: "#f0c9dc" },
    { id: "fem_lila_seda", group: "femenino", label: "Lila Seda", pageBackgroundColor1: "#fbf8ff", pageBackgroundColor2: "#efe6ff", pageBackgroundColor3: "#e5d8ff", pageTextColor: "#43385e", pageMutedTextColor: "#6d618b", panelBackgroundColor1: "#ffffff", panelBackgroundColor2: "#f5efff", panelTextColor: "#392d54", panelMutedTextColor: "#665b84", panelBorderColor: "#dcccff", productBorderColor: "#dcccff", productShadowColor: "#c6b0f1", productHoverShadowColor: "#d6c2ff", productGalleryBorderColor: "#dcccff" },
    { id: "fem_coral_suave", group: "femenino", label: "Coral Suave", pageBackgroundColor1: "#fff8f5", pageBackgroundColor2: "#ffe7df", pageBackgroundColor3: "#ffd7cb", pageTextColor: "#5a3a34", pageMutedTextColor: "#8c6760", panelBackgroundColor1: "#fffdfc", panelBackgroundColor2: "#fff1eb", panelTextColor: "#50322d", panelMutedTextColor: "#7b5952", panelBorderColor: "#f2cdc2", productBorderColor: "#f2cdc2", productShadowColor: "#ddb2a7", productHoverShadowColor: "#f0c3b6", productGalleryBorderColor: "#f2cdc2" },
    { id: "fem_mint_blush", group: "femenino", label: "Mint Blush", pageBackgroundColor1: "#f8fffc", pageBackgroundColor2: "#e5fff7", pageBackgroundColor3: "#d7f8ef", pageTextColor: "#315047", pageMutedTextColor: "#5d7d75", panelBackgroundColor1: "#ffffff", panelBackgroundColor2: "#eefcf7", panelTextColor: "#29453e", panelMutedTextColor: "#54736b", panelBorderColor: "#ccebe1", productBorderColor: "#ccebe1", productShadowColor: "#9ecfc1", productHoverShadowColor: "#b9e4d7", productGalleryBorderColor: "#ccebe1" },
    { id: "fem_arena_rosada", group: "femenino", label: "Arena Rosada", pageBackgroundColor1: "#fffaf8", pageBackgroundColor2: "#f8eee9", pageBackgroundColor3: "#efe1d9", pageTextColor: "#5a473f", pageMutedTextColor: "#887269", panelBackgroundColor1: "#fffefc", panelBackgroundColor2: "#f6efe9", panelTextColor: "#4b3b34", panelMutedTextColor: "#79635b", panelBorderColor: "#e7d6cc", productBorderColor: "#e7d6cc", productShadowColor: "#d6c0b2", productHoverShadowColor: "#e5d1c5", productGalleryBorderColor: "#e7d6cc" },
    { id: "mas_grafito_azul", group: "masculino", label: "Grafito Azul", pageBackgroundColor1: "#eef4fb", pageBackgroundColor2: "#dce6f4", pageBackgroundColor3: "#cfd9ea", pageTextColor: "#24384c", pageMutedTextColor: "#556a7f", panelBackgroundColor1: "#fdfefe", panelBackgroundColor2: "#edf3f9", panelTextColor: "#203344", panelMutedTextColor: "#4e6274", panelBorderColor: "#c9d6e4", productBorderColor: "#c9d6e4", productShadowColor: "#9eb0c5", productHoverShadowColor: "#b7c9dc", productGalleryBorderColor: "#c9d6e4" },
    { id: "mas_oliva_niebla", group: "masculino", label: "Oliva Niebla", pageBackgroundColor1: "#f8fbf4", pageBackgroundColor2: "#ebf1e2", pageBackgroundColor3: "#dde7cf", pageTextColor: "#364433", pageMutedTextColor: "#687665", panelBackgroundColor1: "#fcfdf9", panelBackgroundColor2: "#eef4e5", panelTextColor: "#2f3d2d", panelMutedTextColor: "#5d6c5a", panelBorderColor: "#d1ddc1", productBorderColor: "#d1ddc1", productShadowColor: "#b2c39e", productHoverShadowColor: "#c5d7b1", productGalleryBorderColor: "#d1ddc1" },
    { id: "mas_tierra_cafe", group: "masculino", label: "Tierra Cafe", pageBackgroundColor1: "#fbf8f4", pageBackgroundColor2: "#efe7de", pageBackgroundColor3: "#e2d4c6", pageTextColor: "#493b31", pageMutedTextColor: "#77685e", panelBackgroundColor1: "#fffdfa", panelBackgroundColor2: "#f5ede5", panelTextColor: "#403229", panelMutedTextColor: "#6d5d53", panelBorderColor: "#dbcbbd", productBorderColor: "#dbcbbd", productShadowColor: "#c3b09f", productHoverShadowColor: "#d4c1b1", productGalleryBorderColor: "#dbcbbd" },
    { id: "mas_acero_claro", group: "masculino", label: "Acero Claro", pageBackgroundColor1: "#f7fafc", pageBackgroundColor2: "#e7edf3", pageBackgroundColor3: "#d6e0ea", pageTextColor: "#33414f", pageMutedTextColor: "#657381", panelBackgroundColor1: "#ffffff", panelBackgroundColor2: "#eef3f7", panelTextColor: "#2e3b48", panelMutedTextColor: "#5e6b78", panelBorderColor: "#d4dde5", productBorderColor: "#d4dde5", productShadowColor: "#b7c2cc", productHoverShadowColor: "#cad4dd", productGalleryBorderColor: "#d4dde5" },
    { id: "mas_verde_mar", group: "masculino", label: "Verde Mar", pageBackgroundColor1: "#f4fcfb", pageBackgroundColor2: "#ddf3ef", pageBackgroundColor3: "#cae8e0", pageTextColor: "#244643", pageMutedTextColor: "#557471", panelBackgroundColor1: "#fcfffe", panelBackgroundColor2: "#e9f8f4", panelTextColor: "#1f3e3b", panelMutedTextColor: "#4e6967", panelBorderColor: "#c6e1db", productBorderColor: "#c6e1db", productShadowColor: "#9fc9bf", productHoverShadowColor: "#b5ddd4", productGalleryBorderColor: "#c6e1db" },
    { id: "tema_claro", group: "personalizado", label: "Claro Minimal", pageBackgroundColor1: "#ffffff", pageBackgroundColor2: "#f8fafc", pageBackgroundColor3: "#edf2f7", pageTextColor: "#111827", pageMutedTextColor: "#475569", panelBackgroundColor1: "#ffffff", panelBackgroundColor2: "#f8fafc", panelTextColor: "#111827", panelMutedTextColor: "#475569", panelBorderColor: "#dbe4ee", productBorderColor: "#dbe4ee", productShadowColor: "#cbd5e1", productHoverShadowColor: "#dbeafe", productGalleryBorderColor: "#dbe4ee" },
    { id: "tema_oscuro", group: "personalizado", label: "Oscuro Minimal", pageBackgroundColor1: "#111827", pageBackgroundColor2: "#1f2937", pageBackgroundColor3: "#374151", pageTextColor: "#f9fafb", pageMutedTextColor: "#cbd5e1", panelBackgroundColor1: "#0f172a", panelBackgroundColor2: "#1e293b", panelTextColor: "#f8fafc", panelMutedTextColor: "#cbd5e1", panelBorderColor: "#334155", productBorderColor: "#334155", productShadowColor: "#0f172a", productHoverShadowColor: "#475569", productGalleryBorderColor: "#334155" },
    { id: "tema_rojo", group: "personalizado", label: "Rojo Minimal", pageBackgroundColor1: "#fff5f5", pageBackgroundColor2: "#ffe3e3", pageBackgroundColor3: "#fecaca", pageTextColor: "#4c1d1d", pageMutedTextColor: "#7f1d1d", panelBackgroundColor1: "#fffefe", panelBackgroundColor2: "#fff1f2", panelTextColor: "#3f1111", panelMutedTextColor: "#7a2e2e", panelBorderColor: "#f5b4b9", productBorderColor: "#f5b4b9", productShadowColor: "#e8949d", productHoverShadowColor: "#f2a7b0", productGalleryBorderColor: "#f5b4b9" }
  ];
}

function normalizeUserThemePreset(preset = {}) {
  return {
    id: String(preset.id || `theme_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
    group: String(preset.group || "femenino"),
    label: String(preset.label || "Tema visual"),
    pageBackgroundColor1: String(preset.pageBackgroundColor1 || "#f7fafc"),
    pageBackgroundColor2: String(preset.pageBackgroundColor2 || "#e2e8f0"),
    pageBackgroundColor3: String(preset.pageBackgroundColor3 || "#cbd5e1"),
    pageTextColor: String(preset.pageTextColor || "#334155"),
    pageMutedTextColor: String(preset.pageMutedTextColor || "#64748b"),
    panelBackgroundColor1: String(preset.panelBackgroundColor1 || "#ffffff"),
    panelBackgroundColor2: String(preset.panelBackgroundColor2 || "#f8fafc"),
    panelTextColor: String(preset.panelTextColor || "#0f172a"),
    panelMutedTextColor: String(preset.panelMutedTextColor || "#475569"),
    panelBorderColor: String(preset.panelBorderColor || "#dbe4ee"),
    productBorderColor: String(preset.productBorderColor || preset.panelBorderColor || "#dbe4ee"),
    productShadowColor: String(preset.productShadowColor || "#cbd5e1"),
    productHoverShadowColor: String(preset.productHoverShadowColor || preset.productBorderColor || "#dbe4ee"),
    productGalleryBorderColor: String(preset.productGalleryBorderColor || preset.panelBorderColor || "#dbe4ee")
  };
}

function normalizeUserThemePresets(presets = []) {
  const basePresets = getDefaultUserThemePresets();
  const source = Array.isArray(presets) && presets.length ? presets : basePresets;
  const merged = [...source];
  basePresets.forEach((basePreset) => {
    if (!merged.some((item) => String(item?.id || "") === String(basePreset.id))) {
      merged.push(basePreset);
    }
  });
  return merged.map(normalizeUserThemePreset);
}

/* QUE HACE: Expone utilidades de presets para que builder.js pueda reutilizarlas sin duplicar logica.
   POR QUE SE HIZO: Mantiene una sola normalizacion para los temas visuales de usuario.
   COMO MODIFICARLO: Si cambias la estructura del preset, actualiza primero estas funciones base. */
window.getDefaultUserThemePresets = getDefaultUserThemePresets;
window.normalizeUserThemePresets = normalizeUserThemePresets;

/* QUE HACE: Valores por defecto del sitio para builder, productos y apariencia.
   POR QUE SE HIZO: Permite restaurar el sistema y venderlo como plantilla configurable.
   COMO MODIFICARLO: Cambia defaults aqui si quieres que todo cliente nuevo arranque distinto. */
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
  customFonts: [],
  pageBackgroundEnabled: true,
  pageBackgroundType: "linear",
  pageBackgroundPosition: "180deg",
  pageBackgroundColor1: "#030815",
  pageBackgroundColor2: "#07111f",
  pageBackgroundColor3: "#081425",
  pageBackgroundOpacity: 1,
  pageBackgroundImage: "",
  pageBackgroundImageFit: "cover",
  pageBackgroundImageRepeat: "no-repeat",
  pageBackgroundImageAttachment: "scroll",
  pageBackgroundImagePosition: "center center",
  pageBackgroundImageOpacity: 1,
  pageBackgroundImageBrightness: 1,
  pageBackgroundOverlayOpacity: 0.32,
  pageActionButtonBackgroundType: "linear",
  pageActionButtonBackgroundPosition: "135deg",
  pageActionButtonBackgroundColor1: "#22d3ee",
  pageActionButtonBackgroundColor2: "#2563eb",
  pageActionButtonBackgroundColor3: "",
  pageActionButtonBackgroundOpacity: 1,
  pageActionButtonTextColor: "#f8fbff",
  pageActionButtonBorderColor: "#22d3ee",
  pageActionButtonFontFamily: "Manrope",
  pageActionButtonFontCustom: "",
  pageActionButtonSize: 14,
  pageActionButtonRadius: 14,
  pageActionButtonPaddingY: 12,
  pageActionButtonPaddingX: 16,
  pageActionButtonShadowEnabled: true,
  pageActionButtonShadowColor: "#020817",
  pageActionButtonShadowOpacity: 0.28,
  pageActionButtonHoverBackgroundType: "linear",
  pageActionButtonHoverBackgroundPosition: "135deg",
  pageActionButtonHoverBackgroundColor1: "#38bdf8",
  pageActionButtonHoverBackgroundColor2: "#1d4ed8",
  pageActionButtonHoverBackgroundColor3: "",
  pageActionButtonHoverBackgroundOpacity: 1,
  pageActionButtonHoverTextColor: "#f8fbff",
  pageActionButtonHoverBorderColor: "#7dd3fc",
  pageActionButtonHoverShadowColor: "#38bdf8",
  pageActionButtonHoverShadowOpacity: 0.24,
  pageActionButtonHoverLift: 1,
  pageActionButtonHoverDuration: 0.2,
  headerBackgroundEnabled: true,
  headerBackgroundType: "linear",
  headerBackgroundPosition: "135deg",
  headerBackgroundColor1: "#040915",
  headerBackgroundColor2: "#081121",
  headerBackgroundColor3: "#0c1830",
  headerBackgroundOpacity: 0.94,
  headerBorderColor: "#bfdbfe",
  headerBackdropBlur: 18,
  headerButtonBackground: "#0f172a",
  headerButtonBackgroundOpacity: 0.88,
  headerButtonTextColor: "#f8fbff",
  headerButtonBorderColor: "#bfdbfe",
  headerButtonFontFamily: "Manrope",
  headerButtonFontCustom: "",
  headerButtonSize: 14,
  headerButtonRadius: 14,
  headerButtonPaddingY: 10,
  headerButtonPaddingX: 14,
  headerButtonShadowEnabled: false,
  headerButtonShadowColor: "#020817",
  headerButtonShadowOpacity: 0.18,
  headerButtonHoverBackground: "#2563eb",
  headerButtonHoverBackgroundOpacity: 0.34,
  headerButtonHoverTextColor: "#f8fbff",
  headerButtonHoverBorderColor: "#7dd3fc",
  headerButtonHoverLift: 1,
  headerButtonHoverDuration: 0.2,
  headerButtonHoverShadowColor: "#38bdf8",
  headerButtonHoverShadowOpacity: 0.18,
  searchInputPlaceholderText: "Buscar productos, marcas o categorias",
  searchInputBackgroundType: "linear",
  searchInputBackgroundPosition: "135deg",
  searchInputBackgroundColor1: "#ffffff",
  searchInputBackgroundColor2: "#ffffff",
  searchInputBackgroundColor3: "",
  searchInputBackgroundOpacity: 1,
  searchInputTextColor: "#08111f",
  searchInputPlaceholderColor: "#64748b",
  searchInputBorderColor: "#bfdbfe",
  searchInputFocusBorderColor: "#38bdf8",
  searchInputFontFamily: "Manrope",
  searchInputFontCustom: "",
  searchInputSize: 14,
  searchInputRadius: 14,
  searchInputPaddingY: 12,
  searchInputPaddingX: 14,
  searchInputShadowEnabled: false,
  searchInputShadowColor: "#020817",
  searchInputShadowOpacity: 0.16,
  cartButtonEmoji: "🛒",
  cartButtonBackgroundType: "linear",
  cartButtonBackgroundPosition: "135deg",
  cartButtonBackgroundColor1: "#0f172a",
  cartButtonBackgroundColor2: "#0f172a",
  cartButtonBackgroundColor3: "",
  cartButtonBackgroundOpacity: 0.88,
  cartButtonTextColor: "#f8fbff",
  cartButtonBorderColor: "#bfdbfe",
  cartButtonFontFamily: "Manrope",
  cartButtonFontCustom: "",
  cartButtonSize: 14,
  cartButtonRadius: 14,
  cartButtonPaddingY: 10,
  cartButtonPaddingX: 14,
  cartButtonShadowEnabled: false,
  cartButtonShadowColor: "#020817",
  cartButtonShadowOpacity: 0.18,
  cartButtonHoverBackgroundType: "linear",
  cartButtonHoverBackgroundPosition: "135deg",
  cartButtonHoverBackgroundColor1: "#2563eb",
  cartButtonHoverBackgroundColor2: "#1d4ed8",
  cartButtonHoverBackgroundColor3: "",
  cartButtonHoverBackgroundOpacity: 0.34,
  cartButtonHoverTextColor: "#f8fbff",
  cartButtonHoverBorderColor: "#7dd3fc",
  cartButtonHoverShadowColor: "#38bdf8",
  cartButtonHoverShadowOpacity: 0.18,
  cartButtonHoverLift: 1,
  cartButtonHoverDuration: 0.2,
  profileMenuBackgroundType: "linear",
  profileMenuBackgroundPosition: "180deg",
  profileMenuBackgroundColor1: "#f8fbff",
  profileMenuBackgroundColor2: "#eef4fb",
  profileMenuBackgroundColor3: "",
  profileMenuBackgroundOpacity: 1,
  profileMenuTextColor: "#0f172a",
  profileMenuBorderColor: "#dbe4ee",
  profileMenuRadius: 18,
  profileMenuShadowEnabled: true,
  profileMenuShadowColor: "#020817",
  profileMenuShadowOpacity: 0.24,
  profileMenuButtonBackgroundType: "linear",
  profileMenuButtonBackgroundPosition: "180deg",
  profileMenuButtonBackgroundColor1: "#ffffff",
  profileMenuButtonBackgroundColor2: "#ffffff",
  profileMenuButtonBackgroundColor3: "",
  profileMenuButtonBackgroundOpacity: 0,
  profileMenuButtonTextColor: "#0f172a",
  profileMenuButtonFontFamily: "Manrope",
  profileMenuButtonFontCustom: "",
  profileMenuButtonSize: 14,
  profileMenuButtonRadius: 12,
  profileMenuButtonPaddingY: 10,
  profileMenuButtonPaddingX: 12,
  profileMenuButtonHoverBackgroundType: "linear",
  profileMenuButtonHoverBackgroundPosition: "135deg",
  profileMenuButtonHoverBackgroundColor1: "#dbeafe",
  profileMenuButtonHoverBackgroundColor2: "#bfdbfe",
  profileMenuButtonHoverBackgroundColor3: "",
  profileMenuButtonHoverBackgroundOpacity: 1,
  profileMenuButtonHoverTextColor: "#0f172a",
  catalogButtonBackground: "#ffffff",
  catalogButtonBackgroundOpacity: 0.08,
  catalogButtonTextColor: "#f8fbff",
  catalogButtonBorderColor: "#bfdbfe",
  catalogButtonFontFamily: "Manrope",
  catalogButtonFontCustom: "",
  catalogButtonSize: 14,
  catalogButtonRadius: 999,
  catalogButtonPaddingY: 10,
  catalogButtonPaddingX: 14,
  catalogButtonShadowEnabled: false,
  catalogButtonShadowColor: "#020817",
  catalogButtonShadowOpacity: 0.16,
  catalogButtonHoverBackground: "#22d3ee",
  catalogButtonHoverBackgroundOpacity: 0.16,
  catalogButtonHoverTextColor: "#f8fbff",
  catalogButtonHoverBorderColor: "#7dd3fc",
  productCardBackgroundType: "linear",
  productCardBackgroundPosition: "180deg",
  productCardBackgroundColor1: "#ffffff",
  productCardBackgroundColor2: "#ffffff",
  productCardBackgroundColor3: "",
  productCardBackgroundOpacity: 0.09,
  productBorderColor: "#bfdbfe",
  productTitleColor: "#f8fbff",
  productDescriptionColor: "#d5e2ef",
  productTitleFontFamily: "Manrope",
  productTitleFontCustom: "",
  productTitleSize: 18,
  productDescriptionFontFamily: "Manrope",
  productDescriptionFontCustom: "",
  productDescriptionSize: 14,
  productShadowColor: "#020817",
  productShadowOpacity: 0.42,
  productHoverShadowColor: "#38bdf8",
  productHoverShadowOpacity: 0.25,
  productHoverLift: 6,
  productHoverScale: 1.01,
  productHoverDuration: 0.28,
  productButtonBackground: "#2563eb",
  productButtonBackgroundOpacity: 0.28,
  productButtonTextColor: "#f8fbff",
  productButtonBorderColor: "#bfdbfe",
  productButtonRadius: 14,
  productButtonFontFamily: "Manrope",
  productButtonFontCustom: "",
  productButtonSize: 14,
  productButtonShadowEnabled: false,
  productButtonShadowColor: "#020817",
  productButtonShadowOpacity: 0.18,
  productButtonHoverBackground: "#22d3ee",
  productButtonHoverBackgroundOpacity: 0.22,
  productButtonHoverTextColor: "#f8fbff",
  productButtonHoverBorderColor: "#7dd3fc",
  productPriceColor: "#7dd3fc",
  productPriceFontFamily: "Manrope",
  productPriceFontCustom: "",
  productPriceSize: 22,
  productPriceMobileSize: 15,
  productOldPriceColor: "#94a3b8",
  productOfferColor: "#fdba74",
  productOfferFontFamily: "Manrope",
  productOfferFontCustom: "",
  productOfferSize: 14,
  productImageHintText: "Toca o haz click para ampliar y ver mas",
  orderWhatsappMessageTemplate: "Hola, quiero hacer este pedido:",
  deliveryQuestionText: "Este pedido es para envio directo?",
  deliveryLocationLabel: "Ubicacion para envio",
  productVideoButtonText: "Ver video",
  productDefaultSaleUnitLabel: "",
  wholesaleBadgeEmoji: "\u{1F4E6}",
  pageFaviconImage: "",
  pagePublicUrl: "",
  pageSeoKeywords: "",
  pageSeoDescription: "Catalogo visual profesional, optimizado y preparado para multiples clientes.",
  productImageHintBackground: "#020817",
  productImageHintBackgroundOpacity: 0.72,
  productImageHintTextColor: "#ffffff",
  productImageHintBorderColor: "#ffffff",
  productImageHintBorderOpacity: 0,
  productImageHintFontFamily: "Manrope",
  productImageHintFontCustom: "",
  productImageHintSize: 11,
  productImageHintRadius: 999,
  productImageHintShadowEnabled: false,
  productImageHintShadowColor: "#020817",
  productImageHintShadowOpacity: 0.18,
  productStateAvailableText: "Disponible",
  productStateUnavailableText: "No disponible",
  productStateTextColor: "#ffffff",
  productStateFontFamily: "Manrope",
  productStateFontCustom: "",
  productStateSize: 12,
  productStateRadius: 999,
  productStateVisibilityMode: "always",
  productStateAvailableBackground: "#22c55e",
  productStateAvailableOpacity: 0.94,
  productStateUnavailableBackground: "#ef4444",
  productStateUnavailableOpacity: 0.94,
  productGalleryShowFrame: true,
  productGalleryBackgroundType: "linear",
  productGalleryBackgroundPosition: "180deg",
  productGalleryBackgroundColor1: "#f8fafc",
  productGalleryBackgroundColor2: "#edf4fb",
  productGalleryBackgroundColor3: "",
  productGalleryBackgroundOpacity: 0.98,
  productGalleryTextColor: "#0f172a",
  productGalleryBorderColor: "#dbe4ee",
  productGalleryRadius: 24,
  productGalleryShadowEnabled: true,
  productGalleryShadowColor: "#020817",
  productGalleryShadowOpacity: 0.32,
  productGalleryBackgroundImage: "",
  productGalleryBackgroundImageOpacity: 0.24,
  productGalleryFitMode: "contain",
  productGalleryFitToImage: false,
  productGalleryArrowsPlacement: "outside",
  productGalleryShowThumbs: true,
  productGalleryThumbLayout: "row",
  productGallerySwapDuration: 0.28,
  productGalleryStylePreset: "soft",
  uiPanelBaseBackgroundColor: "#fbfdff",
  uiPanelBaseBackgroundOpacity: 1,
  uiPanelBackgroundType: "linear",
  uiPanelBackgroundPosition: "180deg",
  uiPanelBackgroundColor1: "#fbfdff",
  uiPanelBackgroundColor2: "#f1f6fb",
  uiPanelBackgroundColor3: "",
  uiPanelBackgroundOpacity: 1,
  uiPanelTextColor: "#0f172a",
  uiPanelMutedTextColor: "#475569",
  uiPanelTitleColor: "#0f172a",
  uiPanelBorderColor: "#dbe4ee",
  uiPanelRadius: 24,
  uiPanelShadowEnabled: true,
  uiPanelShadowColor: "#020817",
  uiPanelShadowOpacity: 0.22,
  uiPanelFontFamily: "Manrope",
  uiPanelFontCustom: "",
  uiPanelButtonBaseBackgroundColor: "#eef4fb",
  uiPanelButtonBaseBackgroundOpacity: 1,
  uiPanelButtonBackgroundType: "linear",
  uiPanelButtonBackgroundPosition: "135deg",
  uiPanelButtonBackgroundColor1: "#eef4fb",
  uiPanelButtonBackgroundColor2: "#dbe7f6",
  uiPanelButtonBackgroundColor3: "",
  uiPanelButtonBackgroundOpacity: 1,
  uiPanelButtonTextColor: "#0f172a",
  uiPanelButtonBorderColor: "#cbd5e1",
  uiPanelButtonFontFamily: "Manrope",
  uiPanelButtonFontCustom: "",
  uiPanelButtonSize: 14,
  uiPanelButtonRadius: 14,
  uiPanelButtonPaddingY: 10,
  uiPanelButtonPaddingX: 12,
  uiPanelButtonShadowEnabled: false,
  uiPanelButtonShadowColor: "#020817",
  uiPanelButtonShadowOpacity: 0.16,
  uiPanelButtonHoverBaseBackgroundColor: "#dbeafe",
  uiPanelButtonHoverBaseBackgroundOpacity: 1,
  uiPanelButtonHoverBackgroundType: "linear",
  uiPanelButtonHoverBackgroundPosition: "135deg",
  uiPanelButtonHoverBackgroundColor1: "#dbeafe",
  uiPanelButtonHoverBackgroundColor2: "#bfdbfe",
  uiPanelButtonHoverBackgroundColor3: "",
  uiPanelButtonHoverBackgroundOpacity: 1,
  uiPanelButtonHoverTextColor: "#0f172a",
  uiPanelButtonHoverBorderColor: "#93c5fd",
  uiPanelButtonHoverLift: 1,
  uiPanelButtonHoverDuration: 0.2,
  userThemeAccessEnabled: true,
  userThemePresets: normalizeUserThemePresets(),
  heroCards: [
    {
      eyebrow: "Tienda y constructor visual",
      title: "Una pagina mas limpia, rapida y preparada para vender mejor.",
      description: "Catalogos, slides, carrito, favoritos, perfil, historial y un builder visual conectado a tu tenant.",
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
        backgroundOpacity: 1,
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

/* QUE HACE: Estado de acceso y credenciales internas ya sin passwords en claro.
   POR QUE SE HIZO: Protege mejor el frontend y permite migrar a backend seguro luego.
   COMO MODIFICARLO: Lo correcto es actualizar hashes y usuarios desde el perfil Boss. */
const defaultAccessState = {
  adminCredentials: {
    username: activeTenantConfig.security?.adminUsername || "admin",
    passwordHash: activeTenantConfig.security?.adminPasswordHash || ""
  },
  wholesaleCredentials: {
    passwordHash: activeTenantConfig.security?.wholesalePasswordHash || ""
  },
  bossCredentials: {
    username: activeTenantConfig.security?.bossUsername || "boss@2000",
    passwordHash: activeTenantConfig.security?.bossPasswordHash || "",
    gmail: activeTenantConfig.security?.bossGmail || "",
    phone: "",
    verifiedPhone: "",
    photo: "",
    verifiedEmail: "",
    verifiedAt: ""
  },
  roleAssignments: [],
  userContactMeta: {},
  roleDisplay: clone(defaultRoleDisplay),
  customRoles: [],
  rolePermissions: {},
  specialSections: {
    hero: { position: "top", sortOrder: 10 },
    slider: { position: "afterSlider", sortOrder: 10, widthMode: "full" }
  }
};

const ROLE_PERMISSION_LABELS = {
  adminAccess: "Entrar modo administrador",
  builder: "Usar Builder",
  retailEdit: "Editar tienda y productos",
  wholesaleEdit: "Editar mayorista",
  wholesaleMode: "Modo venta al por mayor",
  wholesaleCart: "Carrito mayorista",
  wholesalePriceView: "Ver precios mayoristas al entrar",
  wholesaleClients: "Gestionar clientes mayoristas",
  wholesaleCostList: "Lista privada de costos mayoristas",
  wholesaleOrderNotes: "Agregar notas a ventas",
  cashControl: "Control de caja",
  cashViewAll: "Ver cajas de otros usuarios",
  controlCenter: "Centro de Control",
  analytics: "Analitica",
  team: "Gestionar equipo y roles",
  credentials: "Cambiar accesos internos",
  inventoryQuantity: "Ver cantidades de inventario"
};

const defaultRolePermissions = {
  boss: {
    adminAccess: true,
    builder: true,
    retailEdit: true,
    wholesaleEdit: true,
    wholesaleMode: true,
    wholesaleCart: true,
    wholesalePriceView: false,
    wholesaleClients: true,
    wholesaleCostList: true,
    wholesaleOrderNotes: true,
    cashControl: true,
    cashViewAll: true,
    controlCenter: true,
    analytics: true,
    team: true,
    credentials: true,
    inventoryQuantity: true
  },
  administrador: {
    adminAccess: true,
    builder: true,
    retailEdit: true,
    wholesaleEdit: true,
    wholesaleMode: true,
    wholesaleCart: true,
    wholesalePriceView: false,
    wholesaleClients: true,
    wholesaleCostList: false,
    wholesaleOrderNotes: true,
    cashControl: false,
    cashViewAll: false,
    controlCenter: true,
    analytics: true,
    team: false,
    credentials: false,
    inventoryQuantity: true
  },
  vendedor: {
    adminAccess: true,
    builder: false,
    retailEdit: true,
    wholesaleEdit: false,
    wholesaleMode: false,
    wholesaleCart: false,
    wholesalePriceView: false,
    wholesaleClients: false,
    wholesaleCostList: false,
    wholesaleOrderNotes: false,
    cashControl: false,
    cashViewAll: false,
    controlCenter: false,
    analytics: false,
    team: false,
    credentials: false,
    inventoryQuantity: true
  },
  mayorista: {
    adminAccess: true,
    builder: false,
    retailEdit: false,
    wholesaleEdit: true,
    wholesaleMode: true,
    wholesaleCart: true,
    wholesalePriceView: false,
    wholesaleClients: true,
    wholesaleCostList: false,
    wholesaleOrderNotes: true,
    cashControl: false,
    cashViewAll: false,
    controlCenter: false,
    analytics: false,
    team: false,
    credentials: false,
    inventoryQuantity: true
  },
  cliente: {
    adminAccess: false,
    builder: false,
    retailEdit: false,
    wholesaleEdit: false,
    wholesaleMode: false,
    wholesaleCart: false,
    wholesalePriceView: false,
    wholesaleClients: false,
    wholesaleCostList: false,
    wholesaleOrderNotes: false,
    cashControl: false,
    cashViewAll: false,
    controlCenter: false,
    analytics: false,
    team: false,
    credentials: false,
    inventoryQuantity: false
  }
};

defaultAccessState.rolePermissions = clone(defaultRolePermissions);

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
let videoProductoActual = "";
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

/* QUE HACE: Guarda el estado del panel analitico del boss.
   POR QUE SE HIZO: Permite filtrar, refrescar y exportar la misma vista sin recalcular toda la UI manualmente.
   COMO MODIFICARLO: Si luego quieres mas filtros, agregalos aqui y en renderBossAnalyticsPanel. */
let bossAnalyticsState = {
  metric: "pedidos",
  period: "month",
  customDate: "",
  source: null,
  renderedRows: [],
  refreshTimer: null
};

/* QUE HACE: Estado del Centro de Control privado.
   POR QUE SE HIZO: Agrupa dashboard, usuarios, pedidos, inventario, promociones y movimientos
   sin alterar las pantallas existentes ni exigir nuevas tablas para funcionar.
   COMO MODIFICARLO: Si creas tablas dedicadas para actividad o contactos, cambia las funciones
   de lectura/escritura de localStorage por llamadas a tu API o Supabase. */
const ADMIN_LOCAL_KEYS = {
  activity: "adminActivityLog",
  orders: "adminOrderStats",
  contacts: "adminCustomContacts",
  userMeta: "adminUserMeta",
  deletedUsers: "adminDeletedUsers",
  deletedOrders: "adminDeletedOrders",
  wholesaleClients: "adminWholesaleClients",
  wholesaleOrders: "adminWholesaleOrders",
  wholesaleActiveSale: "adminWholesaleActiveSale",
  wholesaleCosts: "adminWholesaleCosts",
  cashMovements: "cashControlMovements",
  cashBuyers: "cashControlBuyers",
  monthlyClosures: "adminMonthlyClosures",
  analyticsClosures: "adminAnalyticsClosures",
  analyticsResetAt: "adminAnalyticsResetAt",
  cameraPermissionAsked: "adminCameraPermissionAsked",
  accountSessions: "accountSessions"
};

const PERFORMANCE_COOKIE_KEY = "digiharaCookieConsent";
const PERFORMANCE_WARMUP_KEY = "digiharaPerformanceWarmup";
const FAST_MODE_KEY = "digiharaFastMode";
const PERFORMANCE_SW_URL = "performance-cache-sw.js";
let performanceWarmupTimer = null;
let performanceWarmupRunning = false;
let performanceMutationObserver = null;

const PHONE_COUNTRY_OPTIONS = [
  ["🇦🇪","AE","+971","Emiratos Arabes Unidos"],["🇩🇪","DE","+49","Alemania"],["🇸🇦","SA","+966","Arabia Saudita"],["🇩🇿","DZ","+213","Argelia"],["🇦🇷","AR","+54","Argentina"],["🇦🇺","AU","+61","Australia"],["🇦🇹","AT","+43","Austria"],["🇧🇩","BD","+880","Banglades"],["🇧🇪","BE","+32","Belgica"],["🇧🇴","BO","+591","Bolivia"],["🇧🇷","BR","+55","Brasil"],["🇨🇦","CA","+1","Canada"],["🇶🇦","QA","+974","Catar"],["🇨🇱","CL","+56","Chile"],["🇨🇳","CN","+86","China"],["🇨🇴","CO","+57","Colombia"],["🇰🇷","KR","+82","Corea del Sur"],["🇨🇷","CR","+506","Costa Rica"],["🇨🇺","CU","+53","Cuba"],["🇩🇰","DK","+45","Dinamarca"],["🇪🇨","EC","+593","Ecuador"],["🇪🇬","EG","+20","Egipto"],["🇸🇻","SV","+503","El Salvador"],["🇪🇸","ES","+34","Espana"],["🇺🇸","US","+1","Estados Unidos"],["🇫🇮","FI","+358","Finlandia"],["🇫🇷","FR","+33","Francia"],["🇬🇭","GH","+233","Ghana"],["🇬🇹","GT","+502","Guatemala"],["🇭🇹","HT","+509","Haiti"],["🇭🇳","HN","+504","Honduras"],["🇮🇳","IN","+91","India"],["🇮🇩","ID","+62","Indonesia"],["🇮🇪","IE","+353","Irlanda"],["🇮🇱","IL","+972","Israel"],["🇮🇹","IT","+39","Italia"],["🇯🇲","JM","+1","Jamaica"],["🇯🇵","JP","+81","Japon"],["🇰🇪","KE","+254","Kenia"],["🇰🇼","KW","+965","Kuwait"],["🇲🇾","MY","+60","Malasia"],["🇲🇦","MA","+212","Marruecos"],["🇲🇽","MX","+52","Mexico"],["🇳🇮","NI","+505","Nicaragua"],["🇳🇬","NG","+234","Nigeria"],["🇳🇴","NO","+47","Noruega"],["🇳🇿","NZ","+64","Nueva Zelanda"],["🇳🇱","NL","+31","Paises Bajos"],["🇵🇰","PK","+92","Pakistan"],["🇵🇦","PA","+507","Panama"],["🇵🇾","PY","+595","Paraguay"],["🇵🇪","PE","+51","Peru"],["🇵🇭","PH","+63","Filipinas"],["🇵🇱","PL","+48","Polonia"],["🇵🇹","PT","+351","Portugal"],["🇵🇷","PR","+1","Puerto Rico"],["🇬🇧","GB","+44","Reino Unido"],["🇩🇴","RD","+1","Republica Dominicana"],["🇷🇴","RO","+40","Rumania"],["🇷🇺","RU","+7","Rusia"],["🇸🇬","SG","+65","Singapur"],["🇿🇦","ZA","+27","Sudafrica"],["🇸🇪","SE","+46","Suecia"],["🇨🇭","CH","+41","Suiza"],["🇹🇭","TH","+66","Tailandia"],["🇹🇷","TR","+90","Turquia"],["🇺🇦","UA","+380","Ucrania"],["🇺🇾","UY","+598","Uruguay"],["🇻🇪","VE","+58","Venezuela"],["🇻🇳","VN","+84","Vietnam"]
].map(([flag, iso, code, name]) => ({ flag, iso, code, name }));

let phoneVerificationState = {
  register: { phone: "", code: "", verified: false },
  profile: { phone: "", code: "", verified: false },
  boss: { phone: "", code: "", verified: false }
};

let adminControlState = {
  tab: "dashboard",
  source: null,
  userSearch: "",
  orderSearch: "",
  orderSort: "newest",
  confirmedPeriod: "month",
  summaryPeriod: "day"
};

let adminEditPanelState = {
  type: "",
  orderId: "",
  productName: ""
};

let appCloudStore = {};
let appCloudHydrating = false;
let appCloudPersistTimer = null;

let wholesaleRuntime = {
  activeClientId: "",
  activeSaleId: ""
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

function getCloudSyncKeys() {
  return new Set(Object.values(ADMIN_LOCAL_KEYS));
}

function shouldSyncCloudKey(key = "") {
  return getCloudSyncKeys().has(key);
}

function scheduleAppCloudPersist() {
  if (appCloudHydrating) return;
  clearTimeout(appCloudPersistTimer);
  appCloudPersistTimer = setTimeout(() => {
    if (window.builderHooks?.persistAll) window.builderHooks.persistAll();
  }, 650);
}

function getAppCloudStore() {
  const nextStore = { ...appCloudStore };
  getCloudSyncKeys().forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(nextStore, key)) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value !== null && value !== undefined) nextStore[key] = value;
      } catch {}
    }
  });
  return nextStore;
}

function hydrateAppCloudStore(remoteStore = {}) {
  appCloudHydrating = true;
  appCloudStore = { ...(remoteStore || {}) };
  getCloudSyncKeys().forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(appCloudStore, key)) {
      localStorage.setItem(key, JSON.stringify(appCloudStore[key]));
    }
  });
  appCloudHydrating = false;
  if (adminControlState.source) {
    adminControlState.source = {
      ...adminControlState.source,
      localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []),
      wholesaleOrders: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, []),
      wholesaleClients: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleClients, []),
      activity: readLocalJson(ADMIN_LOCAL_KEYS.activity, []),
      contacts: readLocalJson(ADMIN_LOCAL_KEYS.contacts, []),
      userMeta: readLocalJson(ADMIN_LOCAL_KEYS.userMeta, {})
    };
  }
  if (document.getElementById("adminControlModal")?.classList.contains("is-open")) renderAdminControl();
  if (document.getElementById("cashControlModal")?.classList.contains("is-open")) renderControlCaja();
  if (document.getElementById("accountSessionsModal")?.classList.contains("is-open")) renderAccountSessionsPanel();
  enforceCurrentAccountSession();
}

window.getAppCloudStore = getAppCloudStore;
window.hydrateAppCloudStore = hydrateAppCloudStore;

async function refreshAppCloudStoreFromSupabase() {
  try {
    const { data } = await supabaseClient.from(TABLES.builder).select("data").limit(1);
    const remoteStore = data?.[0]?.data?.appStore;
    if (remoteStore && typeof remoteStore === "object") hydrateAppCloudStore(remoteStore);
  } catch (error) {
    console.error("Error sincronizando datos remotos:", error);
  }
}

function readLocalJson(key, fallback) {
  try {
    if (shouldSyncCloudKey(key) && Object.prototype.hasOwnProperty.call(appCloudStore, key)) return appCloudStore[key] ?? fallback;
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (shouldSyncCloudKey(key)) {
    appCloudStore[key] = value;
    scheduleAppCloudPersist();
  }
}

function normalizePhoneNumber(countryCode = "", rawPhone = "") {
  const digits = String(rawPhone || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (String(rawPhone || "").trim().startsWith("+")) return `+${digits}`;
  const code = String(countryCode || "").trim() || "+1";
  return `${code}${digits}`;
}

function populatePhoneCountrySelect(selectId, preferredIso = "RD") {
  const select = document.getElementById(selectId);
  if (!select || select.dataset.loaded === "true") return;
  select.innerHTML = PHONE_COUNTRY_OPTIONS.map((country) => (
    `<option value="${country.code}" data-iso="${country.iso}" data-flag="${country.flag}" ${country.iso === preferredIso ? "selected" : ""}>${country.flag} ${country.iso} ${country.code}</option>`
  )).join("");
  select.dataset.loaded = "true";
}

function getSelectedPhoneCountry(selectId) {
  const select = document.getElementById(selectId);
  const selected = select?.options?.[select.selectedIndex];
  return {
    code: select?.value || "+1",
    flag: selected?.dataset?.flag || "",
    iso: selected?.dataset?.iso || ""
  };
}

function buildPhoneFromInputs(countrySelectId, phoneInputId) {
  const country = getSelectedPhoneCountry(countrySelectId);
  const phone = document.getElementById(phoneInputId)?.value || "";
  return normalizePhoneNumber(country.code, phone);
}

function generatePhoneVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function setPhoneVerifyStatus(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function sendPhoneVerification(scope, countrySelectId, phoneInputId, statusId) {
  const phone = buildPhoneFromInputs(countrySelectId, phoneInputId);
  if (!phone) return mostrarMensaje("Completa el numero de telefono.");
  const code = generatePhoneVerificationCode();
  phoneVerificationState[scope] = { phone, code, verified: false };
  const waPhone = phone.replace(/[^\d]/g, "");
  const text = `Tu codigo de verificacion de ${siteSettings.logoText || activeTenantConfig.clientName} es: ${code}`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, "_blank");
  setPhoneVerifyStatus(statusId, `Codigo enviado por WhatsApp a ${phone}.`);
}

function confirmPhoneVerification(scope, codeInputId, statusId) {
  const value = document.getElementById(codeInputId)?.value.trim();
  const state = phoneVerificationState[scope];
  if (!state?.code || value !== state.code) return mostrarMensaje("Codigo incorrecto.");
  phoneVerificationState[scope] = { ...state, verified: true };
  setPhoneVerifyStatus(statusId, `Telefono confirmado: ${state.phone}`);
}

function enviarCodigoTelefonoRegistro() {
  sendPhoneVerification("register", "regPhoneCountry", "regPhone", "phoneVerifyStatus");
}

function confirmarCodigoTelefonoRegistro() {
  confirmPhoneVerification("register", "regPhoneCode", "phoneVerifyStatus");
}

function enviarCodigoTelefonoPerfil() {
  sendPhoneVerification("profile", "perfilPhoneCountry", "perfilTelefono", "profilePhoneVerifyStatus");
}

function confirmarCodigoTelefonoPerfil() {
  confirmPhoneVerification("profile", "perfilPhoneCode", "profilePhoneVerifyStatus");
}

function getBrowserDeviceId() {
  let id = localStorage.getItem("digiharaDeviceId");
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("digiharaDeviceId", id);
  }
  return id;
}

function getBrowserSessionId() {
  let id = sessionStorage.getItem("digiharaBrowserSessionId");
  if (!id) {
    id = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("digiharaBrowserSessionId", id);
  }
  return id;
}

function getAccountSessionUserKey(user = usuarioActual) {
  if (!user) return "";
  return String(user.syntheticBoss ? `boss:${user.username || "boss"}` : (user.id || user.username || ""));
}

function getBrowserLabel() {
  const ua = navigator.userAgent || "";
  if (/Edg/i.test(ua)) return "Microsoft Edge";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua)) return "Safari";
  return "Navegador";
}

function getDeviceLabel() {
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
  return "Dispositivo";
}

function getAccountSessionsMap() {
  return readLocalJson(ADMIN_LOCAL_KEYS.accountSessions, {});
}

function saveAccountSessionsMap(map = {}) {
  writeLocalJson(ADMIN_LOCAL_KEYS.accountSessions, map);
}

function registerAccountSession(user = usuarioActual) {
  const userKey = getAccountSessionUserKey(user);
  if (!userKey) return;
  const map = getAccountSessionsMap();
  const sessions = Array.isArray(map[userKey]) ? map[userKey] : [];
  const sessionId = getBrowserSessionId();
  const deviceId = getBrowserDeviceId();
  if (sessions.find((item) => item.id === sessionId)?.status === "closed") {
    enforceCurrentAccountSession();
    return;
  }
  const now = new Date().toISOString();
  const next = {
    id: sessionId,
    deviceId,
    browser: getBrowserLabel(),
    device: getDeviceLabel(),
    userAgent: navigator.userAgent || "",
    openedAt: sessions.find((item) => item.id === sessionId)?.openedAt || now,
    lastSeen: now,
    current: true
  };
  const filtered = sessions.filter((item) => item.id !== sessionId && item.status !== "closed");
  map[userKey] = [next, ...filtered].slice(0, 25);
  saveAccountSessionsMap(map);
}

function enforceCurrentAccountSession() {
  if (!usuarioActual) return;
  const userKey = getAccountSessionUserKey(usuarioActual);
  const currentId = getBrowserSessionId();
  const session = (getAccountSessionsMap()[userKey] || []).find((item) => item.id === currentId);
  if (session?.status === "closed") {
    mostrarMensaje("Esta sesion fue cerrada desde otro dispositivo.");
    clearUsuarioActualData();
    favoritos = [];
    carrito = getStoredGuestCart();
    actualizarUsuarioUI();
    actualizarContadorCarrito();
    applySiteAppearance();
  }
}

function closeAccountSession(sessionId = "") {
  const userKey = getAccountSessionUserKey();
  if (!userKey || !sessionId) return;
  const map = getAccountSessionsMap();
  const currentId = getBrowserSessionId();
  map[userKey] = (map[userKey] || []).map((session) =>
    session.id === sessionId ? { ...session, status: "closed", closedAt: new Date().toISOString() } : session
  );
  saveAccountSessionsMap(map);
  if (sessionId === currentId) cerrarSesion();
  renderAccountSessionsPanel();
}

function renderAccountSessionsPanel() {
  const list = document.getElementById("accountSessionsList");
  if (!list) return;
  const userKey = getAccountSessionUserKey();
  const sessions = (getAccountSessionsMap()[userKey] || []).filter((item) => item.status !== "closed");
  const currentId = getBrowserSessionId();
  const deviceCount = new Set(sessions.map((item) => item.deviceId)).size;
  const browserCount = sessions.length;
  list.innerHTML = `
    <div class="admin-control-summary">
      <div class="admin-stat-card"><span>Dispositivos</span><strong>${deviceCount}</strong></div>
      <div class="admin-stat-card"><span>Navegadores abiertos</span><strong>${browserCount}</strong></div>
    </div>
    <div class="admin-control-table">
      ${sessions.map((session) => `
        <article class="admin-control-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(session.device || "Dispositivo")} - ${escapeHtmlAttribute(session.browser || "Navegador")} ${session.id === currentId ? "(este)" : ""}</strong>
            <small>Abierta: ${new Date(session.openedAt || Date.now()).toLocaleString()}</small>
            <small>Ultima actividad: ${new Date(session.lastSeen || Date.now()).toLocaleString()}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" class="danger-btn" onclick="closeAccountSession('${escapeHtmlAttribute(session.id)}')">Cerrar sesion</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay sesiones registradas para esta cuenta.</div>`}
    </div>
  `;
}

function abrirSesionesCuenta() {
  if (!usuarioActual) return mostrarMensaje("Debes iniciar sesion.");
  registerAccountSession(usuarioActual);
  renderAccountSessionsPanel();
  openModal("accountSessionsModal");
}

function cerrarSesionesCuenta() {
  closeModal("accountSessionsModal");
}

function getUserStableId(user = usuarioActual) {
  return user?.id || user?.username || "guest";
}

function getUserContactMeta(user = usuarioActual) {
  const meta = readLocalJson(ADMIN_LOCAL_KEYS.userMeta, {});
  const possibleKeys = [getUserStableId(user), user?.id, user?.username].filter(Boolean).map(String);
  for (const key of possibleKeys) {
    if (meta[key]) return meta[key];
  }
  return Object.values(meta).find((item) => (
    (user?.id && String(item.userId) === String(user.id)) ||
    (user?.username && item.username === user.username)
  )) || {};
}

function saveUserContactMeta(user, patch = {}) {
  if (!user) return;
  const meta = readLocalJson(ADMIN_LOCAL_KEYS.userMeta, {});
  const key = getUserStableId(user);
  const previous = getUserContactMeta(user);
  const next = {
    ...previous,
    ...(meta[key] || {}),
    userId: user.id || key,
    username: user.username || patch.username || "",
    email: patch.email ?? user.email ?? user.correo ?? meta[key]?.email ?? previous.email ?? "",
    telefono: patch.telefono ?? user.telefono ?? user.phone ?? meta[key]?.telefono ?? previous.telefono ?? "",
    createdAt: patch.createdAt || meta[key]?.createdAt || previous.createdAt || user.created_at || new Date().toISOString()
  };
  meta[key] = next;
  if (user.username) meta[user.username] = { ...(meta[user.username] || {}), ...next };
  if (user.id) meta[user.id] = { ...(meta[user.id] || {}), ...next };
  writeLocalJson(ADMIN_LOCAL_KEYS.userMeta, meta);
  accessState.userContactMeta = {
    ...(accessState.userContactMeta || {}),
    [key]: next,
    ...(user.username ? { [user.username]: next } : {}),
    ...(user.id ? { [user.id]: next } : {})
  };
  window.accessState = accessState;
  if (typeof builderHooks?.persistAll === "function") builderHooks.persistAll();
}

function recordUserActivity(type, detail = {}) {
  const log = cleanOldAdminMovements(false);
  const entry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    detail,
    userId: getUserStableId(),
    username: usuarioActual?.username || "Invitado",
    fecha: new Date().toISOString()
  };
  log.unshift(entry);
  writeLocalJson(ADMIN_LOCAL_KEYS.activity, log.slice(0, 600));
}

function cleanOldAdminMovements(shouldPersist = true) {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const cleaned = readLocalJson(ADMIN_LOCAL_KEYS.activity, []).filter((entry) => {
    const date = new Date(entry.fecha || 0);
    return !Number.isNaN(date.getTime()) && date.getTime() >= cutoff;
  });
  if (shouldPersist) writeLocalJson(ADMIN_LOCAL_KEYS.activity, cleaned);
  return cleaned;
}

function limpiarMovimientosAdmin() {
  if (!confirm("Eliminar todos los movimientos registrados?")) return;
  writeLocalJson(ADMIN_LOCAL_KEYS.activity, []);
  if (adminControlState.source) adminControlState.source.activity = [];
  renderAdminControl();
}

function getSaleUnitPrice(item = {}) {
  return Number(typeof item.unitPrice === "number" ? item.unitPrice : item.oferta?.ahora || item.precio || 0);
}

function getWholesaleUnitCost(item = {}) {
  if (Object.prototype.hasOwnProperty.call(item, "costoMayorista")) {
    if (item.costoMayorista === undefined || item.costoMayorista === null || item.costoMayorista === "") return null;
    const cost = Number(item.costoMayorista);
    return Number.isNaN(cost) ? null : cost;
  }
  if (item.precioMayorista === undefined || item.precioMayorista === null || item.precioMayorista === "") {
    return null;
  }
  const value = Number(item.precioMayorista);
  return Number.isNaN(value) ? null : value;
}

function buildOrderLineStats(item = {}) {
  const cantidad = Number(item.cantidad || 1);
  const precioVenta = getSaleUnitPrice(item);
  const precioMayorista = getWholesaleUnitCost(item);
  const hasWholesalePrice = precioMayorista !== null;
  const manualTotal = Number(item.gananciaManualTotal ?? item.gananciaTotal);
  const manualUnit = Number(item.gananciaManual ?? item.gananciaNeta);
  const gananciaUnidad = hasWholesalePrice
    ? precioVenta - precioMayorista
    : (!Number.isNaN(manualTotal) ? manualTotal / cantidad : (!Number.isNaN(manualUnit) ? manualUnit : 0));
  const gananciaTotal = hasWholesalePrice ? gananciaUnidad * cantidad : (!Number.isNaN(manualTotal) ? manualTotal : gananciaUnidad * cantidad);
  return {
    ...item,
    precioVenta,
    precioMayorista,
    costoMayorista: precioMayorista,
    notaPedido: item.notaPedido || item.note || "",
    saleUnitLabel: item.saleUnitLabel || item.productSaleUnitLabel || "",
    gananciaManual: hasWholesalePrice ? undefined : gananciaUnidad,
    gananciaManualTotal: hasWholesalePrice ? undefined : gananciaTotal,
    gananciaNeta: gananciaUnidad,
    gananciaTotal,
    subtotal: precioVenta * cantidad,
    cantidad
  };
}

function hasInventory(prod = {}) {
  return Boolean(prod.controlStock || Number(prod.stock || 0) > 0);
}

function canSeeInventoryQuantity() {
  const role = getCurrentUserRole();
  if (role === "boss") return true;
  return Boolean(accessState.rolePermissions?.[role]?.inventoryQuantity);
}

function getStockStatus(prod = {}) {
  if (!hasInventory(prod)) return { label: "Sin control de stock", className: "" };
  if (Number(prod.stock || 0) <= 0) return { label: "Agotado", className: "out" };
  if (Number(prod.stock || 0) <= Number(prod.stockAlert || 3)) return { label: `Pocas unidades: ${prod.stock}`, className: "low" };
  return { label: `Stock: ${prod.stock}`, className: "" };
}

function canSellQuantity(prod = {}, cantidad = 1) {
  if (!hasInventory(prod)) return true;
  return Number(prod.stock || 0) >= Number(cantidad || 1);
}

function updateInventoryAfterConfirmedOrder(items = []) {
  let changed = false;
  items.forEach((line) => {
    const location = findProductLocationByName(line.nombre);
    if (!location?.producto || !hasInventory(location.producto)) return;
    location.producto.stock = Math.max(0, Number(location.producto.stock || 0) - Number(line.cantidad || 1));
    changed = true;
  });
  if (changed) guardar();
}

function restoreInventoryFromOrder(items = []) {
  let changed = false;
  items.forEach((line) => {
    const location = findProductLocationByName(line.nombre);
    if (!location?.producto || !hasInventory(location.producto)) return;
    location.producto.stock = Number(location.producto.stock || 0) + Number(line.cantidad || 1);
    changed = true;
  });
  if (changed) guardar();
}

/* QUE HACE: Utilidades de seguridad para passwords hasheadas.
   POR QUE SE HIZO: Evita seguir guardando passwords planas en frontend y DB.
   COMO MODIFICARLO: Si luego migras a backend, mueve este hashing al servidor. */
async function hashPlainText(value = "") {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(String(value)));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isStoredHashedPassword(value = "") {
  return String(value || "").startsWith("sha256:");
}

async function buildStoredPassword(value = "") {
  return `sha256:${await hashPlainText(value)}`;
}

async function verifyStoredPassword(plainValue = "", storedValue = "") {
  const current = String(storedValue || "");
  if (!current) return false;
  if (isStoredHashedPassword(current)) {
    return (await hashPlainText(plainValue)) === current.slice(7);
  }
  return plainValue === current;
}

async function verifySecretHash(plainValue = "", storedHash = "") {
  if (!storedHash) return false;
  return (await hashPlainText(plainValue)) === String(storedHash);
}

function normalizarProducto(prod = {}) {
  return {
    nombre: prod.nombre || "Producto",
    precio: Number(prod.precio || 0),
    precioMayorista: prod.precioMayorista === undefined || prod.precioMayorista === null || prod.precioMayorista === "" ? null : Number(prod.precioMayorista),
    costoMayorista: prod.costoMayorista === undefined || prod.costoMayorista === null || prod.costoMayorista === "" ? null : Number(prod.costoMayorista),
    saleUnitLabel: prod.saleUnitLabel || prod.productSaleUnitLabel || "",
    descripcion: prod.descripcion || "",
    imagen: prod.imagen || null,
    imagenes: Array.isArray(prod.imagenes) ? prod.imagenes.filter(Boolean) : [],
    oferta: prod.oferta && prod.oferta.antes && prod.oferta.ahora ? prod.oferta : null,
    activo: prod.activo !== false,
    controlStock: Boolean(prod.controlStock),
    stock: Number(prod.stock || 0),
    stockAlert: Number(prod.stockAlert || 3),
    videoInfoUrl: prod.videoInfoUrl || prod.videoUrl || ""
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
  Object.keys(config || {}).forEach((role) => {
    if (!merged[role]) {
      merged[role] = {
        emoji: config[role]?.emoji || "\u25CF",
        background: config[role]?.background || "linear-gradient(135deg,#64748b,#334155)",
        color: config[role]?.color || "#ffffff"
      };
    }
  });
  return merged;
}

function normalizeCustomRoles(roles = []) {
  return Array.isArray(roles)
    ? roles
        .map((role) => ({
          id: normalizarTexto(role?.id || role?.label || ""),
          label: String(role?.label || role?.id || "").trim()
        }))
        .filter((role) => role.id && !defaultRolePermissions[role.id])
    : [];
}

function mergeRolePermissionsConfig(config = {}, customRoles = []) {
  const merged = clone(defaultRolePermissions);
  Object.keys(config || {}).forEach((role) => {
    merged[role] = {
      ...(merged[role] || defaultRolePermissions.cliente),
      ...(config[role] || {})
    };
  });
  customRoles.forEach((role) => {
    merged[role.id] = {
      ...defaultRolePermissions.cliente,
      ...(config?.[role.id] || merged[role.id] || {})
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
          username: String(item.username || "").trim(),
          role: item.role
        }))
    : [];

  const customRoles = normalizeCustomRoles(nextState.customRoles || []);
  const normalizedState = {
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
    userContactMeta: {
      ...(nextState.userContactMeta || nextState.adminUserMeta || {})
    },
    customRoles,
    roleDisplay: mergeRoleDisplayConfig(nextState.roleDisplay || {}),
    rolePermissions: mergeRolePermissionsConfig(nextState.rolePermissions || {}, customRoles),
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
  const tenantBossHash = activeTenantConfig.security?.bossPasswordHash || "";
  const tenantBossUsername = activeTenantConfig.security?.bossUsername || "boss@2000";
  const currentBossUsername = String(normalizedState.bossCredentials.username || "").trim().toLowerCase();
  if (tenantBossHash && currentBossUsername === String(tenantBossUsername).trim().toLowerCase() && !nextState.bossCredentials?.passwordHash) {
    normalizedState.bossCredentials.passwordHash = tenantBossHash;
  }
  return normalizedState;
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
  const directRole = typeof userOrName === "object" ? userOrName?.role : "";
  const normalized = String(username || "").trim().toLowerCase();
  if (normalized && normalized === String(accessState.bossCredentials.username || "").trim().toLowerCase()) return "boss";
  if (userId !== undefined && userId !== null && userId !== "") {
    const byId = accessState.roleAssignments.find((item) => String(item.userId ?? "") === String(userId));
    if (byId) return byId.role || "cliente";
  }
  if (!normalized) return "cliente";
  return accessState.roleAssignments.find((item) => String(item.username || "").trim().toLowerCase() === normalized)?.role || directRole || "cliente";
}

function getEffectiveRole(role = "") {
  return role || "cliente";
}

function isDefaultRole(role = "") {
  return Boolean(defaultRolePermissions[getEffectiveRole(role)]);
}

function roleHasPermission(role = "cliente", permission = "") {
  const effectiveRole = getEffectiveRole(role);
  if (permission === "wholesalePriceView" && isDefaultRole(effectiveRole)) return false;
  if (effectiveRole === "boss") return true;
  return Boolean(accessState.rolePermissions?.[effectiveRole]?.[permission]);
}

function canUseCustomerWholesalePrices() {
  const role = getCurrentUserRole();
  return Boolean(usuarioActual && !adminSession.wholesaleMode && !isDefaultRole(role) && roleHasPermission(role, "wholesalePriceView"));
}

function getCurrentUserRole() {
  if (!usuarioActual) return "cliente";
  if (usuarioActual.syntheticBoss) return "boss";
  return getAssignedRole(usuarioActual);
}

function canEnterAdminMode(role = adminSession.role) {
  return roleHasPermission(role, "adminAccess");
}

function canUseBuilder(role = adminSession.role) {
  return adminSession.active && roleHasPermission(role, "builder");
}

function canEditRetail(role = adminSession.role) {
  return adminSession.active && roleHasPermission(role, "retailEdit") && !adminSession.wholesaleMode;
}

function canEditWholesale(role = adminSession.role) {
  return adminSession.active && roleHasPermission(role, "wholesaleEdit") && adminSession.wholesaleMode;
}

function canToggleWholesale(role = adminSession.role) {
  return adminSession.active && roleHasPermission(role, "wholesaleMode");
}

function canUseWholesaleCart(role = adminSession.role) {
  return adminSession.active && roleHasPermission(role, "wholesaleCart") && adminSession.wholesaleMode;
}

function canManageWholesaleClients(role = adminSession.role) {
  return adminSession.active && roleHasPermission(role, "wholesaleClients");
}

function canManageWholesaleCostList() {
  return roleHasPermission(getCurrentUserRole(), "wholesaleCostList");
}

function canUseCashControl() {
  return roleHasPermission(getCurrentUserRole(), "cashControl");
}

function canViewAllCashControl() {
  return roleHasPermission(getCurrentUserRole(), "cashViewAll");
}

function canManageTeam() {
  return roleHasPermission(getCurrentUserRole(), "team");
}

function canManageInternalCredentials() {
  return roleHasPermission(getCurrentUserRole(), "credentials");
}

function canUseUserThemeCustomization() {
  return Boolean(usuarioActual && siteSettings.userThemeAccessEnabled !== false);
}

function roleLabel(role = "cliente") {
  const map = {
    boss: "Boss",
    administrador: "Administrador",
    vendedor: "Vendedor",
    mayorista: "Mayorista",
    cliente: "Cliente"
  };
  accessState.customRoles?.forEach((customRole) => {
    map[customRole.id] = customRole.label;
  });
  return map[getEffectiveRole(role)] || "Cliente";
}

function roleChipClass(role = "cliente") {
  return `role-chip-${getEffectiveRole(role)}`;
}

function getRoleDisplay(role = "cliente") {
  return accessState.roleDisplay?.[getEffectiveRole(role)] || defaultRoleDisplay[getEffectiveRole(role)] || {
    emoji: "\u25CF",
    background: "linear-gradient(135deg,#64748b,#334155)",
    color: "#ffffff"
  };
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
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
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

/* QUE HACE: Guarda la preferencia visual individual del usuario registrado.
   POR QUE SE HIZO: Permite aplicar su tema automaticamente al volver a iniciar sesion.
   COMO MODIFICARLO: Si luego quieres persistencia entre dispositivos, migra estas claves a backend. */
function getUserThemePreferenceStorageKey(user = usuarioActual) {
  const id = user?.id || user?.username;
  return id ? `userThemePreset_${id}` : "";
}

function getStoredUserThemePreference(user = usuarioActual) {
  if (user?.syntheticBoss) return accessState.bossCredentials.themePreset || "";
  if (user?.themePreset || user?.userThemePreset) return user.themePreset || user.userThemePreset;
  const key = getUserThemePreferenceStorageKey(user);
  return key ? localStorage.getItem(key) || "" : "";
}

async function persistUserThemePreference(themeId, user = usuarioActual) {
  const key = getUserThemePreferenceStorageKey(user);
  if (key) localStorage.setItem(key, themeId);
  if (user?.syntheticBoss) {
    accessState.bossCredentials.themePreset = themeId;
    syncAccessState(accessState);
    builderHooks.persistAll();
    return;
  }
  if (user?.id) {
    usuarioActual = { ...usuarioActual, themePreset: themeId, userThemePreset: themeId };
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
    try {
      await supabaseClient.from(TABLES.usuarios).update({ themePreset: themeId, userThemePreset: themeId }).eq("id", user.id);
    } catch {
      try {
        await supabaseClient.from(TABLES.usuarios).update({ themePreset: themeId }).eq("id", user.id);
      } catch {}
    }
  }
}

async function clearStoredUserThemePreference(user = usuarioActual) {
  const key = getUserThemePreferenceStorageKey(user);
  if (key) localStorage.removeItem(key);
  if (user?.syntheticBoss) {
    accessState.bossCredentials.themePreset = "";
    syncAccessState(accessState);
    builderHooks.persistAll();
    return;
  }
  if (user?.id) {
    usuarioActual = { ...usuarioActual, themePreset: "", userThemePreset: "" };
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
    try {
      await supabaseClient.from(TABLES.usuarios).update({ themePreset: "", userThemePreset: "" }).eq("id", user.id);
    } catch {
      try {
        await supabaseClient.from(TABLES.usuarios).update({ themePreset: "" }).eq("id", user.id);
      } catch {}
    }
  }
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

function getAvailableCustomFonts(settings = siteSettings) {
  const fromArray = Array.isArray(settings.customFonts) ? settings.customFonts : [];
  const normalizedArray = fromArray
    .filter((item) => item?.name)
    .map((item) => ({ name: String(item.name).trim(), url: String(item.url || "").trim() }))
    .filter((item) => item.name);
  if (settings.customFontName?.trim()) {
    normalizedArray.unshift({ name: settings.customFontName.trim(), url: String(settings.customFontUrl || "").trim() });
  }
  return normalizedArray;
}

function getAllAvailableFonts(settings = siteSettings) {
  const set = new Set(BUILTIN_FONT_OPTIONS);
  getAvailableCustomFonts(settings).forEach((font) => set.add(font.name));
  return Array.from(set);
}

window.getAllAvailableFonts = getAllAvailableFonts;

function getResolvedFontFamily(fontName = "") {
  const trimmed = String(fontName || "").trim();
  if (!trimmed) return '"Manrope", sans-serif';
  if (trimmed.includes(",")) return trimmed;
  return `"${trimmed}", sans-serif`;
}

function ensureCustomFontLoaded() {
  getAvailableCustomFonts(siteSettings).forEach((font, index) => {
    if (!font.url) return;
    const id = `customSiteFontLink_${index}_${font.name.replace(/\s+/g, "_")}`;
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== font.url) link.href = font.url;
  });
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
  const map = { left: "start", center: "center", right: "end" };
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

/* QUE HACE: Convierte cualquier color CSS soportado por el navegador a canales RGB reutilizables.
   POR QUE SE HIZO: Permite calcular contraste automatico para que los temas personales sigan siendo legibles.
   COMO MODIFICARLO: Si luego quieres reglas mas estrictas, usa esta base para evaluar degradados o transparencias. */
function getCssColorChannels(color = "") {
  if (!color) return null;
  try {
    appearanceColorContext.fillStyle = "#000000";
    appearanceColorContext.fillStyle = color;
    const normalized = appearanceColorContext.fillStyle;
    if (normalized.startsWith("#")) {
      return parseHexColorValue(normalized);
    }
    const match = normalized.match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(",").map((item) => item.trim());
    const [r, g, b] = parts.slice(0, 3).map(Number);
    const alpha = parts[3] !== undefined ? Number(parts[3]) : 1;
    return { r, g, b, a: alpha };
  } catch {
    return null;
  }
}

/* QUE HACE: Estima si un fondo es claro u oscuro para escoger un texto que se lea bien.
   POR QUE SE HIZO: Los presets editables del builder ahora deben mantener contraste sin depender
   de que el usuario acierte manualmente con el color del texto.
   COMO MODIFICARLO: Ajusta el umbral o las salidas si quieres mas contraste o un look mas suave. */
function getReadableTextColor(backgroundColor = "", options = {}) {
  const channels = getCssColorChannels(backgroundColor);
  const darkColor = options.darkColor || "#0f172a";
  const lightColor = options.lightColor || "#f8fbff";
  if (!channels) return darkColor;
  const luminance = (channels.r * 0.299) + (channels.g * 0.587) + (channels.b * 0.114);
  return luminance >= (options.threshold || 165) ? darkColor : lightColor;
}

/* QUE HACE: Define un tono secundario legible para notas y texto auxiliar segun el fondo activo.
   POR QUE SE HIZO: Los paneles personalizados necesitan texto principal y texto secundario claros,
   especialmente en el menu de perfil, modales y builder del boss.
   COMO MODIFICARLO: Cambia los colores de salida si quieres un estilo mas contrastado o mas tenue. */
function getReadableMutedTextColor(backgroundColor = "", options = {}) {
  const readable = getReadableTextColor(backgroundColor, options);
  return readable === (options.darkColor || "#0f172a")
    ? (options.mutedDarkColor || "#475569")
    : (options.mutedLightColor || "#dbeafe");
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

function runWhenBrowserIsIdle(callback, timeout = 1200) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }
  setTimeout(callback, Math.min(timeout, 800));
}

function hasAcceptedPerformanceCookies() {
  return localStorage.getItem(PERFORMANCE_COOKIE_KEY) === "accepted";
}

function isFastModeEnabled() {
  return localStorage.getItem(FAST_MODE_KEY) !== "soft";
}

function applyFastModePreference() {
  document.body.classList.toggle("fast-mode", isFastModeEnabled());
  const label = isFastModeEnabled() ? "Modo suave" : "Modo rapido";
  document.getElementById("fastModeMenuBtn")?.replaceChildren(document.createTextNode(label));
  document.getElementById("fastModeMobileBtn")?.replaceChildren(document.createTextNode(label));
}

function toggleFastMode() {
  localStorage.setItem(FAST_MODE_KEY, isFastModeEnabled() ? "soft" : "enabled");
  applyFastModePreference();
  mostrarMensaje(isFastModeEnabled() ? "Modo rapido activado." : "Modo suave activado.");
}

function hideCookieConsentBanner() {
  document.getElementById("cookieConsentBanner")?.classList.add("hidden");
}

function initCookieConsentBanner() {
  const banner = document.getElementById("cookieConsentBanner");
  if (!banner) return;
  const state = localStorage.getItem(PERFORMANCE_COOKIE_KEY);
  if (state === "accepted") {
    hideCookieConsentBanner();
    startPerformanceOptimizations();
    return;
  }
  if (state === "declined") {
    banner.classList.remove("cookie-banner-floating");
    banner.classList.add("cookie-banner-inline");
    banner.classList.remove("hidden");
    return;
  }
  banner.classList.add("cookie-banner-floating");
  banner.classList.remove("cookie-banner-inline", "hidden");
}

function acceptCookieConsent() {
  localStorage.setItem(PERFORMANCE_COOKIE_KEY, "accepted");
  hideCookieConsentBanner();
  startPerformanceOptimizations(true);
  mostrarMensaje("Preferencias guardadas. La pagina optimizara imagenes y recursos en segundo plano.");
}

function declineCookieConsent() {
  localStorage.removeItem(PERFORMANCE_COOKIE_KEY);
  const banner = document.getElementById("cookieConsentBanner");
  if (!banner) return;
  banner.classList.remove("cookie-banner-floating");
  banner.classList.add("cookie-banner-inline");
  document.querySelector(".site-shell")?.appendChild(banner);
}

window.acceptCookieConsent = acceptCookieConsent;
window.declineCookieConsent = declineCookieConsent;

function collectImageAssetUrls(asset, urls) {
  const normalized = normalizeImageAsset(asset);
  [normalized.original, normalized.webp].filter(Boolean).forEach((src) => {
    urls.add(getPrimaryImageSrc(src, 1200) || src);
  });
}

function collectPerformanceAssetUrls() {
  const urls = new Set();
  collectImageAssetUrls(siteSettings.logoImage, urls);
  collectImageAssetUrls(siteSettings.pageBackgroundImage, urls);
  collectImageAssetUrls(siteSettings.productGalleryBackgroundImage, urls);
  (slidesData || []).forEach((slide) => collectImageAssetUrls(slide.imagen, urls));
  (catalogos || []).forEach((cat) => {
    (cat.productos || []).forEach((prod) => {
      collectImageAssetUrls(prod.imagen, urls);
      (Array.isArray(prod.imagenes) ? prod.imagenes : []).forEach((img) => collectImageAssetUrls(img, urls));
    });
  });
  document.querySelectorAll("img[src]").forEach((img) => urls.add(img.currentSrc || img.src));
  return [...urls].filter((src) => src && !src.startsWith("data:"));
}

function warmImageCacheInBatches(urls = [], options = {}) {
  if (!urls.length || performanceWarmupRunning) return;
  performanceWarmupRunning = true;
  const queue = [...new Set(urls)];
  const batchSize = options.batchSize || 5;
  const warmNextBatch = () => {
    const batch = queue.splice(0, batchSize);
    batch.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.referrerPolicy = "no-referrer";
      img.src = src;
      if (img.decode) img.decode().catch(() => {});
    });
    if (queue.length) {
      runWhenBrowserIsIdle(warmNextBatch, 1800);
      return;
    }
    performanceWarmupRunning = false;
    localStorage.setItem(PERFORMANCE_WARMUP_KEY, new Date().toISOString());
  };
  runWhenBrowserIsIdle(warmNextBatch, 1000);
}

function optimizeRenderedMedia() {
  document.querySelectorAll("img").forEach((img, index) => {
    if (!img.hasAttribute("decoding")) img.decoding = "async";
    if (!img.hasAttribute("loading") && index > 2) img.loading = "lazy";
    if (!img.hasAttribute("fetchpriority") && index > 4) img.setAttribute("fetchpriority", "low");
  });
  document.querySelectorAll("iframe").forEach((frame) => {
    frame.loading = "lazy";
    if (!frame.referrerPolicy) frame.referrerPolicy = "strict-origin-when-cross-origin";
  });
  document.querySelectorAll("video").forEach((video) => {
    if (!video.hasAttribute("preload")) video.preload = "metadata";
    video.playsInline = true;
  });
}

function schedulePerformanceWarmup() {
  if (!hasAcceptedPerformanceCookies()) return;
  clearTimeout(performanceWarmupTimer);
  performanceWarmupTimer = setTimeout(() => {
    optimizeRenderedMedia();
    const urls = collectPerformanceAssetUrls();
    const critical = urls.slice(0, 40);
    const rest = urls.slice(40);
    warmImageCacheInBatches(critical, { batchSize: 6 });
    if (rest.length) {
      runWhenBrowserIsIdle(() => warmImageCacheInBatches(rest, { batchSize: 4 }), 5000);
    }
  }, 350);
}

async function registerPerformanceServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try {
    await navigator.serviceWorker.register(PERFORMANCE_SW_URL);
  } catch (error) {
    console.warn("Performance cache worker no disponible:", error);
  }
}

function startPerformanceOptimizations(force = false) {
  if (!hasAcceptedPerformanceCookies()) return;
  registerPerformanceServiceWorker();
  if (!performanceMutationObserver && "MutationObserver" in window) {
    performanceMutationObserver = new MutationObserver(() => {
      optimizeRenderedMedia();
      schedulePerformanceWarmup();
    });
    performanceMutationObserver.observe(document.body, { childList: true, subtree: true });
  }
  if (force) localStorage.removeItem(PERFORMANCE_WARMUP_KEY);
  schedulePerformanceWarmup();
}

window.schedulePerformanceWarmup = schedulePerformanceWarmup;

function buildPageBackground(settings) {
  return buildGradientBackground({
    enabled: settings.pageBackgroundEnabled,
    type: settings.pageBackgroundType,
    position: settings.pageBackgroundPosition,
    color1: settings.pageBackgroundColor1,
    color2: settings.pageBackgroundColor2,
    color3: settings.pageBackgroundColor3,
    opacity: settings.pageBackgroundOpacity ?? 1
  });
}

function buildPageOverlay(settings) {
  const opacity = Math.max(0, Math.min(1, Number(settings.pageBackgroundOverlayOpacity ?? 0)));
  return opacity > 0
    ? `linear-gradient(rgba(3,8,21,${opacity}), rgba(3,8,21,${opacity}))`
    : "transparent";
}

function escapeCssUrl(url = "") {
  return String(url || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/* QUE HACE: Utilidades de imagen para lazy load, picture y compatibilidad con Cloudflare.
   POR QUE SE HIZO: Mejora rendimiento y deja lista la estructura para WebP y optimizacion CDN.
   COMO MODIFICARLO:
   - Si tus imagenes ya tienen variante .webp, guardala como objeto { original, webp }.
   - Si usas Cloudflare con un dominio proxied, activa el flag del tenant y ajusta la base. */
function normalizeImageAsset(asset) {
  if (!asset) return { original: "", webp: "" };
  if (typeof asset === "string") {
    return {
      original: asset,
      webp: /\.webp($|\?)/i.test(asset) ? asset : ""
    };
  }
  return {
    original: asset.original || asset.src || asset.url || "",
    webp: asset.webp || ""
  };
}

function canUseCloudflareImageResizing(src = "") {
  if (!activeTenantConfig.performance?.useCloudflareImageResizing) return false;
  if (!src) return false;
  try {
    const parsed = new URL(src, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

function buildCloudflareImageUrl(src = "", { width = 1200, quality, format = "auto" } = {}) {
  if (!canUseCloudflareImageResizing(src)) return src;
  const basePath = activeTenantConfig.performance?.cloudflareImageBasePath || "/cdn-cgi/image";
  const finalQuality = quality || activeTenantConfig.performance?.defaultImageQuality || 82;
  const normalizedSrc = src.startsWith("/") ? src.slice(1) : src;
  return `${basePath}/format=${format},quality=${finalQuality},width=${width}/${normalizedSrc}`;
}

function getPrimaryImageSrc(asset, width = 1200) {
  const normalized = normalizeImageAsset(asset);
  const baseSrc = normalized.original || normalized.webp || "";
  return buildCloudflareImageUrl(baseSrc, { width, format: "auto" });
}

function getWebpImageSrc(asset, width = 1200) {
  const normalized = normalizeImageAsset(asset);
  if (normalized.webp) return buildCloudflareImageUrl(normalized.webp, { width, format: "webp" });
  if (canUseCloudflareImageResizing(normalized.original)) {
    return buildCloudflareImageUrl(normalized.original, { width, format: "webp" });
  }
  if (/\.webp($|\?)/i.test(normalized.original)) return normalized.original;
  return "";
}

function escapeHtmlAttribute(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value = "") {
  return escapeHtmlAttribute(value).replace(/'/g, "&#39;");
}

function buildResponsiveImageMarkup(asset, options = {}) {
  const {
    alt = "",
    className = "",
    imgClassName = "",
    loading = "lazy",
    decoding = "async",
    fetchpriority = "auto",
    sizes = "100vw",
    width = 1200,
    onclick = "",
    referrerpolicy = "no-referrer",
    placeholder = "https://placehold.co/600x600/0f172a/e2e8f0?text=Sin+Imagen"
  } = options;

  const src = getPrimaryImageSrc(asset, width) || placeholder;
  const webpSrc = getWebpImageSrc(asset, width);
  const clickAttr = onclick ? ` onclick="${escapeHtmlAttribute(onclick)}"` : "";
  const classes = imgClassName ? ` class="${escapeHtmlAttribute(imgClassName)}"` : "";
  const pictureClass = className ? ` class="${escapeHtmlAttribute(className)}"` : "";

  return `
    <picture${pictureClass}>
      ${webpSrc ? `<source type="image/webp" srcset="${escapeHtmlAttribute(webpSrc)}" sizes="${escapeHtmlAttribute(sizes)}">` : ""}
      <img
        src="${escapeHtmlAttribute(src)}"
        alt="${escapeHtmlAttribute(alt)}"
        width="${Number(width) || 1200}"
        loading="${escapeHtmlAttribute(loading)}"
        decoding="${escapeHtmlAttribute(decoding)}"
        fetchpriority="${escapeHtmlAttribute(fetchpriority)}"
        sizes="${escapeHtmlAttribute(sizes)}"
        data-performance-src="${escapeHtmlAttribute(src)}"
        referrerpolicy="${escapeHtmlAttribute(referrerpolicy)}"${classes}${clickAttr}>
    </picture>
  `.trim();
}

window.buildResponsiveImageMarkup = buildResponsiveImageMarkup;
window.getPrimaryImageSrc = getPrimaryImageSrc;

function syncStickyOffsets() {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;
  const height = Math.max(60, Math.round(topbar.getBoundingClientRect().height));
  document.documentElement.style.setProperty("--topbar-height", `${height}px`);
}

function upsertHeadElement(selector, tagName, attrs = {}) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement(tagName);
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") element.removeAttribute(key);
    else element.setAttribute(key, value);
  });
  return element;
}

function applyPageSeoSettings() {
  const description = siteSettings.pageSeoDescription || "Catalogo visual profesional, optimizado y preparado para multiples clientes.";
  const keywords = siteSettings.pageSeoKeywords || "";
  const publicUrl = siteSettings.pagePublicUrl || "";
  const favicon = siteSettings.pageFaviconImage || "";
  upsertHeadElement('meta[name="description"]', "meta", { name: "description", content: description });
  upsertHeadElement('meta[name="keywords"]', "meta", { name: "keywords", content: keywords });
  if (publicUrl) upsertHeadElement('link[rel="canonical"]', "link", { rel: "canonical", href: publicUrl });
  if (favicon) upsertHeadElement('link[rel="icon"]', "link", { rel: "icon", href: favicon });
}

function applySiteAppearance() {
  ensureCustomFontLoaded();
  document.body.style.fontFamily = getResolvedFontFamily(siteSettings.bodyFontFamily || siteSettings.customFontName || "Manrope");
  document.title = siteSettings.logoText || activeTenantConfig.clientName || "Catalogo";
  applyPageSeoSettings();

  const pageBackground = buildPageBackground(siteSettings) || defaultSiteSettings.pageBackgroundColor1;
  document.documentElement.style.setProperty("--page-background", pageBackground);
  document.documentElement.style.setProperty("--text", siteSettings.pageTextColor || "#edf5ff");
  document.documentElement.style.setProperty("--muted", siteSettings.pageMutedTextColor || "#a6b7ca");
  document.documentElement.style.setProperty("--page-heading-font", getResolvedFontFamily(siteSettings.pageHeadingFontFamily || "Space Grotesk"));
  document.documentElement.style.setProperty("--product-shadow-color", applyOpacityToCssColor(siteSettings.productShadowColor || "#020817", siteSettings.productShadowOpacity ?? 0.42));
  document.documentElement.style.setProperty("--product-hover-shadow-color", applyOpacityToCssColor(siteSettings.productHoverShadowColor || "#38bdf8", siteSettings.productHoverShadowOpacity ?? 0.25));
  document.documentElement.style.setProperty("--product-hover-lift", `${siteSettings.productHoverLift || 6}px`);
  document.documentElement.style.setProperty("--product-hover-scale", String(siteSettings.productHoverScale || 1.01));
  document.documentElement.style.setProperty("--product-hover-duration", `${siteSettings.productHoverDuration || 0.28}s`);
  document.documentElement.style.setProperty("--header-background", buildGradientBackground({
    enabled: siteSettings.headerBackgroundEnabled,
    type: siteSettings.headerBackgroundType,
    position: siteSettings.headerBackgroundPosition,
    color1: siteSettings.headerBackgroundColor1,
    color2: siteSettings.headerBackgroundColor2,
    color3: siteSettings.headerBackgroundColor3,
    opacity: siteSettings.headerBackgroundOpacity ?? 0.94
  }) || "rgba(4,9,21,.9)");
  document.documentElement.style.setProperty("--header-border-color", siteSettings.headerBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--header-backdrop-blur", `${siteSettings.headerBackdropBlur || 18}px`);
  document.documentElement.style.setProperty("--header-button-background", applyOpacityToCssColor(siteSettings.headerButtonBackground || "#0f172a", siteSettings.headerButtonBackgroundOpacity ?? 0.88));
  document.documentElement.style.setProperty("--header-button-text-color", siteSettings.headerButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--header-button-border-color", siteSettings.headerButtonBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--header-button-font", getResolvedFontFamily(siteSettings.headerButtonFontCustom || siteSettings.headerButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--header-button-size", `${siteSettings.headerButtonSize || 14}px`);
  document.documentElement.style.setProperty("--header-button-radius", `${siteSettings.headerButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--header-button-padding-y", `${siteSettings.headerButtonPaddingY || 10}px`);
  document.documentElement.style.setProperty("--header-button-padding-x", `${siteSettings.headerButtonPaddingX || 14}px`);
  document.documentElement.style.setProperty("--header-button-shadow", siteSettings.headerButtonShadowEnabled ? `0 12px 28px ${applyOpacityToCssColor(siteSettings.headerButtonShadowColor || "#020817", siteSettings.headerButtonShadowOpacity ?? 0.18)}` : "none");
  document.documentElement.style.setProperty("--header-button-hover-background", applyOpacityToCssColor(siteSettings.headerButtonHoverBackground || "#2563eb", siteSettings.headerButtonHoverBackgroundOpacity ?? 0.34));
  document.documentElement.style.setProperty("--header-button-hover-text-color", siteSettings.headerButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--header-button-hover-border-color", siteSettings.headerButtonHoverBorderColor || "#7dd3fc");
  document.documentElement.style.setProperty("--header-button-hover-duration", `${siteSettings.headerButtonHoverDuration || 0.2}s`);
  document.documentElement.style.setProperty("--header-button-hover-lift", `${siteSettings.headerButtonHoverLift || 1}px`);
  document.documentElement.style.setProperty("--header-button-hover-shadow", siteSettings.headerButtonShadowEnabled ? `0 16px 32px ${applyOpacityToCssColor(siteSettings.headerButtonHoverShadowColor || "#38bdf8", siteSettings.headerButtonHoverShadowOpacity ?? 0.18)}` : "none");
  document.documentElement.style.setProperty("--page-action-button-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.pageActionButtonBackgroundType,
    position: siteSettings.pageActionButtonBackgroundPosition,
    color1: siteSettings.pageActionButtonBackgroundColor1,
    color2: siteSettings.pageActionButtonBackgroundColor2,
    color3: siteSettings.pageActionButtonBackgroundColor3,
    opacity: siteSettings.pageActionButtonBackgroundOpacity ?? 1
  }) || "linear-gradient(135deg,#22d3ee,#2563eb)");
  document.documentElement.style.setProperty("--page-action-button-text-color", siteSettings.pageActionButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--page-action-button-border-color", siteSettings.pageActionButtonBorderColor || "#22d3ee");
  document.documentElement.style.setProperty("--page-action-button-font", getResolvedFontFamily(siteSettings.pageActionButtonFontCustom || siteSettings.pageActionButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--page-action-button-size", `${siteSettings.pageActionButtonSize || 14}px`);
  document.documentElement.style.setProperty("--page-action-button-radius", `${siteSettings.pageActionButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--page-action-button-padding-y", `${siteSettings.pageActionButtonPaddingY || 12}px`);
  document.documentElement.style.setProperty("--page-action-button-padding-x", `${siteSettings.pageActionButtonPaddingX || 16}px`);
  document.documentElement.style.setProperty("--page-action-button-shadow", siteSettings.pageActionButtonShadowEnabled ? `0 14px 34px ${applyOpacityToCssColor(siteSettings.pageActionButtonShadowColor || "#020817", siteSettings.pageActionButtonShadowOpacity ?? 0.28)}` : "none");
  document.documentElement.style.setProperty("--page-action-button-hover-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.pageActionButtonHoverBackgroundType,
    position: siteSettings.pageActionButtonHoverBackgroundPosition,
    color1: siteSettings.pageActionButtonHoverBackgroundColor1,
    color2: siteSettings.pageActionButtonHoverBackgroundColor2,
    color3: siteSettings.pageActionButtonHoverBackgroundColor3,
    opacity: siteSettings.pageActionButtonHoverBackgroundOpacity ?? 1
  }) || "linear-gradient(135deg,#38bdf8,#1d4ed8)");
  document.documentElement.style.setProperty("--page-action-button-hover-text-color", siteSettings.pageActionButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--page-action-button-hover-border-color", siteSettings.pageActionButtonHoverBorderColor || "#7dd3fc");
  document.documentElement.style.setProperty("--page-action-button-hover-shadow", siteSettings.pageActionButtonShadowEnabled ? `0 16px 38px ${applyOpacityToCssColor(siteSettings.pageActionButtonHoverShadowColor || "#38bdf8", siteSettings.pageActionButtonHoverShadowOpacity ?? 0.24)}` : "none");
  document.documentElement.style.setProperty("--page-action-button-hover-lift", `${siteSettings.pageActionButtonHoverLift || 1}px`);
  document.documentElement.style.setProperty("--page-action-button-hover-duration", `${siteSettings.pageActionButtonHoverDuration || 0.2}s`);
  document.documentElement.style.setProperty("--search-input-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.searchInputBackgroundType,
    position: siteSettings.searchInputBackgroundPosition,
    color1: siteSettings.searchInputBackgroundColor1,
    color2: siteSettings.searchInputBackgroundColor2,
    color3: siteSettings.searchInputBackgroundColor3,
    opacity: siteSettings.searchInputBackgroundOpacity ?? 1
  }) || "#ffffff");
  document.documentElement.style.setProperty("--search-input-text-color", siteSettings.searchInputTextColor || "#08111f");
  document.documentElement.style.setProperty("--search-input-placeholder-color", siteSettings.searchInputPlaceholderColor || "#64748b");
  document.documentElement.style.setProperty("--search-input-border-color", siteSettings.searchInputBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--search-input-focus-border-color", siteSettings.searchInputFocusBorderColor || "#38bdf8");
  document.documentElement.style.setProperty("--search-input-font", getResolvedFontFamily(siteSettings.searchInputFontCustom || siteSettings.searchInputFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--search-input-size", `${siteSettings.searchInputSize || 14}px`);
  document.documentElement.style.setProperty("--search-input-radius", `${siteSettings.searchInputRadius || 14}px`);
  document.documentElement.style.setProperty("--search-input-padding-y", `${siteSettings.searchInputPaddingY || 12}px`);
  document.documentElement.style.setProperty("--search-input-padding-x", `${siteSettings.searchInputPaddingX || 14}px`);
  document.documentElement.style.setProperty("--search-input-shadow", siteSettings.searchInputShadowEnabled ? `0 12px 26px ${applyOpacityToCssColor(siteSettings.searchInputShadowColor || "#020817", siteSettings.searchInputShadowOpacity ?? 0.16)}` : "none");
  document.documentElement.style.setProperty("--cart-button-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.cartButtonBackgroundType,
    position: siteSettings.cartButtonBackgroundPosition,
    color1: siteSettings.cartButtonBackgroundColor1,
    color2: siteSettings.cartButtonBackgroundColor2,
    color3: siteSettings.cartButtonBackgroundColor3,
    opacity: siteSettings.cartButtonBackgroundOpacity ?? 0.88
  }) || "rgba(15,23,42,.88)");
  document.documentElement.style.setProperty("--cart-button-text-color", siteSettings.cartButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--cart-button-border-color", siteSettings.cartButtonBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--cart-button-font", getResolvedFontFamily(siteSettings.cartButtonFontCustom || siteSettings.cartButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--cart-button-size", `${siteSettings.cartButtonSize || 14}px`);
  document.documentElement.style.setProperty("--cart-button-radius", `${siteSettings.cartButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--cart-button-padding-y", `${siteSettings.cartButtonPaddingY || 10}px`);
  document.documentElement.style.setProperty("--cart-button-padding-x", `${siteSettings.cartButtonPaddingX || 14}px`);
  document.documentElement.style.setProperty("--cart-button-shadow", siteSettings.cartButtonShadowEnabled ? `0 12px 28px ${applyOpacityToCssColor(siteSettings.cartButtonShadowColor || "#020817", siteSettings.cartButtonShadowOpacity ?? 0.18)}` : "none");
  document.documentElement.style.setProperty("--cart-button-hover-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.cartButtonHoverBackgroundType,
    position: siteSettings.cartButtonHoverBackgroundPosition,
    color1: siteSettings.cartButtonHoverBackgroundColor1,
    color2: siteSettings.cartButtonHoverBackgroundColor2,
    color3: siteSettings.cartButtonHoverBackgroundColor3,
    opacity: siteSettings.cartButtonHoverBackgroundOpacity ?? 0.34
  }) || "rgba(37,99,235,.34)");
  document.documentElement.style.setProperty("--cart-button-hover-text-color", siteSettings.cartButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--cart-button-hover-border-color", siteSettings.cartButtonHoverBorderColor || "#7dd3fc");
  document.documentElement.style.setProperty("--cart-button-hover-shadow", siteSettings.cartButtonShadowEnabled ? `0 16px 32px ${applyOpacityToCssColor(siteSettings.cartButtonHoverShadowColor || "#38bdf8", siteSettings.cartButtonHoverShadowOpacity ?? 0.18)}` : "none");
  document.documentElement.style.setProperty("--cart-button-hover-lift", `${siteSettings.cartButtonHoverLift || 1}px`);
  document.documentElement.style.setProperty("--cart-button-hover-duration", `${siteSettings.cartButtonHoverDuration || 0.2}s`);
  document.documentElement.style.setProperty("--profile-menu-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.profileMenuBackgroundType,
    position: siteSettings.profileMenuBackgroundPosition,
    color1: siteSettings.profileMenuBackgroundColor1,
    color2: siteSettings.profileMenuBackgroundColor2,
    color3: siteSettings.profileMenuBackgroundColor3,
    opacity: siteSettings.profileMenuBackgroundOpacity ?? 1
  }) || "#f8fbff");
  document.documentElement.style.setProperty("--profile-menu-text-color", siteSettings.profileMenuTextColor || "#0f172a");
  document.documentElement.style.setProperty("--profile-menu-border-color", siteSettings.profileMenuBorderColor || "#dbe4ee");
  document.documentElement.style.setProperty("--profile-menu-radius", `${siteSettings.profileMenuRadius || 18}px`);
  document.documentElement.style.setProperty("--profile-menu-shadow", siteSettings.profileMenuShadowEnabled ? `0 18px 42px ${applyOpacityToCssColor(siteSettings.profileMenuShadowColor || "#020817", siteSettings.profileMenuShadowOpacity ?? 0.24)}` : "none");
  document.documentElement.style.setProperty("--profile-menu-button-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.profileMenuButtonBackgroundType,
    position: siteSettings.profileMenuButtonBackgroundPosition,
    color1: siteSettings.profileMenuButtonBackgroundColor1,
    color2: siteSettings.profileMenuButtonBackgroundColor2,
    color3: siteSettings.profileMenuButtonBackgroundColor3,
    opacity: siteSettings.profileMenuButtonBackgroundOpacity ?? 0
  }) || "transparent");
  document.documentElement.style.setProperty("--profile-menu-button-text-color", siteSettings.profileMenuButtonTextColor || "#0f172a");
  document.documentElement.style.setProperty("--profile-menu-button-font", getResolvedFontFamily(siteSettings.profileMenuButtonFontCustom || siteSettings.profileMenuButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--profile-menu-button-size", `${siteSettings.profileMenuButtonSize || 14}px`);
  document.documentElement.style.setProperty("--profile-menu-button-radius", `${siteSettings.profileMenuButtonRadius || 12}px`);
  document.documentElement.style.setProperty("--profile-menu-button-padding-y", `${siteSettings.profileMenuButtonPaddingY || 10}px`);
  document.documentElement.style.setProperty("--profile-menu-button-padding-x", `${siteSettings.profileMenuButtonPaddingX || 12}px`);
  document.documentElement.style.setProperty("--profile-menu-button-hover-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.profileMenuButtonHoverBackgroundType,
    position: siteSettings.profileMenuButtonHoverBackgroundPosition,
    color1: siteSettings.profileMenuButtonHoverBackgroundColor1,
    color2: siteSettings.profileMenuButtonHoverBackgroundColor2,
    color3: siteSettings.profileMenuButtonHoverBackgroundColor3,
    opacity: siteSettings.profileMenuButtonHoverBackgroundOpacity ?? 1
  }) || "#dbeafe");
  document.documentElement.style.setProperty("--profile-menu-button-hover-text-color", siteSettings.profileMenuButtonHoverTextColor || "#0f172a");
  document.documentElement.style.setProperty("--catalog-button-background", applyOpacityToCssColor(siteSettings.catalogButtonBackground || "#ffffff", siteSettings.catalogButtonBackgroundOpacity ?? 0.08));
  document.documentElement.style.setProperty("--catalog-button-text-color", siteSettings.catalogButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--catalog-button-border-color", siteSettings.catalogButtonBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--catalog-button-font", getResolvedFontFamily(siteSettings.catalogButtonFontCustom || siteSettings.catalogButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--catalog-button-size", `${siteSettings.catalogButtonSize || 14}px`);
  document.documentElement.style.setProperty("--catalog-button-radius", `${siteSettings.catalogButtonRadius || 999}px`);
  document.documentElement.style.setProperty("--catalog-button-padding-y", `${siteSettings.catalogButtonPaddingY || 10}px`);
  document.documentElement.style.setProperty("--catalog-button-padding-x", `${siteSettings.catalogButtonPaddingX || 14}px`);
  document.documentElement.style.setProperty("--catalog-button-shadow", siteSettings.catalogButtonShadowEnabled ? `0 12px 24px ${applyOpacityToCssColor(siteSettings.catalogButtonShadowColor || "#020817", siteSettings.catalogButtonShadowOpacity ?? 0.16)}` : "none");
  document.documentElement.style.setProperty("--catalog-button-hover-background", applyOpacityToCssColor(siteSettings.catalogButtonHoverBackground || "#22d3ee", siteSettings.catalogButtonHoverBackgroundOpacity ?? 0.16));
  document.documentElement.style.setProperty("--catalog-button-hover-text-color", siteSettings.catalogButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--catalog-button-hover-border-color", siteSettings.catalogButtonHoverBorderColor || "#7dd3fc");
  document.documentElement.style.setProperty("--avatar-border-color", "rgba(56,189,248,.6)");
  document.documentElement.style.setProperty("--product-card-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.productCardBackgroundType,
    position: siteSettings.productCardBackgroundPosition,
    color1: siteSettings.productCardBackgroundColor1,
    color2: siteSettings.productCardBackgroundColor2,
    color3: siteSettings.productCardBackgroundColor3,
    opacity: siteSettings.productCardBackgroundOpacity ?? 0.09
  }) || "linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04))");
  document.documentElement.style.setProperty("--product-card-solid-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.productCardBackgroundType,
    position: siteSettings.productCardBackgroundPosition,
    color1: siteSettings.productCardBackgroundColor1,
    color2: siteSettings.productCardBackgroundColor2,
    color3: siteSettings.productCardBackgroundColor3,
    opacity: 1
  }) || "linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.92))");
  document.documentElement.style.setProperty("--product-border-color", siteSettings.productBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--product-title-color", siteSettings.productTitleColor || "#f8fbff");
  document.documentElement.style.setProperty("--product-description-color", siteSettings.productDescriptionColor || "#d5e2ef");
  document.documentElement.style.setProperty("--product-title-font", getResolvedFontFamily(siteSettings.productTitleFontCustom || siteSettings.productTitleFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-title-size", `${siteSettings.productTitleSize || 18}px`);
  document.documentElement.style.setProperty("--product-description-font", getResolvedFontFamily(siteSettings.productDescriptionFontCustom || siteSettings.productDescriptionFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-description-size", `${siteSettings.productDescriptionSize || 14}px`);
  document.documentElement.style.setProperty("--product-price-color", siteSettings.productPriceColor || "#7dd3fc");
  document.documentElement.style.setProperty("--product-price-font", getResolvedFontFamily(siteSettings.productPriceFontCustom || siteSettings.productPriceFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-price-size", `${siteSettings.productPriceSize || 22}px`);
  document.documentElement.style.setProperty("--product-price-mobile-size", `${siteSettings.productPriceMobileSize || 15}px`);
  document.documentElement.style.setProperty("--product-old-price-color", siteSettings.productOldPriceColor || "#94a3b8");
  document.documentElement.style.setProperty("--product-offer-color", siteSettings.productOfferColor || "#fdba74");
  document.documentElement.style.setProperty("--product-offer-font", getResolvedFontFamily(siteSettings.productOfferFontCustom || siteSettings.productOfferFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-offer-size", `${siteSettings.productOfferSize || 14}px`);
  document.documentElement.style.setProperty("--product-button-background", applyOpacityToCssColor(siteSettings.productButtonBackground || "#2563eb", siteSettings.productButtonBackgroundOpacity ?? 0.28));
  document.documentElement.style.setProperty("--product-button-text-color", siteSettings.productButtonTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--product-button-border-color", siteSettings.productButtonBorderColor || "#bfdbfe");
  document.documentElement.style.setProperty("--product-button-radius", `${siteSettings.productButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--product-button-font", getResolvedFontFamily(siteSettings.productButtonFontCustom || siteSettings.productButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-button-size", `${siteSettings.productButtonSize || 14}px`);
  document.documentElement.style.setProperty("--product-button-shadow", siteSettings.productButtonShadowEnabled ? `0 12px 24px ${applyOpacityToCssColor(siteSettings.productButtonShadowColor || "#020817", siteSettings.productButtonShadowOpacity ?? 0.18)}` : "none");
  document.documentElement.style.setProperty("--product-button-hover-background", applyOpacityToCssColor(siteSettings.productButtonHoverBackground || "#22d3ee", siteSettings.productButtonHoverBackgroundOpacity ?? 0.22));
  document.documentElement.style.setProperty("--product-button-hover-text-color", siteSettings.productButtonHoverTextColor || "#f8fbff");
  document.documentElement.style.setProperty("--product-button-hover-border-color", siteSettings.productButtonHoverBorderColor || "#7dd3fc");
  document.documentElement.style.setProperty("--product-hint-background", applyOpacityToCssColor(siteSettings.productImageHintBackground || "#020817", siteSettings.productImageHintBackgroundOpacity ?? 0.72));
  document.documentElement.style.setProperty("--product-hint-text-color", siteSettings.productImageHintTextColor || "#ffffff");
  document.documentElement.style.setProperty("--product-hint-border-color", applyOpacityToCssColor(siteSettings.productImageHintBorderColor || "#ffffff", siteSettings.productImageHintBorderOpacity ?? 0));
  document.documentElement.style.setProperty("--product-hint-font", getResolvedFontFamily(siteSettings.productImageHintFontCustom || siteSettings.productImageHintFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-hint-size", `${siteSettings.productImageHintSize || 11}px`);
  document.documentElement.style.setProperty("--product-hint-radius", `${siteSettings.productImageHintRadius || 999}px`);
  document.documentElement.style.setProperty("--product-hint-shadow", siteSettings.productImageHintShadowEnabled ? `0 10px 22px ${applyOpacityToCssColor(siteSettings.productImageHintShadowColor || "#020817", siteSettings.productImageHintShadowOpacity ?? 0.18)}` : "none");
  document.documentElement.style.setProperty("--product-state-available-background", applyOpacityToCssColor(siteSettings.productStateAvailableBackground || "#22c55e", siteSettings.productStateAvailableOpacity ?? 0.94));
  document.documentElement.style.setProperty("--product-state-unavailable-background", applyOpacityToCssColor(siteSettings.productStateUnavailableBackground || "#ef4444", siteSettings.productStateUnavailableOpacity ?? 0.94));
  document.documentElement.style.setProperty("--product-state-text-color", siteSettings.productStateTextColor || "#ffffff");
  document.documentElement.style.setProperty("--product-state-font", getResolvedFontFamily(siteSettings.productStateFontCustom || siteSettings.productStateFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--product-state-size", `${siteSettings.productStateSize || 12}px`);
  document.documentElement.style.setProperty("--product-state-radius", `${siteSettings.productStateRadius || 999}px`);
  document.documentElement.style.setProperty("--product-gallery-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.productGalleryBackgroundType,
    position: siteSettings.productGalleryBackgroundPosition,
    color1: siteSettings.productGalleryBackgroundColor1,
    color2: siteSettings.productGalleryBackgroundColor2,
    color3: siteSettings.productGalleryBackgroundColor3,
    opacity: siteSettings.productGalleryBackgroundOpacity ?? 0.98
  }) || "rgba(248,250,252,.98)");
  document.documentElement.style.setProperty("--product-gallery-text-color", siteSettings.productGalleryTextColor || "#0f172a");
  document.documentElement.style.setProperty("--product-gallery-border-color", siteSettings.productGalleryBorderColor || "#dbe4ee");
  document.documentElement.style.setProperty("--product-gallery-radius", `${siteSettings.productGalleryRadius || 24}px`);
  document.documentElement.style.setProperty("--product-gallery-shadow", siteSettings.productGalleryShadowEnabled ? `0 20px 48px ${applyOpacityToCssColor(siteSettings.productGalleryShadowColor || "#020817", siteSettings.productGalleryShadowOpacity ?? 0.32)}` : "none");
  document.documentElement.style.setProperty("--product-gallery-bg-image", siteSettings.productGalleryBackgroundImage ? `url("${escapeCssUrl(siteSettings.productGalleryBackgroundImage)}")` : "none");
  document.documentElement.style.setProperty("--product-gallery-bg-image-opacity", String(siteSettings.productGalleryBackgroundImageOpacity ?? 0.24));
  document.documentElement.style.setProperty("--product-gallery-swap-duration", `${siteSettings.productGallerySwapDuration || 0.28}s`);
  document.documentElement.style.setProperty("--ui-panel-base-background", applyOpacityToCssColor(siteSettings.uiPanelBaseBackgroundColor || "#fbfdff", siteSettings.uiPanelBaseBackgroundOpacity ?? 1));
  document.documentElement.style.setProperty("--ui-panel-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.uiPanelBackgroundType,
    position: siteSettings.uiPanelBackgroundPosition,
    color1: siteSettings.uiPanelBackgroundColor1,
    color2: siteSettings.uiPanelBackgroundColor2,
    color3: siteSettings.uiPanelBackgroundColor3,
    opacity: siteSettings.uiPanelBackgroundOpacity ?? 1
  }) || "#fbfdff");
  document.documentElement.style.setProperty("--ui-panel-text-color", siteSettings.uiPanelTextColor || "#0f172a");
  document.documentElement.style.setProperty("--ui-panel-muted-text-color", siteSettings.uiPanelMutedTextColor || "#475569");
  document.documentElement.style.setProperty("--ui-panel-title-color", siteSettings.uiPanelTitleColor || "#0f172a");
  document.documentElement.style.setProperty("--ui-panel-border-color", siteSettings.uiPanelBorderColor || "#dbe4ee");
  document.documentElement.style.setProperty("--ui-panel-radius", `${siteSettings.uiPanelRadius || 24}px`);
  document.documentElement.style.setProperty("--ui-panel-shadow", siteSettings.uiPanelShadowEnabled ? `0 18px 42px ${applyOpacityToCssColor(siteSettings.uiPanelShadowColor || "#020817", siteSettings.uiPanelShadowOpacity ?? 0.22)}` : "none");
  document.documentElement.style.setProperty("--ui-panel-font", getResolvedFontFamily(siteSettings.uiPanelFontCustom || siteSettings.uiPanelFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--ui-panel-button-base-background", applyOpacityToCssColor(siteSettings.uiPanelButtonBaseBackgroundColor || "#eef4fb", siteSettings.uiPanelButtonBaseBackgroundOpacity ?? 1));
  document.documentElement.style.setProperty("--ui-panel-button-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.uiPanelButtonBackgroundType,
    position: siteSettings.uiPanelButtonBackgroundPosition,
    color1: siteSettings.uiPanelButtonBackgroundColor1,
    color2: siteSettings.uiPanelButtonBackgroundColor2,
    color3: siteSettings.uiPanelButtonBackgroundColor3,
    opacity: siteSettings.uiPanelButtonBackgroundOpacity ?? 1
  }) || "#dbe7f6");
  document.documentElement.style.setProperty("--ui-panel-button-text-color", siteSettings.uiPanelButtonTextColor || "#0f172a");
  document.documentElement.style.setProperty("--ui-panel-button-border-color", siteSettings.uiPanelButtonBorderColor || "#cbd5e1");
  document.documentElement.style.setProperty("--ui-panel-button-font", getResolvedFontFamily(siteSettings.uiPanelButtonFontCustom || siteSettings.uiPanelButtonFontFamily || "Manrope"));
  document.documentElement.style.setProperty("--ui-panel-button-size", `${siteSettings.uiPanelButtonSize || 14}px`);
  document.documentElement.style.setProperty("--ui-panel-button-radius", `${siteSettings.uiPanelButtonRadius || 14}px`);
  document.documentElement.style.setProperty("--ui-panel-button-padding-y", `${siteSettings.uiPanelButtonPaddingY || 10}px`);
  document.documentElement.style.setProperty("--ui-panel-button-padding-x", `${siteSettings.uiPanelButtonPaddingX || 12}px`);
  document.documentElement.style.setProperty("--ui-panel-button-shadow", siteSettings.uiPanelButtonShadowEnabled ? `0 12px 28px ${applyOpacityToCssColor(siteSettings.uiPanelButtonShadowColor || "#020817", siteSettings.uiPanelButtonShadowOpacity ?? 0.16)}` : "none");
  document.documentElement.style.setProperty("--ui-panel-button-hover-base-background", applyOpacityToCssColor(siteSettings.uiPanelButtonHoverBaseBackgroundColor || "#dbeafe", siteSettings.uiPanelButtonHoverBaseBackgroundOpacity ?? 1));
  document.documentElement.style.setProperty("--ui-panel-button-hover-background", buildGradientBackground({
    enabled: true,
    type: siteSettings.uiPanelButtonHoverBackgroundType,
    position: siteSettings.uiPanelButtonHoverBackgroundPosition,
    color1: siteSettings.uiPanelButtonHoverBackgroundColor1,
    color2: siteSettings.uiPanelButtonHoverBackgroundColor2,
    color3: siteSettings.uiPanelButtonHoverBackgroundColor3,
    opacity: siteSettings.uiPanelButtonHoverBackgroundOpacity ?? 1
  }) || "#dbeafe");
  document.documentElement.style.setProperty("--ui-panel-button-hover-text-color", siteSettings.uiPanelButtonHoverTextColor || "#0f172a");
  document.documentElement.style.setProperty("--ui-panel-button-hover-border-color", siteSettings.uiPanelButtonHoverBorderColor || "#93c5fd");
  document.documentElement.style.setProperty("--ui-panel-button-hover-lift", `${siteSettings.uiPanelButtonHoverLift || 1}px`);
  document.documentElement.style.setProperty("--ui-panel-button-hover-duration", `${siteSettings.uiPanelButtonHoverDuration || 0.2}s`);

  const hasImage = Boolean(siteSettings.pageBackgroundImage?.trim());
  document.documentElement.style.setProperty("--page-bg-image", hasImage ? `url("${escapeCssUrl(siteSettings.pageBackgroundImage.trim())}")` : "none");
  document.documentElement.style.setProperty("--page-bg-position", siteSettings.pageBackgroundImagePosition || "center center");
  document.documentElement.style.setProperty("--page-bg-fit", siteSettings.pageBackgroundImageFit || "cover");
  document.documentElement.style.setProperty("--page-bg-repeat", siteSettings.pageBackgroundImageRepeat || "no-repeat");
  document.documentElement.style.setProperty("--page-bg-attachment", siteSettings.pageBackgroundImageAttachment || "scroll");
  document.documentElement.style.setProperty("--page-bg-image-opacity", hasImage ? String(siteSettings.pageBackgroundImageOpacity ?? 1) : "0");
  document.documentElement.style.setProperty("--page-bg-image-brightness", String(siteSettings.pageBackgroundImageBrightness ?? 1));
  document.documentElement.style.setProperty("--page-bg-overlay", hasImage ? buildPageOverlay(siteSettings) : "transparent");

  applyProductGalleryAppearance();
  renderBranding();
  applyUserVisualTheme();
  renderUserThemeModal();
  syncStickyOffsets();
}

function syncSiteSettings(nextSettings = {}) {
  siteSettings = {
    ...defaultSiteSettings,
    ...nextSettings,
    customFonts: Array.isArray(nextSettings.customFonts) ? nextSettings.customFonts : defaultSiteSettings.customFonts,
    userThemePresets: normalizeUserThemePresets(nextSettings.userThemePresets || defaultSiteSettings.userThemePresets),
    heroCards: Array.isArray(nextSettings.heroCards)
      ? nextSettings.heroCards
      : defaultSiteSettings.heroCards
  };
  window.siteSettings = siteSettings;
  applySiteAppearance();
  renderHero();
}

window.syncSiteSettings = syncSiteSettings;

/* QUE HACE: Aplica el preset visual elegido por cada usuario autenticado, incluyendo el boss.
   POR QUE SE HIZO: Mantiene una experiencia personalizada sin tocar la configuracion global del cliente.
   COMO MODIFICARLO: Si quieres que esto se guarde en backend, reemplaza localStorage por tu API. */
function getUserThemePresetById(themeId = "", presets = siteSettings.userThemePresets || []) {
  return normalizeUserThemePresets(presets).find((preset) => preset.id === themeId) || null;
}

function applyUserVisualTheme() {
  if (!canUseUserThemeCustomization()) return;
  const selectedThemeId = getStoredUserThemePreference(usuarioActual);
  if (!selectedThemeId) return;
  const preset = getUserThemePresetById(selectedThemeId);
  if (!preset) {
    clearStoredUserThemePreference(usuarioActual);
    return;
  }

  /* ESTE TEMA PERSONAL NO TOCA EL FONDO GENERAL DE LA PAGINA.
     Solo recolorea paneles, botones, bordes y superficies internas del perfil del usuario. */
  const panelTextColor = getReadableTextColor(preset.panelBackgroundColor1);
  const panelMutedTextColor = getReadableMutedTextColor(preset.panelBackgroundColor1);
  const buttonTextColor = getReadableTextColor(preset.pageBackgroundColor1);
  const buttonHoverTextColor = getReadableTextColor(preset.pageBackgroundColor2 || preset.pageBackgroundColor1);
  const subtleBorder = applyOpacityToCssColor(preset.panelBorderColor, 0.36);
  const subtleShadow = `0 10px 24px ${applyOpacityToCssColor(preset.productShadowColor, 0.08)}`;
  const subtleHoverShadow = `0 12px 26px ${applyOpacityToCssColor(preset.productHoverShadowColor, 0.12)}`;
  document.documentElement.style.setProperty("--ui-panel-base-background", preset.panelBackgroundColor1);
  document.documentElement.style.setProperty("--ui-panel-background", `linear-gradient(180deg, ${preset.panelBackgroundColor1}, ${preset.panelBackgroundColor2})`);
  document.documentElement.style.setProperty("--ui-panel-text-color", panelTextColor);
  document.documentElement.style.setProperty("--ui-panel-muted-text-color", panelMutedTextColor);
  document.documentElement.style.setProperty("--ui-panel-title-color", panelTextColor);
  document.documentElement.style.setProperty("--ui-panel-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--ui-panel-button-base-background", preset.pageBackgroundColor1);
  document.documentElement.style.setProperty("--ui-panel-button-background", `linear-gradient(135deg, ${preset.pageBackgroundColor1}, ${preset.pageBackgroundColor2})`);
  document.documentElement.style.setProperty("--ui-panel-button-text-color", buttonTextColor);
  document.documentElement.style.setProperty("--ui-panel-button-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--ui-panel-button-hover-base-background", preset.pageBackgroundColor2);
  document.documentElement.style.setProperty("--ui-panel-button-hover-background", `linear-gradient(135deg, ${preset.pageBackgroundColor2}, ${preset.pageBackgroundColor3})`);
  document.documentElement.style.setProperty("--ui-panel-button-hover-text-color", buttonHoverTextColor);
  document.documentElement.style.setProperty("--ui-panel-button-hover-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--profile-menu-background", `linear-gradient(180deg, ${preset.panelBackgroundColor1}, ${preset.panelBackgroundColor2})`);
  document.documentElement.style.setProperty("--profile-menu-text-color", panelTextColor);
  document.documentElement.style.setProperty("--profile-menu-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--profile-menu-button-background", `linear-gradient(135deg, ${preset.pageBackgroundColor1}, ${preset.pageBackgroundColor2})`);
  document.documentElement.style.setProperty("--profile-menu-button-text-color", buttonTextColor);
  document.documentElement.style.setProperty("--profile-menu-button-hover-background", `linear-gradient(135deg, ${preset.pageBackgroundColor2}, ${preset.pageBackgroundColor3})`);
  document.documentElement.style.setProperty("--profile-menu-button-hover-text-color", buttonHoverTextColor);
  document.documentElement.style.setProperty("--catalog-button-background", `linear-gradient(135deg, ${preset.pageBackgroundColor1}, ${preset.pageBackgroundColor2})`);
  document.documentElement.style.setProperty("--catalog-button-text-color", buttonTextColor);
  document.documentElement.style.setProperty("--catalog-button-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--catalog-button-hover-background", `linear-gradient(135deg, ${preset.pageBackgroundColor2}, ${preset.pageBackgroundColor3})`);
  document.documentElement.style.setProperty("--catalog-button-hover-text-color", buttonHoverTextColor);
  document.documentElement.style.setProperty("--catalog-button-hover-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--search-input-background", `linear-gradient(135deg, #ffffff, ${applyOpacityToCssColor(preset.panelBorderColor, 0.10)})`);
  document.documentElement.style.setProperty("--search-input-text-color", "#08111f");
  document.documentElement.style.setProperty("--search-input-placeholder-color", "#475569");
  document.documentElement.style.setProperty("--search-input-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--search-input-focus-border-color", preset.productBorderColor);
  document.documentElement.style.setProperty("--search-input-shadow", `0 8px 18px ${applyOpacityToCssColor(preset.productShadowColor, 0.08)}`);
  document.documentElement.style.setProperty("--avatar-border-color", preset.panelBorderColor);
  document.documentElement.style.setProperty("--line", subtleBorder);
  document.documentElement.style.setProperty("--shadow", subtleShadow);
  document.documentElement.style.setProperty("--ui-panel-shadow", subtleShadow);
  document.documentElement.style.setProperty("--ui-panel-button-shadow", subtleShadow);
  document.documentElement.style.setProperty("--page-action-button-shadow", subtleShadow);
  document.documentElement.style.setProperty("--page-action-button-hover-shadow", subtleHoverShadow);
  document.documentElement.style.setProperty("--header-button-shadow", subtleShadow);
  document.documentElement.style.setProperty("--header-button-hover-shadow", subtleHoverShadow);
  document.documentElement.style.setProperty("--catalog-button-shadow", subtleShadow);
  document.documentElement.style.setProperty("--catalog-button-hover-shadow", subtleHoverShadow);
  document.documentElement.style.setProperty("--cart-button-shadow", subtleShadow);
  document.documentElement.style.setProperty("--cart-button-hover-shadow", subtleHoverShadow);
  document.documentElement.style.setProperty("--profile-menu-shadow", subtleShadow);
  document.documentElement.style.setProperty("--product-border-color", preset.productBorderColor);
  document.documentElement.style.setProperty("--product-shadow-color", applyOpacityToCssColor(preset.productShadowColor, 0.10));
  document.documentElement.style.setProperty("--product-hover-shadow-color", applyOpacityToCssColor(preset.productHoverShadowColor, 0.14));
  document.documentElement.style.setProperty("--product-gallery-border-color", preset.productGalleryBorderColor);
  document.documentElement.style.setProperty("--product-gallery-shadow", `0 14px 28px ${applyOpacityToCssColor(preset.productShadowColor, 0.12)}`);
}

/* QUE HACE: Renderiza las variantes visuales permitidas para que el usuario elija su preferencia.
   POR QUE SE HIZO: La personalizacion por perfil debe ser limitada, legible y persistente.
   COMO MODIFICARLO: Los presets los define el builder en Pantalla; aqui solo se muestran y aplican. */
function renderUserThemeModal() {
  const grid = document.getElementById("userThemePresetGrid");
  const currentLabel = document.getElementById("userThemeCurrentLabel");
  if (!grid || !currentLabel) return;

  if (!canUseUserThemeCustomization()) {
    grid.innerHTML = "";
    currentLabel.textContent = "";
    return;
  }

  const presets = normalizeUserThemePresets(siteSettings.userThemePresets || defaultSiteSettings.userThemePresets);
  const activeId = getStoredUserThemePreference(usuarioActual);
  const activePreset = getUserThemePresetById(activeId, presets);
  currentLabel.textContent = activePreset
    ? `Tema visual actual de tus paneles: ${activePreset.label}`
    : "Tema visual actual de tus paneles: Default del sitio";

  grid.innerHTML = presets.map((preset) => `
    <article class="user-theme-card ${preset.id === activeId ? "is-active" : ""}">
      <div class="user-theme-preview" style="background:linear-gradient(180deg, ${escapeHtmlAttribute(preset.panelBackgroundColor1)}, ${escapeHtmlAttribute(preset.panelBackgroundColor2)}); border-color:${escapeHtmlAttribute(preset.panelBorderColor)};"></div>
      <span class="user-theme-chip">${escapeHtmlAttribute(preset.group === "femenino" ? "Femenino" : preset.group === "masculino" ? "Masculino" : "Personalizado")}</span>
      <h3>${escapeHtmlAttribute(preset.label)}</h3>
      <p>Solo cambia paneles, botones, bordes y superficies internas de tu cuenta con texto legible.</p>
      <button type="button" onclick="seleccionarTemaUsuario('${escapeHtmlAttribute(preset.id)}')">${preset.id === activeId ? "Tema activo" : "Usar este tema"}</button>
    </article>
  `).join("");
}

/* QUE HACE: Abre el modal de personalizacion visual del usuario actual.
   POR QUE SE HIZO: La preferencia debe verse inmediatamente y quedar separada de la configuracion global.
   COMO MODIFICARLO: Si luego lo guardas en backend, conserva esta UI y cambia solo la persistencia. */
function abrirPersonalizacionUsuario() {
  if (!canUseUserThemeCustomization()) {
    mostrarMensaje("Esta cuenta no tiene acceso a personalizacion visual.");
    return;
  }
  renderUserThemeModal();
  openModal("userThemeModal");
}

function cerrarPersonalizacionUsuario() {
  closeModal("userThemeModal");
}

/* QUE HACE: Guarda y aplica el preset elegido por el usuario registrado.
   POR QUE SE HIZO: Hace que la preferencia sobreviva al cierre de sesion y vuelva al entrar.
   COMO MODIFICARLO: Reemplaza localStorage por tu backend si quieres sincronizar entre dispositivos. */
async function seleccionarTemaUsuario(themeId = "") {
  if (!canUseUserThemeCustomization()) return;
  await persistUserThemePreference(themeId, usuarioActual);
  applySiteAppearance();
  renderUserThemeModal();
}

async function restablecerTemaUsuarioDefault() {
  if (!canUseUserThemeCustomization()) return;
  await clearStoredUserThemePreference(usuarioActual);
  applySiteAppearance();
  renderUserThemeModal();
}

/* QUE HACE: Controla el acceso del boss al panel de inteligencia comercial.
   POR QUE SE HIZO: Solo el boss debe ver el resumen global de pedidos, carritos y favoritos.
   COMO MODIFICARLO: Si luego quieres abrir este panel a administradores, agrega el rol aqui. */
function canViewBossAnalytics() {
  return roleHasPermission(getCurrentUserRole(), "analytics") || (adminSession.active && roleHasPermission(adminSession.role, "analytics"));
}

function canOpenAdminControlCenter() {
  return roleHasPermission(getCurrentUserRole(), "controlCenter") || (adminSession.active && roleHasPermission(adminSession.role, "controlCenter"));
}

function isBossAnalyticsModalOpen() {
  const modal = document.getElementById("bossInsightsModal");
  return Boolean(modal && modal.style.display === "flex");
}

function getBossAnalyticsMetricLabel(metric = bossAnalyticsState.metric) {
  if (metric === "carritos") return "Mas agregados al carrito";
  if (metric === "favoritos") return "Mas agregados a favoritos";
  return "Mas pedidos";
}

function getBossAnalyticsPeriodLabel(period = bossAnalyticsState.period) {
  if (period === "week") return "Esta semana";
  if (period === "month") return "Este mes";
  if (period === "year") return "Este ano";
  if (period === "custom") return bossAnalyticsState.customDate ? `Fecha ${bossAnalyticsState.customDate}` : "Fecha elegida";
  return "Todo el tiempo";
}

function getBossAnalyticsRecordDate(record = {}) {
  const raw = record.fecha || record.created_at || record.updated_at || record.inserted_at || "";
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getBossAnalyticsResetDate() {
  const raw = readLocalJson(ADMIN_LOCAL_KEYS.analyticsResetAt, "");
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesBossAnalyticsPeriod(record = {}, useSnapshotFallback = true) {
  const date = getBossAnalyticsRecordDate(record);
  const resetDate = getBossAnalyticsResetDate();
  if (resetDate && (!date || date < resetDate)) return false;
  if (bossAnalyticsState.period === "all") return true;
  if (!date) return useSnapshotFallback;

  const now = new Date();
  if (bossAnalyticsState.period === "custom") {
    if (!bossAnalyticsState.customDate) return true;
    const selectedDate = new Date(`${bossAnalyticsState.customDate}T00:00:00`);
    return date.getFullYear() === selectedDate.getFullYear()
      && date.getMonth() === selectedDate.getMonth()
      && date.getDate() === selectedDate.getDate();
  }
  if (bossAnalyticsState.period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (bossAnalyticsState.period === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (bossAnalyticsState.period === "year") {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
}

function getCatalogNameForProduct(productName = "") {
  const foundCatalog = catalogos.find((catalogo) => Array.isArray(catalogo.productos) && catalogo.productos.some((product) => product.nombre === productName));
  return foundCatalog?.nombre || "Sin catalogo asignado";
}

function getProductCatalogOrder(productName = "") {
  const index = catalogos.findIndex((catalogo) => Array.isArray(catalogo.productos) && catalogo.productos.some((product) => product.nombre === productName));
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

async function fetchBossAnalyticsSource() {
  const [carritoResult, favoritosResult, pedidosResult] = await Promise.all([
    supabaseClient.from(TABLES.carrito).select("*"),
    supabaseClient.from(TABLES.favoritos).select("*"),
    supabaseClient.from(TABLES.pedidos).select("*")
  ]);
  return {
    carrito: Array.isArray(carritoResult?.data) ? carritoResult.data : [],
    favoritos: Array.isArray(favoritosResult?.data) ? favoritosResult.data : [],
    pedidos: Array.isArray(pedidosResult?.data) ? pedidosResult.data : []
  };
}

function getBossAnalyticsMetricValue(entry, metric = bossAnalyticsState.metric) {
  if (metric === "carritos") return entry.carritos;
  if (metric === "favoritos") return entry.favoritosUsuarios;
  return entry.pedidos;
}

function buildBossAnalyticsAggregation(source = bossAnalyticsState.source || { carrito: [], favoritos: [], pedidos: [] }) {
  const entryMap = new Map();

  function ensureEntry(productName = "") {
    if (!entryMap.has(productName)) {
      entryMap.set(productName, {
        nombre: productName,
        catalogo: getCatalogNameForProduct(productName),
        catalogOrder: getProductCatalogOrder(productName),
        pedidos: 0,
        pedidoEventos: 0,
        carritos: 0,
        favoritosUsuarios: 0,
        favoriteUsers: new Set(),
        cartUsers: new Set()
      });
    }
    return entryMap.get(productName);
  }

  catalogos.forEach((catalogo, catalogIndex) => {
    (catalogo.productos || []).forEach((product) => {
      entryMap.set(product.nombre, {
        nombre: product.nombre,
        catalogo: catalogo.nombre,
        catalogOrder: catalogIndex,
        pedidos: 0,
        pedidoEventos: 0,
        carritos: 0,
        favoritosUsuarios: 0,
        favoriteUsers: new Set(),
        cartUsers: new Set()
      });
    });
  });

  (source.favoritos || []).forEach((favorite) => {
    if (!matchesBossAnalyticsPeriod(favorite, true)) return;
    const entry = ensureEntry(favorite.producto_id || favorite.nombre || "");
    if (!entry.nombre) return;
    const userId = String(favorite.usuario_id || favorite.user_id || favorite.username || `fav_${entry.nombre}`);
    entry.favoriteUsers.add(userId);
    entry.favoritosUsuarios = entry.favoriteUsers.size;
  });

  (source.carrito || []).forEach((cartItem) => {
    if (!matchesBossAnalyticsPeriod(cartItem, true)) return;
    const entry = ensureEntry(cartItem.producto_id || cartItem.nombre || "");
    if (!entry.nombre) return;
    entry.carritos += Number(cartItem.cantidad || 1);
    const userId = String(cartItem.usuario_id || cartItem.user_id || cartItem.username || `cart_${entry.nombre}`);
    entry.cartUsers.add(userId);
  });

  (source.pedidos || []).forEach((pedido) => {
    if (!matchesBossAnalyticsPeriod(pedido, false)) return;
    const seenInOrder = new Set();
    (Array.isArray(pedido.productos) ? pedido.productos : []).forEach((productLine) => {
      const productName = productLine.nombre || productLine.producto_id || "";
      const entry = ensureEntry(productName);
      if (!entry.nombre) return;
      entry.pedidos += Number(productLine.cantidad || 1);
      if (!seenInOrder.has(productName)) {
        entry.pedidoEventos += 1;
        seenInOrder.add(productName);
      }
    });
  });

  const groupedMap = new Map();
  entryMap.forEach((entry) => {
    entry.favoritosUsuarios = entry.favoriteUsers.size;
    delete entry.favoriteUsers;
    delete entry.cartUsers;
    if (!groupedMap.has(entry.catalogo)) {
      groupedMap.set(entry.catalogo, {
        catalogo: entry.catalogo,
        catalogOrder: entry.catalogOrder,
        productos: []
      });
    }
    groupedMap.get(entry.catalogo).productos.push(entry);
  });

  const grouped = [...groupedMap.values()]
    .sort((a, b) => a.catalogOrder - b.catalogOrder || a.catalogo.localeCompare(b.catalogo))
    .map((group) => {
      group.productos.sort((a, b) =>
        getBossAnalyticsMetricValue(b) - getBossAnalyticsMetricValue(a) ||
        b.pedidos - a.pedidos ||
        b.carritos - a.carritos ||
        b.favoritosUsuarios - a.favoritosUsuarios ||
        a.nombre.localeCompare(b.nombre)
      );
      return group;
    });

  const renderedRows = [];
  grouped.forEach((group) => {
    group.productos.forEach((product, index) => {
      renderedRows.push({
        catalogo: group.catalogo,
        nombre: product.nombre,
        pedidos: product.pedidos,
        pedidoEventos: product.pedidoEventos,
        carritos: product.carritos,
        favoritosUsuarios: product.favoritosUsuarios,
        isTop: index === 0 && getBossAnalyticsMetricValue(product) > 0
      });
    });
  });

  return { grouped, renderedRows };
}

function renderBossAnalyticsPanel() {
  const list = document.getElementById("bossInsightsList");
  const summary = document.getElementById("bossInsightsSummary");
  const metricSelect = document.getElementById("bossInsightsMetric");
  const periodSelect = document.getElementById("bossInsightsPeriod");
  const customDate = document.getElementById("bossInsightsDate");
  if (!list || !summary || !metricSelect || !periodSelect || !customDate) return;

  metricSelect.value = bossAnalyticsState.metric;
  periodSelect.value = bossAnalyticsState.period;
  customDate.value = bossAnalyticsState.customDate || new Date().toISOString().slice(0, 10);
  customDate.classList.toggle("hidden", bossAnalyticsState.period !== "custom");

  const aggregation = buildBossAnalyticsAggregation();
  bossAnalyticsState.renderedRows = aggregation.renderedRows;

  summary.textContent = `${getBossAnalyticsMetricLabel()} · ${getBossAnalyticsPeriodLabel()} · ${aggregation.renderedRows.length} productos en la lista`;

  if (!aggregation.grouped.length) {
    list.innerHTML = `<div class="boss-analytics-empty">Aun no hay datos para mostrar con el filtro actual.</div>`;
    return;
  }

  list.innerHTML = aggregation.grouped.map((group) => `
    <section class="boss-analytics-catalog">
      <div class="boss-analytics-catalog-head">
        <h3>${escapeHtmlAttribute(group.catalogo)}</h3>
        <span>${group.productos.length} producto(s)</span>
      </div>
      <div class="boss-analytics-product-list">
        ${group.productos.map((product) => `
          <article class="boss-analytics-item">
            <div class="boss-analytics-item-main">
              <strong>${product.pedidos > 0 && group.productos[0]?.nombre === product.nombre ? "🔥 " : ""}${escapeHtmlAttribute(product.nombre)}</strong>
              <div class="boss-analytics-meta">
                <span>Pedidos: ${product.pedidos}</span>
                <span>Carrito: ${product.carritos}</span>
                <span>❤ ${product.favoritosUsuarios}</span>
              </div>
            </div>
            <div class="boss-analytics-badges">
              <span class="boss-analytics-badge primary">${getBossAnalyticsMetricLabel(bossAnalyticsState.metric)}: ${getBossAnalyticsMetricValue(product, bossAnalyticsState.metric)}</span>
              <span class="boss-analytics-badge">Eventos de pedido: ${product.pedidoEventos}</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

async function refreshBossAnalyticsPanel(forceReload = true) {
  if (!canViewBossAnalytics()) return;
  if (forceReload || !bossAnalyticsState.source) {
    bossAnalyticsState.source = await fetchBossAnalyticsSource();
  }
  renderBossAnalyticsPanel();
}

function handleBossAnalyticsFiltersChange() {
  const metricSelect = document.getElementById("bossInsightsMetric");
  const periodSelect = document.getElementById("bossInsightsPeriod");
  const customDate = document.getElementById("bossInsightsDate");
  bossAnalyticsState.metric = metricSelect?.value || "pedidos";
  bossAnalyticsState.period = periodSelect?.value || "month";
  bossAnalyticsState.customDate = customDate?.value || "";
  renderBossAnalyticsPanel();
}

function stopBossAnalyticsRefreshLoop() {
  if (bossAnalyticsState.refreshTimer) {
    clearInterval(bossAnalyticsState.refreshTimer);
    bossAnalyticsState.refreshTimer = null;
  }
}

function startBossAnalyticsRefreshLoop() {
  stopBossAnalyticsRefreshLoop();
  bossAnalyticsState.refreshTimer = setInterval(() => {
    if (!isBossAnalyticsModalOpen()) {
      stopBossAnalyticsRefreshLoop();
      return;
    }
    refreshBossAnalyticsPanel(true);
  }, 30000);
}

async function abrirAnaliticaBoss() {
  if (!canViewBossAnalytics()) {
    mostrarMensaje("Solo el boss puede ver este panel.");
    return;
  }
  if (document.getElementById("adminControlModal")?.style.display === "flex") {
    cambiarAdminControlTab("analitica");
    return;
  }
  if (!bossAnalyticsState.customDate) bossAnalyticsState.customDate = new Date().toISOString().slice(0, 10);
  openModal("bossInsightsModal");
  await refreshBossAnalyticsPanel(true);
  startBossAnalyticsRefreshLoop();
}

function cerrarAnaliticaBoss() {
  stopBossAnalyticsRefreshLoop();
  if (document.getElementById("adminControlModal")?.style.display === "flex" && adminControlState.tab === "analitica") {
    cambiarAdminControlTab("dashboard");
    return;
  }
  closeModal("bossInsightsModal");
}

async function fetchAdminControlSource() {
  cleanOldAdminMovements(true);
  const source = await fetchBossAnalyticsSource();
  let usuarios = [];
  try {
    const usersResult = await supabaseClient.from(TABLES.usuarios).select("*");
    usuarios = Array.isArray(usersResult?.data) ? usersResult.data : [];
  } catch {
    usuarios = [];
  }
  return {
    ...source,
    usuarios,
      localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []),
      wholesaleOrders: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, []),
      wholesaleClients: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleClients, []),
    activity: readLocalJson(ADMIN_LOCAL_KEYS.activity, []),
    contacts: readLocalJson(ADMIN_LOCAL_KEYS.contacts, []),
    userMeta: {
      ...(accessState.userContactMeta || {}),
      ...readLocalJson(ADMIN_LOCAL_KEYS.userMeta, {})
    }
  };
}

function buildOrderSignature(pedido = {}) {
  const logicalSignature = `${pedido.usuario_id || ""}_${pedido.fecha || ""}_${pedido.total || 0}`;
  return String(pedido.sourceSignature || (logicalSignature.trim() !== "__0" ? logicalSignature : "") || pedido.id || `pedido_${Date.now()}`);
}

function normalizeAdminOrder(pedido = {}, source = adminControlState.source || {}) {
  const productos = (Array.isArray(pedido.productos) ? pedido.productos : []).map(buildOrderLineStats);
  const gananciaTotal = Number(pedido.gananciaTotal ?? productos.reduce((sum, item) => sum + Number(item.gananciaTotal || 0), 0));
  const status = pedido.status === "pagado" ? "pagado" : "pendiente";
  const creditPaid = Number(pedido.creditPaid || 0);
  const creditDueDate = pedido.creditDueDate || "";
  const paymentMode = pedido.paymentMode === "credito" ? "credito" : "normal";
  const linkedUser = source.usuarios?.find((user) => String(user.id) === String(pedido.usuario_id));
  const contactMeta = collectAdminContactMeta(source);
  const savedMeta = source.userMeta?.[pedido.usuario_id] || source.userMeta?.[pedido.username] || contactMeta.get(String(pedido.usuario_id || pedido.username || "")) || {};
  return {
    ...pedido,
    id: buildOrderSignature(pedido),
    username: linkedUser?.username || pedido.username || savedMeta.username || "Cliente",
    email: firstAdminContactValue(linkedUser?.email, linkedUser?.correo, pedido.email, pedido.correo, savedMeta.email),
    telefono: firstAdminContactValue(linkedUser?.telefono, linkedUser?.phone, linkedUser?.celular, linkedUser?.whatsapp, pedido.telefono, pedido.phone, pedido.celular, pedido.whatsapp, savedMeta.telefono),
    productos,
    total: Number(pedido.total ?? productos.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)),
    gananciaTotal,
    gananciaPendiente: status === "pendiente" ? gananciaTotal : 0,
    gananciaConfirmada: status === "pagado" ? gananciaTotal : 0,
    status,
    paymentMode,
    creditPaid,
    creditDueDate,
    creditPayments: Array.isArray(pedido.creditPayments) ? pedido.creditPayments : [],
    inventoryApplied: Boolean(pedido.inventoryApplied),
    orderType: pedido.orderType === "wholesale" ? "wholesale" : "retail",
    wholesaleClientId: pedido.wholesaleClientId || "",
    wholesaleBadge: pedido.orderType === "wholesale" || pedido.wholesaleClientId ? true : Boolean(pedido.wholesaleBadge)
  };
}

function getOrderWholesaleCost(pedido = {}) {
  return (pedido.productos || []).reduce((sum, item) => {
    const qty = Number(item.cantidad || 1);
    const wholesale = item.precioMayorista === null || item.precioMayorista === undefined || item.precioMayorista === ""
      ? Number(item.precioVenta || item.precio || 0)
      : Number(item.precioMayorista || 0);
    return sum + (wholesale * qty);
  }, 0);
}

function getCreditInfo(pedido = {}) {
  const creditLines = (pedido.productos || []).filter((item) => item.paymentMode === "credito");
  const scopedProducts = creditLines.length ? creditLines : (pedido.paymentMode === "credito" ? (pedido.productos || []) : []);
  const total = scopedProducts.length
    ? scopedProducts.reduce((sum, item) => sum + Number(item.subtotal ?? (Number(item.precioVenta || item.unitPrice || item.precio || 0) * Number(item.cantidad || 1))), 0)
    : Number(pedido.total || 0);
  const linePaid = scopedProducts.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const paid = Math.max(0, linePaid || Number(pedido.creditPaid || 0));
  const remaining = Math.max(0, total - paid);
  const gainSoFar = Math.max(0, paid - getOrderWholesaleCost({ ...pedido, productos: scopedProducts.length ? scopedProducts : pedido.productos }));
  const dueDate = pedido.creditDueDate ? new Date(`${pedido.creditDueDate}T00:00:00`) : null;
  const daysLeft = dueDate && !Number.isNaN(dueDate.getTime())
    ? Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  return { total, paid, remaining, gainSoFar, dueDate, daysLeft };
}

function getCreditClassByDays(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return "";
  if (daysLeft <= 0) return "danger";
  if (daysLeft <= 3) return "danger";
  if (daysLeft <= 7) return "warning";
  return "safe";
}

function getOrderLinePaymentInfo(item = {}) {
  const subtotal = Number(item.subtotal ?? (Number(item.precioVenta || item.unitPrice || item.precio || 0) * Number(item.cantidad || 1)));
  const paid = Math.max(0, Number(item.paidAmount || 0));
  return {
    subtotal,
    paid,
    remaining: Math.max(0, subtotal - paid),
    status: paid >= subtotal || item.status === "pagado" ? "pagado" : "pendiente",
    paymentMode: item.paymentMode === "credito" ? "credito" : "normal"
  };
}

function buildCreditBadge(pedido = {}) {
  const hasCreditLine = (pedido.productos || []).some((item) => item.paymentMode === "credito");
  if (pedido.paymentMode !== "credito" && !hasCreditLine) return "";
  const credit = getCreditInfo(pedido);
  const alertClass = credit.daysLeft !== null && credit.daysLeft <= 3 ? "danger" : (credit.daysLeft !== null && credit.daysLeft <= 7 ? "warning" : "");
  return `<span class="credit-badge ${alertClass}">Credito: pagado $${credit.paid} - falta $${credit.remaining}${credit.daysLeft !== null ? ` - ${credit.daysLeft} dia(s)` : ""}</span>`;
}

function buildGroupCreditCountdown(orders = []) {
  const days = orders
    .filter((pedido) => pedido.paymentMode === "credito" && getCreditInfo(pedido).remaining > 0)
    .map((pedido) => getCreditInfo(pedido).daysLeft)
    .filter((value) => value !== null)
    .sort((a, b) => a - b)[0];
  if (days === undefined) return "";
  return `<small class="credit-countdown ${getCreditClassByDays(days)}">Credito: faltan ${days} dia(s)</small>`;
}

function notifyCreditDueOrders(orders = []) {
  if (!canOpenAdminControlCenter()) return;
  const dueSoon = orders.filter((pedido) => pedido.paymentMode === "credito" && getCreditInfo(pedido).remaining > 0)
    .filter((pedido) => {
      const days = getCreditInfo(pedido).daysLeft;
      return days !== null && days <= 3;
    });
  if (!dueSoon.length) return;
  const key = `creditDueNotice_${new Date().toISOString().slice(0, 10)}`;
  if (readLocalJson(key, false)) return;
  writeLocalJson(key, true);
  mostrarMensaje(`Aviso: ${dueSoon.length} cliente(s) tienen pagos a credito por vencer.`);
}

function getAllAdminOrders(source = adminControlState.source || {}) {
  const deletedOrders = new Set(readLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, []));
  const dbOrders = (source.pedidos || []).map((pedido) => normalizeAdminOrder(pedido, source));
  const localOrders = (source.localOrders || []).map((pedido) => normalizeAdminOrder(pedido, source));
  const wholesaleOrders = getWholesaleOrders();
  const bySignature = new Map();
  [...dbOrders, ...localOrders, ...wholesaleOrders].forEach((pedido) => {
    if (deletedOrders.has(pedido.id)) return;
    bySignature.set(pedido.id, pedido);
  });
  return [...bySignature.values()].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
}

function getStoredAdminOrders() {
  return readLocalJson(ADMIN_LOCAL_KEYS.orders, []).map((pedido) => normalizeAdminOrder(pedido));
}

function persistAdminOrders(orders = []) {
  writeLocalJson(ADMIN_LOCAL_KEYS.orders, orders.map((pedido) => normalizeAdminOrder(pedido)).slice(0, 500));
  if (adminControlState.source) adminControlState.source.localOrders = readLocalJson(ADMIN_LOCAL_KEYS.orders, []);
}

function getWholesaleClients() {
  return readLocalJson(ADMIN_LOCAL_KEYS.wholesaleClients, []);
}

function saveWholesaleClients(clients = []) {
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleClients, clients.slice(0, 1000));
}

function getWholesaleOrders() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const activeOrders = readLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, []).filter((pedido) => {
    if (pedido.status !== "pagado") return true;
    const paidDate = new Date(pedido.paidAt || pedido.updatedAt || pedido.fecha || 0).getTime();
    return Number.isNaN(paidDate) || paidDate >= cutoff;
  });
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, activeOrders);
  return activeOrders.map((pedido) => normalizeAdminOrder({ ...pedido, orderType: "wholesale" }));
}

function saveWholesaleOrders(orders = []) {
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, orders.map((pedido) => normalizeAdminOrder({ ...pedido, orderType: "wholesale" })).slice(0, 1000));
}

function generateWholesaleCode() {
  const used = new Set(getWholesaleClients().map((client) => String(client.code)));
  let code = "";
  do {
    code = String(Math.floor(1000000 + Math.random() * 9000000));
  } while (used.has(code));
  return code;
}

function getWholesaleClientById(id = "") {
  return getWholesaleClients().find((client) => String(client.id) === String(id));
}

function isDateInAdminPeriod(dateValue, period = adminControlState.summaryPeriod) {
  if (period === "all") return true;
  const date = new Date(dateValue || 0);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  }
  if (period === "month") {
    start.setDate(1);
  }
  if (period === "year") {
    start.setMonth(0, 1);
  }
  return date >= start && date <= now;
}

function getAdminPeriodLabel(period = adminControlState.summaryPeriod) {
  if (period === "week") return "esta semana";
  if (period === "month") return "este mes";
  if (period === "year") return "este ano";
  if (period === "all") return "todo el tiempo";
  return "hoy";
}

function isAdminOrderNew(pedido = {}) {
  const date = new Date(pedido.fecha || 0);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
}

function buildAdminMetrics(source = adminControlState.source || {}) {
  const orders = getAllAdminOrders(source);
  const periodOrders = orders.filter((pedido) => isDateInAdminPeriod(pedido.fecha));
  const totalVentasDia = periodOrders.reduce((sum, pedido) => sum + Number(pedido.total || 0), 0);
  const gananciasPendientes = periodOrders.reduce((sum, pedido) => sum + Number(pedido.status === "pendiente" ? pedido.gananciaTotal : 0), 0);
  const gananciasConfirmadas = periodOrders.reduce((sum, pedido) => sum + Number(pedido.status === "pagado" ? pedido.gananciaTotal : 0), 0);
  const gananciasTotales = gananciasPendientes + gananciasConfirmadas;
  const productMap = new Map();
  periodOrders.forEach((pedido) => {
    (Array.isArray(pedido.productos) ? pedido.productos : []).forEach((item) => {
      const current = productMap.get(item.nombre) || 0;
      productMap.set(item.nombre, current + Number(item.cantidad || 1));
    });
  });
  const topProducts = [...productMap.entries()].sort((a, b) => b[1] - a[1]);
  const lowStock = catalogos.flatMap((cat) => (cat.productos || [])
    .filter((prod) => hasInventory(prod) && Number(prod.stock || 0) <= Number(prod.stockAlert || 3))
    .map((prod) => ({ catalogo: cat.nombre, ...prod })));
  return { orders, periodOrders, todayOrders: periodOrders, totalVentasDia, gananciasTotales, gananciasPendientes, gananciasConfirmadas, topProducts, lowStock };
}

function getMonthCloseCountdown() {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(0, totalDays - currentDay);
  const dangerLevel = daysLeft <= 3 ? "danger" : (daysLeft <= 7 ? "warning" : "");
  return { totalDays, currentDay, daysLeft, dangerLevel };
}

function notifyMonthlyCloseIfNeeded() {
  if (!canOpenAdminControlCenter()) return;
  const countdown = getMonthCloseCountdown();
  if (countdown.daysLeft > 3) return;
  const key = `monthlyCloseNotice_${new Date().toISOString().slice(0, 10)}`;
  if (readLocalJson(key, false)) return;
  writeLocalJson(key, true);
  mostrarMensaje(`Aviso: faltan ${countdown.daysLeft} dia(s) para el cierre del mes.`);
}

function renderAdminSummary() {
  const summary = document.getElementById("adminControlSummary");
  if (!summary) return;
  const metrics = buildAdminMetrics();
  const periodLabel = getAdminPeriodLabel();
  summary.innerHTML = `
    <div class="admin-stat-card admin-period-card">
      <span>Periodo del resumen</span>
      <select id="adminSummaryPeriod" onchange="handleAdminSummaryPeriodChange(this.value)">
        <option value="day" ${adminControlState.summaryPeriod === "day" ? "selected" : ""}>Dia</option>
        <option value="week" ${adminControlState.summaryPeriod === "week" ? "selected" : ""}>Semana</option>
        <option value="month" ${adminControlState.summaryPeriod === "month" ? "selected" : ""}>Mes</option>
        <option value="year" ${adminControlState.summaryPeriod === "year" ? "selected" : ""}>Ano</option>
        <option value="all" ${adminControlState.summaryPeriod === "all" ? "selected" : ""}>Todo</option>
      </select>
    </div>
    <div class="admin-stat-card"><span>Ventas de ${periodLabel}</span><strong>$${metrics.totalVentasDia}</strong></div>
    <div class="admin-stat-card"><span>Ganancia pendiente</span><strong>$${metrics.gananciasPendientes}</strong></div>
    <div class="admin-stat-card"><span>Ganancia confirmada</span><strong>$${metrics.gananciasConfirmadas}</strong></div>
    <div class="admin-stat-card"><span>Pedidos enviados</span><strong>${metrics.periodOrders.length}</strong></div>
    <div class="admin-stat-card"><span>Productos agotandose</span><strong>${metrics.lowStock.length}</strong></div>
    <div class="admin-stat-card month-close-counter ${getMonthCloseCountdown().dangerLevel}"><span>Cierre mensual</span><strong>${getMonthCloseCountdown().currentDay}/${getMonthCloseCountdown().totalDays}</strong><small>Faltan ${getMonthCloseCountdown().daysLeft} dia(s)</small></div>
  `;
  notifyMonthlyCloseIfNeeded();
}

function handleAdminSummaryPeriodChange(period = "day") {
  adminControlState.summaryPeriod = period;
  renderAdminControl();
}

function renderAdminDashboard() {
  const body = document.getElementById("adminControlBody");
  const metrics = buildAdminMetrics();
  if (!body) return;
  body.innerHTML = `
    <div class="admin-dashboard-grid">
      <section class="admin-control-card">
        <h3>Pedidos recientes</h3>
        <div class="admin-control-list">
          ${metrics.orders.slice(0, 6).map((pedido) => `<small>${new Date(pedido.fecha).toLocaleString()} · ${pedido.username || "Cliente"} · $${pedido.total || 0} · Ganancia $${pedido.gananciaTotal || 0}</small>`).join("") || "<small>No hay pedidos registrados.</small>"}
        </div>
      </section>
      <section class="admin-control-card">
        <h3>Productos mas vendidos</h3>
        <div class="admin-control-list">
          ${metrics.topProducts.slice(0, 8).map(([name, count]) => `<small>${name}: ${count} unidad(es)</small>`).join("") || "<small>Aun no hay ventas confirmadas.</small>"}
        </div>
      </section>
      <section class="admin-control-card">
        <h3>Productos agotandose</h3>
        <div class="admin-control-list">
          ${metrics.lowStock.map((prod) => `<small>${prod.nombre} · ${prod.catalogo} · stock ${prod.stock}</small>`).join("") || "<small>No hay alertas de inventario.</small>"}
        </div>
      </section>
      <section class="admin-control-card">
        <h3>Clientes mas activos</h3>
        <div class="admin-control-list">
          ${getAdminUserRows().slice(0, 6).map((user) => `<small>${escapeHtmlAttribute(user.username || "Usuario")}: ${user.activityScore} movimiento(s)</small>`).join("") || "<small>No hay actividad de clientes.</small>"}
        </div>
      </section>
      <section class="admin-control-card">
        <h3>Accesos rapidos</h3>
        <div class="admin-control-actions">
          <button type="button" onclick="cambiarAdminControlTab('analitica')">Analitica de productos</button>
          <button type="button" onclick="cambiarAdminControlTab('usuarios')">Control de usuarios</button>
          <button type="button" onclick="cambiarAdminControlTab('promociones')">Promociones</button>
        </div>
      </section>
    </div>
  `;
}

async function renderAdminAnalytics() {
  const body = document.getElementById("adminControlBody");
  const summary = document.getElementById("adminControlSummary");
  const analyticsShell = document.querySelector("#bossInsightsModal .boss-analytics-shell") || document.querySelector("#adminControlBody .boss-analytics-shell");
  if (!body || !analyticsShell) {
    if (body) body.innerHTML = `<div class="admin-control-card">No se pudo cargar la analitica. Cierra y vuelve a abrir el Centro de Control.</div>`;
    return;
  }
  body.innerHTML = "";
  body.appendChild(analyticsShell);
  if (!bossAnalyticsState.customDate) bossAnalyticsState.customDate = new Date().toISOString().slice(0, 10);
  const metricSelect = document.getElementById("bossInsightsMetric");
  const periodSelect = document.getElementById("bossInsightsPeriod");
  const customDate = document.getElementById("bossInsightsDate");
  if (metricSelect) metricSelect.value = bossAnalyticsState.metric || "pedidos";
  if (periodSelect) periodSelect.value = bossAnalyticsState.period || "month";
  if (customDate) customDate.value = bossAnalyticsState.customDate || "";
  await refreshBossAnalyticsPanel(true);
}

function normalizeAdminContactValue(value = "") {
  return String(value || "").trim();
}

function firstAdminContactValue(...values) {
  return values.map(normalizeAdminContactValue).find(Boolean) || "";
}

function getAdminUserKey(item = {}) {
  return String(item.userId || item.usuario_id || item.id || item.username || "").trim();
}

function collectAdminContactMeta(source = adminControlState.source || {}) {
  const metaMap = new Map();
  const merge = (raw = {}) => {
    const key = getAdminUserKey(raw);
    if (!key) return;
    const current = metaMap.get(key) || {};
    metaMap.set(key, {
      ...current,
      userId: raw.userId || raw.usuario_id || raw.id || current.userId || key,
      username: firstAdminContactValue(raw.username, raw.nombre, current.username),
      email: firstAdminContactValue(raw.email, raw.correo, raw.mail, raw.userEmail, current.email),
      telefono: firstAdminContactValue(raw.telefono, raw.phone, raw.celular, raw.whatsapp, raw.numero, raw.numeroTelefono, raw.phoneNumber, raw.mobile, current.telefono),
      createdAt: raw.createdAt || raw.created_at || raw.fecha || current.createdAt || ""
    });
  };
  (source.usuarios || []).forEach(merge);
  Object.values(accessState.userContactMeta || {}).forEach(merge);
  Object.values(source.userMeta || {}).forEach(merge);
  (source.pedidos || []).forEach(merge);
  (source.localOrders || []).forEach(merge);
  (source.activity || []).forEach((entry) => merge({
    userId: entry.userId,
    username: entry.username,
    email: entry.detail?.email || entry.detail?.correo,
    telefono: entry.detail?.telefono,
    createdAt: entry.fecha
  }));
  return metaMap;
}

function getAdminUserRows() {
  const source = adminControlState.source || {};
  const meta = source.userMeta || {};
  const contactMeta = collectAdminContactMeta(source);
  const deletedUsers = new Set(readLocalJson(ADMIN_LOCAL_KEYS.deletedUsers, []).map(String));
  const usersByKey = new Map();
  (source.usuarios || []).forEach((user) => {
    const key = String(user.id || user.username);
    if (!deletedUsers.has(key) && !deletedUsers.has(String(user.username || ""))) usersByKey.set(key, user);
  });
  Object.values(meta).forEach((saved) => {
    const key = String(saved.userId || saved.username || "");
    if (key && !deletedUsers.has(key) && !deletedUsers.has(String(saved.username || "")) && !usersByKey.has(key)) usersByKey.set(key, { id: saved.userId || saved.username, username: saved.username, ...saved });
  });
  contactMeta.forEach((saved, key) => {
    if (key && !deletedUsers.has(key) && !deletedUsers.has(String(saved.username || "")) && !usersByKey.has(key)) usersByKey.set(key, { id: saved.userId || key, username: saved.username, ...saved });
  });
  const rows = [...usersByKey.values()].map((user) => {
    const savedMeta = meta[user.id] || meta[user.username] || contactMeta.get(String(user.id || user.username || "")) || {};
    const favorites = (source.favoritos || []).filter((item) => String(item.usuario_id) === String(user.id)).length;
    const cartItems = (source.carrito || []).filter((item) => String(item.usuario_id) === String(user.id)).length;
    const orders = getAllAdminOrders(source).filter((pedido) => String(pedido.usuario_id) === String(user.id) || pedido.username === user.username).length;
    const movements = (source.activity || []).filter((item) => String(item.userId) === String(user.id) || item.username === user.username).length;
    return {
      ...user,
      email: firstAdminContactValue(user.email, user.correo, user.mail, user.userEmail, savedMeta.email),
      telefono: firstAdminContactValue(user.telefono, user.phone, user.celular, user.whatsapp, user.numero, user.numeroTelefono, user.phoneNumber, user.mobile, savedMeta.telefono),
      createdAt: user.created_at || savedMeta.createdAt || "",
      favorites,
      cartItems,
      orders,
      movements,
      activityScore: favorites + cartItems + orders + movements
    };
  });
  return rows
    .sort((a, b) => b.activityScore - a.activityScore || String(a.username || "").localeCompare(String(b.username || "")));
}

function renderAdminUsers() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const rows = getAdminUserRows();
  body.innerHTML = `
    <div class="admin-control-toolbar">
      <input id="adminUserSearch" placeholder="Buscar por nombre, correo o telefono" value="${escapeHtmlAttribute(adminControlState.userSearch || "")}" oninput="handleAdminUserSearch(this.value)">
    </div>
    <div class="admin-control-table">
      ${rows.map((user) => `
        <article class="admin-control-row" data-admin-user-row data-search="${escapeHtmlAttribute(normalizarTexto(`${user.username} ${user.email} ${user.telefono}`))}">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(user.username || "Usuario")} ${isWholesaleUser(user) ? `<span class="wholesale-badge">${getWholesaleBadgeText()}</span>` : ""}</strong>
            <small>${escapeHtmlAttribute(user.email || "Sin correo")} · ${escapeHtmlAttribute(user.telefono || "Sin telefono")}</small>
            <small>Registro: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Sin fecha"} · Favoritos ${user.favorites} · Carrito ${user.cartItems} · Pedidos ${user.orders} · Movimientos ${user.movements}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(user.telefono || "")}','${escapeHtmlAttribute(user.email || "")}')">Contactar</button>
            <button type="button" onclick="abrirPanelClienteMayorista('${escapeHtmlAttribute(user.id || "")}','${escapeHtmlAttribute(user.username || "")}','${escapeHtmlAttribute(user.telefono || "")}')">Agregar mayorista</button>
            <button type="button" class="danger-btn" onclick="eliminarUsuarioAdmin('${escapeHtmlAttribute(user.id || "")}','${escapeHtmlAttribute(user.username || "")}')">Eliminar</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay usuarios para mostrar.</div>`}
    </div>
  `;
  applyAdminUserSearchFilter();
}

function getWholesaleBadgeText() {
  return siteSettings.wholesaleBadgeEmoji || "\u{1F4E6}";
}

function isWholesaleUser(user = {}) {
  return getWholesaleClients().some((client) =>
    String(client.userId || "") === String(user.id || "") ||
    String(client.username || "").toLowerCase() === String(user.username || "").toLowerCase()
  );
}

async function eliminarUsuarioAdmin(userId = "", username = "") {
  if (!canOpenAdminControlCenter()) return mostrarMensaje("Solo boss o administradores pueden eliminar usuarios.");
  if (!userId && !username) return mostrarMensaje("No se pudo identificar este usuario.");
  if (!confirm(`Eliminar el usuario ${username || userId}?`)) return;
  try {
    if (userId && !String(userId).startsWith("boss")) {
      await supabaseClient.from(TABLES.usuarios).delete().eq("id", userId);
      await supabaseClient.from(TABLES.carrito).delete().eq("usuario_id", userId);
      await supabaseClient.from(TABLES.favoritos).delete().eq("usuario_id", userId);
    }
  } catch (error) {
    console.error("Error eliminando usuario:", error);
  }
  const deleted = new Set(readLocalJson(ADMIN_LOCAL_KEYS.deletedUsers, []).map(String));
  if (userId) deleted.add(String(userId));
  if (username) deleted.add(String(username));
  writeLocalJson(ADMIN_LOCAL_KEYS.deletedUsers, [...deleted].slice(-500));
  const meta = readLocalJson(ADMIN_LOCAL_KEYS.userMeta, {});
  [userId, username].filter(Boolean).forEach((key) => delete meta[key]);
  writeLocalJson(ADMIN_LOCAL_KEYS.userMeta, meta);
  accessState.roleAssignments = (accessState.roleAssignments || []).filter((item) =>
    String(item.userId || "") !== String(userId) && String(item.username || "") !== String(username)
  );
  syncAccessState(accessState);
  adminControlState.source = await fetchAdminControlSource();
  renderAdminUsers();
  mostrarMensaje("Usuario eliminado.");
}

function handleAdminUserSearch(value = "") {
  adminControlState.userSearch = value;
  applyAdminUserSearchFilter();
}

function applyAdminUserSearchFilter() {
  const query = normalizarTexto(adminControlState.userSearch || "");
  document.querySelectorAll("[data-admin-user-row]").forEach((row) => {
    row.classList.toggle("hidden", Boolean(query) && !String(row.dataset.search || "").includes(query));
  });
}

function renderAdminOrdersLegacy() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const orders = getAllAdminOrders();
  body.innerHTML = `
    <div class="admin-control-table">
      ${orders.map((pedido) => `
        <article class="admin-control-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(pedido.username || "Cliente")} · $${pedido.total || 0}</strong>
            <small>${new Date(pedido.fecha || Date.now()).toLocaleString()} · Ganancia neta $${pedido.gananciaTotal || 0}</small>
            <small>${(pedido.productos || []).map((item) => `${item.nombre} x${item.cantidad}`).join(", ")}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" onclick="cambiarAdminControlTab('dashboard')">Ver resumen</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay pedidos enviados.</div>`}
    </div>
  `;
}

function renderAdminOrdersLegacy() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const query = normalizarTexto(adminControlState.orderSearch || "");
  const orders = getAllAdminOrders()
    .filter((pedido) => !query || normalizarTexto(`${pedido.username} ${pedido.usuario_id} ${(pedido.productos || []).map((item) => item.nombre).join(" ")}`).includes(query))
    .sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")) || new Date(b.fecha || 0) - new Date(a.fecha || 0));
  const users = new Map();
  orders.forEach((pedido) => {
    const key = String(pedido.usuario_id || pedido.username || "cliente");
    const current = users.get(key) || { username: pedido.username || "Cliente", pedidos: [], total: 0, pendiente: 0, confirmada: 0 };
    current.pedidos.push(pedido);
    current.total += Number(pedido.total || 0);
    current.pendiente += Number(pedido.status === "pendiente" ? pedido.gananciaTotal : 0);
    current.confirmada += Number(pedido.status === "pagado" ? pedido.gananciaTotal : 0);
    users.set(key, current);
  });
  const userGroups = [...users.values()].sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
  body.innerHTML = `
    <div class="admin-control-toolbar">
      <input id="adminOrderSearch" placeholder="Buscar pedidos por usuario o producto" value="${escapeHtmlAttribute(adminControlState.orderSearch || "")}" oninput="handleAdminOrderSearch(this.value)">
      <button type="button" onclick="resetearGananciasPedidos()">Resetear ganancias</button>
    </div>
    <div class="admin-control-table">
      ${orders.map((pedido) => `
        <article class="admin-control-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(pedido.username || "Cliente")} · $${pedido.total || 0} · ${pedido.status === "pagado" ? "Pagado" : "Pendiente"}</strong>
            <small>${new Date(pedido.fecha || Date.now()).toLocaleString()} · Pendiente $${pedido.gananciaPendiente || 0} · Confirmada $${pedido.gananciaConfirmada || 0}</small>
            <small>${(pedido.productos || []).map((item) => `${item.nombre} x${item.cantidad}`).join(", ")}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pagado')">Pagado</button>
            <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pendiente')">Pendiente</button>
            <button type="button" onclick="editarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Modificar</button>
            <button type="button" class="danger-btn" onclick="eliminarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Eliminar</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay pedidos enviados.</div>`}
    </div>
  `;
}

function renderAdminOrdersGrouped() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const query = normalizarTexto(adminControlState.orderSearch || "");
  const orders = getAllAdminOrders()
    .filter((pedido) => !query || normalizarTexto(`${pedido.username} ${pedido.telefono} ${pedido.usuario_id} ${(pedido.productos || []).map((item) => item.nombre).join(" ")}`).includes(query))
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  const users = new Map();
  orders.forEach((pedido) => {
    const key = String(pedido.usuario_id || pedido.username || "cliente");
    const current = users.get(key) || { username: pedido.username || "Cliente", telefono: pedido.telefono || "", pedidos: [], total: 0, pendiente: 0, confirmada: 0, latestDate: "" };
    current.pedidos.push(pedido);
    current.total += Number(pedido.total || 0);
    current.pendiente += Number(pedido.status === "pendiente" ? pedido.gananciaTotal : 0);
    current.confirmada += Number(pedido.status === "pagado" ? pedido.gananciaTotal : 0);
    if (!current.latestDate || new Date(pedido.fecha || 0) > new Date(current.latestDate || 0)) current.latestDate = pedido.fecha || "";
    users.set(key, current);
  });
  const userGroups = [...users.values()].sort((a, b) => {
    if (adminControlState.orderSort === "alpha") return String(a.username || "").localeCompare(String(b.username || ""));
    if (adminControlState.orderSort === "mostOrders") return b.pedidos.length - a.pedidos.length || String(a.username || "").localeCompare(String(b.username || ""));
    if (adminControlState.orderSort === "leastOrders") return a.pedidos.length - b.pedidos.length || String(a.username || "").localeCompare(String(b.username || ""));
    return new Date(b.latestDate || 0) - new Date(a.latestDate || 0);
  });
  body.innerHTML = `
    <div class="admin-control-toolbar">
      <input id="adminOrderSearch" placeholder="Buscar por usuario, telefono o producto" value="${escapeHtmlAttribute(adminControlState.orderSearch || "")}" oninput="handleAdminOrderSearch(this.value)">
      <select id="adminOrderSort" onchange="handleAdminOrderSort(this.value)">
        <option value="newest" ${adminControlState.orderSort === "newest" ? "selected" : ""}>Mas nuevo</option>
        <option value="alpha" ${adminControlState.orderSort === "alpha" ? "selected" : ""}>Orden alfabetico</option>
        <option value="mostOrders" ${adminControlState.orderSort === "mostOrders" ? "selected" : ""}>Mas pedidos</option>
        <option value="leastOrders" ${adminControlState.orderSort === "leastOrders" ? "selected" : ""}>Menos pedidos</option>
      </select>
      <button type="button" onclick="confirmarTodosPedidosPendientes()">Confirmar pendientes</button>
      <button type="button" onclick="resetearGananciasPedidos()">Resetear ganancias</button>
    </div>
    <div class="admin-control-table">
      ${userGroups.map((group) => `
        <details class="admin-order-user-card">
          <summary>
            <span>
              <strong>${escapeHtmlAttribute(group.username)} ${group.pedidos.some(isAdminOrderNew) ? `<em class="admin-new-badge">Nuevo</em>` : ""}</strong>
              <small>${escapeHtmlAttribute(group.telefono || "Sin telefono")} - ${new Date(group.latestDate || Date.now()).toLocaleString()}</small>
              <small>${group.pedidos.length} pedido(s) - Total $${group.total} - Pendiente $${group.pendiente} - Confirmada $${group.confirmada}</small>
            </span>
          </summary>
          <div class="admin-order-breakdown">
            ${group.pedidos.map((pedido) => `
              <article class="admin-control-row admin-order-row">
                <div class="admin-control-row-main">
                  <strong>$${pedido.total || 0} - ${pedido.status === "pagado" ? "Pagado" : "Pendiente"} ${isAdminOrderNew(pedido) ? `<em class="admin-new-badge">Nuevo</em>` : ""}</strong>
                  <small>${new Date(pedido.fecha || Date.now()).toLocaleString()} - Pendiente $${pedido.status === "pendiente" ? pedido.gananciaTotal : 0} - Confirmada $${pedido.status === "pagado" ? pedido.gananciaTotal : 0}</small>
                  <small>${(pedido.productos || []).map((item) => `${item.nombre} x${item.cantidad} - venta $${item.precioVenta || 0} - mayorista $${item.precioMayorista || 0} - ganancia $${item.gananciaTotal || 0}`).join(" | ")}</small>
                </div>
                <div class="admin-control-actions">
                  <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pagado')">Pagado</button>
                  <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pendiente')">Pendiente</button>
                  <button type="button" onclick="editarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Modificar</button>
                  <button type="button" class="danger-btn" onclick="eliminarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Eliminar</button>
                </div>
              </article>
            `).join("")}
          </div>
        </details>
      `).join("") || `<div class="admin-control-card">No hay pedidos enviados.</div>`}
    </div>
  `;
}

function renderAdminOrders() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const allOrders = getAllAdminOrders();
  const orderCounts = allOrders.reduce((map, pedido) => {
    const key = String(pedido.usuario_id || pedido.username || "cliente");
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  const orders = allOrders
    .sort((a, b) => {
      const aKey = String(a.usuario_id || a.username || "cliente");
      const bKey = String(b.usuario_id || b.username || "cliente");
      if (adminControlState.orderSort === "alpha") return String(a.username || "").localeCompare(String(b.username || "")) || new Date(b.fecha || 0) - new Date(a.fecha || 0);
      if (adminControlState.orderSort === "mostOrders") return (orderCounts[bKey] || 0) - (orderCounts[aKey] || 0) || new Date(b.fecha || 0) - new Date(a.fecha || 0);
      if (adminControlState.orderSort === "leastOrders") return (orderCounts[aKey] || 0) - (orderCounts[bKey] || 0) || new Date(b.fecha || 0) - new Date(a.fecha || 0);
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  const pendingOrders = orders.filter((pedido) => pedido.status !== "pagado");
  const paidOrders = orders.filter((pedido) => pedido.status === "pagado");
  const creditOrders = orders.filter((pedido) => (pedido.paymentMode === "credito" || (pedido.productos || []).some((item) => item.paymentMode === "credito")) && getCreditInfo(pedido).remaining > 0);
  const confirmedOrders = paidOrders.filter((pedido) => isDateInAdminPeriod(pedido.fecha, adminControlState.confirmedPeriod));
  const confirmedTotal = confirmedOrders.reduce((sum, pedido) => sum + Number(pedido.gananciaTotal || 0), 0);
  notifyCreditDueOrders(orders);
  const pendingUsers = new Map();
  pendingOrders.forEach((pedido) => {
    const key = String(pedido.usuario_id || pedido.username || "cliente");
    const current = pendingUsers.get(key) || { username: pedido.username || "Cliente", telefono: pedido.telefono || "", pedidos: [], total: 0, ganancia: 0, latestDate: "" };
    current.pedidos.push(pedido);
    current.total += Number(pedido.total || 0);
    current.ganancia += Number(pedido.gananciaTotal || 0);
    if (!current.latestDate || new Date(pedido.fecha || 0) > new Date(current.latestDate || 0)) current.latestDate = pedido.fecha || "";
    pendingUsers.set(key, current);
  });
  const pendingGroups = [...pendingUsers.values()].sort((a, b) => {
    const aDue = Math.min(...a.pedidos.map((pedido) => getCreditInfo(pedido).daysLeft).filter((days) => days !== null), 9999);
    const bDue = Math.min(...b.pedidos.map((pedido) => getCreditInfo(pedido).daysLeft).filter((days) => days !== null), 9999);
    if (aDue !== bDue && (aDue !== 9999 || bDue !== 9999)) return aDue - bDue;
    if (adminControlState.orderSort === "alpha") return String(a.username || "").localeCompare(String(b.username || ""));
    if (adminControlState.orderSort === "mostOrders") return b.pedidos.length - a.pedidos.length || String(a.username || "").localeCompare(String(b.username || ""));
    if (adminControlState.orderSort === "leastOrders") return a.pedidos.length - b.pedidos.length || String(a.username || "").localeCompare(String(b.username || ""));
    return new Date(b.latestDate || 0) - new Date(a.latestDate || 0);
  });
  body.innerHTML = `
    <div class="admin-control-toolbar">
      <input id="adminOrderSearch" placeholder="Buscar por usuario, telefono o producto" value="${escapeHtmlAttribute(adminControlState.orderSearch || "")}" oninput="handleAdminOrderSearch(this.value)">
      <select id="adminOrderSort" onchange="handleAdminOrderSort(this.value)">
        <option value="newest" ${adminControlState.orderSort === "newest" ? "selected" : ""}>Mas nuevo</option>
        <option value="alpha" ${adminControlState.orderSort === "alpha" ? "selected" : ""}>Orden alfabetico</option>
        <option value="mostOrders" ${adminControlState.orderSort === "mostOrders" ? "selected" : ""}>Mas pedidos</option>
        <option value="leastOrders" ${adminControlState.orderSort === "leastOrders" ? "selected" : ""}>Menos pedidos</option>
      </select>
      <button type="button" onclick="confirmarTodosPedidosPendientes()">Confirmar pendientes</button>
      <button type="button" onclick="resetearGananciasPedidos()">Resetear ganancias</button>
    </div>
    <section class="admin-control-card">
      <h3>Pagos a credito</h3>
      <div class="admin-control-table">
        ${creditOrders.map((pedido) => {
          const credit = getCreditInfo(pedido);
          return `
            <article class="admin-control-row credit-row ${credit.daysLeft !== null && credit.daysLeft <= 3 ? "danger" : ""}">
              <div class="admin-control-row-main">
                <strong>${escapeHtmlAttribute(pedido.username || "Cliente")} - deuda $${credit.remaining}</strong>
                <small>${escapeHtmlAttribute(pedido.telefono || pedido.email || "Sin contacto")} - pagado $${credit.paid} de $${credit.total}</small>
                <small>Fecha limite: ${pedido.creditDueDate || "Sin fecha"} ${credit.daysLeft !== null ? `- faltan ${credit.daysLeft} dia(s)` : ""}</small>
                <small>Ganancia obtenida parcial: $${credit.gainSoFar}</small>
              </div>
              <div class="admin-control-actions">
                <button type="button" onclick="agregarAbonoCredito('${escapeHtmlAttribute(pedido.id)}')">Agregar abono</button>
                <button type="button" onclick="abrirPanelPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','credito')">Modificar credito</button>
                <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(pedido.telefono || "")}','${escapeHtmlAttribute(pedido.email || "")}')">Contactar</button>
              </div>
            </article>
          `;
        }).join("") || `<div class="admin-control-card">No hay pagos a credito pendientes.</div>`}
      </div>
    </section>
    <section class="admin-control-card">
      <h3>Pedidos pendientes</h3>
      <div class="admin-control-table">
        ${pendingGroups.map((group) => `
          <details class="admin-order-user-card" data-admin-order-group data-search="${escapeHtmlAttribute(normalizarTexto(`${group.username} ${group.telefono} ${group.pedidos.map((pedido) => `${pedido.usuario_id} ${(pedido.productos || []).map((item) => item.nombre).join(" ")}`).join(" ")}`))}">
            <summary>
              <span>
                <strong>${group.pedidos.some((pedido) => pedido.orderType === "wholesale") ? `<span class="wholesale-badge">${getWholesaleBadgeText()}</span> ` : ""}${escapeHtmlAttribute(group.username)} ${group.pedidos.some(isAdminOrderNew) ? `<em class="admin-new-badge">Nuevo</em>` : ""}</strong>
                <small>${escapeHtmlAttribute(group.telefono || "Sin telefono")} - ${group.pedidos.length} pedido(s) - Pendiente $${group.ganancia}</small>
                ${buildGroupCreditCountdown(group.pedidos)}
              </span>
            </summary>
            <div class="admin-order-breakdown">
              ${group.pedidos.map((pedido) => `
                <article class="admin-control-row admin-order-row" data-admin-order-row data-search="${escapeHtmlAttribute(normalizarTexto(`${pedido.username} ${pedido.telefono} ${pedido.usuario_id} ${(pedido.productos || []).map((item) => item.nombre).join(" ")}`))}">
                  <div class="admin-control-row-main">
                    <strong>$${pedido.total || 0} - ${pedido.paymentMode === "credito" || (pedido.productos || []).some((item) => item.paymentMode === "credito") ? "Con credito" : "No pagado"} ${isAdminOrderNew(pedido) ? `<em class="admin-new-badge">Nuevo</em>` : ""}</strong>
                    <small>${new Date(pedido.fecha || Date.now()).toLocaleString()}</small>
                    <small>Ganancia pendiente $${pedido.gananciaTotal || 0}</small>
                    ${buildCreditBadge(pedido)}
                    <small>${escapeHtmlAttribute(buildOrderItemsSummary(pedido.productos || []))}</small>
                  </div>
                  <div class="admin-control-actions">
                    <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pagado')">Pagado</button>
                    <button type="button" onclick="marcarPedidoCredito('${escapeHtmlAttribute(pedido.id)}')">Credito</button>
                    ${(pedido.paymentMode === "credito" || (pedido.productos || []).some((item) => item.paymentMode === "credito")) ? `<button type="button" onclick="agregarAbonoCredito('${escapeHtmlAttribute(pedido.id)}')">Agregar abono</button>` : ""}
                    <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(pedido.telefono || "")}','${escapeHtmlAttribute(pedido.email || "")}')">Contactar</button>
                    <button type="button" onclick="editarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Modificar</button>
                    <button type="button" class="danger-btn" onclick="eliminarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Eliminar</button>
                  </div>
                </article>
              `).join("")}
            </div>
          </details>
        `).join("") || `<div class="admin-control-card">No hay pedidos pendientes.</div>`}
      </div>
    </section>
    <section class="admin-control-card">
      <h3>Pedidos pagados</h3>
      <div class="admin-control-toolbar">
        <select id="adminConfirmedPeriod" onchange="handleAdminConfirmedPeriod(this.value)">
          <option value="day" ${adminControlState.confirmedPeriod === "day" ? "selected" : ""}>Dia</option>
          <option value="week" ${adminControlState.confirmedPeriod === "week" ? "selected" : ""}>Semana</option>
          <option value="month" ${adminControlState.confirmedPeriod === "month" ? "selected" : ""}>Mes</option>
          <option value="year" ${adminControlState.confirmedPeriod === "year" ? "selected" : ""}>Ano</option>
          <option value="all" ${adminControlState.confirmedPeriod === "all" ? "selected" : ""}>Todo</option>
        </select>
        <strong>Ganancia confirmada: $${confirmedTotal}</strong>
        <button type="button" onclick="downloadConfirmedGainsExcel()">Descargar Excel</button>
        <button type="button" class="danger-btn" onclick="limpiarPedidosPagadosAdmin()">Limpiar pagados</button>
      </div>
      <div class="admin-control-table">
        ${confirmedOrders.map((pedido) => `
          <article class="admin-control-row admin-order-row" data-admin-order-row data-search="${escapeHtmlAttribute(normalizarTexto(`${pedido.username} ${pedido.telefono} ${pedido.usuario_id} ${(pedido.productos || []).map((item) => item.nombre).join(" ")}`))}">
            <div class="admin-control-row-main">
              <strong>${pedido.orderType === "wholesale" ? `<span class="wholesale-badge">${getWholesaleBadgeText()}</span> ` : ""}${escapeHtmlAttribute(pedido.username || "Cliente")} - $${pedido.total || 0} - Pagado</strong>
              <small>${escapeHtmlAttribute(pedido.telefono || "Sin telefono")} - ${new Date(pedido.fecha || Date.now()).toLocaleString()}</small>
              <small>Ganancia confirmada $${pedido.gananciaTotal || 0}</small>
              ${buildCreditBadge(pedido)}
              <small>${escapeHtmlAttribute(buildOrderItemsSummary(pedido.productos || []))}</small>
            </div>
            <div class="admin-control-actions">
              <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pendiente')">No pagado</button>
              <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(pedido.telefono || "")}','${escapeHtmlAttribute(pedido.email || "")}')">Contactar</button>
              <button type="button" onclick="editarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Modificar</button>
              <button type="button" class="danger-btn" onclick="eliminarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Eliminar</button>
            </div>
          </article>
        `).join("") || `<div class="admin-control-card">No hay pedidos pagados en este periodo.</div>`}
      </div>
    </section>
  `;
  applyAdminOrderSearchFilter();
}

function renderAdminOrdersFlat() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const query = normalizarTexto(adminControlState.orderSearch || "");
  const allOrders = getAllAdminOrders();
  const orderCounts = allOrders.reduce((map, pedido) => {
    const key = String(pedido.usuario_id || pedido.username || "cliente");
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  const orders = allOrders
    .filter((pedido) => !query || normalizarTexto(`${pedido.username} ${pedido.telefono} ${pedido.usuario_id} ${(pedido.productos || []).map((item) => item.nombre).join(" ")}`).includes(query))
    .sort((a, b) => {
      const aKey = String(a.usuario_id || a.username || "cliente");
      const bKey = String(b.usuario_id || b.username || "cliente");
      if (adminControlState.orderSort === "alpha") return String(a.username || "").localeCompare(String(b.username || "")) || new Date(b.fecha || 0) - new Date(a.fecha || 0);
      if (adminControlState.orderSort === "mostOrders") return (orderCounts[bKey] || 0) - (orderCounts[aKey] || 0) || new Date(b.fecha || 0) - new Date(a.fecha || 0);
      if (adminControlState.orderSort === "leastOrders") return (orderCounts[aKey] || 0) - (orderCounts[bKey] || 0) || new Date(b.fecha || 0) - new Date(a.fecha || 0);
      return new Date(b.fecha || 0) - new Date(a.fecha || 0);
    });
  body.innerHTML = `
    <div class="admin-control-toolbar">
      <input id="adminOrderSearch" placeholder="Buscar por usuario, telefono o producto" value="${escapeHtmlAttribute(adminControlState.orderSearch || "")}" oninput="handleAdminOrderSearch(this.value)">
      <select id="adminOrderSort" onchange="handleAdminOrderSort(this.value)">
        <option value="newest" ${adminControlState.orderSort === "newest" ? "selected" : ""}>Mas nuevo</option>
        <option value="alpha" ${adminControlState.orderSort === "alpha" ? "selected" : ""}>Orden alfabetico</option>
        <option value="mostOrders" ${adminControlState.orderSort === "mostOrders" ? "selected" : ""}>Mas pedidos</option>
        <option value="leastOrders" ${adminControlState.orderSort === "leastOrders" ? "selected" : ""}>Menos pedidos</option>
      </select>
      <button type="button" onclick="confirmarTodosPedidosPendientes()">Confirmar pendientes</button>
      <button type="button" onclick="resetearGananciasPedidos()">Resetear ganancias</button>
    </div>
    <div class="admin-control-table">
      ${orders.map((pedido) => `
        <article class="admin-control-row admin-order-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(pedido.username || "Cliente")} - $${pedido.total || 0} - ${pedido.status === "pagado" ? "Pagado" : "No pagado"} ${isAdminOrderNew(pedido) ? `<em class="admin-new-badge">Nuevo</em>` : ""}</strong>
            <small>${escapeHtmlAttribute(pedido.telefono || "Sin telefono")} - ${new Date(pedido.fecha || Date.now()).toLocaleString()}</small>
            <small>Pendiente $${pedido.status === "pendiente" ? pedido.gananciaTotal : 0} - Confirmada $${pedido.status === "pagado" ? pedido.gananciaTotal : 0}</small>
            <small>${escapeHtmlAttribute(buildOrderItemsSummary(pedido.productos || []))}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pagado')">Pagado</button>
            <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}','pendiente')">No pagado</button>
            <button type="button" onclick="editarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Modificar</button>
            <button type="button" class="danger-btn" onclick="eliminarPedidoAdmin('${escapeHtmlAttribute(pedido.id)}')">Eliminar</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay pedidos enviados.</div>`}
    </div>
  `;
}

function handleAdminOrderSearch(value = "") {
  adminControlState.orderSearch = value;
  applyAdminOrderSearchFilter();
}

function applyAdminOrderSearchFilter() {
  const query = normalizarTexto(adminControlState.orderSearch || "");
  document.querySelectorAll("[data-admin-order-group]").forEach((group) => {
    group.classList.toggle("hidden", Boolean(query) && !String(group.dataset.search || "").includes(query));
  });
  document.querySelectorAll("[data-admin-order-row]").forEach((row) => {
    row.classList.toggle("hidden", Boolean(query) && !String(row.dataset.search || "").includes(query));
  });
}

function handleAdminOrderSort(value = "newest") {
  adminControlState.orderSort = value;
  renderAdminOrders();
}

function handleAdminConfirmedPeriod(value = "month") {
  adminControlState.confirmedPeriod = value;
  renderAdminOrders();
}

function getConfirmedOrdersForCurrentPeriod() {
  return getAllAdminOrders()
    .filter((pedido) => pedido.status === "pagado")
    .filter((pedido) => isDateInAdminPeriod(pedido.fecha, adminControlState.confirmedPeriod));
}

function downloadConfirmedGainsExcel() {
  const rows = getConfirmedOrdersForCurrentPeriod();
  if (!rows.length) return mostrarMensaje("No hay ganancias confirmadas para descargar en este periodo.");
  const total = rows.reduce((sum, pedido) => sum + Number(pedido.gananciaTotal || 0), 0);
  const tableRows = rows.map((pedido) => `
    <tr>
      <td>${escapeHtmlAttribute(pedido.username || "Cliente")}</td>
      <td>${escapeHtmlAttribute(pedido.telefono || "")}</td>
      <td>${new Date(pedido.fecha || Date.now()).toLocaleString()}</td>
      <td>${pedido.total || 0}</td>
      <td>${pedido.gananciaTotal || 0}</td>
      <td>${escapeHtmlAttribute((pedido.productos || []).map((item) => `${item.nombre} x${item.cantidad}`).join(", "))}</td>
    </tr>
  `).join("");
  const markup = `
    <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <h2>Ganancias confirmadas</h2>
        <p>Periodo: ${getAdminPeriodLabel(adminControlState.confirmedPeriod)} - Total ganancia: ${total}</p>
        <table border="1">
          <thead><tr><th>Usuario</th><th>Telefono</th><th>Fecha</th><th>Total venta</th><th>Ganancia</th><th>Productos</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([markup], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ganancias_confirmadas_${adminControlState.confirmedPeriod}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function limpiarPedidosPagadosAdmin() {
  const paidOrders = getAllAdminOrders().filter((pedido) => pedido.status === "pagado");
  if (!paidOrders.length) return mostrarMensaje("No hay pedidos pagados para limpiar.");
  if (!confirm(`Eliminar del registro ${paidOrders.length} pedido(s) pagado(s)?`)) return;
  const paidIds = new Set(paidOrders.map((pedido) => pedido.id));
  const deletedOrders = new Set(readLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, []));
  paidIds.forEach((id) => deletedOrders.add(id));
  writeLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, [...deletedOrders].slice(-800));
  const localOrders = readLocalJson(ADMIN_LOCAL_KEYS.orders, []).filter((pedido) => !paidIds.has(buildOrderSignature(pedido)));
  writeLocalJson(ADMIN_LOCAL_KEYS.orders, localOrders);
  if (adminControlState.source) adminControlState.source.localOrders = localOrders;
  recordUserActivity("pedidos_pagados_limpiados", { cantidad: paidOrders.length });
  renderAdminControl();
}

function buildMonthlyCloseSnapshot() {
  const sourceOrders = getAllAdminOrders();
  return {
    createdAt: new Date().toISOString(),
    orders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []),
    wholesaleOrders: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, []),
    activity: readLocalJson(ADMIN_LOCAL_KEYS.activity, []),
    deletedOrders: readLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, []),
    sourceOrders,
    paidOrders: sourceOrders.filter((pedido) => pedido.status === "pagado"),
    pendingOrders: sourceOrders.filter((pedido) => pedido.status !== "pagado")
  };
}

function getMonthlyCloseMetrics() {
  const orders = getAllAdminOrders();
  const productMap = new Map();
  const detailRows = [];
  let totalSales = 0;
  let confirmedGain = 0;
  let pendingGain = 0;
  let creditTotal = 0;
  let creditPaid = 0;
  let creditRemaining = 0;
  let creditPartialGain = 0;
  orders.forEach((pedido) => {
    totalSales += Number(pedido.total || 0);
    if (pedido.status === "pagado") confirmedGain += Number(pedido.gananciaTotal || 0);
    else pendingGain += Number(pedido.gananciaTotal || 0);
    if (pedido.paymentMode === "credito") {
      const credit = getCreditInfo(pedido);
      creditTotal += credit.total;
      creditPaid += credit.paid;
      creditRemaining += credit.remaining;
      creditPartialGain += credit.gainSoFar;
    }
    (pedido.productos || []).forEach((item) => {
      const current = productMap.get(item.nombre) || { nombre: item.nombre, cantidad: 0, venta: 0, ganancia: 0 };
      current.cantidad += Number(item.cantidad || 1);
      current.venta += Number(item.subtotal || item.precioVenta || 0);
      current.ganancia += Number(item.gananciaTotal || 0);
      productMap.set(item.nombre, current);
      const quantity = Number(item.cantidad || 1);
      const unitPrice = Number(item.precioVenta || item.unitPrice || item.precio || 0);
      const subtotal = Number(item.subtotal ?? unitPrice * quantity);
      const wholesaleUnit = item.precioMayorista === null || item.precioMayorista === undefined || item.precioMayorista === ""
        ? ""
        : Number(item.precioMayorista || 0);
      detailRows.push({
        fecha: pedido.fecha || "",
        usuario: pedido.username || "Cliente",
        telefono: pedido.telefono || "",
        estado: pedido.status || "pendiente",
        metodoPago: pedido.paymentMode === "credito" ? "Credito" : "Normal",
        fechaCredito: pedido.creditDueDate || "",
        creditoPagado: Number(pedido.creditPaid || 0),
        creditoFaltante: getCreditInfo(pedido).remaining,
        producto: item.nombre,
        cantidad: quantity,
        precioUnidad: unitPrice,
        precioMayoristaUnidad: wholesaleUnit,
        subtotal,
        ganancia: Number(item.gananciaTotal || 0)
      });
    });
  });
  const products = [...productMap.values()].sort((a, b) => b.cantidad - a.cantidad);
  const lowStock = catalogos.flatMap((cat) => (cat.productos || [])
    .filter((prod) => hasInventory(prod) && Number(prod.stock || 0) <= Number(prod.stockAlert || 3))
    .map((prod) => ({ catalogo: cat.nombre, nombre: prod.nombre, stock: prod.stock, alerta: prod.stockAlert })));
  return { orders, products, lowStock, detailRows, totalSales, confirmedGain, pendingGain, creditTotal, creditPaid, creditRemaining, creditPartialGain };
}

function downloadMonthlyCloseExcel(metrics = getMonthlyCloseMetrics()) {
  const topRows = metrics.products.map((item) => `
    <tr><td>${escapeHtmlAttribute(item.nombre)}</td><td>${item.cantidad}</td><td>${item.venta}</td><td>${item.ganancia}</td></tr>
  `).join("");
  const lowRows = metrics.lowStock.map((item) => `
    <tr><td>${escapeHtmlAttribute(item.catalogo)}</td><td>${escapeHtmlAttribute(item.nombre)}</td><td>${item.stock}</td><td>${item.alerta}</td></tr>
  `).join("");
  const orderRows = metrics.orders.map((pedido) => `
    <tr><td>${escapeHtmlAttribute(pedido.username || "Cliente")}</td><td>${escapeHtmlAttribute(pedido.telefono || "")}</td><td>${pedido.status}</td><td>${pedido.paymentMode === "credito" ? "Credito" : "Normal"}</td><td>${new Date(pedido.fecha || Date.now()).toLocaleString()}</td><td>${pedido.total || 0}</td><td>${pedido.gananciaTotal || 0}</td><td>${pedido.creditPaid || 0}</td><td>${getCreditInfo(pedido).remaining}</td><td>${pedido.creditDueDate || ""}</td></tr>
  `).join("");
  const detailRows = metrics.detailRows.map((row) => `
    <tr>
      <td>${new Date(row.fecha || Date.now()).toLocaleString()}</td>
      <td>${escapeHtmlAttribute(row.usuario)}</td>
      <td>${escapeHtmlAttribute(row.telefono)}</td>
      <td>${escapeHtmlAttribute(row.estado)}</td>
      <td>${escapeHtmlAttribute(row.metodoPago)}</td>
      <td>${escapeHtmlAttribute(row.producto)}</td>
      <td>${row.cantidad}</td>
      <td>${row.precioUnidad}</td>
      <td>${row.precioMayoristaUnidad}</td>
      <td>${row.subtotal}</td>
      <td>${row.ganancia}</td>
      <td>${row.creditoPagado}</td>
      <td>${row.creditoFaltante}</td>
      <td>${escapeHtmlAttribute(row.fechaCredito)}</td>
    </tr>
  `).join("");
  const markup = `
    <html><head><meta charset="UTF-8"></head><body>
      <h2>Cierre del mes</h2>
      <p>Fecha de cierre: ${new Date().toLocaleString()}</p>
      <p>Total ventas: ${metrics.totalSales}</p>
      <p>Ganancia confirmada: ${metrics.confirmedGain}</p>
      <p>Ganancia pendiente: ${metrics.pendingGain}</p>
      <p>Total ventas a credito: ${metrics.creditTotal}</p>
      <p>Total pagado a credito: ${metrics.creditPaid}</p>
      <p>Total faltante a credito: ${metrics.creditRemaining}</p>
      <p>Ganancia parcial a credito: ${metrics.creditPartialGain}</p>
      <h3>Productos vendidos</h3>
      <table border="1"><thead><tr><th>Producto</th><th>Cantidad</th><th>Venta</th><th>Ganancia</th></tr></thead><tbody>${topRows}</tbody></table>
      <h3>Detalle completo de ventas por producto</h3>
      <table border="1"><thead><tr><th>Fecha venta</th><th>Usuario</th><th>Telefono</th><th>Estado</th><th>Metodo pago</th><th>Producto</th><th>Cantidad</th><th>Precio unidad</th><th>Precio mayorista unidad</th><th>Subtotal</th><th>Ganancia</th><th>Credito pagado</th><th>Credito faltante</th><th>Fecha pago credito</th></tr></thead><tbody>${detailRows}</tbody></table>
      <h3>Productos escasos</h3>
      <table border="1"><thead><tr><th>Catalogo</th><th>Producto</th><th>Stock</th><th>Alerta</th></tr></thead><tbody>${lowRows}</tbody></table>
      <h3>Pedidos</h3>
      <table border="1"><thead><tr><th>Usuario</th><th>Telefono</th><th>Estado</th><th>Metodo pago</th><th>Fecha</th><th>Total</th><th>Ganancia</th><th>Credito pagado</th><th>Credito faltante</th><th>Fecha pago credito</th></tr></thead><tbody>${orderRows}</tbody></table>
    </body></html>
  `;
  const blob = new Blob([markup], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cierre_mes_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function guardarSnapshotCierre(snapshot) {
  const closures = readLocalJson(ADMIN_LOCAL_KEYS.monthlyClosures, []);
  closures.unshift(snapshot);
  writeLocalJson(ADMIN_LOCAL_KEYS.monthlyClosures, closures.slice(0, 2));
}

function ejecutarCierreDelMes() {
  const metrics = getMonthlyCloseMetrics();
  if (!metrics.orders.length && !metrics.products.length) return mostrarMensaje("No hay datos para cerrar este mes.");
  const snapshot = buildMonthlyCloseSnapshot();
  downloadMonthlyCloseExcel(metrics);
  if (!confirm("Cuando confirmes, se cerraran solo las ganancias confirmadas y pedidos pagados. Los pedidos pendientes seguiran visibles como ganancia pendiente. Ya descargaste el Excel?")) return;
  guardarSnapshotCierre(snapshot);
  const deletedOrders = new Set(readLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, []));
  snapshot.paidOrders.forEach((pedido) => deletedOrders.add(pedido.id));
  writeLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, [...deletedOrders].slice(-1000));
  const pendingLocalOrders = (snapshot.orders || []).filter((pedido) => normalizeAdminOrder(pedido).status !== "pagado");
  const pendingWholesaleOrders = (snapshot.wholesaleOrders || []).filter((pedido) => normalizeAdminOrder(pedido).status !== "pagado");
  writeLocalJson(ADMIN_LOCAL_KEYS.orders, pendingLocalOrders);
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, pendingWholesaleOrders);
  writeLocalJson(ADMIN_LOCAL_KEYS.activity, []);
  adminControlState.source = {
    ...(adminControlState.source || {}),
    localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []),
    wholesaleOrders: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, []),
    activity: []
  };
  recordUserActivity("cierre_mes", {
    pedidosPagadosCerrados: snapshot.paidOrders.length,
    pedidosPendientesConservados: snapshot.pendingOrders.length,
    gananciaConfirmada: metrics.confirmedGain,
    gananciaPendiente: metrics.pendingGain
  });
  renderAdminControl();
}

function restaurarCierreMensual(index = 0) {
  const closures = readLocalJson(ADMIN_LOCAL_KEYS.monthlyClosures, []);
  const snapshot = closures[index];
  if (!snapshot) return mostrarMensaje("No hay respaldo disponible en esa posicion.");
  if (!confirm("Restaurar estos datos cerrados? Esto reemplazara los datos administrativos actuales.")) return;
  writeLocalJson(ADMIN_LOCAL_KEYS.orders, snapshot.orders || []);
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, snapshot.wholesaleOrders || []);
  writeLocalJson(ADMIN_LOCAL_KEYS.activity, snapshot.activity || []);
  writeLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, snapshot.deletedOrders || []);
  adminControlState.source = {
    ...(adminControlState.source || {}),
    localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []),
    wholesaleOrders: readLocalJson(ADMIN_LOCAL_KEYS.wholesaleOrders, []),
    activity: readLocalJson(ADMIN_LOCAL_KEYS.activity, [])
  };
  renderAdminControl();
}

function renderMonthlyClosePanel() {
  const body = document.getElementById("adminControlBody");
  const summary = document.getElementById("adminControlSummary");
  if (!body) return;
  if (summary && !summary.innerHTML.trim()) renderAdminSummary();
  const metrics = getMonthlyCloseMetrics();
  const closures = readLocalJson(ADMIN_LOCAL_KEYS.monthlyClosures, []);
  const analyticsClosures = readLocalJson(ADMIN_LOCAL_KEYS.analyticsClosures, []);
  body.innerHTML = `
    <section class="admin-control-card">
      <h3>Cierre del mes</h3>
      <p class="modal-note">Descarga un Excel con el resumen importante y luego limpia pedidos y movimientos para iniciar el proximo mes sin mezclar facturas.</p>
      <div class="admin-control-summary">
        <div class="admin-stat-card"><span>Pedidos actuales</span><strong>${metrics.orders.length}</strong></div>
        <div class="admin-stat-card"><span>Ganancia confirmada</span><strong>$${metrics.confirmedGain}</strong></div>
        <div class="admin-stat-card"><span>Ganancia pendiente</span><strong>$${metrics.pendingGain}</strong></div>
        <div class="admin-stat-card"><span>Productos escasos</span><strong>${metrics.lowStock.length}</strong></div>
      </div>
      <div class="admin-control-actions">
        <button type="button" onclick="ejecutarCierreDelMes()">Cierre del mes</button>
        <button type="button" onclick="downloadMonthlyCloseExcel()">Descargar Excel sin limpiar</button>
      </div>
    </section>
    <section class="admin-control-card">
      <h3>Cierres de analitica</h3>
      <p class="modal-note">Respalda mas pedidos, mas agregados al carrito y favoritos. Se guardan maximo los ultimos 2 cierres.</p>
      <div class="admin-control-actions">
        <button type="button" onclick="ejecutarCierreAnaliticaDelMes()">Cierre del mes de analitica</button>
        ${analyticsClosures.map((item, index) => `<button type="button" onclick="downloadSavedAnalyticsClose(${index})">Excel analitica ${new Date(item.createdAt).toLocaleDateString()}</button><button type="button" onclick="restaurarCierreAnalitica(${index})">Restaurar analitica ${index + 1}</button>`).join("") || "<small>No hay cierres de analitica guardados.</small>"}
      </div>
    </section>
    <section class="admin-control-card">
      <h3>Rehacer datos</h3>
      <p class="modal-note">Puedes recuperar maximo los ultimos 2 cierres guardados.</p>
      <div class="admin-control-actions">
        ${closures.map((item, index) => `<button type="button" onclick="restaurarCierreMensual(${index})">Restaurar ${index === 0 ? "ultimo cierre" : "cierre anterior"} - ${new Date(item.createdAt).toLocaleDateString()}</button>`).join("") || "<small>No hay cierres guardados todavia.</small>"}
      </div>
    </section>
  `;
}

function getEditableOrdersWithCurrent(id = "") {
  const stored = getStoredAdminOrders();
  if (stored.some((pedido) => pedido.id === id)) return stored;
  const current = getAllAdminOrders().find((pedido) => pedido.id === id);
  return current ? [current, ...stored] : stored;
}

function saveEditableOrder(order) {
  const normalizedOrder = normalizeAdminOrder(order);
  if (normalizedOrder.orderType === "wholesale") {
    const wholesaleOrders = getWholesaleOrders();
    const wholesaleIndex = wholesaleOrders.findIndex((pedido) => pedido.id === normalizedOrder.id);
    if (wholesaleIndex >= 0) wholesaleOrders[wholesaleIndex] = normalizedOrder;
    else wholesaleOrders.unshift(normalizedOrder);
    saveWholesaleOrders(wholesaleOrders);
    persistAdminOrders(getStoredAdminOrders().filter((pedido) => pedido.id !== normalizedOrder.id));
    adminControlState.source = { ...(adminControlState.source || {}), localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []) };
    renderCentroMayoristaIfOpen();
    renderAdminControl();
    return;
  }
  const orders = getEditableOrdersWithCurrent(normalizedOrder.id);
  const index = orders.findIndex((pedido) => pedido.id === normalizedOrder.id);
  if (index >= 0) orders[index] = normalizedOrder;
  else orders.unshift(normalizedOrder);
  persistAdminOrders(orders);
  adminControlState.source = { ...(adminControlState.source || {}), localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []) };
  renderAdminControl();
}

function marcarPedidoAdmin(id = "", status = "pendiente") {
  const order = getAllAdminOrders().find((pedido) => pedido.id === id);
  if (!order) return;
  const nextOrder = normalizeAdminOrder({ ...order, status });
  if (status === "pagado") nextOrder.paidAt = new Date().toISOString();
  if (status === "pagado" && nextOrder.paymentMode === "credito") {
    nextOrder.creditPaid = Number(nextOrder.total || 0);
  }
  if (status === "pagado" && !nextOrder.inventoryApplied) {
    updateInventoryAfterConfirmedOrder(nextOrder.productos || []);
    nextOrder.inventoryApplied = true;
  }
  if (status === "pendiente" && nextOrder.inventoryApplied) {
    restoreInventoryFromOrder(nextOrder.productos || []);
    nextOrder.inventoryApplied = false;
  }
  saveEditableOrder(nextOrder);
  recordUserActivity("pedido_estado", { pedido: id, status });
}

function marcarPedidoCredito(id = "") {
  abrirPanelPedidoAdmin(id, "credito");
}

function agregarAbonoCredito(id = "") {
  abrirPanelPedidoAdmin(id, "abono");
}

function cerrarPanelEdicionAdmin() {
  document.getElementById("adminEditPanelModal")?.classList.remove("cash-movement-panel");
  closeModal("adminEditPanelModal");
}

function abrirPanelPedidoAdmin(id = "", mode = "editar") {
  const order = getAllAdminOrders().find((pedido) => pedido.id === id);
  if (!order) return;
  adminEditPanelState = { type: "pedido", orderId: id };
  document.getElementById("adminEditPanelTitle").textContent = mode === "credito" ? "Pedido a credito" : mode === "abono" ? "Abonar credito" : "Modificar pedido";
  document.getElementById("adminEditPanelNote").textContent = "Edita estado, credito, fechas, productos, cantidades, precios y ganancias desde este panel.";
  const normalized = normalizeAdminOrder(order);
  const productRows = (normalized.productos || []).map((item, index) => {
    const payment = getOrderLinePaymentInfo(item);
    return `
      <div class="builder-link-editor-row order-edit-line ${payment.status === "pagado" ? "line-paid" : "line-pending"}">
        <p><strong>${escapeHtmlAttribute(item.nombre || `Producto ${index + 1}`)}</strong> <span class="payment-pill ${payment.status === "pagado" ? "paid" : "pending"}">${payment.status === "pagado" ? "Pagado" : "Pendiente"}</span></p>
        <small class="order-line-mini-total" data-order-mini="${index}">Precio $${Number(item.precioVenta || item.unitPrice || item.precio || 0)} x ${Number(item.cantidad || 1)} = $${Number(item.subtotal || 0)}</small>
        <label>Cantidad<input data-order-line="${index}" data-order-field="cantidad" type="number" step="1" min="1" value="${Number(item.cantidad || 1)}" oninput="actualizarMiniTextoPedido(${index})"></label>
        <label>Precio venta<input data-order-line="${index}" data-order-field="unitPrice" type="number" step="0.01" value="${Number(item.precioVenta || item.unitPrice || item.precio || 0)}" oninput="actualizarMiniTextoPedido(${index})"></label>
        <label>Costo mayorista<input data-order-line="${index}" data-order-field="precioMayorista" type="number" step="0.01" value="${item.precioMayorista ?? ""}" placeholder="Sin costo mayorista"></label>
        <label>Tipo de pago de este producto<select data-order-line="${index}" data-order-field="paymentMode">
          <option value="normal" ${payment.paymentMode !== "credito" ? "selected" : ""}>Pago normal</option>
          <option value="credito" ${payment.paymentMode === "credito" ? "selected" : ""}>A credito</option>
        </select></label>
        <label>Ganancia manual si no hay mayorista<input data-order-line="${index}" data-order-field="gananciaManualTotal" type="number" step="0.01" value="${item.precioMayorista === null || item.precioMayorista === undefined ? Number(item.gananciaTotal || 0) : ""}"></label>
        <label>Pagado de este producto<input data-order-line="${index}" data-order-field="paidAmount" type="number" step="0.01" value="${Number(item.paidAmount || (payment.status === "pagado" ? payment.subtotal : 0))}"></label>
        <label>Nota del producto<textarea data-order-line="${index}" data-order-field="notaPedido" placeholder="Detalle extra de esta linea">${escapeHtml(item.notaPedido || "")}</textarea></label>
        <div class="builder-action-row">
          <button type="button" onclick="marcarLineaPedidoPanel(${index}, true)">Linea pagada</button>
          <button type="button" onclick="marcarLineaPedidoPanel(${index}, false)">Linea pendiente</button>
        </div>
      </div>
    `;
  }).join("");
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <div class="admin-control-grid">
        <label>Total pedido<input id="editOrderTotal" type="number" step="0.01" value="${Number(normalized.total || 0)}"></label>
        <label>Estado<select id="editOrderStatus"><option value="pendiente" ${normalized.status !== "pagado" ? "selected" : ""}>Pendiente</option><option value="pagado" ${normalized.status === "pagado" ? "selected" : ""}>Pagado</option></select></label>
        <label>Metodo<select id="editOrderPaymentMode"><option value="normal" ${normalized.paymentMode !== "credito" ? "selected" : ""}>Normal</option><option value="credito" ${normalized.paymentMode === "credito" || mode === "credito" ? "selected" : ""}>Credito</option></select></label>
        <label>Fecha pedido<input id="editOrderDate" type="datetime-local" value="${toDatetimeLocalValue(normalized.fecha)}"></label>
        <label>Fecha limite credito<input id="editOrderCreditDue" type="date" value="${normalized.creditDueDate || ""}"></label>
        <label>Pagado credito<input id="editOrderCreditPaid" type="number" step="0.01" value="${Number(normalized.creditPaid || 0)}"></label>
        <label>Abono nuevo<input id="editOrderNewPayment" type="number" step="0.01" placeholder="Monto recibido ahora"></label>
      </div>
      <h3>Productos</h3>
      <div class="builder-link-editor-list">${productRows}</div>
      <div class="modal-actions">
        <button type="button" onclick="aplicarAbonoPedidoPanel()">Aplicar abono al total</button>
        <button type="button" onclick="marcarTodoPedidoPanel(true)">Todo pagado</button>
        <button type="button" onclick="marcarTodoPedidoPanel(false)">Todo pendiente</button>
        <button type="button" onclick="guardarPanelPedidoAdmin()">Guardar cambios</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function actualizarMiniTextoPedido(index) {
  const qty = Number(document.querySelector(`[data-order-line="${index}"][data-order-field="cantidad"]`)?.value || 1);
  const unit = Number(document.querySelector(`[data-order-line="${index}"][data-order-field="unitPrice"]`)?.value || 0);
  const target = document.querySelector(`[data-order-mini="${index}"]`);
  if (target) target.textContent = `Precio $${unit} x ${qty} = $${unit * qty}`;
}

function toDatetimeLocalValue(value = "") {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getOrderDraftFromPanel() {
  const order = normalizeAdminOrder(getAllAdminOrders().find((pedido) => pedido.id === adminEditPanelState.orderId) || {});
  const productos = (order.productos || []).map((item, index) => {
    const getField = (name) => document.querySelector(`[data-order-line="${index}"][data-order-field="${name}"]`)?.value;
    const precioMayoristaRaw = getField("precioMayorista");
    const precioMayorista = parseFloat(precioMayoristaRaw);
    return buildOrderLineStats({
      ...item,
      cantidad: parseInt(getField("cantidad") || item.cantidad || "1", 10),
      unitPrice: parseFloat(getField("unitPrice") || item.unitPrice || item.precioVenta || item.precio || "0"),
      precio: parseFloat(getField("unitPrice") || item.precio || "0"),
      precioMayorista: precioMayoristaRaw === "" || Number.isNaN(precioMayorista) ? null : precioMayorista,
      costoMayorista: precioMayoristaRaw === "" || Number.isNaN(precioMayorista) ? null : precioMayorista,
      gananciaManualTotal: parseFloat(getField("gananciaManualTotal") || item.gananciaManualTotal || item.gananciaTotal || "0"),
      paidAmount: parseFloat(getField("paidAmount") || "0"),
      paymentMode: getField("paymentMode") === "credito" ? "credito" : "normal",
      notaPedido: getField("notaPedido") || ""
    });
  });
  const total = parseFloat(document.getElementById("editOrderTotal")?.value || "");
  const creditPaid = parseFloat(document.getElementById("editOrderCreditPaid")?.value || "0");
  return normalizeAdminOrder({
    ...order,
    productos,
    total: Number.isNaN(total) ? productos.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) : total,
    status: document.getElementById("editOrderStatus")?.value || "pendiente",
    paymentMode: productos.some((item) => item.paymentMode === "credito") ? "credito" : (document.getElementById("editOrderPaymentMode")?.value || "normal"),
    fecha: document.getElementById("editOrderDate")?.value ? new Date(document.getElementById("editOrderDate").value).toISOString() : order.fecha,
    creditDueDate: document.getElementById("editOrderCreditDue")?.value || "",
    creditPaid: Number.isNaN(creditPaid) ? 0 : creditPaid,
    gananciaTotal: productos.reduce((sum, item) => sum + Number(item.gananciaTotal || 0), 0),
    paidAt: (document.getElementById("editOrderStatus")?.value || "pendiente") === "pagado" ? (order.paidAt || new Date().toISOString()) : ""
  });
}

function marcarLineaPedidoPanel(index, paid) {
  const amountField = document.querySelector(`[data-order-line="${index}"][data-order-field="paidAmount"]`);
  const qty = Number(document.querySelector(`[data-order-line="${index}"][data-order-field="cantidad"]`)?.value || 1);
  const unit = Number(document.querySelector(`[data-order-line="${index}"][data-order-field="unitPrice"]`)?.value || 0);
  if (amountField) amountField.value = paid ? String(qty * unit) : "0";
}

function marcarTodoPedidoPanel(paid) {
  document.querySelectorAll("[data-order-line][data-order-field='paidAmount']").forEach((field) => {
    const index = field.dataset.orderLine;
    marcarLineaPedidoPanel(index, paid);
  });
  document.getElementById("editOrderStatus").value = paid ? "pagado" : "pendiente";
  document.getElementById("editOrderCreditPaid").value = paid ? document.getElementById("editOrderTotal").value : "0";
}

function aplicarAbonoPedidoPanel() {
  const amount = Number(document.getElementById("editOrderNewPayment")?.value || 0);
  if (!amount || amount <= 0) return mostrarMensaje("Escribe un abono valido.");
  let remaining = amount;
  document.querySelectorAll("[data-order-line][data-order-field='paidAmount']").forEach((field) => {
    const index = field.dataset.orderLine;
    const qty = Number(document.querySelector(`[data-order-line="${index}"][data-order-field="cantidad"]`)?.value || 1);
    const unit = Number(document.querySelector(`[data-order-line="${index}"][data-order-field="unitPrice"]`)?.value || 0);
    const subtotal = qty * unit;
    const current = Number(field.value || 0);
    const needed = Math.max(0, subtotal - current);
    const add = Math.min(needed, remaining);
    field.value = String(current + add);
    remaining -= add;
  });
  const currentPaid = Number(document.getElementById("editOrderCreditPaid")?.value || 0);
  document.getElementById("editOrderCreditPaid").value = String(currentPaid + amount);
  document.getElementById("editOrderPaymentMode").value = "credito";
}

function guardarPanelPedidoAdmin() {
  const previous = getAllAdminOrders().find((pedido) => pedido.id === adminEditPanelState.orderId);
  const nextOrder = getOrderDraftFromPanel();
  if (nextOrder.status === "pagado" && !nextOrder.inventoryApplied) {
    updateInventoryAfterConfirmedOrder(nextOrder.productos || []);
    nextOrder.inventoryApplied = true;
  }
  if (nextOrder.status !== "pagado" && previous?.inventoryApplied) {
    restoreInventoryFromOrder(previous.productos || []);
    nextOrder.inventoryApplied = false;
  }
  saveEditableOrder(nextOrder);
  cerrarPanelEdicionAdmin();
  recordUserActivity("pedido_modificado", { pedido: nextOrder.id, total: nextOrder.total, ganancia: nextOrder.gananciaTotal });
}

function confirmarTodosPedidosPendientes() {
  const pendingOrders = getAllAdminOrders().filter((pedido) => pedido.status !== "pagado");
  if (!pendingOrders.length) return mostrarMensaje("No hay pedidos pendientes para confirmar.");
  if (!confirm(`Confirmar como pagados ${pendingOrders.length} pedido(s) pendiente(s)?`)) return;
  const storedOrders = getStoredAdminOrders();
  const ordersById = new Map(storedOrders.map((pedido) => [pedido.id, pedido]));
  pendingOrders.forEach((pedido) => {
    const productos = (pedido.productos || []).map(buildOrderLineStats);
    const nextOrder = normalizeAdminOrder({
      ...pedido,
      productos,
      gananciaTotal: productos.reduce((sum, item) => sum + Number(item.gananciaTotal || 0), 0),
      status: "pagado",
      inventoryApplied: true
    });
    if (!pedido.inventoryApplied) updateInventoryAfterConfirmedOrder(productos);
    ordersById.set(nextOrder.id, nextOrder);
  });
  persistAdminOrders([...ordersById.values()]);
  recordUserActivity("pedidos_pendientes_confirmados", { cantidad: pendingOrders.length });
  renderAdminControl();
}

function editarPedidoAdmin(id = "") {
  abrirPanelPedidoAdmin(id, "editar");
}

function editarPedidoAdminAnterior(id = "") {
  abrirPanelPedidoAdmin(id, "editar");
}

function eliminarPedidoAdmin(id = "") {
  if (!confirm("Eliminar este pedido del registro administrativo?")) return;
  const deletedOrder = getAllAdminOrders().find((pedido) => pedido.id === id);
  if (deletedOrder?.inventoryApplied) restoreInventoryFromOrder(deletedOrder.productos || []);
  const deletedOrders = new Set(readLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, []));
  deletedOrders.add(id);
  writeLocalJson(ADMIN_LOCAL_KEYS.deletedOrders, [...deletedOrders].slice(-500));
  if (deletedOrder?.orderType === "wholesale") saveWholesaleOrders(getWholesaleOrders().filter((pedido) => pedido.id !== id));
  const orders = getEditableOrdersWithCurrent(id).filter((pedido) => pedido.id !== id);
  persistAdminOrders(orders);
  adminControlState.source = { ...(adminControlState.source || {}), localOrders: readLocalJson(ADMIN_LOCAL_KEYS.orders, []) };
  renderCentroMayoristaIfOpen();
  renderAdminControl();
  recordUserActivity("pedido_eliminado", { pedido: id });
}

function resetearGananciasPedidos() {
  if (!confirm("Resetear las ganancias manuales y recalcular todos los pedidos locales?")) return;
  const orders = getStoredAdminOrders().map((pedido) => {
    const productos = (pedido.productos || []).map(buildOrderLineStats);
    return normalizeAdminOrder({
      ...pedido,
      productos,
      gananciaTotal: productos.reduce((sum, item) => sum + Number(item.gananciaTotal || 0), 0)
    });
  });
  persistAdminOrders(orders);
  renderAdminControl();
}

function renderAdminInventory() {
  const body = document.getElementById("adminControlBody");
  if (!body) return;
  const products = catalogos
    .flatMap((cat, ci) => (cat.productos || []).map((prod, pi) => ({ ...prod, ci, pi, catalogo: cat.nombre })))
    .sort((a, b) => {
      const aHasStock = hasInventory(a);
      const bHasStock = hasInventory(b);
      if (aHasStock && bHasStock) return Number(a.stock || 0) - Number(b.stock || 0) || String(a.nombre || "").localeCompare(String(b.nombre || ""));
      if (aHasStock !== bHasStock) return aHasStock ? -1 : 1;
      return String(a.nombre || "").localeCompare(String(b.nombre || ""));
    });
  body.innerHTML = `
    <div class="admin-control-table">
      ${products.map((prod) => {
        const status = getStockStatus(prod);
        return `
          <article class="admin-control-row">
            <div class="admin-control-row-main">
              <strong>${escapeHtmlAttribute(prod.nombre)}</strong>
              <small>${escapeHtmlAttribute(prod.catalogo)} · Venta $${prod.precio} · Mayorista $${prod.precioMayorista} · Ganancia $${Number(prod.precio || 0) - Number(prod.precioMayorista || 0)}</small>
              <span class="stock-pill ${status.className}">${status.label}</span>
            </div>
            <div class="admin-control-actions">
              <button type="button" onclick="editarInventarioProducto(${prod.ci},${prod.pi})">Editar inventario</button>
              <button type="button" onclick="editarProducto(${prod.ci},${prod.pi})">Editar producto</button>
            </div>
          </article>
        `;
      }).join("") || `<div class="admin-control-card">No hay productos.</div>`}
    </div>
  `;
}

function renderAdminPromotions() {
  const body = document.getElementById("adminControlBody");
  const contacts = readLocalJson(ADMIN_LOCAL_KEYS.contacts, []);
  const userContacts = getAdminUserRows().filter((user) => user.telefono || user.email);
  if (!body) return;
  body.innerHTML = `
    <div class="admin-control-grid">
      <section class="admin-control-card">
        <h3>Promocion global</h3>
        <textarea id="promoMessage" placeholder="Escribe el mensaje, oferta o enlace para enviar por WhatsApp"></textarea>
        <div class="admin-control-actions">
          <button type="button" onclick="enviarPromocionGlobal()">Enviar promocion</button>
        </div>
      </section>
      <section class="admin-control-card">
        <h3>Contacto personalizado</h3>
        <input id="customContactName" placeholder="Nombre">
        <input id="customContactPhone" inputmode="tel" placeholder="Telefono con codigo internacional">
        <input id="customContactNote" placeholder="Nota opcional">
        <div class="admin-control-actions">
          <button type="button" onclick="agregarContactoPersonalizado()">Agregar contacto</button>
        </div>
      </section>
    </div>
    <div class="admin-control-table" style="margin-top:14px">
      <h3>Usuarios registrados con contacto</h3>
      ${userContacts.map((user) => `
        <article class="admin-control-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(user.username || "Usuario")}</strong>
            <small>${escapeHtmlAttribute(user.email || "Sin correo")} Â· ${escapeHtmlAttribute(user.telefono || "Sin telefono")}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(user.telefono || "")}')">Contactar</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay usuarios registrados con telefono o correo.</div>`}
    </div>
    <div class="admin-control-table" style="margin-top:14px">
      <h3>Contactos personalizados</h3>
      ${contacts.map((contact, index) => `
        <article class="admin-control-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(contact.nombre)}</strong>
            <small>${escapeHtmlAttribute(contact.telefono)} · ${escapeHtmlAttribute(contact.nota || "Sin nota")}</small>
          </div>
          <div class="admin-control-actions">
            <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(contact.telefono)}')">Contactar</button>
            <button type="button" class="danger-btn" onclick="eliminarContactoPersonalizado(${index})">Eliminar</button>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay contactos personalizados.</div>`}
    </div>
  `;
}

function renderAdminMovements() {
  const body = document.getElementById("adminControlBody");
  const activity = cleanOldAdminMovements(true);
  if (!body) return;
  body.innerHTML = `
    <div class="admin-control-toolbar">
      <button type="button" class="danger-btn" onclick="limpiarMovimientosAdmin()">Limpiar movimientos</button>
      <small>Los movimientos se eliminan automaticamente despues de 7 dias.</small>
    </div>
    <div class="admin-control-table">
      ${activity.map((entry) => `
        <article class="admin-control-row">
          <div class="admin-control-row-main">
            <strong>${escapeHtmlAttribute(entry.type)} · ${escapeHtmlAttribute(entry.username || "Usuario")}</strong>
            <small>${new Date(entry.fecha).toLocaleString()}</small>
            <small>${escapeHtmlAttribute(JSON.stringify(entry.detail || {}))}</small>
          </div>
        </article>
      `).join("") || `<div class="admin-control-card">No hay movimientos registrados.</div>`}
    </div>
  `;
}

function restoreBossAnalyticsShellToModal() {
  const modal = document.getElementById("bossInsightsModal");
  const shell = document.querySelector("#adminControlBody .boss-analytics-shell");
  if (modal && shell) modal.appendChild(shell);
}

function renderAdminControl() {
  if (adminControlState.tab !== "analitica") restoreBossAnalyticsShellToModal();
  renderAdminSummary();
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === adminControlState.tab);
  });
  if (adminControlState.tab === "usuarios") return renderAdminUsers();
  if (adminControlState.tab === "analitica") return renderAdminAnalytics();
  if (adminControlState.tab === "pedidos") return renderAdminOrders();
  if (adminControlState.tab === "inventario") return renderAdminInventory();
  if (adminControlState.tab === "promociones") return renderAdminPromotions();
  if (adminControlState.tab === "movimientos") return renderAdminMovements();
  if (adminControlState.tab === "cierre") return renderMonthlyClosePanel();
  return renderAdminDashboard();
}

async function abrirCentroControl() {
  if (!canOpenAdminControlCenter()) return mostrarMensaje("Solo boss o administradores pueden abrir el Centro de Control.");
  openModal("adminControlModal");
  adminControlState.source = await fetchAdminControlSource();
  renderAdminControl();
}

function cerrarCentroControl() {
  restoreBossAnalyticsShellToModal();
  closeModal("adminControlModal");
}

function cambiarAdminControlTab(tab) {
  adminControlState.tab = tab;
  renderAdminControl();
}

function contactarUsuarioAdmin(phone = "", email = "") {
  const normalized = String(phone || "").replace(/[^\d]/g, "");
  if (!normalized) {
    if (email) window.location.href = `mailto:${email}`;
    else mostrarMensaje("Este usuario no tiene telefono ni correo guardado.");
    return;
  }
  window.open(`https://wa.me/${normalized}`, "_blank");
}

function cleanupCashMovements() {
  const cutoff = Date.now() - (62 * 24 * 60 * 60 * 1000);
  const movements = readLocalJson(ADMIN_LOCAL_KEYS.cashMovements, []).filter((item) => {
    const time = new Date(item.createdAt || item.date || 0).getTime();
    return Number.isNaN(time) || time >= cutoff;
  });
  writeLocalJson(ADMIN_LOCAL_KEYS.cashMovements, movements);
  return movements;
}

function getCashMovements() {
  return cleanupCashMovements();
}

function saveCashMovements(movements = []) {
  writeLocalJson(ADMIN_LOCAL_KEYS.cashMovements, movements.slice(0, 2000));
  if (!appCloudHydrating && window.builderHooks?.persistAll) window.builderHooks.persistAll();
}

function getCashBuyers() {
  return readLocalJson(ADMIN_LOCAL_KEYS.cashBuyers, []);
}

function getCashBuyerSuggestions() {
  const buyers = getCashBuyers().map((item) => ({ name: item.name, phone: item.phone }));
  const wholesalers = getWholesaleClients().map((item) => ({ name: item.alias || item.username || "Mayorista", phone: item.phone || "" }));
  const users = getAdminUserRows().map((item) => ({ name: item.username || "Usuario", phone: item.telefono || "" }));
  const map = new Map();
  [...buyers, ...wholesalers, ...users].forEach((item) => {
    const key = `${normalizarTexto(item.name)}_${String(item.phone || "").replace(/[^\d]/g, "")}`;
    if (item.name && !map.has(key)) map.set(key, item);
  });
  return [...map.values()];
}

function saveCashBuyer(name = "", phone = "", source = "manual") {
  const cleanName = String(name || "").trim();
  if (!cleanName) return;
  const buyers = getCashBuyers();
  const key = `${normalizarTexto(cleanName)}_${String(phone || "").replace(/[^\d]/g, "")}`;
  const next = { key, name: cleanName, phone: phone || "", source, updatedAt: new Date().toISOString() };
  const index = buyers.findIndex((item) => item.key === key);
  if (index >= 0) buyers[index] = next;
  else buyers.unshift(next);
  writeLocalJson(ADMIN_LOCAL_KEYS.cashBuyers, buyers.slice(0, 800));
}

function getCashProductOptions() {
  return catalogos.flatMap((cat, ci) => (cat.productos || []).map((prod, pi) => ({
    key: `${ci}:${pi}`,
    label: `${cat.nombre} - ${prod.nombre}`,
    prod,
    catalogo: cat.nombre
  })));
}

function getCashProductByKey(key = "") {
  const [ci, pi] = String(key || "").split(":").map(Number);
  const prod = catalogos[ci]?.productos?.[pi];
  if (!prod) return null;
  return { prod, catalogo: catalogos[ci].nombre };
}

function saveQuickCashContact(name = "", phone = "") {
  const cleanName = String(name || "").trim();
  const cleanPhone = String(phone || "").trim();
  if (!cleanName || !cleanPhone) return;
  const contacts = readLocalJson(ADMIN_LOCAL_KEYS.contacts, []);
  const phoneKey = cleanPhone.replace(/[^\d]/g, "");
  const nameKey = normalizarTexto(cleanName);
  const next = { nombre: cleanName, telefono: cleanPhone, nota: "Venta rapida de caja", createdAt: new Date().toISOString() };
  const index = contacts.findIndex((item) =>
    String(item.telefono || "").replace(/[^\d]/g, "") === phoneKey &&
    normalizarTexto(item.nombre || "") === nameKey
  );
  if (index >= 0) contacts[index] = { ...contacts[index], ...next };
  else contacts.unshift(next);
  writeLocalJson(ADMIN_LOCAL_KEYS.contacts, contacts.slice(0, 800));
  adminControlState.source = { ...(adminControlState.source || {}), contacts: readLocalJson(ADMIN_LOCAL_KEYS.contacts, []) };
}

function getCurrentCashUserLabel() {
  return usuarioActual?.username || adminSession.username || "Usuario";
}

function getCurrentCashUserId() {
  return String(usuarioActual?.id || adminSession.username || getCurrentCashUserLabel() || "local");
}

function isCashMovementFromCurrentUser(item = {}) {
  const currentId = getCurrentCashUserId();
  const currentLabel = getCurrentCashUserLabel();
  return String(item.userId || "") === currentId || String(item.userLabel || "") === String(currentLabel);
}

function isCashMovementForSelectedUser(item = {}, selectedUser = "mine") {
  if (selectedUser === "all") return true;
  if (selectedUser === "mine") return isCashMovementFromCurrentUser(item);
  return String(item.userLabel || "") === String(selectedUser) || String(item.userId || "") === String(selectedUser);
}

async function abrirControlCaja() {
  if (!canUseCashControl()) return mostrarMensaje("No tienes permiso para control de caja.");
  await refreshAppCloudStoreFromSupabase();
  cleanupCashMovements();
  try {
    adminControlState.source = await fetchAdminControlSource();
  } catch (error) {
    console.error("Error refrescando contactos para caja:", error);
  }
  openModal("cashControlModal");
  renderControlCaja();
}

function cerrarControlCaja() {
  closeModal("cashControlModal");
}

function getCashFilteredMovements() {
  const selectedDate = document.getElementById("cashFilterDate")?.value || "";
  const selectedUser = document.getElementById("cashFilterUser")?.value || "mine";
  return getCashMovements().filter((item) => {
    const sameDate = !selectedDate || String(item.createdAt || "").slice(0, 10) === selectedDate;
    const sameUser = isCashMovementForSelectedUser(item, selectedUser);
    return sameDate && (canViewAllCashControl() ? sameUser : isCashMovementFromCurrentUser(item));
  });
}

function getCashTotals(movements = getCashFilteredMovements()) {
  return movements.reduce((acc, item) => {
    const amount = Number(item.total || 0);
    const signed = item.type === "expense" ? -amount : amount;
    if (item.paymentMethod === "transfer") acc.transfer += signed;
    else acc.cash += signed;
    if (item.type === "sale") acc.sales += amount;
    if (item.type === "debt") acc.debt += amount;
    acc.gain += Number(item.gain || 0);
    return acc;
  }, { cash: 0, transfer: 0, sales: 0, debt: 0, gain: 0 });
}

function renderControlCaja() {
  const body = document.getElementById("cashControlBody");
  const summary = document.getElementById("cashControlSummary");
  if (!body || !summary) return;
  if (!document.getElementById("cashFilterDate")) {
    body.innerHTML = "";
  }
  const selectedDate = document.getElementById("cashFilterDate")?.value || "";
  const selectedUser = document.getElementById("cashFilterUser")?.value || "mine";
  const users = [...new Set(getCashMovements().map((item) => item.userLabel || "Usuario"))];
  const movements = getCashMovements().filter((item) => {
    const sameDate = !selectedDate || String(item.createdAt || "").slice(0, 10) === selectedDate;
    const sameUser = isCashMovementForSelectedUser(item, selectedUser);
    return sameDate && (canViewAllCashControl() ? sameUser : isCashMovementFromCurrentUser(item));
  });
  const totals = getCashTotals(movements);
  summary.innerHTML = `
    <div class="admin-stat-card"><span>Efectivo actual</span><strong>$${totals.cash}</strong></div>
    <div class="admin-stat-card"><span>Transferencia</span><strong>$${totals.transfer}</strong></div>
    <div class="admin-stat-card"><span>Ventas</span><strong>$${totals.sales}</strong></div>
    <div class="admin-stat-card"><span>Deudas</span><strong>$${totals.debt}</strong></div>
    <div class="admin-stat-card"><span>Ganancia</span><strong>$${totals.gain}</strong></div>
  `;
  const productOptions = getCashProductOptions().map((item) => `<option value="${escapeHtmlAttribute(item.key)}">${escapeHtmlAttribute(item.label)}</option>`).join("");
  body.innerHTML = `
    <section class="admin-control-card">
      <div class="admin-control-toolbar">
        <input id="cashFilterDate" type="date" value="${escapeHtmlAttribute(selectedDate)}" onchange="renderControlCaja()" title="Filtrar por fecha opcional">
        <button type="button" class="ghost-btn" onclick="document.getElementById('cashFilterDate').value=''; renderControlCaja()">Ver todo</button>
        ${canViewAllCashControl() ? `<select id="cashFilterUser" onchange="renderControlCaja()"><option value="mine" ${selectedUser === "mine" ? "selected" : ""}>Mi caja</option><option value="all" ${selectedUser === "all" ? "selected" : ""}>Todas</option>${users.map((user) => `<option value="${escapeHtmlAttribute(user)}" ${selectedUser === user ? "selected" : ""}>${escapeHtmlAttribute(user)}</option>`).join("")}</select>` : ""}
        <button type="button" onclick="abrirPanelMovimientoCaja()">Nuevo movimiento</button>
        <button type="button" onclick="downloadCashCloseExcel()">Cerrar caja / Excel</button>
      </div>
      <div class="admin-control-table">
        ${movements.map((item) => `
          <article class="admin-control-row">
            <div class="admin-control-row-main">
              <strong>${escapeHtmlAttribute(item.productName || item.typeLabel || "Movimiento")} - $${item.total || 0}</strong>
              <small>${new Date(item.createdAt || Date.now()).toLocaleString()} - ${escapeHtmlAttribute(item.userLabel || "Usuario")} - ${item.paymentMethod === "transfer" ? "Transferencia" : "Efectivo"}</small>
              <small>${escapeHtmlAttribute(item.clientName || "Cliente particular")} ${item.clientPhone ? `- ${escapeHtmlAttribute(item.clientPhone)}` : ""}</small>
              ${Array.isArray(item.items) && item.items.length > 1 ? `<small>${item.items.map((line) => `${escapeHtmlAttribute(line.productName || "Producto")} x${line.quantity || 1}`).join(" - ")}</small>` : ""}
              <small>${escapeHtmlAttribute(item.note || "Sin nota")}</small>
            </div>
            <div class="admin-control-actions">
              <button type="button" onclick="abrirPanelMovimientoCaja('${escapeHtmlAttribute(item.id)}')">Modificar</button>
              <button type="button" class="danger-btn" onclick="eliminarMovimientoCaja('${escapeHtmlAttribute(item.id)}')">Eliminar</button>
            </div>
          </article>
        `).join("") || `<div class="admin-control-card">No hay movimientos para esta fecha.</div>`}
      </div>
    </section>
    <datalist id="cashProductOptions">${productOptions}</datalist>
  `;
}

function abrirPanelMovimientoCaja(id = "") {
  if (!canUseCashControl()) return mostrarMensaje("No tienes permiso para control de caja.");
  document.getElementById("adminEditPanelModal")?.classList.add("cash-movement-panel");
  const movement = getCashMovements().find((item) => item.id === id) || {};
  const initialItems = Array.isArray(movement.items) && movement.items.length
    ? movement.items
    : movement.productName
      ? [{
        productKey: movement.productKey || "",
        productName: movement.productName || "",
        quantity: Number(movement.quantity || 1),
        unitPrice: Number(movement.unitPrice || 0),
        unitCost: movement.unitCost ?? null,
        total: Number(movement.total || 0),
        gain: Number(movement.gain || 0)
      }]
      : [];
  adminEditPanelState = { type: "cashMovement", orderId: id || "", cashItems: initialItems.map(normalizeCashMoveItem) };
  document.getElementById("adminEditPanelTitle").textContent = id ? "Modificar movimiento de caja" : "Nuevo movimiento de caja";
  document.getElementById("adminEditPanelNote").textContent = "Registra ventas, deudas, ingresos, transferencias o salidas de efectivo.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <div class="admin-control-grid">
        <label>Tipo<select id="cashMoveType" onchange="actualizarMiniTextoCaja()">
          <option value="sale" ${movement.type === "sale" ? "selected" : ""}>Venta</option>
          <option value="debt" ${movement.type === "debt" ? "selected" : ""}>Deuda</option>
          <option value="income" ${movement.type === "income" ? "selected" : ""}>Ingreso externo</option>
          <option value="expense" ${movement.type === "expense" ? "selected" : ""}>Salida de caja</option>
        </select></label>
        <label>Metodo<select id="cashMovePayment"><option value="cash" ${movement.paymentMethod !== "transfer" ? "selected" : ""}>Efectivo</option><option value="transfer" ${movement.paymentMethod === "transfer" ? "selected" : ""}>Transferencia</option></select></label>
        <label>Modo precio<select id="cashMovePriceMode" onchange="syncCashProductPrice(); renderCashClientSelector();"><option value="retail" ${movement.priceMode !== "wholesale" ? "selected" : ""}>Cliente final</option><option value="wholesale" ${movement.priceMode === "wholesale" ? "selected" : ""}>Al por mayor</option></select></label>
      </div>
      <div id="cashClientSelector" data-initial-name="${escapeHtmlAttribute(movement.clientName || "")}" data-initial-phone="${escapeHtmlAttribute(movement.clientPhone || "")}"></div>
      <input id="cashMoveProductKey" type="hidden" value="${escapeHtmlAttribute(movement.productKey || "")}">
      <details class="cash-selector-collapse">
        <summary><span>Seleccionar producto de la tienda</span><small id="cashSelectedProductLabel">${escapeHtmlAttribute(movement.productName || "Toca para buscar")}</small></summary>
        <label>Buscar producto<input id="cashProductSearch" value="${escapeHtmlAttribute(movement.productName || "")}" placeholder="Buscar por nombre, catalogo o palabra" oninput="renderCashProductResults()"></label>
        <div id="cashProductResults" class="cash-selector-results"></div>
      </details>
      <label>Nombre producto<input id="cashMoveProductName" value="${escapeHtmlAttribute(movement.productName || "")}" placeholder="Producto vendido o concepto"></label>
      <div class="admin-control-grid">
        <label>Cantidad<input id="cashMoveQty" type="number" step="1" min="1" value="${Number(movement.quantity || 1)}" oninput="actualizarMiniTextoCaja()"></label>
        <label>Precio unitario<input id="cashMoveUnitPrice" type="number" step="0.01" value="${Number(movement.unitPrice || 0)}" oninput="actualizarMiniTextoCaja()"></label>
        <label>Costo unitario<input id="cashMoveUnitCost" type="number" step="0.01" value="${movement.unitCost ?? ""}" placeholder="Opcional"></label>
      </div>
      <small id="cashMoveMiniText" class="order-line-mini-total">Precio $0 x 1 = $0</small>
      <div class="admin-control-actions">
        <button type="button" onclick="agregarProductoMovimientoCaja()">Agregar producto a este movimiento</button>
      </div>
      <div id="cashMoveItemsList" class="cash-move-items-list"></div>
      <label>Nota adicional<textarea id="cashMoveNote" placeholder="Ejemplo: pago traido de otra tienda, abono, salida para compra...">${escapeHtml(movement.note || "")}</textarea></label>
      <div class="modal-actions">
        <button type="button" onclick="guardarMovimientoCaja()">Guardar movimiento</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cancelar</button>
      </div>
    </div>
  `;
  renderCashClientSelector();
  renderCashProductResults();
  renderCashMoveItemsList();
  actualizarMiniTextoCaja();
  openModal("adminEditPanelModal");
}

function syncCashBuyerPhone() {
  const name = document.getElementById("cashMoveClient")?.value || "";
  const match = getCashBuyerSuggestions().find((item) => item.name === name);
  const phoneField = document.getElementById("cashMovePhone");
  if (match?.phone && phoneField && !phoneField.value) phoneField.value = match.phone;
}

function renderCashProductResults() {
  const box = document.getElementById("cashProductResults");
  if (!box) return;
  const query = normalizarTexto(document.getElementById("cashProductSearch")?.value || "");
  const selectedKey = document.getElementById("cashMoveProductKey")?.value || "";
  const rows = getCashProductOptions()
    .filter((item) => {
      const haystack = normalizarTexto(`${item.label} ${item.prod?.nombre || ""} ${item.prod?.descripcion || ""}`);
      return !query || haystack.includes(query);
    })
    .slice(0, 35);
  box.innerHTML = rows.map((item) => {
    const retail = Number(item.prod?.oferta?.ahora || item.prod?.precio || 0);
    const wholesale = Number(item.prod?.precioMayorista ?? item.prod?.precio ?? 0);
    return `
      <button type="button" class="cash-selector-item ${selectedKey === item.key ? "active" : ""}" onclick="seleccionarProductoCaja('${escapeHtmlAttribute(item.key)}')">
        <strong>${escapeHtmlAttribute(item.prod?.nombre || "Producto")}</strong>
        <small>${escapeHtmlAttribute(item.catalogo)} - Detalle $${retail} - Mayorista $${wholesale}</small>
      </button>
    `;
  }).join("") || `<div class="admin-control-card">No hay productos relacionados.</div>`;
}

function seleccionarProductoCaja(key = "") {
  const found = getCashProductByKey(key);
  if (!found) return;
  document.getElementById("cashMoveProductKey").value = key;
  document.getElementById("cashProductSearch").value = found.prod.nombre || "";
  const label = document.getElementById("cashSelectedProductLabel");
  if (label) label.textContent = found.prod.nombre || "Producto seleccionado";
  syncCashProductPrice();
  renderCashProductResults();
  const details = document.getElementById("cashProductResults")?.closest("details");
  if (details) details.open = false;
}

function renderCashClientSelector() {
  const box = document.getElementById("cashClientSelector");
  if (!box) return;
  const mode = document.getElementById("cashMovePriceMode")?.value || "retail";
  const currentName = document.getElementById("cashMoveClient")?.value || box.dataset.initialName || "";
  const currentPhone = document.getElementById("cashMovePhone")?.value || box.dataset.initialPhone || "";
  const query = normalizarTexto(document.getElementById("cashClientSearch")?.value || "");
  const wasOpen = Boolean(box.querySelector(".cash-selector-collapse")?.open || query);
  const rows = mode === "wholesale"
    ? getWholesaleClients().map((client) => ({
      name: client.alias || client.username || "Mayorista",
      phone: client.phone || "",
      code: client.code || "",
      meta: `Codigo ${client.code || "sin codigo"} - ${client.username || "sin usuario"}`
    }))
    : getAdminUserRows().map((user) => ({
      name: user.username || "Usuario",
      phone: user.telefono || "",
      code: user.email || "",
      meta: `${user.email || "Sin correo"} - ${user.telefono || "Sin telefono"}`
    }));
  const filtered = rows
    .filter((item) => !query || normalizarTexto(`${item.name} ${item.phone} ${item.code} ${item.meta}`).includes(query))
    .slice(0, 35);
  box.innerHTML = `
    <div class="cash-client-panel">
      <details class="cash-selector-collapse" ${wasOpen ? "open" : ""}>
        <summary><span>${mode === "wholesale" ? "Seleccionar cliente mayorista" : "Seleccionar usuario registrado"}</span><small id="cashSelectedClientLabel">${escapeHtmlAttribute(currentName || "Toca para buscar")}</small></summary>
        <label>Buscar cliente
          <input id="cashClientSearch" value="${escapeHtmlAttribute(document.getElementById("cashClientSearch")?.value || "")}" placeholder="${mode === "wholesale" ? "Codigo, alias, tienda o telefono" : "Nombre, telefono o correo"}" oninput="renderCashClientSelector()">
        </label>
        <div class="cash-selector-results">
          ${filtered.map((item) => `
            <button type="button" class="cash-selector-item" onclick="seleccionarClienteCaja('${escapeHtmlAttribute(item.name)}','${escapeHtmlAttribute(item.phone || "")}')">
              <strong>${escapeHtmlAttribute(item.name)}</strong>
              <small>${escapeHtmlAttribute(item.meta || item.phone || "Sin contacto")}</small>
            </button>
          `).join("") || `<div class="admin-control-card">${mode === "wholesale" ? "No hay mayoristas relacionados." : "No hay usuarios relacionados."}</div>`}
        </div>
        ${mode === "wholesale" ? `<div class="admin-control-actions"><button type="button" onclick="abrirPanelClienteMayorista()">Registrar mayorista</button></div>` : ""}
      </details>
      <div class="admin-control-grid">
        <label>Nombre venta rapida<input id="cashMoveClient" value="${escapeHtmlAttribute(currentName)}" placeholder="Nombre del cliente"></label>
        <label>Telefono<input id="cashMovePhone" value="${escapeHtmlAttribute(currentPhone)}" placeholder="Opcional"></label>
      </div>
      <label class="cash-save-contact-check"><input id="cashSaveQuickContact" type="checkbox"> Guardar este cliente en contactos personalizados</label>
    </div>
  `;
}

function seleccionarClienteCaja(name = "", phone = "") {
  const nameField = document.getElementById("cashMoveClient");
  const phoneField = document.getElementById("cashMovePhone");
  if (nameField) nameField.value = name;
  if (phoneField) phoneField.value = phone || "";
  const label = document.getElementById("cashSelectedClientLabel");
  if (label) label.textContent = name || "Cliente seleccionado";
  const details = document.getElementById("cashClientSearch")?.closest("details");
  if (details) details.open = false;
}

function syncCashProductPrice() {
  const key = document.getElementById("cashMoveProductKey")?.value || "";
  const found = getCashProductByKey(key);
  if (!found) return actualizarMiniTextoCaja();
  const mode = document.getElementById("cashMovePriceMode")?.value || "retail";
  document.getElementById("cashMoveProductName").value = found.prod.nombre;
  document.getElementById("cashMoveUnitPrice").value = mode === "wholesale" ? Number(found.prod.precioMayorista ?? found.prod.precio ?? 0) : Number(found.prod.oferta?.ahora || found.prod.precio || 0);
  const cost = getStoredWholesaleCost(found.catalogo, found.prod.nombre, found.prod);
  document.getElementById("cashMoveUnitCost").value = cost ?? "";
  actualizarMiniTextoCaja();
}

function actualizarMiniTextoCaja() {
  const qty = Number(document.getElementById("cashMoveQty")?.value || 1);
  const unit = Number(document.getElementById("cashMoveUnitPrice")?.value || 0);
  const target = document.getElementById("cashMoveMiniText");
  if (target) target.textContent = `Precio $${unit} x ${qty} = $${unit * qty}`;
}

function normalizeCashMoveItem(item = {}) {
  const quantity = Number(item.quantity || 1);
  const unitPrice = Number(item.unitPrice || 0);
  const rawCost = item.unitCost === "" || item.unitCost === null || item.unitCost === undefined ? null : Number(item.unitCost);
  const unitCost = Number.isFinite(rawCost) ? rawCost : null;
  return {
    productKey: item.productKey || "",
    productName: item.productName || "Producto",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    unitCost,
    total: (Number.isFinite(quantity) && quantity > 0 ? quantity : 1) * (Number.isFinite(unitPrice) ? unitPrice : 0),
    gain: unitCost === null ? 0 : ((Number.isFinite(unitPrice) ? unitPrice : 0) - unitCost) * (Number.isFinite(quantity) && quantity > 0 ? quantity : 1)
  };
}

function getCurrentCashMoveItemFromFields() {
  const type = document.getElementById("cashMoveType")?.value || "sale";
  const productName = document.getElementById("cashMoveProductName")?.value.trim() || (type === "expense" ? "Salida de caja" : "Movimiento");
  const quantity = Number(document.getElementById("cashMoveQty")?.value || 1);
  const unitPrice = Number(document.getElementById("cashMoveUnitPrice")?.value || 0);
  const unitCostValue = document.getElementById("cashMoveUnitCost")?.value || "";
  return normalizeCashMoveItem({
    productKey: document.getElementById("cashMoveProductKey")?.value || "",
    productName,
    quantity,
    unitPrice,
    unitCost: unitCostValue === "" ? null : Number(unitCostValue)
  });
}

function agregarProductoMovimientoCaja() {
  const item = getCurrentCashMoveItemFromFields();
  if (!item.productName || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice)) {
    return mostrarMensaje("Completa producto, cantidad y precio.");
  }
  adminEditPanelState.cashItems = Array.isArray(adminEditPanelState.cashItems) ? adminEditPanelState.cashItems : [];
  adminEditPanelState.cashItems.push(item);
  renderCashMoveItemsList();
  document.getElementById("cashMoveProductKey").value = "";
  document.getElementById("cashProductSearch").value = "";
  document.getElementById("cashMoveProductName").value = "";
  document.getElementById("cashMoveQty").value = 1;
  document.getElementById("cashMoveUnitPrice").value = 0;
  document.getElementById("cashMoveUnitCost").value = "";
  const productLabel = document.getElementById("cashSelectedProductLabel");
  if (productLabel) productLabel.textContent = "Toca para buscar";
  renderCashProductResults();
  actualizarMiniTextoCaja();
}

function eliminarProductoMovimientoCaja(index) {
  adminEditPanelState.cashItems = (adminEditPanelState.cashItems || []).filter((_, itemIndex) => itemIndex !== Number(index));
  renderCashMoveItemsList();
}

function renderCashMoveItemsList() {
  const box = document.getElementById("cashMoveItemsList");
  if (!box) return;
  const items = Array.isArray(adminEditPanelState.cashItems) ? adminEditPanelState.cashItems.map(normalizeCashMoveItem) : [];
  const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  box.innerHTML = `
    <div class="cash-move-items-head">
      <strong>Productos agregados</strong>
      <small>${items.length} producto(s) - Total $${total}</small>
    </div>
    ${items.map((item, index) => `
      <article class="cash-move-item-row">
        <div>
          <strong>${escapeHtmlAttribute(item.productName)}</strong>
          <small>${item.quantity} x $${item.unitPrice} = $${item.total}</small>
        </div>
        <button type="button" class="danger-btn" onclick="eliminarProductoMovimientoCaja(${index})">Quitar</button>
      </article>
    `).join("") || `<small>No has agregado productos a la lista. Si guardas asi, se usara el producto actual.</small>`}
  `;
}

function guardarMovimientoCaja() {
  const movements = getCashMovements();
  const id = adminEditPanelState.orderId || `cash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const type = document.getElementById("cashMoveType")?.value || "sale";
  const clientName = document.getElementById("cashMoveClient")?.value.trim() || "";
  const clientPhone = document.getElementById("cashMovePhone")?.value.trim() || "";
  const listedItems = Array.isArray(adminEditPanelState.cashItems) ? adminEditPanelState.cashItems.map(normalizeCashMoveItem) : [];
  const currentItem = getCurrentCashMoveItemFromFields();
  const items = listedItems.length ? listedItems : [currentItem];
  if (!items.length || items.some((item) => !item.productName || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice))) {
    return mostrarMensaje("Completa producto, cantidad y precio.");
  }
  const firstItem = items[0];
  const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const gain = items.reduce((sum, item) => sum + Number(item.gain || 0), 0);
  const next = {
    id,
    type,
    typeLabel: type === "sale" ? "Venta" : type === "debt" ? "Deuda" : type === "income" ? "Ingreso externo" : "Salida de caja",
    paymentMethod: document.getElementById("cashMovePayment")?.value || "cash",
    clientName,
    clientPhone,
    productKey: firstItem.productKey || "",
    productName: items.length > 1 ? `${items.length} productos` : firstItem.productName,
    items,
    priceMode: document.getElementById("cashMovePriceMode")?.value || "retail",
    quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    unitPrice: firstItem.unitPrice,
    unitCost: firstItem.unitCost,
    total,
    gain,
    note: document.getElementById("cashMoveNote")?.value.trim() || "",
    userId: getCurrentCashUserId(),
    userLabel: getCurrentCashUserLabel(),
    createdAt: movements.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const index = movements.findIndex((item) => item.id === id);
  if (index >= 0) movements[index] = next;
  else movements.unshift(next);
  saveCashMovements(movements);
  if (clientName && clientPhone) saveCashBuyer(clientName, clientPhone, next.productKey ? "registered" : "manual");
  if (document.getElementById("cashSaveQuickContact")?.checked && clientName && clientPhone) saveQuickCashContact(clientName, clientPhone);
  cerrarPanelEdicionAdmin();
  renderControlCaja();
}

function eliminarMovimientoCaja(id = "") {
  if (!confirm("Eliminar este movimiento de caja?")) return;
  saveCashMovements(getCashMovements().filter((item) => item.id !== id));
  renderControlCaja();
}

function downloadCashCloseExcel() {
  const movements = getCashFilteredMovements();
  if (!movements.length) return mostrarMensaje("No hay movimientos para descargar.");
  const totals = getCashTotals(movements);
  const rows = movements.map((item) => `
    <tr><td>${new Date(item.createdAt || Date.now()).toLocaleString()}</td><td>${escapeHtmlAttribute(item.userLabel || "")}</td><td>${escapeHtmlAttribute(item.typeLabel || item.type || "")}</td><td>${escapeHtmlAttribute(item.paymentMethod === "transfer" ? "Transferencia" : "Efectivo")}</td><td>${escapeHtmlAttribute(item.clientName || "")}</td><td>${escapeHtmlAttribute(item.clientPhone || "")}</td><td>${escapeHtmlAttribute(item.productName || "")}</td><td>${item.quantity || 1}</td><td>${item.unitPrice || 0}</td><td>${item.total || 0}</td><td>${item.gain || 0}</td><td>${escapeHtmlAttribute(item.note || "")}</td></tr>
  `).join("");
  const markup = `<html><head><meta charset="UTF-8"></head><body><h2>Cierre de caja</h2><p>Fecha: ${new Date().toLocaleString()}</p><p>Efectivo: ${totals.cash}</p><p>Transferencia: ${totals.transfer}</p><p>Ventas: ${totals.sales}</p><p>Deudas: ${totals.debt}</p><p>Ganancia: ${totals.gain}</p><table border="1"><thead><tr><th>Fecha</th><th>Usuario caja</th><th>Tipo</th><th>Metodo</th><th>Cliente</th><th>Telefono</th><th>Producto</th><th>Cantidad</th><th>Precio unidad</th><th>Total</th><th>Ganancia</th><th>Nota</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([markup], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cierre_caja_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function abrirCentroMayorista() {
  if (!roleHasPermission(getCurrentUserRole(), "wholesaleCart") && !canToggleWholesale() && !canManageWholesaleClients()) return mostrarMensaje("No tienes permiso para venta al por mayor.");
  closeModal("adminEditPanelModal");
  const active = readLocalJson(ADMIN_LOCAL_KEYS.wholesaleActiveSale, {});
  wholesaleRuntime.activeClientId = active.activeClientId || active.clientId || "";
  wholesaleRuntime.activeSaleId = active.activeSaleId || active.saleId || "";
  openModal("wholesaleCenterModal");
  renderCentroMayorista();
}

function cerrarCentroMayorista() {
  closeModal("wholesaleCenterModal");
}

function renderCentroMayoristaIfOpen() {
  const modal = document.getElementById("wholesaleCenterModal");
  if (modal?.style.display === "flex") renderCentroMayorista();
}

function getWholesaleCostMap() {
  return readLocalJson(ADMIN_LOCAL_KEYS.wholesaleCosts, {});
}

function saveWholesaleCostMap(map = {}) {
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleCosts, map);
}

function getProductCostKey(catalogName = "", productName = "") {
  return `${normalizarTexto(catalogName)}::${normalizarTexto(productName)}`;
}

function getStoredWholesaleCost(catalogName = "", productName = "", prod = {}) {
  const map = getWholesaleCostMap();
  const value = map[getProductCostKey(catalogName, productName)] ?? prod.costoMayorista;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function abrirListaCostosMayoristas() {
  if (!canManageWholesaleCostList()) return mostrarMensaje("No tienes permiso para ver esta lista.");
  adminEditPanelState = { type: "wholesaleCostList" };
  openModal("adminEditPanelModal");
  renderListaCostosMayoristas();
}

function renderListaCostosMayoristas() {
  document.getElementById("adminEditPanelTitle").textContent = "Lista privada de costos";
  document.getElementById("adminEditPanelNote").textContent = "Estos valores son lo que te cuesta cada producto. Se usan para calcular la ganancia real al vender al por mayor.";
  const rows = catalogos.map((cat, ci) => `
    <details class="admin-order-user-card" open>
      <summary><strong>${escapeHtmlAttribute(cat.nombre)}</strong></summary>
      <div class="builder-link-editor-list">
        ${(cat.productos || []).map((prod, pi) => {
          const cost = getStoredWholesaleCost(cat.nombre, prod.nombre, prod);
          return `
            <div class="builder-link-editor-row wholesale-cost-row ${cost !== null ? "has-cost" : ""}">
              <p><strong>${escapeHtmlAttribute(prod.nombre)}</strong> ${cost !== null ? `<span class="payment-pill paid">Con costo</span>` : ""}</p>
              <small>Precio cliente $${Number(prod.precio || 0)} · Venta mayorista $${Number(prod.precioMayorista ?? prod.precio ?? 0)}</small>
              <label>Costo al que me sale<input data-cost-ci="${ci}" data-cost-pi="${pi}" type="number" step="0.01" value="${cost ?? ""}" placeholder="Costo privado"></label>
            </div>
          `;
        }).join("")}
      </div>
    </details>
  `).join("") || `<div class="admin-control-card">No hay productos.</div>`;
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      ${rows}
      <div class="modal-actions">
        <button type="button" onclick="guardarListaCostosMayoristas()">Guardar costos</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cerrar</button>
      </div>
    </div>
  `;
}

function guardarListaCostosMayoristas() {
  const map = getWholesaleCostMap();
  document.querySelectorAll("[data-cost-ci][data-cost-pi]").forEach((field) => {
    const ci = Number(field.dataset.costCi);
    const pi = Number(field.dataset.costPi);
    const prod = catalogos[ci]?.productos?.[pi];
    const cat = catalogos[ci];
    if (!prod || !cat) return;
    const key = getProductCostKey(cat.nombre, prod.nombre);
    const value = field.value.trim();
    if (!value) {
      delete map[key];
      prod.costoMayorista = null;
      return;
    }
    const cost = Number(value);
    if (Number.isNaN(cost)) return;
    map[key] = cost;
    prod.costoMayorista = cost;
  });
  saveWholesaleCostMap(map);
  guardar();
  mostrarMensaje("Costos mayoristas guardados.");
  renderListaCostosMayoristas();
}

function getWholesaleClientOrders(clientId = "") {
  return getWholesaleOrders().filter((order) => String(order.wholesaleClientId || "") === String(clientId));
}

function getWholesaleClientCreditSummary(clientId = "") {
  const creditOrders = getWholesaleClientOrders(clientId).filter((order) => {
    const hasCredit = order.paymentMode === "credito" || (order.productos || []).some((item) => item.paymentMode === "credito");
    return order.status !== "pagado" || (hasCredit && getCreditInfo(order).remaining > 0);
  });
  const closest = creditOrders
    .map((order) => getCreditInfo(order).daysLeft)
    .filter((days) => days !== null)
    .sort((a, b) => a - b)[0];
  return {
    pending: creditOrders.reduce((sum, order) => sum + (order.paymentMode === "credito" ? getCreditInfo(order).remaining : Number(order.total || 0)), 0),
    daysLeft: closest ?? null,
    className: getCreditClassByDays(closest ?? null)
  };
}

function renderCentroMayorista() {
  const body = document.getElementById("wholesaleCenterBody");
  const activeBox = document.getElementById("wholesaleActiveSale");
  if (!body || !activeBox) return;
  const query = normalizarTexto(document.getElementById("wholesaleClientSearch")?.value || "");
  const sort = document.getElementById("wholesaleClientSort")?.value || "newest";
  const clients = getWholesaleClients()
    .filter((client) => !query || normalizarTexto(`${client.alias} ${client.username} ${client.phone} ${client.code}`).includes(query))
    .sort((a, b) => {
      const aOrders = getWholesaleClientOrders(a.id);
      const bOrders = getWholesaleClientOrders(b.id);
      if (sort === "alpha") return String(a.alias || a.username || "").localeCompare(String(b.alias || b.username || ""));
      if (sort === "mostOrders") return bOrders.length - aOrders.length;
      if (sort === "due") {
        const ad = getWholesaleClientCreditSummary(a.id).daysLeft ?? 9999;
        const bd = getWholesaleClientCreditSummary(b.id).daysLeft ?? 9999;
        return ad - bd;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  const activeClient = wholesaleRuntime.activeClientId ? getWholesaleClientById(wholesaleRuntime.activeClientId) : null;
  activeBox.classList.toggle("hidden", !activeClient);
  if (activeClient) {
    activeBox.innerHTML = `
      <strong>Venta activa: ${escapeHtmlAttribute(activeClient.alias || activeClient.username || "Mayorista")}</strong>
      <small>Codigo ${escapeHtmlAttribute(activeClient.code)} - todo lo que agregues en modo mayorista se ira a este cliente.</small>
      <div class="admin-control-actions"><button type="button" onclick="cerrarVentaMayoristaActiva()">Cerrar venta</button></div>
    `;
  }
  const wholesaleOrders = getWholesaleOrders();
  const pendingWholesale = wholesaleOrders.filter((order) => order.status !== "pagado");
  const paidWholesale = wholesaleOrders.filter((order) => order.status === "pagado");
  const wholesaleGainPending = pendingWholesale.reduce((sum, order) => sum + Number(order.gananciaTotal || 0), 0);
  const wholesaleGainPaid = paidWholesale.reduce((sum, order) => sum + Number(order.gananciaTotal || 0), 0);
  body.innerHTML = `
    <section class="admin-control-card">
      <h3>Pedidos mayoristas</h3>
      <div class="admin-control-summary">
        <div class="admin-stat-card"><span>Pendientes</span><strong>${pendingWholesale.length}</strong></div>
        <div class="admin-stat-card"><span>Pagados</span><strong>${paidWholesale.length}</strong></div>
        <div class="admin-stat-card"><span>Ganancia pendiente</span><strong>$${wholesaleGainPending}</strong></div>
        <div class="admin-stat-card"><span>Ganancia confirmada</span><strong>$${wholesaleGainPaid}</strong></div>
      </div>
      <div class="admin-control-table">
        ${wholesaleOrders.map((order) => `
          <article class="admin-control-row admin-order-row">
            <div class="admin-control-row-main">
              <strong>${order.status === "pagado" ? "Pagado" : "Pendiente"} - ${escapeHtmlAttribute(order.username || "Mayorista")} - $${order.total || 0}</strong>
              <small>${escapeHtmlAttribute(order.telefono || "Sin telefono")} - ${new Date(order.fecha || Date.now()).toLocaleString()} - Ganancia $${order.gananciaTotal || 0}</small>
              ${buildCreditBadge(order)}
              <small>${escapeHtmlAttribute(buildOrderItemsSummary(order.productos || []))}</small>
            </div>
            <div class="admin-control-actions">
              <button type="button" onclick="abrirPanelPedidoAdmin('${escapeHtmlAttribute(order.id)}','editar')">Modificar</button>
              <button type="button" onclick="abrirPanelPedidoAdmin('${escapeHtmlAttribute(order.id)}','credito')">Credito</button>
              <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(order.id)}','pagado')">Pagado</button>
              <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(order.id)}','pendiente')">Pendiente</button>
              <button type="button" class="danger-btn" onclick="eliminarPedidoAdmin('${escapeHtmlAttribute(order.id)}')">Eliminar</button>
            </div>
          </article>
        `).join("") || `<div class="admin-control-card">No hay pedidos mayoristas registrados.</div>`}
      </div>
    </section>
    <div class="admin-control-table">
      ${clients.map((client) => {
        const orders = getWholesaleClientOrders(client.id);
        const credit = getWholesaleClientCreditSummary(client.id);
        return `
          <details class="admin-order-user-card">
            <summary>
              <span>
                <strong>${getWholesaleBadgeText()} ${escapeHtmlAttribute(client.alias || client.username || "Mayorista")}</strong>
                <small>Usuario: ${escapeHtmlAttribute(client.username || "Manual")} - Tel: ${escapeHtmlAttribute(client.phone || "Sin telefono")} - Codigo: ${escapeHtmlAttribute(client.code)}</small>
                <small class="credit-countdown ${credit.className}">Deuda $${credit.pending}${credit.daysLeft !== null ? ` - faltan ${credit.daysLeft} dia(s)` : ""}</small>
              </span>
            </summary>
            <div class="admin-control-actions">
              <button type="button" onclick="abrirPanelSeleccionMayorista('${escapeHtmlAttribute(client.id)}')">Seleccionar venta</button>
              <button type="button" onclick="abrirPanelClienteMayorista('','','','${escapeHtmlAttribute(client.id)}')">Modificar cliente</button>
              <button type="button" onclick="contactarUsuarioAdmin('${escapeHtmlAttribute(client.phone || "")}')">Contactar</button>
              <button type="button" class="danger-btn" onclick="eliminarClienteMayorista('${escapeHtmlAttribute(client.id)}')">Eliminar cliente</button>
            </div>
            <div class="admin-order-breakdown">
              ${orders.map((order) => `
                <article class="admin-control-row admin-order-row">
                  <div class="admin-control-row-main">
                    <strong>${order.status === "pagado" ? "Pagado" : "Pendiente"} - $${order.total}</strong>
                    <small>${new Date(order.fecha || Date.now()).toLocaleString()} - ${order.paymentMode === "credito" ? `Credito falta $${getCreditInfo(order).remaining}` : "Normal"}</small>
                    <small>${escapeHtmlAttribute(buildOrderItemsSummary(order.productos || []))}</small>
                  </div>
                  <div class="admin-control-actions">
                    <button type="button" onclick="abrirPanelPedidoAdmin('${escapeHtmlAttribute(order.id)}','editar')">Modificar</button>
                    <button type="button" onclick="abrirPanelPedidoAdmin('${escapeHtmlAttribute(order.id)}','credito')">Credito</button>
                    <button type="button" onclick="marcarPedidoAdmin('${escapeHtmlAttribute(order.id)}','pagado')">Pagado</button>
                  </div>
                </article>
              `).join("") || `<div class="admin-control-card">Sin pedidos registrados.</div>`}
            </div>
          </details>
        `;
      }).join("") || `<div class="admin-control-card">No hay clientes mayoristas.</div>`}
    </div>
  `;
}

function abrirPanelClienteMayorista(userId = "", username = "", telefono = "", clientId = "") {
  const client = clientId ? getWholesaleClientById(clientId) : null;
  adminEditPanelState = { type: "wholesaleClient", orderId: clientId || "" };
  document.getElementById("adminEditPanelTitle").textContent = client ? "Modificar cliente mayorista" : "Agregar cliente mayorista";
  document.getElementById("adminEditPanelNote").textContent = "Registra alias, telefono y usuario. Se genera un codigo de 7 digitos para verificar ventas.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Alias / nombre de tienda<input id="wholesaleClientAlias" value="${escapeHtmlAttribute(client?.alias || "")}" placeholder="Nombre de tienda"></label>
      <label>Usuario registrado<input id="wholesaleClientUsername" value="${escapeHtmlAttribute(client?.username || username || "")}" placeholder="Usuario opcional"></label>
      <label>ID usuario<input id="wholesaleClientUserId" value="${escapeHtmlAttribute(client?.userId || userId || "")}" placeholder="ID usuario opcional"></label>
      <label>Telefono<input id="wholesaleClientPhone" value="${escapeHtmlAttribute(client?.phone || telefono || "")}" placeholder="+18090000000"></label>
      <label>Codigo<input id="wholesaleClientCode" value="${escapeHtmlAttribute(client?.code || generateWholesaleCode())}" readonly></label>
      <div class="modal-actions">
        <button type="button" onclick="guardarClienteMayoristaPanel()">Guardar cliente</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function guardarClienteMayoristaPanel() {
  const alias = document.getElementById("wholesaleClientAlias")?.value.trim();
  const username = document.getElementById("wholesaleClientUsername")?.value.trim();
  const userId = document.getElementById("wholesaleClientUserId")?.value.trim();
  const phone = document.getElementById("wholesaleClientPhone")?.value.trim();
  const code = document.getElementById("wholesaleClientCode")?.value.trim() || generateWholesaleCode();
  if (!alias && !username) return mostrarMensaje("Escribe alias o usuario.");
  if (!phone) return mostrarMensaje("Escribe telefono del cliente.");
  const clients = getWholesaleClients();
  const id = adminEditPanelState.orderId || `wh_${Date.now()}`;
  const index = clients.findIndex((client) => client.id === id);
  const next = { id, alias, username, userId, phone, code, createdAt: clients[index]?.createdAt || new Date().toISOString() };
  if (index >= 0) clients[index] = next;
  else clients.unshift(next);
  saveWholesaleClients(clients);
  cerrarPanelEdicionAdmin();
  renderCentroMayoristaIfOpen();
  if (adminControlState.tab === "usuarios") renderAdminUsers();
}

function eliminarClienteMayorista(id = "") {
  const client = getWholesaleClientById(id);
  if (!client) return;
  if (!confirm(`Eliminar cliente mayorista ${client.alias || client.username || ""}? Perdera acceso a esta venta mayorista.`)) return;
  saveWholesaleClients(getWholesaleClients().filter((item) => String(item.id) !== String(id)));
  if (String(wholesaleRuntime.activeClientId) === String(id)) {
    wholesaleRuntime = { activeClientId: "", activeSaleId: "" };
    writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleActiveSale, {});
  }
  accessState.roleAssignments = (accessState.roleAssignments || []).filter((assignment) => {
    const sameUser = (client.userId && String(assignment.userId) === String(client.userId)) ||
      (client.username && String(assignment.username || "").toLowerCase() === String(client.username).toLowerCase());
    if (!sameUser) return true;
    const role = assignment.role;
    return !(roleHasPermission(role, "wholesalePriceView") || roleHasPermission(role, "wholesaleCart"));
  });
  syncAccessState(accessState);
  guardarBuilderSupabase();
  renderCentroMayoristaIfOpen();
  if (adminControlState.tab === "usuarios") renderAdminUsers();
  mostrarMensaje("Cliente mayorista eliminado.");
}

function seleccionarClienteMayorista(id = "") {
  const client = getWholesaleClientById(id);
  if (!client) return;
  const code = document.getElementById("wholesaleSelectCode")?.value.trim();
  if (String(code || "") !== String(client.code)) return mostrarMensaje("Codigo incorrecto.");
  wholesaleRuntime.activeClientId = id;
  wholesaleRuntime.activeSaleId = `whsale_${Date.now()}`;
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleActiveSale, wholesaleRuntime);
  cerrarPanelEdicionAdmin();
  renderCentroMayorista();
  mostrarMensaje("Cliente mayorista seleccionado.");
}

function abrirPanelSeleccionMayorista(id = "") {
  const client = getWholesaleClientById(id);
  if (!client) return;
  closeModal("wholesaleCenterModal");
  adminEditPanelState = { type: "selectWholesaleClient", orderId: id };
  document.getElementById("adminEditPanelTitle").textContent = "Verificar cliente mayorista";
  document.getElementById("adminEditPanelNote").textContent = "Escribe el codigo de 7 digitos del cliente para iniciar o continuar la venta.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Cliente<input value="${escapeHtmlAttribute(client.alias || client.username || "Mayorista")}" readonly></label>
      <label>Telefono<input value="${escapeHtmlAttribute(client.phone || "Sin telefono")}" readonly></label>
      <label>Codigo de verificacion<input id="wholesaleSelectCode" inputmode="numeric" maxlength="7" autocomplete="one-time-code" placeholder="0000000"></label>
      <div class="modal-actions">
        <button type="button" onclick="seleccionarClienteMayorista('${escapeHtmlAttribute(id)}')">Iniciar venta</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cancelar</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function cerrarVentaMayoristaActiva() {
  const activeClient = wholesaleRuntime.activeClientId ? getWholesaleClientById(wholesaleRuntime.activeClientId) : null;
  const clientName = activeClient?.alias || activeClient?.username || "cliente mayorista";
  wholesaleRuntime = { activeClientId: "", activeSaleId: "" };
  writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleActiveSale, {});
  cerrarPanelEdicionAdmin();
  closeModal("wholesaleCenterModal");
  renderCentroMayoristaIfOpen();
  mostrarMensaje(`Venta cerrada exitosamente con ${clientName}.`);
}

function getPromotionPhones() {
  const source = adminControlState.source || {};
  const userPhones = getAdminUserRows().map((user) => user.telefono).filter(Boolean);
  const contactPhones = (source.contacts || readLocalJson(ADMIN_LOCAL_KEYS.contacts, [])).map((item) => item.telefono).filter(Boolean);
  return [...new Set([...userPhones, ...contactPhones].map((phone) => String(phone).replace(/[^\d]/g, "")).filter(Boolean))];
}

function enviarPromocionGlobal() {
  const message = document.getElementById("promoMessage")?.value.trim();
  if (!message) return mostrarMensaje("Escribe el mensaje de promocion.");
  const phones = getPromotionPhones();
  if (!phones.length) return mostrarMensaje("No hay usuarios o contactos con telefono.");
  phones.forEach((phone, index) => {
    setTimeout(() => {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    }, index * 450);
  });
  recordUserActivity("promocion_enviada", { destinatarios: phones.length });
}

function agregarContactoPersonalizado() {
  const nombre = document.getElementById("customContactName")?.value.trim();
  const telefono = String(document.getElementById("customContactPhone")?.value || "").replace(/[^\d+]/g, "");
  const nota = document.getElementById("customContactNote")?.value.trim();
  if (!nombre || !telefono) return mostrarMensaje("Completa nombre y telefono.");
  const contacts = readLocalJson(ADMIN_LOCAL_KEYS.contacts, []);
  contacts.push({ nombre, telefono, nota, createdAt: new Date().toISOString() });
  writeLocalJson(ADMIN_LOCAL_KEYS.contacts, contacts);
  adminControlState.source = { ...(adminControlState.source || {}), contacts };
  renderAdminPromotions();
}

function eliminarContactoPersonalizado(index) {
  const contacts = readLocalJson(ADMIN_LOCAL_KEYS.contacts, []);
  contacts.splice(index, 1);
  writeLocalJson(ADMIN_LOCAL_KEYS.contacts, contacts);
  adminControlState.source = { ...(adminControlState.source || {}), contacts };
  renderAdminPromotions();
}

function downloadBossAnalyticsExcel() {
  if (!bossAnalyticsState.renderedRows.length) {
    mostrarMensaje("No hay datos para exportar con el filtro actual.");
    return;
  }
  const rowsMarkup = bossAnalyticsState.renderedRows.map((row) => `
    <tr>
      <td>${escapeHtmlAttribute(row.catalogo)}</td>
      <td>${escapeHtmlAttribute(row.nombre)}</td>
      <td>${row.pedidos}</td>
      <td>${row.pedidoEventos}</td>
      <td>${row.carritos}</td>
      <td>${row.favoritosUsuarios}</td>
      <td>${row.isTop ? "Si" : "No"}</td>
    </tr>
  `).join("");
  const fileMarkup = `
    <html>
      <head><meta charset="utf-8"></head>
      <body>
        <h2>${escapeHtmlAttribute(getBossAnalyticsMetricLabel())}</h2>
        <p>${escapeHtmlAttribute(getBossAnalyticsPeriodLabel())}</p>
        <table border="1">
          <thead>
            <tr>
              <th>Catalogo</th>
              <th>Producto</th>
              <th>Pedidos</th>
              <th>Eventos de pedido</th>
              <th>Carrito</th>
              <th>Favoritos</th>
              <th>Top</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([fileMarkup], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `analitica_boss_${bossAnalyticsState.metric}_${bossAnalyticsState.period}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildAnalyticsCloseSnapshot() {
  const source = bossAnalyticsState.source || { carrito: [], favoritos: [], pedidos: [] };
  const previous = { metric: bossAnalyticsState.metric, period: bossAnalyticsState.period, customDate: bossAnalyticsState.customDate };
  const metrics = ["pedidos", "carritos", "favoritos"].map((metric) => {
    bossAnalyticsState.metric = metric;
    bossAnalyticsState.period = "all";
    const aggregation = buildBossAnalyticsAggregation(source);
    return {
      metric,
      label: getBossAnalyticsMetricLabel(metric),
      rows: aggregation.renderedRows
        .filter((row) => Number(row.pedidos || 0) || Number(row.carritos || 0) || Number(row.favoritosUsuarios || 0))
        .sort((a, b) => getBossAnalyticsMetricValue(b, metric) - getBossAnalyticsMetricValue(a, metric))
    };
  });
  bossAnalyticsState.metric = previous.metric;
  bossAnalyticsState.period = previous.period;
  bossAnalyticsState.customDate = previous.customDate;
  return {
    createdAt: new Date().toISOString(),
    previousResetAt: readLocalJson(ADMIN_LOCAL_KEYS.analyticsResetAt, ""),
    metrics
  };
}

function downloadAnalyticsCloseExcel(snapshot = buildAnalyticsCloseSnapshot()) {
  const metricTables = snapshot.metrics.map((metric) => `
    <h3>${escapeHtmlAttribute(metric.label)}</h3>
    <table border="1">
      <thead><tr><th>Catalogo</th><th>Producto</th><th>Pedidos</th><th>Eventos pedido</th><th>Carrito</th><th>Favoritos</th></tr></thead>
      <tbody>${metric.rows.map((row) => `<tr><td>${escapeHtmlAttribute(row.catalogo)}</td><td>${escapeHtmlAttribute(row.nombre)}</td><td>${row.pedidos}</td><td>${row.pedidoEventos}</td><td>${row.carritos}</td><td>${row.favoritosUsuarios}</td></tr>`).join("")}</tbody>
    </table>
  `).join("");
  const markup = `<html><head><meta charset="UTF-8"></head><body><h2>Cierre mensual de analitica</h2><p>Fecha guardada: ${new Date(snapshot.createdAt).toLocaleString()}</p>${metricTables}</body></html>`;
  const blob = new Blob([markup], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cierre_analitica_${snapshot.createdAt.slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function ejecutarCierreAnaliticaDelMes() {
  if (!canOpenAdminControlCenter()) return mostrarMensaje("Solo boss o administradores pueden cerrar la analitica.");
  if (!bossAnalyticsState.source) await refreshBossAnalyticsPanel(true);
  const snapshot = buildAnalyticsCloseSnapshot();
  downloadAnalyticsCloseExcel(snapshot);
  if (!confirm("Confirmar cierre de analitica del mes? Se guardara el Excel y la analitica empezara desde cero.")) return;
  const closures = readLocalJson(ADMIN_LOCAL_KEYS.analyticsClosures, []);
  closures.unshift(snapshot);
  writeLocalJson(ADMIN_LOCAL_KEYS.analyticsClosures, closures.slice(0, 2));
  writeLocalJson(ADMIN_LOCAL_KEYS.analyticsResetAt, new Date().toISOString());
  recordUserActivity("cierre_analitica_mes", { fecha: snapshot.createdAt });
  await refreshBossAnalyticsPanel(true);
  renderAdminControl();
}

function restaurarCierreAnalitica(index = 0) {
  const snapshot = readLocalJson(ADMIN_LOCAL_KEYS.analyticsClosures, [])[index];
  if (!snapshot) return mostrarMensaje("No hay cierre de analitica guardado en esa posicion.");
  if (!confirm("Restaurar este punto de analitica?")) return;
  writeLocalJson(ADMIN_LOCAL_KEYS.analyticsResetAt, snapshot.previousResetAt || "");
  refreshBossAnalyticsPanel(true);
  renderAdminControl();
}

function downloadSavedAnalyticsClose(index = 0) {
  const snapshot = readLocalJson(ADMIN_LOCAL_KEYS.analyticsClosures, [])[index];
  if (!snapshot) return mostrarMensaje("No hay cierre guardado para descargar.");
  downloadAnalyticsCloseExcel(snapshot);
}

/* QUE HACE: Ajusta visualmente el visor ampliado de imagenes segun el builder.
   POR QUE SE HIZO: Permite personalizar fondo, formato, miniaturas y transicion del modal.
   COMO MODIFICARLO: Si agregas una opcion nueva del visor, reflejala aqui con clases o variables. */
function applyProductGalleryAppearance() {
  const modalContent = document.querySelector("#imgModal .img-modal-content");
  const thumbs = document.getElementById("imgThumbs");
  const preview = document.getElementById("imgPreview");
  const isMobileGallery = window.matchMedia?.("(max-width: 760px)")?.matches;
  if (!modalContent) return;

  modalContent.classList.toggle("gallery-without-shell", siteSettings.productGalleryShowFrame === false);
  modalContent.classList.toggle("gallery-fit-image", Boolean(siteSettings.productGalleryFitToImage));
  modalContent.classList.toggle("gallery-arrows-inside", siteSettings.productGalleryArrowsPlacement === "inside");
  modalContent.classList.toggle("gallery-arrows-outside", siteSettings.productGalleryArrowsPlacement !== "inside");
  ["soft", "minimal", "framed", "spotlight", "cinema"].forEach((styleName) => {
    modalContent.classList.toggle(`gallery-style-${styleName}`, (siteSettings.productGalleryStylePreset || "soft") === styleName);
  });

  if (thumbs) {
    thumbs.classList.toggle("img-modal-thumbs-grid", siteSettings.productGalleryThumbLayout === "grid");
    thumbs.classList.toggle("hidden", siteSettings.productGalleryShowThumbs === false || imagenesProducto.length <= 1);
  }
  if (preview) {
    preview.style.objectFit = siteSettings.productGalleryFitMode || "contain";
    preview.style.maxHeight = isMobileGallery
      ? "calc(100dvh - 138px)"
      : (siteSettings.productGalleryFitToImage ? "min(82vh, 92vw)" : "min(76vh, 860px)");
  }
}

/* QUE HACE: Comprime imagenes y las sube aisladas por tenant.
   POR QUE SE HIZO: Mejora peso, estandariza WebP nuevo y separa recursos por cliente.
   COMO MODIFICARLO:
   - Para separar aun mas, cambia bucket por tenant en tenant-config.js.
   - Para usar carpetas por modulo, modifica el path armado mas abajo. */
async function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("No se pudo convertir la imagen."));
            return;
          }
          resolve(blob);
        }, "image/webp", 0.86);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resolveBucketName(bucketAlias) {
  return STORAGE_BUCKETS[bucketAlias] || bucketAlias;
}

function buildTenantStoragePath(prefix, fileName) {
  return `${activeTenantConfig.id}/${prefix}/${fileName}`;
}

async function subirArchivoABucket(bucketAlias, prefix, file) {
  const isIcoFile = /\.ico$/i.test(file.name || "") || ["image/x-icon", "image/vnd.microsoft.icon"].includes(file.type);
  const isSvgFile = file.type === "image/svg+xml";
  const isGifFile = file.type === "image/gif";
  const shouldCompressImage = file.type.startsWith("image/") && !isIcoFile && !isSvgFile && !isGifFile;
  const finalFile = shouldCompressImage ? await comprimirImagen(file) : file;
  const extension = shouldCompressImage
    ? "webp"
    : (file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : (isIcoFile ? "ico" : "jpg")));
  const fileName = `${prefix}_${Date.now()}.${extension}`;
  const storagePath = buildTenantStoragePath(prefix, fileName);
  const bucketName = resolveBucketName(bucketAlias);
  const { error } = await supabaseClient.storage.from(bucketName).upload(storagePath, finalFile, { upsert: true });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(storagePath);
  return data.publicUrl;
}

function obtenerPrecioProducto(prod) {
  if (adminSession.wholesaleMode || canUseCustomerWholesalePrices()) return Number(prod?.precioMayorista ?? prod?.precio ?? 0);
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

function buscarCatalogoDeProducto(nombre = "") {
  return catalogos.find((cat) => (cat.productos || []).some((item) => item.nombre === nombre))?.nombre || "";
}

/* QUE HACE: Genera un id estable por producto renderizado dentro del catalogo principal.
   POR QUE SE HIZO: Permite que los productos destacados lleven al usuario al producto exacto sin ambiguedad.
   COMO MODIFICARLO: Si luego quieres URLs mas legibles, cambia el formato pero mantenlo unico por catalogo y producto. */
function buildProductAnchorId(catalogIndex, productIndex) {
  return `producto_${catalogIndex}_${productIndex}`;
}

/* QUE HACE: Busca en que catalogo y posicion vive un producto segun su nombre.
   POR QUE SE HIZO: Los bloques destacados guardan nombres y desde ahi necesitamos encontrar el producto original.
   COMO MODIFICARLO: Si en el futuro usas ids unicos por producto, reemplaza la comparacion por ese id. */
function findProductLocationByName(nombre = "") {
  for (let ci = 0; ci < catalogos.length; ci += 1) {
    const pi = catalogos[ci].productos.findIndex((item) => item.nombre === nombre);
    if (pi >= 0) return { ci, pi, producto: catalogos[ci].productos[pi] };
  }
  return null;
}

/* QUE HACE: Lleva suavemente al usuario al producto exacto dentro del catalogo principal.
   POR QUE SE HIZO: Al tocar un producto destacado, ahora se puede abrir la ubicacion real del producto en la pagina.
   COMO MODIFICARLO: Ajusta el offset o el resaltado visual si cambias la altura del header fijo. */
function irAProductoPorNombre(nombre = "") {
  const location = findProductLocationByName(nombre);
  if (!location) return;
  const searchInput = document.getElementById("buscadorGlobal");
  if (searchInput?.value) {
    searchInput.value = "";
    actualizarResultadosBusqueda("");
  }
  const target = document.getElementById(buildProductAnchorId(location.ci, location.pi));
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

window.irAProductoPorNombre = irAProductoPorNombre;

function renderBranding() {
  const logoImage = document.getElementById("logoImage");
  const logoText = document.getElementById("logoText");
  const logoSubtext = document.getElementById("logoSubtext");
  const searchInput = document.getElementById("buscadorGlobal");
  const cartEmoji = document.getElementById("carritoEmoji");
  if (logoImage) {
    if (siteSettings.logoImage) {
      logoImage.src = getPrimaryImageSrc(siteSettings.logoImage, 240);
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
  if (searchInput) {
    searchInput.placeholder = siteSettings.searchInputPlaceholderText || defaultSiteSettings.searchInputPlaceholderText;
  }
  if (cartEmoji) {
    cartEmoji.textContent = siteSettings.cartButtonEmoji || defaultSiteSettings.cartButtonEmoji;
  }
}

function renderHero() {
  const container = document.getElementById("heroCards");
  if (!container) return;
  container.innerHTML = "";

  const heroCards = Array.isArray(siteSettings.heroCards) ? siteSettings.heroCards : defaultSiteSettings.heroCards;

  /* QUE HACE: La portada ahora usa el mismo motor de fondo de los bloques del builder.
     POR QUE SE HIZO: Asi el fondo solido, el fondo transparente y la opacidad funcionan igual que en las demas cajas.
     COMO MODIFICARLO: Si luego quieres otro tipo de fondo, agrega aqui una nueva rama antes del return. */
  function resolveHeroCardBackground(design = {}) {
    const visibleOpacity = !design.transparentBackground && Number(design.backgroundOpacity ?? 1) <= 0
      ? 1
      : (design.backgroundOpacity ?? 1);
    if (design.transparentBackground) return "transparent";
    if (design.backgroundMode === "solid") {
      return applyOpacityToCssColor(design.solidBackgroundColor || "#0f1c33", visibleOpacity);
    }
    return buildGradientBackground({
      enabled: design.gradient?.enabled,
      type: design.gradient?.type,
      position: design.gradient?.position,
      color1: design.gradient?.color1,
      color2: design.gradient?.color2,
      color3: design.gradient?.color3,
      opacity: visibleOpacity
    }) || applyOpacityToCssColor(design.solidBackgroundColor || "#0f1c33", visibleOpacity);
  }

  heroCards.forEach((card, index) => {
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
      backgroundMode: "gradient",
      solidBackgroundColor: "#0f1c33",
      transparentBackground: false,
      noBorder: false,
      backgroundOpacity: 1,
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
    const background = resolveHeroCardBackground(design);

    const article = document.createElement("article");
    article.className = `hero-card hero-card-${design.layoutWidth === "half" ? "half" : "full"}`;
    article.dataset.heroIndex = index;
    article.style.width = resolveInlineWidth(design.width || "100%");
    article.style.justifySelf = getGridJustify(design.boxAlign || "center");
    article.style.textAlign = design.align || "left";
    article.style.padding = `${design.padding || 42}px`;
    article.style.borderRadius = `${design.borderRadius || 34}px`;
    article.style.background = background;
    article.style.backgroundColor = design.transparentBackground ? "transparent" : applyOpacityToCssColor(design.solidBackgroundColor || "#0f1c33", Number(design.backgroundOpacity ?? 1) <= 0 ? 1 : (design.backgroundOpacity ?? 1));
    article.style.border = design.noBorder ? "none" : "1px solid var(--line)";
    article.style.boxShadow = design.transparentBackground ? "none" : "var(--shadow)";
    article.style.backdropFilter = design.transparentBackground ? "none" : "";
    article.innerHTML = `
      <span class="eyebrow" style="color:${design.eyebrowColor || "#c8f4ff"}">${card.eyebrow || ""}</span>
      <h1 style="color:${design.titleColor || "#edf5ff"};font-family:${getResolvedFontFamily(design.titleFontCustom || design.titleFont || "Space Grotesk")};font-size:clamp(34px,5vw,${design.titleSize || 74}px)">${card.title || ""}</h1>
      <p style="color:${design.descriptionColor || "#bed0e4"};font-family:${getResolvedFontFamily(design.descriptionFontCustom || design.descriptionFont || "Manrope")};font-size:clamp(16px,2vw,${design.descriptionSize || 18}px)">${card.description || ""}</p>
    `;
    if (canUseBuilder()) {
      article.addEventListener("click", () => {
        if (document.getElementById("builderSidebar")?.classList.contains("hidden")) return;
        if (typeof window.builderHooks?.openHeroEditor === "function") window.builderHooks.openHeroEditor(index);
      });
    }
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
  const themeBtn = document.getElementById("userThemeMenuBtn");
  const adminControlBtn = document.getElementById("adminControlMenuBtn");
  if (!avatarWrap || !avatar || !avatarRoleBadge || !userMeta || !nombre || !role || !loginBtn || !carritoIcon) return;

  const currentRole = getCurrentUserRole();
  const badge = roleBadgeIcon(currentRole);

  if (usuarioActual) {
    const photo = usuarioActual.syntheticBoss
      ? (accessState.bossCredentials.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png")
      : (usuarioActual.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png");
    avatar.src = photo ? `${getPrimaryImageSrc(photo, 180)}${photo.includes("?") ? "&" : "?"}t=${Date.now()}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
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
  themeBtn?.classList.toggle("hidden", !canUseUserThemeCustomization());
  document.getElementById("accountSessionsMenuBtn")?.classList.toggle("hidden", !usuarioActual);
  adminControlBtn?.classList.toggle("hidden", !canOpenAdminControlCenter());
  document.getElementById("wholesaleCenterMenuBtn")?.classList.toggle("hidden", !canToggleWholesale() && !roleHasPermission(currentRole, "wholesaleCart") && !canManageWholesaleClients());
  document.getElementById("wholesaleCostMenuBtn")?.classList.toggle("hidden", !canManageWholesaleCostList());
  document.getElementById("cashControlMenuBtn")?.classList.toggle("hidden", !canUseCashControl());
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
      .from(TABLES.carrito)
      .select("id,cantidad")
      .eq("usuario_id", usuarioActual.id)
      .eq("producto_id", item.nombre)
      .maybeSingle();

    if (current.data?.id) {
      await supabaseClient
        .from(TABLES.carrito)
        .update({ cantidad: Number(current.data.cantidad || 0) + Number(item.cantidad || 0) })
        .eq("id", current.data.id);
    } else {
      await supabaseClient.from(TABLES.carrito).insert([{
        usuario_id: usuarioActual.id,
        producto_id: item.nombre,
        cantidad: Number(item.cantidad || 1)
      }]);
    }
  }

  mergeStoredCartPricingEntries(guestCart, usuarioActual.id);
  localStorage.removeItem("guestCarrito");
}

async function obtenerUsuarioPorUsername(username) {
  const { data, error } = await supabaseClient
    .from(TABLES.usuarios)
    .select("*")
    .eq("username", username)
    .order("id", { ascending: false })
    .limit(1);
  return {
    data: Array.isArray(data) ? data[0] || null : null,
    error
  };
}

async function maybeMigrateLegacyUserPassword(user, plainPassword) {
  if (!user?.id || isStoredHashedPassword(user.password || "")) return user;
  if (user.password !== plainPassword) return user;
  const newStoredPassword = await buildStoredPassword(plainPassword);
  await supabaseClient.from(TABLES.usuarios).update({ password: newStoredPassword }).eq("id", user.id);
  return { ...user, password: newStoredPassword };
}

async function autenticarUsuarioPorPassword(username, password) {
  const result = await obtenerUsuarioPorUsername(username);
  if (!result.data) return { data: null, error: result.error || new Error("Usuario no encontrado.") };
  const isValid = await verifyStoredPassword(password, result.data.password || "");
  if (!isValid) return { data: null, error: new Error("Credenciales invalidas.") };
  const normalizedUser = await maybeMigrateLegacyUserPassword(result.data, password);
  return { data: normalizedUser, error: null };
}

async function guardarUsuarioRegistro(payload) {
  const existing = await obtenerUsuarioPorUsername(payload.username);
  if (existing.data) {
    return { ok: false, error: new Error("Ese usuario ya existe.") };
  }
  const { error } = await supabaseClient.from(TABLES.usuarios).insert([payload]);
  if (error && (payload.email || payload.correo || payload.telefono)) {
    const variants = [
      { username: payload.username, password: payload.password, foto: payload.foto, email: payload.email, telefono: payload.telefono },
      { username: payload.username, password: payload.password, foto: payload.foto, correo: payload.correo, telefono: payload.telefono },
      { username: payload.username, password: payload.password, foto: payload.foto, telefono: payload.telefono }
    ];
    for (const variant of variants) {
      const attempt = await supabaseClient.from(TABLES.usuarios).insert([variant]);
      if (!attempt.error) return { ok: true, error: null, usedFallback: true };
    }
    const basicPayload = {
      username: payload.username,
      password: payload.password,
      foto: payload.foto
    };
    const retry = await supabaseClient.from(TABLES.usuarios).insert([basicPayload]);
    return { ok: !retry.error, error: retry.error || null, usedFallback: true };
  }
  return { ok: !error, error: error || null };
}

async function actualizarContactoUsuarioRemoto(user, contact = {}) {
  if (!user?.id) return false;
  const email = contact.email || contact.correo || user.email || user.correo || "";
  const telefono = contact.telefono || user.telefono || user.phone || "";
  const attempts = [
    { email, correo: email, telefono, phone: telefono },
    { email, telefono },
    { correo: email, telefono },
    { telefono },
    { phone: telefono }
  ].filter((payload) => Object.values(payload).some(Boolean));
  for (const payload of attempts) {
    const { error } = await supabaseClient.from(TABLES.usuarios).update(payload).eq("id", user.id);
    if (!error) return true;
  }
  return false;
}

async function registrarUsuario() {
  const username = document.getElementById("regUser").value.trim();
  const email = document.getElementById("regEmail")?.value.trim() || "";
  const phoneCountry = document.getElementById("regPhoneCountry")?.value || "+1";
  const rawPhone = document.getElementById("regPhone")?.value.trim() || "";
  const telefono = normalizePhoneNumber(phoneCountry, rawPhone);
  const password = document.getElementById("regPass").value;
  const fotoFile = document.getElementById("regFoto").files[0];
  if (!username) return mostrarMensaje("Completa el nombre de usuario.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarMensaje("Escribe un correo valido o deja el campo vacio.");
  if (!telefono) return mostrarMensaje("El telefono es obligatorio.");
  if (!phoneVerificationState.register.verified || phoneVerificationState.register.phone !== telefono) {
    return mostrarMensaje("Debes confirmar el codigo del telefono antes de registrarte.");
  }
  if (!password) return mostrarMensaje("Completa la contrasena.");

  let fotoURL = null;
  if (fotoFile) fotoURL = await subirArchivoABucket("perfil", "perfil", fotoFile);

  const payload = {
    username,
    email,
    correo: email,
    telefono,
    telefonoVerificado: true,
    password: await buildStoredPassword(password),
    foto: fotoURL
  };
  const saveResult = await guardarUsuarioRegistro(payload);
  if (!saveResult.ok) {
    return mostrarMensaje(saveResult.error?.message || "No se pudo registrar el usuario.");
  }

  const { data } = await obtenerUsuarioPorUsername(username);
  setUsuarioActualData({ ...(data || payload), email, correo: email, telefono });
  await actualizarContactoUsuarioRemoto(usuarioActual, { email, telefono });
  saveUserContactMeta(usuarioActual, { email, telefono, createdAt: new Date().toISOString() });
  recordUserActivity("registro", { username, email, telefono });
  applyRoleToCurrentUser();
  await mergeGuestCartIntoUser();
  await cargarCarritoUsuario();
  await cargarFavoritos();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  applySiteAppearance();
  document.getElementById("regUser").value = "";
  if (document.getElementById("regEmail")) document.getElementById("regEmail").value = "";
  if (document.getElementById("regPhone")) document.getElementById("regPhone").value = "";
  if (document.getElementById("regPhoneCode")) document.getElementById("regPhoneCode").value = "";
  phoneVerificationState.register = { phone: "", code: "", verified: false };
  setPhoneVerifyStatus("phoneVerifyStatus", "Telefono obligatorio. Confirma el codigo antes de registrarte.");
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

  if (
    username === accessState.bossCredentials.username &&
    await verifySecretHash(password, accessState.bossCredentials.passwordHash)
  ) {
    setUsuarioActualData({
      id: "boss-account",
      username,
      password: "sha256:protected",
      foto: accessState.bossCredentials.photo || "",
      syntheticBoss: true,
      role: "boss"
    });
    carrito = getStoredGuestCart();
    favoritos = [];
    actualizarUsuarioUI();
    actualizarContadorCarrito();
    applySiteAppearance();
    cerrarLoginUsuario();
    return;
  }

  const result = await autenticarUsuarioPorPassword(username, password);
  if (!result.data) return mostrarMensaje("Datos incorrectos.");
  setUsuarioActualData({ ...result.data, ...getUserContactMeta(result.data) });
  await actualizarContactoUsuarioRemoto(usuarioActual, getUserContactMeta(usuarioActual));
  saveUserContactMeta(usuarioActual);
  recordUserActivity("login", { username: usuarioActual.username });
  registerAccountSession(usuarioActual);
  applyRoleToCurrentUser();
  await mergeGuestCartIntoUser();
  await cargarCarritoUsuario();
  await cargarFavoritos();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  applySiteAppearance();
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  cerrarLoginUsuario();
}

function cerrarSesion() {
  closeModal("userThemeModal");
  cerrarAnaliticaBoss();
  cerrarCentroControl();
  if (usuarioActual) {
    const userKey = getAccountSessionUserKey(usuarioActual);
    const map = getAccountSessionsMap();
    const currentId = getBrowserSessionId();
    map[userKey] = (map[userKey] || []).map((session) =>
      session.id === currentId ? { ...session, status: "closed", closedAt: new Date().toISOString() } : session
    );
    saveAccountSessionsMap(map);
  }
  clearUsuarioActualData();
  favoritos = [];
  carrito = getStoredGuestCart();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  applySiteAppearance();
}

async function cargarCarritoUsuario() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) {
    carrito = getStoredGuestCart();
    return;
  }
  const { data, error } = await supabaseClient.from(TABLES.carrito).select("*").eq("usuario_id", usuarioActual.id);
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
  const { data, error } = await supabaseClient.from(TABLES.favoritos).select("*").eq("usuario_id", usuarioActual.id);
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
  const { data } = await supabaseClient.from(TABLES.carrito).select("id").eq("usuario_id", usuarioActual.id).eq("producto_id", nombre).maybeSingle();
  if (cantidad <= 0) {
    await supabaseClient.from(TABLES.carrito).delete().eq("usuario_id", usuarioActual.id).eq("producto_id", nombre);
    persistCurrentCartPricing();
    return;
  }
  if (data) {
    await supabaseClient.from(TABLES.carrito).update({ cantidad }).eq("usuario_id", usuarioActual.id).eq("producto_id", nombre);
  } else {
    await supabaseClient.from(TABLES.carrito).insert([{ usuario_id: usuarioActual.id, producto_id: nombre, cantidad }]);
  }
  persistCurrentCartPricing();
}

async function agregarCarritoCantidad(nombre, cantidad, notaPedido = "", unitPriceOverride = null) {
  if (adminSession.wholesaleMode) return agregarProductoVentaMayorista(nombre, cantidad, notaPedido, unitPriceOverride);
  const prod = buscarProducto(nombre);
  if (!prod) return;
  const existing = carrito.find((item) => item.nombre === nombre && String(item.notaPedido || "") === String(notaPedido || ""));
  const nextQuantity = Number(existing?.cantidad || 0) + Number(cantidad || 0);
  if (!canSellQuantity(prod, nextQuantity)) {
    return mostrarMensaje(`Solo quedan ${Number(prod.stock || 0)} unidad(es) disponibles de ${prod.nombre}.`);
  }
  const unitPrice = unitPriceOverride !== null && !Number.isNaN(Number(unitPriceOverride)) ? Number(unitPriceOverride) : obtenerPrecioProducto(prod);
  const pricingMode = (adminSession.wholesaleMode || canUseCustomerWholesalePrices()) ? "wholesale" : "retail";
  const costPrice = getStoredWholesaleCost(buscarCatalogoDeProducto(nombre), prod.nombre, prod);
  if (existing) {
    existing.cantidad += cantidad;
    existing.precio = Number(prod.precio || 0);
    existing.precioMayorista = Number(prod.precioMayorista ?? prod.precio ?? 0);
    existing.unitPrice = unitPrice;
    existing.pricingMode = pricingMode;
    existing.costoMayorista = costPrice;
    existing.notaPedido = notaPedido || existing.notaPedido || "";
    existing.saleUnitLabel = prod.saleUnitLabel || "";
  } else {
    carrito.push({
      ...prod,
      precio: Number(prod.precio || 0),
      precioMayorista: Number(prod.precioMayorista ?? prod.precio ?? 0),
      cantidad,
      unitPrice,
      costoMayorista: costPrice,
      pricingMode,
      notaPedido,
      saleUnitLabel: prod.saleUnitLabel || ""
    });
  }
  const current = carrito.find((item) => item.nombre === nombre && String(item.notaPedido || "") === String(notaPedido || ""));
  await syncCarritoProducto(nombre, current.cantidad);
  recordUserActivity("carrito", { producto: nombre, cantidad, totalEnCarrito: current.cantidad });
  actualizarContadorCarrito();
}

function agregarProductoVentaMayorista(nombre, cantidad, notaPedido = "", unitPriceOverride = null) {
  const activeSale = readLocalJson(ADMIN_LOCAL_KEYS.wholesaleActiveSale, {});
  wholesaleRuntime.activeClientId = wholesaleRuntime.activeClientId || activeSale.activeClientId || activeSale.clientId || "";
  wholesaleRuntime.activeSaleId = wholesaleRuntime.activeSaleId || activeSale.activeSaleId || activeSale.saleId || "";
  const client = getWholesaleClientById(wholesaleRuntime.activeClientId || activeSale.activeClientId || activeSale.clientId);
  if (!client) {
    mostrarMensaje("Primero selecciona o registra un cliente de venta al por mayor.");
    abrirCentroMayorista();
    return;
  }
  const prod = buscarProducto(nombre);
  if (!prod) return;
  const orders = getWholesaleOrders();
  let order = orders.find((item) => item.id === wholesaleRuntime.activeSaleId && item.status !== "pagado");
  if (!order) {
    order = normalizeAdminOrder({
      id: wholesaleRuntime.activeSaleId || `whorder_${Date.now()}`,
      sourceSignature: wholesaleRuntime.activeSaleId || `whorder_${Date.now()}`,
      orderType: "wholesale",
      wholesaleClientId: client.id,
      username: client.alias || client.username || "Mayorista",
      telefono: client.phone || "",
      fecha: new Date().toISOString(),
      productos: [],
      status: "pendiente",
      paymentMode: "normal",
      wholesaleBadge: true
    });
    wholesaleRuntime.activeSaleId = order.id;
    writeLocalJson(ADMIN_LOCAL_KEYS.wholesaleActiveSale, wholesaleRuntime);
  }
  const unitPrice = unitPriceOverride !== null && !Number.isNaN(Number(unitPriceOverride)) ? Number(unitPriceOverride) : Number(prod.precioMayorista ?? prod.precio ?? 0);
  const costPrice = getStoredWholesaleCost(buscarCatalogoDeProducto(nombre), prod.nombre, prod);
  const existing = order.productos.find((item) => item.nombre === nombre && String(item.notaPedido || "") === String(notaPedido || ""));
  if (existing) {
    existing.cantidad = Number(existing.cantidad || 0) + Number(cantidad || 1);
    existing.unitPrice = unitPrice;
    existing.precioVenta = unitPrice;
    existing.costoMayorista = costPrice;
    existing.notaPedido = notaPedido || existing.notaPedido || "";
  } else {
    order.productos.push(buildOrderLineStats({
      nombre: prod.nombre,
      precio: unitPrice,
      unitPrice,
      precioVenta: unitPrice,
      precioMayorista: costPrice,
      costoMayorista: costPrice,
      cantidad: Number(cantidad || 1),
      pricingMode: "wholesale",
      notaPedido,
      saleUnitLabel: prod.saleUnitLabel || ""
    }));
  }
  order.productos = order.productos.map(buildOrderLineStats);
  order.total = order.productos.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  order.gananciaTotal = order.productos.reduce((sum, item) => sum + Number(item.gananciaTotal || 0), 0);
  const index = orders.findIndex((item) => item.id === order.id);
  if (index >= 0) orders[index] = normalizeAdminOrder(order);
  else orders.unshift(normalizeAdminOrder(order));
  saveWholesaleOrders(orders);
  recordUserActivity("venta_mayorista_producto", { cliente: client.alias || client.username, producto: nombre, cantidad });
  mostrarMensaje(`${nombre} agregado a la venta mayorista de ${client.alias || client.username}.`);
}

function abrirCantidad(nombre) {
  const prod = buscarProducto(nombre);
  if (!prod) return;
  adminEditPanelState = { type: "cantidad", productName: nombre };
  const activeClient = wholesaleRuntime.activeClientId ? getWholesaleClientById(wholesaleRuntime.activeClientId) : null;
  const canEditPriceHere = Boolean(adminSession.active);
  document.getElementById("adminEditPanelTitle").textContent = adminSession.wholesaleMode ? "Agregar a venta mayorista" : "Agregar al carrito";
  document.getElementById("adminEditPanelNote").textContent = adminSession.wholesaleMode
    ? "Selecciona cantidad. Si no hay cliente mayorista activo, registralo o selecciona uno antes de vender."
    : "Coloca la cantidad y usa la nota para explicar exactamente lo que quieres.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <div class="admin-control-card">
        <strong>${escapeHtmlAttribute(nombre)}</strong>
        <small>${adminSession.wholesaleMode ? `Cliente activo: ${escapeHtmlAttribute(activeClient?.alias || activeClient?.username || "ninguno")}` : "Venta normal"}</small>
        <small id="quantityPriceMiniText">${buildQuantityMiniText(prod, 1)}</small>
      </div>
      <label>Cantidad<input id="quantityPanelAmount" type="number" min="1" step="1" value="1" oninput="actualizarMiniTextoCantidad()"></label>
      ${canEditPriceHere ? `<label>Precio de venta<input id="quantityPanelUnitPrice" type="number" step="0.01" value="${Number(obtenerPrecioProducto(prod) || 0)}" oninput="actualizarMiniTextoCantidad()"></label>` : `<input id="quantityPanelUnitPrice" type="hidden" value="${Number(obtenerPrecioProducto(prod) || 0)}">`}
      <label class="builder-check-row"><span>Nota opcional</span><input id="quantityPanelUseNote" type="checkbox" onchange="toggleQuantityOptionalNote()"></label>
      <div id="quantityPanelNoteWrap" class="hidden">
        <label>Nota opcional<textarea id="quantityPanelNote" placeholder="Ejemplo: forro de Samsung A16, A22 5G, iPhone 12, 13, 14. Si es otro producto, escribe el detalle exacto que necesitas."></textarea></label>
        <p class="modal-note">La nota es para explicar modelos, colores, cajas, unidades o cualquier informacion extra del producto.</p>
      </div>
      ${adminSession.wholesaleMode && !activeClient ? `<p class="modal-note">Debes registrar o seleccionar un cliente mayorista para agregar este pedido.</p><button type="button" onclick="abrirCentroMayorista()">Seleccionar o registrar cliente</button>` : ""}
      <div class="modal-actions">
        <button type="button" onclick="guardarCantidadPanel()">Agregar</button>
        ${adminSession.wholesaleMode ? `<button type="button" class="ghost-btn" onclick="cerrarVentaMayoristaActiva()">Cerrar venta</button>` : ""}
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function buildQuantityMiniText(prod = {}, quantity = 1, unitPrice = obtenerPrecioProducto(prod)) {
  const qty = Number(quantity || 1);
  const unit = Number(unitPrice || 0);
  return `Precio unidad $${unit} x ${qty} = $${unit * qty}`;
}

function actualizarMiniTextoCantidad() {
  const prod = buscarProducto(adminEditPanelState.productName);
  const target = document.getElementById("quantityPriceMiniText");
  if (!prod || !target) return;
  target.textContent = buildQuantityMiniText(prod, document.getElementById("quantityPanelAmount")?.value || 1, document.getElementById("quantityPanelUnitPrice")?.value || obtenerPrecioProducto(prod));
}

function toggleQuantityOptionalNote() {
  document.getElementById("quantityPanelNoteWrap")?.classList.toggle("hidden", !document.getElementById("quantityPanelUseNote")?.checked);
}

function guardarCantidadPanel() {
  const value = parseInt(document.getElementById("quantityPanelAmount")?.value || "1", 10);
  if (!Number.isInteger(value) || value <= 0) return mostrarMensaje("Cantidad no valida.");
  const customPrice = parseFloat(document.getElementById("quantityPanelUnitPrice")?.value || "");
  const note = document.getElementById("quantityPanelUseNote")?.checked ? (document.getElementById("quantityPanelNote")?.value.trim() || "") : "";
  agregarCarritoCantidad(adminEditPanelState.productName, value, note, Number.isNaN(customPrice) ? null : customPrice);
  cerrarPanelEdicionAdmin();
}

async function agregarFavorito(nombre) {
  if (!usuarioActual || usuarioActual.syntheticBoss) return mostrarMensaje("Debes iniciar sesion.");
  if (favoritos.find((item) => item.nombre === nombre)) return mostrarMensaje("Ya esta en favoritos.");
  const prod = buscarProducto(nombre);
  if (!prod) return;
  favoritos.push({ ...prod, cantidad: 1 });
  await supabaseClient.from(TABLES.favoritos).insert([{ usuario_id: usuarioActual.id, producto_id: nombre, cantidad: 1 }]);
  recordUserActivity("favorito", { producto: nombre });
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
  const fastBtn = document.createElement("button");
  fastBtn.type = "button";
  fastBtn.id = "fastModeMobileBtn";
  fastBtn.textContent = isFastModeEnabled() ? "Modo suave" : "Modo rapido";
  fastBtn.onclick = toggleFastMode;
  mobile.appendChild(fastBtn);
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

function buildProductStateMarkup(prod) {
  const isActive = prod.activo !== false;
  const visibilityMode = siteSettings.productStateVisibilityMode || "always";
  if (visibilityMode === "hidden") return "";
  if (visibilityMode === "onlyUnavailable" && isActive) return "";
  const label = isActive ? (siteSettings.productStateAvailableText || "Disponible") : (siteSettings.productStateUnavailableText || "No disponible");
  const stateClass = isActive ? "estado-disponible" : "estado-no-disponible";
  return `<div class="estado ${stateClass}">${label}</div>`;
}

function buildProductHintMarkup() {
  return `<span class="product-image-hint">${siteSettings.productImageHintText || "Toca o haz click para ampliar y ver mas"}</span>`;
}

function buildProductStockMarkup(prod) {
  if (!canSeeInventoryQuantity()) return "";
  if (!hasInventory(prod)) return "";
  const status = getStockStatus(prod);
  return `<span class="stock-pill ${status.className}">${status.label}</span>`;
}

function buildProductVideoMarkup(prod) {
  if (!prod.videoInfoUrl) return "";
  return `<button type="button" class="product-video-btn" onclick="abrirVideoProducto('${escapeHtmlAttribute(prod.videoInfoUrl)}')">${siteSettings.productVideoButtonText || "Ver video"}</button>`;
}

function buildProductSaleUnitMarkup(prod) {
  const label = prod.saleUnitLabel || siteSettings.productDefaultSaleUnitLabel || "";
  if (!label) return "";
  return `<span class="product-unit-pill">${escapeHtmlAttribute(label)}</span>`;
}

function buildOrderItemsSummary(productos = []) {
  return (productos || []).map((item) => {
    const unit = item.saleUnitLabel ? ` (${item.saleUnitLabel})` : "";
    const note = item.notaPedido ? ` - nota: ${item.notaPedido}` : "";
    const credit = item.paymentMode === "credito" ? " - a credito" : "";
    return `${item.nombre}${unit} x${item.cantidad}${credit}${note} - venta $${item.precioVenta || 0} - costo $${item.precioMayorista ?? "sin costo"} - ganancia $${item.gananciaTotal || 0}`;
  }).join(" | ");
}

function generarProductoHTML(prod, ci, pi) {
  const wholesaleView = adminSession.wholesaleMode || canUseCustomerWholesalePrices();
  const cartAllowed = !adminSession.wholesaleMode || canUseWholesaleCart();
  return `
    ${buildProductStateMarkup(prod)}
    <div class="product-image-wrap">
      ${buildResponsiveImageMarkup(prod.imagen, {
        alt: prod.nombre,
        loading: "lazy",
        decoding: "async",
        fetchpriority: "low",
        sizes: "(max-width: 760px) 50vw, (max-width: 980px) 33vw, 25vw",
        width: 900,
        onclick: `abrirImagenProducto(${ci},${pi})`
      })}
      ${buildProductHintMarkup()}
    </div>
    <div class="producto-body">
      <h4>${prod.nombre}</h4>
      <p>${prod.descripcion || ""}</p>
      ${buildProductSaleUnitMarkup(prod)}
      <div class="precio-row">
        ${wholesaleView ? buildWholesalePriceMarkup(prod) : buildRetailPriceMarkup(prod)}
      </div>
      ${buildProductStockMarkup(prod)}
      <div class="acciones-producto">
        <button type="button" class="favorite-product-btn" aria-label="Favorito" title="Favorito" onclick="agregarFavorito('${prod.nombre.replace(/'/g, "\\'")}')"><span class="favorite-product-icon">❤</span><span class="favorite-product-text">Favorito</span></button>
        ${buildProductVideoMarkup(prod)}
        <button type="button" class="add-product-btn" ${cartAllowed ? `onclick="abrirCantidad('${prod.nombre.replace(/'/g, "\\'")}')"` : "disabled"}>${cartAllowed ? "Agregar" : "Solo mayorista"}</button>
      </div>
      ${canEditRetail() ? `
        <div class="admin-product-actions">
          <button type="button" onclick="editarProducto(${ci},${pi})">Editar</button>
          <button type="button" onclick="crearOferta(${ci},${pi})">Oferta</button>
          <button type="button" onclick="quitarOferta(${ci},${pi})">Quitar Oferta</button>
          <button type="button" onclick="cambiarImagen(${ci},${pi})">Imagen</button>
          <button type="button" onclick="agregarImagenExtra(${ci},${pi})">Imagen Extra</button>
          <button type="button" onclick="quitarImagenExtra(${ci},${pi})">Quitar Extra</button>
          <button type="button" onclick="editarInventarioProducto(${ci},${pi})">Inventario</button>
          <button type="button" onclick="editarVideoProducto(${ci},${pi})">Video</button>
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
        ${canEditRetail() ? `<div class="catalogo-actions"><button type="button" onclick="agregarProducto(${ci})">Agregar Producto</button><button type="button" onclick="abrirProductoCamara(${ci})">Agregar con camara</button><button type="button" class="danger-btn" onclick="eliminarCatalogo(${ci})">Eliminar Catalogo</button></div>` : ""}
      </div>
    `;
    const grid = document.createElement("div");
    grid.className = "productos-grid";
    if (cat.productos.length === 1) grid.classList.add("single-product-grid");
    cat.productos.forEach((prod, pi) => {
      const article = document.createElement("article");
      article.className = "producto";
      article.id = buildProductAnchorId(ci, pi);
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
  syncStickyOffsets();
  optimizeRenderedMedia();
  schedulePerformanceWarmup();
}

async function cargarDesdeSupabase() {
  try {
    const { data } = await supabaseClient.from(TABLES.catalogos).select("*").limit(1);
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
      await supabaseClient.from(TABLES.catalogos).update({ data: catalogos }).eq("id", catalogosRowId);
    } else {
      const { data } = await supabaseClient.from(TABLES.catalogos).insert([{ data: catalogos }]).select();
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
    const { data } = await supabaseClient.from(TABLES.slides).select("*").limit(1);
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
      await supabaseClient.from(TABLES.slides).update({ data: slidesData }).eq("id", slidesRowId);
    } else {
      const { data } = await supabaseClient.from(TABLES.slides).insert([{ data: slidesData }]).select();
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
  if (slidesData.length <= 1) return;
  sliderInterval = setInterval(nextSlide, (slidesData[slideIndex]?.duracion || 4) * 1000);
}

function ajustarSliderPrincipalFullBleed() {
  const container = document.getElementById("sliderContainer");
  if (!container) return;
  container.style.removeProperty("width");
  container.style.removeProperty("max-width");
  container.style.removeProperty("margin-left");
  container.style.removeProperty("margin-right");
  container.querySelectorAll(".slider, .slide, .slide picture, .slide img").forEach((node) => {
    node.style.removeProperty("width");
    node.style.removeProperty("max-width");
  });
}

function renderSlider() {
  const slider = document.getElementById("slider");
  if (!slider) return;
  const sliderContainer = document.getElementById("sliderContainer");
  const sliderMeta = accessState.specialSections?.slider || defaultAccessState.specialSections.slider;
  const applySlideBackground = (element, image) => {
    if (!element) return;
    const src = getPrimaryImageSrc(image, 1800);
    if (src) element.style.setProperty("--mobile-slide-bg", `url("${escapeCssUrl(src)}")`);
  };
  if (sliderContainer) {
    sliderContainer.classList.toggle("slider-full-bleed", (sliderMeta.widthMode || "full") === "full");
    sliderContainer.classList.toggle("slider-boxed", sliderMeta.widthMode === "boxed");
  }
  slider.innerHTML = "";
  if (!slidesData.length) {
    const fallbackSlide = "https://placehold.co/1600x700/082032/e2e8f0?text=Agrega+tu+primer+slide";
    slider.innerHTML = `<div class="slide">${buildResponsiveImageMarkup(fallbackSlide, { alt: "slider", loading: "eager", decoding: "async", fetchpriority: "high", width: 1600 })}<div class="slide-info"><h2>Slider listo para editar</h2><p>Activa el modo administrador y agrega tus slides.</p></div></div>`;
    applySlideBackground(slider.querySelector(".slide"), fallbackSlide);
    ajustarSliderPrincipalFullBleed();
    return;
  }
  const slide = slidesData[slideIndex];
  const div = document.createElement("div");
  div.className = "slide";
  div.innerHTML = `
    ${buildResponsiveImageMarkup(slide.imagen, {
      alt: slide.texto || "Slide",
      loading: "eager",
      decoding: "async",
      fetchpriority: "high",
      sizes: "100vw",
      width: 1800
    })}
    <div class="slide-info">
      <h2>${slide.texto || ""}</h2>
      <p>${slide.descripcion || ""}</p>
      ${canUseBuilder() ? `<div class="modal-actions"><button type="button" onclick="editarSlide(${slideIndex})">Editar</button><button type="button" class="danger-btn" onclick="eliminarSlide(${slideIndex})">Eliminar</button></div>` : ""}
    </div>
  `;
  slider.appendChild(div);
  applySlideBackground(div, slide.imagen);
  iniciarSlider();
  ajustarSliderPrincipalFullBleed();
  optimizeRenderedMedia();
  schedulePerformanceWarmup();
}

function nextSlide() {
  if (slidesData.length <= 1) return;
  slideIndex = (slideIndex + 1) % slidesData.length;
  renderSlider();
}

function prevSlide() {
  if (slidesData.length <= 1) return;
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
    hint.textContent = "Boss: puedes entrar con tu cuenta boss o con el acceso interno compartido.";
    hint.classList.remove("hidden");
    return;
  }
  if (roleHasPermission(role, "adminAccess")) {
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
    const isBossCredential =
      username === accessState.bossCredentials.username &&
      await verifySecretHash(password, accessState.bossCredentials.passwordHash);
    const isSharedInternal =
      username === accessState.adminCredentials.username &&
      await verifySecretHash(password, accessState.adminCredentials.passwordHash);
    if (!isBossCredential && !isSharedInternal) {
      return mostrarMensaje("Credenciales internas no validas.");
    }
    startAdminSession("boss", usuarioActual.username || accessState.bossCredentials.username, "user", usuarioActual.id || null);
    return;
  }

  const isSharedInternal =
    username === accessState.adminCredentials.username &&
    await verifySecretHash(password, accessState.adminCredentials.passwordHash);
  if (!isSharedInternal) {
    return mostrarMensaje("Debes usar el usuario y la contrasena interna configurados por el boss.");
  }

  if (!roleHasPermission(currentRole, "adminAccess")) {
    return mostrarMensaje("Tu cuenta no tiene acceso al modo interno.");
  }

  startAdminSession(currentRole, usuarioActual.username || username, "user", usuarioActual.id || null);
}

async function solicitarPasswordMayorista() {
  const password = prompt("Contrasena del modo venta al por mayor:");
  if (!(await verifySecretHash(password || "", accessState.wholesaleCredentials.passwordHash))) {
    mostrarMensaje("Contrasena mayorista incorrecta.");
    return false;
  }
  adminSession.wholesaleMode = true;
  actualizarAdminPanel();
  render();
  return true;
}

async function toggleWholesaleMode() {
  if (!canToggleWholesale()) return mostrarMensaje("Tu rol no puede acceder a venta al por mayor.");
  if (adminSession.wholesaleMode) {
    activarModoTienda();
    return;
  }
  if (await solicitarPasswordMayorista()) {
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
  if (siteSettings.productGalleryShowThumbs === false || imagenesProducto.length <= 1) {
    thumbs.innerHTML = "";
    thumbs.classList.add("hidden");
    return;
  }
  thumbs.classList.remove("hidden");
  thumbs.innerHTML = imagenesProducto.map((src, index) => `
    <button type="button" class="img-thumb ${index === indiceImagenActual ? "active" : ""}" onclick="setImagenModalIndex(${index})">
      ${buildResponsiveImageMarkup(src, { alt: `Miniatura ${index + 1}`, loading: "lazy", decoding: "async", fetchpriority: "low", width: 160 })}
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
  videoProductoActual = producto.videoInfoUrl || "";
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
    preview.src = getPrimaryImageSrc(imagenesProducto[indiceImagenActual], 1600);
  }
  applyProductGalleryAppearance();
  actualizarImagenModal(false);
  openModal("imgModal");
}

function abrirVideoProducto(url = "") {
  if (!url) return mostrarMensaje("Este producto aun no tiene video informativo.");
  window.open(url, "_blank", "noopener,noreferrer");
}

function actualizarImagenModal(animate = false) {
  const preview = document.getElementById("imgPreview");
  const prevBtn = document.getElementById("imgPrev");
  const nextBtn = document.getElementById("imgNext");
  const counter = document.getElementById("imgModalCounter");
  const moreBtn = document.getElementById("imgMoreBtn");
  const videoBtn = document.getElementById("imgProductVideoBtn");
  if (!preview || !imagenesProducto.length) return;
  if (animate) animateImagePreview();
  preview.src = getPrimaryImageSrc(imagenesProducto[indiceImagenActual], 1600);
  preview.style.objectFit = siteSettings.productGalleryFitMode || "contain";
  preview.style.maxHeight = window.matchMedia?.("(max-width: 760px)")?.matches
    ? "calc(100dvh - 138px)"
    : (siteSettings.productGalleryFitToImage ? "min(82vh, 92vw)" : "min(76vh, 860px)");
  if (counter) {
    counter.textContent = imagenesProducto.length > 1 ? `${indiceImagenActual + 1} / ${imagenesProducto.length}` : "";
  }
  if (prevBtn) prevBtn.classList.toggle("hidden", imagenesProducto.length <= 1);
  if (nextBtn) nextBtn.classList.toggle("hidden", imagenesProducto.length <= 1);
  if (moreBtn) {
    moreBtn.classList.toggle("hidden", imagenesProducto.length <= 1);
    moreBtn.textContent = imagenesProducto.length > 1 ? "Ver mas imagenes" : "";
  }
  if (videoBtn) {
    videoBtn.classList.toggle("hidden", !videoProductoActual);
    videoBtn.textContent = siteSettings.productVideoButtonText || "Ver video";
  }
  applyProductGalleryAppearance();
  renderImagenThumbnails();
}

let manualProductState = {
  catalogIndex: null
};

function getManualProductDraftKey() {
  return `manualProductDraft_${manualProductState.catalogIndex ?? "none"}`;
}

function leerBorradorProductoManual() {
  return readLocalJson(getManualProductDraftKey(), {});
}

function guardarBorradorProductoManual() {
  if (manualProductState.catalogIndex === null) return;
  writeLocalJson(getManualProductDraftKey(), {
    nombre: document.getElementById("manualProductName")?.value || "",
    descripcion: document.getElementById("manualProductDescription")?.value || "",
    videoInfoUrl: document.getElementById("manualProductVideoUrl")?.value || "",
    precio: document.getElementById("manualProductRetailPrice")?.value || "",
    precioMayorista: document.getElementById("manualProductWholesalePrice")?.value || "",
    imagen: document.getElementById("manualProductImageUrl")?.value || "",
    controlStock: Boolean(document.getElementById("manualProductUseStock")?.checked),
    stock: document.getElementById("manualProductStock")?.value || "",
    stockAlert: document.getElementById("manualProductStockAlert")?.value || ""
  });
}

function toggleInventarioProductoManual() {
  const enabled = Boolean(document.getElementById("manualProductUseStock")?.checked);
  document.getElementById("manualProductStockFields")?.classList.toggle("hidden", !enabled);
}

function agregarProducto(ci) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede agregar productos en este modo.");
  manualProductState.catalogIndex = ci;
  const draft = leerBorradorProductoManual();
  document.getElementById("manualProductName").value = draft.nombre || "";
  document.getElementById("manualProductDescription").value = draft.descripcion || "";
  document.getElementById("manualProductVideoUrl").value = draft.videoInfoUrl || "";
  document.getElementById("manualProductRetailPrice").value = draft.precio || "";
  document.getElementById("manualProductWholesalePrice").value = draft.precioMayorista || "";
  document.getElementById("manualProductImageUrl").value = draft.imagen || "";
  document.getElementById("manualProductUseStock").checked = Boolean(draft.controlStock);
  document.getElementById("manualProductStock").value = draft.stock || "";
  document.getElementById("manualProductStockAlert").value = draft.stockAlert || "3";
  toggleInventarioProductoManual();
  openModal("manualProductModal");
}

function cerrarProductoManual() {
  closeModal("manualProductModal");
}

function guardarProductoManual() {
  if (manualProductState.catalogIndex === null) return;
  const nombre = document.getElementById("manualProductName")?.value.trim();
  const precio = parseFloat(document.getElementById("manualProductRetailPrice")?.value || "");
  const precioMayoristaInput = document.getElementById("manualProductWholesalePrice")?.value || "";
  const precioMayorista = parseFloat(precioMayoristaInput);
  const usarInventario = Boolean(document.getElementById("manualProductUseStock")?.checked);
  const stock = parseInt(document.getElementById("manualProductStock")?.value || "0", 10);
  const stockAlert = parseInt(document.getElementById("manualProductStockAlert")?.value || "3", 10);
  if (!nombre) return mostrarMensaje("Escribe el nombre del producto.");
  if (Number.isNaN(precio)) return mostrarMensaje("Escribe el precio del producto.");
  catalogos[manualProductState.catalogIndex].productos.push(normalizarProducto({
    nombre,
    precio,
    precioMayorista: precioMayoristaInput.trim() === "" || Number.isNaN(precioMayorista) ? null : precioMayorista,
    descripcion: document.getElementById("manualProductDescription")?.value.trim() || "",
    imagen: document.getElementById("manualProductImageUrl")?.value.trim() || null,
    imagenes: [],
    oferta: null,
    activo: true,
    controlStock: usarInventario,
    stock: usarInventario ? (Number.isNaN(stock) ? 0 : stock) : 0,
    stockAlert: usarInventario ? (Number.isNaN(stockAlert) ? 3 : stockAlert) : 3,
    videoInfoUrl: document.getElementById("manualProductVideoUrl")?.value.trim() || ""
  }));
  recordUserActivity("producto_creado", { producto: nombre, controlStock: usarInventario });
  localStorage.removeItem(getManualProductDraftKey());
  cerrarProductoManual();
  guardar();
}

function editarProducto(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede editar productos en este modo.");
  const prod = catalogos[ci].productos[pi];
  adminEditPanelState = { type: "productEdit", orderId: `${ci}:${pi}` };
  document.getElementById("adminEditPanelTitle").textContent = "Modificar producto";
  document.getElementById("adminEditPanelNote").textContent = "Este panel queda abierto aunque cambies de aplicacion para copiar informacion.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Nombre<input id="panelProductName" value="${escapeHtmlAttribute(prod.nombre || "")}"></label>
      <label>Precio cliente final<input id="panelProductPrice" type="number" step="0.01" value="${Number(prod.precio || 0)}"></label>
      <label>Precio de venta al por mayor opcional<input id="panelProductWholesalePrice" type="number" step="0.01" value="${prod.precioMayorista ?? ""}" placeholder="Vacio si no aplica"></label>
      <label>Detalle de venta<input id="panelProductSaleUnitLabel" value="${escapeHtmlAttribute(prod.saleUnitLabel || "")}" placeholder="Ejemplo: Por unidad, Por caja"></label>
      <label>Descripcion<textarea id="panelProductDescription">${escapeHtml(prod.descripcion || "")}</textarea></label>
      <label>Enlace de video informativo<input id="panelProductVideoUrl" value="${escapeHtmlAttribute(prod.videoInfoUrl || "")}" placeholder="YouTube, TikTok, Instagram..."></label>
      <div class="modal-actions">
        <button type="button" onclick="guardarProductoPanel()">Guardar producto</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cancelar</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function guardarProductoPanel() {
  const [ci, pi] = String(adminEditPanelState.orderId || "").split(":").map(Number);
  const prod = catalogos[ci]?.productos?.[pi];
  if (!prod) return;
  const nombre = document.getElementById("panelProductName")?.value.trim();
  const precio = parseFloat(document.getElementById("panelProductPrice")?.value || "");
  const precioMayoristaInput = document.getElementById("panelProductWholesalePrice")?.value.trim() || "";
  const precioMayorista = parseFloat(precioMayoristaInput);
  if (!nombre || Number.isNaN(precio)) return mostrarMensaje("Completa nombre y precio.");
  prod.nombre = nombre;
  prod.precio = precio;
  prod.descripcion = (document.getElementById("panelProductDescription")?.value || "").trim();
  prod.videoInfoUrl = (document.getElementById("panelProductVideoUrl")?.value || "").trim();
  prod.saleUnitLabel = (document.getElementById("panelProductSaleUnitLabel")?.value || "").trim();
  prod.precioMayorista = !precioMayoristaInput || Number.isNaN(precioMayorista) ? null : precioMayorista;
  recordUserActivity("producto_editado", { producto: prod.nombre });
  cerrarPanelEdicionAdmin();
  guardar();
}

function editarInventarioProducto(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede editar inventario.");
  const prod = catalogos[ci].productos[pi];
  adminEditPanelState = { type: "productInventory", orderId: `${ci}:${pi}` };
  document.getElementById("adminEditPanelTitle").textContent = "Inventario del producto";
  document.getElementById("adminEditPanelNote").textContent = "Puedes activar o quitar el control de cantidad sin cambiar el producto.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Producto<input value="${escapeHtmlAttribute(prod.nombre || "")}" readonly></label>
      <label class="builder-check-row"><span>Controlar cantidad</span><input id="panelProductStockEnabled" type="checkbox" ${prod.controlStock ? "checked" : ""}></label>
      <label>Cantidad disponible<input id="panelProductStock" type="number" min="0" step="1" value="${Number(prod.stock || 0)}"></label>
      <label>Alerta de pocas unidades<input id="panelProductStockAlert" type="number" min="0" step="1" value="${Number(prod.stockAlert || 3)}"></label>
      <div class="modal-actions">
        <button type="button" onclick="guardarInventarioProductoPanel()">Guardar inventario</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cancelar</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function guardarInventarioProductoPanel() {
  const [ci, pi] = String(adminEditPanelState.orderId || "").split(":").map(Number);
  const prod = catalogos[ci]?.productos?.[pi];
  if (!prod) return;
  const activar = Boolean(document.getElementById("panelProductStockEnabled")?.checked);
  const stock = parseInt(document.getElementById("panelProductStock")?.value || "0", 10);
  const alerta = parseInt(document.getElementById("panelProductStockAlert")?.value || "3", 10);
  prod.controlStock = activar;
  prod.stock = activar ? (Number.isNaN(stock) ? Number(prod.stock || 0) : Math.max(0, stock)) : 0;
  prod.stockAlert = activar ? (Number.isNaN(alerta) ? Number(prod.stockAlert || 3) : Math.max(0, alerta)) : 3;
  recordUserActivity("inventario_actualizado", { producto: prod.nombre, controlStock: prod.controlStock, stock: prod.stock });
  cerrarPanelEdicionAdmin();
  guardar();
}

function editarVideoProducto(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede editar videos de producto.");
  const prod = catalogos[ci].productos[pi];
  adminEditPanelState = { type: "productVideo", orderId: `${ci}:${pi}` };
  document.getElementById("adminEditPanelTitle").textContent = "Video del producto";
  document.getElementById("adminEditPanelNote").textContent = "Pega un enlace de YouTube, TikTok, Instagram, Facebook u otra red. Dejalo vacio para quitarlo.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Producto<input value="${escapeHtmlAttribute(prod.nombre || "")}" readonly></label>
      <label>Enlace de video<input id="panelProductOnlyVideoUrl" value="${escapeHtmlAttribute(prod.videoInfoUrl || "")}" placeholder="https://..."></label>
      <div class="modal-actions">
        <button type="button" onclick="guardarVideoProductoPanel()">Guardar video</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cancelar</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function guardarVideoProductoPanel() {
  const [ci, pi] = String(adminEditPanelState.orderId || "").split(":").map(Number);
  const prod = catalogos[ci]?.productos?.[pi];
  if (!prod) return;
  prod.videoInfoUrl = (document.getElementById("panelProductOnlyVideoUrl")?.value || "").trim();
  recordUserActivity("video_producto_actualizado", { producto: prod.nombre, tieneVideo: Boolean(prod.videoInfoUrl) });
  cerrarPanelEdicionAdmin();
  guardar();
}

let cameraProductState = {
  catalogIndex: null,
  stream: null,
  imageData: "",
  expanded: false,
  flashOn: false,
  brightness: 1,
  quality: 0.96,
  zoom: 1,
  zoomCapability: null,
  positionX: 50,
  positionY: 50
};

async function abrirProductoCamara(ci) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede agregar productos con camara.");
  cameraProductState.catalogIndex = ci;
  cameraProductState.imageData = "";
  cameraProductState.expanded = false;
  cameraProductState.flashOn = false;
  cameraProductState.brightness = 1;
  cameraProductState.quality = 0.96;
  cameraProductState.zoom = 1;
  cameraProductState.zoomCapability = null;
  cameraProductState.positionX = 50;
  cameraProductState.positionY = 50;
  ["cameraProductName", "cameraProductDescription", "cameraProductVideoUrl", "cameraProductImageUrl", "cameraProductRetailPrice", "cameraProductWholesalePrice"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  document.getElementById("cameraProductPhotoPreview")?.classList.add("hidden");
  document.getElementById("cameraCropStage")?.classList.remove("is-paused");
  document.getElementById("cameraProductPreview").innerHTML = "";
  document.getElementById("cameraProductModal")?.classList.remove("camera-expanded");
  ["cameraBrightnessRange", "cameraQualityRange", "cameraZoomRange", "cameraPositionXRange", "cameraPositionYRange"].forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.value = id === "cameraQualityRange" ? "0.96" : (id === "cameraBrightnessRange" || id === "cameraZoomRange" ? "1" : "50");
  });
  openModal("cameraProductModal");
  await iniciarCamaraProducto();
}

function actualizarAjustesCamaraProducto() {
  cameraProductState.brightness = Number(document.getElementById("cameraBrightnessRange")?.value || 1);
  cameraProductState.quality = Number(document.getElementById("cameraQualityRange")?.value || 0.96);
  cameraProductState.zoom = Number(document.getElementById("cameraZoomRange")?.value || 1);
  cameraProductState.positionX = Number(document.getElementById("cameraPositionXRange")?.value || 50);
  cameraProductState.positionY = Number(document.getElementById("cameraPositionYRange")?.value || 50);
  const mediaNodes = [document.getElementById("cameraProductVideo"), document.getElementById("cameraProductPhotoPreview")].filter(Boolean);
  const useVisualZoom = !cameraProductState.zoomCapability;
  mediaNodes.forEach((node) => {
    node.style.filter = `brightness(${cameraProductState.brightness})`;
    node.style.objectPosition = `${cameraProductState.positionX}% ${cameraProductState.positionY}%`;
    node.style.transform = node.id === "cameraProductVideo" && !useVisualZoom ? "" : `scale(${cameraProductState.zoom})`;
  });
  aplicarZoomCamaraProducto();
}

async function aplicarZoomCamaraProducto() {
  const track = cameraProductState.stream?.getVideoTracks?.()[0];
  const zoomInfo = cameraProductState.zoomCapability;
  if (!track || !zoomInfo) return;
  const zoomValue = Math.min(zoomInfo.max, Math.max(zoomInfo.min, cameraProductState.zoom));
  try {
    await track.applyConstraints({ advanced: [{ zoom: zoomValue }] });
  } catch {
    cameraProductState.zoomCapability = null;
  }
}

function toggleCamaraProductoAmpliada() {
  cameraProductState.expanded = !cameraProductState.expanded;
  document.getElementById("cameraProductModal")?.classList.toggle("camera-expanded", cameraProductState.expanded);
  const button = document.getElementById("cameraExpandBtn");
  if (button) button.textContent = cameraProductState.expanded ? "Reducir camara" : "Ampliar camara";
  actualizarAjustesCamaraProducto();
}

async function toggleFlashProducto() {
  const track = cameraProductState.stream?.getVideoTracks?.()[0];
  if (!track) return mostrarMensaje("La camara no esta activa.");
  const capabilities = track.getCapabilities?.() || {};
  if (!capabilities.torch) return mostrarMensaje("Este dispositivo o navegador no permite controlar el flash.");
  cameraProductState.flashOn = !cameraProductState.flashOn;
  try {
    await track.applyConstraints({ advanced: [{ torch: cameraProductState.flashOn }] });
    const button = document.getElementById("cameraFlashBtn");
    if (button) button.textContent = cameraProductState.flashOn ? "Apagar flash" : "Flash";
  } catch {
    cameraProductState.flashOn = false;
    mostrarMensaje("No se pudo cambiar el flash en este dispositivo.");
  }
}

async function iniciarCamaraProducto() {
  const video = document.getElementById("cameraProductVideo");
  if (!video) return;
  try {
    if (!readLocalJson(ADMIN_LOCAL_KEYS.cameraPermissionAsked, false)) {
      writeLocalJson(ADMIN_LOCAL_KEYS.cameraPermissionAsked, true);
    }
    cameraProductState.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    video.srcObject = cameraProductState.stream;
    video.classList.remove("hidden");
    document.getElementById("cameraCropStage")?.classList.remove("is-paused");
    const track = cameraProductState.stream.getVideoTracks?.()[0];
    const capabilities = track?.getCapabilities?.() || {};
    const flashBtn = document.getElementById("cameraFlashBtn");
    if (flashBtn) flashBtn.disabled = !capabilities.torch;
    const zoomRange = document.getElementById("cameraZoomRange");
    if (zoomRange && capabilities.zoom) {
      cameraProductState.zoomCapability = {
        min: Number(capabilities.zoom.min || 1),
        max: Number(capabilities.zoom.max || 3),
        step: Number(capabilities.zoom.step || 0.05)
      };
      zoomRange.min = String(cameraProductState.zoomCapability.min);
      zoomRange.max = String(cameraProductState.zoomCapability.max);
      zoomRange.step = String(cameraProductState.zoomCapability.step);
    } else if (zoomRange) {
      cameraProductState.zoomCapability = null;
      zoomRange.min = "1";
      zoomRange.max = "3";
      zoomRange.step = "0.05";
    }
    actualizarAjustesCamaraProducto();
  } catch {
    mostrarMensaje("No se pudo abrir la camara. Revisa permisos del navegador.");
  }
}

function detenerCamaraProducto() {
  if (!cameraProductState.stream) return;
  cameraProductState.stream.getTracks().forEach((track) => track.stop());
  cameraProductState.stream = null;
  cameraProductState.flashOn = false;
  const flashBtn = document.getElementById("cameraFlashBtn");
  if (flashBtn) flashBtn.textContent = "Flash";
}

function capturarFotoProducto() {
  const video = document.getElementById("cameraProductVideo");
  const canvas = document.getElementById("cameraProductCanvas");
  const preview = document.getElementById("cameraProductPhotoPreview");
  if (!video || !canvas || !preview || !video.videoWidth) return mostrarMensaje("La camara aun no esta lista.");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  context.filter = `brightness(${cameraProductState.brightness})`;
  const zoom = cameraProductState.zoomCapability ? 1 : Math.max(1, Number(cameraProductState.zoom || 1));
  const sourceWidth = video.videoWidth / zoom;
  const sourceHeight = video.videoHeight / zoom;
  const maxSourceX = Math.max(0, video.videoWidth - sourceWidth);
  const maxSourceY = Math.max(0, video.videoHeight - sourceHeight);
  const sourceX = maxSourceX * (cameraProductState.positionX / 100);
  const sourceY = maxSourceY * (cameraProductState.positionY / 100);
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  cameraProductState.imageData = canvas.toDataURL("image/jpeg", cameraProductState.quality);
  preview.src = cameraProductState.imageData;
  preview.classList.remove("hidden");
  video.classList.add("hidden");
  document.getElementById("cameraCropStage")?.classList.add("is-paused");
  detenerCamaraProducto();
  renderCameraProductPreview();
}

async function reiniciarCamaraProducto() {
  cameraProductState.imageData = "";
  document.getElementById("cameraProductPhotoPreview")?.classList.add("hidden");
  document.getElementById("cameraCropStage")?.classList.remove("is-paused");
  await iniciarCamaraProducto();
  actualizarAjustesCamaraProducto();
}

function cargarFotoProductoDesdeArchivo(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    cameraProductState.imageData = reader.result;
    const preview = document.getElementById("cameraProductPhotoPreview");
    if (preview) {
      preview.src = cameraProductState.imageData;
      preview.classList.remove("hidden");
    }
    document.getElementById("cameraProductVideo")?.classList.add("hidden");
    document.getElementById("cameraCropStage")?.classList.add("is-paused");
    detenerCamaraProducto();
    actualizarAjustesCamaraProducto();
    renderCameraProductPreview();
    if (event?.target) event.target.value = "";
  };
  reader.readAsDataURL(file);
}

function getCameraProductDraft() {
  const precio = parseFloat(document.getElementById("cameraProductRetailPrice")?.value || "0");
  const precioMayoristaRaw = document.getElementById("cameraProductWholesalePrice")?.value || "";
  const precioMayorista = parseFloat(precioMayoristaRaw);
  return normalizarProducto({
    nombre: document.getElementById("cameraProductName")?.value.trim() || "Nuevo producto",
    descripcion: document.getElementById("cameraProductDescription")?.value.trim() || "",
    videoInfoUrl: document.getElementById("cameraProductVideoUrl")?.value.trim() || "",
    precio: Number.isNaN(precio) ? 0 : precio,
    precioMayorista: precioMayoristaRaw.trim() === "" || Number.isNaN(precioMayorista) ? null : precioMayorista,
    imagen: cameraProductState.imageData || document.getElementById("cameraProductImageUrl")?.value.trim() || null,
    imagenes: [],
    oferta: null,
    activo: true
  });
}

function renderCameraProductPreview() {
  const container = document.getElementById("cameraProductPreview");
  if (!container) return;
  const prod = getCameraProductDraft();
  container.innerHTML = `
    <div class="camera-preview-grid">
      <section>
        <h3>Preview PC</h3>
        <article class="producto camera-preview-desktop">${generarProductoHTML(prod, cameraProductState.catalogIndex || 0, 0)}</article>
      </section>
      <section>
        <h3>Preview Android</h3>
        <article class="producto camera-preview-mobile">${generarProductoHTML(prod, cameraProductState.catalogIndex || 0, 0)}</article>
      </section>
    </div>
  `;
}

function guardarProductoDesdeCamara() {
  if (cameraProductState.catalogIndex === null) return;
  const prod = getCameraProductDraft();
  if (!prod.nombre || !prod.precio) return mostrarMensaje("Completa nombre y precio cliente final.");
  if (!prod.imagen) return mostrarMensaje("Toma una foto antes de guardar.");
  catalogos[cameraProductState.catalogIndex].productos.push(prod);
  recordUserActivity("producto_creado_camara", { producto: prod.nombre });
  guardar();
  cerrarProductoCamara();
}

function cerrarProductoCamara() {
  detenerCamaraProducto();
  closeModal("cameraProductModal");
}

function editarPrecioMayorista(ci, pi) {
  if (!canEditWholesale()) return mostrarMensaje("Activa el modo venta al por mayor para editar este precio.");
  const prod = catalogos[ci].productos[pi];
  adminEditPanelState = { type: "precioMayorista", orderId: `${ci}:${pi}` };
  document.getElementById("adminEditPanelTitle").textContent = "Precio al por mayor";
  document.getElementById("adminEditPanelNote").textContent = "Modifica el precio mayorista desde este panel.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Producto<input value="${escapeHtmlAttribute(prod.nombre)}" readonly></label>
      <label>Precio mayorista<input id="panelWholesalePrice" type="number" step="0.01" value="${Number(prod.precioMayorista ?? prod.precio ?? 0)}"></label>
      <div class="modal-actions"><button type="button" onclick="guardarPrecioMayoristaPanel()">Guardar precio</button></div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function guardarPrecioMayoristaPanel() {
  const [ci, pi] = String(adminEditPanelState.orderId || "").split(":").map(Number);
  const prod = catalogos[ci]?.productos?.[pi];
  if (!prod) return;
  const precioMayorista = parseFloat(document.getElementById("panelWholesalePrice")?.value || "");
  if (Number.isNaN(precioMayorista)) return mostrarMensaje("Precio no valido.");
  prod.precioMayorista = precioMayorista;
  cerrarPanelEdicionAdmin();
  guardar();
}

function eliminarProducto(ci, pi) {
  if (!canEditRetail()) return mostrarMensaje("Tu rol no puede eliminar productos.");
  if (!confirm("Eliminar producto?")) return;
  recordUserActivity("producto_eliminado", { producto: catalogos[ci].productos[pi]?.nombre || "" });
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
  const prod = catalogos[ci].productos[pi];
  adminEditPanelState = { type: "productOffer", orderId: `${ci}:${pi}` };
  document.getElementById("adminEditPanelTitle").textContent = "Oferta del producto";
  document.getElementById("adminEditPanelNote").textContent = "Define el precio anterior y el nuevo precio de oferta.";
  document.getElementById("adminEditPanelBody").innerHTML = `
    <div class="builder-form">
      <label>Producto<input value="${escapeHtmlAttribute(prod.nombre || "")}" readonly></label>
      <label>Precio anterior<input id="panelOfferOldPrice" type="number" step="0.01" value="${Number(prod.oferta?.antes || prod.precio || 0)}"></label>
      <label>Precio oferta<input id="panelOfferNewPrice" type="number" step="0.01" value="${Number(prod.oferta?.ahora || prod.precio || 0)}"></label>
      <div class="modal-actions">
        <button type="button" onclick="guardarOfertaProductoPanel()">Guardar oferta</button>
        <button type="button" class="ghost-btn" onclick="cerrarPanelEdicionAdmin()">Cancelar</button>
      </div>
    </div>
  `;
  openModal("adminEditPanelModal");
}

function guardarOfertaProductoPanel() {
  const [ci, pi] = String(adminEditPanelState.orderId || "").split(":").map(Number);
  const prod = catalogos[ci]?.productos?.[pi];
  if (!prod) return;
  const antes = parseFloat(document.getElementById("panelOfferOldPrice")?.value || "");
  const ahora = parseFloat(document.getElementById("panelOfferNewPrice")?.value || "");
  if (Number.isNaN(antes) || Number.isNaN(ahora) || ahora >= antes) return mostrarMensaje("La oferta debe ser menor que el precio anterior.");
  prod.oferta = { antes, ahora };
  cerrarPanelEdicionAdmin();
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
  const prod = buscarProducto(carrito[index].nombre);
  if (prod && !canSellQuantity(prod, carrito[index].cantidad + 1)) return mostrarMensaje(`Solo quedan ${prod.stock} unidad(es) disponibles.`);
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
  const prod = buscarProducto(carrito[index].nombre);
  if (prod && !canSellQuantity(prod, amount)) return mostrarMensaje(`Solo quedan ${prod.stock} unidad(es) disponibles.`);
  carrito[index].cantidad = amount;
  await syncCarritoProducto(carrito[index].nombre, amount);
  actualizarContadorCarrito();
  abrirCarrito();
}

function pedirUbicacionActualPedido() {
  return new Promise((resolve) => {
    const existing = document.getElementById("deliveryLocationPrompt");
    if (existing) existing.remove();
    const promptBox = document.createElement("div");
    promptBox.id = "deliveryLocationPrompt";
    promptBox.className = "modal";
    promptBox.style.display = "flex";
    promptBox.innerHTML = `
      <div class="modal-content">
        <h2>Ubicacion de envio</h2>
        <p class="modal-note">Toca el boton para compartir tu ubicacion actual por Google Maps o escribe la direccion manualmente.</p>
        <div class="modal-actions">
          <button type="button" id="shareDeliveryLocationBtn">Compartir ubicacion actual</button>
          <button type="button" id="manualDeliveryLocationBtn" class="ghost-btn">Escribir direccion</button>
          <button type="button" id="cancelDeliveryLocationBtn" class="ghost-btn">Cancelar</button>
        </div>
        <p id="deliveryLocationStatus" class="modal-note"></p>
      </div>
    `;
    document.body.appendChild(promptBox);

    const finish = (value = "") => {
      promptBox.remove();
      resolve(value);
    };
    const status = promptBox.querySelector("#deliveryLocationStatus");
    const getMapsLink = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    };
    const requestLocation = () => {
      status.textContent = "Solicitando permiso de ubicacion...";
      navigator.geolocation.getCurrentPosition(
        (position) => finish(getMapsLink(position)),
        (error) => {
          status.textContent = error?.code === error?.POSITION_UNAVAILABLE
            ? "No se detecta la ubicacion del dispositivo. Activa la ubicacion/GPS del telefono y vuelve a intentar."
            : "Intentando obtener ubicacion actual...";
          let watchId = null;
          const cleanup = () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          };
          const timeoutId = setTimeout(() => {
            cleanup();
            status.textContent = "No se pudo obtener la ubicacion. Revisa permisos del navegador o escribe la direccion manualmente.";
          }, 15000);
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              clearTimeout(timeoutId);
              cleanup();
              finish(getMapsLink(position));
            },
            (watchError) => {
              clearTimeout(timeoutId);
              cleanup();
              status.textContent = watchError?.code === watchError?.POSITION_UNAVAILABLE
                ? "La ubicacion del dispositivo parece estar apagada. Activa Ubicacion/GPS y vuelve a tocar Compartir ubicacion actual."
                : "El permiso fue bloqueado o cancelado. Activa Ubicacion para este sitio en el navegador o escribe la direccion manualmente.";
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };
    promptBox.querySelector("#shareDeliveryLocationBtn")?.addEventListener("click", () => {
      if (!window.isSecureContext) {
        status.textContent = "El navegador solo muestra el permiso de ubicacion en paginas HTTPS. Publicada en GitHub Pages o dominio con HTTPS si funcionara.";
        return;
      }
      if (!navigator.geolocation) {
        status.textContent = "Este dispositivo no permite compartir ubicacion desde el navegador.";
        return;
      }
      if (navigator.permissions?.query) {
        navigator.permissions.query({ name: "geolocation" }).then((permission) => {
          if (permission.state === "denied") {
            status.textContent = "La ubicacion esta bloqueada para esta pagina. Activa la ubicacion/GPS del telefono y en el navegador cambia Ubicacion a Permitir para este sitio.";
            return;
          }
          requestLocation();
        }).catch(requestLocation);
        return;
      }
      requestLocation();
    });
    promptBox.querySelector("#manualDeliveryLocationBtn")?.addEventListener("click", () => {
      finish(prompt(siteSettings.deliveryLocationLabel || "Ubicacion para envio:", "") || "");
    });
    promptBox.querySelector("#cancelDeliveryLocationBtn")?.addEventListener("click", () => finish(""));
  });
}

async function enviarPedido() {
  if (!carrito.length) return mostrarMensaje("Carrito vacio.");
  const unavailable = carrito.find((item) => {
    const product = buscarProducto(item.nombre);
    return product && !canSellQuantity(product, item.cantidad);
  });
  if (unavailable) {
    const product = buscarProducto(unavailable.nombre);
    return mostrarMensaje(`La cantidad de ${unavailable.nombre} supera el limite actual. Solo quedan ${Number(product?.stock || 0)} unidad(es).`);
  }
  let total = 0;
  let gananciaTotal = 0;
  const productosPedido = carrito.map(buildOrderLineStats);
  const directDelivery = confirm(siteSettings.deliveryQuestionText || "Este pedido es para envio directo?");
  let deliveryLocation = "";
  if (directDelivery) {
    deliveryLocation = await pedirUbicacionActualPedido();
    if (!deliveryLocation) {
      mostrarMensaje("Puedes continuar sin ubicacion o escribirla manualmente en el mensaje.");
      deliveryLocation = prompt(siteSettings.deliveryLocationLabel || "Ubicacion para envio:", "") || "";
    }
  }
  let mensaje = `${siteSettings.orderWhatsappMessageTemplate || "Hola, quiero hacer este pedido:"}\n`;
  mensaje += usuarioActual ? `Cliente: ${usuarioActual.username}\n` : "Cliente: Invitado\n";
  if (usuarioActual?.telefono) mensaje += `Telefono: ${usuarioActual.telefono}\n`;
  if (directDelivery) mensaje += `Envio directo: Si\n${siteSettings.deliveryLocationLabel || "Ubicacion"}: ${deliveryLocation || "No especificada"}\n`;
  mensaje += `Tienda: ${siteSettings.logoText || activeTenantConfig.clientName}\n\n`;
  productosPedido.forEach((item) => {
    const subtotal = item.subtotal;
    total += subtotal;
    gananciaTotal += item.gananciaTotal;
    const modeLabel = item.pricingMode === "wholesale" ? " (mayorista)" : "";
    const unitLabel = item.saleUnitLabel ? ` (${item.saleUnitLabel})` : "";
    mensaje += `${item.nombre}${unitLabel}${modeLabel} x${item.cantidad} - $${subtotal}\n`;
    if (item.notaPedido) mensaje += `Nota: ${item.notaPedido}\n`;
  });
  mensaje += `\nTotal: $${total}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, "_blank");
  guardarPedidoHistorial(total, productosPedido, gananciaTotal, false);
  recordUserActivity("pedido_enviado", { total, gananciaTotal, productos: productosPedido.length });
}

async function guardarPedidoHistorial(total, productosPedido = carrito.map(buildOrderLineStats), gananciaTotal = 0, inventoryApplied = false) {
  const userMeta = getUserContactMeta(usuarioActual);
  const pedidoLocal = {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    usuario_id: usuarioActual?.id || "guest",
    username: usuarioActual?.username || "Invitado",
    email: usuarioActual?.email || usuarioActual?.correo || userMeta.email || "",
    correo: usuarioActual?.correo || usuarioActual?.email || userMeta.email || "",
    telefono: usuarioActual?.telefono || userMeta.telefono || "",
    productos: productosPedido,
    total,
    gananciaTotal,
    status: "pendiente",
    inventoryApplied,
    fecha: new Date().toISOString()
  };
  pedidoLocal.sourceSignature = `${pedidoLocal.usuario_id}_${pedidoLocal.fecha}_${pedidoLocal.total}`;
  const orders = readLocalJson(ADMIN_LOCAL_KEYS.orders, []);
  orders.unshift(pedidoLocal);
  writeLocalJson(ADMIN_LOCAL_KEYS.orders, orders.slice(0, 500));
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) return;
  await guardarPedidoRemotoConContacto(pedidoLocal);
}

async function guardarPedidoRemotoConContacto(pedido = {}) {
  const variants = [
    {
      usuario_id: pedido.usuario_id,
      username: pedido.username,
      email: pedido.email,
      correo: pedido.correo,
      telefono: pedido.telefono,
      productos: pedido.productos,
      total: pedido.total,
      gananciaTotal: pedido.gananciaTotal,
      status: pedido.status,
      inventoryApplied: pedido.inventoryApplied,
      fecha: pedido.fecha
    },
    {
      usuario_id: pedido.usuario_id,
      username: pedido.username,
      telefono: pedido.telefono,
      productos: pedido.productos,
      total: pedido.total,
      fecha: pedido.fecha
    },
    {
      usuario_id: pedido.usuario_id,
      productos: pedido.productos,
      total: pedido.total,
      fecha: pedido.fecha
    }
  ];
  for (const payload of variants) {
    const { error } = await supabaseClient.from(TABLES.pedidos).insert([payload]);
    if (!error) return true;
  }
  return false;
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
  await supabaseClient.from(TABLES.favoritos).delete().eq("usuario_id", usuarioActual.id).eq("producto_id", prod.nombre);
  abrirFavoritos();
}

function buildRoleOptions(selectedRole = "administrador") {
  const roles = [
    ["administrador", "Administrador"],
    ["vendedor", "Vendedor"],
    ["mayorista", "Mayorista"],
    ...(accessState.customRoles || []).map((role) => [role.id, role.label])
  ];
  return roles.map(([value, label]) => (
    `<option value="${escapeHtmlAttribute(value)}" ${selectedRole === value ? "selected" : ""}>${escapeHtmlAttribute(label)}</option>`
  )).join("");
}

function buildRolePermissionEditor(roleKey = "", prefix = "rolePerm") {
  const permissions = accessState.rolePermissions?.[roleKey] || defaultRolePermissions.cliente;
  return Object.entries(ROLE_PERMISSION_LABELS).map(([key, label]) => `
    <label class="builder-check-row">
      <span>${escapeHtmlAttribute(label)}</span>
      <input type="checkbox" data-role-permission="${escapeHtmlAttribute(roleKey)}" data-permission-key="${escapeHtmlAttribute(key)}" ${permissions[key] ? "checked" : ""}>
    </label>
  `).join("");
}

function buildBossPermissionListMarkup() {
  const roles = [
    ["administrador", "Administrador"],
    ["vendedor", "Vendedor"],
    ["mayorista", "Mayorista"],
    ...(accessState.customRoles || []).map((role) => [role.id, role.label])
  ];
  return roles.map(([key, label]) => `
    <details class="role-permission-card">
      <summary>
        <span>${escapeHtmlAttribute(label)}</span>
        ${defaultRolePermissions[key] ? "" : `<button type="button" class="danger-btn" onclick="eliminarRolPersonalizadoBoss('${escapeHtmlAttribute(key)}')">Eliminar rol</button>`}
      </summary>
      <div class="boss-grid">${buildRolePermissionEditor(key)}</div>
    </details>
  `).join("");
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
        <label>Nueva contrasena admin compartida<input id="bossAdminPass" placeholder="Escribe una nueva contrasena"></label>
        <label>Nueva contrasena venta al por mayor<input id="bossWholesalePass" placeholder="Escribe una nueva contrasena"></label>
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
      <summary>Roles y permisos</summary>
      <div class="accordion-body boss-grid">
        <label>Nombre del nuevo rol<input id="bossCustomRoleName" placeholder="Ejemplo: Supervisor"></label>
        <button type="button" onclick="crearRolPersonalizadoBoss()">Agregar rol</button>
        <div class="boss-permission-list">${buildBossPermissionListMarkup()}</div>
        <button type="button" onclick="guardarPermisosRolesBoss()">Guardar permisos</button>
      </div>
    </details>
    <details class="accordion-card">
      <summary>Cuenta Boss</summary>
      <div class="accordion-body boss-grid">
        <label>Telefono de verificacion
          <div class="phone-register-grid">
            <select id="bossPhoneCountry"></select>
            <input id="bossPhone" value="${escapeHtmlAttribute(accessState.bossCredentials.phone || accessState.bossCredentials.verifiedPhone || "")}" placeholder="8090000000">
          </div>
        </label>
        <div class="builder-action-row">
          <button type="button" onclick="enviarVerificacionBoss()">Enviar codigo</button>
          <button type="button" class="ghost-btn" onclick="mostrarEstadoVerificacionBoss()">Estado</button>
        </div>
        <label>Codigo recibido<input id="bossOtpCode" placeholder="Codigo recibido"></label>
        <button type="button" onclick="verificarCodigoBoss()">Verificar telefono</button>
        <div id="bossPhoneVerifyStatus" class="builder-help-copy"></div>
        <p id="bossCurrentPasswordStatus" class="builder-help-copy">La contrasena actual esta protegida por hash.</p>
        <button type="button" class="ghost-btn" onclick="verContrasenaBossActual()">Ver contrasena actual</button>
        <label>Usuario boss<input id="bossUsernameField" value="${accessState.bossCredentials.username}"></label>
        <label>Nueva contrasena boss<input id="bossPasswordField" placeholder="Escribe una nueva contrasena"></label>
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
  if (role === "boss") {
    populatePhoneCountrySelect("bossPhoneCountry");
    setPhoneVerifyStatus("bossPhoneVerifyStatus", accessState.bossCredentials.verifiedPhone ? `Telefono verificado: ${accessState.bossCredentials.verifiedPhone}` : "Verifica el telefono para cambiar la cuenta boss.");
  }
  removeBtn.classList.toggle("hidden", role === "boss");
  if (profileName) profileName.readOnly = role === "boss";
  if (currentPass) currentPass.disabled = role === "boss";
  if (newPass) newPass.disabled = role === "boss";
  if (confirmPass) confirmPass.disabled = role === "boss";
}

function abrirPerfil() {
  if (!usuarioActual) return mostrarMensaje("Debes iniciar sesion.");
  document.getElementById("perfilNombre").value = usuarioActual.username || "";
  populatePhoneCountrySelect("perfilPhoneCountry");
  document.getElementById("perfilTelefono").value = getUserContactMeta(usuarioActual).telefono || usuarioActual.telefono || "";
  phoneVerificationState.profile = { phone: document.getElementById("perfilTelefono").value || "", code: "", verified: Boolean(document.getElementById("perfilTelefono").value) };
  setPhoneVerifyStatus("profilePhoneVerifyStatus", document.getElementById("perfilTelefono").value ? `Telefono actual: ${document.getElementById("perfilTelefono").value}` : "Puedes actualizar y verificar tu telefono.");
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
  if (usuarioActual.syntheticBoss || isStoredHashedPassword(usuarioActual.password || "")) {
    span.textContent = span.textContent === "*****" ? "Protegida por hash. No se puede leer." : "*****";
    return;
  }
  span.textContent = span.textContent === "*****" ? usuarioActual.password : "*****";
}

function cerrarPerfil() { closeModal("perfilModal"); }

async function guardarPerfil() {
  if (!usuarioActual) return;
  const nombre = document.getElementById("perfilNombre").value.trim();
  const telefonoPerfil = buildPhoneFromInputs("perfilPhoneCountry", "perfilTelefono");
  const telefonoActual = getUserContactMeta(usuarioActual).telefono || usuarioActual.telefono || "";
  const passActual = document.getElementById("perfilPassActual").value;
  const passNueva = document.getElementById("perfilPassNueva").value;
  const passConfirm = document.getElementById("perfilPassConfirmar").value;
  const previousUsername = usuarioActual.username;
  if (!nombre) return mostrarMensaje("El nombre no puede estar vacio.");
  if (telefonoPerfil && telefonoPerfil !== telefonoActual && (!phoneVerificationState.profile.verified || phoneVerificationState.profile.phone !== telefonoPerfil)) {
    return mostrarMensaje("Confirma el codigo del nuevo telefono antes de guardar.");
  }
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
      password: "sha256:protected",
      foto: accessState.bossCredentials.photo,
      telefono: telefonoPerfil || telefonoActual,
      telefonoVerificado: Boolean(telefonoPerfil || telefonoActual),
      syntheticBoss: true,
      role: "boss"
    });
    saveUserContactMeta(usuarioActual, { telefono: telefonoPerfil || telefonoActual });
    syncAccessState(accessState);
    builderHooks.persistAll();
    actualizarUsuarioUI();
    cerrarPerfil();
    if (nombre !== accessState.bossCredentials.username || passNueva || passActual || passConfirm) {
      mostrarMensaje("La foto del boss se guardo. Para cambiar usuario o contrasena usa la seccion 'Cuenta Boss' con verificacion por telefono.");
      return;
    }
    return;
  }

  if (!usuarioActual?.id) return;
  if (passNueva && !(await verifyStoredPassword(passActual, usuarioActual.password || ""))) {
    return mostrarMensaje("Contrasena actual incorrecta.");
  }

  const updateData = { username: nombre, telefono: telefonoPerfil || telefonoActual };
  const fotoFile = document.getElementById("perfilFoto").files[0];
  if (fotoFile) updateData.foto = await subirArchivoABucket("perfil", `perfil_${usuarioActual.id}`, fotoFile);
  if (passNueva) updateData.password = await buildStoredPassword(passNueva);

  let { error } = await supabaseClient.from(TABLES.usuarios).update(updateData).eq("id", usuarioActual.id);
  if (error && updateData.telefono) {
    const fallbackUpdate = { ...updateData };
    delete fallbackUpdate.telefono;
    const retry = await supabaseClient.from(TABLES.usuarios).update(fallbackUpdate).eq("id", usuarioActual.id);
    error = retry.error;
  }
  if (error) return mostrarMensaje("No se pudo actualizar el perfil.");
  const { data } = await supabaseClient.from(TABLES.usuarios).select("*").eq("id", usuarioActual.id).single();
  const roleAssignment = accessState.roleAssignments.find((item) =>
    String(item.userId ?? "") === String(data.id) ||
    String(item.username || "").trim().toLowerCase() === String(previousUsername || "").trim().toLowerCase()
  );
  if (roleAssignment) {
    roleAssignment.userId = data.id;
    roleAssignment.username = data.username;
  }
  if (adminSession.active && adminSession.source === "user" && adminSession.username === previousUsername) {
    adminSession.username = data.username;
  }
  usuarioActual = { ...data, telefono: telefonoPerfil || telefonoActual, role: getAssignedRole(data) };
  await actualizarContactoUsuarioRemoto(usuarioActual, { telefono: telefonoPerfil || telefonoActual });
  localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
  saveUserContactMeta(usuarioActual, { telefono: telefonoPerfil || telefonoActual });
  syncAccessState(accessState);
  builderHooks.persistAll();
  actualizarUsuarioUI();
  cerrarPerfil();
}

async function eliminarCuenta() {
  if (!usuarioActual?.id || usuarioActual.syntheticBoss) return;
  const deletingUserId = usuarioActual.id;
  const pass = prompt("Escribe tu contrasena para eliminar la cuenta:");
  if (!(await verifyStoredPassword(pass || "", usuarioActual.password || ""))) return mostrarMensaje("Contrasena incorrecta.");
  if (!confirm("Esta accion eliminara tu cuenta. Deseas continuar?")) return;
  await supabaseClient.from(TABLES.carrito).delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from(TABLES.favoritos).delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from(TABLES.pedidos).delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from(TABLES.usuarios).delete().eq("id", usuarioActual.id);
  accessState.roleAssignments = accessState.roleAssignments.filter((item) =>
    String(item.userId ?? "") !== String(usuarioActual.id) &&
    String(item.username || "").trim().toLowerCase() !== String(usuarioActual.username || "").trim().toLowerCase()
  );
  syncAccessState(accessState);
  builderHooks.persistAll();
  clearStoredUserCartPricing(deletingUserId);
  cerrarSesion();
  cerrarPerfil();
}

async function abrirHistorial() {
  if (!usuarioActual?.id) return mostrarMensaje("Este historial solo esta disponible para cuentas registradas.");
  const lista = document.getElementById("historialLista");
  if (!lista) return;
  lista.innerHTML = "";
  let data = [];
  if (!usuarioActual.syntheticBoss) {
    try {
      const result = await supabaseClient.from(TABLES.pedidos).select("*").eq("usuario_id", usuarioActual.id).order("fecha", { ascending: false });
      data = Array.isArray(result?.data) ? result.data : [];
    } catch {
      data = [];
    }
  }
  const localOrders = readLocalJson(ADMIN_LOCAL_KEYS.orders, [])
    .filter((pedido) => String(pedido.usuario_id) === String(usuarioActual.id));
  const byId = new Map();
  [...data, ...localOrders].forEach((pedido) => {
    byId.set(buildOrderSignature(pedido), pedido);
  });
  const pedidos = [...byId.values()].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  pedidos.forEach((pedido) => {
    const div = document.createElement("div");
    div.className = "historial-item";
    const productos = Array.isArray(pedido.productos) ? pedido.productos.map((item) => `${item.nombre} x${item.cantidad}`).join(", ") : "Sin detalle";
    const pedidoId = buildOrderSignature(pedido);
    div.innerHTML = `
      <div class="historial-head">
        <strong>Total: $${pedido.total}</strong>
        <button type="button" class="danger-btn" onclick="eliminarHistorial('${escapeHtmlAttribute(pedidoId)}')">Eliminar</button>
      </div>
      <p>${productos}</p>
      <small>${new Date(pedido.fecha).toLocaleString()}</small>
    `;
    lista.appendChild(div);
  });
  if (!pedidos.length) {
    lista.innerHTML = `<div class="historial-item">Aun no tienes pedidos registrados.</div>`;
  }
  openModal("historialModal");
}

async function eliminarHistorial(id) {
  const localOrders = readLocalJson(ADMIN_LOCAL_KEYS.orders, [])
    .filter((pedido) => buildOrderSignature(pedido) !== id && String(pedido.id || "") !== String(id));
  writeLocalJson(ADMIN_LOCAL_KEYS.orders, localOrders);
  if (!usuarioActual?.syntheticBoss) {
    await supabaseClient.from(TABLES.pedidos).delete().eq("id", id);
  }
  abrirHistorial();
}

function cerrarHistorial() { closeModal("historialModal"); }

async function asignarEtiquetaUsuario() {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede asignar etiquetas.");
  const username = document.getElementById("bossRoleUsername")?.value.trim();
  const password = document.getElementById("bossRolePassword")?.value;
  const role = document.getElementById("bossRoleSelect")?.value;
  if (!username || !password || !role) return mostrarMensaje("Completa usuario, contrasena y etiqueta.");
  const result = await autenticarUsuarioPorPassword(username, password);
  if (!result.data) return mostrarMensaje("No se pudo verificar ese usuario con esa contrasena.");
  const existing = accessState.roleAssignments.find((item) => String(item.userId ?? "") === String(result.data.id));
  if (existing) {
    existing.userId = result.data.id;
    existing.username = result.data.username;
    existing.role = role;
  } else {
    accessState.roleAssignments.push({ userId: result.data.id, username: result.data.username, role });
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
  accessState.roleAssignments = accessState.roleAssignments.filter((item) => String(item.username || "").toLowerCase() !== String(username || "").toLowerCase());
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

function crearRolPersonalizadoBoss() {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede crear roles.");
  const label = document.getElementById("bossCustomRoleName")?.value.trim();
  const id = normalizarTexto(label);
  if (!label || !id) return mostrarMensaje("Escribe un nombre valido para el rol.");
  if (defaultRolePermissions[id] || accessState.customRoles?.some((role) => role.id === id)) {
    return mostrarMensaje("Ya existe un rol con ese nombre.");
  }
  accessState.customRoles = [...(accessState.customRoles || []), { id, label }];
  accessState.rolePermissions = {
    ...(accessState.rolePermissions || {}),
    [id]: { ...defaultRolePermissions.cliente, adminAccess: true }
  };
  accessState.roleDisplay = {
    ...(accessState.roleDisplay || {}),
    [id]: { emoji: "\u25CF", background: "linear-gradient(135deg,#64748b,#334155)", color: "#ffffff" }
  };
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
}

function eliminarRolPersonalizadoBoss(roleId = "") {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede eliminar roles.");
  if (!roleId || defaultRolePermissions[roleId]) return mostrarMensaje("Los roles base no se pueden eliminar.");
  const role = (accessState.customRoles || []).find((item) => item.id === roleId);
  if (!role) return mostrarMensaje("No se encontro ese rol.");
  if (!confirm(`Eliminar el rol ${role.label}? Los usuarios con esa etiqueta volveran a cliente.`)) return;
  accessState.customRoles = (accessState.customRoles || []).filter((item) => item.id !== roleId);
  accessState.roleAssignments = (accessState.roleAssignments || []).filter((item) => item.role !== roleId);
  delete accessState.rolePermissions?.[roleId];
  delete accessState.roleDisplay?.[roleId];
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
  mostrarMensaje("Rol eliminado.");
}

function guardarPermisosRolesBoss() {
  if (!canManageTeam()) return mostrarMensaje("Solo el boss puede cambiar permisos.");
  document.querySelectorAll("#bossProfileTools [data-role-permission]").forEach((field) => {
    const role = field.dataset.rolePermission;
    const key = field.dataset.permissionKey;
    accessState.rolePermissions[role] = accessState.rolePermissions[role] || { ...defaultRolePermissions.cliente };
    accessState.rolePermissions[role][key] = field.checked;
  });
  syncAccessState(accessState);
  builderHooks.persistAll();
  renderProfileModal();
  mostrarMensaje("Permisos guardados.");
}

async function guardarCredencialesInternas() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede cambiar estas credenciales.");
  const adminUsername = document.getElementById("bossAdminUser")?.value.trim();
  const adminPassword = document.getElementById("bossAdminPass")?.value.trim();
  const wholesalePassword = document.getElementById("bossWholesalePass")?.value.trim();
  if (!adminUsername) return mostrarMensaje("Completa el usuario admin.");
  if (!adminPassword || !wholesalePassword) return mostrarMensaje("Debes escribir nuevas contrasenas para guardar.");
  accessState.adminCredentials.username = adminUsername;
  accessState.adminCredentials.passwordHash = await hashPlainText(adminPassword);
  accessState.wholesaleCredentials.passwordHash = await hashPlainText(wholesalePassword);
  syncAccessState(accessState);
  builderHooks.persistAll();
  mostrarMensaje("Credenciales internas guardadas.");
}

function bossVerificationStillValid() {
  if (!accessState.bossCredentials.verifiedAt || !accessState.bossCredentials.verifiedPhone) return false;
  const diff = Date.now() - new Date(accessState.bossCredentials.verifiedAt).getTime();
  return diff < 1000 * 60 * 15;
}

function getBossVerificationTargetPhone() {
  return accessState.bossCredentials.verifiedPhone || buildPhoneFromInputs("bossPhoneCountry", "bossPhone");
}

async function enviarVerificacionBoss() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede verificar este telefono.");
  const phone = getBossVerificationTargetPhone();
  if (!phone) return mostrarMensaje("Completa el telefono de verificacion.");
  const code = generatePhoneVerificationCode();
  phoneVerificationState.boss = { phone, code, verified: false };
  accessState.bossCredentials.phone = accessState.bossCredentials.phone || phone;
  builderHooks.persistAll();
  const waPhone = phone.replace(/[^\d]/g, "");
  const text = `Tu codigo de verificacion Boss de ${siteSettings.logoText || activeTenantConfig.clientName} es: ${code}`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, "_blank");
  setPhoneVerifyStatus("bossPhoneVerifyStatus", `Codigo enviado por WhatsApp a ${phone}.`);
}

async function verificarCodigoBoss() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede verificar este telefono.");
  const phone = getBossVerificationTargetPhone();
  const token = document.getElementById("bossOtpCode")?.value.trim();
  if (!phone || !token) return mostrarMensaje("Completa telefono y codigo.");
  if (phoneVerificationState.boss?.phone !== phone || phoneVerificationState.boss?.code !== token) {
    return mostrarMensaje("Codigo incorrecto.");
  }
  phoneVerificationState.boss.verified = true;
  accessState.bossCredentials.phone = phone;
  accessState.bossCredentials.verifiedPhone = phone;
  accessState.bossCredentials.verifiedAt = new Date().toISOString();
  accessState.bossCredentials.verifiedEmail = "";
  builderHooks.persistAll();
  setPhoneVerifyStatus("bossPhoneVerifyStatus", `Telefono verificado: ${phone}`);
  mostrarMensaje("Telefono verificado. Ahora puedes cambiar la cuenta boss.");
}

function mostrarEstadoVerificacionBoss() {
  if (bossVerificationStillValid()) {
    mostrarMensaje(`Telefono verificado: ${accessState.bossCredentials.verifiedPhone}`);
    return;
  }
  mostrarMensaje("No hay una verificacion activa o ya vencio.");
}

function verContrasenaBossActual() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede consultar esta cuenta.");
  if (!bossVerificationStillValid()) return mostrarMensaje("Primero verifica el telefono del boss.");
  const status = document.getElementById("bossCurrentPasswordStatus");
  if (status) status.textContent = "La contrasena actual no se puede leer porque esta guardada protegida por hash. Puedes escribir una nueva y guardarla con esta verificacion.";
}

async function guardarCuentaBoss() {
  if (!canManageInternalCredentials()) return mostrarMensaje("Solo el boss puede cambiar esta cuenta.");
  if (!bossVerificationStillValid()) return mostrarMensaje("Primero verifica el telefono del boss.");
  const username = document.getElementById("bossUsernameField")?.value.trim();
  const password = document.getElementById("bossPasswordField")?.value.trim();
  const phone = buildPhoneFromInputs("bossPhoneCountry", "bossPhone");
  if (!username || !phone) return mostrarMensaje("Completa usuario y telefono.");
  if (!password) return mostrarMensaje("Escribe una nueva contrasena boss para guardarla.");
  accessState.bossCredentials.username = username;
  accessState.bossCredentials.passwordHash = await hashPlainText(password);
  accessState.bossCredentials.phone = phone;
  accessState.bossCredentials.verifiedPhone = phone;
  syncAccessState(accessState);
  builderHooks.persistAll();
  if (usuarioActual?.syntheticBoss) {
    setUsuarioActualData({
      ...usuarioActual,
      username,
      password: "sha256:protected",
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
  initCookieConsentBanner();
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
  document.getElementById("imgProductVideoBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    abrirVideoProducto(videoProductoActual);
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
    syncStickyOffsets();
    ajustarSliderPrincipalFullBleed();
  });
  window.visualViewport?.addEventListener("resize", ajustarSliderPrincipalFullBleed);
  bindCustomFileInput("regFoto", "regFotoTrigger", "regFotoName", "Opcional");
  bindCustomFileInput("perfilFoto", "perfilFotoTrigger", "perfilFotoName", "Sin cambios");
  populatePhoneCountrySelect("regPhoneCountry");
  populatePhoneCountrySelect("perfilPhoneCountry");
  document.getElementById("phoneVerifyBox")?.classList.remove("hidden");
  document.getElementById("profilePhoneVerifyBox")?.classList.remove("hidden");
  const phoneCountry = document.getElementById("regPhoneCountry");
  const phoneInput = document.getElementById("regPhone");
  if (phoneCountry && phoneInput) {
    const updatePhonePlaceholder = () => {
      const selected = phoneCountry.options[phoneCountry.selectedIndex];
      phoneInput.placeholder = `${selected?.dataset?.flag || ""} ${phoneCountry.value} telefono`;
      phoneVerificationState.register = { phone: "", code: "", verified: false };
      setPhoneVerifyStatus("phoneVerifyStatus", "Telefono obligatorio. Confirma el codigo antes de registrarte.");
    };
    phoneCountry.addEventListener("change", updatePhonePlaceholder);
    phoneInput.addEventListener("input", () => {
      phoneVerificationState.register = { phone: "", code: "", verified: false };
      setPhoneVerifyStatus("phoneVerifyStatus", "Telefono obligatorio. Confirma el codigo antes de registrarte.");
    });
    updatePhonePlaceholder();
  }
  const profileCountry = document.getElementById("perfilPhoneCountry");
  const profilePhone = document.getElementById("perfilTelefono");
  if (profileCountry && profilePhone) {
    const updateProfilePhonePlaceholder = () => {
      const selected = profileCountry.options[profileCountry.selectedIndex];
      profilePhone.placeholder = `${selected?.dataset?.flag || ""} ${profileCountry.value} telefono`;
    };
    profileCountry.addEventListener("change", updateProfilePhonePlaceholder);
    profilePhone.addEventListener("input", () => {
      phoneVerificationState.profile = { phone: "", code: "", verified: false };
      setPhoneVerifyStatus("profilePhoneVerifyStatus", "Confirma el codigo del telefono antes de guardar cambios.");
    });
    updateProfilePhonePlaceholder();
  }
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
    registerAccountSession(usuarioActual);
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
  applyFastModePreference();
  renderBranding();
  renderHero();
  render();
  renderSlider();
  syncStickyOffsets();
  optimizeRenderedMedia();
  startPerformanceOptimizations();

  try {
    supabaseClient.channel("usuarios_changes").on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: TABLES.usuarios
    }, (payload) => {
      const assignment = accessState.roleAssignments.find((item) =>
        String(item.userId ?? "") === String(payload.new.id) ||
        String(item.username || "").trim().toLowerCase() === String(payload.old?.username || "").trim().toLowerCase()
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
