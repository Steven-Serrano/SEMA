# SEMA — Comunicación que Sana

Plataforma web de salud mental juvenil

## Estructura de carpetas


```
sema/
├── index.html            # Página de inicio
├── login.html            # Página de inicio de sesion
├── register.html         # Página de crear cuenta
├── dashboard.html        # Panel del usuario
├── chat.html             # Mensajería
├── psicologos.html       # Directorio de profesionales
├── seguimiento.html      # Seguimiento emocional
├── citas.html            # Reserva y gestión de citas
├── comunidad.html        # Foro comunitario
├── css/
│   └── styles.css        # Sistema de diseño y estilos
├── js/
│   ├── app.js            # Tema oscuro, menú, toasts
│   ├── layout.js         # Navbar y footer reutilizables
│   ├── dashboard.js      # Selector de ánimo
│   └── chat.js           # Lógica de mensajería
│   └── login.js          # Lógica de inicio de sesion
│   └── register.js       # Lógica de registro de cuenta nueva
├── assets/
│   ├── logo.png          # Logo de SEMA
│   └── hero.jpg          # Ilustración principal
└── README.md
```

## Cómo usar

Abre `index.html` en cualquier navegador moderno. No requiere build ni servidor.

## Paleta

- Azul principal: `#2563EB`
- Verde secundario: `#10B981`
- Blanco: `#FFFFFF`
- Gris claro: `#F8FAFC`
- Gris oscuro: `#1E293B`

## Características

- Diseño responsive (escritorio y portátiles).
- Modo claro y oscuro (persistente en `localStorage`).
- Bordes redondeados, sombras suaves y animaciones sutiles.
- Componentes reutilizables (navbar, footer, tarjetas, chips, botones).
- Accesibilidad: HTML semántico, `aria-labels`, focus visible.
- Tipografía: Sora (títulos) + Inter (texto).

## Buenas prácticas aplicadas

- Variables CSS para tokens de diseño (colores, radios, sombras, transiciones).
- CSS organizado por secciones con comentarios claros.
- JS modular por página, sin frameworks.
- HTML semántico (`header`, `nav`, `main`, `section`, `article`, `footer`).
- Comentarios explicativos en cada archivo.
