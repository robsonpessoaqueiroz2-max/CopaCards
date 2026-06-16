import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { Input, TextArea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

type Figurinha = Database['public']['Tables']['figurinhas']['Row'];

interface FigurinhaFormProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  editData?: Figurinha | null;
  onSuccess: () => void;
}

const SELECOES = [
  'Brasil', 'Argentina', 'França', 'Alemanha', 'Espanha', 'Portugal', 'Itália',
  'Inglaterra', 'Holanda', 'Bélgica', 'Croácia', 'Uruguai', 'México', 'Japão',
  'Marrocos', 'Senegal', 'Estados Unidos', 'Austrália', 'Coreia do Sul', 'Polônia',
  'Suíça', 'Dinamarca', 'Sérvia', 'Camarões', 'Gana', 'Equador', 'Canadá', 'Costa Rica',
  'Tunísia', 'Arábia Saudita', 'Irã', 'Qatar', 'Outro',
];

const POSICOES = ['Goleiro', 'Defensor', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Centroavante', 'Ponta'];

export function FigurinhaForm({ open, onClose, userId, editData, onSuccess }: FigurinhaFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editData?.imagem_url || null);

  const [form, setForm] = useState({
    nome_atleta: editData?.nome_atleta || '',
    selecao: editData?.selecao || 'Brasil',
    posicao: editData?.posicao || 'Atacante',
    numero_camisa: editData?.numero_camisa?.toString() || '',
    status: (editData?.status || 'tenho') as 'tenho' | 'quero' | 'repetida',
    descricao: editData?.descricao || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Imagem muito grande. Máximo 5MB.', 'error');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome_atleta.trim()) errs.nome_atleta = 'Nome do atleta é obrigatório';
    if (!form.selecao) errs.selecao = 'Seleção é obrigatória';
    if (form.numero_camisa && (isNaN(Number(form.numero_camisa)) || Number(form.numero_camisa) < 1 || Number(form.numero_camisa) > 99)) {
      errs.numero_camisa = 'Número da camisa deve ser entre 1 e 99';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      let imagem_url = editData?.imagem_url || null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('figurinhas')
          .upload(path, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('figurinhas').getPublicUrl(path);
        imagem_url = urlData.publicUrl;
      }

      const payload = {
        nome_atleta: form.nome_atleta.trim(),
        selecao: form.selecao,
        posicao: form.posicao || null,
        numero_camisa: form.numero_camisa ? Number(form.numero_camisa) : null,
        imagem_url,
        status: form.status,
        descricao: form.descricao.trim() || null,
      };

      if (editData) {
        const { error } = await supabase
          .from('figurinhas')
          .update(payload)
          .eq('id', editData.id)
          .eq('user_id', userId);
        if (error) throw error;
        toast('Figurinha atualizada com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('figurinhas')
          .insert({ ...payload, user_id: userId });
        if (error) throw error;
        toast('Figurinha criada com sucesso!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar figurinha', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? 'Editar Figurinha' : 'Nova Figurinha'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Image upload */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-32 h-40 rounded-xl border-2 border-dashed border-[#FEDD00] overflow-hidden cursor-pointer flex items-center justify-center relative"
            style={{ background: '#F3F4F6' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/50">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-center px-2">Clique para adicionar foto</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">JPG, PNG, WebP — máx. 5MB</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Nome do Atleta *"
              placeholder="Ex: Pelé"
              value={form.nome_atleta}
              onChange={e => setForm(f => ({ ...f, nome_atleta: e.target.value }))}
              error={errors.nome_atleta}
            />
          </div>

          <Select
            label="Seleção *"
            value={form.selecao}
            onChange={e => setForm(f => ({ ...f, selecao: e.target.value }))}
            options={SELECOES.map(s => ({ value: s, label: s }))}
            error={errors.selecao}
          />

          <Select
            label="Posição"
            value={form.posicao}
            onChange={e => setForm(f => ({ ...f, posicao: e.target.value }))}
            options={[{ value: '', label: 'Selecionar' }, ...POSICOES.map(p => ({ value: p, label: p }))]}
          />

          <Input
            label="Número da Camisa"
            type="number"
            min="1"
            max="99"
            placeholder="Ex: 10"
            value={form.numero_camisa}
            onChange={e => setForm(f => ({ ...f, numero_camisa: e.target.value }))}
            error={errors.numero_camisa}
          />

          <Select
            label="Status *"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as 'tenho' | 'quero' | 'repetida' }))}
            options={[
              { value: 'tenho', label: 'Tenho' },
              { value: 'quero', label: 'Quero' },
              { value: 'repetida', label: 'Repetida' },
            ]}
          />
        </div>

        <TextArea
          label="Descrição"
          placeholder="Fatos interessantes sobre este atleta..."
          rows={3}
          value={form.descricao}
          onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {editData ? 'Salvar Alterações' : 'Criar Figurinha'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
