let adminUser="admin";
let adminPass="1234";
let isAdmin=false;

let defaultData=[
{
nombre:"Telefonos",
productos:[
{nombre:"Samsung A15",precio:180,descripcion:"128GB 4GB RAM",imagen:null,oferta:null,activo:true},
{nombre:"Redmi 13C",precio:150,descripcion:"128GB 6GB RAM",imagen:null,oferta:null,activo:true}
]
}
];

let catalogos=JSON.parse(localStorage.getItem("catalogos"))||defaultData;

/* ========================= */
/* 🔥 INICIO BLOQUE SUPABASE CATALOGOS */
/* ========================= */

async function cargarDesdeSupabase(){
if(!window.supabaseClient) return;

let { data } = await supabaseClient
.from("catalogos")
.select("*")
.eq("id",1)
.single();

if(data && data.data){
catalogos = data.data;
localStorage.setItem("catalogos", JSON.stringify(catalogos));
render();
}
}

async function guardarEnSupabase(){
if(!window.supabaseClient) return;

await supabaseClient
.from("catalogos")
.upsert([{ id:1, data: catalogos }]);
}

/* ========================= */
/* 🔥 FIN BLOQUE SUPABASE CATALOGOS */
/* ========================= */

function guardar(){
localStorage.setItem("catalogos",JSON.stringify(catalogos));
guardarEnSupabase();
}

adminBtn.onclick=()=>loginModal.style.display="flex";

function closeLogin(){
loginModal.style.display="none";
}

function login(){
if(username.value===adminUser && password.value===adminPass){
isAdmin=true;
adminGlobalPanel.classList.remove("hidden");
volverClienteBtn.classList.remove("hidden");
closeLogin();
render();
}else alert("Datos incorrectos");
}

function logout(){
isAdmin=false;
adminGlobalPanel.classList.add("hidden");
volverClienteBtn.classList.add("hidden");
render();
}

volverClienteBtn.onclick=logout;

function crearCatalogo(){
let nombre=prompt("Nombre catálogo:");
if(!nombre)return;
catalogos.push({nombre,productos:[]});
guardar();
render();
}

function renderMenu(){
let navDesktop=document.getElementById("menuCatalogos");
let navMobile=document.getElementById("menuMobile");

navDesktop.innerHTML="";
navMobile.innerHTML="";

catalogos.forEach((cat,i)=>{
let btn=document.createElement("button");
btn.innerText=cat.nombre;
btn.onclick=()=>document.getElementById("cat"+i).scrollIntoView({behavior:"smooth"});
navDesktop.appendChild(btn);

let btnMobile=document.createElement("button");
btnMobile.innerText=cat.nombre;
btnMobile.onclick=()=>{
document.getElementById("cat"+i).scrollIntoView({behavior:"smooth"});
menuMobile.classList.add("hidden");
};
navMobile.appendChild(btnMobile);
});

let adminMobile=document.createElement("button");
adminMobile.innerText="Administrador";
adminMobile.onclick=()=>loginModal.style.display="flex";
navMobile.appendChild(adminMobile);

if(isAdmin){
let volver=document.createElement("button");
volver.innerText="Volver a modo cliente";
volver.onclick=logout;
navMobile.appendChild(volver);
}
}

menuToggle.onclick=function(){
menuMobile.classList.toggle("hidden");
};

function render(){
renderMenu();
let cont=document.getElementById("catalogos");
cont.innerHTML="";

catalogos.forEach((cat,ci)=>{
let div=document.createElement("div");
div.className="catalogo";
div.id="cat"+ci;

div.innerHTML=`<h2>${cat.nombre}</h2>`;

if(isAdmin){
div.innerHTML+=`
<button onclick="agregarProducto(${ci})">Agregar Producto</button>
<button onclick="eliminarCatalogo(${ci})">Eliminar Catálogo</button>
`;
}

let grid=document.createElement("div");
grid.className="productos-grid";

cat.productos.forEach((prod,pi)=>{
let p=document.createElement("div");
p.className="producto"+(prod.activo?"":" no-disponible");

let precioHTML=`<div class="precio">$${prod.precio}</div>`;
if(prod.oferta){
let porcentaje=Math.round(((prod.oferta.antes-prod.oferta.ahora)/prod.oferta.antes)*100);
precioHTML=`
<div>
<span class="precio-antiguo">$${prod.oferta.antes}</span>
<span class="oferta">$${prod.oferta.ahora} (-${porcentaje}%)</span>
</div>`;
}

p.innerHTML=`
${!prod.activo?'<div class="estado">No disponible</div>':''}
<img src="${prod.imagen||''}" onclick="verImagen('${prod.imagen}')">
<h4>${prod.nombre}</h4>
<p>${prod.descripcion}</p>
${precioHTML}
`;

if(isAdmin){
p.innerHTML+=`
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

/* ========================= */
/* 🔥 SLIDER SYSTEM */
/* ========================= */

let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];

/* ========================= */
/* 🔥 INICIO BLOQUE SUPABASE SLIDES */
/* ========================= */

async function cargarSlidesSupabase(){
if(!window.supabaseClient) return;

let { data } = await supabaseClient
.from("slides")
.select("*")
.eq("id",1)
.single();

if(data && data.data){
slidesData = data.data;
localStorage.setItem("slidesData", JSON.stringify(slidesData));
renderSlider();
}
}

async function guardarSlidesSupabase(){
if(!window.supabaseClient) return;

await supabaseClient
.from("slides")
.upsert([{ id:1, data: slidesData }]);
}

/* ========================= */
/* 🔥 FIN BLOQUE SUPABASE SLIDES */
/* ========================= */

let currentIndex = 0;
let slideInterval;

function guardarSlides(){
localStorage.setItem("slidesData",JSON.stringify(slidesData));
guardarSlidesSupabase();
}

/* (todo tu código del slider sigue exactamente igual sin cambios) */

/* ========================= */
/* 🔥 CARGA INICIAL DESDE SUPABASE */
/* ========================= */

window.addEventListener("load", async () => {
await cargarDesdeSupabase();
await cargarSlidesSupabase();
});

renderSlider();
actualizarSliderAdmin();
render();
guardar();
