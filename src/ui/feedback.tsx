import { createContext, useContext } from 'react';
export const FeedbackContext = createContext<{
  run: (fn: () => void, success?: string) => boolean;
  notify: (text: string) => void;
  message: string;
}>({ run: () => false, notify: () => {}, message: '' });
export const useFeedback = () => useContext(FeedbackContext);
