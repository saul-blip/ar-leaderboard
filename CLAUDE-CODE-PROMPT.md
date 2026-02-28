# Auto Republic — Global Sales Score Leaderboard

## Instrucciones para Claude Code

Crea un proyecto React + Vite deployable a Vercel con el siguiente leaderboard de ventas para Auto Republic LLC (car dealership).

## Estructura del App

Dashboard de ventas con dos columnas: **CLOSERS** (izquierda) y **SETTERS** (derecha). Cada columna tiene un podio top 3 con corona para el #1, y lista del 4 en adelante. Click en cualquier persona abre un panel de KPIs detallado con funnel visual.

## Lógica de Negocio (MUY IMPORTANTE)

- Closers y Setters se trackean de forma **independiente** — sus ventas NO se suman ni se deducen entre sí
- Un closer puede tener ventas que no vienen de setters (self-gen, walk-ins)
- Un setter puede tener ventas que no aparecen en closers activos (cerradas por manager o closer que ya no está)
- Las ventas totales de cada grupo son independientes

## KPIs por Rol

### CLOSERS
- **Ventas cerradas**: desglosadas en Self-Gen + Call Center
- **Sits**: aprobados que sentó a cerrar
- **Citas propias**: citas que generó el closer
- **Visitas propias**: visitas al dealer de sus citas
- **Calidad**: cuántos aplicaron crédito, cuántos aprobados, cuántos negados
- **Efectividad de cierre**: ventas / sits (métrica principal)
- **Efectividad cita→visita**: visitas propias / citas propias
- **Tasa de aprobación**: aprobados / aplicaron

**Funnel del Closer:**
Citas Propias → Visitas Propias → Sits (Aprobados Sentados) → Aplicaron Crédito → Aprobados → Ventas Cerradas

### SETTERS
- **Leads nuevos asignados**: leads de marketing sin tocar que caen en rotación
- **Contactados**: leads que logró contactar
- **Citas agendadas**: citas que sacó de esos leads
- **Shows**: visitas completadas al dealer
- **Ventas**: ventas atribuidas al setter
- **Calidad**: aplicaron crédito, aprobados, negados
- **Lead → Cita** (métrica de rotación, la MÁS importante del setter)
- **Show rate**: shows / citas agendadas
- **Tasa de aprobación**: aprobados / aplicaron

**Funnel del Setter:**
Leads Nuevos Asignados → Contactados → Citas Agendadas → Shows → Aplicaron Crédito → Aprobados → Ventas

## Vista Principal (Leaderboard)

- Header con logo AR, "GLOBAL SALES SCORE", badge LIVE, mes/año actual
- 4 stats globales: Ventas Closers, Ventas Setters, Efect. Closers (ventas/sits), Lead→Cita (equipo setter)
- Dos columnas: CLOSERS y SETTERS
- Cada columna muestra: título, total ventas, stat boxes (sits/shows + efectividad), y para setters también Lead→Cita del equipo
- Podio top 3 con avatares (foto o iniciales), ventas, denominador, y "efectividad X%"
- Lista del 4+ con avatar, nombre, efectividad, ventas, denominador
- Click en cualquier persona abre panel de KPIs

## Panel de KPIs (al hacer click en un rep)

Modal/overlay con:
- Avatar grande, nombre, badge CLOSER/SETTER
- Métrica hero grande (Closers: efectividad de cierre, Setters: Lead→Cita)
- Secciones de stats agrupadas por categoría
- Funnel visual completo con barras de progreso y porcentajes paso a paso
- Colores de efectividad: verde ≥60%, amarillo ≥35%, rojo <35%

## Funcionalidades

### Autenticación por PIN
- Botón "🔐 Editar" pide PIN
- Roles: owner (1234), manager (5678), admin (0000)
- Muestra rol autenticado en footer

### Editor
- Modal con tabs Closers/Setters
- Grid editable con todos los campos de KPI
- Campo de URL de foto por persona
- Agregar/eliminar personas
- Botón guardar

### Modo TV
- Botón 📺 para pantalla de oficina
- Oculta botón de editar
- Optimizado para display en TV

### Avatares
- Si tiene URL de foto: muestra la imagen circular
- Si no tiene foto: muestra iniciales con gradiente de color único por nombre

## Datos de Ejemplo (cargar por default)

### Closers:
| Nombre | Self-Gen | Call Center | Sits | Citas P. | Visitas P. | Aplicaron | Aprobados | Negados |
|--------|----------|-------------|------|----------|------------|-----------|-----------|---------|
| Juan Rodriguez | 3 | 5 | 8 | 10 | 9 | 8 | 8 | 0 |
| Laura Indriago | 2 | 4 | 11 | 14 | 12 | 11 | 9 | 2 |
| Christopher Cepeda | 1 | 5 | 33 | 8 | 7 | 20 | 15 | 5 |
| Fabiola Iorio | 2 | 3 | 6 | 7 | 6 | 6 | 5 | 1 |
| Maria De Gouveia | 1 | 3 | 15 | 5 | 5 | 10 | 7 | 3 |
| Nickol Montero | 1 | 2 | 3 | 4 | 3 | 3 | 3 | 0 |
| Eleazar Hidalgo | 0 | 2 | 2 | 3 | 2 | 2 | 2 | 0 |

### Setters:
| Nombre | Leads Asig. | Contactados | Citas Ag. | Shows | Ventas | Aplicaron | Aprobados | Negados |
|--------|-------------|-------------|-----------|-------|--------|-----------|-----------|---------|
| Juviany Padron | 85 | 70 | 30 | 23 | 5 | 18 | 14 | 4 |
| Rene Peña | 80 | 65 | 28 | 20 | 4 | 16 | 12 | 4 |
| Moises Gutierrez | 90 | 72 | 32 | 24 | 4 | 19 | 13 | 6 |
| Elvis Pacheco | 88 | 68 | 30 | 22 | 3.5 | 17 | 11 | 6 |
| Kevin Aranguren | 25 | 18 | 6 | 4 | 1 | 3 | 2 | 1 |
| Katherine Atencio | 60 | 45 | 18 | 13 | 1 | 10 | 6 | 4 |
| David Mendoza | 65 | 50 | 20 | 14 | 1 | 11 | 7 | 4 |
| Odimar Vasquez | 92 | 70 | 30 | 23 | 1 | 15 | 8 | 7 |
| Kener Lee Ortega | 50 | 38 | 16 | 11 | 1 | 8 | 5 | 3 |
| Isiley Melendez | 95 | 75 | 40 | 32 | 0.5 | 20 | 10 | 10 |
| David Santos | 40 | 28 | 14 | 9 | 0 | 5 | 2 | 3 |

## Diseño Visual

- Tema: dark/midnight — fondo #070718
- Tipografía: DM Sans para body, Bebas Neue para números y headers
- Colores accent: #e94560 (closers/ventas), #f5a623 (setters), #00e676 (bueno), #ff5252 (malo), #54a0ff (crédito), #74b9ff (info)
- Medallas podio: #FFD700 (oro), #C0C0C0 (plata), #CD7F32 (bronce)
- Efectos: animaciones de entrada staggered, crown floating animation, pulse en badge LIVE
- El diseño debe ser premium, tipo dashboard de gaming/esports — no genérico

## Tecnología

- React + Vite
- Sin backend por ahora (datos en estado local)
- Preparado para conectar Google Sheets como base de datos después
- Deploy: Vercel
- Google Fonts: DM Sans + Bebas Neue

## Estructura de Archivos Sugerida

```
ar-leaderboard/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── StatsBar.jsx
│   │   ├── Column.jsx
│   │   ├── Podium.jsx
│   │   ├── Row.jsx
│   │   ├── Avatar.jsx
│   │   ├── CloserKpi.jsx
│   │   ├── SetterKpi.jsx
│   │   ├── FunnelChart.jsx
│   │   ├── EditModal.jsx
│   │   ├── AuthGate.jsx
│   │   └── Stat.jsx
│   ├── data/
│   │   └── defaults.js
│   ├── utils/
│   │   └── calculations.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## Próximos Pasos (no hacer ahora, solo tener en cuenta)

1. Conectar Google Sheets como base de datos
2. Make webhook para alimentar datos desde GHL automáticamente
3. Screenshot automático → Discord cada mañana
4. SMS resumen diario via Telnyx
