import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ImovelForm } from './CadastroImovel';

export default function EditarImovel() {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <ImovelForm editId={id} />
    </AppLayout>
  );
}
