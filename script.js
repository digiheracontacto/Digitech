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
/* 🔐 LOGIN */
/* ========================================= */

adminBtn.onclick = () => loginModal.style.display = "flex";

function closeLogin() {
  loginModal.style.display = "none";
}

function login() {
  if (username.value === adminUser && password.value === adminPass) {
    isAdmin = true;
    adminGlobalPanel.classList.remove("hidden");
    volverClienteBtn.classList.remove("hidden");
    closeLogin();
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
/* 🧭 MENU */
/* ========================================= */

function renderMenu() {
  let navDesktop = document.getElementById("menuCatalogos");
  let navMobile = document.getElementById("menuMobile");

  navDesktop.innerHTML = "";
  navMobile.innerHTML = "";

  catalogos.forEach((cat, i) => {
    let btn = document.createElement("button");
    btn.innerText = cat.nombre;
    btn.onclick = () =>
      document.getElementById("cat" + i).scrollIntoView({ behavior: "smooth" });
    navDesktop.appendChild(btn);

    let btnMobile = document.createElement("button");
    btnMobile.innerText = cat.nombre;
    btnMobile.onclick = () => {
      document.getElementById("cat" + i).scrollIntoView({ behavior: "smooth" });
      menuMobile.classList.add("hidden");
    };
    navMobile.appendChild(btnMobile);
  });

  let adminMobile = document.createElement("button");
  adminMobile.innerText = "Administrador";
  adminMobile.onclick = () => loginModal.style.display = "flex";
  navMobile.appendChild(adminMobile);

  if (isAdmin) {
    let volver = document.createElement("button");
    volver.innerText = "Volver a modo cliente";
    volver.onclick = logout;
    navMobile.appendChild(volver);
  }
}

menuToggle.onclick = function () {
  menuMobile.classList.toggle("hidden");
};

/* ========================================= */
/* 🖥 RENDER GENERAL */
/* ========================================= */

function render() {
  renderMenu();

  let cont = document.getElementById("catalogos");
  cont.innerHTML = "";

  catalogos.forEach((cat, ci) => {
    let div = document.createElement("div");
    div.className = "catalogo";
    div.id = "cat" + ci;

    div.innerHTML = `<h2>${cat.nombre}</h2>`;

    if (isAdmin) {
      div.innerHTML += `
        <button onclick="agregarProducto(${ci})">Agregar Producto</button>
        <button onclick="eliminarCatalogo(${ci})">Eliminar Catálogo</button>
      `;
    }

    let grid = document.createElement("div");
    grid.className = "productos-grid";

    cat.productos.forEach((prod) => {
      let p = document.createElement("div");
      p.className = "producto" + (prod.activo ? "" : " no-disponible");

      let precioHTML = `<div class="precio">$${prod.precio}</div>`;

      if (prod.oferta) {
        let porcentaje = Math.round(
          ((prod.oferta.antes - prod.oferta.ahora) / prod.oferta.antes) * 100
        );
        precioHTML = `
          <div>
            <span class="precio-antiguo">$${prod.oferta.antes}</span>
            <span class="oferta">$${prod.oferta.ahora} (-${porcentaje}%)</span>
          </div>`;
      }

      p.innerHTML = `
        ${!prod.activo ? '<div class="estado">No disponible</div>' : ""}
        <img src="${prod.imagen || ""}">
        <h4>${prod.nombre}</h4>
        <p>${prod.descripcion}</p>
        ${precioHTML}
      `;

      grid.appendChild(p);
    });

    div.appendChild(grid);
    cont.appendChild(div);
  });
}

/* ========================================= */
/* 🎞 SLIDER */
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

/* ========================================= */
/* 🚀 CARGA INICIAL CORRECTA */
/* ========================================= */

window.addEventListener("load", async () => {
  await cargarDesdeSupabase();
  await cargarSlidesSupabase();
  render();
  renderSlider();
});
