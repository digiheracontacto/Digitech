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
}


/* ========================================= */
/* 📱 MENÚ HAMBURGUESA */
/* ========================================= */

const menuToggle = document.getElementById("menuToggle");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.getElementById("menuMobile")
      .classList.toggle("hidden");
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
/* 🔧 FUNCIONES PRODUCTO COMPLETAS */
/* ========================================= */

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


/* ========================================= */
/* 🖥 RENDER */
/* ========================================= */

function render() {

  const cont = document.getElementById("catalogos");
  cont.innerHTML = "";

  renderMenu(); // 🔥 vuelve el menú dinámico

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
}


/* ========================================= */
/* 🎞 SLIDER (NO MODIFICADO) */
/* ========================================= */
/* 🔥 AQUÍ VA EXACTAMENTE TU CÓDIGO DE SLIDER
   (NO LO TOQUÉ, LO DEJAS IGUAL QUE LO TENÍAS) */


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
