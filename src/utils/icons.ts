import { 
  Mic, 
  Activity, 
  Database, 
  Search, 
  Camera, 
  Bell, 
  Cpu, 
  Zap, 
  Shield, 
  Globe, 
  Lock, 
  Eye, 
  MessageSquare, 
  Cloud, 
  HardDrive,
  User,
  Settings,
  Star,
  Heart,
  Bot
} from 'lucide-react';
import React from 'react';

export const PREDEFINED_ICONS = {
  VOICE: Mic,
  GESTURE: Activity,
  CONTEXT: Database,
  RESEARCH: Search,
  VISION: Camera,
  NOTIFY: Bell,
  CPU: Cpu,
  ZAP: Zap,
  SHIELD: Shield,
  GLOBE: Globe,
  LOCK: Lock,
  EYE: Eye,
  MESSAGE: MessageSquare,
  CLOUD: Cloud,
  STORAGE: HardDrive,
  USER: User,
  SETTINGS: Settings,
  STAR: Star,
  HEART: Heart,
  BOT: Bot
};

export type IconName = keyof typeof PREDEFINED_ICONS;

export function getIconComponent(name: string | undefined, defaultIcon: React.ReactNode): React.ReactNode {
  if (!name || !(name in PREDEFINED_ICONS)) return defaultIcon;
  const Icon = PREDEFINED_ICONS[name as IconName];
  return React.createElement(Icon, { size: 16 });
}
