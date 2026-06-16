import { Database } from '../../lib/supabase';

type Figurinha = Database['public']['Tables']['figurinhas']['Row'];

interface FigurinhaCardProps {
  figurinha: Figurinha;
  compact?: boolean;
}

const statusConfig = {
  tenho: { label: 'Tenho', bg: '#009739', color: '#fff' },
  quero: { label: 'Quero', bg: '#012169', color: '#fff' },
  repetida: { label: 'Repetida', bg: '#FEDD00', color: '#012169' },
};

const selectionFlags: Record<string, string> = {
  'Brasil': '🇧🇷',
  'Argentina': '🇦🇷',
  'França': '🇫🇷',
  'Alemanha': '🇩🇪',
  'Espanha': '🇪🇸',
  'Portugal': '🇵🇹',
  'Itália': '🇮🇹',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Holanda': '🇳🇱',
  'Bélgica': '🇧🇪',
  'Croácia': '🇭🇷',
  'Uruguai': '🇺🇾',
  'México': '🇲🇽',
  'Japão': '🇯🇵',
  'Marrocos': '🇲🇦',
  'Senegal': '🇸🇳',
};

export function FigurinhaCard({ figurinha, compact = false }: FigurinhaCardProps) {
  const status = statusConfig[figurinha.status] || statusConfig.tenho;

  return (
    <div
      className="figurinha-card select-none"
      style={{ width: compact ? '140px' : '180px', minHeight: compact ? '200px' : '260px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: 'rgba(254,221,0,0.15)', borderBottom: '1px solid rgba(254,221,0,0.3)' }}
      >
        <span className="text-[#FEDD00] font-black text-xs uppercase tracking-wider">CopaCards</span>
        {figurinha.numero_camisa && (
          <span className="text-white font-bold text-sm">#{figurinha.numero_camisa}</span>
        )}
      </div>

      {/* Image */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{ height: compact ? '90px' : '130px', background: 'linear-gradient(180deg, rgba(1,33,105,0.8) 0%, rgba(0,151,57,0.4) 100%)' }}
      >
        {figurinha.imagem_url ? (
          <img
            src={figurinha.imagem_url}
            alt={figurinha.nome_atleta}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg width={compact ? 40 : 56} height={compact ? 40 : 56} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="rgba(254,221,0,0.5)" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(254,221,0,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        )}
        {/* Status badge */}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2 flex flex-col gap-1">
        <p className="text-white font-black text-sm uppercase tracking-wide leading-tight truncate">
          {figurinha.nome_atleta}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[#FEDD00] font-semibold text-xs truncate">
            {selectionFlags[figurinha.selecao] || ''} {figurinha.selecao}
          </span>
        </div>
        {figurinha.posicao && (
          <p className="text-white/60 text-xs truncate">{figurinha.posicao}</p>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-1.5 flex items-center justify-center"
        style={{ background: 'rgba(254,221,0,0.08)', borderTop: '1px solid rgba(254,221,0,0.2)' }}
      >
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i <= 3 ? '#FEDD00' : 'rgba(254,221,0,0.2)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
