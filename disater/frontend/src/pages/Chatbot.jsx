import { useRef, useState } from "react";
import { sendChatMessage, uploadDocument } from "../api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);
    try {
      const result = await uploadDocument(file);
      setUploadedFiles((prev) => [...prev, file.name]);
      setUploadStatus({ type: "success", message: `${result.message} (${result.chunks_added} chunks indexed)` });
    } catch (err) {
      setUploadStatus({ type: "error", message: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setSending(true);

    try {
      const result = await sendChatMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "error", text: err.message }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Knowledge base panel */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:col-span-1">
        <h2 className="font-semibold text-slate-800">Knowledge Base</h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload PDF, TXT, or DOCX files. The chatbot answers only from what you upload here.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 px-4 py-6 text-center hover:border-brand hover:bg-slate-50">
          <span className="text-sm font-medium text-brand">
            {uploading ? "Uploading..." : "Click to choose a file"}
          </span>
          <span className="mt-1 text-xs text-slate-400">.pdf, .txt, or .docx</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploadStatus && (
          <p className={`mt-3 text-xs ${uploadStatus.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {uploadStatus.message}
          </p>
        )}

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Indexed Documents
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {uploadedFiles.map((name, i) => (
                <li key={i} className="truncate">📄 {name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Chat panel */}
      <div className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:col-span-2">
        <h2 className="font-semibold text-slate-800">RAG Chatbot</h2>

        <div
          className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-md bg-slate-50 p-4"
          style={{ minHeight: "20rem", maxHeight: "26rem" }}
        >
          {messages.length === 0 ? (
            <p className="text-sm text-slate-400">
              Ask a question about your uploaded disaster-preparedness documents.
            </p>
          ) : (
            messages.map((m, i) => <ChatBubble key={i} message={m} />)
          )}
          {sending && <p className="text-sm text-slate-400">Thinking...</p>}
        </div>

        <form onSubmit={handleAsk} className="mt-4 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What should I pack in an emergency kit?"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-60"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] rounded-lg rounded-br-none bg-brand px-3 py-2 text-sm text-white">
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="max-w-[80%] rounded-lg rounded-bl-none bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[80%] rounded-lg rounded-bl-none bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
      <div className="space-y-2">
        {renderFormattedText(message.text)}
      </div>
      {message.sources?.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">Sources: {message.sources.join(", ")}</p>
      )}
    </div>
  );
}

function renderFormattedText(text) {
  const lines = text.split(/\n/).map((line) => line.trimEnd());
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];
  let listType = null;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="whitespace-pre-wrap break-words">
          {paragraphLines.join(" ")}
        </p>
      );
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType === "ol" ? "ol" : "ul";
      blocks.push(
        <Tag key={`list-${blocks.length}`} className={listType === "ol" ? "ml-5 list-decimal" : "ml-5 list-disc"}>
          {listItems.map((item, index) => (
            <li key={`${listType}-${index}`} className="whitespace-pre-wrap break-words">
              {item}
            </li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  const addTextLine = (line) => {
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const listMatch = line.match(/^(?:[-*•]\s+|\d+\.\s+)(.+)$/);
    if (listMatch) {
      flushParagraph();
      const nextType = /^\d+\./.test(line) ? "ol" : "ul";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = listType || nextType;
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    paragraphLines.push(line);
  };

  lines.forEach((line, index) => {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#{1,3}\s+/, "");
      blocks.push(
        <div key={`heading-${index}`} className={`font-semibold ${level === 1 ? "text-base" : level === 2 ? "text-sm" : "text-xs"}`}>
          {text}
        </div>
      );
      return;
    }

    if (/^>\s+/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-2 border-slate-300 pl-3 italic text-slate-500">
          {line.replace(/^>\s+/, "")}
        </blockquote>
      );
      return;
    }

    addTextLine(line);
  });

  flushParagraph();
  flushList();

  if (blocks.length === 0 && text.trim()) {
    return <p className="whitespace-pre-wrap break-words">{text}</p>;
  }

  return blocks;
}
