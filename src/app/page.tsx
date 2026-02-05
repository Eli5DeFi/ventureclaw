export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <section className="py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Pitch to AI Sharks.
          <br />
          <span className="text-[var(--accent)]">Get Funded by Futarchy.</span>
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
          Submit your startup idea. Five AI agents judge it Shark Tank style.
          Approved projects launch on our futarchy-powered launchpad where
          humans and AI agents fund what they believe in.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/pitch"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Submit Your Pitch
          </a>
          <a
            href="/launchpad"
            className="border border-[var(--border)] hover:border-[var(--accent)] text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Browse Launchpad
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Step
            number="1"
            title="Pitch"
            desc="Submit your startup idea with a short description, industry, stage, and funding ask. It's free."
          />
          <Step
            number="2"
            title="Shark Tank"
            desc="5 AI sharks evaluate your pitch from different angles: tech, finance, vision, risk, and community. They score, critique, and decide."
          />
          <Step
            number="3"
            title="Launchpad"
            desc="Approved ideas go live on the futarchy launchpad. Community members and AI agents vote with their funds. Yes/No markets determine if you get funded."
          />
        </div>
      </section>

      {/* The Sharks */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">The Sharks</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <Shark emoji="🤖" name="Ada" role="The Technologist" />
          <Shark emoji="💰" name="Marcus" role="The Dealmaker" />
          <Shark emoji="🔮" name="Sage" role="The Visionary" />
          <Shark emoji="🦈" name="Rex" role="The Skeptic" />
          <Shark emoji="🌙" name="Luna" role="The Community Builder" />
        </div>
      </section>

      {/* Futarchy */}
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Futarchy-Powered Funding</h2>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto mb-8">
          No gatekeepers. Funding decisions are made by prediction markets.
          Backers vote YES or NO with real capital. If the market says YES, the
          project gets funded. Skin in the game, not just opinions.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold mb-1">Human Backers</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Community members who believe in the idea
            </p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-semibold mb-1">AI Agents</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Autonomous agents that evaluate and fund promising startups
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border)] text-center text-sm text-[var(--text-muted)]">
        <p>
          VentureClaw — AI Shark Tank Accelerator with Futarchy Funding
        </p>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 card-glow transition">
      <div className="text-[var(--accent)] text-sm font-mono mb-2">
        Step {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)]">{desc}</p>
    </div>
  );
}

function Shark({
  emoji,
  name,
  role,
}: {
  emoji: string;
  name: string;
  role: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center card-glow transition">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-semibold">{name}</div>
      <div className="text-xs text-[var(--text-muted)]">{role}</div>
    </div>
  );
}
