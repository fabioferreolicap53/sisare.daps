/**
 * Configuração e serviços para conexão com o backend PocketBase.
 * Otimizado para infraestrutura de baixo consumo (1GB RAM VM).
 * Foco em paginação e fetch eficiente.
 */

// NOTA: Para um projeto real, instale o SDK oficial: npm install pocketbase
// import PocketBase from 'pocketbase';
// export const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090');

export interface FetchOptions {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
}

/**
 * Função base para consultas eficientes, projetada para não sobrecarregar
 * o backend, usando limites estritos de paginação.
 */
export async function fetchCollection<T>(
  collection: string,
  options: FetchOptions = {}
): Promise<PaginatedResult<T>> {
  const { page = 1, perPage = 50, filter = '', sort = '' } = options;
  
  // Implementação mockada inicial. 
  // Na versão final, substitua por: return await pb.collection(collection).getList(page, perPage, { filter, sort });
  
  console.log(`[PocketBase Mock] Fetching ${collection} - Page: ${page}, Limit: ${perPage}, Filter: ${filter}, Sort: ${sort}`);
  
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    page,
    perPage,
  };
}
