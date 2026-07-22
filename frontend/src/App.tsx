import { useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, AlertTriangle, ShieldAlert, Copy, Loader2 } from 'lucide-react';

type Claim = {
  text: string;
  verdict: string;
  evidence: string;
  sources: string[];
};

type SourceCredibility = {
  score: number;
  domain: string;
  reasoning: string;
};

type CrossReference = {
  title: string;
  outlet: string;
  url: string;
  stance: string;
};

type OverallVerdict = {
  label: string;
  explanation: string;
};

type AnalysisResponse = {
  claims: Claim[];
  sourceCredibility: SourceCredibility;
  crossReferences: CrossReference[];
  overallVerdict: OverallVerdict;
};

const verdictColors: Record<string, string> = {
  true: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  false: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  disputed: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  unverified: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
};

const verdictIcon: Record<string, JSX.Element> = {
  true: <CheckCircle2 className="h-4 w-4" />,
  false: <ShieldAlert className="h-4 w-4" />,
  disputed: <AlertTriangle className="h-4 w-4" />,
  unverified: <AlertTriangle className="h-4 w-4" />,
};

function App() {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = mode === 'url' ? { url: inputValue } : { text: inputValue };
      const response = await axios.post<AnalysisResponse>('http://localhost:8000/analyze', payload);
      setResult(response.data);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : 'Request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const shareSummary = async () => {
    if (!result) return;
    const text = `${result.overallVerdict.label}: ${result.overallVerdict.explanation}`;
    await navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard');
  };

  const progressSteps = useMemo(() => {
    if (!loading) return [];
    return ['Extracting claims…', 'Checking fact-check databases…', 'Scoring source…', 'Cross-referencing coverage…'];
  }, [loading]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">AI Agent Demo</p>
          <h1 className="mt-2 text-4xl font-semibold">Fake News Detector</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Submit an article URL or pasted text and the agent will extract claims, check them against fact-check evidence, score the publisher, and synthesize a verdict.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="flex gap-3">
              <button className={`rounded-full px-4 py-2 ${mode === 'url' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={() => setMode('url')}>
                Paste URL
              </button>
              <button className={`rounded-full px-4 py-2 ${mode === 'text' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`} onClick={() => setMode('text')}>
                Paste Text
              </button>
            </div>

            <textarea
              className="mt-4 min-h-[220px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-100 outline-none ring-0"
              placeholder={mode === 'url' ? 'https://example.com/article' : 'Paste the article text here...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <button onClick={handleAnalyze} className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-500" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Analyzing…' : 'Analyze article'}
            </button>

            {loading ? (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-300">Pipeline progress</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  {progressSteps.map((step) => (
                    <li key={step} className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> {step}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Overall verdict</p>
                <h2 className="mt-2 text-2xl font-semibold">{result?.overallVerdict.label ?? 'Awaiting analysis'}</h2>
              </div>
              {result ? (
                <button onClick={shareSummary} className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
                  <Copy className="h-4 w-4" /> Share
                </button>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {result?.overallVerdict.explanation ?? 'Submit an article to begin the credibility assessment.'}
            </p>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Source credibility score</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{result?.sourceCredibility.score ?? 0}/100</p>
                </div>
                <div className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
                  {result?.sourceCredibility.domain ?? 'unknown'}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">{result?.sourceCredibility.reasoning ?? 'Score will appear here after analysis.'}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <h3 className="text-xl font-semibold">Claim list</h3>
            <div className="mt-4 space-y-3">
              {result?.claims.map((claim, index) => (
                <div key={`${claim.text}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-7 text-slate-200">{claim.text}</p>
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${verdictColors[claim.verdict] ?? verdictColors.unverified}`}>
                      {verdictIcon[claim.verdict] ?? verdictIcon.unverified}
                      {claim.verdict}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{claim.evidence}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {claim.sources.map((source) => (
                      <a key={source} href={source} target="_blank" rel="noreferrer" className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                        Evidence
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
              <h3 className="text-xl font-semibold">Cross references</h3>
              <div className="mt-4 space-y-3">
                {result?.crossReferences.map((item) => (
                  <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.outlet}</p>
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">{item.stance}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.title}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
