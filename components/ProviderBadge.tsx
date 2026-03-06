import { clsx } from 'clsx';

const providerConfig: Record<string, { label: string; className: string }> = {
  openai: { label: 'OpenAI', className: 'badge-openai' },
  anthropic: { label: 'Anthropic', className: 'badge-anthropic' },
  google: { label: 'Google', className: 'badge-google' },
  mistral: { label: 'Mistral', className: 'badge-mistral' },
  ollama: { label: 'Ollama', className: 'badge-ollama' },
};

export default function ProviderBadge({ provider, className }: { provider: string; className?: string }) {
  const config = providerConfig[provider.toLowerCase()] || { label: provider, className: 'badge-ollama' };
  return (
    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', config.className, className)}>
      {config.label}
    </span>
  );
}
