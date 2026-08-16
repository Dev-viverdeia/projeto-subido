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
          oportunidade_id: string | null
          projeto_base_id: string | null
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
          oportunidade_id?: string | null
          projeto_base_id?: string | null
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
          oportunidade_id?: string | null
          projeto_base_id?: string | null
          respostas?: Json
          stack?: string | null
          status?: Database["public"]["Enums"]["status_builder"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_solucoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_solucoes_projeto_base_id_fkey"
            columns: ["projeto_base_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
        ]
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
          dados: Json
          dono: string
          id: string
          metodologia: string | null
          origem_item_id: string | null
          prioridade: number
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
          dados?: Json
          dono: string
          id?: string
          metodologia?: string | null
          origem_item_id?: string | null
          prioridade?: number
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
          dados?: Json
          dono?: string
          id?: string
          metodologia?: string | null
          origem_item_id?: string | null
          prioridade?: number
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
          mime_type: string
          reuniao_id: string
          status: string
          tamanho_bytes: number | null
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
          mime_type?: string
          reuniao_id: string
          status?: string
          tamanho_bytes?: number | null
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
          mime_type?: string
          reuniao_id?: string
          status?: string
          tamanho_bytes?: number | null
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
          direcao: Json | null
          id: string
          modelo: string | null
          papel: string
          thread_id: string
        }
        Insert: {
          cartoes?: Json | null
          conteudo: string
          criado_em?: string
          direcao?: Json | null
          id?: string
          modelo?: string | null
          papel: string
          thread_id: string
        }
        Update: {
          cartoes?: Json | null
          conteudo?: string
          criado_em?: string
          direcao?: Json | null
          id?: string
          modelo?: string | null
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
      crm_enriquecimentos: {
        Row: {
          atualizado_em: string
          concluido_em: string | null
          contato_id: string | null
          contexto: string | null
          dominio: string | null
          dono: string
          empresa_id: string
          erro: string | null
          fontes: Json
          id: string
          iniciado_em: string | null
          linkedin_url: string | null
          modelo: string | null
          oportunidade_id: string
          resultado: Json | null
          solicitado_em: string
          status: Database["public"]["Enums"]["crm_enriquecimento_status"]
        }
        Insert: {
          atualizado_em?: string
          concluido_em?: string | null
          contato_id?: string | null
          contexto?: string | null
          dominio?: string | null
          dono: string
          empresa_id: string
          erro?: string | null
          fontes?: Json
          id?: string
          iniciado_em?: string | null
          linkedin_url?: string | null
          modelo?: string | null
          oportunidade_id: string
          resultado?: Json | null
          solicitado_em?: string
          status?: Database["public"]["Enums"]["crm_enriquecimento_status"]
        }
        Update: {
          atualizado_em?: string
          concluido_em?: string | null
          contato_id?: string | null
          contexto?: string | null
          dominio?: string | null
          dono?: string
          empresa_id?: string
          erro?: string | null
          fontes?: Json
          id?: string
          iniciado_em?: string | null
          linkedin_url?: string | null
          modelo?: string | null
          oportunidade_id?: string
          resultado?: Json | null
          solicitado_em?: string
          status?: Database["public"]["Enums"]["crm_enriquecimento_status"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_enriquecimentos_contato_fk"
            columns: ["dono", "empresa_id", "contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "crm_enriquecimentos_empresa_fk"
            columns: ["dono", "empresa_id"]
            isOneToOne: false
            referencedRelation: "crm_empresas"
            referencedColumns: ["dono", "id"]
          },
          {
            foreignKeyName: "crm_enriquecimentos_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
        ]
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
      diagnosticos_atendimento: {
        Row: {
          atualizado_em: string
          canal: Database["public"]["Enums"]["diagnostico_atendimento_canal"]
          cenario: string
          concluido_em: string | null
          confirmou_autorizacao: boolean
          contato_id: string | null
          dono: string
          empresa_id: string
          erro: string | null
          evidencia_informada: string | null
          fontes: Json
          id: string
          iniciado_em: string | null
          modelo: string | null
          nota_geral: number | null
          oportunidade_id: string
          resposta_id: string | null
          resultado: Json | null
          site_url: string | null
          solicitado_em: string
          status: Database["public"]["Enums"]["diagnostico_atendimento_status"]
        }
        Insert: {
          atualizado_em?: string
          canal: Database["public"]["Enums"]["diagnostico_atendimento_canal"]
          cenario: string
          concluido_em?: string | null
          confirmou_autorizacao?: boolean
          contato_id?: string | null
          dono: string
          empresa_id: string
          erro?: string | null
          evidencia_informada?: string | null
          fontes?: Json
          id?: string
          iniciado_em?: string | null
          modelo?: string | null
          nota_geral?: number | null
          oportunidade_id: string
          resposta_id?: string | null
          resultado?: Json | null
          site_url?: string | null
          solicitado_em?: string
          status?: Database["public"]["Enums"]["diagnostico_atendimento_status"]
        }
        Update: {
          atualizado_em?: string
          canal?: Database["public"]["Enums"]["diagnostico_atendimento_canal"]
          cenario?: string
          concluido_em?: string | null
          confirmou_autorizacao?: boolean
          contato_id?: string | null
          dono?: string
          empresa_id?: string
          erro?: string | null
          evidencia_informada?: string | null
          fontes?: Json
          id?: string
          iniciado_em?: string | null
          modelo?: string | null
          nota_geral?: number | null
          oportunidade_id?: string
          resposta_id?: string | null
          resultado?: Json | null
          site_url?: string | null
          solicitado_em?: string
          status?: Database["public"]["Enums"]["diagnostico_atendimento_status"]
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_atendimento_contato_fk"
            columns: ["dono", "empresa_id", "contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "diagnosticos_atendimento_empresa_fk"
            columns: ["dono", "empresa_id"]
            isOneToOne: false
            referencedRelation: "crm_empresas"
            referencedColumns: ["dono", "id"]
          },
          {
            foreignKeyName: "diagnosticos_atendimento_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
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
      jornada_perfis: {
        Row: {
          atualizado_em: string
          criado_em: string
          dono: string
          nicho: string
          posicionamento: string
          projeto_inicial_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dono: string
          nicho: string
          posicionamento: string
          projeto_inicial_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dono?: string
          nicho?: string
          posicionamento?: string
          projeto_inicial_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jornada_perfis_projeto_inicial_id_fkey"
            columns: ["projeto_inicial_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
        ]
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
      progresso_aulas: {
        Row: {
          aula_id: string
          concluida_em: string
          dono: string
        }
        Insert: {
          aula_id: string
          concluida_em?: string
          dono: string
        }
        Update: {
          aula_id?: string
          concluida_em?: string
          dono?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_etapas: {
        Row: {
          concluida_em: string
          dono: string
          etapa_chave: string
          projeto_id: string
        }
        Insert: {
          concluida_em?: string
          dono: string
          etapa_chave: string
          projeto_id: string
        }
        Update: {
          concluida_em?: string
          dono?: string
          etapa_chave?: string
          projeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_etapas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_formacoes: {
        Row: {
          dono: string
          formacao_id: string
          ultimo_acesso_em: string
        }
        Insert: {
          dono: string
          formacao_id: string
          ultimo_acesso_em?: string
        }
        Update: {
          dono?: string
          formacao_id?: string
          ultimo_acesso_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_formacoes_formacao_id_fkey"
            columns: ["formacao_id"]
            isOneToOne: false
            referencedRelation: "formacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_projetos: {
        Row: {
          dono: string
          projeto_id: string
          ultimo_acesso_em: string
        }
        Insert: {
          dono: string
          projeto_id: string
          ultimo_acesso_em?: string
        }
        Update: {
          dono?: string
          projeto_id?: string
          ultimo_acesso_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_projetos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_acoes: {
        Row: {
          atualizado_em: string
          categoria: string
          chave_origem: string
          concluida_em: string | null
          criado_em: string
          dono: string
          empresa_id: string
          id: string
          oportunidade_id: string
          origem: string
          prazo_em: string | null
          projeto_execucao_id: string | null
          reuniao_id: string | null
          status: Database["public"]["Enums"]["projeto_acao_status"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          categoria?: string
          chave_origem?: string
          concluida_em?: string | null
          criado_em?: string
          dono: string
          empresa_id: string
          id?: string
          oportunidade_id: string
          origem?: string
          prazo_em?: string | null
          projeto_execucao_id?: string | null
          reuniao_id?: string | null
          status?: Database["public"]["Enums"]["projeto_acao_status"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          categoria?: string
          chave_origem?: string
          concluida_em?: string | null
          criado_em?: string
          dono?: string
          empresa_id?: string
          id?: string
          oportunidade_id?: string
          origem?: string
          prazo_em?: string | null
          projeto_execucao_id?: string | null
          reuniao_id?: string | null
          status?: Database["public"]["Enums"]["projeto_acao_status"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_acoes_execucao_fk"
            columns: ["dono", "projeto_execucao_id"]
            isOneToOne: false
            referencedRelation: "projetos_execucao"
            referencedColumns: ["dono", "id"]
          },
          {
            foreignKeyName: "projeto_acoes_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "projeto_acoes_reuniao_fk"
            columns: ["dono", "reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      projeto_arquivos: {
        Row: {
          caminho_storage: string
          criado_em: string
          descricao: string | null
          dono: string
          grupo_id: string
          id: string
          mime_type: string
          nome_original: string
          projeto_execucao_id: string
          publicado_em: string | null
          tamanho_bytes: number
          tarefa_id: string | null
          titulo: string
          versao: number
          visivel_cliente: boolean
        }
        Insert: {
          caminho_storage: string
          criado_em?: string
          descricao?: string | null
          dono: string
          grupo_id: string
          id?: string
          mime_type: string
          nome_original: string
          projeto_execucao_id: string
          publicado_em?: string | null
          tamanho_bytes: number
          tarefa_id?: string | null
          titulo: string
          versao: number
          visivel_cliente?: boolean
        }
        Update: {
          caminho_storage?: string
          criado_em?: string
          descricao?: string | null
          dono?: string
          grupo_id?: string
          id?: string
          mime_type?: string
          nome_original?: string
          projeto_execucao_id?: string
          publicado_em?: string | null
          tamanho_bytes?: number
          tarefa_id?: string | null
          titulo?: string
          versao?: number
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "projeto_arquivos_projeto_fk"
            columns: ["dono", "projeto_execucao_id"]
            isOneToOne: false
            referencedRelation: "projetos_execucao"
            referencedColumns: ["dono", "id"]
          },
          {
            foreignKeyName: "projeto_arquivos_tarefa_fk"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "projeto_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_portal_eventos: {
        Row: {
          autor: string
          comentario: string | null
          criado_em: string
          dono: string
          id: string
          projeto_execucao_id: string
          tarefa_id: string | null
          tipo: string
        }
        Insert: {
          autor: string
          comentario?: string | null
          criado_em?: string
          dono: string
          id?: string
          projeto_execucao_id: string
          tarefa_id?: string | null
          tipo: string
        }
        Update: {
          autor?: string
          comentario?: string | null
          criado_em?: string
          dono?: string
          id?: string
          projeto_execucao_id?: string
          tarefa_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_portal_eventos_projeto_execucao_id_fkey"
            columns: ["projeto_execucao_id"]
            isOneToOne: false
            referencedRelation: "projetos_execucao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_portal_eventos_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "projeto_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_roteiros: {
        Row: {
          atualizado_em: string
          cliente_ideal: string
          criado_em: string
          entregavel_final: string
          projeto_id: string
          resultado: string
          roteiro: Json
          versao: number
        }
        Insert: {
          atualizado_em?: string
          cliente_ideal: string
          criado_em?: string
          entregavel_final: string
          projeto_id: string
          resultado: string
          roteiro: Json
          versao?: number
        }
        Update: {
          atualizado_em?: string
          cliente_ideal?: string
          criado_em?: string
          entregavel_final?: string
          projeto_id?: string
          resultado?: string
          roteiro?: Json
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "projeto_roteiros_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_tarefas: {
        Row: {
          acao: string
          atualizado_em: string
          cliente_comentario: string | null
          cliente_nota: string | null
          cliente_respondido_em: string | null
          cliente_solicitado_em: string | null
          cliente_status: Database["public"]["Enums"]["projeto_cliente_status"]
          concluida_em: string | null
          concluido_quando: string
          criado_em: string
          dono: string
          entregavel: string
          entregavel_url: string | null
          evidencia: string | null
          evidencia_em: string | null
          fase_id: string
          fase_titulo: string
          id: string
          ordem: number
          passo_id: string
          projeto_execucao_id: string
          status: Database["public"]["Enums"]["projeto_tarefa_status"]
          titulo: string
        }
        Insert: {
          acao: string
          atualizado_em?: string
          cliente_comentario?: string | null
          cliente_nota?: string | null
          cliente_respondido_em?: string | null
          cliente_solicitado_em?: string | null
          cliente_status?: Database["public"]["Enums"]["projeto_cliente_status"]
          concluida_em?: string | null
          concluido_quando: string
          criado_em?: string
          dono: string
          entregavel: string
          entregavel_url?: string | null
          evidencia?: string | null
          evidencia_em?: string | null
          fase_id: string
          fase_titulo: string
          id?: string
          ordem: number
          passo_id: string
          projeto_execucao_id: string
          status?: Database["public"]["Enums"]["projeto_tarefa_status"]
          titulo: string
        }
        Update: {
          acao?: string
          atualizado_em?: string
          cliente_comentario?: string | null
          cliente_nota?: string | null
          cliente_respondido_em?: string | null
          cliente_solicitado_em?: string | null
          cliente_status?: Database["public"]["Enums"]["projeto_cliente_status"]
          concluida_em?: string | null
          concluido_quando?: string
          criado_em?: string
          dono?: string
          entregavel?: string
          entregavel_url?: string | null
          evidencia?: string | null
          evidencia_em?: string | null
          fase_id?: string
          fase_titulo?: string
          id?: string
          ordem?: number
          passo_id?: string
          projeto_execucao_id?: string
          status?: Database["public"]["Enums"]["projeto_tarefa_status"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_tarefas_projeto_fk"
            columns: ["dono", "projeto_execucao_id"]
            isOneToOne: false
            referencedRelation: "projetos_execucao"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      projetos_execucao: {
        Row: {
          atualizado_em: string
          briefing_kickoff: Json | null
          builder_solucao_id: string | null
          concluido_em: string | null
          criado_em: string
          documento: Json
          dono: string
          empresa_id: string
          id: string
          inicio_em: string
          oportunidade_id: string
          portal_ativado_em: string | null
          portal_ativo: boolean
          portal_codigo: string
          prazo_em: string | null
          projeto_id: string | null
          proposta_id: string
          status: Database["public"]["Enums"]["projeto_execucao_status"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          briefing_kickoff?: Json | null
          builder_solucao_id?: string | null
          concluido_em?: string | null
          criado_em?: string
          documento: Json
          dono: string
          empresa_id: string
          id?: string
          inicio_em?: string
          oportunidade_id: string
          portal_ativado_em?: string | null
          portal_ativo?: boolean
          portal_codigo?: string
          prazo_em?: string | null
          projeto_id?: string | null
          proposta_id: string
          status?: Database["public"]["Enums"]["projeto_execucao_status"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          briefing_kickoff?: Json | null
          builder_solucao_id?: string | null
          concluido_em?: string | null
          criado_em?: string
          documento?: Json
          dono?: string
          empresa_id?: string
          id?: string
          inicio_em?: string
          oportunidade_id?: string
          portal_ativado_em?: string | null
          portal_ativo?: boolean
          portal_codigo?: string
          prazo_em?: string | null
          projeto_id?: string | null
          proposta_id?: string
          status?: Database["public"]["Enums"]["projeto_execucao_status"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_execucao_builder_solucao_id_fkey"
            columns: ["builder_solucao_id"]
            isOneToOne: false
            referencedRelation: "builder_solucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_execucao_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "projetos_execucao_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_execucao_proposta_fk"
            columns: ["dono", "proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      proposta_portal_eventos: {
        Row: {
          comentario: string | null
          criado_em: string
          dono: string
          email: string | null
          id: string
          nome: string | null
          proposta_id: string
          tipo: string
        }
        Insert: {
          comentario?: string | null
          criado_em?: string
          dono: string
          email?: string | null
          id?: string
          nome?: string | null
          proposta_id: string
          tipo: string
        }
        Update: {
          comentario?: string | null
          criado_em?: string
          dono?: string
          email?: string | null
          id?: string
          nome?: string | null
          proposta_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposta_portal_eventos_proposta_fk"
            columns: ["dono", "proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["dono", "id"]
          },
        ]
      }
      propostas: {
        Row: {
          aceita_em: string | null
          apresentada_em: string | null
          atualizado_em: string
          builder_solucao_id: string | null
          compartilhada_em: string | null
          compartilhamento_ativo: boolean
          compartilhamento_codigo: string | null
          criado_em: string
          decidida_em: string | null
          decisao_comentario: string | null
          decisao_email: string | null
          decisao_nome: string | null
          documento: Json
          dono: string
          empresa_id: string
          id: string
          oportunidade_id: string
          primeira_visualizacao_em: string | null
          projeto_id: string | null
          recusada_em: string | null
          reuniao_id: string | null
          status: Database["public"]["Enums"]["proposta_status"]
          titulo: string
          ultima_visualizacao_em: string | null
          versao: number
          visualizacoes: number
        }
        Insert: {
          aceita_em?: string | null
          apresentada_em?: string | null
          atualizado_em?: string
          builder_solucao_id?: string | null
          compartilhada_em?: string | null
          compartilhamento_ativo?: boolean
          compartilhamento_codigo?: string | null
          criado_em?: string
          decidida_em?: string | null
          decisao_comentario?: string | null
          decisao_email?: string | null
          decisao_nome?: string | null
          documento: Json
          dono: string
          empresa_id: string
          id?: string
          oportunidade_id: string
          primeira_visualizacao_em?: string | null
          projeto_id?: string | null
          recusada_em?: string | null
          reuniao_id?: string | null
          status?: Database["public"]["Enums"]["proposta_status"]
          titulo: string
          ultima_visualizacao_em?: string | null
          versao?: number
          visualizacoes?: number
        }
        Update: {
          aceita_em?: string | null
          apresentada_em?: string | null
          atualizado_em?: string
          builder_solucao_id?: string | null
          compartilhada_em?: string | null
          compartilhamento_ativo?: boolean
          compartilhamento_codigo?: string | null
          criado_em?: string
          decidida_em?: string | null
          decisao_comentario?: string | null
          decisao_email?: string | null
          decisao_nome?: string | null
          documento?: Json
          dono?: string
          empresa_id?: string
          id?: string
          oportunidade_id?: string
          primeira_visualizacao_em?: string | null
          projeto_id?: string | null
          recusada_em?: string | null
          reuniao_id?: string | null
          status?: Database["public"]["Enums"]["proposta_status"]
          titulo?: string
          ultima_visualizacao_em?: string | null
          versao?: number
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_builder_solucao_id_fkey"
            columns: ["builder_solucao_id"]
            isOneToOne: false
            referencedRelation: "builder_solucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_oportunidade_fk"
            columns: ["dono", "empresa_id", "oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["dono", "empresa_id", "id"]
          },
          {
            foreignKeyName: "propostas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "solucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "calls_reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      sobral_acoes_crm: {
        Row: {
          acao: string
          atualizado_em: string
          concluida_em: string | null
          confirmada_em: string
          dono: string
          mensagem_id: string
          oportunidade_id: string
          quando: string | null
          status: string
        }
        Insert: {
          acao: string
          atualizado_em?: string
          concluida_em?: string | null
          confirmada_em?: string
          dono: string
          mensagem_id: string
          oportunidade_id: string
          quando?: string | null
          status?: string
        }
        Update: {
          acao?: string
          atualizado_em?: string
          concluida_em?: string | null
          confirmada_em?: string
          dono?: string
          mensagem_id?: string
          oportunidade_id?: string
          quando?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sobral_acoes_crm_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: true
            referencedRelation: "consultor_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sobral_acoes_crm_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      sobral_acoes_crm_eventos: {
        Row: {
          acao_anterior: string | null
          acao_nova: string
          criado_em: string
          dono: string
          id: string
          mensagem_id: string
          quando_anterior: string | null
          quando_novo: string | null
          tipo: string
        }
        Insert: {
          acao_anterior?: string | null
          acao_nova: string
          criado_em?: string
          dono: string
          id?: string
          mensagem_id: string
          quando_anterior?: string | null
          quando_novo?: string | null
          tipo: string
        }
        Update: {
          acao_anterior?: string | null
          acao_nova?: string
          criado_em?: string
          dono?: string
          id?: string
          mensagem_id?: string
          quando_anterior?: string | null
          quando_novo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sobral_acoes_crm_eventos_acao_fk"
            columns: ["dono", "mensagem_id"]
            isOneToOne: false
            referencedRelation: "sobral_acoes_crm"
            referencedColumns: ["dono", "mensagem_id"]
          },
        ]
      }
      sobral_planos: {
        Row: {
          acoes: Json
          atualizado_em: string
          contexto_hash: string
          diagnostico: string
          dono: string
          etapa: Database["public"]["Enums"]["sobral_etapa"]
          foco: string
          gerado_em: string
          modelo: string
          proximo_passo: Json
          sinais: Json
        }
        Insert: {
          acoes: Json
          atualizado_em?: string
          contexto_hash: string
          diagnostico: string
          dono: string
          etapa: Database["public"]["Enums"]["sobral_etapa"]
          foco: string
          gerado_em?: string
          modelo: string
          proximo_passo: Json
          sinais?: Json
        }
        Update: {
          acoes?: Json
          atualizado_em?: string
          contexto_hash?: string
          diagnostico?: string
          dono?: string
          etapa?: Database["public"]["Enums"]["sobral_etapa"]
          foco?: string
          gerado_em?: string
          modelo?: string
          proximo_passo?: Json
          sinais?: Json
        }
        Relationships: []
      }
      sobral_recomendacoes_crm: {
        Row: {
          acao: string
          atualizado_em: string
          confirmada_em: string | null
          contexto_hash: string
          dono: string
          fatos: Json
          gerada_em: string
          mensagem_id: string
          modelo: string
          motivo: string
          oportunidade_id: string
          quando: string | null
          resposta_id: string | null
          status: string
        }
        Insert: {
          acao: string
          atualizado_em?: string
          confirmada_em?: string | null
          contexto_hash: string
          dono: string
          fatos?: Json
          gerada_em?: string
          mensagem_id: string
          modelo: string
          motivo: string
          oportunidade_id: string
          quando?: string | null
          resposta_id?: string | null
          status?: string
        }
        Update: {
          acao?: string
          atualizado_em?: string
          confirmada_em?: string | null
          contexto_hash?: string
          dono?: string
          fatos?: Json
          gerada_em?: string
          mensagem_id?: string
          modelo?: string
          motivo?: string
          oportunidade_id?: string
          quando?: string | null
          resposta_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sobral_recomendacoes_crm_acao_fk"
            columns: ["dono", "mensagem_id"]
            isOneToOne: false
            referencedRelation: "sobral_acoes_crm"
            referencedColumns: ["dono", "mensagem_id"]
          },
          {
            foreignKeyName: "sobral_recomendacoes_crm_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
        ]
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
      calls_aplicar_plano: {
        Args: {
          p_acao: string
          p_compromissos?: string[]
          p_etapa?: Database["public"]["Enums"]["crm_etapa"]
          p_quando?: string
          p_reuniao: string
        }
        Returns: Json
      }
      calls_aplicar_proxima_acao: {
        Args: { p_acao: string; p_quando?: string; p_reuniao: string }
        Returns: boolean
      }
      calls_reivindicar_analise: {
        Args: { p_dono: string; p_reuniao: string }
        Returns: boolean
      }
      crm_aplicar_proxima_acao: {
        Args: { p_enriquecimento: string; p_oportunidade: string }
        Returns: boolean
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
      crm_iniciar_enriquecimento: {
        Args: {
          p_contexto?: string
          p_dominio?: string
          p_linkedin_url?: string
          p_oportunidade: string
        }
        Returns: string
      }
      crm_iniciar_novo_ciclo: {
        Args: { p_oportunidade: string }
        Returns: string
      }
      crm_mover_oportunidade: {
        Args: {
          p_etapa: Database["public"]["Enums"]["crm_etapa"]
          p_oportunidade: string
        }
        Returns: boolean
      }
      diagnostico_aplicar_proxima_acao: {
        Args: { p_diagnostico: string }
        Returns: boolean
      }
      diagnostico_iniciar: {
        Args: {
          p_canal: Database["public"]["Enums"]["diagnostico_atendimento_canal"]
          p_cenario: string
          p_confirmou_autorizacao?: boolean
          p_evidencia?: string
          p_oportunidade: string
          p_site_url: string
        }
        Returns: string
      }
      mentoria_ocupacao: {
        Args: { _ids: string[] }
        Returns: {
          inscritos: number
          mentoria_id: string
        }[]
      }
      progresso_conta_snapshot: {
        Args: never
        Returns: {
          aulas: Json
          etapas: Json
          formacoes: Json
          solucoes: Json
        }[]
      }
      projeto_arquivo_definir_visibilidade: {
        Args: { p_arquivo_id: string; p_visivel: boolean }
        Returns: boolean
      }
      projeto_arquivo_registrar: {
        Args: {
          p_caminho_storage: string
          p_descricao: string
          p_grupo_id: string
          p_mime_type: string
          p_nome_original: string
          p_projeto_id: string
          p_tamanho_bytes: number
          p_tarefa_id: string
          p_titulo: string
        }
        Returns: {
          caminho_storage: string
          criado_em: string
          descricao: string | null
          dono: string
          grupo_id: string
          id: string
          mime_type: string
          nome_original: string
          projeto_execucao_id: string
          publicado_em: string | null
          tamanho_bytes: number
          tarefa_id: string | null
          titulo: string
          versao: number
          visivel_cliente: boolean
        }
        SetofOptions: {
          from: "*"
          to: "projeto_arquivos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      projeto_iniciar: { Args: { p_proposta_id: string }; Returns: string }
      projeto_portal_decidir: {
        Args: {
          p_codigo: string
          p_comentario?: string
          p_decisao: Database["public"]["Enums"]["projeto_cliente_status"]
          p_tarefa_id: string
        }
        Returns: boolean
      }
      proposta_portal_decidir: {
        Args: {
          p_codigo: string
          p_comentario?: string
          p_decisao: Database["public"]["Enums"]["proposta_status"]
          p_email: string
          p_nome: string
        }
        Returns: Json
      }
      proposta_portal_visualizar: {
        Args: { p_codigo: string }
        Returns: boolean
      }
      registrar_uso_sobral: {
        Args: { p_dono: string; p_mes: string; p_tokens: number }
        Returns: number
      }
      sobral_confirmar_acao_crm: {
        Args: { p_acao: string; p_mensagem: string; p_quando?: string }
        Returns: boolean
      }
      sobral_confirmar_recomendacao_crm: {
        Args: { p_acao: string; p_mensagem: string; p_quando?: string }
        Returns: string
      }
      sobral_gerenciar_acao_crm: {
        Args: {
          p_acao?: string
          p_mensagem: string
          p_operacao: string
          p_quando?: string
        }
        Returns: string
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
      crm_enriquecimento_status:
        | "na_fila"
        | "processando"
        | "concluido"
        | "falhou"
      crm_etapa:
        | "novo_lead"
        | "qualificacao"
        | "descoberta"
        | "proposta"
        | "negociacao"
        | "ganho"
        | "perdido"
      diagnostico_atendimento_canal:
        | "site"
        | "whatsapp"
        | "instagram"
        | "chat"
        | "email"
        | "telefone"
        | "outro"
      diagnostico_atendimento_status:
        | "na_fila"
        | "processando"
        | "concluido"
        | "falhou"
      estado_tarefa: "a_fazer" | "fazendo" | "feito"
      papel_usuario: "membro" | "mentor" | "admin"
      projeto_acao_status: "pendente" | "concluida" | "cancelada"
      projeto_cliente_status:
        | "nao_solicitada"
        | "aguardando"
        | "aprovada"
        | "ajustes"
      projeto_execucao_status:
        | "planejamento"
        | "em_execucao"
        | "em_validacao"
        | "concluido"
        | "pausado"
      projeto_tarefa_status:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "bloqueada"
      proposta_status:
        | "rascunho"
        | "pronta"
        | "apresentada"
        | "aceita"
        | "recusada"
      sobral_etapa:
        | "aprender"
        | "prospectar"
        | "vender"
        | "entregar"
        | "evoluir"
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
      crm_enriquecimento_status: [
        "na_fila",
        "processando",
        "concluido",
        "falhou",
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
      diagnostico_atendimento_canal: [
        "site",
        "whatsapp",
        "instagram",
        "chat",
        "email",
        "telefone",
        "outro",
      ],
      diagnostico_atendimento_status: [
        "na_fila",
        "processando",
        "concluido",
        "falhou",
      ],
      estado_tarefa: ["a_fazer", "fazendo", "feito"],
      papel_usuario: ["membro", "mentor", "admin"],
      projeto_acao_status: ["pendente", "concluida", "cancelada"],
      projeto_cliente_status: [
        "nao_solicitada",
        "aguardando",
        "aprovada",
        "ajustes",
      ],
      projeto_execucao_status: [
        "planejamento",
        "em_execucao",
        "em_validacao",
        "concluido",
        "pausado",
      ],
      projeto_tarefa_status: [
        "pendente",
        "em_andamento",
        "concluida",
        "bloqueada",
      ],
      proposta_status: [
        "rascunho",
        "pronta",
        "apresentada",
        "aceita",
        "recusada",
      ],
      sobral_etapa: ["aprender", "prospectar", "vender", "entregar", "evoluir"],
      status_builder: ["rascunho", "gerando", "pronta", "falhou"],
      status_publicacao: ["rascunho", "publicado", "arquivado"],
    },
  },
} as const
