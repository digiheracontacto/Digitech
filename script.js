const adminUser = "admin";
const adminPassValue = "1234";
let isAdmin = false;

const defaultData = [
  {
    nombre: "Celulares",
    productos: [
      { nombre: "Samsung A15", precio: 180, descripcion: "128GB 4GB RAM", imagen: null, imagenes: [], oferta: null, activo: true },
      { nombre: "Redmi 13C", precio: 150, descripcion: "128GB 6GB RAM", imagen: null, imagenes: [], oferta: null, activo: true }
    ]
  }
];

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
  pageBackgroundImagePosition: "center center",
  pageBackgroundImageOpacity: 1,
  pageBackgroundImageBrightness: 1,
  pageBackgroundOverlayOpacity: 0.32,
  heroPosition: "top",
  sliderPosition: "top",
  productShadowColor: "rgba(2,8,23,.42)",
  productHoverShadowColor: "rgba(56,189,248,.25)",
  productHoverLift: 6,
  productHoverScale: 1.01,
  productHoverDuration: 0.28,
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

let catalogos = JSON.parse(localStorage.getItem("catalogos")) || defaultData;
let catalogosRowId = null;
let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];
let slidesRowId = null;
let slideIndex = 0;
let sliderInterval = null;
let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;
let carrito = [];
let favoritos = [];
let imagenesProducto = [];
let indiceImagenActual = 0;
let siteSettings = { ...defaultSiteSettings };

const builderHooks = {
  render: () => {},
  refreshFeatured: () => {},
  setAdmin: () => {},
  syncSettings: () => {},
  persistAll: () => {},
  openPageSettings: () => {},
  openHeroEditor: () => {}
};

function normalizarTexto(texto = "") {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
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

function setUsuarioActualData(data) {
  if (!data) return;
  usuarioActual = data;
  localStorage.setItem("usuarioActual", JSON.stringify(data));
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
  applySpecialSectionLayout();
}

window.syncSiteSettings = syncSiteSettings;

async function comprimirImagen(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1400;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.84);
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
  await supabaseClient.storage.from(bucket).upload(fileName, finalFile, { upsert: true });
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
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

window.resolveGradientPosition = resolveGradientPosition;

function buildPageBackground(settings) {
  if (!settings.pageBackgroundEnabled) return "";
  const colors = [
    settings.pageBackgroundColor1,
    settings.pageBackgroundColor2,
    settings.pageBackgroundColor3
  ].filter(Boolean);
  if (!colors.length) return "";
  if (settings.pageBackgroundType === "radial") {
    return `radial-gradient(circle at ${resolveGradientPosition("radial", settings.pageBackgroundPosition)}, ${colors.join(", ")})`;
  }
  return `linear-gradient(${resolveGradientPosition("linear", settings.pageBackgroundPosition)}, ${colors.join(", ")})`;
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

  const hasImage = Boolean(siteSettings.pageBackgroundImage?.trim());
  document.documentElement.style.setProperty("--page-bg-image", hasImage ? `url("${escapeCssUrl(siteSettings.pageBackgroundImage.trim())}")` : "none");
  document.documentElement.style.setProperty("--page-bg-position", siteSettings.pageBackgroundImagePosition || "center center");
  document.documentElement.style.setProperty("--page-bg-fit", siteSettings.pageBackgroundImageFit || "cover");
  document.documentElement.style.setProperty("--page-bg-image-opacity", hasImage ? String(siteSettings.pageBackgroundImageOpacity ?? 1) : "0");
  document.documentElement.style.setProperty("--page-bg-image-brightness", String(siteSettings.pageBackgroundImageBrightness ?? 1));
  document.documentElement.style.setProperty("--page-bg-overlay", hasImage ? buildPageOverlay(siteSettings) : "transparent");
}

function obtenerPrecioProducto(prod) {
  return prod?.oferta?.ahora || prod?.precio || 0;
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
  if (adminTools) adminTools.classList.toggle("hidden", !isAdmin);
  applySpecialSectionLayout();
}

function applySpecialSectionLayout() {
  const topSlot = document.getElementById("layoutTopSlot");
  const middleSlot = document.getElementById("layoutMiddleSlot");
  const bottomSlot = document.getElementById("layoutBottomSlot");
  const heroSection = document.getElementById("heroSection");
  const sliderSection = document.getElementById("sliderContainer");
  if (!topSlot || !middleSlot || !bottomSlot || !heroSection || !sliderSection) return;

  const slotMap = {
    top: topSlot,
    middle: middleSlot,
    bottom: bottomSlot
  };

  const heroPosition = siteSettings.heroPosition || "top";
  const sliderPosition = siteSettings.sliderPosition || "top";
  const items = [
    { element: heroSection, slot: slotMap[heroPosition] ? heroPosition : "top", order: 0 },
    { element: sliderSection, slot: slotMap[sliderPosition] ? sliderPosition : "top", order: 1 }
  ];

  ["top", "middle", "bottom"].forEach((slotName) => {
    items
      .filter((item) => item.slot === slotName)
      .sort((a, b) => a.order - b.order)
      .forEach((item) => slotMap[slotName].appendChild(item.element));
  });
}

function actualizarUsuarioUI() {
  const avatar = document.getElementById("userAvatar");
  const nombre = document.getElementById("userName");
  const loginBtn = document.getElementById("loginBtn");
  const carritoIcon = document.getElementById("carritoIcon");
  if (!avatar || !nombre || !loginBtn || !carritoIcon) return;

  if (usuarioActual) {
    avatar.src = usuarioActual.foto ? `${usuarioActual.foto}?t=${Date.now()}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    avatar.classList.remove("hidden");
    nombre.textContent = usuarioActual.username;
    nombre.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    carritoIcon.classList.remove("hidden");
  } else {
    avatar.classList.add("hidden");
    nombre.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    carritoIcon.classList.add("hidden");
  }
}

function actualizarContadorCarrito() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  document.getElementById("carritoCount").textContent = total;
  document.getElementById("menuCarritoCount").textContent = total;
}

async function registrarUsuario() {
  const username = document.getElementById("regUser").value.trim();
  const password = document.getElementById("regPass").value;
  const fotoFile = document.getElementById("regFoto").files[0];
  if (!username) return mostrarMensaje("Completa el nombre de usuario.");

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
  actualizarUsuarioUI();
  await cargarCarritoUsuario();
  await cargarFavoritos();
  actualizarContadorCarrito();
  document.getElementById("regUser").value = "";
  document.getElementById("regPass").value = "";
  limpiarInputArchivo("regFoto");
  cerrarLoginUsuario();
  mostrarMensaje("Usuario registrado correctamente.");
}

async function loginUsuario() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  if (!username) return mostrarMensaje("Completa el nombre de usuario.");

  const { data, error } = await obtenerUsuarioPorCredenciales(username, password);
  if (error || !data) return mostrarMensaje("Datos incorrectos.");
  setUsuarioActualData(data);
  await cargarCarritoUsuario();
  await cargarFavoritos();
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  cerrarLoginUsuario();
}

function cerrarSesion() {
  usuarioActual = null;
  carrito = [];
  favoritos = [];
  localStorage.removeItem("usuarioActual");
  actualizarUsuarioUI();
  actualizarContadorCarrito();
}

async function cargarCarritoUsuario() {
  if (!usuarioActual?.id) return;
  const { data, error } = await supabaseClient.from("carrito").select("*").eq("usuario_id", usuarioActual.id);
  if (error || !data) return;
  carrito = data.map((item) => {
    const prod = buscarProducto(item.producto_id) || { nombre: item.producto_id, precio: 0, descripcion: "" };
    return { ...prod, precio: obtenerPrecioProducto(prod), cantidad: item.cantidad };
  });
}

async function cargarFavoritos() {
  if (!usuarioActual?.id) return;
  const { data, error } = await supabaseClient.from("favoritos").select("*").eq("usuario_id", usuarioActual.id);
  if (error || !data) return;
  favoritos = data.map((item) => {
    const prod = buscarProducto(item.producto_id) || { nombre: item.producto_id, precio: 0, descripcion: "" };
    return { ...prod, cantidad: item.cantidad };
  });
}

async function syncCarritoProducto(nombre, cantidad) {
  if (!usuarioActual?.id) return;
  const { data } = await supabaseClient.from("carrito").select("id").eq("usuario_id", usuarioActual.id).eq("producto_id", nombre).maybeSingle();
  if (cantidad <= 0) {
    await supabaseClient.from("carrito").delete().eq("usuario_id", usuarioActual.id).eq("producto_id", nombre);
    return;
  }
  if (data) {
    await supabaseClient.from("carrito").update({ cantidad }).eq("usuario_id", usuarioActual.id).eq("producto_id", nombre);
  } else {
    await supabaseClient.from("carrito").insert([{ usuario_id: usuarioActual.id, producto_id: nombre, cantidad }]);
  }
}

async function agregarCarritoCantidad(nombre, cantidad) {
  const prod = buscarProducto(nombre);
  if (!prod) return;
  const existing = carrito.find((item) => item.nombre === nombre);
  if (existing) {
    existing.cantidad += cantidad;
    existing.precio = obtenerPrecioProducto(prod);
  } else {
    carrito.push({ ...prod, precio: obtenerPrecioProducto(prod), cantidad });
  }
  await syncCarritoProducto(nombre, carrito.find((item) => item.nombre === nombre).cantidad);
  actualizarContadorCarrito();
}

function abrirCantidad(nombre) {
  const value = parseInt(prompt("Cantidad que deseas agregar:", "1"), 10);
  if (!Number.isInteger(value) || value <= 0) return;
  agregarCarritoCantidad(nombre, value);
}

async function agregarFavorito(nombre) {
  if (!usuarioActual) return mostrarMensaje("Debes iniciar sesion.");
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

  const admin = document.createElement("div");
  admin.className = "mobile-admin-section";
  admin.innerHTML = `
    <button type="button" onclick="openModal('loginModal')">Administrador</button>
    <button type="button" class="${isAdmin ? "" : "hidden"}" onclick="logout()">Volver a modo cliente</button>
  `;
  mobile.appendChild(admin);
}

function generarProductoHTML(prod, ci, pi) {
  const inOffer = prod.oferta && prod.oferta.antes && prod.oferta.ahora;
  const percentage = inOffer ? Math.round(((prod.oferta.antes - prod.oferta.ahora) / prod.oferta.antes) * 100) : 0;
  return `
    ${!prod.activo ? '<div class="estado">No disponible</div>' : ""}
    <div class="product-image-wrap">
      <img src="${prod.imagen || "https://placehold.co/600x600/0f172a/e2e8f0?text=Sin+Imagen"}" alt="${prod.nombre}" onclick="abrirImagenProducto(${ci},${pi})">
    </div>
    <div class="producto-body">
      <h4>${prod.nombre}</h4>
      <p>${prod.descripcion || ""}</p>
      <div class="precio-row">
        ${inOffer ? `<span class="precio-antiguo">$${prod.oferta.antes}</span><span class="precio">$${prod.oferta.ahora}</span><span class="oferta">-${percentage}%</span>` : `<span class="precio">$${prod.precio}</span>`}
      </div>
      <div class="acciones-producto">
        <button type="button" onclick="agregarFavorito('${prod.nombre.replace(/'/g, "\\'")}')">Favorito</button>
        <button type="button" onclick="abrirCantidad('${prod.nombre.replace(/'/g, "\\'")}')">Agregar</button>
      </div>
      ${isAdmin ? `
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
    </div>
  `;
}

function render() {
  const cont = document.getElementById("catalogos");
  cont.innerHTML = "";
  renderMenu();

  catalogos.forEach((cat, ci) => {
    const section = document.createElement("section");
    section.className = "catalogo";
    section.id = `cat${ci}`;
    section.innerHTML = `
      <div class="catalogo-head">
        <h2 class="catalogo-title">${cat.nombre}</h2>
        ${isAdmin ? `<div class="catalogo-actions"><button type="button" onclick="agregarProducto(${ci})">Agregar Producto</button><button type="button" class="danger-btn" onclick="eliminarCatalogo(${ci})">Eliminar Catalogo</button></div>` : ""}
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
  const { data } = await supabaseClient.from("catalogos").select("*").limit(1);
  if (data?.length) {
    catalogos = data[0].data || defaultData;
    catalogosRowId = data[0].id;
  }
}

async function guardarEnSupabase() {
  if (catalogosRowId) {
    await supabaseClient.from("catalogos").update({ data: catalogos }).eq("id", catalogosRowId);
  } else {
    const { data } = await supabaseClient.from("catalogos").insert([{ data: catalogos }]).select();
    if (data?.length) catalogosRowId = data[0].id;
  }
}

function guardar() {
  localStorage.setItem("catalogos", JSON.stringify(catalogos));
  guardarEnSupabase();
  render();
}

async function cargarSlidesSupabase() {
  const { data } = await supabaseClient.from("slides").select("*").limit(1);
  if (data?.length) {
    slidesData = data[0].data || [];
    slidesRowId = data[0].id;
  }
}

async function guardarSlidesSupabase() {
  if (slidesRowId) {
    await supabaseClient.from("slides").update({ data: slidesData }).eq("id", slidesRowId);
  } else {
    const { data } = await supabaseClient.from("slides").insert([{ data: slidesData }]).select();
    if (data?.length) slidesRowId = data[0].id;
  }
}

function guardarSlides() {
  localStorage.setItem("slidesData", JSON.stringify(slidesData));
  guardarSlidesSupabase();
  renderSlider();
}

async function agregarSlide() {
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
  const slide = slidesData[index];
  if (!slide) return;
  slide.texto = prompt("Texto del slide:", slide.texto) ?? slide.texto;
  slide.descripcion = prompt("Descripcion del slide:", slide.descripcion || "") ?? slide.descripcion;
  slide.duracion = parseInt(prompt("Duracion:", String(slide.duracion || 4)), 10) || 4;
  guardarSlides();
}

function eliminarSlide(index) {
  if (!slidesData[index] || !confirm("Eliminar slide?")) return;
  slidesData.splice(index, 1);
  slideIndex = Math.max(0, slideIndex - 1);
  guardarSlides();
}

function restaurarSlider() {
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
      ${isAdmin ? `<div class="modal-actions"><button type="button" onclick="editarSlide(${slideIndex})">Editar</button><button type="button" class="danger-btn" onclick="eliminarSlide(${slideIndex})">Eliminar</button></div>` : ""}
    </div>
  `;
  slider.appendChild(div);
  iniciarSlider();
  applySpecialSectionLayout();
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
  document.getElementById("sliderAdmin").classList.toggle("hidden", !isAdmin);
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("adminPass").value.trim();
  if (username !== adminUser || password !== adminPassValue) return mostrarMensaje("Datos incorrectos.");
  isAdmin = true;
  document.getElementById("adminGlobalPanel").classList.remove("hidden");
  actualizarSliderAdmin();
  render();
  renderSlider();
  renderHero();
  builderHooks.setAdmin(true);
  closeLogin();
}

function logout() {
  isAdmin = false;
  document.getElementById("adminGlobalPanel").classList.add("hidden");
  actualizarSliderAdmin();
  render();
  renderSlider();
  renderHero();
  window.closeBuilderSidebar?.();
  builderHooks.setAdmin(false);
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

function abrirBuscadorMobile() {
  const wrap = document.getElementById("searchWrap");
  wrap?.classList.add("is-open");
  document.getElementById("buscadorGlobal")?.focus();
}

function cerrarBuscadorMobile(force = false) {
  if (window.innerWidth > 760) return;
  const input = document.getElementById("buscadorGlobal");
  const wrap = document.getElementById("searchWrap");
  if (!wrap || !input) return;
  if (!force && input.value.trim()) return;
  wrap.classList.remove("is-open");
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
      cerrarBuscadorMobile(true);
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
  const nombre = prompt("Nombre del producto:");
  const precio = parseFloat(prompt("Precio:"));
  const descripcion = prompt("Descripcion:") || "";
  if (!nombre || Number.isNaN(precio)) return;
  catalogos[ci].productos.push({ nombre: nombre.trim(), precio, descripcion: descripcion.trim(), imagen: null, imagenes: [], oferta: null, activo: true });
  guardar();
}

function editarProducto(ci, pi) {
  const prod = catalogos[ci].productos[pi];
  const nombre = prompt("Nombre:", prod.nombre);
  const precio = parseFloat(prompt("Precio:", String(prod.precio)));
  const descripcion = prompt("Descripcion:", prod.descripcion);
  if (!nombre || Number.isNaN(precio)) return;
  prod.nombre = nombre.trim();
  prod.precio = precio;
  prod.descripcion = (descripcion || "").trim();
  guardar();
}

function eliminarProducto(ci, pi) {
  if (!confirm("Eliminar producto?")) return;
  catalogos[ci].productos.splice(pi, 1);
  guardar();
}

function cambiarEstado(ci, pi) {
  catalogos[ci].productos[pi].activo = !catalogos[ci].productos[pi].activo;
  guardar();
}

function crearOferta(ci, pi) {
  const antes = parseFloat(prompt("Precio anterior:"));
  const ahora = parseFloat(prompt("Precio oferta:"));
  if (Number.isNaN(antes) || Number.isNaN(ahora) || ahora >= antes) return mostrarMensaje("La oferta debe ser menor que el precio anterior.");
  catalogos[ci].productos[pi].oferta = { antes, ahora };
  guardar();
}

function quitarOferta(ci, pi) {
  catalogos[ci].productos[pi].oferta = null;
  guardar();
}

async function cambiarImagen(ci, pi) {
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
  if (!catalogos[ci].productos[pi].imagenes?.length) return mostrarMensaje("No hay imagenes extra.");
  catalogos[ci].productos[pi].imagenes.pop();
  guardar();
}

function crearCatalogo() {
  const nombre = prompt("Nombre del catalogo:");
  if (!nombre) return;
  catalogos.push({ nombre: nombre.trim(), productos: [] });
  guardar();
}

function eliminarCatalogo(ci) {
  if (!confirm("Eliminar catalogo completo?")) return;
  catalogos.splice(ci, 1);
  guardar();
}

function abrirCarrito() {
  const lista = document.getElementById("carritoLista");
  const totalBox = document.getElementById("carritoTotal");
  lista.innerHTML = "";
  let total = 0;
  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
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
  let mensaje = "Pedido DIGIHERA TECH\n\n";
  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    mensaje += `${item.nombre} x${item.cantidad} - $${subtotal}\n`;
  });
  mensaje += `\nTotal: $${total}`;
  window.open(`https://wa.me/18298483964?text=${encodeURIComponent(mensaje)}`, "_blank");
  guardarPedidoHistorial(total);
}

async function guardarPedidoHistorial(total) {
  if (!usuarioActual?.id) return;
  await supabaseClient.from("pedidos").insert([{ usuario_id: usuarioActual.id, productos: carrito, total, fecha: new Date().toISOString() }]);
}

function abrirFavoritos() {
  const lista = document.getElementById("favoritosLista");
  lista.innerHTML = "";
  favoritos.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `<strong>${item.nombre}</strong><span>$${obtenerPrecioProducto(item)}</span><button type="button" class="danger-btn" onclick="quitarFavorito(${index})">Quitar</button>`;
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

function abrirPerfil() {
  if (!usuarioActual) return;
  document.getElementById("perfilNombre").value = usuarioActual.username || "";
  document.getElementById("passOculta").textContent = "*****";
  openModal("perfilModal");
}

function verPasswordActual() {
  if (!usuarioActual) return;
  const span = document.getElementById("passOculta");
  span.textContent = span.textContent === "*****" ? usuarioActual.password : "*****";
}

function cerrarPerfil() { closeModal("perfilModal"); }

async function guardarPerfil() {
  if (!usuarioActual?.id) return;
  const nombre = document.getElementById("perfilNombre").value.trim();
  const passActual = document.getElementById("perfilPassActual").value;
  const passNueva = document.getElementById("perfilPassNueva").value;
  const passConfirm = document.getElementById("perfilPassConfirmar").value;
  if (!nombre) return mostrarMensaje("El nombre no puede estar vacio.");
  if (passNueva && passNueva !== passConfirm) return mostrarMensaje("Las contrasenas no coinciden.");
  if (passNueva && passActual !== usuarioActual.password) return mostrarMensaje("Contrasena actual incorrecta.");

  const updateData = { username: nombre };
  const fotoFile = document.getElementById("perfilFoto").files[0];
  if (fotoFile) updateData.foto = await subirArchivoABucket("perfil", `perfil_${usuarioActual.id}`, fotoFile);
  if (passNueva) updateData.password = passNueva;
  const { error } = await supabaseClient.from("usuarios").update(updateData).eq("id", usuarioActual.id);
  if (error) return mostrarMensaje("No se pudo actualizar el perfil.");
  const { data } = await supabaseClient.from("usuarios").select("*").eq("id", usuarioActual.id).single();
  usuarioActual = data;
  localStorage.setItem("usuarioActual", JSON.stringify(data));
  actualizarUsuarioUI();
  cerrarPerfil();
}

async function eliminarCuenta() {
  if (!usuarioActual?.id) return;
  const pass = prompt("Escribe tu contrasena para eliminar la cuenta:");
  if (pass !== usuarioActual.password) return mostrarMensaje("Contrasena incorrecta.");
  if (!confirm("Esta accion eliminara tu cuenta. Deseas continuar?")) return;
  await supabaseClient.from("carrito").delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from("favoritos").delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from("pedidos").delete().eq("usuario_id", usuarioActual.id);
  await supabaseClient.from("usuarios").delete().eq("id", usuarioActual.id);
  cerrarSesion();
  cerrarPerfil();
}

async function abrirHistorial() {
  if (!usuarioActual?.id) return;
  const lista = document.getElementById("historialLista");
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

function editarCajaPortada(index) {
  const card = siteSettings.heroCards[index];
  if (!card) return;
  card.eyebrow = prompt("Etiqueta superior:", card.eyebrow || "") ?? card.eyebrow;
  card.title = prompt("Titulo:", card.title || "") ?? card.title;
  card.description = prompt("Descripcion:", card.description || "") ?? card.description;
  builderHooks.syncSettings(siteSettings);
  builderHooks.persistAll();
}

function agregarCajaPortada() {
  siteSettings.heroCards.push({
    eyebrow: "Nueva caja",
    title: "Titulo nuevo",
    description: "Descripcion nueva"
  });
  builderHooks.syncSettings(siteSettings);
  builderHooks.persistAll();
}

function eliminarCajaPortada(index) {
  if (siteSettings.heroCards.length <= 1) return mostrarMensaje("Debe quedar al menos una caja.");
  siteSettings.heroCards.splice(index, 1);
  builderHooks.syncSettings(siteSettings);
  builderHooks.persistAll();
}

async function cambiarLogoEmpresa() {
  if (!isAdmin) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    siteSettings.logoImage = await subirArchivoABucket("productos", "logo_empresa", file);
    builderHooks.syncSettings(siteSettings);
    builderHooks.persistAll();
  };
  input.click();
}

function abrirAjustesPaginaBuilder() {
  if (!isAdmin) return;
  builderHooks.openPageSettings?.();
}

function abrirPortadaBuilder(index = 0) {
  if (!isAdmin) return;
  builderHooks.openHeroEditor?.(index);
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
  });
}

window.builderHooks = builderHooks;
window.siteSettings = siteSettings;

window.addEventListener("load", async () => {
  setupEvents();
  await cargarDesdeSupabase();
  await cargarSlidesSupabase();
  if (usuarioActual) {
    await cargarCarritoUsuario();
    await cargarFavoritos();
  }
  actualizarUsuarioUI();
  actualizarContadorCarrito();
  actualizarSliderAdmin();
  applySiteAppearance();
  renderBranding();
  renderHero();
  render();
  renderSlider();
  applySpecialSectionLayout();

  supabaseClient.channel("usuarios_changes").on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "usuarios"
  }, (payload) => {
    if (usuarioActual && payload.new.id === usuarioActual.id) {
      usuarioActual = payload.new;
      localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
      actualizarUsuarioUI();
    }
  }).subscribe();
});
