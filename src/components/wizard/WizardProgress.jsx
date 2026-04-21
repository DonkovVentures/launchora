const STEPS = ['Product Type', 'Niche', 'Your Idea', 'Tone', 'Platform', 'Generate'];

export default function WizardProgress({ currentStep }) {
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary">Step {currentStep + 1} of {STEPS.length}</span>
        <span className="text-xs text-muted-foreground">{Math.round(((currentStep + 1) / STEPS.length) * 100)}% complete</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full gradient-bg rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <div className="hidden sm:flex items-center justify-between mt-3">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < currentStep ? 'gradient-bg text-white' :
              i === currentStep ? 'bg-primary text-white ring-4 ring-primary/20' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-medium ${i === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}