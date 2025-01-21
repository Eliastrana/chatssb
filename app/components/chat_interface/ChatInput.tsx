"use client";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    handleSend: () => void;
}

export default function ChatInput({
                                      input,
                                      setInput,
                                      isLoading,
                                      handleSend,
                                  }: ChatInputProps) {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-10 w-full flex justify-center items-center mt-4 px-4 z-20">
            <input
                type="text"
                className="w-[43rem] border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 px-4 py-2 focus:outline-none"
                placeholder="Hva leter du etter?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
            />
            <button
                className={`bg-[#274247] text-white px-4 py-2 border-2 border-[#274247] border-l-0 focus:outline-none ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleSend}
                disabled={isLoading}
            >
                Send
            </button>
        </div>
    );
}
