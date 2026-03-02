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
/* 🧭 MENÚ DINÁMICO */
/* ========================================= */

function renderMenu() {

  const desktop = document.getElementById("menuCatalogos");
  const mobile = document.getElementById("menuMobile");

  if (!desktop || !mobile) return;

  desktop.innerHTML = "";
  mobile.innerHTML = "";

  catalogos.forEach((cat, i) => {

    const linkDesktop = document.createElement("a");
    linkDesktop.href = "#cat" + i;
    linkDesktop.textContent = cat.nombre;
    desktop.appendChild(linkDesktop);

    const linkMobile = document.createElement("a");
    linkMobile.href = "#cat" + i;
    linkMobile.textContent = cat.nombre;
    mobile.appendChild(linkMobile);
  });

  const adminSection = document.createElement("div");
  adminSection.className = "mobile-admin-section";

  const btnAdmin = document.createElement("button");
  btnAdmin.textContent = "Administrador";
  btnAdmin.onclick = () => {
    document.getElementById("loginModal").style.display = "flex";
  };

  const btnVolver = document.createElement("button");
  btnVolver.textContent = "Volver a modo cliente";
  btnVolver.onclick = logout;

  if (!isAdmin) btnVolver.classList.add("hidden");

  adminSection.appendChild(btnAdmin);
  adminSection.appendChild(btnVolver);

  mobile.appendChild(adminSection);
}


/* ========================================= */
/* 📱 MENÚ HAMBURGUESA */
/* ========================================= */

/* 🔥 BLOQUE CORREGIDO */
document.addEventListener("DOMContentLoaded", () => {

  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.getElementById("menuMobile")
        .classList.toggle("hidden");
    });
  }

  /* 🔥 BOTÓN ADMIN PC */
  const adminBtn = document.getElementById("adminBtn");
  const volverBtn = document.getElementById("volverClienteBtn");

  if (adminBtn) {
    adminBtn.onclick = () => {
      document.getElementById("loginModal").style.display = "flex";
    };
  }

  if (volverBtn) {
    volverBtn.onclick = logout;
  }

  /* 🔥 BOTÓN ADMIN MOBILE (por si existieran IDs futuros) */
  const adminBtnMobile = document.getElementById("adminBtnMobile");
  const volverBtnMobile = document.getElementById("volverClienteBtnMobile");

  if (adminBtnMobile) {
    adminBtnMobile.onclick = () => {
      document.getElementById("loginModal").style.display = "flex";
    };
  }

  if (volverBtnMobile) {
    volverBtnMobile.onclick = logout;
  }

  activarBuscador();

});


/* ========================================= */
/* 🔎 BUSCADOR INTELIGENTE */
/* ========================================= */

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function activarBuscador() {

  const input = document.getElementById("buscadorGlobal");
  if (!input) return;

  input.addEventListener("input", () => {

    const valor = normalizarTexto(input.value);

    /* 🔥 NUEVO: OCULTAR / MOSTRAR SLIDER */
    const sliderContainer = document.getElementById("sliderContainer");
    if (sliderContainer) {
      if (valor.length > 0) {
        sliderContainer.classList.add("hidden");
      } else {
        sliderContainer.classList.remove("hidden");
      }
    }
    /* 🔥 FIN NUEVO */

    const productos = document.querySelectorAll(".producto");

    productos.forEach(prod => {

      const texto = normalizarTexto(prod.innerText);

      if (texto.includes(valor)) {
        prod.classList.remove("oculto");
      } else {
        prod.classList.add("oculto");
      }

    });

  });
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
/* 🔐 LOGIN */
/* ========================================= */

function closeLogin() {
  document.getElementById("loginModal").style.display = "none";
}

function actualizarSliderAdmin() {
  const panel = document.getElementById("sliderAdmin");
  if (!panel) return;

  isAdmin
    ? panel.classList.remove("hidden")
    : panel.classList.add("hidden");
}

function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === adminUser && password === adminPass) {

    isAdmin = true;

    document.getElementById("adminGlobalPanel")
      .classList.remove("hidden");

    document.getElementById("volverClienteBtn")
      .classList.remove("hidden");

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

  document.getElementById("adminGlobalPanel")
    .classList.add("hidden");

  document.getElementById("volverClienteBtn")
    .classList.add("hidden");

  actualizarSliderAdmin();
  render();
  renderSlider();
}


/* ========================================= */
/* 🖥 RENDER */
/* ========================================= */

function render() {

  const cont = document.getElementById("catalogos");
  cont.innerHTML = "";

  renderMenu();

  catalogos.forEach((cat, ci) => {

    const div = document.createElement("div");
    div.className = "catalogo";
    div.id = "cat" + ci;

    div.innerHTML = `<h2>${cat.nombre}</h2>`;

    if (isAdmin) {
      div.innerHTML += `
        <button onclick="agregarProducto(${ci})">Agregar Producto</button>
        <button onclick="eliminarCatalogo(${ci})">Eliminar Catálogo</button>
      `;
    }

    const grid = document.createElement("div");
    grid.className = "productos-grid";

    cat.productos.forEach((prod, pi) => {

      const p = document.createElement("div");
      p.className = "producto";

      let precioHTML = `<div class="precio">$${prod.precio}</div>`;

      if (prod.oferta) {
        const porcentaje = Math.round(
          ((prod.oferta.antes - prod.oferta.ahora) / prod.oferta.antes) * 100
        );
        precioHTML = `
          <div>
            <span style="text-decoration:line-through;">$${prod.oferta.antes}</span>
            <span style="color:red;">$${prod.oferta.ahora} (-${porcentaje}%)</span>
          </div>
        `;
      }

      p.innerHTML = `
        ${!prod.activo ? '<div class="estado">No disponible</div>' : ""}
        <img src="${prod.imagen || ""}">
        <h4>${prod.nombre}</h4>
        <p>${prod.descripcion}</p>
        ${precioHTML}
      `;

      if (isAdmin) {
        p.innerHTML += `
          <button onclick="editarProducto(${ci},${pi})">Editar</button>
          <button onclick="crearOferta(${ci},${pi})">Oferta</button>
          <button onclick="quitarOferta(${ci},${pi})">Quitar Oferta</button>
          <button onclick="cambiarImagen(${ci},${pi})">Imagen</button>
          <button onclick="cambiarEstado(${ci},${pi})">Estado</button>
          <button onclick="eliminarProducto(${ci},${pi})">Eliminar</button>
        `;
      }

      grid.appendChild(p);
    });

    div.appendChild(grid);
    cont.appendChild(div);
  });

  activarBuscador();
}


/* ========================================= */
/* 🎞 SLIDER AVANZADO */
/* ========================================= */

let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];
let slidesRowId = null;
let slideIndex = 0;
let sliderInterval = null;

async function cargarSlidesSupabase() {

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

    if (data.length > 0) {
      slidesRowId = data[0].id;
    }
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

    await supabaseClient.storage
      .from("slides")
      .upload(fileName, blob, { upsert: true });

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
/* 🚀 CARGA INICIAL */
/* ========================================= */

window.addEventListener("load", async () => {

  await cargarDesdeSupabase();
  await cargarSlidesSupabase();

  actualizarSliderAdmin();
  render();
  renderSlider();
});

/* ========================================= */
/* 📦 FUNCIONES PRODUCTOS */
/* ========================================= */

function agregarProducto(ci) {

  const nombre = prompt("Nombre del producto:");
  if (!nombre) return;

  const precio = parseFloat(prompt("Precio del producto:"));
  if (isNaN(precio)) return;

  const descripcion = prompt("Descripción:") || "";

  catalogos[ci].productos.push({
    nombre: nombre.trim(),
    precio,
    descripcion: descripcion.trim(),
    imagen: null,
    oferta: null,
    activo: true
  });

  guardar();
  render();
}

function editarProducto(ci, pi) {

  const producto = catalogos[ci].productos[pi];

  const nuevoNombre = prompt("Editar nombre:", producto.nombre);
  if (!nuevoNombre) return;

  const nuevoPrecio = parseFloat(prompt("Editar precio:", producto.precio));
  if (isNaN(nuevoPrecio)) return;

  const nuevaDesc = prompt("Editar descripción:", producto.descripcion);

  producto.nombre = nuevoNombre.trim();
  producto.precio = nuevoPrecio;
  producto.descripcion = nuevaDesc ? nuevaDesc.trim() : "";

  guardar();
  render();
}

function eliminarProducto(ci, pi) {

  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  catalogos[ci].productos.splice(pi, 1);

  guardar();
  render();
}

function cambiarEstado(ci, pi) {

  const producto = catalogos[ci].productos[pi];
  producto.activo = !producto.activo;

  guardar();
  render();
}

function crearOferta(ci, pi) {

  const antes = parseFloat(prompt("Precio anterior:"));
  const ahora = parseFloat(prompt("Precio en oferta:"));

  if (isNaN(antes) || isNaN(ahora)) return;

  if (ahora >= antes) {
    alert("El precio en oferta debe ser menor que el precio anterior.");
    return;
  }

  catalogos[ci].productos[pi].oferta = {
    antes,
    ahora
  };

  guardar();
  render();
}

function quitarOferta(ci, pi) {

  catalogos[ci].productos[pi].oferta = null;

  guardar();
  render();
}

async function cambiarImagen(ci, pi) {

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const blob = await comprimirImagen(file);
    const fileName = "producto_" + Date.now() + ".jpg";

    await supabaseClient.storage
      .from("productos")
      .upload(fileName, blob, { upsert: true });

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
/* 📂 FUNCIONES CATÁLOGOS */
/* ========================================= */

function crearCatalogo() {

  const nombre = prompt("Nombre del nuevo catálogo:");
  if (!nombre) return;

  catalogos.push({
    nombre: nombre.trim(),
    productos: []
  });

  guardar();
  render();
}

function eliminarCatalogo(ci) {

  if (!confirm("¿Eliminar este catálogo completo?")) return;

  catalogos.splice(ci, 1);

  guardar();
  render();
}
