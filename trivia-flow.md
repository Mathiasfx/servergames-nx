# Flujo y lógica del juego de trivia

---

## Trivias por usuario autenticado

### 1. Estructura de datos (MongoDB)

**Colección: `trivias`**
```json
{
  "_id": "triviaId",
  "userId": "usuarioId", // referencia al usuario creador
  "title": "Mi trivia",
  "questions": [
    {
      "question": "¿Pregunta 1?",
      "options": ["Opción 1", "Opción 2", "Opción 3"],
      "answer": "Opción 2"
    }
    // ...hasta 10 preguntas
  ],
  "createdAt": "fecha",
  "isActive": false // para saber si está en juego
}
```

### 2. Endpoints REST (NestJS)

- `POST /trivias`  
  Crear trivia (solo si el usuario no tiene una activa).
- `GET /trivias/mine`  
  Obtener la trivia del usuario autenticado.
- `PUT /trivias/:id`  
  Editar trivia (opcional).
- `DELETE /trivias/:id`  
  Eliminar trivia.
- `POST /trivias/:id/start`  
  Iniciar partida (activa la trivia y lanza el flujo por WebSocket).
- `GET /trivias/:id/ranking`  
  Obtener ranking de la trivia.

### 3. Panel Angular

- El usuario inicia sesión.
- Puede crear/editar su trivia (máximo 10 preguntas, 2-4 opciones por pregunta).
- Inicia la partida y controla el flujo.
- Visualiza el ranking y resultados.

### 4. Consideraciones para pagos

- Limitar a 1 trivia por usuario en el plan gratuito.
- Permitir más trivias, preguntas o funciones premium en el futuro.
- Asociar el estado de pago al usuario y mostrar opciones según el plan.

---

## 1. Backend (NestJS)
- Gestiona rooms, jugadores, preguntas y respuestas usando WebSocket (`/rooms`).
- Controla el avance de rondas y el timer por pregunta.
- Valida respuestas y calcula el ranking en memoria durante la partida.
- Envía eventos a los clientes: inicio de juego, nueva ronda, respuestas, ranking en tiempo real (`rankingUpdated`) y fin de partida.
- El `roomId` identifica cada partida y se puede generar dinámicamente para cada trivia.
- El ranking se muestra en tiempo real y solo se guarda en la base de datos si se requiere histórico.

## 2. Panel Angular (Administrador)
- Permite crear una nueva partida generando un `roomId` único.
- Configura las preguntas, opciones y el tiempo por pregunta (`timerSeconds`).
- Inicia la partida enviando el evento `startGame` con preguntas y configuración al backend.
- Muestra el QR con el `roomId` para que los jugadores se conecten desde Unity.
- Controla y visualiza el estado de la partida, ranking y avance de rondas.

## 3. Cliente Unity (Jugador)
- Escanea el QR y obtiene el `roomId` para conectarse al backend por WebSocket.
- Se une al room enviando su nombre (`joinRoom`).
- Escucha los eventos del backend:
  - `countdown`: muestra el contador 3-2-1 antes de iniciar la trivia.
  - `gameStarted` y `newRound`: recibe la pregunta, opciones y timer para mostrar en la UI.
  - `answerSubmitted`: muestra si la respuesta fue correcta/incorrecta y actualiza el puntaje.
  - `rankingUpdated`: muestra el ranking en tiempo real.
  - `gameEnded`: muestra el ranking final.
- Envía su respuesta usando el evento `submitAnswer`.
- Solo puede responder una vez por pregunta; si no responde antes de que termine el timer, se marca como incorrecto.

### Configuración básica para conectar Unity

1. Instala una librería Socket.IO compatible con Unity, por ejemplo:
  - [Socket.IO for Unity (doghappy/socket.io-unity)](https://github.com/doghappy/socket.io-unity)
  - [BestHTTP/2 (Asset Store)](https://assetstore.unity.com/packages/tools/network/best-http-2-155639)

2. Conecta al backend usando el namespace `/rooms`:
  ```csharp
  var client = new SocketIO("http://TU_BACKEND_URL/rooms");
  client.OnConnected += ...;
  client.On("gameStarted", ...);
  client.On("newRound", ...);
  client.On("answerSubmitted", ...);
  client.On("rankingUpdated", ...);
  client.On("gameEnded", ...);
  client.ConnectAsync();
  ```

3. Para unirse a la partida:
  ```csharp
  client.EmitAsync("joinRoom", new { roomId, name });
  ```

4. Para enviar una respuesta:
  ```csharp
  client.EmitAsync("submitAnswer", new { roomId, playerId, answer });
  ```

5. Muestra el timer y ranking en la UI según los datos recibidos en los eventos.

## Ejemplo de flujo
1. El admin crea la trivia en Angular, configura preguntas y tiempo, y genera el QR con el `roomId`.
2. Los jugadores escanean el QR y se conectan desde Unity usando el `roomId`.
3. El admin inicia la partida; el backend emite el evento `countdown` (3 segundos), luego envía la primera pregunta y timer a todos los jugadores con `gameStarted`.
4. Los jugadores responden; el backend valida y actualiza puntajes.
5. El backend emite el ranking actualizado en tiempo real cada vez que cambia el puntaje (`rankingUpdated`).
6. Al terminar el timer o cuando todos respondieron, el backend avanza a la siguiente ronda.
7. Al finalizar todas las preguntas, el backend envía el ranking final.

## Notas
- El tiempo por pregunta se configura desde Angular y se envía al backend.
- El QR facilita la conexión de los jugadores a la partida correcta.
- El ranking en tiempo real se gestiona en memoria y se transmite por WebSocket; solo se guarda en la base de datos si se requiere histórico.
- Toda la lógica de validación y avance está centralizada en el backend para mayor seguridad y sincronización.
