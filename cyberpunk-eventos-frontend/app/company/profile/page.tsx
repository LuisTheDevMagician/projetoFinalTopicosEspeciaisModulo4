'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clienteApi } from '@/lib/api-client';
import { Empresa } from '@/lib/types';
import { toast } from 'sonner';

export default function CompanyProfile() {
  const { usuario, tipoUsuario, carregando, atualizarUsuario } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const empresa = usuario as Empresa;
  const [formData, setFormData] = useState({
    name: empresa?.nome || '',
    address: empresa?.endereco || '',
    bio: empresa?.biografia || '',
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const previousUsuarioRef = useRef<string | null>(null);

  useEffect(() => {
    if (!carregando && tipoUsuario !== 'empresa') {
      router.push('/login');
    }
  }, [carregando, tipoUsuario, router]);

  useEffect(() => {
    if (usuario) {
      const empresaData = usuario as Empresa;
      const usuarioString = JSON.stringify({
        nome: empresaData.nome,
        endereco: empresaData.endereco,
        biografia: empresaData.biografia,
      });

      // Só atualiza se usuario realmente mudou
      if (previousUsuarioRef.current !== usuarioString) {
        previousUsuarioRef.current = usuarioString;
        const newData = {
          name: empresaData.nome || '',
          address: empresaData.endereco || '',
          bio: empresaData.biografia || '',
        };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Sincronização necessária de estado externo (auth context) com estado local do formulário
        setFormData(newData);
      }
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append('nome', formData.name);
    if (formData.address) formDataToSend.append('endereco', formData.address);
    if (formData.bio) formDataToSend.append('biografia', formData.bio);
    if (profileImage) formDataToSend.append('imagem_perfil', profileImage);
    if (backgroundImage) formDataToSend.append('imagem_fundo', backgroundImage);

    const response = await clienteApi.atualizar<Empresa>('/empresas/eu', formDataToSend, true);

    if (response.dados) {
      toast.success('Perfil atualizado com sucesso!');
      atualizarUsuario(response.dados);
      setProfileImage(null);
      setBackgroundImage(null);
    } else {
      toast.error(response.erro || 'Erro ao atualizar perfil');
    }

    setIsSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    const formData = new FormData();
    formData.append('senha_antiga', passwordData.oldPassword);
    formData.append('senha_nova', passwordData.newPassword);

    const response = await clienteApi.atualizar('/empresas/eu/senha', formData, true);

    if (response.dados || !response.erro) {
      toast.success('Senha alterada com sucesso!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(response.erro || 'Erro ao alterar senha');
    }

    setIsChangingPassword(false);
  };

  if (carregando) {
    return (
      <DashboardLayout type="company">
        <div className="flex items-center justify-center h-64">
          <p className="text-white">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="company">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

        <Card className="bg-black/50 border-purple-400/30 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Empresa
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                Endereço
              </label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-white"
              />
            </div>

            <div>
              <label
                htmlFor="profile_image"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Imagem de Perfil
              </label>
              <Input
                id="profile_image"
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <div>
              <label
                htmlFor="background_image"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Imagem de Fundo
              </label>
              <Input
                id="background_image"
                type="file"
                accept="image/*"
                onChange={(e) => setBackgroundImage(e.target.files?.[0] || null)}
                className="bg-black/30 border-gray-600 text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-purple-400 hover:bg-purple-500 text-black"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>

          {/* Seção de Mudança de Senha */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Alterar Senha</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Senha Atual
                </label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                  required
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Nova Senha
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirmar Nova Senha
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                  className="bg-black/30 border-gray-600 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-purple-400 hover:bg-purple-500 text-black"
              >
                {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
