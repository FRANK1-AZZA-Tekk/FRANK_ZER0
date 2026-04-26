import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Activity, 
  Bell, 
  Search, 
  Settings,
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Layers,
  Terminal,
  Brain,
  Microscope,
  Lock,
  CheckSquare,
  Network
} from 'lucide-react';

export interface NavItemConfig {
  to: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  category?: string;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { 
    to: '/dashboard', 
    icon: <LayoutDashboard size={20} />, 
    label: 'DASHBOARD', 
    tooltip: 'Painel de Controle Principal',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/hardware', 
    icon: <Activity size={20} />, 
    label: 'HARDWARE', 
    tooltip: 'Malha ESP32-S3 e T-Watch',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/memory', 
    icon: <Database size={20} />, 
    label: 'MEMÓRIA', 
    tooltip: 'Vetores LanceDB & ChromaDB',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/router', 
    icon: <Network size={20} />, 
    label: 'ROTEADOR_SWARM', 
    tooltip: 'LiteLLM / Groq / DeepSeek',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/research', 
    icon: <Search size={20} />, 
    label: 'PESQUISA', 
    tooltip: 'Inteligência da Deep Web',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/tasks', 
    icon: <CheckSquare size={20} />, 
    label: 'TAREFAS', 
    tooltip: 'Gestão de Tarefas',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/nudges', 
    icon: <Bell size={20} />, 
    label: 'NOTIFICAÇÕES', 
    tooltip: 'Alertas Ativos',
    category: 'NÚCLEO_SISTEMA'
  },
  { 
    to: '/evolution', 
    icon: <Zap size={20} />, 
    label: 'EVOLUÇÃO', 
    tooltip: 'Auto-Limpeza e Varredura Profunda',
    category: 'NÚCLEO_SISTEMA'
  },
];

export const CONFIG_NAV_ITEMS: NavItemConfig[] = [
  { 
    to: '/settings', 
    icon: <Settings size={20} />, 
    label: 'COFRE', 
    tooltip: 'Configuração do Sistema',
    category: 'CONFIGURAÇÃO'
  },
];
