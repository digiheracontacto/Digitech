/* builder.js */
/* ========================================= */
/* 🚀 DIGIHERA VISUAL BUILDER PRO */
/* conectado al mismo supabaseClient */
/* ========================================= */

let builderData = [];
let builderRowId = null;
let builderTimers = {};

/* ========================================= */
/* 📦 CARGAR */
/* ========================================= */
async function cargarBuilderSupabase(){

if(!window.supabaseClient) return;

const {data,error} = await supabaseClient
.from("builder_content")
.select("*")
.limit(1);

if(data && data.length>0){
builderData = data[0].data || [];
builderRowId = data[0].id;
}

renderBuilder();

}

/* ========================================= */
/* 💾 GUARDAR */
/* ========================================= */
async function guardarBuilderSupabase(){

if(!window.supabaseClient) return;

if(builderRowId){

await supabaseClient
.from("builder_content")
.update({
data:builderData
})
.eq("id",builderRowId);

}else{

const {data} = await supabaseClient
.from("builder_content")
.insert([{
data:builderData
}])
.select();

if(data && data.length>0){
builderRowId = data[0].id;
}

}

renderBuilder();

}

/* ========================================= */
/* 📍 CONTENEDOR */
/* ========================================= */
function crearBuilderContainer(){

if(document.getElementById("builderContent")) return;

const div = document.createElement("div");
div.id = "builderContent";

const main = document.querySelector("main");

if(main){
main.prepend(div);
}else{
document.body.appendChild(div);
}

}

/* ========================================= */
/* 🎛 PANEL ADMIN */
/* ========================================= */
function crearPanelBuilder(){

if(document.getElementById("builderPanel")) return;

const panel = document.createElement("div");

panel.id = "builderPanel";

panel.innerHTML = `
<button id="btnBuilderAdmin">🎨 Constructor</button>
`;

document.body.appendChild(panel);

document
.getElementById("btnBuilderAdmin")
.onclick = abrirMenuBuilder;

if(!isAdmin){
panel.style.display = "none";
}

}

/* ========================================= */
/* MENU */
/* ========================================= */
function abrirMenuBuilder(){

if(!isAdmin){
alert("Solo admin");
return;
}

const tipo = prompt(
`1 Texto
2 Imagen
3 Video
4 YouTube
5 Eliminar Bloque`
);

if(tipo==="1") agregarTextoBuilder();
if(tipo==="2") agregarImagenBuilder();
if(tipo==="3") agregarVideoLocalBuilder();
if(tipo==="4") agregarYoutubeBuilder();
if(tipo==="5") eliminarBloqueBuilder();

}

/* ========================================= */
/* 📝 TEXTO */
/* ========================================= */
function agregarTextoBuilder(){

const texto = prompt("Texto:");
if(!texto) return;

const color = prompt("Color (#fff):","#ffffff");
const size = prompt("Tamaño px:", "32");
const align = prompt("left / center / right","center");
const fondo = prompt("Fondo color o vacío","#00000000");
const grad = confirm("¿Degradado texto?");
const sombra = confirm("¿Sombra?");
const radius = prompt("Redondeado px","12");

builderData.push({
tipo:"texto",
texto:texto,
color:color,
size:size,
align:align,
fondo:fondo,
grad:grad,
sombra:sombra,
radius:radius
});

guardarBuilderSupabase();

}

/* ========================================= */
/* 🖼 IMAGEN */
/* ========================================= */
async function agregarImagenBuilder(){

const input = document.createElement("input");
input.type = "file";
input.accept = "image/*";
input.multiple = true;

input.onchange = async(e)=>{

const files = [...e.target.files];
if(files.length===0) return;

let urls = [];

for(const file of files){

const fileName =
"builder_img_" +
Date.now() + "_" +
Math.floor(Math.random()*999999) +
".jpg";

const { error } = await supabaseClient.storage
.from("productos")
.upload(fileName,file,{upsert:true});

if(error){
alert("Error subiendo imagen: " + error.message);
continue;
}

const { data } = supabaseClient.storage
.from("productos")
.getPublicUrl(fileName);

urls.push(data.publicUrl);

}

builderData.push({
tipo:"imagenes",
lista:urls,
alto:420,
radius:16,
auto:false,
segundos:3,
actual:0
});

guardarBuilderSupabase();

};

input.click();

}
/* ========================================= */
/* 🎥 VIDEO LOCAL */
/* ========================================= */
async function agregarVideoLocalBuilder(){

const input = document.createElement("input");
input.type="file";
input.accept="video/*";
input.multiple=true;

input.onchange = async(e)=>{

const files = [...e.target.files];
if(files.length===0) return;

let urls=[];

for(const file of files){

const fileName =
"builder_video_" +
Date.now() + "_" +
Math.floor(Math.random()*999999) +
"_" + file.name;

const { error } = await supabaseClient.storage
.from("slides")
.upload(fileName,file,{upsert:true});

if(error){
alert(error.message);
continue;
}

const { data } = supabaseClient.storage
.from("slides")
.getPublicUrl(fileName);

urls.push(data.publicUrl);

}

builderData.push({
tipo:"videos",
lista:urls,
actual:0,
controls:true,
autoplay:false,
loop:false,
muted:false
});

guardarBuilderSupabase();

};

input.click();

}

/* ========================================= */
/* ▶️ YOUTUBE */
/* ========================================= */
function agregarYoutubeBuilder(){

const link = prompt("Pega link YouTube:");
if(!link) return;

let embed = convertirYoutube(link);

const autoplay = confirm("Autoplay?");
const loop = confirm("Loop?");
const muted = confirm("Muted?");

builderData.push({
tipo:"youtube",
lista:[embed],
autoplay,
loop,
muted
});

guardarBuilderSupabase();

}

function convertirYoutube(url){

let id = "";

if(url.includes("watch?v=")){
id = url.split("watch?v=")[1].split("&")[0];
}else if(url.includes("youtu.be/")){
id = url.split("youtu.be/")[1];
}

return "https://www.youtube.com/embed/"+id;

}

/* ========================================= */
/* ❌ ELIMINAR */
/* ========================================= */
function eliminarBloqueBuilder(){

if(builderData.length===0){
alert("No hay bloques");
return;
}

let txt = "Índice a eliminar:\n";

builderData.forEach((b,i)=>{
txt += i+" - "+b.tipo+"\n";
});

const id = parseInt(prompt(txt));

if(isNaN(id)) return;

builderData.splice(id,1);

guardarBuilderSupabase();

}

/* ========================================= */
/* 🎨 RENDER */
/* ========================================= */
function renderBuilder(){

crearBuilderContainer();

const cont = document.getElementById("builderContent");

if(!cont) return;

cont.innerHTML="";

builderData.forEach((item,index)=>{

if(isAdmin){
const tools = document.createElement("div");
tools.innerHTML = `
<button onclick="subirBloque(${index})">⬆</button>
<button onclick="bajarBloque(${index})">⬇</button>
<button onclick="editarBloque(${index})">✏</button>
<button onclick="eliminarBloqueDirecto(${index})">🗑</button>
`;
cont.appendChild(tools);
}

if(item.tipo==="texto"){
renderTexto(cont,item);
}

if(item.tipo==="imagenes"){
renderImagenes(cont,item,index);
}

if(item.tipo==="videos"){
renderVideos(cont,item,index);
}

if(item.tipo==="youtube"){
renderYoutube(cont,item,index);
}

});

}

/* ========================================= */
/* TEXTO */
/* ========================================= */
function renderTexto(cont,item){

const div = document.createElement("div");

div.style.padding="20px";
div.style.margin="20px 0";
div.style.borderRadius=item.radius+"px";
div.style.textAlign=item.align;
div.style.background=item.fondo;

if(item.grad){
div.style.backgroundImage=
"linear-gradient(90deg,#3b82f6,#9333ea)";
div.style.webkitBackgroundClip="text";
div.style.webkitTextFillColor="transparent";
}

div.style.fontSize=item.size+"px";
div.style.color=item.color;
div.style.fontWeight="bold";

if(item.sombra){
div.style.textShadow="0 0 20px rgba(0,0,0,.4)";
}

div.innerText=item.texto;

cont.appendChild(div);

}

/* ========================================= */
/* IMAGENES */
/* ========================================= */
function renderImagenes(cont,item,index){

const box = document.createElement("div");
box.className="builderSlider";

box.innerHTML=`
<button onclick="builderPrev(${index})">◀</button>
<img id="builderImg${index}" src="${item.lista[0]}">
<button onclick="builderNext(${index})">▶</button>
`;

box.style.display="flex";
box.style.alignItems="center";
box.style.gap="8px";
box.style.margin="20px 0";

const img = box.querySelector("img");
img.style.width="100%";
img.style.maxHeight=item.alto+"px";
img.style.objectFit="cover";
img.style.borderRadius=item.radius+"px";

cont.appendChild(box);

item.actual = 0;

if(item.auto){
if(builderTimers[index]){
clearInterval(builderTimers[index]);
}

builderTimers[index] = setInterval(()=>{
builderNext(index);
},parseInt(item.segundos)*1000);

}

/* ========================================= */
/* VIDEOS */
/* ========================================= */
function renderVideos(cont,item,index){

const box = document.createElement("div");
box.className = "builderBox";

box.innerHTML = `
<button onclick="builderPrev(${index})">◀</button>

<video id="builderVideo${index}"
width="100%"
${item.controls ? "controls":""}
${item.autoplay ? "autoplay":""}
${item.loop ? "loop":""}
${item.muted ? "muted":""}
playsinline>
</video>

<button onclick="builderNext(${index})">▶</button>
`;

box.style.display="flex";
box.style.alignItems="center";
box.style.gap="10px";
box.style.margin="20px 0";

cont.appendChild(box);

const vid = document.getElementById("builderVideo"+index);
vid.src = item.lista[0];

}
/* ========================================= */
/* YOUTUBE */
/* ========================================= */
function renderYoutube(cont,item,index){

const box = document.createElement("div");

const src =
item.lista[0]+
`?autoplay=${item.autoplay?1:0}&mute=${item.muted?1:0}&loop=${item.loop?1:0}`;

box.innerHTML=`
<iframe
width="100%"
height="450"
src="${src}"
allowfullscreen
style="border:none;border-radius:16px">
</iframe>
`;

box.style.margin="20px 0";

cont.appendChild(box);

}

/* ========================================= */
/* FLECHAS */
/* ========================================= */
function builderNext(index){

const item = builderData[index];

item.actual++;

if(item.actual>=item.lista.length){
item.actual=0;
}

actualizarBuilderMedia(index,item);

}

function builderPrev(index){

const item = builderData[index];

item.actual--;

if(item.actual<0){
item.actual=item.lista.length-1;
}

actualizarBuilderMedia(index,item);

}

function actualizarBuilderMedia(index,item){

if(item.tipo==="imagenes"){

const img =
document.getElementById("builderImg"+index);

if(img){
img.src = item.lista[item.actual];
}

}

if(item.tipo==="videos"){

const vid =
document.getElementById("builderVideo"+index);

if(vid){
vid.src = item.lista[item.actual];
vid.load();
vid.play();
}

}

}

/* ========================================= */
/* 🔴 REALTIME */
/* ========================================= */
supabaseClient
.channel("builder_changes")
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"builder_content"
},
()=>{
cargarBuilderSupabase();
}
)
.subscribe();

/* ========================================= */
/* 🚀 LOAD */
/* ========================================= */
document.addEventListener("DOMContentLoaded", async () => {

try{

crearPanelBuilder();

await cargarBuilderSupabase();

}catch(error){

console.log("Builder error:", error);

}

});

/* ========================================= */
/* Nuevas funciones de edicion */
/* ========================================= */

function subirBloque(i){
if(i===0) return;
[builderData[i],builderData[i-1]] =
[builderData[i-1],builderData[i]];
guardarBuilderSupabase();
}

function bajarBloque(i){
if(i>=builderData.length-1) return;
[builderData[i],builderData[i+1]] =
[builderData[i+1],builderData[i]];
guardarBuilderSupabase();
}

function eliminarBloqueDirecto(i){
builderData.splice(i,1);
guardarBuilderSupabase();
}

function editarBloque(i){

const item = builderData[i];

if(item.tipo==="texto"){

item.texto = prompt("Texto:",item.texto);
item.color = prompt("Color:",item.color);
item.size = prompt("Tamaño:",item.size);

}

guardarBuilderSupabase();

}
