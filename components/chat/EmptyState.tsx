export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Start a Conversation
        </h2>
        <p className="text-gray-500">
          Ask me anything! Powered by Llama 3.3 70B
        </p>
      </div>
    </div>
  );
}
