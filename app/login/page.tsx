"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            // Check if response is JSON
            const contentType = res.headers.get("content-type");
            if (!contentType?.includes("application/json")) {
                const text = await res.text();
                alert(`API Error (${res.status}): Expected JSON but got ${contentType || "no content"}\n\n${text.substring(0, 200)}`);
                setIsLoading(false);
                return;
            }

            const json = await res.json();

            if (json.success) {
                // Redirect to dashboard
                router.push("/");
                // Keep loading state true so button stays disabled during redirect
            } else {
                alert("Invalid credentials: " + (json.error || "Unknown error"));
                setIsLoading(false);
            }
        } catch (error) {
            alert("Login failed: " + (error instanceof Error ? error.message : "Unknown error"));
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500 mx-4">
                <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                        <Lock size={32} className="text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2 text-white">Welcome Back</h1>
                <p className="text-center text-zinc-400 mb-8">Enter your credentials to access your tracker</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-70"
                    >
                        {isLoading ? "Unlocking..." : <>Sign In <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
