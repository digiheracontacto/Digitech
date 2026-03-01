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

  let { data } = await supabaseClient
    .from("catalogos")
    .select("*")
    .limit(1);

  if (data && data.length > 0) {
    catalogos = data[0].data;
    catalogosRowId = data[0].id;
    localStorage.setItem("catalogos", JSON.stringify(catalogos));
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
    let { data } = await supabaseClient
      .from("catalogos")
      .insert([{ data: catalogos }])
      .select();

    if (data && data.length > 0) {
      catalogosRowId = data[0].id;
    }
  }
}

function guardar() {
  localStorage.setItem("catalogos", JSON.stringify(catalogos));
  guardarEnSupabase();
}


/* ========================================= */
/* 🖼 COMPRESIÓN AUTOMÁTICA */
/* ========================================= */

async function comprimirImagen(file) {

  return new Promise((resolve) => {

    let reader = new FileReader();

    reader.onload = (e) => {

      let img = new Image();

      img.onload = () => {

        let canvas = document.createElement("canvas");
        let maxWidth = 1000;
        let scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => resolve(blob),
          "image/jpeg",
          0.7
        );
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}


/* ========================================= */
/* 🖼 IMAGEN PRODUCTO */
/* ========================================= */

async function cambiarImagen(ci, pi) {

  let input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {

    let file = e.target.files[0];
    if (!file) return;

    let blob = await comprimirImagen(file);
    let fileName = "producto_" + Date.now() + ".jpg";

    let { error } =
      await supabaseClient.storage
        .from("productos")
        .upload(fileName, blob, {
          contentType: "image/jpeg"
        });

    if (error) {
      alert("Error subiendo imagen");
      return;
    }

    let { data } =
      supabaseClient.storage
        .from("productos")
        .getPublicUrl(fileName);

    catalogos[ci].productos[pi].imagen = data.publicUrl;

    guardar();
    render();
  };

  input.click();
}


/* ========================================= */
/* 🔐 LOGIN */
/* ========================================= */

adminBtn.onclick = () =>
  loginModal.style.display = "flex";

function closeLogin() {
  loginModal.style.display = "none";
}

function actualizarSliderAdmin() {

  let panel = document.getElementById("sliderAdmin");
  if (!panel) return;

  if (isAdmin) {
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }
}

function login() {

  if (
    username.value === adminUser &&
    password.value === adminPass
  ) {

    isAdmin = true;

    adminGlobalPanel.classList.remove("hidden");
    volverClienteBtn.classList.remove("hidden");

    closeLogin();

    actualizarSliderAdmin();
    render();
    renderSlider();

  } else {
    alert("Datos incorrectos");
  }
}

function logout() {

  isAdmin = false;

  adminGlobalPanel.classList.add("hidden");
  volverClienteBtn.classList.add("hidden");

  actualizarSliderAdmin();
  render();
  renderSlider();
}

volverClienteBtn.onclick = logout;


/* ========================================= */
/* 🎞 SLIDER COMPLETO */
/* ========================================= */

let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];
let slidesRowId = null;

async function cargarSlidesSupabase() {

  if (!window.supabaseClient) return;

  let { data } = await supabaseClient
    .from("slides")
    .select("*")
    .limit(1);

  if (data && data.length > 0) {

    slidesData = data[0].data;
    slidesRowId = data[0].id;

    localStorage.setItem("slidesData", JSON.stringify(slidesData));
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

    let { data } = await supabaseClient
      .from("slides")
      .insert([{ data: slidesData }])
      .select();

    if (data && data.length > 0) {
      slidesRowId = data[0].id;
    }
  }
}

function guardarSlides() {
  localStorage.setItem("slidesData", JSON.stringify(slidesData));
  guardarSlidesSupabase();
}

async function agregarSlide() {

  let input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {

    let file = e.target.files[0];
    if (!file) return;

    let blob = await comprimirImagen(file);
    let fileName = "slide_" + Date.now() + ".jpg";

    let { error } =
      await supabaseClient.storage
        .from("slides")
        .upload(fileName, blob, {
          contentType: "image/jpeg"
        });

    if (error) {
      alert("Error subiendo slide");
      return;
    }

    let { data } =
      supabaseClient.storage
        .from("slides")
        .getPublicUrl(fileName);

    let texto = prompt("Texto del slide:");

    slidesData.push({
      imagen: data.publicUrl,
      texto: texto || "",
      duracion: 4000
    });

    guardarSlides();
    renderSlider();
  };

  input.click();
}

function editarSlide(i) {

  let nuevoTexto =
    prompt("Editar texto:", slidesData[i].texto);

  if (nuevoTexto !== null) {
    slidesData[i].texto = nuevoTexto;
  }

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

function renderSlider() {

  let slider = document.getElementById("slider");
  if (!slider) return;

  slider.innerHTML = "";

  slidesData.forEach((slide, i) => {

    let div = document.createElement("div");
    div.className = "slide";

    div.innerHTML = `
      <img src="${slide.imagen}">
      <div class="slide-info">
        <h2>${slide.texto || ""}</h2>
        ${
          isAdmin ?
          `<button onclick="editarSlide(${i})">Editar</button>
           <button onclick="eliminarSlide(${i})">Eliminar</button>`
          : ""
        }
      </div>
    `;

    slider.appendChild(div);
  });
}


/* ========================================= */
/* 🚀 CARGA INICIAL */
/* ========================================= */

window.addEventListener("load", async () => {

  await cargarDesdeSupabase();
  await cargarSlidesSupabase();

  actualizarSliderAdmin();
  render();
  renderSlider();
});
