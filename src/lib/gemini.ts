import { GenerateContentConfig, GoogleGenAI, Type } from '@google/genai'

// Initialize the Gemini AI client
const genAI = new GoogleGenAI({
	apiKey: import.meta.env.VITE_GEMINI_API_KEY,
	// apiVersion: 'v1alpha'
})

// System prompts for different content types
export const SYSTEM_PROMPTS = {
	question: "Actúas como un experto creador de preguntas para el examen de reválida de psicología en Puerto Rico, siguiendo el estilo del manual de la Junta Examinadora. Eres preciso, claro y enfocado en la aplicación del conocimiento.",
	case: "Actúas como un supervisor clínico de psicología en Puerto Rico. Creas viñetas clínicas realistas y culturalmente relevantes para entrenar a futuros psicólogos.",
	explain: "Actúas como un tutor de psicología amigable y paciente, experto en simplificar conceptos complejos. Usas analogías y lenguaje sencillo y claro.",
	mnemonic: "Eres un creativo experto en técnicas de memorización. Tu especialidad es crear mnemotecnias efectivas y memorables en español."
} as const

// User prompt templates
export const USER_PROMPTS = {
	question: (section: string, topics: string) =>
		`Basado en los siguientes temas del área de '${section}': ${topics}. Genera UNA pregunta de práctica de selección múltiple. La pregunta debe ser un escenario o requerir la aplicación de conocimiento. Después del enunciado de la pregunta, presenta cuatro opciones de respuesta etiquetadas como a, b, c, y d. Importante: Cada opción de respuesta debe estar en una nueva línea para facilitar la lectura. Después de las cuatro opciones, incluye el delimitador '---RESPUESTA---'. Finalmente, provee la letra de la respuesta correcta y una explicación concisa y clara de por qué es correcta y por qué las otras son incorrectas.`,

	case: (section: string, topics: string) =>
		`Crea un breve caso de estudio (viñeta clínica) relevante al área de '${section}' y los temas: ${topics}. El caso debe involucrar a un paciente ficticio y presentar un dilema o una pregunta diagnóstica/ética/de tratamiento. Incluye detalles socioculturales de Puerto Rico. Después del caso, plantea una pregunta clara para el estudiante. Luego, incluye el delimitador '---RESPUESTA---'. Finalmente, provee una discusión detallada de cómo un psicólogo licenciado abordaría la pregunta, aplicando los conceptos relevantes.`,

	explain: (section: string, topics: string) =>
		`Explica los siguientes conceptos del área '${section}' como si yo fuera un principiante: ${topics}. Usa un lenguaje muy sencillo, viñetas (bullet points) y analogías para que sea fácil de entender. Formatea la respuesta en Markdown.`,

	mnemonic: (section: string, topics: string) =>
		`Crea una mnemotecnia original y útil en español para recordar los siguientes conceptos clave del área '${section}': ${topics}. Presenta la mnemotecnia en negrita y luego explica brevemente cómo funciona cada parte. Formatea la respuesta en Markdown.`
} as const

// Content type definitions
export type ContentType = keyof typeof SYSTEM_PROMPTS

// Response interface
export interface GeminiResponse {
	question: string
	answer?: string
}

// Define the required structured output for question and case types
const QUESTION_ANSWER_SCHEMA = {
	type: Type.OBJECT,
	properties: {
		question: {
			type: Type.STRING,
			description: 'The complete psychology test question or complex clinical case description.'
		},
		answer: {
			type: Type.STRING,
			description: 'The detailed, correct answer or the clinical rationale/solution to the case.'
		}
	},
	required: ['question', 'answer']
};

/**
 * Select the optimal model based on content type
 * @param type - Content type to generate
 * @returns Model name optimized for the content type
 */
const getModelForContentType = (type: ContentType): string => {
	switch (type) {
		case 'case':
			// Complex clinical cases require advanced reasoning - use latest Pro model
			return 'models/gemini-2.5-pro'

		case 'mnemonic':
			// Simple mnemonics can use the most cost-effective model
			return 'models/gemini-2.5-flash-lite'

		case 'question':
			// Questions need good reasoning - balanced flash model
			return 'models/gemini-2.5-flash'

		case 'explain':
			// Explanations benefit from detailed responses - use flash model
			return 'models/gemini-2.5-flash'

		default:
			return 'models/gemini-2.5-flash'
	}
}

/** Get model configuration based on content type
 * @param type - Content type
 * @returns Configuration object for the model
 */
const getModelConfig = (
	type: ContentType
): GenerateContentConfig => {
	const baseConfig: GenerateContentConfig = {
		systemInstruction: SYSTEM_PROMPTS[type]
	};

	switch (type) {
		case 'case':
			return {
				...baseConfig,
				// Pro is the most capable, prioritize accuracy and depth over speed
				temperature: 0.1,
				// Force the structured output for reliable parsing
				responseMimeType: 'application/json',
				responseSchema: QUESTION_ANSWER_SCHEMA,
				// Pro has thinking enabled by default, but keeping it dynamic is best for complex tasks
				thinkingConfig: { thinkingBudget: -1 }
			};

		case 'question':
			return {
				...baseConfig,
				// Questions need accuracy, but a tiny bit of variation is okay for study material
				temperature: 0.2,
				// Force the structured output for reliable parsing
				responseMimeType: 'application/json',
				responseSchema: QUESTION_ANSWER_SCHEMA,
				// Dynamic thinking (-1) allows the model to decide how much reasoning is needed
				thinkingConfig: { thinkingBudget: -1 }
			};

		case 'explain':
			return {
				...baseConfig,
				// Explanations should be factual and grounded
				temperature: 0.2,
				// Dynamic thinking for detailed reasoning and structure
				thinkingConfig: { thinkingBudget: -1 }
			};

		case 'mnemonic':
			return {
				...baseConfig,
				// Mnemonics require creativity (higher temperature)
				temperature: 0.7,
				// Disable thinking (0) for the fastest, cheapest response
				thinkingConfig: { thinkingBudget: 0 }
			};

		default:
			return baseConfig;
	}
};

/**
 * Generate AI content using Gemini API
 * @param type - Type of content to generate (question, case, explain, mnemonic)
 * @param section - Psychology section name
 * @param topics - Comma-separated topics
 * @returns Promise with generated content
 */
export async function generateContent(
	type: ContentType,
	section: string,
	topics: string
): Promise<GeminiResponse> {
	try {
		const selectedModel = getModelForContentType(type);
		const config = getModelConfig(type);

		if (import.meta.env.DEV) {
			console.log(`🤖 Using ${selectedModel} for ${type} content (${section})`);
			console.log('Config:', config);
		}

		const response = await genAI.models.generateContent({
			model: selectedModel,
			config: config,
			contents: [
				{
					role: 'user',
					parts: [{ text: USER_PROMPTS[type](section, topics) }]
				}
			]
		});

		const text = response.text;

		// Simple Text Output Handling
		if (!text) {
			throw new Error('No content generated');
		}

		// Structured Output Handling: Directly parse the JSON result
		if (type === 'question' || type === 'case') {
			try {
				// The response.text will be a valid JSON string if responseMimeType was set
				const parsed = JSON.parse(text);

				// This confirms the structure based on the schema
				if (parsed.question && parsed.answer) {
					return {
						question: parsed.question.trim(),
						answer: parsed.answer.trim()
					};
				} else {
					// Fallback if model generated JSON but missed fields
					throw new Error('Structured response missing required fields.');
				}

			} catch (e) {
				console.warn('Failed to parse structured JSON response. Falling back to text splitting.');
				// Fallback: If JSON parsing fails (or schema was ignored), use old splitter
				const parts = text.split(/---RESPUESTA---/i)
				return {
					question: parts[0]?.trim() || 'Error: Fallback Question Missing',
					answer: parts[1]?.trim() || 'Error: Fallback Answer Missing'
				}
			}
		}

		return {
			question: text.trim()
		};

	} catch (error) {
		console.error('Error generating content with Gemini:', error)

		// Provide user-friendly error messages
		if (error instanceof Error) {
			if (error.message.includes('quota')) {
				throw new Error('Se ha excedido el límite de uso de la API. Intenta de nuevo más tarde.')
			} else if (error.message.includes('safety')) {
				throw new Error('El contenido fue bloqueado por las políticas de seguridad. Intenta con temas diferentes.')
			} else if (error.message.includes('network') || error.message.includes('fetch')) {
				throw new Error('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.')
			}
		}
		throw new Error('No se pudo generar el contenido. Intenta de nuevo más tarde.');
	}
}


/**
 * Get title for content type
 * @param type - Content type
 * @param section - Psychology section
 * @returns Formatted title
 */
export function getContentTitle(type: ContentType, section: string): string {
	const titles = {
		question: `Pregunta: ${section}`,
		case: `Caso Clínico: ${section}`,
		explain: `Explicación Sencilla: ${section}`,
		mnemonic: `Mnemotecnia: ${section}`
	}

	return titles[type]
}

/**
 * Get information about which model will be used for a content type
 * @param type - Content type
 * @returns Object with model info and reasoning
 */
export function getModelInfo(type: ContentType) {
	const modelName = getModelForContentType(type)
	const info = {
		'models/gemini-2.5-pro': {
			name: 'Gemini 2.5 Pro',
			description: 'Modelo más avanzado para razonamiento complejo y casos clínicos',
			cost: 'Alto',
			speed: 'Lento',
			quality: 'Excelente'
		},
		'models/gemini-2.5-flash': {
			name: 'Gemini 2.5 Flash',
			description: 'Modelo balanceado y rápido para uso general',
			cost: 'Medio',
			speed: 'Rápido',
			quality: 'Muy bueno'
		},
		'models/gemini-2.5-flash-lite': {
			name: 'Gemini 2.5 Flash Lite',
			description: 'Modelo económico y rápido para tareas simples',
			cost: 'Bajo',
			speed: 'Muy rápido',
			quality: 'Bueno'
		}
	}

	return {
		model: modelName,
		...info[modelName as keyof typeof info]
	}
}

/**
 * Validate API key configuration
 * @returns boolean indicating if API key is configured
 */
export function isApiKeyConfigured(): boolean {
	return !!import.meta.env.VITE_GEMINI_API_KEY
}