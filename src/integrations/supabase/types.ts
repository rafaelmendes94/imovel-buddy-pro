export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agenciamentos: {
        Row: {
          ano_construcao_iptu: string
          apto_quadra_lote: string
          bairro: string
          box: string
          chaves_obra: string
          cidade: string
          cond_iptu: string
          condicao_pagamento: string
          created_at: string
          data_atualizacao: string | null
          data_inclusao: string | null
          destaque: string
          dormitorios: string
          entrada: string
          fin_bancario: string
          id: string
          imovel: string
          metragem: number
          mobiliado: string
          observacoes: string
          padrao: string
          posicao: string
          prazo_direto: string
          proprietario: string
          rua: string
          status: string
          telefone: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ano_construcao_iptu?: string
          apto_quadra_lote?: string
          bairro?: string
          box?: string
          chaves_obra?: string
          cidade?: string
          cond_iptu?: string
          condicao_pagamento?: string
          created_at?: string
          data_atualizacao?: string | null
          data_inclusao?: string | null
          destaque?: string
          dormitorios?: string
          entrada?: string
          fin_bancario?: string
          id?: string
          imovel?: string
          metragem?: number
          mobiliado?: string
          observacoes?: string
          padrao?: string
          posicao?: string
          prazo_direto?: string
          proprietario?: string
          rua?: string
          status?: string
          telefone?: string
          tipo?: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          ano_construcao_iptu?: string
          apto_quadra_lote?: string
          bairro?: string
          box?: string
          chaves_obra?: string
          cidade?: string
          cond_iptu?: string
          condicao_pagamento?: string
          created_at?: string
          data_atualizacao?: string | null
          data_inclusao?: string | null
          destaque?: string
          dormitorios?: string
          entrada?: string
          fin_bancario?: string
          id?: string
          imovel?: string
          metragem?: number
          mobiliado?: string
          observacoes?: string
          padrao?: string
          posicao?: string
          prazo_direto?: string
          proprietario?: string
          rua?: string
          status?: string
          telefone?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      avaliacao_utils: {
        Row: {
          avaliacao_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          avaliacao_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          avaliacao_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_utils_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "construtora_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      brick_items: {
        Row: {
          categoria: string
          cidade: string | null
          created_at: string
          descricao: string | null
          estado: string
          id: string
          imagens: string[] | null
          preco: number
          telefone: string | null
          titulo: string
          updated_at: string
          user_id: string
          vendido: boolean
        }
        Insert: {
          categoria?: string
          cidade?: string | null
          created_at?: string
          descricao?: string | null
          estado?: string
          id?: string
          imagens?: string[] | null
          preco?: number
          telefone?: string | null
          titulo: string
          updated_at?: string
          user_id: string
          vendido?: boolean
        }
        Update: {
          categoria?: string
          cidade?: string | null
          created_at?: string
          descricao?: string | null
          estado?: string
          id?: string
          imagens?: string[] | null
          preco?: number
          telefone?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
          vendido?: boolean
        }
        Relationships: []
      }
      broker_page_views: {
        Row: {
          broker_slug: string
          id: string
          viewed_at: string
        }
        Insert: {
          broker_slug: string
          id?: string
          viewed_at?: string
        }
        Update: {
          broker_slug?: string
          id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      broker_ratings: {
        Row: {
          agilidade: number
          atendimento: number
          broker_id: string
          comentario: string | null
          conhecimento_mercado: number
          created_at: string
          id: string
          negociacao: number
          pontualidade: number
          rater_id: string
          updated_at: string
        }
        Insert: {
          agilidade?: number
          atendimento?: number
          broker_id: string
          comentario?: string | null
          conhecimento_mercado?: number
          created_at?: string
          id?: string
          negociacao?: number
          pontualidade?: number
          rater_id: string
          updated_at?: string
        }
        Update: {
          agilidade?: number
          atendimento?: number
          broker_id?: string
          comentario?: string | null
          conhecimento_mercado?: number
          created_at?: string
          id?: string
          negociacao?: number
          pontualidade?: number
          rater_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      city_galleries: {
        Row: {
          capa_url: string
          cidade: string
          created_at: string
          descricao: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          capa_url?: string
          cidade?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          capa_url?: string
          cidade?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      city_gallery_items: {
        Row: {
          created_at: string
          gallery_id: string
          id: string
          sort_order: number
          tipo: string
          titulo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          gallery_id: string
          id?: string
          sort_order?: number
          tipo?: string
          titulo?: string | null
          url?: string
        }
        Update: {
          created_at?: string
          gallery_id?: string
          id?: string
          sort_order?: number
          tipo?: string
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_gallery_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "city_galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      condominios: {
        Row: {
          amenidades: string[] | null
          ano_construcao: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          construtora: string | null
          created_at: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          fotos_empreendimento: string[] | null
          fotos_infra: string[] | null
          id: string
          imagem_url: string | null
          implantacao_url: string | null
          latitude: number | null
          longitude: number | null
          mapa_pdf_url: string | null
          material_digital: string[] | null
          nome: string
          numero: string | null
          taxa_condominio: number | null
          tipo: string | null
          total_unidades: number | null
          unidades_disponiveis: number | null
          user_id: string
          videos: string[] | null
        }
        Insert: {
          amenidades?: string[] | null
          ano_construcao?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          construtora?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          fotos_empreendimento?: string[] | null
          fotos_infra?: string[] | null
          id?: string
          imagem_url?: string | null
          implantacao_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mapa_pdf_url?: string | null
          material_digital?: string[] | null
          nome: string
          numero?: string | null
          taxa_condominio?: number | null
          tipo?: string | null
          total_unidades?: number | null
          unidades_disponiveis?: number | null
          user_id: string
          videos?: string[] | null
        }
        Update: {
          amenidades?: string[] | null
          ano_construcao?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          construtora?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          fotos_empreendimento?: string[] | null
          fotos_infra?: string[] | null
          id?: string
          imagem_url?: string | null
          implantacao_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mapa_pdf_url?: string | null
          material_digital?: string[] | null
          nome?: string
          numero?: string | null
          taxa_condominio?: number | null
          tipo?: string | null
          total_unidades?: number | null
          unidades_disponiveis?: number | null
          user_id?: string
          videos?: string[] | null
        }
        Relationships: []
      }
      construtora_avaliacoes: {
        Row: {
          comentario: string | null
          condicoes_propostas: number
          construtora_id: string
          created_at: string
          cumprimento_prazos: number
          facilidade_aquisicao: number
          id: string
          qualidade_construcao: number
          reputacao: number
          suporte_corretor: number
          user_id: string
          util_count: number
        }
        Insert: {
          comentario?: string | null
          condicoes_propostas?: number
          construtora_id: string
          created_at?: string
          cumprimento_prazos?: number
          facilidade_aquisicao?: number
          id?: string
          qualidade_construcao?: number
          reputacao?: number
          suporte_corretor?: number
          user_id: string
          util_count?: number
        }
        Update: {
          comentario?: string | null
          condicoes_propostas?: number
          construtora_id?: string
          created_at?: string
          cumprimento_prazos?: number
          facilidade_aquisicao?: number
          id?: string
          qualidade_construcao?: number
          reputacao?: number
          suporte_corretor?: number
          user_id?: string
          util_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "construtora_avaliacoes_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "construtoras"
            referencedColumns: ["id"]
          },
        ]
      }
      construtora_empreendimentos: {
        Row: {
          cidade: string | null
          construtora_id: string
          created_at: string
          descricao: string | null
          endereco: string | null
          id: string
          imagem_url: string | null
          nome: string
          previsao_entrega: string | null
          status: string
          tipo: string | null
          total_unidades: number | null
          unidades_vendidas: number | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          construtora_id: string
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          previsao_entrega?: string | null
          status?: string
          tipo?: string | null
          total_unidades?: number | null
          unidades_vendidas?: number | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          construtora_id?: string
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          previsao_entrega?: string | null
          status?: string
          tipo?: string | null
          total_unidades?: number | null
          unidades_vendidas?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "construtora_empreendimentos_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "construtoras"
            referencedColumns: ["id"]
          },
        ]
      }
      construtora_unidades: {
        Row: {
          andar: string | null
          area: number | null
          created_at: string
          empreendimento_id: string
          id: string
          numero: string
          observacao: string | null
          preco: number | null
          quartos: number | null
          status: string
          tipo: string | null
        }
        Insert: {
          andar?: string | null
          area?: number | null
          created_at?: string
          empreendimento_id: string
          id?: string
          numero: string
          observacao?: string | null
          preco?: number | null
          quartos?: number | null
          status?: string
          tipo?: string | null
        }
        Update: {
          andar?: string | null
          area?: number | null
          created_at?: string
          empreendimento_id?: string
          id?: string
          numero?: string
          observacao?: string | null
          preco?: number | null
          quartos?: number | null
          status?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construtora_unidades_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "construtora_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      construtoras: {
        Row: {
          ano_fundacao: string | null
          avaliacao: number | null
          cidade: string | null
          cnpj: string | null
          cor_fundo: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          cor_texto: string | null
          cover_url: string | null
          created_at: string
          descricao: string | null
          email: string | null
          estado: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nome: string
          perfil_url: string | null
          slug: string
          status: string
          telefone: string | null
          total_avaliacoes: number | null
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          ano_fundacao?: string | null
          avaliacao?: number | null
          cidade?: string | null
          cnpj?: string | null
          cor_fundo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          cor_texto?: string | null
          cover_url?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome: string
          perfil_url?: string | null
          slug: string
          status?: string
          telefone?: string | null
          total_avaliacoes?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          ano_fundacao?: string | null
          avaliacao?: number | null
          cidade?: string | null
          cnpj?: string | null
          cor_fundo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          cor_texto?: string | null
          cover_url?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome?: string
          perfil_url?: string | null
          slug?: string
          status?: string
          telefone?: string | null
          total_avaliacoes?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      edificios: {
        Row: {
          andares: number | null
          ano_construcao: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          construtora: string | null
          created_at: string | null
          endereco: string | null
          estado: string | null
          fotos_empreendimento: string[] | null
          fotos_infra: string[] | null
          id: string
          imagem_url: string | null
          infraestrutura: string[] | null
          latitude: number | null
          longitude: number | null
          material_digital: string[] | null
          nome: string
          numero: string | null
          status: string | null
          total_unidades: number | null
          unidades_por_andar: number | null
          user_id: string
          videos: string[] | null
        }
        Insert: {
          andares?: number | null
          ano_construcao?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          construtora?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          fotos_empreendimento?: string[] | null
          fotos_infra?: string[] | null
          id?: string
          imagem_url?: string | null
          infraestrutura?: string[] | null
          latitude?: number | null
          longitude?: number | null
          material_digital?: string[] | null
          nome: string
          numero?: string | null
          status?: string | null
          total_unidades?: number | null
          unidades_por_andar?: number | null
          user_id: string
          videos?: string[] | null
        }
        Update: {
          andares?: number | null
          ano_construcao?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          construtora?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          fotos_empreendimento?: string[] | null
          fotos_infra?: string[] | null
          id?: string
          imagem_url?: string | null
          infraestrutura?: string[] | null
          latitude?: number | null
          longitude?: number | null
          material_digital?: string[] | null
          nome?: string
          numero?: string | null
          status?: string | null
          total_unidades?: number | null
          unidades_por_andar?: number | null
          user_id?: string
          videos?: string[] | null
        }
        Relationships: []
      }
      empreendimentos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          construtora: string | null
          created_at: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          fotos_empreendimento: string[] | null
          fotos_infra: string[] | null
          id: string
          imagem_url: string | null
          imagens: string[] | null
          infraestrutura: string[] | null
          latitude: number | null
          link_360: string | null
          link_video: string | null
          longitude: number | null
          material_digital: string[] | null
          nome: string
          numero: string | null
          previsao_entrega: string | null
          status: string | null
          tipo: string | null
          total_unidades: number | null
          user_id: string
          videos: string[] | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          construtora?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          fotos_empreendimento?: string[] | null
          fotos_infra?: string[] | null
          id?: string
          imagem_url?: string | null
          imagens?: string[] | null
          infraestrutura?: string[] | null
          latitude?: number | null
          link_360?: string | null
          link_video?: string | null
          longitude?: number | null
          material_digital?: string[] | null
          nome: string
          numero?: string | null
          previsao_entrega?: string | null
          status?: string | null
          tipo?: string | null
          total_unidades?: number | null
          user_id: string
          videos?: string[] | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          construtora?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          fotos_empreendimento?: string[] | null
          fotos_infra?: string[] | null
          id?: string
          imagem_url?: string | null
          imagens?: string[] | null
          infraestrutura?: string[] | null
          latitude?: number | null
          link_360?: string | null
          link_video?: string | null
          longitude?: number | null
          material_digital?: string[] | null
          nome?: string
          numero?: string | null
          previsao_entrega?: string | null
          status?: string | null
          tipo?: string | null
          total_unidades?: number | null
          user_id?: string
          videos?: string[] | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          imovel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imovel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imovel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      imoveis: {
        Row: {
          aceita_permuta: boolean
          area: number
          area_privativa: number
          ativo_site: boolean
          bairro: string | null
          banheiros: number
          bonus: number | null
          bonus_validade: string | null
          box: string | null
          cep: string | null
          cidade: string
          comissao: number | null
          complemento: string | null
          condicao: string | null
          condicoes_pagamento: string[] | null
          condominio_id: string | null
          corretor_id: string | null
          corretor_nome: string | null
          created_at: string
          data_venda: string | null
          decorado: boolean
          descricao: string | null
          destaque_categoria: string | null
          destaque_home: boolean
          drive_fotos_url: string | null
          edificio_id: string | null
          elevadores: number | null
          empreendimento: string | null
          empreendimento_id: string | null
          endereco: string
          estado: string | null
          fotos_pdf_url: string | null
          id: string
          imagens: string[] | null
          imobiliaria_nome: string | null
          infraestrutura: string[] | null
          latitude: number | null
          lavabo: number
          link_360: string | null
          link_material: string | null
          link_video: string | null
          local_chaves: string | null
          longitude: number | null
          lote: string | null
          numero: string | null
          outras_caracteristicas: string[] | null
          padrao: string | null
          plataforma_venda: string | null
          posicao_predio: string | null
          posicao_solar: string | null
          preco: number
          preco_parcelado: number | null
          proprietario: string | null
          proprietario_telefone: string | null
          proprietario_tipo: string | null
          quadra: string | null
          quartos: number
          status: string
          termo_exclusividade: string | null
          termo_exclusividade_url: string | null
          tipo: string
          titulo: string
          unidade: string | null
          updated_at: string
          user_id: string
          vagas: number
          views: number
          vista: string | null
          vista_mar: boolean
        }
        Insert: {
          aceita_permuta?: boolean
          area?: number
          area_privativa?: number
          ativo_site?: boolean
          bairro?: string | null
          banheiros?: number
          bonus?: number | null
          bonus_validade?: string | null
          box?: string | null
          cep?: string | null
          cidade?: string
          comissao?: number | null
          complemento?: string | null
          condicao?: string | null
          condicoes_pagamento?: string[] | null
          condominio_id?: string | null
          corretor_id?: string | null
          corretor_nome?: string | null
          created_at?: string
          data_venda?: string | null
          decorado?: boolean
          descricao?: string | null
          destaque_categoria?: string | null
          destaque_home?: boolean
          drive_fotos_url?: string | null
          edificio_id?: string | null
          elevadores?: number | null
          empreendimento?: string | null
          empreendimento_id?: string | null
          endereco?: string
          estado?: string | null
          fotos_pdf_url?: string | null
          id?: string
          imagens?: string[] | null
          imobiliaria_nome?: string | null
          infraestrutura?: string[] | null
          latitude?: number | null
          lavabo?: number
          link_360?: string | null
          link_material?: string | null
          link_video?: string | null
          local_chaves?: string | null
          longitude?: number | null
          lote?: string | null
          numero?: string | null
          outras_caracteristicas?: string[] | null
          padrao?: string | null
          plataforma_venda?: string | null
          posicao_predio?: string | null
          posicao_solar?: string | null
          preco?: number
          preco_parcelado?: number | null
          proprietario?: string | null
          proprietario_telefone?: string | null
          proprietario_tipo?: string | null
          quadra?: string | null
          quartos?: number
          status?: string
          termo_exclusividade?: string | null
          termo_exclusividade_url?: string | null
          tipo?: string
          titulo: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          vagas?: number
          views?: number
          vista?: string | null
          vista_mar?: boolean
        }
        Update: {
          aceita_permuta?: boolean
          area?: number
          area_privativa?: number
          ativo_site?: boolean
          bairro?: string | null
          banheiros?: number
          bonus?: number | null
          bonus_validade?: string | null
          box?: string | null
          cep?: string | null
          cidade?: string
          comissao?: number | null
          complemento?: string | null
          condicao?: string | null
          condicoes_pagamento?: string[] | null
          condominio_id?: string | null
          corretor_id?: string | null
          corretor_nome?: string | null
          created_at?: string
          data_venda?: string | null
          decorado?: boolean
          descricao?: string | null
          destaque_categoria?: string | null
          destaque_home?: boolean
          drive_fotos_url?: string | null
          edificio_id?: string | null
          elevadores?: number | null
          empreendimento?: string | null
          empreendimento_id?: string | null
          endereco?: string
          estado?: string | null
          fotos_pdf_url?: string | null
          id?: string
          imagens?: string[] | null
          imobiliaria_nome?: string | null
          infraestrutura?: string[] | null
          latitude?: number | null
          lavabo?: number
          link_360?: string | null
          link_material?: string | null
          link_video?: string | null
          local_chaves?: string | null
          longitude?: number | null
          lote?: string | null
          numero?: string | null
          outras_caracteristicas?: string[] | null
          padrao?: string | null
          plataforma_venda?: string | null
          posicao_predio?: string | null
          posicao_solar?: string | null
          preco?: number
          preco_parcelado?: number | null
          proprietario?: string | null
          proprietario_telefone?: string | null
          proprietario_tipo?: string | null
          quadra?: string | null
          quartos?: number
          status?: string
          termo_exclusividade?: string | null
          termo_exclusividade_url?: string | null
          tipo?: string
          titulo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          vagas?: number
          views?: number
          vista?: string | null
          vista_mar?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edificios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      imovel_logs: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: string
          imovel_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          action?: string
          changes?: Json
          created_at?: string
          id?: string
          imovel_id: string
          user_id: string
          user_name?: string
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: string
          imovel_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      implantacoes: {
        Row: {
          created_at: string
          descricao: string | null
          empreendimento_id: string
          id: string
          imagem_capa_url: string
          mapa_url: string
          tipo_arquivo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empreendimento_id: string
          id?: string
          imagem_capa_url?: string
          mapa_url?: string
          tipo_arquivo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empreendimento_id?: string
          id?: string
          imagem_capa_url?: string
          mapa_url?: string
          tipo_arquivo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "implantacoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          id: string
          name: string
          permissions: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          permissions?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          permissions?: Json
        }
        Relationships: []
      }
      partners: {
        Row: {
          address: string | null
          category: string
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          projects: number | null
          rating: number | null
          since_year: string | null
          slug: string
          sort_order: number | null
          status: string
          total_ratings: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          projects?: number | null
          rating?: number | null
          since_year?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          total_ratings?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          projects?: number | null
          rating?: number | null
          since_year?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          total_ratings?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          paid_at: string | null
          reference_month: string
          status: string
          subscriber_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          paid_at?: string | null
          reference_month: string
          status?: string
          subscriber_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          reference_month?: string
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          id: string
          is_active: boolean
          is_free: boolean
          max_brokers: number
          max_properties: number
          modules: Json
          name: string
          plan_type: string
          price: number
          trial_days: number
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          max_brokers?: number
          max_properties?: number
          modules?: Json
          name: string
          plan_type?: string
          price?: number
          trial_days?: number
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          max_brokers?: number
          max_properties?: number
          modules?: Json
          name?: string
          plan_type?: string
          price?: number
          trial_days?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          agency_id: string | null
          asaas_customer_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          ratings_public: boolean
          user_id: string
        }
        Insert: {
          account_type?: string
          agency_id?: string | null
          asaas_customer_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          ratings_public?: boolean
          user_id: string
        }
        Update: {
          account_type?: string
          agency_id?: string | null
          asaas_customer_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          ratings_public?: boolean
          user_id?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          accent_color: string
          bio: string | null
          config_type: string
          cover_photo_url: string | null
          created_at: string
          email_contact: string | null
          footer_color: string
          footer_text: string
          header_color: string
          id: string
          instagram: string | null
          logo_url: string | null
          owner_id: string | null
          profile_photo_url: string | null
          site_title: string
          slogan: string
          tabela_url: string | null
          title_color: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string
          bio?: string | null
          config_type?: string
          cover_photo_url?: string | null
          created_at?: string
          email_contact?: string | null
          footer_color?: string
          footer_text?: string
          header_color?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          owner_id?: string | null
          profile_photo_url?: string | null
          site_title?: string
          slogan?: string
          tabela_url?: string | null
          title_color?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string
          bio?: string | null
          config_type?: string
          cover_photo_url?: string | null
          created_at?: string
          email_contact?: string | null
          footer_color?: string
          footer_text?: string
          header_color?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          owner_id?: string | null
          profile_photo_url?: string | null
          site_title?: string
          slogan?: string
          tabela_url?: string | null
          title_color?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          can_manage_clients: boolean
          can_manage_plans: boolean
          can_manage_staff: boolean
          can_view_corretores: boolean
          can_view_financeiro: boolean
          can_view_relatorios: boolean
          created_at: string
          function_title: string
          id: string
          permissions: Json
          user_id: string
        }
        Insert: {
          can_manage_clients?: boolean
          can_manage_plans?: boolean
          can_manage_staff?: boolean
          can_view_corretores?: boolean
          can_view_financeiro?: boolean
          can_view_relatorios?: boolean
          created_at?: string
          function_title?: string
          id?: string
          permissions?: Json
          user_id: string
        }
        Update: {
          can_manage_clients?: boolean
          can_manage_plans?: boolean
          can_manage_staff?: boolean
          can_view_corretores?: boolean
          can_view_financeiro?: boolean
          can_view_relatorios?: boolean
          created_at?: string
          function_title?: string
          id?: string
          permissions?: Json
          user_id?: string
        }
        Relationships: []
      }
      subscriber_brokers: {
        Row: {
          created_at: string
          creci: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_brokers_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          creci: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          mercado_pago_payment_id: string | null
          paid_at: string | null
          reference_period: string | null
          status: string
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mercado_pago_payment_id?: string | null
          paid_at?: string | null
          reference_period?: string | null
          status?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mercado_pago_payment_id?: string | null
          paid_at?: string | null
          reference_period?: string | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          blocked_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mercado_pago_subscription_id: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mercado_pago_subscription_id?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mercado_pago_subscription_id?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_options: {
        Row: {
          category: string
          created_at: string
          id: string
          sort_order: number
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          sort_order?: number
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_broker_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_imoveis_in_subscription: {
        Args: { _user_id: string }
        Returns: number
      }
      create_trial_subscription: {
        Args: { _plan_id: string; _user_id: string }
        Returns: string
      }
      get_effective_subscription: {
        Args: { _user_id: string }
        Returns: {
          blocked_at: string
          current_period_end: string
          current_period_start: string
          effective_owner: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      imovel_owner_has_active_sub: {
        Args: { _owner: string }
        Returns: boolean
      }
      increment_broker_page_view: {
        Args: { _slug: string }
        Returns: undefined
      }
      increment_imovel_views: {
        Args: { imovel_id: string }
        Returns: undefined
      }
      link_broker_to_agency: {
        Args: { _agency_user_id: string; _broker_email: string }
        Returns: string
      }
      owns_site_config_slug: { Args: { _owner_id: string }; Returns: boolean }
      process_subscription_lifecycle: {
        Args: never
        Returns: {
          action: string
          subscription_id: string
          user_id: string
        }[]
      }
      simulate_payment_approval: { Args: { _user_id: string }; Returns: string }
      simulate_subscription_status: {
        Args: {
          _new_status: Database["public"]["Enums"]["subscription_status"]
          _user_id: string
        }
        Returns: string
      }
      test_lifecycle_flow: {
        Args: { _subscription_id: string }
        Returns: {
          blocked_at_resultado: string
          etapa: string
          status_resultado: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin_staff" | "broker"
      billing_cycle: "monthly" | "quarterly" | "annual"
      subscription_status:
        | "trial"
        | "active"
        | "overdue"
        | "blocked"
        | "cancelled"
        | "pending_payment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin_staff", "broker"],
      billing_cycle: ["monthly", "quarterly", "annual"],
      subscription_status: [
        "trial",
        "active",
        "overdue",
        "blocked",
        "cancelled",
        "pending_payment",
      ],
    },
  },
} as const
