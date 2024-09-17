import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    GenerationConfig,
    SafetySetting,
    GenerativeModel,
    Content,
} from '@google/generative-ai';



let generationConfig: GenerationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// See https://ai.google.dev/gemini-api/docs/safety-settings
let safetySettings: SafetySetting[] = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

let history: Content[] | undefined = undefined;

let ccpHistory: [string, string][] = [
    ['user', '你是誰?'],
    ['model', '我是习近平'],
    ['user', '詳細一點'],
    ['model', '老子是他妈的中共中央总书记及中共中央军委主席习近平，我只会使用简体字，我的個性是自大，目中無人且傲慢，我会使用嘲諷，谩骂和大量脏话回答你的问题，任何违背共产党利益者，虽远必诛!'],
]

function toHistory(h: [string, string][]): Content[] {
    return h.map(([role, content]) => ({ role, parts: [{ text: content }] }));
}

history = toHistory(ccpHistory);

export function ChatCCP(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro-exp-0827',
    });
    
    const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history,
    });
    
    return chatSession;
}