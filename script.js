/* ========================================= */
/* 🔐 SISTEMA ADMIN */
/* ========================================= */

let adminUser = "admin";
let adminPass = "1234";
let isAdmin = false;

/* ========================================= */
/* 📦 DATA INICIAL */
/* ========================================= */

let defaultData = [
  {
    nombre: "Telefonos",
    productos: [
      {
        nombre: "Samsung A15",
        precio: 180,
        descripcion: "128GB 4GB RAM",
        imagen: null,
        oferta: null,
        activo: true
      },
      {
        nombre: "Redmi 13C",
        precio: 150,
        descripcion: "128GB 6GB RAM",
        imagen: null,
        oferta: null,
        activo: true
      }
    ]
  }
];

let catalogos = JSON.parse(localStorage.getItem("catalogos")) || defaultData;
let catalogosRowId = null;

/* ========================================= */
/* ☁ SUPABASE - CATALOGOS */
/* ========================================= */

async function cargarDesdeSupabase() {
  if (!window.supabaseClient) return;

  const { data } = await supabaseClient
    .from("catalogos")
    .select("*")
    .limit(1);

  if (data && data.length > 0) {
    catalogos = data[0].data;
    catalogosRowId = data[0].id;
  }
}

async function guardarEnSupabase() {
  if (!window.supabaseClient) return;

  if (catalogosRowId) {
    await supabaseClient
      .from("catalogos")
      .update({ data: catalogos })
      .eq("id", catalogosRowId);
  } else {
    const { data } = await supabaseClient
      .from("catalogos")
      .insert([{ data: catalogos }])
      .select();

    if (data && data.length > 0)
      catalogosRowId = data[0].id;
  }
}

function guardar() {
  localStorage.setItem("catalogos", JSON.stringify(catalogos));
  guardarEnSupabase();
}

/* ========================================= */
/* 🖼 COMPRESIÓN */
/* ========================================= */

async function comprimirImagen(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.8);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/* ========================================= */
/* 📁 CATALOGOS */
/* ========================================= */

function crearCatalogo() {
  const nombre = prompt("Nombre catálogo:");
  if (!nombre) return;

  catalogos.push({ nombre, productos: [] });
  guardar();
  render();
}

function eliminarCatalogo(ci) {
  if (confirm("Eliminar catálogo?")) {
    catalogos.splice(ci, 1);
    guardar();
    render();
  }
}

/* ========================================= */
/* 📦 PRODUCTOS */
/* ========================================= */

function agregarProducto(ci) {
  const nombre = prompt("Nombre:");
  const precio = parseFloat(prompt("Precio:"));
  const descripcion = prompt("Descripción:");

  if (!nombre || isNaN(precio)) return;

  catalogos[ci].productos.push({
    nombre,
    precio,
    descripcion,
    imagen: null,
    oferta: null,
    activo: true
  });

  guardar();
  render();
}

function editarProducto(ci, pi) {
  const prod = catalogos[ci].productos[pi];

  const nombre = prompt("Nombre:", prod.nombre);
  const precio = parseFloat(prompt("Precio:", prod.precio));
  const descripcion = prompt("Descripción:", prod.descripcion);

  if (nombre !== null) prod.nombre = nombre;
  if (!isNaN(precio)) prod.precio = precio;
  if (descripcion !== null) prod.descripcion = descripcion;

  guardar();
  render();
}

function crearOferta(ci, pi) {
  const antes = parseFloat(prompt("Precio antes:"));
  const ahora = parseFloat(prompt("Precio ahora:"));

  if (!isNaN(antes) && !isNaN(ahora)) {
    catalogos[ci].productos[pi].oferta = { antes, ahora };
    guardar();
    render();
  }
}

function quitarOferta(ci, pi) {
  catalogos[ci].productos[pi].oferta = null;
  guardar();
  render();
}

function cambiarEstado(ci, pi) {
  catalogos[ci].productos[pi].activo =
    !catalogos[ci].productos[pi].activo;
  guardar();
  render();
}

function eliminarProducto(ci, pi) {
  if (confirm("Eliminar producto?")) {
    catalogos[ci].productos.splice(pi, 1);
    guardar();
    render();
  }
}

/* ========================================= */
/* 🖼 IMAGEN PRODUCTO */
/* ========================================= */

async function cambiarImagen(ci, pi) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const blob = await comprimirImagen(file);
    const fileName = "producto_" + Date.now() + ".jpg";

    const { error } = await supabaseClient.storage
      .from("productos")
      .upload(fileName, blob, { upsert: true });

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabaseClient.storage
      .from("productos")
      .getPublicUrl(fileName);

    catalogos[ci].productos[pi].imagen = data.publicUrl;

    guardar();
    render();
  };

  input.click();
}

/* ========================================= */
/* 🎞 SLIDER */
/* ========================================= */

let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];
let slidesRowId = null;
let slideIndex = 0;
let sliderInterval = null;

async function cargarSlidesSupabase() {
  if (!window.supabaseClient) return;

  const { data } = await supabaseClient
    .from("slides")
    .select("*")
    .limit(1);

  if (data && data.length > 0) {
    slidesData = data[0].data;
    slidesRowId = data[0].id;
  }
}

async function guardarSlidesSupabase() {
  if (!window.supabaseClient) return;

  if (slidesRowId) {
    await supabaseClient
      .from("slides")
      .update({ data: slidesData })
      .eq("id", slidesRowId);
  } else {
    const { data } = await supabaseClient
      .from("slides")
      .insert([{ data: slidesData }])
      .select();

    if (data && data.length > 0)
      slidesRowId = data[0].id;
  }
}

function guardarSlides() {
  localStorage.setItem("slidesData", JSON.stringify(slidesData));
  guardarSlidesSupabase();
}

async function agregarSlide() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const blob = await comprimirImagen(file);
    const fileName = "slide_" + Date.now() + ".jpg";

    const { error } = await supabaseClient.storage
      .from("slides")
      .upload(fileName, blob, { upsert: true });

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabaseClient.storage
      .from("slides")
      .getPublicUrl(fileName);

    const texto = prompt("Texto del slide:");
    const duracion = parseInt(prompt("Duración en segundos:", "3")) || 3;

    slidesData.push({
      imagen: data.publicUrl,
      texto: texto || "",
      duracion: duracion
    });

    guardarSlides();
    renderSlider();
  };

  input.click();
}

function editarSlide(i) {
  const texto = prompt("Nuevo texto:", slidesData[i].texto);
  const duracion = parseInt(prompt("Nueva duración:", slidesData[i].duracion || 3));

  if (texto !== null) slidesData[i].texto = texto;
  if (!isNaN(duracion)) slidesData[i].duracion = duracion;

  guardarSlides();
  renderSlider();
}

function eliminarSlide(i) {
  if (confirm("Eliminar slide?")) {
    slidesData.splice(i, 1);
    guardarSlides();
    renderSlider();
  }
}

function iniciarSlider() {
  if (sliderInterval) clearInterval(sliderInterval);
  if (slidesData.length === 0) return;

  sliderInterval = setInterval(() => {
    slideIndex = (slideIndex + 1) % slidesData.length;
    renderSlider();
  }, (slidesData[slideIndex].duracion || 3) * 1000);
}

function renderSlider() {
  const slider = document.getElementById("slider");
  if (!slider) return;

  slider.innerHTML = "";
  if (slidesData.length === 0) return;

  const slide = slidesData[slideIndex];

  const div = document.createElement("div");
  div.className = "slide";

  div.innerHTML = `
    <img src="${slide.imagen}">
    <div class="slide-info">
      <h2>${slide.texto || ""}</h2>
      ${
        isAdmin
          ? `<button onclick="editarSlide(${slideIndex})">Editar</button>
             <button onclick="eliminarSlide(${slideIndex})">Eliminar</button>`
          : ""
      }
    </div>
  `;

  slider.appendChild(div);
  iniciarSlider();
}

/* ========================================= */
/* 🚀 INICIO */
/* ========================================= */

window.addEventListener("load", async () => {
  await cargarDesdeSupabase();
  await cargarSlidesSupabase();
  render();
  renderSlider();
});

