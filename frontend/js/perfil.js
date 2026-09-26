/*==========================================
        PERFIL - SEMA
==========================================*/

document.addEventListener("DOMContentLoaded",()=>{

const tabs=document.querySelectorAll(".perfil-tab");
const panels=document.querySelectorAll(".perfil-panel");

const ultimaTab=localStorage.getItem("perfil-tab")||"informacion";

tabs.forEach(tab=>{
tab.classList.toggle("activo",tab.dataset.tab===ultimaTab);
tab.addEventListener("click",()=>cambiarTab(tab.dataset.tab));
});

panels.forEach(panel=>{
panel.classList.toggle("activo",panel.id===ultimaTab);
});

cargarDatos();

const guardar=document.getElementById("guardarPerfil");

if(guardar){
guardar.addEventListener("click",guardarPerfil);
}

const inputFoto=document.getElementById("fotoPerfil");

if(inputFoto){
inputFoto.addEventListener("change",cambiarFoto);
}

const eliminar=document.getElementById("eliminarFoto");

if(eliminar){
eliminar.addEventListener("click",eliminarFotoPerfil);
}

});

/*==========================================
        CAMBIAR PESTAÑA
==========================================*/

function cambiarTab(tab){

document.querySelectorAll(".perfil-tab").forEach(btn=>{
btn.classList.remove("activo");
});

document.querySelectorAll(".perfil-panel").forEach(panel=>{
panel.classList.remove("activo");
});

const boton=document.querySelector(`.perfil-tab[data-tab="${tab}"]`);
const panel=document.getElementById(tab);

if(boton)boton.classList.add("activo");
if(panel)panel.classList.add("activo");

localStorage.setItem("perfil-tab",tab);

}

/*==========================================
        GUARDAR PERFIL
==========================================*/

function guardarPerfil(){

const datos={
nombre:document.getElementById("nombre")?.value||"",
correo:document.getElementById("correo")?.value||"",
documento:document.getElementById("documento")?.value||"",
telefono:document.getElementById("telefono")?.value||"",
ciudad:document.getElementById("ciudad")?.value||"",
nacimiento:document.getElementById("fechaNacimiento")?.value||"",
genero:document.getElementById("genero")?.value||"",
bio:document.getElementById("biografia")?.value||""
};

actualizarUsuario(datos);

if(typeof SEMA!=="undefined"){
SEMA.toast("Perfil actualizado correctamente 💙");
}

}

/*==========================================
        CARGAR PERFIL
==========================================*/

function cargarDatos(){

const usuario=obtenerUsuario();

if(document.getElementById("nombre"))document.getElementById("nombre").value=usuario.nombre||"";
if(document.getElementById("correo"))document.getElementById("correo").value=usuario.correo||"";
if(document.getElementById("documento"))document.getElementById("documento").value=usuario.documento||"";
if(document.getElementById("telefono"))document.getElementById("telefono").value=usuario.telefono||"";
if(document.getElementById("ciudad"))document.getElementById("ciudad").value=usuario.ciudad||"";
if(document.getElementById("fechaNacimiento"))document.getElementById("fechaNacimiento").value=usuario.nacimiento||"";
if(document.getElementById("genero"))document.getElementById("genero").value=usuario.genero||"";
if(document.getElementById("biografia"))document.getElementById("biografia").value=usuario.bio||"";

const foto=obtenerFoto();

const preview=document.getElementById("previewFoto");
const grande=document.getElementById("fotoGrande");

if(preview)preview.src=foto;
if(grande)grande.src=foto;

}

/*==========================================
        CAMBIAR FOTO
==========================================*/

function cambiarFoto(e){

const archivo=e.target.files[0];

if(!archivo)return;

const reader=new FileReader();

reader.onload=function(ev){

actualizarFoto(ev.target.result);

const preview=document.getElementById("previewFoto");
const grande=document.getElementById("fotoGrande");

if(preview)preview.src=ev.target.result;
if(grande)grande.src=ev.target.result;

if(typeof SEMA!=="undefined"){
SEMA.toast("Foto actualizada 📷");
}

};

reader.readAsDataURL(archivo);

}

/*==========================================
        ELIMINAR FOTO
==========================================*/

function eliminarFotoPerfil(){

eliminarFoto();

const defecto="assets/avatar-default.png";

const preview=document.getElementById("previewFoto");
const grande=document.getElementById("fotoGrande");

if(preview)preview.src=defecto;
if(grande)grande.src=defecto;

if(typeof SEMA!=="undefined"){
SEMA.toast("Foto eliminada");
}

}