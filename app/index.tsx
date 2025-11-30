import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, useWindowDimensions, PanResponder, GestureResponderEvent, PanResponderGestureState, ImageBackground, Image } from 'react-native';
import { useState, useRef, useEffect, useMemo } from 'react';

// Imágenes
// Imágenes removed for Bolt compatibility
// import ferrariImg from '../assets/images/mateoferrari.png';

// Versión simplificada para depuración
// Si esto funciona, el problema eran los assets o gradientes

type GameScreen = 'welcome' | 'playing' | 'level_complete' | 'celebration';
type Point = { x: number; y: number };
type Particle = { id: number; x: number; y: number; color: string; size: number };

const LEVELS = [
  {
    id: 'name',
    title: 'TU NOMBRE',
    subtitle: '¡Vamos Mateo!',
    content: ['M', 'A', 'T', 'E', 'O'],
    theme: {
      primary: '#0099FF', // Azul Héroe
      secondary: '#FFD700', // Dorado
      background: '#E6F7FF',
      accent: '#FF4444',
      icon: '🦸‍♂️'
    }
  },
  {
    id: 'numbers',
    title: 'NÚMEROS',
    subtitle: '¡A toda velocidad!',
    content: ['1', '2', '3', '4', '5'],
    theme: {
      primary: '#FF4444', // Rojo Racing
      secondary: '#000000', // Negro
      background: '#FFF0F0',
      accent: '#FFD700',
      icon: '🏎️'
    }
  },
  {
    id: 'vowels',
    title: 'VOCALES',
    subtitle: '¡Mundo Animal!',
    content: ['A', 'E', 'I', 'O', 'U'],
    theme: {
      primary: '#4CAF50', // Verde Selva
      secondary: '#FF9800', // Naranja
      background: '#F1F8E9',
      accent: '#795548',
      icon: '🦁'
    }
  }
];

export default function Index() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [completedLetters, setCompletedLetters] = useState<boolean[]>([false, false, false, false, false]);
  const [particles, setParticles] = useState<Particle[]>([]);

  const currentLevel = LEVELS[currentLevelIndex];
  const letters = currentLevel.content;
  const theme = currentLevel.theme;

  // Estado para el dibujo
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const drawingAreaRef = useRef<View>(null);
  const [drawingAreaLayout, setDrawingAreaLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Animaciones
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const ferrariAnim = useRef(new Animated.Value(-500)).current;
  const letterScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  // Configuración del PanResponder para dibujar
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Iniciar nuevo trazo si quisiéramos manejar múltiples líneas, 
      // por ahora solo acumulamos puntos para simplificar
    },
    onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      // Obtener coordenadas relativas al área de dibujo
      // Nota: En web a veces locationX/Y es inconsistente dependiendo del target, 
      // usamos pageX/Y menos el offset del área si es posible, o simplificamos.
      // Para esta demo simple, usaremos locationX/Y del evento nativo que suele funcionar bien en Views contenedores.
      const { locationX, locationY } = evt.nativeEvent;

      setDrawingPoints(prev => [...prev, { x: locationX, y: locationY }]);
    },
    onPanResponderRelease: () => {
      // Verificar si se ha dibujado suficiente
      if (drawingPoints.length > 20) { // Umbral arbitrario de "esfuerzo"
        handleLetterComplete();
      }
    },
  }), [drawingPoints]); // Dependencia necesaria para acceder al estado actualizado si fuera necesario, aunque aquí usamos setDrawingPoints funcional

  useEffect(() => {
    console.log("App mounted, screen:", screen);

    // Animación de flotación del héroe
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroAnim, {
          toValue: -15,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(heroAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Animación de pulso para el botón
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const startGame = () => {
    console.log("Starting game");
    setScreen('playing');
    setCurrentLevelIndex(0);
    setCurrentLetterIndex(0);
    setCompletedLetters(new Array(LEVELS[0].content.length).fill(false));
    setDrawingPoints([]);
  };

  const nextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setCurrentLetterIndex(0);
      setCompletedLetters(new Array(LEVELS[currentLevelIndex + 1].content.length).fill(false));
      setDrawingPoints([]);
      setScreen('playing');
    } else {
      setScreen('celebration');
      Animated.spring(celebrationAnim, {
        toValue: 1,
        useNativeDriver: false,
      }).start();
    }
  };

  const triggerParticles = () => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * width,
      y: Math.random() * height,
      color: [theme.primary, theme.secondary, theme.accent][Math.floor(Math.random() * 3)],
      size: Math.random() * 15 + 5,
    }));
    setParticles(newParticles);
    particleAnim.setValue(0);
    Animated.timing(particleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => setParticles([]));
  };

  const playFanfare = () => {
    if (Platform.OS === 'web') {
      try {
        // Intentar reproducir sonido de victoria
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play failed:", e));

        // También usar síntesis de voz para felicitar
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            currentLevelIndex < LEVELS.length - 1
              ? `¡Muy bien! Completaste el nivel ${currentLevel.title}`
              : "¡Felicidades! ¡Eres un campeón!"
          );
          utterance.lang = 'es-ES';
          utterance.rate = 1.1;
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.log("Error playing sound", error);
      }
    }
  };

  const playBellSound = () => {
    if (Platform.OS === 'web') {
      try {
        // Usar Web Audio API para sintetizar un sonido de campana confiable
        // Esto evita problemas de carga de archivos externos o CORS
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();

          // Crear oscilador (el sonido)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          // Configurar tono tipo "Campana"
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota La alta (Ding!)

          // Configurar volumen (golpe fuerte y desvanecimiento)
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

          osc.start();
          osc.stop(ctx.currentTime + 1.5);
        }
      } catch (error) {
        console.log("Error playing synthesized sound", error);
      }
    }
  };

  const speakCurrentLetter = () => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const char = letters[currentLetterIndex];
      const utterance = new SpeechSynthesisUtterance(char);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLetterComplete = () => {
    console.log("Letter complete");
    playBellSound(); // Sonido de campana fuerte
    speakCurrentLetter(); // Decir la letra
    triggerParticles();

    // Animación de la letra
    Animated.sequence([
      Animated.spring(letterScaleAnim, {
        toValue: 1.5,
        useNativeDriver: false,
        friction: 3,
      }),
      Animated.spring(letterScaleAnim, {
        toValue: 1,
        useNativeDriver: false,
      })
    ]).start();

    const newCompleted = [...completedLetters];
    newCompleted[currentLetterIndex] = true;
    setCompletedLetters(newCompleted);

    // Animación del Icono cruzando
    ferrariAnim.setValue(-500);
    Animated.timing(ferrariAnim, {
      toValue: width + 500,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    if (currentLetterIndex === letters.length - 1) {
      setTimeout(() => {
        playFanfare(); // Reproducir sonido
        // Level Complete
        if (currentLevelIndex < LEVELS.length - 1) {
          setScreen('level_complete');
        } else {
          setScreen('celebration');
          Animated.spring(celebrationAnim, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
        }
      }, 1500);
    } else {
      setTimeout(() => {
        setCurrentLetterIndex(currentLetterIndex + 1);
        setDrawingPoints([]);
      }, 2000);
    }
  };

  // Estilos dinámicos para web
  const isWeb = Platform.OS === 'web';
  const contentMaxWidth = 800;

  if (screen === 'welcome') {
    return (
      <View style={[styles.container, { backgroundColor: '#0099FF' }]}>
        <View style={styles.centerContent}>
          <Animated.View style={{ transform: [{ translateY: heroAnim }] }}>
            <View style={{ width: 200, height: 200, backgroundColor: '#FFD700', borderRadius: 100, marginBottom: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: '#fff' }}>
              <Text style={{ fontSize: 100 }}>🦸‍♂️</Text>
            </View>
          </Animated.View>

          <Text style={styles.welcomeTitle}>¡Hola Mateo!</Text>
          <Text style={styles.welcomeSubtitle}>¡Vamos a aprender jugando!</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={startGame}
            style={isWeb ? { cursor: 'pointer' } : {}}
          >
            <Animated.View style={[styles.startButton, { transform: [{ scale: buttonPulseAnim }] }]}>
              <Text style={styles.startButtonText}>¡JUGAR!</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === 'level_complete') {
    return (
      <View style={[styles.container, { backgroundColor: theme.primary }]}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 120, marginBottom: 20 }}>{theme.icon}</Text>
          <Text style={styles.celebrationTitle}>¡MUY BIEN!</Text>
          <Text style={styles.celebrationSubtitle}>Completaste: {currentLevel.title}</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={nextLevel}
            style={[styles.startButton, { marginTop: 40, backgroundColor: theme.secondary }]}
          >
            <Text style={[styles.startButtonText, { color: '#fff' }]}>SIGUIENTE NIVEL ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === 'celebration') {
    return (
      <View style={[styles.container, { backgroundColor: '#FFD700' }]}>
        <View style={[styles.centerContent]}>
          <Animated.View style={{
            alignItems: 'center',
            transform: [
              { scale: celebrationAnim },
              { translateY: Animated.multiply(celebrationAnim, -20) }
            ]
          }}>
            <Text style={styles.celebrationTitle}>¡CAMPEÓN!</Text>
            <Text style={styles.celebrationSubtitle}>¡Completaste TODO!</Text>
          </Animated.View>

          <View style={styles.heroFerrariContainer}>
            <Text style={{ fontSize: 120 }}>🏆 🦸‍♂️ 🏎️</Text>
          </View>

          <TouchableOpacity
            style={[styles.repeatButton, isWeb && { cursor: 'pointer' }]}
            onPress={startGame}
          >
            <Text style={styles.repeatButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Partículas */}
      {particles.map(p => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: particleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            }),
            transform: [{
              translateY: particleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200]
              })
            }]
          }}
        />
      ))}

      <View style={styles.gameContainer}>

        {/* Header del Nivel */}
        <View style={styles.levelHeader}>
          <Text style={[styles.levelTitle, { color: theme.primary }]}>{currentLevel.title}</Text>
          <Text style={{ fontSize: 40 }}>{theme.icon}</Text>
        </View>

        <View style={[styles.contentWrapper, { maxWidth: contentMaxWidth }]}>
          {/* Barra de progreso */}
          <View style={[styles.progressContainer, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
            {letters.map((letter, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  completedLetters[index] && { backgroundColor: theme.primary, borderColor: theme.secondary },
                  index === currentLetterIndex && { borderColor: theme.accent, transform: [{ scale: 1.2 }] }
                ]}
              >
                {completedLetters[index] && <Text style={styles.progressDotText}>{letter}</Text>}
              </View>
            ))}
          </View>

          {/* Letra Principal */}
          <View style={styles.letterContainer}>
            <Animated.View style={[styles.letterBubble, { transform: [{ scale: letterScaleAnim }], borderColor: theme.primary }]}>
              <Text style={[styles.letterText, { color: theme.primary }]}>{letters[currentLetterIndex]}</Text>
            </Animated.View>
          </View>

          {/* Área de dibujo interactiva */}
          <View style={styles.drawAreaContainer}>
            <Text style={[styles.drawAreaText, { color: theme.primary }]}>¡Dibuja aquí!</Text>

            <View
              style={[styles.drawArea, isWeb && { cursor: 'crosshair' }, { borderColor: theme.primary }]}
              {...panResponder.panHandlers}
              ref={drawingAreaRef}
              onLayout={(e) => setDrawingAreaLayout(e.nativeEvent.layout)}
            >
              {/* Guía de la letra (Fondo) */}
              <View style={styles.traceGuideContainer}>
                <Text style={[styles.traceGuideText, { color: '#E0E0E0' }]}>{letters[currentLetterIndex]}</Text>
              </View>

              {/* Puntos dibujados */}
              {drawingPoints.map((point, index) => (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: point.x - 15,
                    top: point.y - 15,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: theme.secondary,
                  }}
                />
              ))}

              {drawingPoints.length === 0 && (
                <View style={styles.handIconContainer}>
                  <Text style={{ fontSize: 60 }}>👆</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Icono animado que cruza */}
        <Animated.View style={[styles.ferrariMovingContainer, { transform: [{ translateX: ferrariAnim }] }]}>
          <Text style={{ fontSize: 100 }}>{theme.icon}</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    width: '100%',
  },
  webContainer: {
    flex: 1,
    height: '100vh',
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 60,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 50,
    fontWeight: '600',
    opacity: 0.95,
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 60,
    paddingVertical: 25,
    borderRadius: 60,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
  startButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E63946',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  levelTitle: {
    fontSize: 40,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
    padding: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressDot: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  letterContainer: {
    marginBottom: 20,
    zIndex: 10,
  },
  letterBubble: {
    backgroundColor: '#fff',
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 8,
  },
  letterText: {
    fontSize: 80,
    fontWeight: 'bold',
  },
  drawAreaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  drawArea: {
    width: '90%',
    maxWidth: 500,
    height: 350,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 6,
    borderStyle: 'dashed',
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  drawAreaText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  traceGuideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceGuideText: {
    fontSize: 250,
    fontWeight: 'bold',
  },
  handIconContainer: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    opacity: 0.8,
    pointerEvents: 'none',
  },
  ferrariMovingContainer: {
    position: 'absolute',
    bottom: '5%',
    left: 0,
    zIndex: 100,
  },
  celebrationTitle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  celebrationSubtitle: {
    fontSize: 30,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  heroFerrariContainer: {
    alignItems: 'center',
    marginBottom: 50,
    flexDirection: 'row',
    gap: 20,
  },
  repeatButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 50,
    elevation: 8,
  },
  repeatButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});
