import { PongGame } from "@/components/PongGame";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pong</h1>
      <PongGame />
    </div>
  );
}
