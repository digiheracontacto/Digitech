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

    localStorage.setItem(
      "catalogos",
      JSON.stringify(catalogos)
    );

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

  localStorage.setItem(
    "catalogos",
    JSON.stringify(catalogos)
  );

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

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

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
/* 🖼 SUBIR IMAGEN PRODUCTO */
/* ========================================= */

async function cambiarImagen(ci, pi) {

  let input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {

    let file = e.target.files[0];
    if (!file) return;

    let blob = await comprimirImagen(file);

    let fileName =
      "producto_" + Date.now() + ".jpg";

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

    catalogos[ci]
      .productos[pi]
      .imagen = data.publicUrl;

    guardar();
    render();
  };

  input.click();
}


/* ========================================= */
/* 🔐 LOGIN */
/* ========================================= */

adminBtn.onclick =
  () => loginModal.style.display = "flex";

function closeLogin() {
  loginModal.style.display = "none";
}

function login() {

  if (
    username.value === adminUser &&
    password.value === adminPass
  ) {

    isAdmin = true;

    adminGlobalPanel
      .classList.remove("hidden");

    volverClienteBtn
      .classList.remove("hidden");

    closeLogin();
    render();
    renderSlider();

  } else {
    alert("Datos incorrectos");
  }
}

function logout() {

  isAdmin = false;

  adminGlobalPanel
    .classList.add("hidden");

  volverClienteBtn
    .classList.add("hidden");

  render();
  renderSlider();
}

volverClienteBtn.onclick = logout;


/* ========================================= */
/* 📁 CATALOGOS */
/* ========================================= */

function crearCatalogo() {

  let nombre = prompt("Nombre catálogo:");
  if (!nombre) return;

  catalogos.push({
    nombre,
    productos: []
  });

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

  let nombre = prompt("Nombre:");
  let precio = parseFloat(
    prompt("Precio:")
  );
  let descripcion = prompt(
    "Descripción:"
  );

  if (!nombre || !precio) return;

  catalogos[ci]
    .productos
    .push({
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

  let cont =
    document.getElementById("catalogos");

  cont.innerHTML = "";

  catalogos.forEach((cat, ci) => {

    let div = document.createElement("div");
    div.className = "catalogo";
    div.id = "cat" + ci;

    div.innerHTML =
      `<h2>${cat.nombre}</h2>`;

    if (isAdmin) {

      div.innerHTML += `
        <button onclick="agregarProducto(${ci})">
          Agregar Producto
        </button>
        <button onclick="eliminarCatalogo(${ci})">
          Eliminar Catálogo
        </button>
      `;
    }

    let grid =
      document.createElement("div");

    grid.className =
      "productos-grid";

    cat.productos.forEach(
      (prod, pi) => {

        let p =
          document.createElement("div");

        p.className =
          "producto";

        p.innerHTML = `
          <img src="${prod.imagen || ""}">
          <h4>${prod.nombre}</h4>
          <p>${prod.descripcion}</p>
          <div class="precio">$${prod.precio}</div>
        `;

        if (isAdmin) {

          p.innerHTML += `
            <button onclick="cambiarImagen(${ci},${pi})">
              Imagen
            </button>
            <button onclick="eliminarProducto(${ci},${pi})">
              Eliminar
            </button>
          `;
        }

        grid.appendChild(p);
      }
    );

    div.appendChild(grid);
    cont.appendChild(div);
  });
}


/* ========================================= */
/* 🎞 SLIDER */
/* ========================================= */

let slidesData =
  JSON.parse(
    localStorage.getItem("slidesData")
  ) || [];

let slidesRowId = null;

async function cargarSlidesSupabase() {

  if (!window.supabaseClient) return;

  let { data } =
    await supabaseClient
      .from("slides")
      .select("*")
      .limit(1);

  if (data && data.length > 0) {

    slidesData = data[0].data;
    slidesRowId = data[0].id;

    localStorage.setItem(
      "slidesData",
      JSON.stringify(slidesData)
    );
  }
}

function renderSlider() {

  let slider =
    document.getElementById("slider");

  if (!slider) return;

  slider.innerHTML = "";

  slidesData.forEach(
    (slide, i) => {

      let div =
        document.createElement("div");

      div.className = "slide";

      div.innerHTML = `
        <img src="${slide.imagen}">
        <div class="slide-info">
          <h2>${slide.texto || ""}</h2>
          ${
            isAdmin ?
            `<button onclick="editarSlide(${i})">
              Editar
            </button>
            <button onclick="eliminarSlide(${i})">
              Eliminar
            </button>`
            : ""
          }
        </div>
      `;

      slider.appendChild(div);
    }
  );
}


/* ========================================= */
/* 🚀 CARGA INICIAL */
/* ========================================= */

window.addEventListener(
  "load",
  async () => {

    await cargarDesdeSupabase();
    await cargarSlidesSupabase();

    render();
    renderSlider();
  }
);
