/* ==========================================================
   DASHBOARD SEMA
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /*=====================================
      SELECTOR DE ÁNIMO
    =====================================*/

    const cont = document.getElementById("animo-selector");

    if (cont) {

        const guardado = localStorage.getItem("sema-animo");

        cont.querySelectorAll(".animo-btn").forEach(b => {

            if (b.dataset.animo === guardado) {
                b.classList.add("activo");
            }

            b.addEventListener("click", () => {

                cont.querySelectorAll(".animo-btn").forEach(x => x.classList.remove("activo"));

                b.classList.add("activo");

                localStorage.setItem("sema-animo", b.dataset.animo);

                SEMA.toast("Ánimo registrado: " + b.dataset.animo + " ✨");

            });

        });

    }

    /*=====================================
      MENÚ DEL USUARIO
    =====================================*/

    const userMenu = document.querySelector(".user-menu");
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");

    if (!userMenu || !userMenuBtn || !userDropdown) return;

    userMenuBtn.addEventListener("click", function (e) {

        e.stopPropagation();

        userMenu.classList.toggle("active");

    });

    document.addEventListener("click", function (e) {

        if (!userMenu.contains(e.target)) {

            userMenu.classList.remove("active");

        }

    });

    userDropdown.addEventListener("click", function (e) {

        e.stopPropagation();

    });

    document.addEventListener("keydown", function (e) {

        if (e.key === "Escape") {

            userMenu.classList.remove("active");

        }

    });

});