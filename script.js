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

  if (data && data.length > 0 && data[0].data) {
    catalogos = data[0].data;
    catalogosRowId = data[0].id;
  } else {
    catalogos = defaultData;
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
/* 🗑 ELIMINAR PRODUCTO (FALTABA) */
/* ========================================= */

function eliminarProducto(ci, pi) {
  if (confirm("Eliminar producto?")) {
    catalogos[ci].productos.splice(pi, 1);
    guardar();
    render();
  }
}

/* ========================================= */
/* 🎞 SLIDER FUNCIONAL */
/* ========================================= */

let slidesData = [];
let slidesRowId = null;
let slideIndex = 0;
let sliderTimeout = null;

async function cargarSlidesSupabase() {
  if (!window.supabaseClient) return;

  const { data } = await supabaseClient
    .from("slides")
    .select("*")
    .limit(1);

  if (data && data.length > 0 && data[0].data) {
    slidesData = data[0].data;
    slidesRowId = data[0].id;
  } else {
    slidesData = [];
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

function programarSlide() {
  if (sliderTimeout) clearTimeout(sliderTimeout);
  if (slidesData.length === 0) return;

  const duracion = (slidesData[slideIndex].duracion || 3) * 1000;

  sliderTimeout = setTimeout(() => {
    slideIndex = (slideIndex + 1) % slidesData.length;
    renderSlider();
  }, duracion);
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
  programarSlide();
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
    slideIndex = 0;
    guardarSlides();
    renderSlider();
  }
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
