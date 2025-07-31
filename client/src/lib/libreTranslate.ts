import axios from 'axios';

const LIBRE_TRANSLATE_API = 'https://libretranslate.com';

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const response = await axios.post(`${LIBRE_TRANSLATE_API}/translate`, {
      q: text,
      source: 'en', // Assuming English as the source language
      target: targetLang,
      format: 'text',
    });
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text in case of error
  }
};
