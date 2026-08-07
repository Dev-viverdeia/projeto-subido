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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aulas: {
        Row: {
          criado_em: string
          duracao_seg: number | null
          id: string
          modulo_id: string
          ordem: number
          titulo: string
          video_url: string | null
        }
        Insert: {
          criado_em?: string
          duracao_seg?: number | null
          id?: string
          modulo_id: string
          ordem?: number
          titulo: string
          video_url?: string | null
        }
        Update: {
          criado_em?: string
          duracao_seg?: number | null
          id?: string
          modulo_id?: string
          ordem?: number
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_solucoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          documento: Json | null
          dono: string
          erro: string | null
          id: string
          ideia_original: string
          modelo: string | null
          respostas: Json
          stack: string | null
          status: Database["public"]["Enums"]["status_builder"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          documento?: Json | null
          dono: string
          erro?: string | null
          id?: string
          ideia_original: string
          modelo?: string | null
          respostas?: Json
          stack?: string | null
          status?: Database["public"]["Enums"]["status_builder"]
          titulo?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          documento?: Json | null
          dono?: string
          erro?: string | null
          id?: string
          ideia_original?: string
          modelo?: string | null
          respostas?: Json
          stack?: string | null
          status?: Database["public"]["Enums"]["status_builder"]
          titulo?: string
        }
        Relationships: []
      }
      builder_tarefas: {
        Row: {
          atualizado_em: string
          estado: Database["public"]["Enums"]["estado_tarefa"]
          etapa_indice: number
          solucao_id: string
        }
        Insert: {
          atualizado_em?: string
          estado?: Database["public"]["Enums"]["estado_tarefa"]
          etapa_indice: number
          solucao_id: string
        }
        Update: {
          atualizado_em?: string
          estado?: Database["public"]["Enums"]["estado_tarefa"]
          etapa_indice?: number
          solucao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_tarefas_solucao_id_fkey"
            columns: ["solucao_id"]
            isOneToOne: false
            referencedRelation: "builder_solucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      calls_analises: {
        Row: {
          atualizada_em: string
          compromissos: Json
          criada_em: string
          dados: Json
          dono: string
          dores: Json
          erro: string | null
          id: string
          nota_comercial: number | null
          objecoes: Json
          oportunidades_projeto: Json
          proximos_passos: Json
          resumo: string | null
          reuniao_id: string
          sentimento: string | null
          status: string
        }
        Insert: {
          atualizada_em?: string
          compromissos?: Json
          criada_em?: string
          dados?: Json
          dono: string
          dores?: Json
          erro?: string | null
          id?: string
          nota_comercial?: number | null
          objecoes?: Json
          oportunidades_projeto?: Json
          proximos_passos?: Json
          resumo?: string | null
          reuniao_id: string
          sentimento?: string | null
          status?: string
        }
        Update: {
          atualizada_em?: string
          compromissos?: Json
          criada_em?: string
          dados?: Json
          dono?: string
          dores?: Json
          erro?: string | null
          id?: string
          nota_comercial?: number | null
          objecoes?: Json
          oportunidades_projeto?: Json
          proximos_passos?: Json
          resumo?: string | null
          reuniao_id?: string
          sentimento?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_analises_reuniao_fk"
            columns: ["dono", "reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      calls_coach_sugestoes: {
        Row: {
          categoria: string
          confianca: number | null
          criada_em: string
          dono: string
          id: string
          metodologia: string | null
          reuniao_id: string
          segundo_reuniao: number | null
          status: string
          sugestao: string
          titulo: string
          trecho_gatilho: string | null
        }
        Insert: {
          categoria: string
          confianca?: number | null
          criada_em?: string
          dono: string
          id?: string
          metodologia?: string | null
          reuniao_id: string
          segundo_reuniao?: number | null
          status?: string
          sugestao: string
          titulo: string
          trecho_gatilho?: string | null
        }
        Update: {
          categoria?: string
          confianca?: number | null
          criada_em?: string
          dono?: string
          id?: string
          metodologia?: string | null
          reuniao_id?: string
          segundo_reuniao?: number | null
          status?: string
          sugestao?: string
          titulo?: string
          trecho_gatilho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_coach_reuniao_fk"
            columns: ["dono", "reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      calls_gravacoes: {
        Row: {
          atualizada_em: string
          caminho_arquivo: string | null
          criado_em: string
          dono: string
          duracao_segundos: number | null
          encerrada_em: string | null
          erro: string | null
          id: string
          id_provedor: string | null
          iniciada_em: string | null
          reuniao_id: string
          status: string
        }
        Insert: {
          atualizada_em?: string
          caminho_arquivo?: string | null
          criado_em?: string
          dono: string
          duracao_segundos?: number | null
          encerrada_em?: string | null
          erro?: string | null
          id?: string
          id_provedor?: string | null
          iniciada_em?: string | null
          reuniao_id: string
          status?: string
        }
        Update: {
          atualizada_em?: string
          caminho_arquivo?: string | null
          criado_em?: string
          dono?: string
          duracao_segundos?: number | null
          encerrada_em?: string | null
          erro?: string | null
          id?: string
          id_provedor?: string | null
          iniciada_em?: string | null
          reuniao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_gravacoes_reuniao_fk"
            columns: ["dono", "reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      calls_participantes: {
        Row: {
          consentiu_gravacao_em: string | null
          criado_em: string
          dono: string
          email: string | null
          entrou_em: string | null
          id: string
          identidade_provedor: string | null
          nome: string
          papel: string
          reuniao_id: string
          saiu_em: string | null
          total_segundos: number | null
        }
        Insert: {
          consentiu_gravacao_em?: string | null
          criado_em?: string
          dono: string
          email?: string | null
          entrou_em?: string | null
          id?: string
          identidade_provedor?: string | null
          nome: string
          papel: string
          reuniao_id: string
          saiu_em?: string | null
          total_segundos?: number | null
        }
        Update: {
          consentiu_gravacao_em?: string | null
          criado_em?: string
          dono?: string
          email?: string | null
          entrou_em?: string | null
          id?: string
          identidade_provedor?: string | null
          nome?: string
          papel?: string
          reuniao_id?: string
          saiu_em?: string | null
          total_segundos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_participantes_reuniao_fk"
            columns: ["dono", "reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      calls_reunioes: {
        Row: {
          agendada_para: string
          atualizada_em: string
          codigo_publico: string
          contato_id: string | null
          criada_em: string
          dono: string
          duracao_minutos: number
          empresa_id: string
          encerrada_em: string | null
          id: string
          iniciada_em: string | null
          live_coach_ativo: boolean
          oportunidade_id: string
          provedor: string
          sala_provedor: string
          status: Database["public"]["Enums"]["calls_status"]
          tipo: Database["public"]["Enums"]["calls_tipo"]
          titulo: string
        }
        Insert: {
          agendada_para: string
          atualizada_em?: string
          codigo_publico?: string
          contato_id?: string | null
          criada_em?: string
          dono: string
          duracao_minutos?: number
          empresa_id: string
          encerrada_em?: string | null
          id?: string
          iniciada_em?: string | null
          live_coach_ativo?: boolean
          oportunidade_id: string
          provedor?: string
          sala_provedor?: string
          status?: Database["public"]["Enums"]["calls_status"]
          tipo?: Database["public"]["Enums"]["calls_tipo"]
          titulo: string
        }
        Update: {
          agendada_para?: string
          atualizada_em?: string
          codigo_publico?: string
          contato_id?: string | null
          criada_em?: string
          dono?: string
          duracao_minutos?: number
          empresa_id?: string
          encerrada_em?: string | null
          id?: string
          iniciada_em?: string | null
          live_coach_ativo?: boolean
          oportunidade_id?: string
          provedor?: string
          sala_provedor?: string
          status?: Database["public"]["Enums"]["calls_status"]
          tipo?: Database["public"]["Enums"]["calls_tipo"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_reunioes_contato_fk"
            columns: ["dono", "empresa_id", "contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "calls_reunioes_empresa_fk"
            columns: ["dono", "empresa_id"]
            isOneToOne: false
            referencedRelation: "crm_empresas"
            referencedColumns: ["dono", "id"]
          },
          {
            foreignKeyName: "calls_reunioes_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
        ]
      }
      calls_transcricoes: {
        Row: {
          atualizada_em: string
          criada_em: string
          dono: string
          duracao_segundos: number | null
          erro: string | null
          id: string
          idioma: string
          modelo: string | null
          provedor: string | null
          reuniao_id: string
          segmentos: Json
          status: string
          texto_completo: string | null
        }
        Insert: {
          atualizada_em?: string
          criada_em?: string
          dono: string
          duracao_segundos?: number | null
          erro?: string | null
          id?: string
          idioma?: string
          modelo?: string | null
          provedor?: string | null
          reuniao_id: string
          segmentos?: Json
          status?: string
          texto_completo?: string | null
        }
        Update: {
          atualizada_em?: string
          criada_em?: string
          dono?: string
          duracao_segundos?: number | null
          erro?: string | null
          id?: string
          idioma?: string
          modelo?: string | null
          provedor?: string | null
          reuniao_id?: string
          segmentos?: Json
          status?: string
          texto_completo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_transcricoes_reuniao_fk"
            columns: ["dono", "reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      consultor_mensagens: {
        Row: {
          cartoes: Json | null
          conteudo: string
          criado_em: string
          id: string
          papel: string
          thread_id: string
        }
        Insert: {
          cartoes?: Json | null
          conteudo: string
          criado_em?: string
          id?: string
          papel: string
          thread_id: string
        }
        Update: {
          cartoes?: Json | null
          conteudo?: string
          criado_em?: string
          id?: string
          papel?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultor_mensagens_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "consultor_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      consultor_threads: {
        Row: {
          atualizado_em: string
          criado_em: string
          dono: string
          id: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dono: string
          id?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dono?: string
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      consultor_uso: {
        Row: {
          atualizado_em: string
          dono: string
          mes: string
          tokens: number
        }
        Insert: {
          atualizado_em?: string
          dono: string
          mes: string
          tokens?: number
        }
        Update: {
          atualizado_em?: string
          dono?: string
          mes?: string
          tokens?: number
        }
        Relationships: []
      }
      crm_contatos: {
        Row: {
          atualizado_em: string
          cargo: string | null
          criado_em: string
          dono: string
          email: string | null
          empresa_id: string
          id: string
          linkedin_url: string | null
          nome: string
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          cargo?: string | null
          criado_em?: string
          dono: string
          email?: string | null
          empresa_id: string
          id?: string
          linkedin_url?: string | null
          nome: string
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          cargo?: string | null
          criado_em?: string
          dono?: string
          email?: string | null
          empresa_id?: string
          id?: string
          linkedin_url?: string | null
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contatos_empresa_fk"
            columns: ["dono", "empresa_id"]
            isOneToOne: false
            referencedRelation: "crm_empresas"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      crm_empresas: {
        Row: {
          atualizado_em: string
          cidade: string | null
          criado_em: string
          dominio: string | null
          dono: string
          enriquecido_em: string | null
          enriquecimento: Json
          estado: string | null
          id: string
          nome: string
          porte: string | null
          resumo: string | null
          setor: string | null
        }
        Insert: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          dominio?: string | null
          dono: string
          enriquecido_em?: string | null
          enriquecimento?: Json
          estado?: string | null
          id?: string
          nome: string
          porte?: string | null
          resumo?: string | null
          setor?: string | null
        }
        Update: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          dominio?: string | null
          dono?: string
          enriquecido_em?: string | null
          enriquecimento?: Json
          estado?: string | null
          id?: string
          nome?: string
          porte?: string | null
          resumo?: string | null
          setor?: string | null
        }
        Relationships: []
      }
      crm_eventos: {
        Row: {
          contato_id: string | null
          criado_em: string
          dados: Json
          descricao: string | null
          dono: string
          empresa_id: string
          fonte: string
          fonte_id: string | null
          id: string
          ocorrido_em: string
          oportunidade_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          contato_id?: string | null
          criado_em?: string
          dados?: Json
          descricao?: string | null
          dono: string
          empresa_id: string
          fonte?: string
          fonte_id?: string | null
          id?: string
          ocorrido_em?: string
          oportunidade_id: string
          tipo: string
          titulo: string
        }
        Update: {
          contato_id?: string | null
          criado_em?: string
          dados?: Json
          descricao?: string | null
          dono?: string
          empresa_id?: string
          fonte?: string
          fonte_id?: string | null
          id?: string
          ocorrido_em?: string
          oportunidade_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_eventos_contato_fk"
            columns: ["dono", "empresa_id", "contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "crm_eventos_empresa_fk"
            columns: ["dono", "empresa_id"]
            isOneToOne: false
            referencedRelation: "crm_empresas"
            referencedColumns: ["dono", "id"]
          },
          {
            foreignKeyName: "crm_eventos_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
        ]
      }
      crm_oportunidades: {
        Row: {
          atualizado_em: string
          contato_principal_id: string | null
          criado_em: string
          dono: string
          empresa_id: string
          etapa: Database["public"]["Enums"]["crm_etapa"]
          ganha_em: string | null
          id: string
          motivo_perda: string | null
          ordem: number
          origem: string
          perdida_em: string | null
          probabilidade: number | null
          proxima_acao: string | null
          proxima_acao_em: string | null
          titulo: string
          valor_centavos: number | null
        }
        Insert: {
          atualizado_em?: string
          contato_principal_id?: string | null
          criado_em?: string
          dono: string
          empresa_id: string
          etapa?: Database["public"]["Enums"]["crm_etapa"]
          ganha_em?: string | null
          id?: string
          motivo_perda?: string | null
          ordem?: number
          origem?: string
          perdida_em?: string | null
          probabilidade?: number | null
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          titulo: string
          valor_centavos?: number | null
        }
        Update: {
          atualizado_em?: string
          contato_principal_id?: string | null
          criado_em?: string
          dono?: string
          empresa_id?: string
          etapa?: Database["public"]["Enums"]["crm_etapa"]
          ganha_em?: string | null
          id?: string
          motivo_perda?: string | null
          ordem?: number
          origem?: string
          perdida_em?: string | null
          probabilidade?: number | null
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          titulo?: string
          valor_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_oportunidades_contato_fk"
            columns: ["dono", "empresa_id", "contato_principal_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "crm_oportunidades_empresa_fk"
            columns: ["dono", "empresa_id"]
            isOneToOne: false
            referencedRelation: "crm_empresas"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      formacoes: {
        Row: {
          atualizado_em: string
          capa_url: string | null
          criado_em: string
          criado_por: string | null
          id: string
          ordem: number
          publicado_em: string | null
          resumo: string
          slug: string
          status: Database["public"]["Enums"]["status_publicacao"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          capa_url?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          ordem?: number
          publicado_em?: string | null
          resumo?: string
          slug: string
          status?: Database["public"]["Enums"]["status_publicacao"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          capa_url?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          ordem?: number
          publicado_em?: string | null
          resumo?: string
          slug?: string
          status?: Database["public"]["Enums"]["status_publicacao"]
          titulo?: string
        }
        Relationships: []
      }
      mentores: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          foto_url: string | null
          headline: string
          id: string
          nome: string
          trilha: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          foto_url?: string | null
          headline?: string
          id?: string
          nome: string
          trilha: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          foto_url?: string | null
          headline?: string
          id?: string
          nome?: string
          trilha?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      mentoria_inscricoes: {
        Row: {
          criado_em: string
          mentoria_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          mentoria_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          mentoria_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentoria_inscricoes_mentoria_id_fkey"
            columns: ["mentoria_id"]
            isOneToOne: false
            referencedRelation: "mentorias"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorias: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          descricao: string
          fim: string
          id: string
          inicio: string
          mentor_id: string
          sala_url: string | null
          status: Database["public"]["Enums"]["status_publicacao"]
          titulo: string
          vagas: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string
          fim: string
          id?: string
          inicio: string
          mentor_id: string
          sala_url?: string | null
          status?: Database["public"]["Enums"]["status_publicacao"]
          titulo: string
          vagas?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string
          fim?: string
          id?: string
          inicio?: string
          mentor_id?: string
          sala_url?: string | null
          status?: Database["public"]["Enums"]["status_publicacao"]
          titulo?: string
          vagas?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentorias_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentores"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          criado_em: string
          formacao_id: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          criado_em?: string
          formacao_id: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          criado_em?: string
          formacao_id?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_formacao_id_fkey"
            columns: ["formacao_id"]
            isOneToOne: false
            referencedRelation: "formacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          atualizado_em: string
          avatar_url: string | null
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          atualizado_em?: string
          avatar_url?: string | null
          criado_em?: string
          id: string
          nome?: string
        }
        Update: {
          atualizado_em?: string
          avatar_url?: string | null
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      solucao_itens: {
        Row: {
          conteudo: string
          id: string
          ordem: number
          solucao_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          conteudo?: string
          id?: string
          ordem?: number
          solucao_id: string
          tipo: string
          titulo: string
        }
        Update: {
          conteudo?: string
          id?: string
          ordem?: number
          solucao_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "solucao_itens_solucao_id_fkey"
            columns: ["solucao_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      solucoes: {
        Row: {
          atualizado_em: string
          capa_url: string | null
          categoria: string | null
          criado_em: string
          criado_por: string | null
          id: string
          ordem: number
          publicado_em: string | null
          resumo: string
          slug: string
          status: Database["public"]["Enums"]["status_publicacao"]
          titulo: string
          video_url: string | null
        }
        Insert: {
          atualizado_em?: string
          capa_url?: string | null
          categoria?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          ordem?: number
          publicado_em?: string | null
          resumo?: string
          slug: string
          status?: Database["public"]["Enums"]["status_publicacao"]
          titulo: string
          video_url?: string | null
        }
        Update: {
          atualizado_em?: string
          capa_url?: string | null
          categoria?: string | null
          criado_em?: string
          criado_por?: string | null
          id?: string
          ordem?: number
          publicado_em?: string | null
          resumo?: string
          slug?: string
          status?: Database["public"]["Enums"]["status_publicacao"]
          titulo?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calls_agendar_reuniao: {
        Args: {
          p_agendada_para: string
          p_duracao_minutos?: number
          p_live_coach_ativo?: boolean
          p_oportunidade: string
          p_tipo: Database["public"]["Enums"]["calls_tipo"]
          p_titulo?: string
        }
        Returns: {
          codigo_publico: string
          reuniao_id: string
        }[]
      }
      crm_criar_lead: {
        Args: {
          p_contato_email?: string
          p_contato_nome: string
          p_empresa_nome: string
          p_oportunidade_titulo?: string
        }
        Returns: string
      }
      crm_mover_oportunidade: {
        Args: {
          p_etapa: Database["public"]["Enums"]["crm_etapa"]
          p_oportunidade: string
        }
        Returns: boolean
      }
      mentoria_ocupacao: {
        Args: { _ids: string[] }
        Returns: {
          inscritos: number
          mentoria_id: string
        }[]
      }
    }
    Enums: {
      calls_status:
        | "agendada"
        | "aguardando"
        | "ao_vivo"
        | "processando"
        | "concluida"
        | "cancelada"
      calls_tipo:
        | "descoberta"
        | "follow_up"
        | "proposta"
        | "kickoff"
        | "entrega"
        | "outro"
      crm_etapa:
        | "novo_lead"
        | "qualificacao"
        | "descoberta"
        | "proposta"
        | "negociacao"
        | "ganho"
        | "perdido"
      estado_tarefa: "a_fazer" | "fazendo" | "feito"
      papel_usuario: "membro" | "mentor" | "admin"
      status_builder: "rascunho" | "gerando" | "pronta" | "falhou"
      status_publicacao: "rascunho" | "publicado" | "arquivado"
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
      calls_status: [
        "agendada",
        "aguardando",
        "ao_vivo",
        "processando",
        "concluida",
        "cancelada",
      ],
      calls_tipo: [
        "descoberta",
        "follow_up",
        "proposta",
        "kickoff",
        "entrega",
        "outro",
      ],
      crm_etapa: [
        "novo_lead",
        "qualificacao",
        "descoberta",
        "proposta",
        "negociacao",
        "ganho",
        "perdido",
      ],
      estado_tarefa: ["a_fazer", "fazendo", "feito"],
      papel_usuario: ["membro", "mentor", "admin"],
      status_builder: ["rascunho", "gerando", "pronta", "falhou"],
      status_publicacao: ["rascunho", "publicado", "arquivado"],
    },
  },
} as const
