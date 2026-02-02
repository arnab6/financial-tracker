"use client";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, PieChart as PieIcon, BarChart as BarIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ChartData {
    type: 'pie' | 'bar';
    title: string;
    data: any[];
}

interface Message {
    role: 'user' | 'assistant';
    content?: string;
    answer?: string; // from backend
    chart?: ChartData; // from backend
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load messages from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                }
            } catch (e) {
                console.error('Failed to load chat messages:', e);
                localStorage.removeItem('chatMessages'); // Clear corrupted data
            }
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatMessages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]); // Auto scroll when open

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setIsLoading(true);

        // Add a placeholder for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, newMsg] })
            });

            if (!response.ok || !response.body) throw new Error("Failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                let currentEvent: string | null = null;

                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        currentEvent = line.substring(7).trim();
                    } else if (line.startsWith("data: ")) {
                        const data = line.substring(6);

                        // sse-starlette sends "data: " then content. 
                        // If content is empty or pure newline, we might get weird splits.
                        // But generally it works.

                        if (currentEvent === "chart") {
                            try {
                                const chartData = JSON.parse(data);
                                setMessages(prev => {
                                    const newArr = [...prev];
                                    const last = newArr[newArr.length - 1];
                                    if (last.role === 'assistant') {
                                        last.chart = chartData;
                                    }
                                    return newArr;
                                });
                            } catch (e) {
                                console.error("Failed to parse chart data", e);
                            }
                        } else if (currentEvent === "error") {
                            accumulatedContent = "Error: " + data;
                            setMessages(prev => {
                                const newArr = [...prev];
                                const last = newArr[newArr.length - 1];
                                if (last.role === 'assistant') {
                                    last.content = accumulatedContent;
                                }
                                return newArr;
                            });
                        } else {
                            // "message" event or default
                            // data is usually "encoded string" if returned by json.dumps in python?
                            // In our python code: yield {"event": "message", "data": chunk}
                            // starlette writes the string as is if valid?
                            // Actually chunk is already a string.
                            // If chunk has newlines, SSE might break it?
                            // Pydantic AI chunks are usually small strings.

                            // Let's assume data is the raw string content.

                            accumulatedContent += data;

                            setMessages(prev => {
                                const newArr = [...prev];
                                const last = newArr[newArr.length - 1];
                                if (last.role === 'assistant') {
                                    last.content = accumulatedContent;
                                }
                                return newArr;
                            });
                        }
                    }
                }
            }
        } catch (e) {
            setMessages(prev => {
                const newArr = [...prev];
                const last = newArr[newArr.length - 1];
                if (last.role === 'assistant' && !last.content) {
                    last.content = "Sorry, I encountered an error connecting to the server.";
                }
                return newArr;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center animate-bounce-slow"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {isOpen && (
                <div className="w-[90vw] sm:w-[400px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[600px] transition-all duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 flex justify-between items-center border-b border-zinc-700">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Bot size={18} className="text-blue-400" /> AI Financial Analyst
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setMessages([]);
                                    localStorage.removeItem('chatMessages');
                                }}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                                title="Clear chat history"
                            >
                                🗑️
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-6" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm opacity-60">
                                <Bot size={48} className="mb-4 text-blue-500/50" />
                                <p>Ask me "Show my spending by category"</p>
                                <p>or "How much did I spend on Food?"</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>

                                {/* Text Bubble */}
                                {(m.content || m.answer) && (
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-zinc-800 text-gray-200 rounded-tl-none border border-zinc-700'
                                        }`}>
                                        <div className="prose prose-sm prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.content || m.answer}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Chart Rendering */}
                                {m.chart && (
                                    <div className="mt-2 w-full max-w-[90%] bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                                        <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                            {m.chart.type === 'pie' ? <PieIcon size={12} /> : <BarIcon size={12} />}
                                            {m.chart.title}
                                        </p>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {m.chart.type === 'pie' ? (
                                                    <PieChart>
                                                        <Pie
                                                            data={m.chart.data}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={40}
                                                            outerRadius={60}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {m.chart.data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                    </PieChart>
                                                ) : (
                                                    <BarChart data={m.chart.data}>
                                                        <XAxis dataKey="name" fontSize={10} stroke="#71717a" interval={0} />
                                                        <YAxis fontSize={10} stroke="#71717a" />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                                                            cursor={{ fill: '#27272a' }}
                                                        />
                                                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                                            {m.chart.data?.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-gray-400 text-xs animate-pulse border border-zinc-700">
                                    Analyzing data...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-zinc-800/50 border-t border-zinc-700 flex gap-2 backdrop-blur-sm">
                        <input
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500 transition-all"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
