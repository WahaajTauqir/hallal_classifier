
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { createChat } from '../services/geminiService';
import { Chat } from "@google/genai";
import { ChatMessage } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';

const Chatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(createChat());
        setMessages([{
            sender: 'bot',
            text: 'Hello! How can I help you today? Feel free to ask about Halal, Haram, E-codes, or how to use the app.'
        }]);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
    
    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage, { sender: 'bot', text: '' }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: userInput });
            
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.sender === 'bot') {
                        const updatedMessages = [...prev];
                        updatedMessages[prev.length - 1] = {
                            ...lastMessage,
                            text: lastMessage.text + chunkText
                        };
                        return updatedMessages;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
             setMessages(prev => {
                const updatedMessages = [...prev];
                if(updatedMessages[updatedMessages.length-1].sender === 'bot'){
                    updatedMessages[updatedMessages.length-1].text = "Sorry, I encountered an error. Please try again.";
                }
                return updatedMessages;
             });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow h-[calc(100vh-160px)]">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">AI Assistant</h2>
                <p className="mt-4 text-lg text-zinc-400">Ask me anything about Halal ingredients or the app.</p>
            </div>
            <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-zinc-900/50 rounded-t-xl border border-b-0 border-zinc-800">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <SparklesIcon className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mb-1" />}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 px-4 rounded-2xl ${
                            msg.sender === 'user' 
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-br-lg' 
                                : 'bg-gradient-to-br from-zinc-800 to-zinc-700 text-zinc-200 rounded-bl-lg'
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}{isLoading && msg.sender==='bot' && index === messages.length-1 ? '...' : ''}</p>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/50 rounded-b-xl border border-t-0 border-zinc-800 flex items-center gap-3">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-zinc-800/50 text-white placeholder-zinc-500 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition border border-zinc-700"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg p-2.5 hover:from-emerald-600 hover:to-green-600 disabled:from-zinc-800 disabled:to-zinc-900 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

export default Chatbot;