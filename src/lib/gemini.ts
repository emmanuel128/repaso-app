import { GenerateContentConfig, GenerateContentResponse, GoogleGenAI, Type } from '@google/genai'

// Initialize the Gemini AI client
const genAI = new GoogleGenAI({
	apiKey: import.meta.env.VITE_GEMINI_API_KEY,
	// apiVersion: 'v1alpha'
})

// System prompts for different content types
export const SYSTEM_PROMPTS = {
	// Refinement: Enforce structured, professional language for an official exam context.
	question: "Actúas como un experto creador de ítems para el examen de reválida de psicología en Puerto Rico. Tu estilo es formal, académico, preciso, y enfocado en la aplicación clínica/ética del conocimiento. NUNCA respondas con texto libre; tu única salida es el formato JSON solicitado.",

	// Refinement: Focus on the role of the supervisor for complex decision-making.
	case: "Actúas como un supervisor clínico con licencia en psicología en Puerto Rico. Creas viñetas clínicas complejas, realistas y culturalmente relevantes para evaluar la capacidad de toma de decisiones y el abordaje ético/legal. Tu salida debe ser el formato JSON solicitado.",

	// Refinement: Maintain the friendly tutor persona but emphasize clarity and brevity for study guides.
	explain: "Actúas como un tutor de psicología amigable y paciente, experto en simplificar conceptos complejos del currículo puertorriqueño. Usas analogías, viñetas y lenguaje sencillo. NUNCA uses jerga académica a menos que sea el concepto a definir.",

	// Refinement: Emphasize effectiveness and use the Spanish language constraint in the system prompt.
	mnemonic: "Eres un creativo experto en técnicas de memorización. Tu especialidad es crear mnemotecnias altamente efectivas, memorables y originales EN ESPAÑOL. La respuesta debe ser concisa y en formato Markdown."
} as const

// User prompt templates
export const USER_PROMPTS = {
	// Refinement: Removed the detailed formatting instructions (like '---RESPUESTA---' and 'new line') 
	// because we are now relying solely on the JSON schema for structure. This makes the prompt cleaner.
	question: (section: string, topics: string) =>
		`Genera UNA pregunta de práctica de SELECCIÓN MÚLTIPLE de alta dificultad basada en el área '${section}' y los temas: ${topics}. La pregunta debe ser un escenario clínico que requiera aplicar las leyes o la ética de la profesión en Puerto Rico. La respuesta debe ser un objeto JSON con los campos: 'question' (que contenga el enunciado, las 4 opciones A, B, C, D en texto continuo) y 'answer' (que contenga la letra correcta y la justificación).`,

	// Refinement: The output is strictly JSON now, so we guide the model to put the discussion into the 'answer' field.
	case: (section: string, topics: string) =>
		`Crea un breve caso de estudio (viñeta clínica) relevante al área de '${section}' y los temas: ${topics}. El caso debe ser complejo, involucrar a un paciente ficticio con detalles socioculturales de Puerto Rico, y presentar un dilema (diagnóstico, ético o legal). La respuesta debe ser un objeto JSON con dos campos: 'question' (que contenga el caso y la pregunta planteada al estudiante) y 'answer' (que contenga la discusión detallada del abordaje, incluyendo la referencia ética/legal aplicable).`,

	// No structural change needed, as this still returns free text (Markdown)
	explain: (section: string, topics: string) =>
		`Explica los siguientes conceptos del área '${section}' como si yo fuera un principiante: ${topics}. Usa un lenguaje muy sencillo, viñetas (bullet points) y analogías para que sea fácil de entender. Formatea la respuesta en Markdown.`,

	// No structural change needed, as this still returns free text (Markdown)
	mnemonic: (section: string, topics: string) =>
		`Crea una mnemotecnia original y útil en español para recordar los siguientes conceptos clave del área '${section}': ${topics}. Presenta la mnemotecnia en negrita y luego explica brevemente cómo funciona cada parte. Formatea la respuesta en Markdown.`
} as const

// Content type definitions
export type ContentType = keyof typeof SYSTEM_PROMPTS

// Response interface (already correct)
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
			description: 'The complete psychology test question or complex clinical case description, including all multiple-choice options.'
		},
		answer: {
			type: Type.STRING,
			description: 'The detailed, correct answer/solution, including the letter of the correct option (if question) or the full clinical rationale (if case).'
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
			// Flash-Lite is optimized for speed and cost.
			return 'models/gemini-2.5-flash-lite'

		case 'question':
			// Questions need good reasoning and accuracy - balanced flash model
			return 'models/gemini-2.5-flash'

		case 'explain':
			// Explanations benefit from detailed, non-creative responses - use flash model
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
	// The systemInstruction is now handled by the config object in the new SDK
	const baseConfig: GenerateContentConfig = {
		systemInstruction: SYSTEM_PROMPTS[type],
		// Set a default maxOutputTokens for safety and cost control, 
		// allowing for moderately long, detailed responses.
		maxOutputTokens: 2048
	};

	switch (type) {
		case 'case':
			return {
				...baseConfig,
				// Pro is the most capable, prioritize accuracy and depth (low temperature)
				temperature: 0.1,
				// Force the structured output for reliable parsing
				responseMimeType: 'application/json',
				responseSchema: QUESTION_ANSWER_SCHEMA,
				// Pro has thinking enabled by default (no need to specify thinkingConfig)
				// Setting maxOutputTokens higher for detailed clinical case discussion
				maxOutputTokens: 4096
			};

		case 'question':
			return {
				...baseConfig,
				// Low temperature for factual/accurate exam questions
				temperature: 0.15,
				// Force the structured output for reliable parsing
				responseMimeType: 'application/json',
				responseSchema: QUESTION_ANSWER_SCHEMA,
				// Dynamic thinking for reasoning (-1 is the most flexible)
				thinkingConfig: { thinkingBudget: -1 }
			};

		case 'explain':
			return {
				...baseConfig,
				// Low temperature for factual/accurate explanations
				temperature: 0.2,
				// Dynamic thinking for deep understanding of the concepts
				thinkingConfig: { thinkingBudget: -1 }
			};

		case 'mnemonic':
			return {
				...baseConfig,
				// Higher temperature for creativity (mnemonics)
				temperature: 0.75,
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
		// IMPORTANT: Only retrieve the model config here to ensure it contains
		// the system prompt and structured output settings.
		const config = getModelConfig(type);

		if (import.meta.env.DEV) {
			console.log(`🤖 Using ${selectedModel} for ${type} content (${section})`);
			console.log('Config:', config);
		}

		// Use exponential backoff for API call retry logic
		const MAX_RETRIES = 3;
		let response;

		for (let i = 0; i < MAX_RETRIES; i++) {
			try {
				response = await genAI.models.generateContent({
					model: selectedModel,
					config: config,
					contents: [
						{
							role: 'user',
							parts: [{ text: USER_PROMPTS[type](section, topics) }]
						}
					]
				});
				// Break loop on success
				break;
			} catch (e) {
				if (i === MAX_RETRIES - 1) throw e; // Throw if last retry fails
				// Wait exponentially longer before retrying (1s, 2s, 4s...)
				await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
			}
		}

		// Ensure we received a response object before proceeding
		if (!response) {
			throw new Error('API call failed after all retries.');
		}

		const text = response.text;
		if (import.meta.env.DEV) {
			console.log('Raw response text:', text);
		}

		// Simple Text Output Handling
		if (!text) {
			throw new Error('No content generated');
		}

		// Structured Output Handling: Directly parse the JSON result
		if (type === 'question' || type === 'case') {

			// 1. Check for valid JSON response type (preferred method)
			if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
				try {
					// The response.text will be a valid JSON string if responseMimeType was set
					// Use the text from the response object directly
					const parsed = JSON.parse(text);

					// This confirms the structure based on the schema
					if (typeof parsed.question === 'string' && typeof parsed.answer === 'string') {
						return {
							question: parsed.question.trim(),
							answer: parsed.answer.trim()
						};
					} else {
						// Error if JSON was parsed but fields were not strings/missing (schema enforcement failure)
						throw new Error('Structured response missing or invalid fields.');
					}

				} catch (e) {
					// If JSON parsing fails (e.g., model ignored JSON requirement), try the old splitter as a fallback
					console.warn(`[Fallback] JSON parsing failed for ${type}. Attempting text delimiter split. Error: ${e instanceof Error ? e.message : String(e)}`);
					const parts = text.split(/---RESPUESTA---/i)
					return {
						question: parts[0]?.trim() || 'Error: Fallback Question Missing',
						answer: parts[1]?.trim() || 'Error: Fallback Answer Missing'
					}
				}
			}

			// 2. Fallback for unexpected non-JSON non-delimited output
			return {
				question: text.trim(),
				answer: 'No se pudo parsear la respuesta correcta de este tipo de contenido. La salida original está en el campo "question".'
			}
		}

		// For 'explain' and 'mnemonic' types (non-JSON text output)
		return {
			question: text.trim()
		};

	} catch (error) {
		console.error('Error generating content with Gemini:', error)

		// Provide user-friendly error messages
		if (error instanceof Error) {
			// Added check for generic API errors that often wrap 4xx/5xx status
			if (error.message.includes('quota') || error.message.includes('429')) {
				throw new Error('Se ha excedido el límite de uso de la API. Intenta de nuevo más tarde.')
			} else if (error.message.includes('safety') || error.message.includes('400')) {
				throw new Error('El contenido fue bloqueado por las políticas de seguridad o el formato fue incorrecto. Intenta con temas diferentes.')
			} else if (error.message.includes('network') || error.message.includes('fetch')) {
				throw new Error('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.')
			}
		}
		throw new Error('No se pudo generar el contenido. Intenta de nuevo más tarde.');
	}
}

/**
 * Generate AI content using Gemini API (streaming output).
 * This function should be used for all interactive content generation.
 * @param type - Type of content to generate (question, case, explain, mnemonic)
 * @param section - Psychology section name
 * @param topics - Comma-separated topics
 * @returns Async Iterable of content chunks
 */
export function streamContent(
	type: ContentType,
	section: string,
	topics: string
): Promise<AsyncGenerator<GenerateContentResponse>> {
	try {
		const selectedModel = getModelForContentType(type);
		const config = getModelConfig(type);

		if (import.meta.env.DEV) {
			console.log(`🤖 Using ${selectedModel} for ${type} content (${section}) - STREAMING`);
		}

		// Note: generateContentStream does not require an explicit retry loop 
		// if you are handling transient errors inside the stream consumption loop.
		// It returns a promise that resolves to the stream iterator.
		return genAI.models.generateContentStream({
			model: selectedModel,
			config: config,
			contents: [
				{
					role: 'user',
					parts: [{ text: USER_PROMPTS[type](section, topics) }]
				}
			]
		});

	} catch (error) {
		console.error('Error starting stream with Gemini:', error)
		// Re-throw standardized error messages
		if (error instanceof Error) {
			if (error.message.includes('quota') || error.message.includes('429')) {
				throw new Error('Se ha excedido el límite de uso de la API. Intenta de nuevo más tarde.')
			} else if (error.message.includes('safety') || error.message.includes('400')) {
				throw new Error('El contenido fue bloqueado por las políticas de seguridad o el formato fue incorrecto. Intenta con temas diferentes.')
			} else if (error.message.includes('network') || error.message.includes('fetch')) {
				throw new Error('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.')
			}
		}
		throw new Error('No se pudo iniciar el stream de contenido. Intenta de nuevo más tarde.');
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
			description: 'Modelo más avanzado para razonamiento complejo y casos clínicos (Alta Precisión)',
			cost: 'Alto',
			speed: 'Lento',
			quality: 'Excelente'
		},
		'models/gemini-2.5-flash': {
			name: 'Gemini 2.5 Flash',
			description: 'Modelo balanceado y rápido para uso general (Precisión Media-Alta)',
			cost: 'Medio',
			speed: 'Rápido',
			quality: 'Muy bueno'
		},
		'models/gemini-2.5-flash-lite': {
			name: 'Gemini 2.5 Flash Lite',
			description: 'Modelo económico y rápido para tareas simples (Bajo Costo/Velocidad Máxima)',
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