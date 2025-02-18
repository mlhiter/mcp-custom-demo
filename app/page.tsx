"use client";

import ReactMarkdown from "react-markdown";
import { useRef, useState, useEffect } from "react";

interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: string;
}

const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "你好！这是一条示例消息。",
      sender: "助手",
      timestamp: getCurrentTime(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callTool, setCallTool] = useState<string | null>(null);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      id: Date.now(),
      content: newMessage,
      sender: "我",
      timestamp: getCurrentTime(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: newMessage,
          messageHistory: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let assistantMessage: Message;
        console.log(data);

        if (data.isToolCall) {
          setCallTool(data.assistantMessage.tool);

          const toolCallResponse = await fetch("/api/toolCall", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data.assistantMessage),
          });

          if (toolCallResponse.ok) {
            const toolCallData = await toolCallResponse.json();
            assistantMessage = {
              id: Date.now() + 1,
              content: toolCallData.data,
              sender: "助手",
              timestamp: getCurrentTime(),
            };
          }
          setCallTool(null);
        } else {
          assistantMessage = {
            id: Date.now() + 1,
            content: data.assistantMessage,
            sender: "助手",
            timestamp: getCurrentTime(),
          };
        }

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } else {
        console.error("Failed to fetch response from server");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 聊天头部 */}
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">MCP Demo</h1>
      </header>

      {/* 聊天消息区域 */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={messageContainerRef}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2.5 ${
              message.sender === "我" ? "justify-end" : ""
            }`}
          >
            <div className="flex flex-col gap-1 w-full max-w-[320px]">
              <div
                className={`flex items-center space-x-2 rtl:space-x-reverse ${
                  message.sender === "我" ? "justify-end" : ""
                }`}
              >
                <span className="text-sm font-semibold">{message.sender}</span>
                <span className="text-sm text-gray-500">
                  {message.timestamp}
                </span>
              </div>
              <div
                className={`${
                  message.sender === "我"
                    ? "bg-blue-500 text-white rounded-s-xl rounded-ee-xl"
                    : "bg-blue-100 text-gray-800 rounded-e-xl rounded-es-xl"
                } p-4 font-mono text-sm`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="break-words whitespace-pre-wrap mb-2">
                        {children}
                      </p>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center">
            {callTool ? (
              <span className="text-gray-500">正在调用工具...</span>
            ) : (
              <span className="text-gray-500">正在思考...</span>
            )}
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
