/*==========================================
        USUARIO GLOBAL - SEMA
==========================================*/

document.addEventListener("DOMContentLoaded",cargarUsuario);

function obtenerUsuario(){
return JSON.parse(localStorage.getItem("perfil-usuario"))||{};
}

function obtenerFoto(){
return localStorage.getItem("perfil-foto")||"assets/avatar-default.png";
}

function obtenerSaludo(){
const hora=new Date().getHours();
if(hora<12)return"Buenos días";
if(hora<19)return"Buenas tardes";
return"Buenas noches";
}

function cargarUsuario(){

const usuario=obtenerUsuario();
const foto=obtenerFoto();

const nombre=usuario.nombre||"Usuario SEMA";
const correo=usuario.correo||"usuario@sema.com";

document.querySelectorAll(".nombre-usuario").forEach(e=>e.textContent=nombre);

document.querySelectorAll(".correo-usuario").forEach(e=>e.textContent=correo);

document.querySelectorAll(".foto-usuario").forEach(img=>img.src=foto);

const saludo=document.getElementById("saludoUsuario");

if(saludo){
saludo.textContent=`${obtenerSaludo()}, ${nombre} 👋`;
}

document.title=document.title.replace(/^.*?·/,"")+` · ${nombre}`;

}

function actualizarUsuario(datos){
localStorage.setItem("perfil-usuario",JSON.stringify(datos));
cargarUsuario();
}

function actualizarFoto(base64){
localStorage.setItem("perfil-foto",base64);
cargarUsuario();
}

function eliminarFoto(){
localStorage.removeItem("perfil-foto");
cargarUsuario();
}

function cerrarSesion(){
localStorage.removeItem("perfil-usuario");
localStorage.removeItem("perfil-foto");
window.location.href="index.html";
}