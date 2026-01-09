'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clienteApi } from '@/lib/api-client';
import { RespostaAuth, Empresa, Cliente } from '@/lib/types';

interface TipoContextoAuth {
  usuario: Empresa | Cliente | null;
  tipoUsuario: 'empresa' | 'cliente' | null;
  carregando: boolean;
  entrar: (
    email: string,
    senha: string,
    tipoUsuario: 'empresa' | 'cliente'
  ) => Promise<{ sucesso: boolean; erro?: string }>;
  registrar: (
    dados: unknown,
    tipoUsuario: 'empresa' | 'cliente'
  ) => Promise<{ sucesso: boolean; erro?: string }>;
  sair: () => void;
  atualizarUsuario: (usuario: Empresa | Cliente) => void;
}

const ContextoAuth = createContext<TipoContextoAuth | undefined>(undefined);

export function ProvedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Empresa | Cliente | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<'empresa' | 'cliente' | null>(null);
  const [carregando, setCarregando] = useState(true);
  const roteador = useRouter();

  const sair = () => {
    localStorage.removeItem('token_acesso');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('usuario_id');
    setUsuario(null);
    setTipoUsuario(null);
    roteador.push('/');
  };

  const buscarPerfilUsuario = async (tipo: 'empresa' | 'cliente') => {
    const endpoint = tipo === 'empresa' ? '/empresas/eu' : '/clientes/eu';
    const resposta = await clienteApi.obter<Empresa | Cliente>(endpoint, true);

    if (resposta.dados) {
      setUsuario(resposta.dados);
      setTipoUsuario(tipo);
    } else {
      sair();
    }
    setCarregando(false);
  };

  useEffect(() => {
    // Verificar se o usuário está logado na montagem
    const token = localStorage.getItem('token_acesso');
    const tipo = localStorage.getItem('tipo_usuario') as 'empresa' | 'cliente' | null;

    if (token && tipo) {
      buscarPerfilUsuario(tipo);
    } else {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = async (email: string, senha: string, tipo: 'empresa' | 'cliente') => {
    const resposta = await clienteApi.postar<RespostaAuth>('/auth/login', {
      email,
      senha,
      tipo_usuario: tipo,
    });

    if (resposta.dados) {
      localStorage.setItem('token_acesso', resposta.dados.token_acesso);
      localStorage.setItem('tipo_usuario', resposta.dados.tipo_usuario);
      localStorage.setItem('usuario_id', resposta.dados.usuario_id.toString());

      await buscarPerfilUsuario(tipo);

      // Redirecionar baseado no tipo de usuário
      if (tipo === 'empresa') {
        roteador.push('/company/dashboard');
      } else {
        roteador.push('/client/dashboard');
      }

      return { sucesso: true };
    }

    return { sucesso: false, erro: resposta.erro };
  };

  const registrar = async (dados: unknown, tipo: 'empresa' | 'cliente') => {
    const endpoint = tipo === 'empresa' ? '/auth/registrar/empresa' : '/auth/registrar/cliente';
    const resposta = await clienteApi.postar<Empresa | Cliente>(endpoint, dados);

    if (resposta.dados) {
      // Login automático após registro
      const dadosObj = dados as { email: string; senha: string };
      return await entrar(dadosObj.email, dadosObj.senha, tipo);
    }

    return { sucesso: false, erro: resposta.erro };
  };

  const atualizarUsuario = (usuarioAtualizado: Empresa | Cliente) => {
    setUsuario(usuarioAtualizado);
  };

  return (
    <ContextoAuth.Provider
      value={{ usuario, tipoUsuario, carregando, entrar, registrar, sair, atualizarUsuario }}
    >
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (contexto === undefined) {
    throw new Error('useAuth deve ser usado dentro de um ProvedorAuth');
  }
  return contexto;
}
