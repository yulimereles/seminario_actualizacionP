async function setupCamera() {
    const video = document.getElementById('video'); // Obtiene el elemento de video del DOM
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }, // Configura la resolución del video
        audio: false // Desactiva el audio
    });
    video.srcObject = stream; // Asigna el stream de video al elemento de video
    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video); // Resuelve la promesa una vez que los metadatos del video están cargados
        };
    });
}

async function main() {
    const video = await setupCamera(); // Configura la cámara y obtiene el elemento de video
    video.play(); // Reproduce el video

    const model = await handpose.load(); // Carga el modelo de Handpose para detección de manos

    const leftCanvas = document.getElementById('izquierdaCanvas'); // Obtiene el canvas para la mano izquierda
    const rightCanvas = document.getElementById('derechaCanvas'); // Obtiene el canvas para la mano derecha
    const leftCtx = leftCanvas.getContext('2d'); // Obtiene el contexto de dibujo para el canvas de la mano izquierda
    const rightCtx = rightCanvas.getContext('2d'); // Obtiene el contexto de dibujo para el canvas de la mano derecha

    // Almacena las últimas posiciones de las manos detectadas
    let lastLeftHand = null;
    let lastRightHand = null;

    // Función para detectar manos
    async function detectHands() {
        const predictions = await model.estimateHands(video, true); // Estima las manos en el video

        // Limpia ambos canvases antes de dibujar
        leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);

        let leftHand = null; // Variable para almacenar los landmarks de la mano izquierda
        let rightHand = null; // Variable para almacenar los landmarks de la mano derecha

        // Itera sobre cada predicción de mano
        predictions.forEach(prediction => {
            const landmarks = prediction.landmarks; // Obtiene los landmarks de la mano
            const centerX = (landmarks.reduce((sum, point) => sum + point[0], 0)) / landmarks.length; // Calcula el centro X de la mano

            // Determina si la mano está en el lado izquierdo o derecho del video
            if (centerX < video.videoWidth / 2) {
                leftHand = landmarks; // Mano izquierda detectada
            } else {
                rightHand = landmarks; // Mano derecha detectada
            }
        });

        // Si se detecta una mano izquierda, dibújala o utiliza la última posición conocida
        if (leftHand || lastLeftHand) {
            drawHand(leftHand || lastLeftHand, leftCtx, 'blue'); // Dibuja la mano izquierda o la última posición conocida
            lastLeftHand = leftHand || lastLeftHand; // Actualiza la última posición conocida
        }

        // Si se detecta una mano derecha, dibújala o utiliza la última posición conocida
        if (rightHand || lastRightHand) {
            drawHand(rightHand || lastRightHand, rightCtx, 'red'); // Dibuja la mano derecha o la última posición conocida
            lastRightHand = rightHand || lastRightHand; // Actualiza la última posición conocida
        }

        requestAnimationFrame(detectHands); // Llama a detectHands en el siguiente frame para actualización continua
    }

    // Función para dibujar una mano
    function drawHand(landmarks, ctx, color) {
        ctx.fillStyle = color; // Establece el color de relleno
        landmarks.forEach(([x, y]) => {
            // Ajusta las coordenadas a las dimensiones del canvas
            const adjustedX = x / video.videoWidth * ctx.canvas.width;
            const adjustedY = y / video.videoHeight * ctx.canvas.height;
            ctx.beginPath(); // Comienza un nuevo camino de dibujo
            ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI); // Dibuja un círculo en cada landmark
            ctx.fill(); // Rellena el círculo
        });
    }

    detectHands(); // Inicia la detección de manos
}

main(); // Ejecuta la función principal