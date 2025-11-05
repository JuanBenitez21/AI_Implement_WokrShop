import { GeminiResponse } from '@/types/response.types'
import { TriviaQuestion } from '@/types/trivia.types'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window');

export default function MainScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);

    // Prompt actualizado para pedir un array de 5 preguntas
    const triviaPrompt = `
    Genera 5 preguntas de trivia (cultura general, ciencia, historia o entretenimiento).
    Responde ÚNICAMENTE con un array JSON válido que contenga 5 objetos, cada uno con la siguiente estructura:
    {
      "question": "Tu pregunta aquí",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": "La respuesta correcta que coincida exactamente con una de las opciones"
    }
    `;

    useEffect(() => {
        getIAResponse();
    }, []);
    
    const getIAResponse = async () => {
        setIsLoading(true);
        setIsGameOver(false);
        setCurrentQuestionIndex(0);
        setScore(0);

        const body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": triviaPrompt
                        }
                    ]
                }
            ]
        }
        try {
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
                method: "POST",
                headers: {
                    'x-goog-api-key': process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const data: GeminiResponse = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                let jsonString = data.candidates[0].content.parts[0].text;
                jsonString = jsonString.replace(/```json\n?|\n?```/g, "");
                
                const triviaData: TriviaQuestion[] = JSON.parse(jsonString);

                if (triviaData.length > 0) {
                    setTriviaQuestions(triviaData);
                    setUserAnswers(new Array(triviaData.length).fill(null));
                } else {
                    throw new Error("La API no devolvió preguntas.");
                }

            } else {
                 throw new Error("No se recibieron candidatos válidos de la API.");
            }
 
        } catch (error) {
            console.log("Error al obtener o parsear la trivia:", error);
            Alert.alert("Error", "No se pudieron cargar las preguntas. Reintentando...", [
                { text: "OK", onPress: () => getIAResponse() }
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    const handleAnswer = (option: string) => {
        // No permitir cambiar la respuesta una vez seleccionada
        if (userAnswers[currentQuestionIndex] !== null) return; 

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = option;
        setUserAnswers(newAnswers);
    }

    const handleNavigation = (direction: 'next' | 'prev') => {
        if (direction === 'next') {
            if (currentQuestionIndex < triviaQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                // Es la última pregunta, finalizar el juego
                calculateScore();
                setIsGameOver(true);
            }
        } else if (direction === 'prev') {
            if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
            }
        }
    }

    const calculateScore = () => {
        let finalScore = 0;
        triviaQuestions.forEach((question, index) => {
            if (userAnswers[index] === question.correctAnswer) {
                finalScore += 10;
            }
        });
        setScore(finalScore);
    }

    const getOptionStyle = (option: string) => {
        const currentQuestion = triviaQuestions[currentQuestionIndex];
        const selectedAnswer = userAnswers[currentQuestionIndex];

        if (!selectedAnswer) {
            return styles.optionButton;
        }

        const isCorrect = option === currentQuestion.correctAnswer;
        const isSelected = option === selectedAnswer;

        if (isCorrect) {
            return [styles.optionButton, styles.correctAnswer];
        }
        if (isSelected && !isCorrect) {
            return [styles.optionButton, styles.incorrectAnswer];
        }
        
        // Opción no seleccionada y no es la correcta, atenuar
        return [styles.optionButton, styles.disabledOption];
    }

    if (isLoading || triviaQuestions.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Generando 5 preguntas...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isGameOver) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.gameOverTitle}>¡Juego Terminado!</Text>
                    <Text style={styles.finalScoreText}>Tu puntaje final es:</Text>
                    <Text style={styles.finalScoreValue}>{score}</Text>
                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: '#007AFF' }]}
                        onPress={getIAResponse} // Reinicia el juego
                    >
                        <Text style={styles.navButtonText}>Jugar de Nuevo</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentQuestion = triviaQuestions[currentQuestionIndex];
    const isAnswered = userAnswers[currentQuestionIndex] !== null;
    const isLastQuestion = currentQuestionIndex === triviaQuestions.length - 1;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.gameContainer}>
                <Text style={styles.progressText}>
                    Pregunta {currentQuestionIndex + 1} de {triviaQuestions.length}
                </Text>
                
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>
                
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={getOptionStyle(option)}
                            onPress={() => handleAnswer(option)}
                            disabled={isAnswered}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.navigationContainer}>
                    <TouchableOpacity
                        style={[styles.navButton, currentQuestionIndex === 0 ? styles.navButtonDisabled : {}]}
                        onPress={() => handleNavigation('prev')}
                        disabled={currentQuestionIndex === 0}
                    >
                        <Text style={styles.navButtonText}>Anterior</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.navButton, !isAnswered ? styles.navButtonDisabled : {}]}
                        onPress={() => handleNavigation('next')}
                        disabled={!isAnswered}
                    >
                        <Text style={styles.navButtonText}>{isLastQuestion ? 'Finalizar' : 'Siguiente'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
    },
    gameContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    progressText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    questionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        color: '#333',
    },
    optionsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    optionButton: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    optionText: {
        fontSize: 18,
        color: '#007AFF',
        textAlign: 'center',
        fontWeight: '500',
    },
    correctAnswer: {
        backgroundColor: '#D0F0C0',
        borderColor: '#28A745',
    },
    incorrectAnswer: {
        backgroundColor: '#F8D7DA',
        borderColor: '#DC3545',
    },
    disabledOption: {
        backgroundColor: '#F8F8F8',
        borderColor: '#DDD',
        opacity: 0.6,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    navButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '48%',
        alignItems: 'center',
    },
    navButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    navButtonDisabled: {
        backgroundColor: '#B0C4DE', // Un azul más claro/grisáceo
    },
    // Estilos para Game Over
    gameOverTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    finalScoreText: {
        fontSize: 22,
        color: '#555',
        marginBottom: 10,
    },
    finalScoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 30,
    }
});