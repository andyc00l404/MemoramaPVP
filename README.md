# Memorama PVP 🧠🎮

Un juego de memorama multijugador en tiempo real desarrollado con HTML5, CSS3, JavaScript y Socket.IO.

## 🚀 Características

- **Juego Multijugador en Tiempo Real**: Juega contra otros jugadores usando Socket.IO
- **4 Categorías de Emojis**: Animales, Frutas, Países y Transporte
- **Sistema de Turnos Inteligente**: Si encuentras un par, sigues jugando
- **Diseño Responsive**: Funciona perfectamente en móviles y escritorio
- **Interfaz Moderna**: Diseño atractivo con animaciones CSS3
- **Notificaciones en Tiempo Real**: Ve las jugadas de tu oponente instantáneamente

## 🎯 Categorías Disponibles

1. **🐾 Animales** - Perro, gato, león, elefante, panda, koala, etc.
2. **🍎 Frutas** - Manzana, naranja, plátano, uvas, fresa, kiwi, etc.
3. **🌍 Países** - Banderas de países populares
4. **🚗 Transporte** - Auto, avión, tren, barco, helicóptero, etc.

## 🎮 Cómo Jugar

1. **Ingresa tu nombre** y selecciona una categoría
2. **Busca una partida** - El sistema te emparejará con otro jugador
3. **Espera a tu oponente** - Cuando se encuentre un match, el juego comenzará
4. **Voltea cartas** - En tu turno, voltea dos cartas para encontrar pares
5. **Sigue jugando** - Si encuentras un par, tienes otro turno
6. **Gana puntos** - Cada par encontrado te da 1 punto
7. **¡Gana la partida!** - El jugador con más pares gana

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con Flexbox/Grid
- **JavaScript ES6+** - Lógica del juego
- **Socket.IO Client** - Comunicación en tiempo real

### Backend
- **Node.js** - Servidor JavaScript
- **Express** - Framework web
- **Socket.IO** - Comunicación en tiempo real

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd MemoramaPVP
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Ejecuta el servidor**
   ```bash
   npm start
   ```

4. **Abre tu navegador**
   ```
   http://localhost:3000
   ```

## 🚀 Comandos Disponibles

- `npm start` - Ejecuta el servidor en producción
- `npm run dev` - Ejecuta el servidor en modo desarrollo con nodemon

## 🎨 Características del Diseño

- **Tema Oscuro Moderno**: Interfaz elegante con colores oscuros
- **Gradientes Atractivos**: Efectos visuales modernos
- **Animaciones Suaves**: Transiciones CSS3 fluidas
- **Iconos FontAwesome**: Iconografía consistente
- **Fuente Poppins**: Tipografía moderna y legible

## 🔧 Configuración del Servidor

El servidor se ejecuta en el puerto 3000 por defecto. Puedes cambiar esto modificando la variable `PORT` en `server.js` o estableciendo la variable de entorno `PORT`.

```javascript
const PORT = process.env.PORT || 3000;
```

## 🎯 Mecánicas del Juego

### Sistema de Turnos
- El primer jugador comienza
- Cada jugador puede voltear 2 cartas por turno
- Si encuentra un par, continúa jugando
- Si no encuentra par, pasa el turno al oponente

### Sistema de Puntuación
- 1 punto por cada par encontrado
- El juego termina cuando se encuentran todos los pares
- Gana el jugador con más puntos

### Funciones Sociales
- **Jugar de Nuevo**: Después de una partida, puedes jugar otra con el mismo oponente
- **Nueva Partida**: Buscar un nuevo oponente
- **Desconexión**: Si un jugador se desconecta, el otro es notificado

## 🌐 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Dispositivos**: Escritorio, tablet, móvil
- **Sistemas Operativos**: Windows, macOS, Linux

## 📱 Responsive Design

El juego está optimizado para todos los tamaños de pantalla:
- **Escritorio**: Tablero 4x4 con interfaz completa
- **Tablet**: Tablero 3x3 con controles adaptados
- **Móvil**: Tablero 2x2 con interfaz simplificada

## 🔮 Futuras Mejoras

- [ ] Sistema de ranking de jugadores
- [ ] Más categorías de emojis
- [ ] Modo torneo
- [ ] Chat entre jugadores
- [ ] Personalización de avatares
- [ ] Estadísticas de juego

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar el juego, no dudes en:
1. Hacer un fork del proyecto
2. Crear una rama para tu feature
3. Hacer commit de tus cambios
4. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad de desarrolladores.

---

¡Disfruta jugando Memorama PVP! 🎉
