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

function guardar(){
localStorage.setItem("catalogos",JSON.stringify(catalogos));
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

/* RESTO IGUAL */
function agregarProducto(ci){
let nombre=prompt("Nombre:");
let precio=parseFloat(prompt("Precio:"));
let descripcion=prompt("Descripción:");
if(!nombre||!precio)return;
catalogos[ci].productos.push({nombre,precio,descripcion,imagen:null,oferta:null,activo:true});
guardar();render();
}

function eliminarCatalogo(ci){
if(confirm("Eliminar catálogo?")){
catalogos.splice(ci,1);
guardar();render();
}
}

function editarProducto(ci,pi){
let prod=catalogos[ci].productos[pi];
let nuevoNombre=prompt("Nuevo nombre:",prod.nombre);
let nuevoPrecio=parseFloat(prompt("Nuevo precio:",prod.precio));
let nuevaDesc=prompt("Nueva descripción:",prod.descripcion);
if(nuevoNombre)prod.nombre=nuevoNombre;
if(nuevoPrecio)prod.precio=nuevoPrecio;
if(nuevaDesc)prod.descripcion=nuevaDesc;
guardar();render();
}

function crearOferta(ci,pi){
let antes=parseFloat(prompt("Precio antes:"));
let ahora=parseFloat(prompt("Precio ahora:"));
if(!antes||!ahora)return;
catalogos[ci].productos[pi].oferta={antes,ahora};
guardar();render();
}

function quitarOferta(ci,pi){
catalogos[ci].productos[pi].oferta=null;
guardar();render();
}

function cambiarEstado(ci,pi){
catalogos[ci].productos[pi].activo=!catalogos[ci].productos[pi].activo;
guardar();render();
}

function eliminarProducto(ci,pi){
if(confirm("Eliminar producto?")){
catalogos[ci].productos.splice(pi,1);
guardar();render();
}
}

function cambiarImagen(ci,pi){
let input=document.createElement("input");
input.type="file";
input.accept="image/*";
input.onchange=e=>{
let reader=new FileReader();
reader.onload=()=>{
catalogos[ci].productos[pi].imagen=reader.result;
guardar();render();
};
reader.readAsDataURL(e.target.files[0]);
};
input.click();
}

function verImagen(src){
if(!src)return;
imgPreview.src=src;
imgModal.style.display="flex";
}

imgModal.onclick=()=>imgModal.style.display="none";

buscadorGlobal.oninput=function(){
let texto=this.value.toLowerCase();
document.querySelectorAll(".producto").forEach(p=>{
let contenido=p.innerText.toLowerCase();
p.style.display=contenido.includes(texto)?"flex":"none";
});
};






/* ========================= */
/* 🔥 SLIDER SYSTEM */
/* ========================= */

let slidesData = JSON.parse(localStorage.getItem("slidesData")) || [];

let currentIndex = 0;
let slideInterval;

function guardarSlides(){
localStorage.setItem("slidesData",JSON.stringify(slidesData));
}

function renderSlider(){
let slider=document.getElementById("slider");
let sliderContainer=document.getElementById("sliderContainer");
let sliderAdmin=document.getElementById("sliderAdmin");

slider.innerHTML="";

/* 🔥 SI NO HAY SLIDES */
if(slidesData.length===0){

if(isAdmin){
sliderContainer.style.display="block";
slider.innerHTML=`
<div style="padding:60px;text-align:center;">
<h2>No hay imágenes en el Slider</h2>
<button onclick="restaurarSlider()">➕ Crear Nuevo Slider</button>
</div>
`;
}else{
sliderContainer.style.display="none";
}

return;
}

/* SI HAY SLIDES */
sliderContainer.style.display="block";

slidesData.forEach((slide,i)=>{
let div=document.createElement("div");
div.className="slide";

div.innerHTML=`
<img src="${slide.imagen}">
<div class="slide-info">
<h2>${slide.texto}</h2>
${isAdmin ? `
<button onclick="editarSlide(${i})">Editar</button>
<button onclick="eliminarSlide(${i})">Eliminar</button>
` : ""}
</div>
`;

slider.appendChild(div);
});

startSlider();
}

function showSlide(){
let slider=document.getElementById("slider");
slider.style.transform=`translateX(-${currentIndex*100}%)`;
}

function nextSlide(){
if(slidesData.length===0) return;
currentIndex++;
if(currentIndex>=slidesData.length){
currentIndex=0;
}
showSlide();
restartAuto();
}

function prevSlide(){
if(slidesData.length===0) return;
currentIndex--;
if(currentIndex<0){
currentIndex=slidesData.length-1;
}
showSlide();
restartAuto();
}

function startSlider(){
clearInterval(slideInterval);
if(slidesData.length===0) return;

slideInterval=setInterval(()=>{
currentIndex++;
if(currentIndex>=slidesData.length){
currentIndex=0;
}
showSlide();
}, slidesData[currentIndex]?.duracion || 4000);
}

function restartAuto(){
clearInterval(slideInterval);
startSlider();
}

function agregarSlide(){
let input=document.createElement("input");
input.type="file";
input.accept="image/*";
input.onchange=e=>{
let reader=new FileReader();
reader.onload=()=>{
let texto=prompt("Texto del slide:");
let duracion=parseInt(prompt("Duración en segundos:"))*1000;

slidesData.push({
imagen:reader.result,
texto:texto||"",
duracion:duracion||4000
});

guardarSlides();
renderSlider();
};
reader.readAsDataURL(e.target.files[0]);
};
input.click();
}

/* 🔥 NUEVA FUNCIÓN RESTAURAR SLIDER */
function restaurarSlider(){
let input=document.createElement("input");
input.type="file";
input.accept="image/*";
input.onchange=e=>{
let reader=new FileReader();
reader.onload=()=>{
let texto=prompt("Texto del nuevo slider:");
let duracion=parseInt(prompt("Duración en segundos:"))*1000;

slidesData=[{
imagen:reader.result,
texto:texto||"",
duracion:duracion||4000
}];

guardarSlides();
renderSlider();
};
reader.readAsDataURL(e.target.files[0]);
};
input.click();
}

function editarSlide(i){
let nuevoTexto=prompt("Editar texto:",slidesData[i].texto);
let nuevaDuracion=parseInt(prompt("Duración en segundos:",slidesData[i].duracion/1000))*1000;

if(nuevoTexto!==null) slidesData[i].texto=nuevoTexto;
if(nuevaDuracion) slidesData[i].duracion=nuevaDuracion;

guardarSlides();
renderSlider();
}

function eliminarSlide(i){
if(confirm("Eliminar slide?")){
slidesData.splice(i,1);
guardarSlides();
renderSlider();
}
}

/* Mostrar botón admin slider */
function actualizarSliderAdmin(){
let sliderAdmin=document.getElementById("sliderAdmin");
if(isAdmin){
sliderAdmin.classList.remove("hidden");
}else{
sliderAdmin.classList.add("hidden");
}
}

/* INTEGRAR CON TU LOGIN */
const originalLogin = login;
login = function(){
originalLogin();
actualizarSliderAdmin();
renderSlider();
}

const originalLogout = logout;
logout = function(){
originalLogout();
actualizarSliderAdmin();
renderSlider();
}

renderSlider();
actualizarSliderAdmin();



render();
guardar();