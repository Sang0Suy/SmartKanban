import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axiosConfig';

const AiConsultModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Chào sếp! Em là Smart AI Assistant. Sếp cần em tư vấn điều gì về dự án hôm nay?' }
    ]);
    const [inputData, setInputData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const handleSendMessage = async () => {
        if (!inputData.trim()) return;

        const userMsg = inputData;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInputData('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/v1/ai/chat', { prompt: userMsg });
            setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
        } catch (error) {
            console.error("Lỗi AI:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: 'Xin lỗi sếp, hệ thống AI đang quá tải hoặc chưa cấu hình API Key. Sếp kiểm tra lại Backend nhé!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <style>
                {`
                @keyframes pulseGlow { 0% { box-shadow: 0 0 20px rgba(106, 176, 255, 0.2); } 50% { box-shadow: 0 0 50px rgba(106, 176, 255, 0.5); } 100% { box-shadow: 0 0 20px rgba(106, 176, 255, 0.2); } }
                .chat-scrollbar::-webkit-scrollbar { width: 6px; }
                .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                .btn-send { background: linear-gradient(135deg, #4A9FFF, #0c66e4); border: none; color: #fff; padding: 0 20px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.2s; }
                .btn-send:hover { transform: scale(1.05); }
                .btn-send:disabled { background: #555; cursor: not-allowed; transform: none; }
                `}
            </style>

            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose}></div>

            <div style={{
                position: 'relative', width: '600px', height: '80vh', maxWidth: '95%', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                border: '1px solid rgba(106, 176, 255, 0.4)', borderRadius: '24px', padding: '24px',
                animation: 'pulseGlow 4s infinite', display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '28px' }}>🤖</div>
                        <div>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', background: 'linear-gradient(135deg, #fff, #6ab0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Smart AI Assistant
                            </h2>
                            <div style={{ fontSize: '12px', color: '#27c93f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#27c93f', borderRadius: '50%', display: 'inline-block' }}></span> Trực tuyến
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                </div>

                {/* Khung Chat */}
                <div className="chat-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', marginBottom: '16px' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                                maxWidth: '80%', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                                background: msg.sender === 'user' ? 'linear-gradient(135deg, #0c66e4, #4A9FFF)' : 'rgba(255,255,255,0.05)',
                                color: '#fff', borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px', borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                                border: msg.sender === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', background: '#6ab0ff', borderRadius: '50%', animation: 'pulseGlow 1s infinite alternate' }}></span>
                                    <span style={{ width: '8px', height: '8px', background: '#6ab0ff', borderRadius: '50%', animation: 'pulseGlow 1s infinite alternate 0.2s' }}></span>
                                    <span style={{ width: '8px', height: '8px', background: '#6ab0ff', borderRadius: '50%', animation: 'pulseGlow 1s infinite alternate 0.4s' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Khung Input */}
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <textarea
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Hỏi AI bất cứ điều gì..."
                        style={{ flex: 1, height: '44px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none', padding: '12px', fontFamily: 'inherit' }}
                    />
                    <button className="btn-send" onClick={handleSendMessage} disabled={isLoading || !inputData.trim()}>
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiConsultModal;