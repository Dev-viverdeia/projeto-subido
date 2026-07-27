/**
 * GERADO — não editar à mão.
 *
 * Fonte: projeto Supabase fopljjqxituhajzwjrjt (plataforma-subido-viverdeia).
 * Regerar com `npm run db:types`.
 *
 * ATENÇÃO: o CLI exige `supabase login` ou SUPABASE_ACCESS_TOKEN. Sem isso ele
 * escreve o JSON do erro POR CIMA deste arquivo em vez de falhar — o `>` do shell
 * trunca antes de o comando rodar. Confira o topo do arquivo antes de commitar.
 *
 * Ignorado por eslint e prettier (ver eslint.config.mjs e .prettierignore): a
 * integridade de um arquivo gerado é o comando que o gera, não o formatador.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
      [_ in never]: never
    }
    Enums: {
      papel_usuario: "membro" | "mentor" | "admin"
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
      papel_usuario: ["membro", "mentor", "admin"],
      status_publicacao: ["rascunho", "publicado", "arquivado"],
    },
  },
} as const
