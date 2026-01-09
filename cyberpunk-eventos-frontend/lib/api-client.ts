const URL_BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RespostaApi<T> {
  dados?: T;
  erro?: string;
}

export class ClienteApi {
  private urlBase: string;

  constructor(urlBase: string = URL_BASE_API) {
    this.urlBase = urlBase;
  }

  private obterCabecalhos(incluirAuth: boolean = false): HeadersInit {
    const cabecalhos: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (incluirAuth) {
      const token = localStorage.getItem('token_acesso');
      if (token) {
        cabecalhos['Authorization'] = `Bearer ${token}`;
      }
    }

    return cabecalhos;
  }

  private obterCabecalhosMultipart(incluirAuth: boolean = false): HeadersInit {
    const cabecalhos: HeadersInit = {};

    if (incluirAuth) {
      const token = localStorage.getItem('token_acesso');
      if (token) {
        cabecalhos['Authorization'] = `Bearer ${token}`;
      }
    }

    return cabecalhos;
  }

  async requisicao<T>(
    endpoint: string,
    opcoes: RequestInit = {},
    incluirAuth: boolean = false
  ): Promise<RespostaApi<T>> {
    try {
      const resposta = await fetch(`${this.urlBase}${endpoint}`, {
        ...opcoes,
        headers:
          opcoes.body instanceof FormData
            ? this.obterCabecalhosMultipart(incluirAuth)
            : this.obterCabecalhos(incluirAuth),
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        // Se detail for um array (erro de validação), pegar a primeira mensagem
        if (Array.isArray(erro.detail)) {
          return { erro: erro.detail[0]?.msg || 'Erro de validação' };
        }
        return { erro: erro.detail || 'Ocorreu um erro' };
      }

      if (resposta.status === 204) {
        return { dados: undefined as T };
      }

      const dados = await resposta.json();
      return { dados };
    } catch {
      return { erro: 'Erro de rede. Por favor, tente novamente.' };
    }
  }

  async obter<T>(endpoint: string, incluirAuth: boolean = false): Promise<RespostaApi<T>> {
    return this.requisicao<T>(endpoint, { method: 'GET' }, incluirAuth);
  }

  async postar<T>(
    endpoint: string,
    corpo: unknown,
    incluirAuth: boolean = false
  ): Promise<RespostaApi<T>> {
    return this.requisicao<T>(
      endpoint,
      {
        method: 'POST',
        body: corpo instanceof FormData ? corpo : JSON.stringify(corpo),
      },
      incluirAuth
    );
  }

  async atualizar<T>(
    endpoint: string,
    corpo: unknown,
    incluirAuth: boolean = false
  ): Promise<RespostaApi<T>> {
    return this.requisicao<T>(
      endpoint,
      {
        method: 'PUT',
        body: corpo instanceof FormData ? corpo : JSON.stringify(corpo),
      },
      incluirAuth
    );
  }

  async deletar<T>(endpoint: string, incluirAuth: boolean = false): Promise<RespostaApi<T>> {
    return this.requisicao<T>(endpoint, { method: 'DELETE' }, incluirAuth);
  }
}

export const clienteApi = new ClienteApi();
