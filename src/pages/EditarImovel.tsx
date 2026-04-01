import { useParams } from 'react-router-dom';
import { SmartLayout } from '@/components/SmartLayout';
import { ImovelForm } from './CadastroImovel';

export default function EditarImovel() {
  const { id } = useParams<{ id: string }>();

  return (
    <SmartLayout>
      <ImovelForm editId={id} />
    </SmartLayout>
  );
}
